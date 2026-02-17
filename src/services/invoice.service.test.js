import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceService } from '../services/invoice.service';
import jsPDF from 'jspdf';

vi.mock('jspdf', () => {
    // Define instance INSIDE factory to avoid hoisting issues
    const mockInstance = {
        internal: { pageSize: { width: 210 } },
        setFillColor: vi.fn(),
        rect: vi.fn(),
        setTextColor: vi.fn(),
        setFontSize: vi.fn(),
        text: vi.fn(),
        setFont: vi.fn(),
        splitTextToSize: vi.fn((text) => text),
        save: vi.fn(),
        lastAutoTable: { finalY: 100 }
    };

    return {
        default: class MockJsPDF {
            constructor() {
                return mockInstance;
            }
        }
    };
});

vi.mock('jspdf-autotable', () => ({
    default: vi.fn()
}));

describe('InvoiceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate invoice with "Al contado" payment method', () => {
        const mockOrder = {
            invoiceNumber: 'INV-001',
            createdAt: new Date().toISOString(),
            paymentMethod: 'cash',
            items: [],
            total: 100
        };
        const mockUser = { full_name: 'Test User' };

        InvoiceService.generateInvoice(mockOrder, mockUser);

        // Capture the instance
        const doc = new jsPDF();

        expect(doc.text).toHaveBeenCalledWith('mandamoshuevos', expect.any(Number), expect.any(Number), expect.objectContaining({ align: 'center' }));

        const calls = doc.text.mock.calls;
        const hasAlContado = calls.some(call => call[0] === 'Al contado');
        expect(hasAlContado).toBe(true);
    });

    it('should generate invoice with "MandamosHuevos" footer', () => {
        const mockOrder = { invoiceNumber: 'INV-002', createdAt: new Date().toISOString(), paymentMethod: 'transfer', items: [], total: 50 };
        const mockUser = {};

        InvoiceService.generateInvoice(mockOrder, mockUser);
        const doc = new jsPDF();

        expect(doc.splitTextToSize).toHaveBeenCalledWith(expect.stringContaining('mandamoshuevos |'), expect.any(Number));
    });
});
