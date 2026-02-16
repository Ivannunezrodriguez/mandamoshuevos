
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InvoiceService = {
    generateInvoice: (order, user) => {
        const doc = new jsPDF();

        // Configuración
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const centerX = pageWidth / 2;

        // --- CABECERA ---
        // Fondo oscuro
        doc.setFillColor(23, 23, 23);
        doc.rect(0, 0, 210, 45, 'F');

        // Título Principal (Centrado)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('mandamoshuevos', centerX, 15, { align: 'center' });



        // Datos de la Empresa (Centrado)
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        doc.text('CIF: B01782853', centerX, 30, { align: 'center' });
        doc.text('ventas@mandamoshuevos.com | +34 691 562 824', centerX, 35, { align: 'center' });
        "doc.text('www.mandamoshuevos.com', centerX, 40, { align: 'center' });"
        // Etiqueta "FACTURA" (Esquina superior derecha)
        doc.setFontSize(14);
        doc.setTextColor(251, 191, 36); // Color amarillo corporativo
        doc.text('FACTURA', 190, 15, { align: 'right' });


        // --- CUERPO DEL DOCUMENTO (2 COLUMNAS) ---
        doc.setTextColor(0, 0, 0);
        const contentStartY = 60;

        // COLUMNA IZQUIERDA: FACTURAR A (CLIENTE)
        // Alineado al margen izquierdo (20)
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('FACTURAR A:', margin, contentStartY);
        doc.setFont(undefined, 'normal');

        doc.setFontSize(10);
        const customerName = user.full_name || user.name || user.email || 'Cliente';
        const customerAddress = order.shippingAddress || user.address || 'No especificada';
        const customerTown = order.shippingTown || (order.deliveryDate ? 'Entrega Programada' : '');
        const customerPhone = user.phone || 'No especificado';
        const customerDni = user.dni || user.nif || '';

        let yPos = contentStartY + 10;
        const lineHeight = 5;

        doc.text(`Nombre: ${customerName}`, margin, yPos); yPos += lineHeight;
        if (customerDni) { doc.text(`DNI/CIF: ${customerDni}`, margin, yPos); yPos += lineHeight; }
        doc.text(`Dirección: ${customerAddress}`, margin, yPos); yPos += lineHeight;
        if (customerTown) { doc.text(`Localidad: ${customerTown}`, margin, yPos); yPos += lineHeight; }
        doc.text(`Tel: ${customerPhone}`, margin, yPos);


        // COLUMNA DERECHA: DATOS FACTURA
        // Alineado a la derecha, pero con estructura tabular
        // Labels en x=120, Valores en x=190 (Right Align)
        const labelX = 120;
        const valueX = 190;

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS FACTURA', labelX, contentStartY);
        doc.setFont(undefined, 'normal');

        doc.setFontSize(10);
        yPos = contentStartY + 10;
        const date = new Date(order.createdAt).toLocaleDateString();

        // Fila 1: Nº Factura
        doc.text('Nº Factura:', labelX, yPos);
        doc.text(order.invoiceNumber, valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        // Fila 2: Fecha
        doc.text('Fecha:', labelX, yPos);
        doc.text(date, valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        // Fila 3: Método Pago
        doc.text('Método Pago:', labelX, yPos);
        doc.text(order.paymentMethod === 'transfer' ? 'Transferencia' : order.paymentMethod === 'bizum' ? 'Bizum' : 'Al contado', valueX, yPos, { align: 'right' });


        // --- TABLA PRODUCTOS ---
        const tableColumn = ["Producto", "Cant.", "Precio Un.", "Total"];
        const tableRows = order.items.map(item => [
            item.name || `Producto ${item.id}`,
            item.quantity,
            `${item.price.toFixed(2)} €`,
            `${(item.quantity * item.price).toFixed(2)} €`
        ]);

        autoTable(doc, {
            startY: 105,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: {
                fillColor: [251, 191, 36],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            styles: { fontSize: 10 },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        // --- TOTALES ---
        const finalY = doc.lastAutoTable.finalY + 10;

        const ivaRate = 0.10;
        const totalAmount = order.total;
        const taxBase = totalAmount / (1 + ivaRate);
        const taxAmount = totalAmount - taxBase;

        // Totales tabulados a la derecha
        const totalLabelX = 140;
        const totalValueX = 190;

        doc.setFontSize(10);
        doc.text(`Base Imponible:`, totalLabelX, finalY);
        doc.text(`${taxBase.toFixed(2)} €`, totalValueX, finalY, { align: 'right' });

        doc.text(`IVA (10%):`, totalLabelX, finalY + 6);
        doc.text(`${taxAmount.toFixed(2)} €`, totalValueX, finalY + 6, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL:`, totalLabelX, finalY + 14);
        doc.text(`${totalAmount.toFixed(2)} €`, totalValueX, finalY + 14, { align: 'right' });

        // --- PIE DE PÁGINA ---
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150);
        doc.text('Gracias por su confianza.', margin, finalY + 30);

        const footerText = "mandamoshuevos | ventas@mandamoshuevos.com | +34 691 562 824";
        const splitFooter = doc.splitTextToSize(footerText, pageWidth - (margin * 2));
        doc.text(splitFooter, centerX, 280, { align: 'center' });

        doc.save(`factura_${order.invoiceNumber}.pdf`);
    }
};
