
-- Script Final de Reparación del Esquema
-- El error de los logs indica que falta la columna 'email' en la tabla profiles.

-- 1. Añadir columna 'email' y otras potencialmente faltantes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dni text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- 2. Asegurar que 'username' es único (según esquema original)
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username); 
-- (Comentado para no causar error si ya existe, pero es bueno saberlo)

-- 3. Reconectar el Trigger (handle_new_user)
-- Ya que el trigger actual ya intentaba escribir en 'email', ahora funcionará sin cambios.
-- Pero forzamos un 'refresh' por si acaso.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log de inicio
  INSERT INTO public.debug_logs (message, details)
  VALUES ('Trigger handle_new_user iniciado', jsonb_build_object('user_id', new.id, 'email', new.email));

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
      new.email, -- Usamos email como username si no hay otro
      'user',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'address',
      new.raw_user_meta_data->>'dni',
      new.raw_user_meta_data->>'phone',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
       email = EXCLUDED.email,
       full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
       address = COALESCE(EXCLUDED.address, public.profiles.address),
       dni = COALESCE(EXCLUDED.dni, public.profiles.dni),
       phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
       updated_at = NOW();

    -- Log de éxito
    INSERT INTO public.debug_logs (message, details)
    VALUES ('Trigger handle_new_user ÉXITO', jsonb_build_object('user_id', new.id));

  EXCEPTION WHEN OTHERS THEN
    -- Log de error
    INSERT INTO public.debug_logs (message, details)
    VALUES ('Trigger handle_new_user ERROR', jsonb_build_object('error', SQLERRM, 'state', SQLSTATE));
    RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
  END;
  RETURN new;
END;
$$;
