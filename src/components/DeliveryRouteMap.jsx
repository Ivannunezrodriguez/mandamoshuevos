import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Módulo CSS de Leaflet esencial para que el mapa se vea bien

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom icon for the starting point (Warehouse)
const warehouseIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Cache for geocoded addresses to avoid hitting OpenStreetMap API rate limits
const geocodeCache = JSON.parse(localStorage.getItem('mandahuevos_geocode_cache') || '{}');

/**
 * COMPONENTE DE MAPA DE RUTAS DE REPARTO
 * 
 * Muestra un mapa visual con los pedidos "Confirmados" listos para repartir.
 * Utiliza OpenStreetMap (Nominatim) para geolocalizar las direcciones.
 */
export function DeliveryRouteMap({ orders, users, onUpdateStatus }) {
    const [locations, setLocations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Coordenadas base (Almacén Central / Origen de la ruta)
    // Coordenadas base: Calle Holanda 1 (Polígono Industrial, Illescas)
    const WAREHOUSE_COORDS = [40.1182, -3.8566]; // Coordenadas aproximadas de Calle Holanda, Illescas

    const [routePath, setRoutePath] = useState([]);

    useEffect(() => {
        const fetchCoordinates = async () => {
            setIsLoading(true);
            const newLocations = [];

            // Filtrar y preparar pedidos
            const ordersToRoute = orders.map(order => {
                const user = users.find(u => u.id === order.userId || u.email === order.userId);

                let query = '';
                let fullAddress = '';
                let address2 = '';

                if (order.shippingAddress) {
                    query = `${order.shippingAddress}, ${order.shippingTown || ''}, Toledo, Spain`;
                    fullAddress = `${order.shippingAddress}, ${order.shippingTown || ''} ${order.shippingPostalCode || ''}`;
                    address2 = order.shippingAddress2 || '';
                } else if (user?.address) {
                    query = `${user.address}, ${user.town || order.shippingTown || ''}, Toledo, Spain`;
                    fullAddress = `${user.address}, ${user.town || ''} ${user.postal_code || ''}`;
                    address2 = user.floor_door || '';
                } else if (order.shippingTown) {
                    query = `${order.shippingTown}, Toledo, Spain`;
                    fullAddress = order.shippingTown;
                }

                return {
                    ...order,
                    userLabel: user?.full_name || order.userId,
                    userPhone: user?.phone || '',
                    fullAddress: fullAddress.trim().replace(/^,|,$/g, ''),
                    address2: address2,
                    searchQuery: query.trim().replace(/^,|,$/g, '').replace(/,,/g, ',')
                };
            }).filter(o => o.searchQuery.length > 5);

            for (const order of ordersToRoute) {
                const cacheKey = order.searchQuery.toLowerCase();

                if (geocodeCache[cacheKey]) {
                    newLocations.push({
                        ...order,
                        coords: geocodeCache[cacheKey]
                    });
                } else {
                    try {
                        await new Promise(r => setTimeout(r, 1100)); // Límite de Nominatim

                        let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(order.searchQuery)}`);
                        if (!response.ok) throw new Error("Error en geocodificación");

                        let data = await response.json();

                        // Fallback: Si no lo encuentra por calle, buscamos solo por la localidad
                        if ((!data || data.length === 0) && (order.shippingTown || order.town)) {
                            console.warn('Dirección no encontrada, buscando solo por localidad:', order.searchQuery);
                            const town = order.shippingTown || order.town;
                            const fallbackQuery = `${town}, Toledo, Spain`;

                            await new Promise(r => setTimeout(r, 1100)); // Esperar de nuevo límite API
                            response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}`);
                            data = await response.json();
                        }

                        if (data && data.length > 0) {
                            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                            geocodeCache[cacheKey] = coords;
                            localStorage.setItem('mandahuevos_geocode_cache', JSON.stringify(geocodeCache));

                            newLocations.push({
                                ...order,
                                coords
                            });
                        } else {
                            console.error('No se pudo encontrar ni con fallback:', order.searchQuery);
                        }
                    } catch (error) {
                        console.error('Error de conexión o API:', error);
                    }
                }
            }

            // Calcular la ruta óptima (Problema del Viajante / TSP) usando OSRM Trip API
            if (newLocations.length > 0) {
                try {
                    // OSRM utiliza formato {lon},{lat}
                    // source=first asegura que la ruta empiece en el Almacén.
                    // roundtrip=false indica que no obligamos al repartidor a volver al punto de partida para que sea la ruta más corta hasta el último cliente.
                    const coordinatesStr = [WAREHOUSE_COORDS, ...newLocations.map(loc => loc.coords)]
                        .map(c => `${c[1]},${c[0]}`)
                        .join(';');

                    const osrmResponse = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordinatesStr}?overview=full&geometries=geojson&source=first&roundtrip=false`);
                    const osrmData = await osrmResponse.json();

                    if (osrmData.code === 'Ok' && osrmData.trips && osrmData.trips.length > 0) {
                        // Dibujado de la ruta en la línea azul
                        const routeCoords = osrmData.trips[0].geometry.coordinates.map(c => [c[1], c[0]]);
                        setRoutePath(routeCoords);

                        // OSRM devuelve 'waypoints' en el mismo orden en que le mandamos las coordenadas.
                        // waypoints[0] es el origen (Almacén).
                        // waypoints[1..N] son los destinos. 
                        // Cada uno tiene un 'waypoint_index' que indica en qué orden deberíamos visitarlos.
                        const optimizedLocations = newLocations.map((loc, index) => {
                            const wp = osrmData.waypoints[index + 1]; // +1 para saltar el almacén
                            return {
                                ...loc,
                                optimizedOrder: wp ? wp.waypoint_index : 999
                            };
                        }).sort((a, b) => a.optimizedOrder - b.optimizedOrder);

                        setLocations(optimizedLocations);
                    } else {
                        throw new Error("Invalid OSRM response");
                    }
                } catch (e) {
                    console.error("OSRM Route optimization failed", e);
                    // Fallback de seguridad (sin optimizar, tal cual se descubrieron)
                    setLocations(newLocations);
                    setRoutePath([WAREHOUSE_COORDS, ...newLocations.map(loc => loc.coords)]);
                }
            } else {
                setLocations([]);
                setRoutePath([]);
            }

            setIsLoading(false);
        };

        if (orders.length > 0) {
            fetchCoordinates();
        } else {
            setLocations([]);
            setRoutePath([]);
            setIsLoading(false);
        }
    }, [orders, users]);

    if (isLoading) {
        return (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p>Calculando ruta óptima (calles y carreteras) para {orders.length} pedidos...</p>
                <small style={{ color: 'var(--color-text-secondary)' }}>Esta primera vez puede tardar unos segundos para no saturar el servidor de mapas.</small>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                <p>No hay pedidos confirmados para mostrar en el mapa de hoy.</p>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '600px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .route-map-container {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                    flex-direction: row;
                }
                .route-sidebar {
                    width: 350px;
                    background: var(--color-bg-primary);
                    border-right: 1px solid var(--color-border);
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                @media (max-width: 768px) {
                    .route-map-container {
                        flex-direction: column-reverse; /* List below map on mobile */
                    }
                    .route-sidebar {
                        width: 100%;
                        border-right: none;
                        border-top: 1px solid var(--color-border);
                        height: 300px; /* Fixed height for scrollable list on mobile */
                    }
                }
            `}</style>
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📍 Ruta de Reparto ({locations.length}/{orders.length} ubicados)
                </h3>
            </div>

            <div className="route-map-container">
                {/* Panel lateral con la lista de paradas */}
                <div className="route-sidebar">
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.05)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-accent-primary)' }}>Parada 0: Almacén</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Calle Holanda 1, Illescas</div>
                    </div>

                    {locations.map((loc, index) => (
                        <div key={loc.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span>Parada {index + 1}</span>
                                <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                                    {loc.invoiceNumber}
                                </span>
                            </div>
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{loc.userLabel}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                📍 {loc.fullAddress}
                            </div>
                            {loc.address2 && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-accent-primary)', marginTop: '0.1rem', paddingLeft: '1.2rem' }}>
                                    └ {loc.address2}
                                </div>
                            )}
                            {loc.userPhone && (
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                    📞 {loc.userPhone}
                                </div>
                            )}
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                📦 {loc.items.reduce((acc, item) => acc + item.quantity, 0)} bultos (huevos)
                            </div>

                            <button
                                onClick={() => onUpdateStatus(loc.id, 'delivered')}
                                className="btn-primary"
                                style={{
                                    marginTop: '0.75rem',
                                    padding: '0.4rem',
                                    backgroundColor: '#10b981',
                                    width: '100%',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Marcar Entregado
                            </button>
                        </div>
                    ))}
                </div>

                {/* Mapa */}
                <MapContainer center={WAREHOUSE_COORDS} zoom={11} style={{ flex: 1, zIndex: 1 }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Marcador del Almacén */}
                    <Marker position={WAREHOUSE_COORDS} icon={warehouseIcon}>
                        <Popup>
                            <strong>Almacén MandamosHuevos</strong><br />
                            Calle Holanda 1, Illescas
                        </Popup>
                    </Marker>

                    {/* Marcadores de los Pedidos */}
                    {locations.map((loc, index) => (
                        <Marker key={loc.id} position={loc.coords}>
                            <Popup>
                                <strong>Parada {index + 1}</strong><br />
                                <strong>Cliente:</strong> {loc.userLabel}<br />
                                <strong>Teléfono:</strong> {loc.userPhone || 'No disponible'}<br />
                                <strong>Dirección:</strong> {loc.fullAddress}<br />
                                {loc.address2 && <><strong style={{ color: 'var(--color-accent-primary)' }}>Extra:</strong> {loc.address2}<br /></>}
                                <strong>Pedido N°:</strong> {loc.invoiceNumber}<br />
                                <strong>Bultos (huevos):</strong> {loc.items.reduce((acc, item) => acc + item.quantity, 0)}<br />

                                <button
                                    onClick={() => onUpdateStatus(loc.id, 'delivered')}
                                    style={{
                                        marginTop: '10px',
                                        padding: '5px 10px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Marcar Entregado
                                </button>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Línea de ruta real usando calles (vía OSRM) */}
                    {routePath.length > 0 && (
                        <Polyline positions={routePath} color="#3b82f6" weight={5} opacity={0.7} />
                    )}

                </MapContainer>
            </div>
        </div>
    );
}
