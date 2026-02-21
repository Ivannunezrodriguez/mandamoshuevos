import { useState, useEffect, useRef } from 'react';
import { MapPin, XCircle } from 'phosphor-react';

/**
 * COMPONENTE AUTODIRECTOR DE DIRECCIONES (Estricto)
 *
 * Busca direcciones reales usando la API de Photon (OpenStreetMap).
 * Obliga al usuario a seleccionar una dirección del menú desplegable.
 */
export function AddressAutocomplete({
    initialValue = '',
    onSelect,
    placeholder = 'Empieza a escribir tu calle...',
    required = true,
    error = false
}) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSelected, setIsSelected] = useState(!!initialValue);

    const wrapperRef = useRef(null);
    const debounceTimer = useRef(null);

    // Cerrar el menú si se hace clic fuera del componente
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Si cerramos y no había seleccionado nada válido de la lista, forzamos a borrar
                if (!isSelected && query.length > 0) {
                    setQuery('');
                    onSelect(null);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSelected, query, onSelect]);

    // Buscar direcciones cuando cambia el texto (y no está seleccionado)
    useEffect(() => {
        if (isSelected || query.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            try {
                // Buscamos resultados cercanos a la zona de reparto (Illescas/Toledo) en lugar de Madrid centro
                const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lon=-3.8450&lat=40.1245`);
                if (!response.ok) throw new Error("API falló");

                const data = await response.json();

                if (data.features) {
                    const parsedResults = data.features.map(f => {
                        const p = f.properties;
                        // Construir una dirección legible
                        const street = p.name || p.street;
                        const houseNumber = p.housenumber ? ` ${p.housenumber}` : '';
                        const city = p.city || p.town || p.village || p.county || '';

                        let display = `${street}${houseNumber}`;
                        if (city) display += `, ${city}`;
                        if (p.state) display += ` (${p.state})`;

                        return {
                            id: p.osm_id,
                            display: display,
                            street: street || '',
                            houseNumber: p.housenumber || '',
                            city: city,
                            postcode: p.postcode || '',
                            state: p.state || '',
                            country: p.country || '',
                            lat: f.geometry.coordinates[1],
                            lon: f.geometry.coordinates[0]
                        };
                    }).filter(r => r.street); // Solo devolver resultados que tengan calle

                    setResults(parsedResults);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Error buscando dirección:", err);
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms de debounce

        return () => clearTimeout(debounceTimer.current);
    }, [query, isSelected]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        setIsSelected(false); // Al modificar, forzamos a que tenga que volver a elegir
        onSelect(null); // Notificamos al padre que la dirección actual ya no es válida
    };

    const handleSelectOption = (option) => {
        setQuery(option.display);
        setIsSelected(true);
        setIsOpen(false);
        onSelect(option); // Notificamos al padre con todos los datos desglosados
    };

    const handleClear = () => {
        setQuery('');
        setIsSelected(false);
        setIsOpen(false);
        onSelect(null);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <MapPin
                    size={20}
                    style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: isSelected ? 'var(--color-success)' : 'var(--color-text-secondary)'
                    }}
                />

                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                    style={{
                        padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                        width: '100%',
                        borderRadius: 'var(--radius-md)',
                        border: error ? '1px solid var(--color-error)' : (isSelected ? '1px solid var(--color-success)' : '1px solid var(--color-border)'),
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                    }}
                />

                {isLoading && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--color-accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                )}

                {isSelected && query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                        title="Borrar dirección"
                    >
                        <XCircle size={20} />
                    </button>
                )}
            </div>

            {/* Menú Desplegable con Resultados */}
            {isOpen && query.length >= 3 && (
                <ul style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 50,
                    listStyle: 'none',
                    padding: 0,
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    {results.length > 0 ? results.map((result, idx) => (
                        <li
                            key={`${result.id}-${idx}`}
                            onClick={() => handleSelectOption(result)}
                            style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--color-border)',
                                fontSize: '0.9rem',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <strong>{result.street} {result.houseNumber}</strong><br />
                            <small style={{ color: 'var(--color-text-secondary)' }}>
                                {result.city} {result.postcode ? `(${result.postcode})` : ''} - {result.state}
                            </small>
                        </li>
                    )) : (
                        <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                            {!isLoading && "No se encontraron direcciones reales. Revisa si está bien escrito."}
                        </li>
                    )}
                </ul>
            )}

            {!isSelected && query.length > 0 && !isOpen && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⚠️ Debes seleccionar una dirección válida de la lista sugerida.
                </div>
            )}
            {isSelected && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ✓ Dirección validada en el mapa.
                </div>
            )}
        </div>
    );
}
