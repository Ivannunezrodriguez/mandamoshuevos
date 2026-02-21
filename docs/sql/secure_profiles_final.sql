
-- ==============================================================================
-- FIX DE SEGURIDAD: Evitar "Loop Infinito" en Políticas
-- ==============================================================================

-- 1. Crear una función "Helper" que se salta las reglas de seguridad (Security Definer)
--    solo para consultar el rol del usuario actual. Esto evita el bucle infinito.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Asegurar que RLS está activo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas anteriores (para evitar conflictos)
DROP POLICY IF EXISTS "Profiles visibility" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users and Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 4. Crear Nuevas Políticas usando la función segura

-- A. LECTURA: Usuario ve el suyo OR Admin ve todos (usando la función segura)
CREATE POLICY "Profiles visibility" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR 
  get_my_role() = 'admin'
);

-- B. INSERCIÓN: Necesaria para el registro
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK ( auth.uid() = id );

-- C. ACTUALIZACIÓN: Usuario edita el suyo OR Admin edita cualquiera
CREATE POLICY "Users and Admins can update profiles" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id 
  OR 
  get_my_role() = 'admin'
);

-- 5. Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.get_my_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role TO service_role;
