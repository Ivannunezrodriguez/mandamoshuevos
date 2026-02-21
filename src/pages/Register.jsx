
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { UserPlus, ShieldCheck, Eye, EyeSlash, MapTrifold } from 'phosphor-react';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

/**
 * Componente Register
 * 
 * Permite la creación de nuevas cuentas para clientes profesionales.
 * Realiza múltiples validaciones en el cliente (DNI, fortaleza de contraseña, GDPR)
 * antes de registrar al usuario en Supabase AuthService.
 */
export function Register() {
    // --- ESTADO: Formulario multicanal ---
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        dni: '',
        phone: '',
        address: '',
        address_2: '',
        town: '',
        postal_code: '',
        name: '',           // Razón social
        gdprAccepted: false // Consentimiento legal obligatorio
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

    const handleAddressSelect = (addressObj) => {
        if (addressObj) {
            setFormData(prev => ({
                ...prev,
                address: `${addressObj.street} ${addressObj.houseNumber}`.trim(),
                town: addressObj.city || '',
                postal_code: addressObj.postcode || ''
            }));
            setError('');
        } else {
            setFormData(prev => ({
                ...prev,
                address: '',
                town: '',
                postal_code: ''
            }));
        }
    };

    /**
     * Procesa el alta de nuevo usuario.
     */
    const handleRegister = async (e) => {
        e.preventDefault();

        // --- VALIDACIONES DE NEGOCIO Y LEGALES ---
        if (!formData.gdprAccepted) {
            setError('Debes aceptar la política de privacidad para continuar.');
            return;
        }

        if (!formData.address || !formData.town) {
            setError('Debes seleccionar una dirección válida sugerida por el buscador.');
            return;
        }

        // Validación de DNI/CIF (Regex español estándar)
        const dniRegex = /^[XYZ]?[0-9]{7,8}[A-Z]$|^[A-Z][0-9]{8}$|^[A-Z][0-9]{7}[A-Z0-9]$/i;
        if (!dniRegex.test(formData.dni)) {
            setError('El DNI/CIF introducido no tiene un formato válido.');
            return;
        }

        // Validación de Fortaleza de Contraseña
        // Requiere: 8 caracteres, al menos una letra, un número y un símbolo
        const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
        if (!passRegex.test(formData.password)) {
            setError('La contraseña es demasiado débil. Usa al menos 8 caracteres, incluyendo letras, números y símbolos.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // El servicio registra en Auth y crea el perfil en la tabla 'profiles'
            await AuthService.register(formData);
            navigate('/');
        } catch (err) {
            console.error("Error en registro:", err);
            let msg = 'Error desconocido al registrarse. Revisa tu conexión.';

            const rawMsg = err.message || '';

            // Mapeo detallado de errores de Supabase Auth
            if (rawMsg.includes('User already registered') || rawMsg.includes('email already exists')) {
                msg = 'Este email ya está en uso. Por favor, inicia sesión.';
            } else if (rawMsg.includes('Password should be')) {
                msg = 'La contraseña no cumple con los requisitos del servidor de seguridad.';
            } else if (rawMsg.includes('Database error')) {
                msg = 'Error de base de datos al guardar el perfil. Inténtalo de nuevo.';
            } else if (rawMsg) {
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
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre Fiscal / Razón Social</label>
                        <input
                            type="text" name="name" id="name"
                            value={formData.name} onChange={handleChange}
                            placeholder="Ej. Restaurante Pepe S.L." required
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label htmlFor="dni" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>DNI / CIF</label>
                        <input
                            type="text" name="dni" id="dni"
                            value={formData.dni} onChange={handleChange}
                            placeholder="B-12345678" required
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Teléfono</label>
                        <input
                            type="tel" name="phone" id="phone"
                            value={formData.phone} onChange={handleChange}
                            placeholder="+34 600 000 000" required
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                            <MapTrifold size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            Dirección Principal (Buscador Automático)
                        </label>
                        <AddressAutocomplete
                            initialValue={formData.address}
                            onSelect={handleAddressSelect}
                            required={true}
                        />
                        <small style={{ color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>Escribe calle y número, y pincha en la opción correcta del desplegable para rellenar los datos.</small>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="address_2" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Detalles (Piso, Puerta, Escalera...) - Opcional</label>
                        <input
                            type="text" name="address_2" id="address_2"
                            value={formData.address_2} onChange={handleChange}
                            placeholder="Piso 3, Puerta B, Nave 4..."
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label htmlFor="town" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Población (Autocompletado)</label>
                        <input
                            type="text" name="town" id="town"
                            value={formData.town} readOnly
                            placeholder="Autocompletado al elegir dirección" required
                            style={{ ...inputStyle, background: 'rgba(0,0,0,0.1)', cursor: 'not-allowed', color: 'var(--color-text-secondary)' }}
                        />
                    </div>

                    <div>
                        <label htmlFor="postal_code" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Código Postal (Autocompletado)</label>
                        <input
                            type="text" name="postal_code" id="postal_code"
                            value={formData.postal_code} readOnly
                            placeholder="Autocompletado" required
                            style={{ ...inputStyle, background: 'rgba(0,0,0,0.1)', cursor: 'not-allowed', color: 'var(--color-text-secondary)' }}
                        />
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <h4 style={{ color: 'var(--color-accent-primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>Datos de Acceso</h4>
                    </div>

                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                        <input
                            type="email" name="email" id="email"
                            value={formData.email} onChange={handleChange}
                            placeholder="admin@empresa.com" required
                            style={inputStyle}
                        />
                    </div>



                    <div style={{ gridColumn: 'span 2' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Contraseña</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPassword ? "text" : "password"} name="password" id="password"
                                value={formData.password} onChange={handleChange}
                                placeholder="••••••••" required
                                autoComplete="new-password"
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
