
-- 1. Helper function to get role without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  -- Se asume que auth.uid() es seguro.
  -- SECURITY DEFINER permite leer la tabla profiles saltándose las poliíticas RLS
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar la política recursiva
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;

-- 3. Crear política segura para Admin (Ver todo)
CREATE POLICY "Admins can see all profiles"
ON public.profiles FOR SELECT
USING (
  public.get_my_role() = 'admin'
);

-- 4. Asegurar que los usuarios normales puedan ver SU PROPIO perfil (si no existe ya)
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
);

-- 5. (Opcional) Si quieres que CUALQUIERA vea CUALQUIER perfil (más laxo, pero arregla el problema de "no veo nada"):
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING ( true );
-- (Mantenemos la restricción por ahora: Admin ve todo, User ve el suyo)
