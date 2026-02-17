import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../pages/AdminDashboard';
import { BrowserRouter } from 'react-router-dom';
import { DbAdapter } from '../services/db.adapter';

// Mock Services to avoid loading jsPDF or other heavy/unsupported libs
vi.mock('../services/invoice.service', () => ({
    InvoiceService: {
        generateInvoice: vi.fn()
    }
}));

vi.mock('../services/admin.service', () => ({
    AdminService: {
        generateDeliveryNote: vi.fn(),
        generateBulkDeliveryNotes: vi.fn()
    }
}));

vi.mock('../services/order.service', () => ({
    OrderService: {
        getProducts: vi.fn().mockReturnValue([{ id: 'p1', name: 'Product 1', price: 10 }])
    }
}));

// Mock Dependencies
vi.mock('../services/auth.service', () => ({
    AuthService: {
        getCurrentUser: vi.fn().mockReturnValue({ id: 'admin', email: 'admin@test.com' })
    }
}));

vi.mock('../services/db.adapter', () => ({
    DbAdapter: {
        getUserById: vi.fn().mockResolvedValue({ role: 'admin' }),
        getAllOrders: vi.fn().mockResolvedValue([
            { id: '1', invoiceNumber: 'INV-100', userId: 'user1', total: 50, status: 'pending', items: [], createdAt: new Date().toISOString() }
        ]),
        getAllUsers: vi.fn().mockResolvedValue([]),
        getInventory: vi.fn().mockResolvedValue([])
    }
}));

describe.skip('AdminDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders orders list', async () => {
        render(
            <BrowserRouter>
                <AdminDashboard />
            </BrowserRouter>
        );

        // Wait for orders to load
        await waitFor(() => {
            expect(screen.getByText('INV-100')).toBeInTheDocument();
        });

        // Check if status is rendered
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
});
