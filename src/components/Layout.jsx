
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../lib/supabase';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';
import { SignOut, Egg, Receipt, ShoppingCart, Browsers, User, Phone, Sun, Moon, ShieldCheck, List, X } from 'phosphor-react';
import { useState, useEffect } from 'react';

export function Layout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [adminPendingCount, setAdminPendingCount] = useState(0);
    const [isDark, setIsDark] = useState(!document.body.classList.contains('light-theme'));

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
    };

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
        } else {
            setUser(currentUser);
            // Si es admin, obtener contador de notificaciones (Pendientes + Stock Bajo)
            if (currentUser.role === 'admin') {
                const updateCounts = async () => {
                    const [pending, lowStock] = await Promise.all([
                        DbAdapter.getPendingOrdersCount(),
                        DbAdapter.getLowStockCount()
                    ]);
                    setAdminPendingCount(pending + lowStock);
                };

                updateCounts();
                // Opcional: Polling simple cada 30s
                const interval = setInterval(updateCounts, 30000);
                return () => clearInterval(interval);
            }
        }
    }, [navigate]); // eslint-disable-next-line react-hooks/exhaustive-deps

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: '1rem 2rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .desktop-nav { display: none !important; }
                        .mobile-burger { display: block !important; }
                        .mobile-menu-dropdown { 
                            display: flex; flexDirection: column; gap: 0.5rem;
                        }
                    }
                    @media (min-width: 769px) {
                        .mobile-burger { display: none !important; }
                        .mobile-menu-dropdown { display: none !important; }
                    }
                `}</style>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Egg size={32} weight="fill" color="#fbbf24" />
                    <h1 style={{ fontSize: '1.5rem', margin: 0, background: 'linear-gradient(135deg, #fbbf24, #d97706)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                        mandamoshuevos
                    </h1>
                </Link>

                {/* DESKTOP NAV */}
                <nav className="desktop-nav" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {user.role === 'admin' && (
                        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontWeight: 'bold' }}>
                            <ShieldCheck size={20} weight="fill" /> Admin
                            {adminPendingCount > 0 && (
                                <span style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '999px',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                }}>
                                    {adminPendingCount}
                                </span>
                            )}
                        </Link>
                    )}
                    <Link to="/new-order" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <ShoppingCart size={20} /> Pedidos
                    </Link>
                    <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <Receipt size={20} /> Historial
                    </Link>
                    <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <Browsers size={20} /> Blog
                    </Link>
                    <Link to="/contact" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)' }}>
                        <Phone size={20} /> Contacto
                    </Link>

                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '1rem',
                            cursor: 'pointer'
                        }}
                        title={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
                    >
                        {isDark ? <Sun size={20} weight="fill" color="#fbbf24" /> : <Moon size={20} weight="fill" color="#475569" />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1.5rem' }}>
                        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                            <User size={20} /> {user.full_name || user.name}
                        </Link>
                        <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--color-text-muted)' }} title="Cerrar sesión">
                            <SignOut size={24} />
                        </button>
                    </div>
                </nav>

                {/* MOBILE BURGER */}
                <div className="mobile-burger" style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ background: 'transparent', color: 'var(--color-text-primary)', padding: '0.5rem' }}
                    >
                        {isMenuOpen ? <X size={28} /> : <List size={28} />}
                    </button>

                    {/* MOBILE DROPDOWN MENU */}
                    {isMenuOpen && (
                        <div className="mobile-menu-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            width: '220px',
                            background: 'var(--color-bg-secondary)', // Solid bg for readability
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '1rem',
                            zIndex: 101,
                            marginTop: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                                <User size={18} color="var(--color-accent-primary)" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || user.name}</span>
                            </div>

                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {user.role === 'admin' && (
                                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-accent-primary)', fontWeight: 'bold', fontSize: '0.9rem', padding: '0.5rem', borderRadius: '4px', background: 'rgba(251, 191, 36, 0.1)' }}>
                                        <ShieldCheck size={18} /> Admin Panel
                                        {adminPendingCount > 0 && (
                                            <span style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                padding: '0.1rem 0.5rem',
                                                borderRadius: '999px'
                                            }}>
                                                {adminPendingCount}
                                            </span>
                                        )}
                                    </Link>
                                )}
                                <Link to="/new-order" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', padding: '0.5rem' }}>
                                    <ShoppingCart size={18} /> Pedidos
                                </Link>
                                <Link to="/history" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', padding: '0.5rem' }}>
                                    <Receipt size={18} /> Historial
                                </Link>
                                <Link to="/blog" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', padding: '0.5rem' }}>
                                    <Browsers size={18} /> Blog
                                </Link>
                                <Link to="/contact" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', padding: '0.5rem' }}>
                                    <Phone size={18} /> Contacto
                                </Link>
                                <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', padding: '0.5rem' }}>
                                    <User size={18} /> Mi Perfil
                                </Link>

                                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <button
                                        onClick={toggleTheme}
                                        style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                                    >
                                        {isDark ? <Sun size={18} color="#fbbf24" weight="fill" /> : <Moon size={18} color="#475569" weight="fill" />}
                                    </button>
                                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)', background: 'transparent', fontSize: '0.9rem' }}>
                                        <SignOut size={18} /> Salir
                                    </button>
                                </div>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <Outlet />
            </main>

            <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', marginTop: 'auto', fontSize: '0.85rem' }}>
                <p>&copy; {new Date().getFullYear()} MandamosHuevos - Calidad que se nota.</p>
                <p style={{ marginTop: '0.5rem' }}>
                    <Link to="/contact" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Aviso Legal</Link> •
                    <Link to="/contact" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', marginLeft: '0.5rem' }}>Política de Privacidad</Link>
                </p>
                {user && user.role === 'admin' && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                        Estado: {isSupabaseConfigured() ? <span style={{ color: '#10b981' }}>● Conectado a Supabase</span> : <span style={{ color: '#fbbf24' }}>● Modo Local</span>}
                    </div>
                )}
            </footer>
        </div >
    );
}
