
import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';
import { User, FloppyDisk, DownloadSimple, Key } from 'phosphor-react';

export function Profile() {
    const [formData, setFormData] = useState({
        name: '',
        dni: '',
        address: '',
        phone: '',
        email: ''
    });
    const [passData, setPassData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const user = AuthService.getCurrentUser();
            if (user) {
                // Recargar datos frescos del adaptador
                const freshUser = await DbAdapter.getUserById(user.id);
                if (freshUser) {
                    setFormData({
                        name: freshUser.full_name || freshUser.name || '',
                        dni: freshUser.dni || '',
                        address: freshUser.address || '',
                        phone: freshUser.phone || '',
                        email: freshUser.email || user.email || ''
                    });
                }
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePassChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const user = AuthService.getCurrentUser();

            // Actualizar Perfil
            await DbAdapter.updateUser(user.id, {
                name: formData.name,
                dni: formData.dni,
                address: formData.address,
                phone: formData.phone
            });

            setSuccess('Datos de perfil actualizados.');
        } catch (err) {
            setError('Error al actualizar perfil: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passData.new !== passData.confirm) {
            setError('Las contraseñas nuevas no coinciden');
            return;
        }

        if (passData.new.length < 6) {
            setError('La contraseña es muy corta');
            return;
        }

        setLoading(true);
        try {
            await DbAdapter.updatePassword(passData.new);
            setSuccess('Contraseña actualizada correctamente.');
            setPassData({ current: '', new: '', confirm: '' });
        } catch (err) {
            setError('Error al cambiar contraseña: ' + err.message);
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
                            <label htmlFor="pf-address" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Dirección</label>
                            <input type="text" id="pf-address" name="address" value={formData.address} onChange={handleChange} />
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
