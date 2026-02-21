
-- Actualizar trigger para guardar TODOS los datos del registro
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
      new.email,
      'user',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'address',  -- Mapear Dirección
      new.raw_user_meta_data->>'dni',      -- Mapear DNI
      new.raw_user_meta_data->>'phone',    -- Mapear Teléfono
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error auto-creando perfil completo para %: %', new.id, SQLERRM;
  END;
  RETURN new;
END;
$$;
