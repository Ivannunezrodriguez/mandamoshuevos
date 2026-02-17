
-- Script para Promocionar al Usuario a Administrador

-- 1. Actualizar el rol en la tabla pública 'profiles'
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'GranHuevon@mandamoshuevos.com';

-- 2. Asegurarse de que el usuario existe en 'profiles' (si no, lo insertamos)
INSERT INTO public.profiles (id, email, role, full_name, updated_at)
SELECT id, email, 'admin', 'Gran Huevón', now()
FROM auth.users
WHERE email = 'GranHuevon@mandamoshuevos.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- 3. Verificación (Opcional, para ver el resultado)
SELECT * FROM public.profiles WHERE email = 'GranHuevon@mandamoshuevos.com';
