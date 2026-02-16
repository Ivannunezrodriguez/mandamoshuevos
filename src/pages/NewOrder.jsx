
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrderService, PRODUCTS, LOGISTICS_INFO, ALL_TOWNS, getDeliveryDaysForTown } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';
import { ShoppingCart, CalendarCheck, ArrowRight, CreditCard, Bank, Truck, MapPin, Money } from 'phosphor-react';

export function NewOrder() {
    const navigate = useNavigate();
    const location = useLocation(); // Para recuperar el estado de "Repetir Pedido"
    const [cart, setCart] = useState({});
    const [step, setStep] = useState(1); // 1: Selección, 2: Confirmación
    const [selectedTown, setSelectedTown] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState(''); // New state for street address
    const [deliveryDate, setDeliveryDate] = useState('');
    const [availableDates, setAvailableDates] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('transfer'); // 'transfer' | 'bizum'
    const [discountPercent, setDiscountPercent] = useState(0);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = AuthService.getCurrentUser();
            if (user) {
                try {
                    // Cargar perfil completo para ver descuento
                    const profile = await import('../services/db.adapter').then(m => m.DbAdapter.getUserById(user.id || user.email));
                    if (profile && profile.discount_percent) {
                        setDiscountPercent(profile.discount_percent);
                    }
                } catch (e) {
                    console.error("Error cargando perfil para descuento", e);
                }
            }

            // Intentar autoseleccionar población si coincide con alguna zona
            if (user && user.address) {
                const foundTown = ALL_TOWNS.find(t => user.address.toLowerCase().includes(t.toLowerCase()));
                if (foundTown) setSelectedTown(foundTown);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        // Cargar carrito inicial si venimos de "Repetir Pedido"
        if (location.state && location.state.initialCart) {
            const initialCart = {};
            location.state.initialCart.forEach(item => {
                // Verificar que el producto aún existe en el catálogo actual
                if (PRODUCTS.find(p => p.id === item.id)) {
                    initialCart[item.id] = item.quantity;
                }
            });
            setCart(initialCart);
        }
    }, [location.state]);

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

    const calculateSubtotal = () => {
        return Object.entries(cart).reduce((total, [productId, quantity]) => {
            const product = PRODUCTS.find(p => p.id === productId);
            return total + (product ? product.price * quantity : 0);
        }, 0);
    }

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        if (discountPercent > 0) {
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

    useEffect(() => {
        // Cargar carrito inicial si venimos de "Repetir Pedido"
        if (location.state && location.state.initialCart) {
            const initialCart = {};
            location.state.initialCart.forEach(item => {
                // Verificar que el producto aún existe en el catálogo actual
                if (PRODUCTS.find(p => p.id === item.id)) {
                    initialCart[item.id] = item.quantity;
                }
            });
            setCart(initialCart);
        }
    }, [location.state]);



    const resetCart = () => {
        if (Object.keys(cart).length === 0) return;
        // User requested to remove confirmation
        setCart({});
    };

    useEffect(() => {
        if (!selectedTown) {
            setAvailableDates([]);
            setDeliveryDate('');
            return;
        }

        const days = getDeliveryDaysForTown(selectedTown);
        const nextDates = [];
        let date = new Date();
        date.setHours(0, 0, 0, 0);

        // Buscar las próximas 4 fechas válidas
        while (nextDates.length < 4) {
            date.setDate(date.getDate() + 1); // Empezar desde mañana
            if (days.includes(date.getDay())) {
                nextDates.push(new Date(date));
            }
        }
        setAvailableDates(nextDates);
        setDeliveryDate(''); // Resetear fecha elegida al cambiar de pueblo
    }, [selectedTown]);

    const handleCheckout = async () => {
        // VALIDACIÓN DE POBLACIÓN Y FECHA
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
            const orderItems = Object.entries(cart).map(([id, quantity]) => {
                const product = PRODUCTS.find(p => p.id === id);
                return {
                    id,
                    name: product.name,
                    price: product.price,
                    quantity
                };
            });

            // REMOVED AUTO-UPDATE USER ADDRESS - SEPARATING CONCERNS AS REQUESTED

            await OrderService.createOrder({
                userId: user.email || user.username || user.id,
                items: orderItems,
                deliveryDate: deliveryDate,
                total: calculateTotal(),
                paymentMethod: paymentMethod,
                shippingAddress: deliveryAddress, // New field
                shippingTown: selectedTown       // New field
            });

            // FIX: Usar replace: true para evitar bucles de historial y navegación limpia
            navigate('/history', { replace: true });
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Hubo un error al procesar el pedido');
        }
    };

    if (step === 2) {
        return (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '2rem' }}>Resumen del Pedido</h2>

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

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Población de Entrega <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: !selectedTown ? '1px solid var(--color-error)' : '1px solid transparent' }}>
                        <MapPin size={24} color="var(--color-text-primary)" />
                        <select
                            value={selectedTown}
                            onChange={(e) => setSelectedTown(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                            <option value="" style={{ background: 'var(--color-bg-secondary)' }}>-- Selecciona tu población --</option>
                            {ALL_TOWNS.map(town => (
                                <option key={town} value={town} style={{ background: 'var(--color-bg-secondary)' }}>{town}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Dirección de Entrega (Calle y Nº) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: !deliveryAddress ? '1px solid var(--color-error)' : '1px solid transparent' }}>
                        <input
                            type="text"
                            placeholder="Ej: Calle Gran Via 12, 3ºA"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none', padding: '0.25rem' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha de Entrega <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: !deliveryDate ? '1px solid var(--color-error)' : '1px solid transparent', cursor: selectedTown ? 'pointer' : 'not-allowed', opacity: selectedTown ? 1 : 0.5 }}
                    >
                        <CalendarCheck size={24} color="var(--color-text-primary)" />
                        <select
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
                        style={{ flex: 1, justifyContent: 'center', opacity: (!deliveryDate || !deliveryAddress) ? 0.5 : 1, cursor: (!deliveryDate || !deliveryAddress) ? 'not-allowed' : 'pointer' }}
                        onClick={handleCheckout}
                        disabled={!deliveryDate || !deliveryAddress}
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
