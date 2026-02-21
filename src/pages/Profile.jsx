
import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';
import { User, FloppyDisk, DownloadSimple, Key, MapTrifold } from 'phosphor-react';
import { AddressAutocomplete } from '../components/AddressAutocomplete';

/**
 * Componente Profile
 * 
 * Permite al usuario gestionar su información personal de facturación y
 * actualizar sus credenciales de seguridad (contraseña).
 */
export function Profile() {
    // --- ESTADO: Datos de facturación ---
    const [formData, setFormData] = useState({
        name: '',    // Nombre fiscal o razón social
        dni: '',     // DNI/CIF para facturación
        address: '', // Dirección de entrega predeterminada
        address_2: '',
        town: '',
        postal_code: '',
        phone: '',   // Teléfono de contacto
        email: ''    // Email (solo lectura, gestionado por Auth)
    });

    // --- ESTADO: Cambio de seguridad ---
    const [passData, setPassData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [success, setSuccess] = useState(''); // Mensaje de éxito
    const [error, setError] = useState('');     // Mensaje de error
    const [loading, setLoading] = useState(false); // Bloqueo de botones durante la persistencia

    /**
     * EFECTO: Carga de datos del perfil.
     * Sincroniza el formulario con la información almacenada en la base de datos.
     */
    useEffect(() => {
        const loadProfile = async () => {
            const user = AuthService.getCurrentUser();
            if (user) {
                // Consultamos el adaptador para obtener los campos extendidos (DNI, Dirección, etc.)
                const freshUser = await DbAdapter.getUserById(user.id);
                if (freshUser) {
                    setFormData({
                        name: freshUser.full_name || freshUser.name || '',
                        dni: freshUser.dni || '',
                        address: freshUser.address || '',
                        address_2: freshUser.address_2 || '',
                        town: freshUser.town || '',
                        postal_code: freshUser.postal_code || '',
                        phone: freshUser.phone || '',
                        email: freshUser.email || user.email || ''
                    });
                }
            }
        };
        loadProfile();
    }, []);

    // Handlers genéricos para inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const handlePassChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    /**
     * Persiste los cambios del perfil en Supabase/LocalStorage.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.address || !formData.town) {
            setError('Debes seleccionar una dirección válida en el mapa usando el buscador.');
            return;
        }

        setLoading(true);

        try {
            const user = AuthService.getCurrentUser();

            // Sincronizamos con el adaptador
            await DbAdapter.updateUser(user.id, {
                name: formData.name,
                dni: formData.dni,
                address: formData.address,
                address_2: formData.address_2,
                town: formData.town,
                postal_code: formData.postal_code,
                phone: formData.phone
            });

            setSuccess('Datos de perfil actualizados correctamente.');
        } catch (err) {
            setError('Error al actualizar el perfil: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Gestiona el cambio de contraseña.
     * @important Utiliza la API de Auth de Supabase a través del DbAdapter.
     */
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validaciones básicas de seguridad en cliente
        if (passData.new !== passData.confirm) {
            setError('Las nuevas contraseñas no coinciden entre sí.');
            return;
        }

        if (passData.new.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await DbAdapter.updatePassword(passData.new);
            setSuccess('Tu contraseña ha sido actualizada con éxito.');
            setPassData({ current: '', new: '', confirm: '' }); // Reseteamos el formulario
        } catch (err) {
            setError('Error al cambiar la contraseña: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Mi Perfil</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Datos Personales */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)' }}>
                        <User size={24} /> Datos de Facturación
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label htmlFor="pf-name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre Fiscal / Razón Social</label>
                            <input type="text" id="pf-name" name="name" value={formData.name} onChange={handleChange} required />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label htmlFor="pf-dni" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>DNI / CIF</label>
                                <input type="text" id="pf-dni" name="dni" value={formData.dni} onChange={handleChange} />
                            </div>
                            <div>
                                <label htmlFor="pf-phone" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Teléfono</label>
                                <input type="text" id="pf-phone" name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                <MapTrifold size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Dirección Principal (Buscador Automático)
                            </label>
                            {/* Wait for initial load to render AddressAutocomplete correctly if we have data */}
                            {formData.email !== '' && (
                                <AddressAutocomplete
                                    initialValue={formData.address}
                                    onSelect={handleAddressSelect}
                                    required={true}
                                />
                            )}
                            <small style={{ color: 'var(--color-text-secondary)', display: 'block', margin: '0.25rem 0 1rem' }}>Escribe tu calle y elige en el desplegable para validar.</small>
                        </div>

                        <div>
                            <label htmlFor="pf-address-2" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Detalles (Piso, Puerta, Nave...)</label>
                            <input type="text" id="pf-address-2" name="address_2" value={formData.address_2} onChange={handleChange} placeholder="Opcional" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label htmlFor="pf-town" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Población (Auto)</label>
                                <input type="text" id="pf-town" name="town" value={formData.town} readOnly style={{ background: 'rgba(0,0,0,0.1)', cursor: 'not-allowed', color: 'var(--color-text-secondary)' }} />
                            </div>
                            <div>
                                <label htmlFor="pf-pc" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>C. Postal (Auto)</label>
                                <input type="text" id="pf-pc" name="postal_code" value={formData.postal_code} readOnly style={{ background: 'rgba(0,0,0,0.1)', cursor: 'not-allowed', color: 'var(--color-text-secondary)' }} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="pf-email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                            <input type="email" id="pf-email" name="email" value={formData.email} disabled style={{ opacity: 0.7 }} />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            <FloppyDisk size={20} /> Guardar Cambios
                        </button>
                    </form>
                </div>

                {/* Seguridad */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)' }}>
                        <Key size={24} /> Seguridad
                    </h3>
                    <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label htmlFor="pf-newpass" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nueva Contraseña</label>
                            <input type="password" id="pf-newpass" name="new" value={passData.new} onChange={handlePassChange} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                        </div>
                        <div>
                            <label htmlFor="pf-confirmpass" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Confirmar Nueva</label>
                            <input type="password" id="pf-confirmpass" name="confirm" value={passData.confirm} onChange={handlePassChange} placeholder="Repite la contraseña" autoComplete="new-password" />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            <Key size={20} /> Actualizar Contraseña
                        </button>
                    </form>
                </div>

            </div>

            {/* Feedback General */}
            {success && <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>{success}</div>}
            {error && <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>{error}</div>}

        </div>
    );
}
