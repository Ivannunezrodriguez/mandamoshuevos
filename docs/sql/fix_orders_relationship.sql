-- Arreglar la relación entre Pedidos y Usuarios
-- Esto permite que Supabase detecte el enlace y podamos ver el email en el listado de pedidos.

ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_ref_fkey
FOREIGN KEY (user_id_ref)
REFERENCES public.profiles (id)
ON DELETE CASCADE;

-- Comentario para confirmar
COMMENT ON CONSTRAINT orders_user_id_ref_fkey ON public.orders IS 'Enlace para ver detalles del usuario desde el pedido';
