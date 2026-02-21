-- PASO 1: Convertir la columna de TEXT a UUID (Supabase usa UUID para usuarios)
ALTER TABLE public.orders
ALTER COLUMN user_id_ref TYPE uuid USING user_id_ref::uuid;

-- PASO 2: Ahora que los tipos coinciden, crear el enlace (Foreign Key)
ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_ref_fkey
FOREIGN KEY (user_id_ref)
REFERENCES public.profiles (id)
ON DELETE SET NULL;

-- Confirmación
COMMENT ON COLUMN public.orders.user_id_ref IS 'Enlace UUID al perfil de usuario';
