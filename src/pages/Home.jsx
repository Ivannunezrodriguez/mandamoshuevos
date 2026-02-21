
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt, ClockCounterClockwise, ShoppingCart, ArrowRight, Egg } from 'phosphor-react';
import { OrderService } from '../services/order.service';
import { PRODUCTS } from '../services/catalog.service';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';

/**
 * Componente Home
 * 
 * Actúa como el escritorio personal del usuario. Muestra:
 * 1. Estadísticas globales de impacto (huevos totales).
 * 2. Sugerencias inteligentes para repetir compras.
 * 3. Accesos directos a las áreas principales.
 */
export function Home() {
    const [recurringOrder, setRecurringOrder] = useState(null); // Último pedido para la sugerencia rápida
    const [totalEggs, setTotalEggs] = useState(0);             // Contador total de huevos consumidos
    const user = AuthService.getCurrentUser();
    const navigate = useNavigate();

    /**
     * EFECTO: Carga de datos de escritorio.
     * Recupera la sugerencia de pedido y las estadísticas globales.
     */
    useEffect(() => {
        if (user) {
            const fetchSuggestion = async () => {
                // El servicio analiza el historial para proponer un "Pedido Habitual"
                const suggestion = await OrderService.getRecurringSuggestion(user.id);
                setRecurringOrder(suggestion);
            };
            fetchSuggestion();

            const fetchStats = async () => {
                // Cálculo de huevos totales sumando todos los cartones de todos los pedidos
                const items = await DbAdapter.getGlobalStats();
                const total = items.reduce((sum, item) => {
                    const product = PRODUCTS.find(p => p.id === (item.product_id || item.id));
                    return sum + (product ? (product.eggsPerUnit || 0) * (item.quantity || 0) : 0);
                }, 0);
                setTotalEggs(total);
            };
            fetchStats();
        }
    }, [user?.id]); // Usamos user.id para evitar bucles si el objeto cambia de referencia

    /**
     * Acción de compra rápida: Redirige al proceso de compra con la sugerencia ya cargada.
     */
    const handleQuickOrder = () => {
        if (recurringOrder) {
            navigate('/new-order', { state: { initialCart: recurringOrder.items } });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Mi Área</h2>
                <Link to="/new-order" className="btn-primary">
                    <Plus size={20} weight="bold" />
                    Nuevo Pedido
                </Link>
            </div>

            {/* Banner Estadísticas Globales */}
            <div className="glass-card" style={{
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(217, 119, 6, 0.05))',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 2rem',
                textAlign: 'center',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
                    <Egg size={200} weight="fill" color="#fbbf24" />
                </div>

                <div>
                    <div style={{
                        fontSize: '3.5rem',
                        fontWeight: 900,
                        color: 'var(--color-accent-primary)',
                        textShadow: '0 0 20px rgba(251, 191, 36, 0.3)',
                        lineHeight: 1
                    }}>
                        {totalEggs.toLocaleString()}
                    </div>
                    <div style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '3px',
                        marginTop: '0.5rem',
                        fontWeight: 600
                    }}>
                        Huevos entregados en total
                    </div>
                    <div style={{
                        marginTop: '1.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic'
                    }}>
                        ¡Gracias por confiar en la calidad de MandamosHuevos!
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Card: Compra Recurrente */}
                {recurringOrder ? (
                    <div className="glass-card" style={{ border: '1px solid var(--color-accent-primary)', background: 'rgba(251, 191, 36, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <ShoppingCart size={32} color="#fbbf24" weight="fill" />
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Pedido Habitual</h3>
                                <small style={{ color: 'var(--color-text-secondary)' }}>Basado en tu historial</small>
                            </div>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                            {recurringOrder.items.slice(0, 2).map((item, i) => (
                                <div key={i}>{item.quantity} x {item.name}</div>
                            ))}
                            {recurringOrder.items.length > 2 && <div>...y más</div>}
                        </div>
                        <button
                            onClick={handleQuickOrder}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Pedir de nuevo <ArrowRight weight="bold" />
                        </button>
                    </div>
                ) : (
                    <div className="glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <ShoppingCart size={32} color="#fbbf24" />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Empieza a pedir</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                            Realiza tu primer pedido para recibir sugerencias personalizadas.
                        </p>
                        <Link to="/new-order" style={{ color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                            Ver Catálogo &rarr;
                        </Link>
                    </div>
                )}

                {/* Card: Último Pedido */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <ClockCounterClockwise size={32} color="#fbbf24" />
                        <h3 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Historial</h3>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Consulta tus pedidos anteriores o descarga facturas.
                    </p>
                    <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                        Ver historial completo
                    </Link>
                </div>

                {/* Card: Blog */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <Receipt size={32} color="#fbbf24" />
                        {/* Usamos Receipt genericamente pero es Blog, mejor cambiar icono si pudiera */}
                        <h3 style={{ fontSize: '1.25rem', marginBottom: 0 }}>Novedades</h3>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                        Descubre recetas y beneficios del huevo en nuestro blog.
                    </p>
                    <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                        Ir al Blog
                    </Link>
                </div>
            </div>


        </div>
    );
}
