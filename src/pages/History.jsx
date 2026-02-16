
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { InvoiceService } from '../services/invoice.service';
import { ArrowCounterClockwise, FilePdf, Package, Calendar as CalendarIcon, ListBullets, ArrowLeft } from 'phosphor-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar-custom.css'; // Custom styles for dark mode

export function History() {
    const [orders, setOrders] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const navigate = useNavigate();
    const user = AuthService.getCurrentUser();

    useEffect(() => {
        if (user) {
            const fetchOrders = async () => {
                // FIX: Usar email como prioridad para coincidir con NewOrder.jsx
                const data = await OrderService.getUserOrders(user.email || user.username || user.id);
                setOrders(data);
            };
            fetchOrders();
        }
    }, [user]);

    const handleRepeatOrder = (order) => {
        navigate('/new-order', { state: { initialCart: order.items } });
    };

    const handleViewInvoice = (order) => {
        InvoiceService.generateInvoice(order, user);
    };

    // Calendar helper: find orders on a date
    const getOrdersForDate = (date) => {
        return orders.filter(o => {
            const d = new Date(o.deliveryDate);
            return d.getDate() === date.getDate() &&
                d.getMonth() === date.getMonth() &&
                d.getFullYear() === date.getFullYear();
        });
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayOrders = getOrdersForDate(date);
            if (dayOrders.length > 0) {
                return (
                    <div style={{ marginTop: '0.25rem', display: 'flex', gap: '2px', justifyContent: 'center' }}>
                        {dayOrders.map(o => (
                            <div key={o.id} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }} title={`Pedido ${o.invoiceNumber}`} />
                        ))}
                    </div>
                );
            }
        }
    };

    if (!user) {
        // Redirigir si no hay usuario (aunque useEffect tb lo maneja, mejor render null para evitar faggotism visual)
        return null;
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'transparent', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: 0 }}
                >
                    <ArrowLeft size={20} /> Volver al Escritorio
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Historial de Pedidos</h2>
                    <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '0.5rem',
                                background: viewMode === 'list' ? 'var(--color-bg-tertiary)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                color: viewMode === 'list' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'
                            }}
                        >
                            <ListBullets size={24} />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                padding: '0.5rem',
                                background: viewMode === 'calendar' ? 'var(--color-bg-tertiary)' : 'transparent',
                                borderRadius: 'var(--radius-sm)',
                                color: viewMode === 'calendar' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)'
                            }}
                        >
                            <CalendarIcon size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                    <Package size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Aún no has realizado pedidos.</p>
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {orders.map(order => (
                                <div key={order.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Pedido {order.invoiceNumber}</div>
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="text-gold" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                                {order.total.toFixed(2)} €
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                                                    ({order.paymentMethod === 'transfer' ? 'Transferencia' : order.paymentMethod === 'bizum' ? 'Bizum' : 'Al contado'})
                                                </span>
                                            </div>
                                            {order.shippingTown && (
                                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    📍 {order.shippingTown}
                                                </span>
                                            )}
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: 'var(--radius-full)',
                                                background: order.status === 'pending' ? 'rgba(249, 115, 22, 0.2)' :
                                                    order.status === 'confirmed' ? 'rgba(59, 130, 246, 0.2)' : // BLUE
                                                        'rgba(16, 185, 129, 0.2)', // GREEN
                                                color: order.status === 'pending' ? '#ea580c' :
                                                    order.status === 'confirmed' ? '#3b82f6' :
                                                        '#34d399',
                                                fontSize: '0.875rem',
                                                fontWeight: 600
                                            }}>
                                                {order.status === 'pending' ? 'Pendiente' :
                                                    order.status === 'confirmed' ? 'Confirmado' :
                                                        order.status === 'delivered' ? 'Entregado' :
                                                            order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 0' }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                                                <span>{item.quantity} x {item.name}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            Entrega programada: {new Date(order.deliveryDate).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleViewInvoice(order)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: 'var(--color-text-primary)' }}
                                        >
                                            <FilePdf size={20} /> Descargar Factura
                                        </button>
                                        <button
                                            onClick={() => handleRepeatOrder(order)}
                                            className="btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                        >
                                            <ArrowCounterClockwise size={20} /> Repetir Pedido
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <Calendar
                                tileContent={tileContent}
                                className="custom-calendar"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
