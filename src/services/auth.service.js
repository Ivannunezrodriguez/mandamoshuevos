/**
 * SERVICIO DE AUTENTICACIÓN (AuthService)
 * 
 * Este servicio centraliza toda la lógica de acceso, registro y gestión de sesión.
 * Abstrae si los datos vienen de Supabase o del almacenamiento local.
 */
import { DbAdapter } from './db.adapter';

// Clave utilizada para guardar la sesión en el navegador
const CURRENT_USER_KEY = 'mandamoshuevos_current_user';

export const AuthService = {
  /**
   * Inicia sesión con email/usuario y contraseña.
   * @param {string} identifier - Email o nombre de usuario.
   * @param {string} password - Contraseña.
   */
  login: async (identifier, password) => {
    // Simulamos un pequeño retardo para mejorar la experiencia de usuario (feedback visual)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Delegamos la validación real en el adaptador de base de datos
    const user = await DbAdapter.authenticate(identifier, password);

    if (user) {
      return user;
    }

    throw new Error('Credenciales inválidas');
  },

  /**
   * Guarda los datos del usuario logueado en el almacenamiento local (Persistence).
   */
  completeLogin: (user) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  /**
   * Registra un nuevo cliente en el sistema.
   * @param {Object} userData - Datos del formulario de registro.
   */
  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // El DbAdapter se encarga de crear el usuario en Supabase Auth y en la tabla 'profiles'
    const newUser = await DbAdapter.createUser(userData);

    // Iniciamos sesión automáticamente tras el registro exitoso
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  /**
   * Actualiza la información del perfil del usuario (Dirección, teléfono, etc.).
   */
  updateProfile: async (userId, data) => {
    const updatedUser = await DbAdapter.updateUser(userId, data);
    return updatedUser;
  },

  /**
   * Envía la solicitud de recuperación de contraseña.
   */
  forgotPassword: async (email) => {
    return await DbAdapter.resetPasswordEmail(email);
  },

  /**
   * Actualiza la contraseña del usuario logueado o en flujo de recuperación.
   */
  updatePassword: async (newPassword) => {
    return await DbAdapter.updatePassword(newPassword);
  },

  /**
   * Cierra la sesión eliminando los datos del almacenamiento local.
   */
  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  /**
   * Obtiene los datos del usuario que tiene la sesión activa.
   */
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  },

  /**
   * Verifica si hay una sesión activa.
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(CURRENT_USER_KEY);
  },

  /**
   * Lógica simulada de 2FA (Segunda autenticación) para el administrador o seguridad extra.
   */
  send2FACode: async (email) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`CÓDIGO ENVIADO A ${email}: 1234`); // Simulación
    return true;
  },

  verify2FACode: async (code) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return code === '1234';
  },
};
