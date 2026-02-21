
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { Envelope, Lock, GoogleLogo, ArrowRight, Eye, EyeSlash } from 'phosphor-react';

/**
 * Componente Login
 * 
 * Permite a los usuarios y administradores acceder al sistema.
 * Soporta autenticación por email y gestiona los estados de carga y error de Supabase.
 */
export function Login() {
    const [identifier, setIdentifier] = useState('');     // Soporta tanto email como username (legacy)
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Toggle visual para la contraseña
    const [error, setError] = useState('');                 // Gestión de feedback negativo
    const [loading, setLoading] = useState(false);           // Estado de espera de red
    const navigate = useNavigate();

    /**
     * Procesa el intento de conexión.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await AuthService.login(identifier, password);
            if (user) {
                // Almacenamos la sesión en el servicio antes de navegar
                AuthService.completeLogin(user);
                if (user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                setError('Credenciales incorrectas');
            }
        } catch (err) {
            console.error(err);
            // Traducción de los errores técnicos de Supabase a mensajes comprensibles para el usuario
            if (err.message && err.message.includes('Invalid login credentials')) {
                setError('Email o contraseña incorrectos.');
            } else if (err.message && err.message.includes('Email not confirmed')) {
                setError('Por favor, confirma tu email antes de entrar.');
            } else {
                setError(err.message || 'Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <div className="glass-card">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bienvenido</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Accede a tu cuenta de MandamosHuevos</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-error)',
                        color: 'var(--color-error)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <Envelope size={20} color="var(--color-text-muted)" />
                            <input
                                type="text"
                                id="email"
                                name="email"
                                autoComplete="email"
                                placeholder="tu@email.com"
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label htmlFor="password" style={{ fontSize: '0.9rem' }}>Contraseña</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--color-accent-primary)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <Lock size={20} color="var(--color-text-muted)" />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Iniciar Sesión'} <ArrowRight weight="bold" />
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>¿No tienes cuenta? </span>
                    <Link to="/register" style={{ color: 'var(--color-accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        Regístrate gratis
                    </Link>
                </div>
            </div>
        </div>
    );
}
