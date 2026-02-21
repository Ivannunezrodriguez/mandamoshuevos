
import { Link } from 'react-router-dom';

/**
 * Componente Legal
 * 
 * Contiene los textos legales obligatorios: Aviso Legal y Política de Privacidad,
 * adaptados a la normativa LSSICE y RGPD.
 */
export function Legal() {
    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem', color: 'var(--color-accent-primary)' }}>Aviso Legal y Política de Privacidad</h2>

            <section style={{ marginBottom: '2rem' }}>
                <h3>Aviso Legal</h3>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
                    En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), el propietario de la web, le informa de lo siguiente:
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li><strong>Denominación social:</strong> MandamosHuevos S.L.</li>
                    <li><strong>NIF:</strong> B-12345678</li>
                    <li><strong>Domicilio:</strong> Polígono Industrial El Huevo, Nave 3, Madrid, España</li>
                    <li><strong>Email:</strong> ventas@mandamoshuevos.com</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h3>Política de Privacidad</h3>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
                    Los datos facilitados mediante este formulario serán incorporados a un fichero titularidad de MandamosHuevos S.L. con la finalidad de gestionar su pedido.
                </p>
                <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
                    Puede ejercer sus derechos de acceso, rectificación, cancelación y oposición dirigiendo un escrito a nuestra dirección o email.
                </p>
            </section>
        </div>
    );
}
