
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrderService } from '../services/order.service';
import { PRODUCTS, LOGISTICS_INFO, ALL_TOWNS, getDeliveryDaysForTown } from '../services/catalog.service';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';
import { ShoppingCart, CalendarCheck, ArrowRight, CreditCard, Bank, Truck, MapPin, Money, MapTrifold } from 'phosphor-react';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

/**
 * Componente NewOrder
 * 
 * Gestiona el proceso de compra de principio a fin.
 * Flujo de trabajo:
 * 1. Selección de productos y cantidades.
 * 2. Visualización del carrito con descuentos dinámicos según el perfil del usuario.
 * 3. Selección de logística (Localidad -> Fechas disponibles).
 * 4. Pasarela de confirmación y creación del pedido en Supabase/LocalStorage.
 */
export function NewOrder() {
    const navigate = useNavigate();
    const location = useLocation(); // Permite recibir datos de "Repetir Pedido" desde el Historial

    // --- ESTADO DEL CARRITO Y PEDIDO ---
    const [cart, setCart] = useState({}); // Estructura: { productId: quantity }
    const [isRecurringOrder, setIsRecurringOrder] = useState(false); // Marca si el usuario desea repetir este pedido semanalmente
    const [step, setStep] = useState(1); // Control de pasos: 1 (Selección), 2 (Checkout/Logística)

    // --- ESTADO DE LOGÍSTICA ---
    const [selectedTown, setSelectedTown] = useState('');     // Localidad elegida por el usuario
    const [deliveryAddress, setDeliveryAddress] = useState(''); // Dirección exacta (Calle, Nº, etc.)
    const [deliveryAddress2, setDeliveryAddress2] = useState(''); // Piso, nave, etc.
    const [deliveryPostalCode, setDeliveryPostalCode] = useState(''); // Código postal
    const [deliveryDate, setDeliveryDate] = useState('');       // Fecha elegida para el reparto
    const [availableDates, setAvailableDates] = useState([]);   // Fechas calculadas según la zona del usuario

    // --- ESTADO DE PAGO Y DESCUENTOS ---
    const [paymentMethod, setPaymentMethod] = useState('transfer'); // Métodos: transfer (Transferencia), bizum, cash (Metalico)
    const [discountPercent, setDiscountPercent] = useState(0);      // Porcentaje de descuento heredado del perfil

    /**
     * EFECTO: Carga inicial del perfil del cliente.
     * Busca si el usuario tiene un descuento especial asignado y autocompleta 
     * la población si ya está en sus datos de perfil.
     */
    useEffect(() => {
        const fetchProfile = async () => {
            const user = AuthService.getCurrentUser();
            if (user) {
                try {
                    // Consultamos el perfil completo al adaptador para obtener el campo 'discount_percent'
                    const profile = await DbAdapter.getUserById(user.id);
                    if (profile) {
                        if (profile.discount_percent) setDiscountPercent(profile.discount_percent);
                        if (profile.address) setDeliveryAddress(profile.address);
                        if (profile.address_2) setDeliveryAddress2(profile.address_2);
                        if (profile.town) setSelectedTown(profile.town);
                        if (profile.postal_code) setDeliveryPostalCode(profile.postal_code);
                    }
                } catch (e) {
                    console.error("No se pudo cargar el descuento del perfil:", e);
                }
            }

            // Heurística de autocompletado: Si la dirección guardada contiene una poblacion conocida, la seleccionamos
            if (user && user.address) {
                const foundTown = ALL_TOWNS.find(t => user.address.toLowerCase().includes(t.toLowerCase()));
                if (foundTown) setSelectedTown(foundTown);
            }
        };
        fetchProfile();
    }, []);

    /**
     * EFECTO: Gestión de la repetición de pedidos.
     * Cuando pulsamos "Repetir" en el historial, recibimos los productos por el estado de navegación.
     */
    useEffect(() => {
        if (location.state) {
            if (location.state.initialCart) {
                const initialCart = {};
                location.state.initialCart.forEach(item => {
                    // Verificamos que el producto aún exista en el catálogo (por si ha cambiado el ID)
                    if (PRODUCTS.find(p => p.id === item.id)) {
                        initialCart[item.id] = item.quantity;
                    }
                });
                setCart(initialCart);
            }
            if (location.state.isRecurring) {
                setIsRecurringOrder(true);
            }
        }
    }, [location.state]);

    /**
     * Aumenta o disminuye la cantidad de un producto en la cesta.
     * Si la cantidad es 0 o menor, el producto se elimina de la cesta.
     */
    const updateQuantity = (productId, delta) => {
        setCart(prev => {
            const newQuantity = (prev[productId] || 0) + delta;
            if (newQuantity <= 0) {
                const newCart = { ...prev };
                delete newCart[productId];
                return newCart;
            }
            return { ...prev, [productId]: newQuantity };
        });
    };

    const handleAddressSelect = (addressObj) => {
        if (addressObj) {
            setDeliveryAddress(`${addressObj.street} ${addressObj.houseNumber}`.trim());

            // Intentar que la ciudad devuelta coincida con nuestra lista de pueblos (case insensitive)
            const cityStr = (addressObj.city || '').toLowerCase();
            const stateStr = (addressObj.state || '').toLowerCase();
            const matchedTown = ALL_TOWNS.find(t => t.toLowerCase() === cityStr || t.toLowerCase() === stateStr) || addressObj.city || '';

            setSelectedTown(matchedTown);
            setDeliveryPostalCode(addressObj.postcode || '');
        } else {
            setDeliveryAddress('');
            setSelectedTown('');
            setDeliveryPostalCode('');
            setDeliveryDate(''); // Resetear fecha
        }
    };

    // --- FUNCIONES DE CÁLCULO ECONÓMICO ---

    const calculateSubtotal = () => {
        return Object.entries(cart).reduce((total, [productId, quantity]) => {
            const product = PRODUCTS.find(p => p.id === productId);
            return total + (product ? product.price * quantity : 0);
        }, 0);
    }

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        if (discountPercent > 0) {
            // Aplicamos el descuento solo si el usuario lo tiene habilitado en el admin
            return subtotal * ((100 - discountPercent) / 100);
        }
        return subtotal;
    };

    const calculateTotalEggs = () => {
        return Object.entries(cart).reduce((total, [productId, quantity]) => {
            const product = PRODUCTS.find(p => p.id === productId);
            return total + (product ? (product.eggsPerUnit || 0) * quantity : 0);
        }, 0);
    };



    const resetCart = () => {
        if (Object.keys(cart).length === 0) return;
        // User requested to remove confirmation
        setCart({});
    };

    /**
     * EFECTO: Cálculo de fechas de reparto.
     * Basado en la localidad seleccionada, determina los días de la semana en los que 
     * repartimos (ej: Lunes y Miércoles) y calcula las próximas 4 fechas de calendario.
     */
    useEffect(() => {
        if (!selectedTown) {
            setAvailableDates([]);
            setDeliveryDate('');
            return;
        }

        const days = getDeliveryDaysForTown(selectedTown); // Obtiene [1, 3] para Lunes-Miércoles
        const nextDates = [];

        if (days && days.length > 0) {
            let date = new Date();
            date.setHours(0, 0, 0, 0);

            // Algoritmo de búsqueda: Exploramos los días futuros hasta encontrar 4 que coincidan con el calendario de reparto
            while (nextDates.length < 4) {
                date.setDate(date.getDate() + 1); // Siempre empezamos el reparto a partir de mañana
                if (days.includes(date.getDay())) {
                    nextDates.push(new Date(date));
                }
            }
        }

        setAvailableDates(nextDates);
        setDeliveryDate(''); // Reseteamos la fecha elegida si el usuario cambia de localidad
    }, [selectedTown]);

    /**
     * Procesa el checkout final.
     * 1. Valida que todos los campos requeridos estén rellenos.
     * 2. Estructura el objeto de pedido con el ID (UUID) del usuario.
     * 3. Persiste el pedido y redirige al historial.
     */
    const handleCheckout = async () => {
        // --- VALIDACIONES DE FORMULARIO ---
        if (!selectedTown) {
            alert('Por favor, selecciona tu población para ver los días de reparto.');
            return;
        }
        if (!deliveryAddress) {
            alert('Por favor, introduce tu dirección completa.');
            return;
        }
        if (!deliveryDate) {
            alert('Por favor, selecciona una fecha de entrega.');
            return;
        }

        try {
            const user = AuthService.getCurrentUser();
            // Mapeamos el carrito a una lista legible para el administrador
            const orderItems = Object.entries(cart).map(([id, quantity]) => {
                const product = PRODUCTS.find(p => p.id === id);
                return {
                    id,
                    name: product.name,
                    price: product.price,
                    quantity
                };
            });

            /**
             * Objeto OrderData
              * @important userId: DEBE ser user.id (UUID) para cumplir con las políticas RLS y FK de Supabase.
             */
            const orderData = {
                userId: user.id,
                items: orderItems,
                deliveryDate: deliveryDate,
                total: calculateTotal(),
                paymentMethod: paymentMethod,
                shippingAddress: deliveryAddress,
                shippingAddress2: deliveryAddress2,
                shippingTown: selectedTown,
                shippingPostalCode: deliveryPostalCode,
                // Generamos un número de factura único basado en la fecha
                invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
                isRecurring: isRecurringOrder // Flag de suscripción
            };

            const order = await OrderService.createOrder(orderData);

            if (paymentMethod === 'bizum') {
                // Si es Bizum, redirigimos a la página de instrucciones pasando la info del pedido
                navigate('/bizum-payment', { state: { order: order }, replace: true });
            } else {
                // Redirigimos al historial para otros métodos
                navigate('/history', { replace: true });
            }
        } catch (error) {
            console.error('Error crítico al procesar el pedido:', error);
            alert('Hubo un error al procesar el pedido. Comprueba tu conexión.');
        }
    };

    if (step === 2) {
        // --- VISTA DE CHECKOUT (PASO 2) ---
        return (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '2rem' }}>Resumen del Pedido</h2>

                {/* LISTA DE PRODUCTOS SELECCIONADOS */}
                <div style={{ marginBottom: '2rem' }}>
                    {Object.entries(cart).map(([id, quantity]) => {
                        const product = PRODUCTS.find(p => p.id === id);
                        return (
                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                                <span>{product.name} x {quantity}</span>
                                <span>{(product.price * quantity).toFixed(2)} €</span>
                            </div>
                        );
                    })}

                    {/* DESGLOSE DE PRECIOS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '1.2rem', color: 'var(--color-text-secondary)' }}>
                        <span>Subtotal</span>
                        <span>{calculateSubtotal().toFixed(2)} €</span>
                    </div>
                    {discountPercent > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '1rem', color: 'var(--color-success)' }}>
                            <span>Descuento Cliente ({discountPercent}%)</span>
                            <span>-{(calculateSubtotal() * (discountPercent / 100)).toFixed(2)} €</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--color-accent-primary)' }}>
                        <span>Total a Pagar</span>
                        <span>{calculateTotal().toFixed(2)} €</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                        + IVA (10%) incluido
                    </div>
                </div>

                {/* FORMULARIO DE REPARTO */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        <MapTrifold size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Dirección de Entrega Principal <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <AddressAutocomplete
                        initialValue={deliveryAddress}
                        onSelect={handleAddressSelect}
                        required={true}
                    />
                    <small style={{ color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>Buscador obligatorio. Nos aseguramos de que los repartidores puedan llegar sin problemas.</small>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="delivery-address-2" style={{ display: 'block', marginBottom: '0.5rem' }}>Detalles Adicionales (Línea 2 - Opcional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <input
                            type="text"
                            id="delivery-address-2"
                            name="delivery-address-2"
                            placeholder="Ej: Bloque 2, 3ºB, Nave 4..."
                            value={deliveryAddress2}
                            onChange={(e) => setDeliveryAddress2(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none', padding: '0.25rem' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label htmlFor="delivery-town" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Población (Auto) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: !selectedTown ? '1px solid var(--color-error)' : '1px solid transparent' }}>
                            <MapPin size={24} color="var(--color-text-secondary)" />
                            <input
                                type="text"
                                id="delivery-town"
                                value={selectedTown}
                                readOnly
                                placeholder="Esperando dirección..."
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', width: '100%', outline: 'none', padding: '0.25rem', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="delivery-pc" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Código Postal (Auto) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: !deliveryPostalCode ? '1px solid var(--color-error)' : '1px solid transparent' }}>
                            <input
                                type="text"
                                id="delivery-pc"
                                value={deliveryPostalCode}
                                readOnly
                                placeholder="Esperando..."
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', width: '100%', outline: 'none', padding: '0.25rem', cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label htmlFor="delivery-date" style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha de Entrega <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: !deliveryDate ? '1px solid var(--color-error)' : '1px solid transparent', cursor: selectedTown ? 'pointer' : 'not-allowed', opacity: selectedTown ? 1 : 0.5 }}
                    >
                        <CalendarCheck size={24} color="var(--color-text-primary)" />
                        <select
                            id="delivery-date"
                            name="delivery-date"
                            disabled={!selectedTown}
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none', cursor: selectedTown ? 'pointer' : 'not-allowed', padding: '0.25rem' }}
                        >
                            <option value="" style={{ background: 'var(--color-bg-secondary)' }}>
                                {!selectedTown ? 'Primero elige población' : '-- Elige un día de reparto --'}
                            </option>
                            {availableDates.map(date => {
                                const value = date.toISOString().split('T')[0];
                                const label = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                                return (
                                    <option key={value} value={value} style={{ background: 'var(--color-bg-secondary)' }}>
                                        {label.charAt(0).toUpperCase() + label.slice(1)}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    {!deliveryDate && selectedTown && <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Selecciona un día de reparto</div>}
                </div>

                {/* SELECCIÓN DE MÉTODO DE PAGO */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Método de Pago</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{
                            flex: 1, padding: '0.75rem',
                            border: `1px solid ${paymentMethod === 'transfer' ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            background: paymentMethod === 'transfer' ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
                        }}>
                            <input type="radio" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} style={{ display: 'none' }} />
                            <Bank size={24} color={paymentMethod === 'transfer' ? '#fbbf24' : 'currentColor'} />
                            <span style={{ fontSize: '0.9rem' }}>Transferencia</span>
                        </label>
                        <label style={{
                            flex: 1, padding: '0.75rem',
                            border: `1px solid ${paymentMethod === 'bizum' ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            background: paymentMethod === 'bizum' ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
                        }}>
                            <input type="radio" name="payment" value="bizum" checked={paymentMethod === 'bizum'} onChange={() => setPaymentMethod('bizum')} style={{ display: 'none' }} />
                            <CreditCard size={24} color={paymentMethod === 'bizum' ? '#fbbf24' : 'currentColor'} />
                            <span style={{ fontSize: '0.9rem' }}>Bizum</span>
                        </label>
                        <label style={{
                            flex: 1, padding: '0.75rem',
                            border: `1px solid ${paymentMethod === 'cash' ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            background: paymentMethod === 'cash' ? 'rgba(251, 191, 36, 0.1)' : 'transparent'
                        }}>
                            <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} style={{ display: 'none' }} />
                            <Money size={24} color={paymentMethod === 'cash' ? '#fbbf24' : 'currentColor'} />
                            <span style={{ fontSize: '0.9rem' }}>Al contado</span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setStep(1)}
                    >
                        Volver
                    </button>
                    <button
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center', opacity: (!deliveryDate || !deliveryAddress || !deliveryPostalCode || !selectedTown) ? 0.5 : 1, cursor: (!deliveryDate || !deliveryAddress || !deliveryPostalCode || !selectedTown) ? 'not-allowed' : 'pointer' }}
                        onClick={handleCheckout}
                        disabled={!deliveryDate || !deliveryAddress || !deliveryPostalCode || !selectedTown}
                    >
                        Confirmar Pedido <ArrowRight weight="bold" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Nuevo Pedido</h2>

            {/* Aviso Logística */}
            <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-accent-primary)', background: 'rgba(251, 191, 36, 0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                    <Truck size={24} weight="fill" /> Reparto a Domicilio ({LOGISTICS_INFO.schedule})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                    {LOGISTICS_INFO.zones.map((zone, idx) => (
                        <div key={idx}>
                            <strong>{zone.days}:</strong>
                            <div style={{ color: 'var(--color-text-secondary)' }}>{zone.areas.join(', ')}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Catálogo con Categorías */}
                <div style={{ gridColumn: 'span 2' }}>
                    {['offer', 'individual', 'pack'].map(category => {
                        const categoryTitle = { 'offer': '🔥 Ofertas Exclusivas', 'individual': '🥚 Cartones Sueltos', 'pack': '📦 Packs Ahorro' }[category];
                        const categoryProducts = PRODUCTS.filter(p => p.category === category);

                        if (categoryProducts.length === 0) return null;

                        return (
                            <div key={category} style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{categoryTitle}</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {categoryProducts.map(product => (
                                        <div key={product.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontSize: '2rem' }}>{product.image}</span>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                                                    <div style={{ color: 'var(--color-accent-primary)', fontSize: '1.1rem' }}>{product.price.toFixed(2)} €</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                                                <button
                                                    onClick={() => updateQuantity(product.id, -1)}
                                                    style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-primary)' }}
                                                >
                                                    -
                                                </button>
                                                <span style={{ minWidth: '2ch', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {cart[product.id] || 0}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(product.id, 1)}
                                                    style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-primary)' }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ position: 'sticky', top: '6rem', height: 'fit-content' }}>
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingCart /> Tu Cesta
                        </h3>

                        {Object.keys(cart).length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)' }}>Selecciona productos...</p>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                                    {Object.entries(cart).map(([id, quantity]) => {
                                        const product = PRODUCTS.find(p => p.id === id);
                                        return (
                                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <span>{product.name} x {quantity}</span>
                                                <span>{(product.price * quantity).toFixed(2)} €</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                        <span>Huevos totales</span>
                                        <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{calculateTotalEggs()} uds</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                        <span>Subtotal</span>
                                        <span>{calculateSubtotal().toFixed(2)} €</span>
                                    </div>
                                    {discountPercent > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>
                                            <span>Dto. {discountPercent}%</span>
                                            <span>-{(calculateSubtotal() * (discountPercent / 100)).toFixed(2)} €</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
                                        <span>Total</span>
                                        <span style={{ color: 'var(--color-accent-primary)' }}>{calculateTotal().toFixed(2)} €</span>
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <button
                                            className="btn-primary"
                                            style={{ width: '100%', justifyContent: 'center' }}
                                            onClick={() => setStep(2)}
                                        >
                                            Tramitar Pedido
                                        </button>
                                        <button
                                            onClick={resetCart}
                                            style={{
                                                width: '100%',
                                                background: 'transparent',
                                                color: 'var(--color-error)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                padding: '0.5rem',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Vaciar Cesta
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
