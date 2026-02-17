import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewOrder } from '../pages/NewOrder';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../services/auth.service', () => ({
    AuthService: {
        getCurrentUser: vi.fn().mockReturnValue({ id: 'user123', email: 'test@example.com' })
    }
}));

vi.mock('../services/db.adapter', () => ({
    DbAdapter: {
        getUserById: vi.fn().mockResolvedValue({ discount_percent: 0, address: 'Test Address' })
    }
}));

vi.mock('../services/order.service', () => {
    return {
        OrderService: {
            createOrder: vi.fn().mockResolvedValue({})
        },
        PRODUCTS: [
            { id: 'carton-xl', name: 'Cartón XL', price: 5.5, category: 'individual', image: '🥚' }
        ],
        LOGISTICS_INFO: {
            schedule: 'Test Schedule',
            zones: [
                { days: 'Lunes', areas: ['Area 1', 'Town'], cutoff: '20:00' }
            ]
        },
        ALL_TOWNS: ['Test Town'],
        getDeliveryDaysForTown: vi.fn().mockReturnValue([1, 2, 3, 4, 5])
    };
});

describe('NewOrder Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow flow: Add to Cart -> Checkout -> See Payment Options', async () => {
        render(
            <BrowserRouter>
                <NewOrder />
            </BrowserRouter>
        );

        // 1. Add item to cart
        const addButton = screen.getByText('+');
        fireEvent.click(addButton);

        // 2. Click "Tramitar Pedido" (Checkout)
        // Accessing the button might be tricky if multiple, looks for unique text
        const checkoutButton = screen.getByText('Tramitar Pedido');
        fireEvent.click(checkoutButton);

        // 3. Verify we are on Step 2 and can see "Al contado"
        const cashOption = await screen.findByText(/Al contado/i);
        expect(cashOption).toBeInTheDocument();

        // 4. Verify total is visible
        expect(screen.getByText(/Total a Pagar/i)).toBeInTheDocument();
    });
});
