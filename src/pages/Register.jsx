
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { UserPlus, ShieldCheck, Eye, EyeSlash } from 'phosphor-react';

export function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        dni: '',
        phone: '',
        address: '',
        name: '',
        gdprAccepted: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!formData.gdprAccepted) {
            setError('Debes aceptar la política de privacidad');
            return;
        }

        // Validar DNI/CIF (Regex simple para formato español aproximado)
        const dniRegex = /^[XYZ]?[0-9]{7,8}[A-Z]$|^[A-Z][0-9]{8}$|^[A-Z][0-9]{7}[A-Z0-9]$/i;
        if (!dniRegex.test(formData.dni)) {
            setError('El DNI/CIF no tiene un formato válido.');
            return;
        }

        // Validar Contraseña (Mínimo 8 caracteres, letras, números y especial)
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(formData.password)) {
            setError('La contraseña debe tener al menos 8 caracteres, incluir letras, números y un carácter especial (@$!%*?&).');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await AuthService.register(formData);
            navigate('/');
        } catch (err) {
            console.error("Registration error:", err);
            let msg = 'Error desconocido al registrarse. Por favor, inténtalo de nuevo.';

            // Mensaje original para debug
            const rawMsg = err.message || '';

            if (rawMsg.includes('User already registered') || rawMsg.includes('email already exists')) {
                msg = 'Este usuario ya está registrado. Por favor, inicia sesión.';
            } else if (rawMsg.includes('Password should be')) {
                msg = 'La contraseña es demasiado débil (mínimo 6 caracteres).';
            } else if (rawMsg.includes('Database error') || rawMsg.includes('saving new user')) {
                // Capturamos el error específico del usuario
                msg = 'Error al guardar el usuario en la base de datos. Verifica si el email es válido.';
            } else if (rawMsg) {
                // Fallback para otros errores, intentamos traducir o mostrar genérico
                msg = `Error: ${rawMsg}`;
            }

            setError(msg);
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-text-primary)',
        outline: 'none',
        fontSize: '1rem'
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-primary)',
            padding: '2rem'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <UserPlus size={48} weight="duotone" color="#fbbf24" style={{ marginBottom: '1rem' }} />
                    <h2>Crear Cuenta Profesional</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Únete a MandamosHuevos para gestionar tus pedidos</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* Datos Personales/Empresa */}
                    <div style={{ gridColumn: 'span 2' }}>
                        <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>Datos de Empresa</h4>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre Fiscal / Razón Social</label>
                        <input
                            type="text" name="name"
                            value={formData.name} onChange={handleChange}
                            placeholder="Ej. Restaurante Pepe S.L." required
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>DNI / CIF</label>
                        <input
                            type="text" name="dni"
                            value={formData.dni} onChange={handleChange}
                            placeholder="B-12345678" required
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Teléfono</label>
                        <input
                            type="tel" name="phone"
                            value={formData.phone} onChange={handleChange}
                            placeholder="+34 600 000 000" required
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Dirección de Facturación</label>
                        <input
                            type="text" name="address"
                            value={formData.address} onChange={handleChange}
                            placeholder="C/ Ejemplo, 12, 28000 Madrid" required
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>Datos de Acceso</h4>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                        <input
                            type="email" name="email"
                            value={formData.email} onChange={handleChange}
                            placeholder="admin@empresa.com" required
                            style={inputStyle}
                        />
                    </div>



                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPassword ? "text" : "password"} name="password"
                                value={formData.password} onChange={handleChange}
                                placeholder="••••••••" required
                                style={{ ...inputStyle, paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeSlash size={22} /> : <Eye size={22} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                        <input
                            type="checkbox" name="gdprAccepted"
                            checked={formData.gdprAccepted} onChange={handleChange}
                            style={{ width: 'auto', marginTop: '0.25rem' }} id="gdpr"
                        />
                        <label htmlFor="gdpr" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                            He leído y acepto la <Link to="/legal" target="_blank" style={{ color: 'var(--color-accent-primary)', textDecoration: 'none' }}>Política de Privacidad</Link> y doy mi consentimiento para el tratamiento de mis datos personales conforme al RGPD para la gestión de pedidos y facturación.
                        </label>
                    </div>

                    {error && <div style={{ gridColumn: 'span 2', color: 'var(--color-error)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={loading}
                        >
                            {loading ? 'Creando cuenta...' : 'Registrarse'}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-accent-primary)' }}>Inicia sesión</Link>
                </div>
            </div>
        </div>
    );
}
