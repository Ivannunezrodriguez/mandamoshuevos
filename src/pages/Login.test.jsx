import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../pages/Login';
import { BrowserRouter } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

// Mock AuthService
vi.mock('../services/auth.service', () => ({
    AuthService: {
        login: vi.fn(),
        getCurrentUser: vi.fn().mockReturnValue(null), // Initially not logged in
        isAuthenticated: vi.fn().mockReturnValue(false),
        completeLogin: vi.fn()
    }
}));

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        // Use precise placeholders from source code
        expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('calls AuthService.login on submit', async () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password' } });

        const loginButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(AuthService.login).toHaveBeenCalledWith('test@test.com', 'password');
        });
    });
});
