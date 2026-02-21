import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DbAdapter } from './db.adapter';
import { PRODUCTS } from './catalog.service';

/**
 * SERVICIO ADMINISTRATIVO (AdminService)
 * 
 * Contiene la lógica exclusiva para los administradores:
 * - Notificaciones de nuevos pedidos.
 * - Generación de albaranes de entrega (individuales y por lotes).
 * - Consultas globales de pedidos y perfiles.
 */
export const AdminService = {

    /**
     * Envía una notificación simulada cuando entra un nuevo pedido.
     * @param {Object} orderData - Datos resumidos del pedido.
     */
    notifyNewOrder: async (orderData) => {
        console.log(`[NOTIFICACIÓN] Enviando informe a ivann20@gmail.com sobre el pedido ${orderData.invoiceNumber || orderData.id}`);
        // TODO: Integrar con una API de correo real o funciones de Supabase
        return true;
    },

    /**
     * Genera un ALBARÁN DE ENTREGA en PDF.
     * A diferencia de la factura, el albarán es para el transportista y no incluye IVA detallado,
     * pero sí instrucciones de entrega y método de pago (si es "al contado").
     */
    generateDeliveryNote: (order, userProfile) => {
        const doc = new jsPDF();
        const primaryColor = [251, 191, 36]; // Amarillo corporativo

        // --- CABECERA ---
        const pageWidth = doc.internal.pageSize.width;
        const centerX = pageWidth / 2;

        doc.setFillColor(23, 23, 23);
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('mandamoshuevos', centerX, 15, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.text('CIF: B01782853', centerX, 30, { align: 'center' });
        doc.text('ventas@mandamoshuevos.com | +34 691 562 824', centerX, 35, { align: 'center' });
        doc.text('www.mandamoshuevos.com', centerX, 40, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(251, 191, 36);
        doc.text('ALBARÁN', 190, 15, { align: 'right' });

        // --- DATOS DEL CLIENTE ---
        doc.setTextColor(0, 0, 0);
        const contentStartY = 60;
        const margin = 20;

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL CLIENTE', margin, contentStartY);
        doc.setFont(undefined, 'normal');

        doc.setFontSize(10);
        let yPos = contentStartY + 10;
        const lineHeight = 5;

        doc.text(`Nombre: ${userProfile?.full_name || order.userId}`, margin, yPos); yPos += lineHeight;
        doc.text(`Dirección: ${order.shippingAddress || userProfile?.address || 'No especificada'}`, margin, yPos); yPos += lineHeight;
        const address2 = order.shippingAddress2 || userProfile?.address_2 || '';
        if (address2) {
            doc.text(`Dirección 2: ${address2}`, margin, yPos); yPos += lineHeight;
        }
        const pc = order.shippingPostalCode || userProfile?.postal_code || '';
        if (pc) {
            doc.text(`C.P.: ${pc}`, margin, yPos); yPos += lineHeight;
        }
        const town = order.shippingTown || userProfile?.town || '';
        if (town) {
            doc.text(`Localidad: ${town}`, margin, yPos); yPos += lineHeight;
        }
        doc.text(`Teléfono: ${userProfile?.phone || 'N/A'}`, margin, yPos);

        // --- INFORMACIÓN DE REPARTO ---
        const labelX = 120;
        const valueX = 190;

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL PEDIDO', labelX, contentStartY);
        doc.setFont(undefined, 'normal');

        doc.setFontSize(10);
        yPos = contentStartY + 10;

        doc.text('Nº Albarán:', labelX, yPos);
        doc.text(order.invoiceNumber || '---', valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        doc.text('Fecha Pedido:', labelX, yPos);
        doc.text(new Date(order.createdAt).toLocaleDateString(), valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        doc.text('Entrega:', labelX, yPos);
        doc.text(new Date(order.deliveryDate).toLocaleDateString(), valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        doc.text('Pago:', labelX, yPos);
        doc.text(order.paymentMethod === 'transfer' ? 'Transferencia' : order.paymentMethod === 'bizum' ? 'Bizum' : 'Al contado', valueX, yPos, { align: 'right' });

        // --- TABLA DE CARGA ---
        const products = PRODUCTS;
        const tableBody = order.items.map(item => {
            const product = products.find(p => p.id === item.id);
            return [
                product?.name || item.id,
                item.quantity,
                `${item.price.toFixed(2)} €`,
                `${(item.quantity * item.price).toFixed(2)} €`
            ];
        });

        autoTable(doc, {
            startY: 100,
            head: [['Producto', 'Cant.', 'Precio Un.', 'Total']],
            body: tableBody,
            headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        // TOTAL A COBRAR (Fundamental para pago 'al contado')
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`TOTAL: ${order.total.toFixed(2)} €`, 160, finalY);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150);
        doc.text('Gracias por su confianza.', margin, finalY + 30);

        const footerText = "mandamoshuevos | ventas@mandamoshuevos.com | +34 691 562 824";
        const splitFooter = doc.splitTextToSize(footerText, pageWidth - (margin * 2));
        doc.text(splitFooter, centerX, 280, { align: 'center' });

        doc.save(`albaran_${order.invoiceNumber}.pdf`);
    },

    /**
     * Obtiene todos los pedidos del sistema incluyendo los perfiles de usuario.
     */
    getOrdersWithProfiles: async () => {
        const orders = await DbAdapter.getAllOrders();
        return orders;
    },

    /**
     * Generación Masiva: Crea un PDF con múltiples páginas, un albarán por página.
     * @param {Array} orders - Lista de pedidos a imprimir.
     */
    generateBulkDeliveryNotes: async (orders) => {
        const doc = new jsPDF();

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];

            // Obtener perfil (puede ser lento en bucle, idealmente pasarlo ya cargado, pero para MVP ok)
            // Optimizacion: Usar Promise.all fuera o cachear, pero aquí hacemos fetch one-by-one safe
            let profile;
            try {
                // Reuse logic from DbAdapter to handle email/id
                profile = await DbAdapter.getUserById(order.userId);
            } catch (e) {
                console.warn("Error fetching profile for bulk print:", e);
                profile = { full_name: order.userId, email: order.userId };
            }

            if (i > 0) doc.addPage();

            // --- RENDER PAGE LOGIC (DUPLICATED FROM SIMPLER METHOD FOR ROBUSTNESS HERE) ---
            const primaryColor = [251, 191, 36]; // #fbbf24

            // Cabecera (Centrada)
            const pageWidth = doc.internal.pageSize.width;
            const centerX = pageWidth / 2;

            doc.setFillColor(23, 23, 23);
            doc.rect(0, 0, 210, 45, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('mandamoshuevos', centerX, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.text('MandamosHuevos S.L.', centerX, 22, { align: 'center' });

            doc.setFontSize(8);
            doc.setTextColor(200, 200, 200);
            doc.text('CIF: B01782853', centerX, 27, { align: 'center' });
            doc.text('Polígono Industrial El Huevo, Nave 3, 28000 Madrid', centerX, 32, { align: 'center' });
            doc.text('ventas@mandamoshuevos.com | +34 691 562 824', centerX, 37, { align: 'center' });

            // Título Documento
            doc.setFontSize(14);
            doc.setTextColor(251, 191, 36);
            doc.text('ALBARÁN DE ENTREGA', 190, 15, { align: 'right' });

            // Info Cliente (Columna Izquierda)
            doc.setTextColor(0, 0, 0);
            const contentStartY = 60;
            const margin = 20;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DEL CLIENTE', margin, contentStartY);
            doc.setFont(undefined, 'normal');

            doc.setFontSize(10);
            let yPos = contentStartY + 10;
            const lineHeight = 5;

            doc.text(`Nombre: ${profile?.full_name || order.userId}`, margin, yPos); yPos += lineHeight;
            doc.text(`Dirección: ${order.shippingAddress || profile?.address || 'No especificada'}`, margin, yPos); yPos += lineHeight;
            const bAddress2 = order.shippingAddress2 || profile?.address_2 || '';
            if (bAddress2) {
                doc.text(`Dirección 2: ${bAddress2}`, margin, yPos); yPos += lineHeight;
            }
            const bPC = order.shippingPostalCode || profile?.postal_code || '';
            if (bPC) {
                doc.text(`C.P.: ${bPC}`, margin, yPos); yPos += lineHeight;
            }
            const bTown = order.shippingTown || profile?.town || '';
            if (bTown) {
                doc.text(`Localidad: ${bTown}`, margin, yPos); yPos += lineHeight;
            }
            doc.text(`Teléfono: ${profile?.phone || 'N/A'}`, margin, yPos);

            // Info Pedido (Columna Derecha - Tabulada)
            const labelX = 120;
            const valueX = 190;

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DEL PEDIDO', labelX, contentStartY);
            doc.setFont(undefined, 'normal');

            doc.setFontSize(10);
            yPos = contentStartY + 10;

            doc.text('Nº Albarán:', labelX, yPos);
            doc.text(order.invoiceNumber || '---', valueX, yPos, { align: 'right' });
            yPos += lineHeight;

            doc.text('Fecha Pedido:', labelX, yPos);
            doc.text(new Date(order.createdAt).toLocaleDateString(), valueX, yPos, { align: 'right' });
            yPos += lineHeight;

            doc.text('Entrega:', labelX, yPos);
            doc.text(new Date(order.deliveryDate).toLocaleDateString(), valueX, yPos, { align: 'right' });
            yPos += lineHeight;

            doc.text('Pago:', labelX, yPos);
            doc.text(order.paymentMethod === 'transfer' ? 'Transferencia' : order.paymentMethod === 'bizum' ? 'Bizum' : 'Al contado', valueX, yPos, { align: 'right' });

            // Tabla
            const products = PRODUCTS;
            const tableBody = order.items.map(item => {
                const p = products.find(prod => prod.id === item.id);
                return [
                    p?.name || item.id,
                    item.quantity,
                    `${item.price.toFixed(2)} €`,
                    `${(item.quantity * item.price).toFixed(2)} €`
                ];
            });

            autoTable(doc, {
                startY: 100,
                head: [['Producto', 'Cant.', 'Precio Un.', 'Total']],
                body: tableBody,
                headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });
            // --- END RENDER ---
        }

        doc.save(`albaranes_lote_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
};
