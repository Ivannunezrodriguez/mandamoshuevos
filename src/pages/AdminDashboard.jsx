
import { useState, useEffect, useMemo } from 'react';
import { DbAdapter } from '../services/db.adapter';
import { isSupabaseConfigured } from '../lib/supabase'; // Import missing function
import { AdminService } from '../services/admin.service';
import { OrderService } from '../services/order.service';
import {
    Package,
    Truck,
    CheckCircle,
    FilePdf,
    Storefront,
    Warning,
    CaretRight,
    CaretDown,
    Egg,
    ArrowCircleUp,
    ArrowCircleDown,
    User,
    ChartBar,
    MagnifyingGlass,
    DownloadSimple,
    Envelope,
    Funnel,
    Trash
} from 'phosphor-react';

import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

export function AdminDashboard() {
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'inventory', 'stats', 'users'
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState(new Set());
    const [errorMsg, setErrorMsg] = useState(null); // Capture errors

    // Filters
    const [filterText, setFilterText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const navigate = useNavigate();



    const checkAdminAndLoad = async () => {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            console.warn('Acceso denegado');
            navigate('/');
            return;
        }
        await loadData();
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setErrorMsg(null); // Clear previous errors
            const [ordersData, inventoryData, profilesData] = await Promise.all([
                DbAdapter.getAllOrders(),
                DbAdapter.getInventory(),
                DbAdapter.getAllProfiles()
            ]);

            // Sort Inventory by ID to prevent jumping
            const sortedInventory = [...inventoryData].sort((a, b) => a.product_id.localeCompare(b.product_id));

            setOrders(ordersData);
            setInventory(sortedInventory);
            setUsers(profilesData);
        } catch (error) {
            console.error('Error loading admin data:', error);
            setErrorMsg(error.message || "Error desconocido al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAdminAndLoad();
    }, []);

    // --- LOGIC: ORDERS ---

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesText =
                (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(filterText.toLowerCase())) ||
                (order.userId && order.userId.toLowerCase().includes(filterText.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesText && matchesStatus;
        });
    }, [orders, filterText, statusFilter]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        // if (!window.confirm('¿Confirmar cambio de estado?')) return;
        try {
            // LOGICA DE INVENTARIO: Si confirmamos pedido, restamos stock
            if (newStatus === 'confirmed') {
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    console.log("Restando stock para pedido:", order.id);

                    // MAPA DE DESCOMPOSICIÓN DE OFERTAS
                    const PRODUCT_MAPPING = {
                        'oferta-3-xxl': { base: 'carton-xxl', qty: 3 },
                        'oferta-3-l': { base: 'carton-l', qty: 3 },
                        'oferta-3-m': { base: 'carton-m', qty: 3 },
                        'pack-6-xxl': { base: 'carton-xxl', qty: 6 },
                        'pack-6-l': { base: 'carton-l', qty: 6 },
                        'pack-6-m': { base: 'carton-m', qty: 6 },
                        'pack-12-xxl': { base: 'carton-xxl', qty: 12 },
                        'pack-12-l': { base: 'carton-l', qty: 12 },
                        'pack-12-m': { base: 'carton-m', qty: 12 },
                        // Base products map to themselves x1
                        'carton-xxl': { base: 'carton-xxl', qty: 1 },
                        'carton-l': { base: 'carton-l', qty: 1 },
                        'carton-m': { base: 'carton-m', qty: 1 }
                    };

                    // Ejecutar actualizaciones
                    const updates = [];
                    for (const item of order.items) {
                        const mapping = PRODUCT_MAPPING[item.id];
                        if (mapping) {
                            // Si es una oferta/pack, restamos X veces la cantidad del item
                            // Ejemplo: 2 Packs de 6 XXL = 2 * 6 = 12 cartones XXL restados
                            const totalToDeduct = item.quantity * mapping.qty;
                            updates.push(DbAdapter.updateStock(mapping.base, -totalToDeduct));
                        } else {
                            // Fallback por si acaso (items desconocidos)
                            console.warn("Producto sin mapeo de stock:", item.id);
                        }
                    }
                    await Promise.all(updates);
                }
            }

            await DbAdapter.updateOrderStatus(orderId, newStatus);
            await loadData(); // Recargar todo (incluido inventario actualizado)
        } catch (error) {
            console.error("Error updating status:", error);
            alert('Error al actualizar estado: ' + error.message);
        }
    };

    const handleUpdateDiscount = async (userId, newDiscount) => {
        const val = parseInt(newDiscount, 10);
        if (isNaN(val) || val < 0) return;
        try {
            await DbAdapter.updateUserDiscount(userId, val);
            // Actualizar estado local
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, discount_percent: val } : u));
        } catch {
            alert("Error al actualizar descuento");
        }
    };

    const handleDownloadPDF = async (order) => {
        try {
            const profile = await DbAdapter.getUserById(order.userId);
            await AdminService.generateDeliveryNote(order, profile || { full_name: order.userId, email: order.userId });
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        // Removed confirmation per user request
        try {
            await DbAdapter.deleteOrder(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            // Trigger load to refresh stats/inventory if needed, but local state update is faster
        } catch (error) {
            alert('Error al eliminar pedido: ' + error.message);
        }
    };

    // Bulk selection
    const toggleSelectOrder = (orderId) => {
        const newSet = new Set(selectedOrders);
        if (newSet.has(orderId)) newSet.delete(orderId);
        else newSet.add(orderId);
        setSelectedOrders(newSet);
    };

    const handleBulkDownload = async () => {
        if (selectedOrders.size === 0) return;
        const ordersToPrint = orders.filter(o => selectedOrders.has(o.id));
        await AdminService.generateBulkDeliveryNotes(ordersToPrint);
        setSelectedOrders(new Set()); // Clear selection
    };

    const toggleSelectAll = () => {
        if (selectedOrders.size === filteredOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
        }
    };

    // --- LOGIC: INVENTORY ---

    const handleStockUpdate = async (productId, delta) => {
        try {
            await DbAdapter.updateStock(productId, delta);
            // Manually update local state to avoid full reload jumpiness, but keep sort
            setInventory(prev => {
                const map = prev.map(item => item.product_id === productId
                    ? { ...item, stock_quantity: item.stock_quantity + delta }
                    : item
                );
                return map; // Order is preserved as map doesn't reorder
            });
        } catch {
            alert('Error al actualizar stock');
        }
    };

    // --- LOGIC: STATS ---
    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;

        // Sales by Month (Simple Object)
        const salesByMonth = {};
        orders.forEach(o => {
            const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
            salesByMonth[month] = (salesByMonth[month] || 0) + o.total;
        });

        // Top Products
        const productCounts = {};
        orders.forEach(o => {
            o.items.forEach(i => {
                productCounts[i.id] = (productCounts[i.id] || 0) + i.quantity;
            });
        });

        // Top Towns (Naive parsing)
        const townCounts = {};
        users.forEach(u => {
            if (u.address) {
                // Heuristic: Last part of address usually contains town or zip
                // For demo, we just group by non-empty address existence or specific keywords if found
                const addressLower = u.address.toLowerCase();
                let town = 'Desconocido';
                if (addressLower.includes('illescas')) town = 'Illescas';
                else if (addressLower.includes('ugena')) town = 'Ugena';
                else if (addressLower.includes('madrid')) town = 'Madrid';
                else town = 'Otros';

                townCounts[town] = (townCounts[town] || 0) + 1;
            }
        });

        // REAL HEATMAP BASED ON ORDERS (Shipping Address)
        // Overwrite townCounts with Order Shipping Data if available
        // Reset townCounts for Order based calculation
        const orderTownCounts = {};
        orders.forEach(o => {
            // HEATMAP DATA (Refined with Shipping Town)
            if (o.shippingTown) {
                // If we have explicit shipping town, use it
                const town = o.shippingTown;
                orderTownCounts[town] = (orderTownCounts[town] || 0) + 1;
            } else {
                // Fallback to User Address (Legacy orders)
                const user = users.find(u => u.id === o.userId || u.email === o.userId);
                if (user && user.address) {
                    const addressLower = user.address.toLowerCase();
                    let town = 'Desconocido';
                    // ... (existing helper logic) - Optimization: Extract normalized logic if needed
                    if (addressLower.includes('illescas')) town = 'Illescas';
                    else if (addressLower.includes('ugena')) town = 'Ugena';
                    else if (addressLower.includes('yuncos')) town = 'Yuncos';
                    else if (addressLower.includes('seseña')) town = 'Seseña';
                    else if (addressLower.includes('esquivias')) town = 'Esquivias';
                    else if (addressLower.includes('yeles')) town = 'Yeles';
                    else if (addressLower.includes('numancia')) town = 'Numancia';
                    else if (addressLower.includes('cedillo')) town = 'Cedillo';
                    else if (addressLower.includes('viso')) town = 'El Viso';
                    else if (addressLower.includes('carranque')) town = 'Carranque';
                    else if (addressLower.includes('casarrubuelos')) town = 'Casarrubuelos';
                    else if (addressLower.includes('madrid')) town = 'Madrid';
                    else town = 'Otros';

                    orderTownCounts[town] = (orderTownCounts[town] || 0) + 1;
                } else {
                    orderTownCounts['Sin Dirección'] = (orderTownCounts['Sin Dirección'] || 0) + 1;
                }
            }
        });

        // console.log("Heatmap Data:", orderTownCounts); // Removed log

        // Use orderTownCounts instead of townCounts if we have orders
        const finalTownCounts = Object.keys(orderTownCounts).length > 0 ? orderTownCounts : townCounts;

        return { totalRevenue, totalOrders, salesByMonth, productCounts, townCounts: finalTownCounts };
    }, [orders, users]);



    if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Cargando panel...</div>;

    const products = OrderService.getProducts();

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const lowStockCount = inventory.filter(i => i.stock_quantity < 10).length;

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            {errorMsg && (
                <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>Error de Carga:</strong> {errorMsg}
                    <br />
                    <small>Verifica las Políticas RLS en Supabase o la consola del navegador.</small>
                </div>
            )}
            <style>{`
                .order-grid-header {
                    display: grid;
                    grid-template-columns: 40px 1fr 1fr 2fr 1fr 150px 50px;
                    gap: 1rem;
                    padding: 0 1rem;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: var(--color-text-secondary);
                    margin-bottom: -1rem;
                }
                .order-grid-item {
                    display: grid;
                    grid-template-columns: 40px 1fr 1fr 2fr 1fr 150px 50px;
                    align-items: center;
                    gap: 1rem;
                }
                @media (max-width: 768px) {
                    .order-grid-header { display: none; }
                    .order-grid-item {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }
                    .order-grid-item > input { display: none; } /* Hide checkbox on mobile for simplicity or move it */
                }
            `}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Package size={40} className="text-gold" />
                <div>
                    <h1 style={{ margin: 0 }}>Panel de Administración</h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Gestión integral de MandamosHuevos</p>
                </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
                {[
                    { id: 'orders', icon: Truck, label: `Pedidos`, badge: pendingCount },
                    { id: 'inventory', icon: Storefront, label: 'Inventario', badge: lowStockCount },
                    { id: 'stats', icon: ChartBar, label: 'Estadísticas' },
                    { id: 'users', icon: User, label: `Usuarios (${users.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'var(--color-accent-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
                            padding: '0.75rem 1.25rem',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <tab.icon size={20} /> {tab.label}
                        {tab.badge > 0 && (
                            <span style={{
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '0.75rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '999px',
                                marginLeft: '0.5rem'
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* --- TAB: ORDERS --- */}
            {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Header Columns for List */}
                    <div className="order-grid-header">
                        <div></div>
                        <div>Nº PEDIDO</div>
                        <div>FECHA</div>
                        <div>CLIENTE / EMAIL</div>
                        <div>LOCALIDAD</div>
                        <div style={{ textAlign: 'center' }}>ESTADO</div>
                        <div></div>
                    </div>


                    {/* Filters & Actions */}
                    <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <MagnifyingGlass size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                name="searchOrders"
                                id="searchOrders"
                                aria-label="Buscar pedidos"
                                placeholder="Buscar por cliente o factura..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem', background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Funnel size={20} />
                            <select
                                name="statusFilter"
                                id="statusFilter"
                                aria-label="Filtrar por estado"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ background: 'var(--color-bg-primary)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', color: 'white' }}
                            >
                                <option value="all">Todos los estados</option>
                                <option value="pending">Pendientes</option>
                                <option value="confirmed">Confirmados</option>
                                <option value="delivered">Entregados</option>
                            </select>
                        </div>
                        {selectedOrders.size > 0 && (
                            <button
                                onClick={handleBulkDownload}
                                className="btn-primary"
                                style={{ background: '#3b82f6', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                            >
                                <DownloadSimple size={20} /> Descargar Seleccionados ({selectedOrders.size})
                            </button>
                        )}
                        <div style={{ marginLeft: 'auto' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="selectAllOrders"
                                    id="selectAllOrders"
                                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                                    onChange={toggleSelectAll}
                                />
                                Seleccionar Todo
                            </label>
                        </div>
                    </div>

                    {filteredOrders.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No hay pedidos que coincidan.</p>}

                    {filteredOrders.map(order => (
                        <div key={order.id} className="glass-card" style={{ padding: '1rem', borderLeft: selectedOrders.has(order.id) ? '4px solid var(--color-accent-primary)' : '4px solid transparent' }}>
                            <div className="order-grid-item">
                                <input
                                    type="checkbox"
                                    name={`selectOrder-${order.id}`}
                                    id={`selectOrder-${order.id}`}
                                    aria-label={`Seleccionar pedido ${order.invoiceNumber}`}
                                    checked={selectedOrders.has(order.id)}
                                    onChange={() => toggleSelectOrder(order.id)}
                                    style={{ transform: 'scale(1.2)' }}
                                />
                                {/* Column 1: Invoice */}
                                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                    {expandedOrder === order.id ? <CaretDown /> : <CaretRight />}
                                    <span style={{ fontWeight: 600, color: 'var(--color-accent-primary)' }}>{order.invoiceNumber}</span>
                                </div>

                                {/* Column 2: Date */}
                                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                    {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                {/* Column 3: User/Email */}
                                <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.userId}>
                                    {order.userId}
                                </div>

                                {/* Column 4: Locality (Explicit or Derived) */}
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                    {order.shippingTown || (() => {
                                        const u = users.find(user => user.id === order.userId || user.email === order.userId);
                                        if (!u || !u.address) return '-';
                                        const addr = u.address.toLowerCase();
                                        if (addr.includes('illescas')) return 'Illescas';
                                        if (addr.includes('ugena')) return 'Ugena';
                                        if (addr.includes('yuncos')) return 'Yuncos';
                                        if (addr.includes('seseña')) return 'Seseña';
                                        if (addr.includes('esquivias')) return 'Esquivias';
                                        if (addr.includes('yeles')) return 'Yeles';
                                        if (addr.includes('numancia')) return 'Numancia';
                                        if (addr.includes('cedillo')) return 'Cedillo';
                                        if (addr.includes('viso')) return 'El Viso';
                                        if (addr.includes('carranque')) return 'Carranque';
                                        if (addr.includes('casarrubuelos')) return 'Casarrubuelos';
                                        if (addr.includes('madrid')) return 'Madrid';
                                        return 'Otro';
                                    })()}
                                </div>

                                {/* Status */}
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center',
                                    background: order.status === 'pending' ? 'rgba(249, 115, 22, 0.2)' :
                                        order.status === 'confirmed' ? 'rgba(59, 130, 246, 0.2)' : // BLUE
                                            'rgba(16, 185, 129, 0.2)', // GREEN
                                    color: order.status === 'pending' ? '#ea580c' :
                                        order.status === 'confirmed' ? '#3b82f6' :
                                            '#34d399'
                                }}>
                                    {order.status === 'pending' ? 'Pendiente' :
                                        order.status === 'confirmed' ? 'Confirmado' :
                                            order.status === 'delivered' ? 'Entregado' :
                                                order.status}
                                </span>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button onClick={() => handleDownloadPDF(order)} style={{ background: 'transparent', color: '#3b82f6' }} title="Albarán PDF"><FilePdf size={24} /></button>
                                    <button onClick={() => handleDeleteOrder(order.id)} style={{ background: 'transparent', color: '#ef4444' }} title="Eliminar"><Trash size={24} /></button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrder === order.id && (
                                <div style={{ marginLeft: '2.5rem', marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Items:</div>
                                    {order.items.map((item, idx) => {
                                        const p = products.find(prod => prod.id === item.id);
                                        return (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.2rem 0' }}>
                                                <span>{item.quantity} x {p?.name || item.id}</span>
                                                <span>{(item.price * item.quantity).toFixed(2)} €</span>
                                            </div>
                                        );
                                    })}
                                    <div style={{ marginTop: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>
                                        Total: {order.total.toFixed(2)} €
                                    </div>
                                    <div style={{ marginTop: '0.25rem', textAlign: 'right', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Pago: {order.paymentMethod === 'transfer' ? 'Transferencia' : order.paymentMethod === 'bizum' ? 'Bizum' : 'Al contado'}
                                    </div>
                                    {order.status === 'pending' && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                                                className="btn-primary"
                                                style={{ width: '100%', background: 'var(--color-success)' }}
                                            >
                                                Confirmar Pedido
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- TAB: INVENTORY --- */}
            {activeTab === 'inventory' && (
                <div className="glass-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem' }}>Producto</th>
                                <th style={{ padding: '1rem' }}>Stock</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Ajuste</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => {
                                const p = products.find(prod => prod.id === item.product_id);
                                const isLowStock = item.stock_quantity <= item.min_stock_alert;
                                return (
                                    <tr key={item.product_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Egg size={24} weight="fill" color={isLowStock ? 'var(--color-error)' : 'var(--color-accent-primary)'} />
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{p?.name || item.product_id}</div>
                                                    {isLowStock && <div style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>STOCK BAJO</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{item.stock_quantity}</span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button onClick={() => handleStockUpdate(item.product_id, -10)} style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}><ArrowCircleDown size={24} /></button>
                                                <button onClick={() => handleStockUpdate(item.product_id, 10)} style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><ArrowCircleUp size={24} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- TAB: STATS --- */}
            {activeTab === 'stats' && (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-accent-primary)' }}>{stats.totalRevenue.toFixed(0)} €</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>Ingresos Totales</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalOrders}</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>Pedidos Totales</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ec4899' }}>{users.length}</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>Clientes Registrados</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {/* Sales Chart */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3>Ventas Mensuales</h3>
                            <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '1rem', paddingTop: '1rem' }}>
                                {Object.entries(stats.salesByMonth).map(([month, value]) => (
                                    <div key={month} style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            background: 'var(--color-accent-primary)',
                                            height: `${Math.min((value / (stats.totalRevenue || 1)) * 300, 150)}px`,
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.3s',
                                            position: 'relative'
                                        }}>
                                            <span style={{
                                                position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                                                fontSize: '0.75rem', fontWeight: 'bold', color: 'white',
                                                background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px'
                                            }}>
                                                {value}€
                                            </span>
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>{month}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3>Top Productos</h3>
                            {Object.entries(stats.productCounts).map(([pid, count]) => {
                                const p = products.find(prod => prod.id === pid);
                                return (
                                    <div key={pid} style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span>{p?.name || pid}</span>
                                            <span>{count} uds</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                            <div style={{ height: '100%', width: `${Math.min((count / 50) * 100, 100)}%`, background: '#3b82f6', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Heatmap (Top Cities) */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3>Mapa de Calor (Ciudades)</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Lugares con mayor volumen de pedidos</p>
                            {Object.entries(stats.townCounts)
                                .sort(([, a], [, b]) => b - a)
                                .map(([town, count], idx) => (
                                    <div key={town} style={{ marginBottom: '0.8rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                            <span>{idx + 1}. {town}</span>
                                            <span style={{ fontWeight: 'bold' }}>{count}</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min((count / stats.totalOrders) * 100 * 2, 100)}%`, // Scale visually
                                                background: idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : '#3b82f6', // Red for #1, Orange #2, Blue rest
                                                borderRadius: '3px'
                                            }}></div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div >
            )
            }

            {/* --- TAB: USERS --- */}
            {
                activeTab === 'users' && (
                    <div className="glass-card">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                                    <th style={{ padding: '1rem' }}>Usuario</th>
                                    <th style={{ padding: '1rem' }}>Contacto</th>
                                    <th style={{ padding: '1rem' }}>Descuento General</th>
                                    <th style={{ padding: '1rem' }}>Rol</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{u.full_name || 'Sin Nombre'}</strong>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Unido: {new Date(u.updated_at || Date.now()).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{u.email}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{u.phone || 'Sin télefono'}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    name={`discount-${u.id}`}
                                                    id={`discount-${u.id}`}
                                                    aria-label={`Descuento para usuario ${u.full_name}`}
                                                    min="0"
                                                    max="100"
                                                    defaultValue={u.discount_percent || 0}
                                                    onBlur={(e) => handleUpdateDiscount(u.id, e.target.value)}
                                                    style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: '#374151', color: 'white', textAlign: 'center' }}
                                                />
                                                <span>%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem',
                                                background: u.role === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.1)',
                                                color: u.role === 'admin' ? '#ec4899' : 'var(--color-text-secondary)'
                                            }}>
                                                {u.role === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <a
                                                href={`mailto:${u.email}?subject=Oferta Especial MandamosHuevos&body=Hola ${u.full_name || ''}, tienes un descuento especial del ${u.discount_percent || 0}% en tu próxima compra...`}
                                                className="btn-primary"
                                                style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Envelope size={18} /> Contactar
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }
        </div >
    );
}
