
-- Permitir a los administradores ver TODOS los perfiles
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;

CREATE POLICY "Admins can see all profiles"
ON public.profiles FOR SELECT
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
