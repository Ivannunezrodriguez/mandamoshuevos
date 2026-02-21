
-- Modificar la función trigger para que sea "suave" (no bloquee el registro si falla)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, username, full_name, role, email)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      'user',
      new.email
    );
  EXCEPTION WHEN OTHERS THEN
    -- Si falla (ej. duplicado, violación de restricción), lo ignoramos para que
    -- el usuario se cree en Auth correctamente.
    -- El frontend o el login posterior se encargarán de crear/recuperar el perfil.
    RAISE WARNING 'Error auto-creando perfil para %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$;
