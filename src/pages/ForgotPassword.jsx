
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { Envelope, ArrowLeft, CheckCircle } from 'phosphor-react';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await AuthService.forgotPassword(email);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al enviar el email de recuperación');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <CheckCircle size={64} color="var(--color-accent-primary)" weight="fill" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Email enviado</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                        Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{email}</strong>.
                        No olvides revisar tu carpeta de spam.
                    </p>
                    <Link to="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <div className="glass-card">
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        <ArrowLeft /> Volver al login
                    </Link>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Recuperar contraseña</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Te enviaremos un enlace para que puedas entrar de nuevo.</p>
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
                    <div style={{ marginBottom: '2rem' }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email de tu cuenta</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <Envelope size={20} color="var(--color-text-muted)" />
                            <input
                                type="email"
                                id="email"
                                placeholder="tu@email.com"
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                </form>
            </div>
        </div>
    );
}
