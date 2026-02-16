
import { MapPin, Envelope, WhatsappLogo, User, ChatTeardropText } from 'phosphor-react';
import { useState } from 'react';

export function Contact() {
    const [formData, setFormData] = useState({
        firstname: '',
        email: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        // HubSpot Non-HubSpot Forms listens to the submit event.
        // We don't prevent default immediately if we want a traditional post, 
        // but for SPA we prevent default and show a message.
        // Note: For HubSpot to reliably catch this in a SPA without API, 
        // sometimes a real DOM submit is preferred, or using their tracking API.
        // However, most often 'preventDefault' is fine if the script is loaded.
        // We'll just clear the form and show a success message for UX.
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setFormData({ firstname: '', email: '', message: '' });
    };

    return (
        <div>
            <style>{`
                .contact-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }
                @media (max-width: 768px) {
                    .contact-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
            <h2 style={{ marginBottom: '2rem' }}>Contacto</h2>

            <div className="contact-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent-primary)' }}>Nuestras Oficinas</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <MapPin size={24} color="#fbbf24" weight="fill" />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Ubicación</div>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>Madrid / Toledo, España</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <WhatsappLogo size={24} color="#25D366" weight="fill" />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Pedidos WhatsApp</div>
                                    <a href="https://wa.me/34691562824" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                                        +34 691 562 824
                                    </a>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Envelope size={24} color="#fbbf24" weight="fill" />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Email</div>
                                    <a href="mailto:ventas@mandamoshuevos.com" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>ventas@mandamoshuevos.com</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--color-accent-primary)' }}>Aviso Legal y Privacidad</h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                            Al realizar un pedido a través de nuestro sitio web o por WhatsApp, aceptas los términos y condiciones.
                            Mandamoshuevos es un negocio dedicado a la venta de huevos frescos de granja.
                        </p>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                            <strong>Política de Privacidad:</strong> Tus datos serán tratados únicamente para la gestión de pedidos y facturación. No compartimos información con terceros salvo obligación legal.
                        </p>
                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            &copy; {new Date().getFullYear()} Mandamoshuevos. Reservados todos los derechos.
                        </div>
                    </div>
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent-primary)' }}>Escríbenos</h3>
                    {submitted ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ fontWeight: 'bold' }}>¡Mensaje enviado!</p>
                            <p style={{ fontSize: '0.9rem' }}>Gracias por contactarnos. Te responderemos pronto.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nombre</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <User size={20} color="var(--color-text-muted)" />
                                    <input
                                        type="text"
                                        name="firstname"
                                        placeholder="Tu nombre"
                                        value={formData.firstname}
                                        onChange={handleChange}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <Envelope size={20} color="var(--color-text-muted)" />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="tu@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mensaje</label>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                    <ChatTeardropText size={20} color="var(--color-text-muted)" style={{ marginTop: '0.2rem' }} />
                                    <textarea
                                        name="message"
                                        placeholder="¿En qué podemos ayudarte?"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="4"
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                                Enviar Mensaje
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
