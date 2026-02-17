import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../services/admin.service';
import jsPDF from 'jspdf';

vi.mock('jspdf', () => {
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
        lastAutoTable: { finalY: 100 },
        addPage: vi.fn()
    };

    return {
        default: class MockJsPDF {
            constructor() {
                return mockInstance;
            }
        }
    };
});

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

vi.mock('./db.adapter', () => ({
    DbAdapter: {
        getUserById: vi.fn().mockResolvedValue({ full_name: 'Test User' })
    }
}));

describe('AdminService', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('should generate delivery note with "Al contado"', () => {
        const mockOrder = {
            invoiceNumber: 'ALB-001',
            createdAt: new Date().toISOString(),
            deliveryDate: new Date().toISOString(),
            paymentMethod: 'cash',
            items: [],
            total: 100,
            userId: 'test@example.com'
        };
        const mockProfile = { full_name: 'Test Profile' };

        AdminService.generateDeliveryNote(mockOrder, mockProfile);
        const doc = new jsPDF();

        expect(doc.text).toHaveBeenCalledWith('mandamoshuevos', expect.any(Number), expect.any(Number), expect.objectContaining({ align: 'center' }));
        expect(doc.text).toHaveBeenCalledWith('ALBARÁN DE ENTREGA', expect.any(Number), expect.any(Number), expect.objectContaining({ align: 'right' }));

        const calls = doc.text.mock.calls;
        const hasAlContado = calls.some(call => call[0] === 'Al contado');
        expect(hasAlContado).toBe(true);
    });
});
