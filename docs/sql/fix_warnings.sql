
-- Arreglar warning: Function Search Path Mutable
-- Es una buena práctica de seguridad definir el search_path en las funciones security definer

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Forzar uso del esquema public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, email)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    new.email
  );
  RETURN new;
END;
$$;
