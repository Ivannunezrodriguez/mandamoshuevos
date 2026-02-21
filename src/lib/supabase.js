/**
 * CLIENTE DE SUPABASE
 * 
 * Este archivo configura la conexión con el backend de Supabase.
 * Utiliza variables de entorno para la seguridad.
 */
import { createClient } from '@supabase/supabase-js';

// Extraemos las credenciales de las variables de entorno configuradas en Vite (archivo .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Instancia del cliente Supabase.
 * Si las variables no están configuradas (por ejemplo, en desarrollo local inicial),
 * la instancia será 'null', permitiendo que la aplicación use el almacenamiento local.
 */
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Función de utilidad para comprobar rápidamente si tenemos conexión con el backend.
 */
export const isSupabaseConfigured = () => !!supabase;

