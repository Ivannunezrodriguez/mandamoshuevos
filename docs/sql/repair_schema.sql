
-- Script de Reparación del Esquema de Base de Datos
-- Asegura que las columnas necesarias existan en la tabla profiles

-- 1. Añadir columnas si no existen
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dni text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- 2. Asegurar que el trigger está bien definido (Re-aplicar por si acaso)
-- Esto asegura que usa las columnas recién creadas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id, 
      username, 
      email, 
      role, 
      full_name,
      address,
      dni,
      phone,
      updated_at
    )
    VALUES (
      new.id,
      new.email,
      new.email, -- Usamos email como username por defecto
      'user',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'address',
      new.raw_user_meta_data->>'dni',
      new.raw_user_meta_data->>'phone',
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Si falla, lo registramos pero no bloqueamos
    RAISE WARNING 'Error en handle_new_user para %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$;

-- 3. Reconectar Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Permisos (Crucial para que el usuario pueda ver/editar su perfil)
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- 5. Crear un perfil Admin básico si no existe (GranHuevon)
-- Intentamos insertar el perfil de admin por si se borró
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'GranHuevon@mandamoshuevos.com';
  
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role, full_name, updated_at)
    VALUES (admin_uid, 'GranHuevon@mandamoshuevos.com', 'admin', 'Gran Huevón', NOW())
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', full_name = 'Gran Huevón';
  END IF;
END $$;
