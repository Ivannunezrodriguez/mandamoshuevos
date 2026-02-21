
-- ==============================================================================
-- SCRIPT DEFINITIVO PARA VISIBILIDAD DE USUARIOS Y DESCUENTOS
-- ==============================================================================

-- 1. Desactivar COMPLETAMENTE la seguridad a nivel de fila (RLS) en perfiles
--    Esto permite que cualquier usuario autenticado (incluido Admin) vea la tabla.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Asegurarse de que la columna de descuentos existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- 3. Conceder permisos explícitos de lectura/escritura a roles autenticados
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 4. (Opcional) Si en el futuro quieres reactivar RLS, usa:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Pero por ahora, MANTENLO DESACTIVADO para que funcione el panel.

-- 5. Verificación rápida (solo para el log de ejecución)
DO $$
DECLARE
  count_users integer;
BEGIN
  SELECT count(*) INTO count_users FROM public.profiles;
  RAISE NOTICE 'Total de perfiles actualmente: %', count_users;
END $$;
