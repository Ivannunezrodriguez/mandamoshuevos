
import { useLocation, Link } from 'react-router-dom';
import { DeviceMobile, CheckCircle, Info, Copy, ArrowLeft } from 'phosphor-react';
import { useState } from 'react';

export function BizumPayment() {
    const location = useLocation();
    const orderData = location.state?.order || {};
    const [copied, setCopied] = useState(false);

    // Datos de contacto para Bizum (Estos deberían venir de una configuración global)
    const BIZUM_PHONE = "633 44 22 11";
    const BIZUM_NAME = "Mandahuevos";

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <ArrowLeft /> Volver al inicio
                </Link>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(0, 185, 188, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        border: '2px solid #00B9BC'
                    }}>
                        <DeviceMobile size={40} color="#00B9BC" weight="bold" />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Pago por Bizum</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Tu pedido ha sido registrado. Completa el pago para procesarlo.</p>
                </div>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: '1px solid var(--color-border)'
                }}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Número de Teléfono</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.2rem', color: 'var(--color-accent-primary)' }}>{BIZUM_PHONE}</strong>
                            <button
                                onClick={() => copyToClipboard(BIZUM_PHONE)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                                title="Copiar número"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Importe Total</span>
                        <strong style={{ fontSize: '1.2rem' }}>{orderData.total || '0.00'} €</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Concepto (Nº Pedido)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.1rem' }}>{orderData.invoice_number || 'PEDIDO'}</strong>
                            <button
                                onClick={() => copyToClipboard(orderData.invoice_number)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                                title="Copiar concepto"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {copied && (
                    <div style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-accent-primary)',
                        color: 'black',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <CheckCircle weight="fill" /> Copiado al portapapeles
                    </div>
                )}

                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={20} /> Pasos a seguir:
                    </h3>
                    <ol style={{ paddingLeft: '1.2rem', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                        <li>Abre la app de tu banco y selecciona <strong>Bizum</strong>.</li>
                        <li>Elige "Enviar dinero" e introduce el número <strong>{BIZUM_PHONE}</strong>.</li>
                        <li>Introduce el importe exacto: <strong>{orderData.total} €</strong>.</li>
                        <li>En el concepto, escribe el número de pedido: <strong>{orderData.invoice_number}</strong>.</li>
                        <li>Confirma la operación y ¡listo!</li>
                    </ol>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Link to="/history" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Ver mis pedidos
                    </Link>
                    <Link to="/" style={{ textAlign: 'center', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        Volver a la tienda
                    </Link>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.05)', border: '1px dashed #FFC107', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#FFC107', textAlign: 'center' }}>
                    Nota: Los pedidos por Bizum se procesarán una vez hayamos confirmado la recepción del dinero.
                </div>
            </div>
        </div>
    );
}
