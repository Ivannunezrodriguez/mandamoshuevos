
import { DbAdapter } from './db.adapter';

const CURRENT_USER_KEY = 'mandamoshuevos_current_user';

export const AuthService = {
  login: async (identifier, password) => {
    // Simular retardo UI
    await new Promise(resolve => setTimeout(resolve, 500));

    // Delegar autenticación al adaptador (Local o Supabase)
    const user = await DbAdapter.authenticate(identifier, password);

    if (user) {
      return user;
    }

    throw new Error('Credenciales inválidas');
  },

  completeLogin: (user) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // El registro en Supabase Auth se encarga de la unicidad del email.
    const newUser = await DbAdapter.createUser(userData);

    // Login automático al registrarse
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  updateProfile: async (userId, data) => {
    const updatedUser = await DbAdapter.updateUser(userId, data);
    return updatedUser;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(CURRENT_USER_KEY);
  },

  send2FACode: async (email) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`CODE SENT TO ${email}: 1234`);
    return true;
  },

  verify2FACode: async (code) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return code === '1234';
  },


};
