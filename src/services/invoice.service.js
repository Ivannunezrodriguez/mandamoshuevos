/**
 * SERVICIO DE FACTURACIÓN (InvoiceService)
 * 
 * Este servicio se encarga de la generación dinámica de facturas en formato PDF
 * utilizando la librería jsPDF y jsPDF-AutoTable para la tabla de productos.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InvoiceService = {
    /**
     * Genera y descarga una factura en PDF para un pedido específico.
     * @param {Object} order - Los datos del pedido (productos, total, fecha, método de pago, etc.).
     * @param {Object} user - Los datos del cliente (nombre o email, dirección, DNI/NIF, teléfono).
     */
    generateInvoice: (order, user) => {
        // Inicializamos una nueva instancia de jsPDF en formato A4 (por defecto)
        const doc = new jsPDF();

        // CONFIGURACIÓN BÁSICA DE LA PÁGINA
        const pageWidth = doc.internal.pageSize.width; // Ancho total de la página (aprox 210mm)
        const margin = 20; // Margen uniforme a los lados
        const centerX = pageWidth / 2; // Centro de la página para alineaciones

        // --- CABECERA ESTILIZADA ---
        // Dibujamos un rectángulo oscuro en la parte superior para dar un aspecto premium a la factura
        doc.setFillColor(23, 23, 23); // Color: Gris casi negro
        doc.rect(0, 0, 210, 45, 'F'); // (X, Y, Ancho, Alto, Estilo 'Fill')

        // Título principal con el nombre de la marca (Blanco y centrado)
        doc.setTextColor(255, 255, 255); // Texto blanco
        doc.setFontSize(22); // Tamaño de fuente grande
        doc.text('mandamoshuevos', centerX, 15, { align: 'center' }); // Título en el centro

        // Información legal y de contacto de la empresa
        doc.setFontSize(8); // Tamaño de fuente pequeño para la info legal
        doc.setTextColor(200, 200, 200); // Texto gris claro
        doc.text('CIF: B01782853', centerX, 30, { align: 'center' });
        doc.text('ventas@mandamoshuevos.com | +34 691 562 824', centerX, 35, { align: 'center' });
        doc.text('www.mandamoshuevos.com', centerX, 40, { align: 'center' });

        // Título del documento ("FACTURA") en amarillo corporativo para que resalte
        doc.setFontSize(14);
        doc.setTextColor(251, 191, 36); // Color amarillo
        doc.text('FACTURA', 190, 15, { align: 'right' }); // Alineado a la derecha


        // --- SECCIÓN DE CLIENTE Y DATOS DE FACTURA ---
        doc.setTextColor(0, 0, 0); // Volvemos al texto negro normal para el cuerpo del documento
        const contentStartY = 60; // Punto Y donde empieza el contenido principal

        // COLUMNA IZQUIERDA: DATOS DEL CLIENTE
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold'); // Texto en negrita para el subtítulo
        doc.text('FACTURAR A:', margin, contentStartY);
        doc.setFont(undefined, 'normal'); // Volvemos a fuente normal

        doc.setFontSize(10); // Fuente estándar para los datos
        // Extraemos los datos del cliente con fallbacks (valores por defecto si no existen)
        const customerName = user.full_name || user.name || user.email || 'Cliente';
        const customerAddress = order.shippingAddress || user.address || 'No especificada';
        const customerAddress2 = order.shippingAddress2 || user.address_2 || '';
        const customerTown = order.shippingTown || user.town || '';
        const customerPC = order.shippingPostalCode || user.postal_code || '';
        const customerPhone = user.phone || 'No especificado';
        const customerDni = user.dni || user.nif || '';

        let yPos = contentStartY + 10; // Posición Y inicial para listar los datos
        const lineHeight = 5; // Altura de cada línea de texto

        // Imprimimos la información del cliente línea por línea
        doc.text(`Nombre: ${customerName}`, margin, yPos); yPos += lineHeight;
        if (customerDni) { doc.text(`DNI/CIF: ${customerDni}`, margin, yPos); yPos += lineHeight; }
        doc.text(`Dirección: ${customerAddress}`, margin, yPos); yPos += lineHeight;
        if (customerAddress2) { doc.text(`Dirección 2: ${customerAddress2}`, margin, yPos); yPos += lineHeight; }
        if (customerPC) { doc.text(`C.P.: ${customerPC}`, margin, yPos); yPos += lineHeight; }
        if (customerTown) { doc.text(`Localidad: ${customerTown}`, margin, yPos); yPos += lineHeight; }
        doc.text(`Tel: ${customerPhone}`, margin, yPos);


        // COLUMNA DERECHA: METADATOS DE LA FACTURA
        const labelX = 120; // Posición X para las etiquetas (ej. "Nº Factura:")
        const valueX = 190; // Posición X para los valores, alineados a la derecha

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS FACTURA', labelX, contentStartY);
        doc.setFont(undefined, 'normal');

        doc.setFontSize(10);
        yPos = contentStartY + 10; // Reiniciamos Y al nivel del bloque derecho
        const date = new Date(order.createdAt).toLocaleDateString(); // Formateamos la fecha

        // Número de factura
        doc.text('Nº Factura:', labelX, yPos);
        doc.text(order.invoiceNumber, valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        // Fecha de la factura
        doc.text('Fecha:', labelX, yPos);
        doc.text(date, valueX, yPos, { align: 'right' });
        yPos += lineHeight;

        // Método de pago
        doc.text('Método Pago:', labelX, yPos);
        const paymentLabel = order.paymentMethod === 'transfer' ? 'Transferencia' : order.paymentMethod === 'bizum' ? 'Bizum' : 'Al contado';
        doc.text(paymentLabel, valueX, yPos, { align: 'right' });


        // --- TABLA DE PRODUCTOS ---
        // Definimos las columnas y extraemos las filas del pedido
        const tableColumn = ["Producto", "Cant.", "Precio Un.", "Total"];
        const tableRows = order.items.map(item => [
            item.name || `Producto ${item.id}`,
            item.quantity,
            `${item.price.toFixed(2)} €`,
            `${(item.quantity * item.price).toFixed(2)} €` // Total por línea
        ]);

        // Generamos la tabla automáticamente usando jspdf-autotable
        autoTable(doc, {
            startY: 105, // Empezamos a la altura Y=105
            head: [tableColumn],
            body: tableRows,
            theme: 'striped', // Tema con filas alternadas
            headStyles: {
                fillColor: [251, 191, 36], // Cabecera amarilla
                textColor: [0, 0, 0], // Texto de cabecera negro
                fontStyle: 'bold'
            },
            styles: { fontSize: 10 },
            alternateRowStyles: { fillColor: [249, 250, 251] } // Gris muy claro para filas pares
        });

        // --- DESGLOSE DE TOTALES E IMPUESTOS ---
        // Calculamos la posición Y basándonos en donde terminó la tabla
        const finalY = doc.lastAutoTable.finalY + 10;

        // Cálculos de IVA (10% de ejemplo para alimentos)
        const ivaRate = 0.10;
        const totalAmount = order.total;
        const taxBase = totalAmount / (1 + ivaRate); // Base imponible sin IVA
        const taxAmount = totalAmount - taxBase; // Cantidad total del IVA

        const totalLabelX = 140; // X para las etiquetas de total
        const totalValueX = 190; // X para los valores de total (alineados a la derecha)

        doc.setFontSize(10);
        // Base Imponible
        doc.text(`Base Imponible:`, totalLabelX, finalY);
        doc.text(`${taxBase.toFixed(2)} €`, totalValueX, finalY, { align: 'right' });

        // IVA aplicado
        doc.text(`IVA (10%):`, totalLabelX, finalY + 6);
        doc.text(`${taxAmount.toFixed(2)} €`, totalValueX, finalY + 6, { align: 'right' });

        // Total final en tamaño más grande y negrita
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL:`, totalLabelX, finalY + 14);
        doc.text(`${totalAmount.toFixed(2)} €`, totalValueX, finalY + 14, { align: 'right' });

        // --- PIE DE PÁGINA ---
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150); // Texto gris para el mensaje de agradecimiento
        doc.text('Gracias por su confianza.', margin, finalY + 30);

        // Texto legal o de contacto al pie de la página, dividido si es muy largo
        const footerText = "mandamoshuevos | ventas@mandamoshuevos.com | +34 691 562 824";
        const splitFooter = doc.splitTextToSize(footerText, pageWidth - (margin * 2));
        doc.text(splitFooter, centerX, 280, { align: 'center' }); // Posicionamos casi al final de la página (Y=280)

        // GUARDADO AUTOMÁTICO
        // Dispara la descarga del PDF en el navegador del usuario
        doc.save(`factura_${order.invoiceNumber}.pdf`);
    }
};
