import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { DbAdapter } from '../services/db.adapter';

// Mock DbAdapter
vi.mock('../services/db.adapter', () => ({
    DbAdapter: {
        authenticate: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn()
    }
}));

describe('AuthService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should login successfully when DbAdapter returns a user', async () => {
        const mockUser = { id: '123', email: 'test@test.com' };
        DbAdapter.authenticate.mockResolvedValue(mockUser);

        const result = await AuthService.login('test@test.com', 'password');

        expect(DbAdapter.authenticate).toHaveBeenCalledWith('test@test.com', 'password');
        expect(result).toEqual(mockUser);
    });

    it('should throw error when login fails', async () => {
        DbAdapter.authenticate.mockResolvedValue(null);

        await expect(AuthService.login('wrong', 'pass')).rejects.toThrow('Credenciales inválidas');
    });

    it('should handle logout', () => {
        localStorage.setItem('mandamoshuevos_current_user', JSON.stringify({ id: '1' }));
        AuthService.logout();
        expect(localStorage.getItem('mandamoshuevos_current_user')).toBeNull();
    });

    it('should return current user from localStorage', () => {
        const user = { id: '1', name: 'Test' };
        localStorage.setItem('mandamoshuevos_current_user', JSON.stringify(user));

        expect(AuthService.getCurrentUser()).toEqual(user);
    });
});
