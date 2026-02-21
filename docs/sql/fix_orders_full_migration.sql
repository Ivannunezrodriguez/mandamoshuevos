-- PASO 1: Eliminar temporalmente las políticas que dependen de la columna
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can see their own orders" ON public.orders; -- Nombre reportado en el error
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders; -- Nombre reportado en el segundo error
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders; -- Posible variante
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can see own order items" ON public.order_items; -- Posible variante
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

-- PASO 2: Convertir la columna de TEXT a UUID
ALTER TABLE public.orders
ALTER COLUMN user_id_ref TYPE uuid USING NULLIF(user_id_ref, '')::uuid;

-- PASO 3: Crear el enlace (Foreign Key)
ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_ref_fkey
FOREIGN KEY (user_id_ref)
REFERENCES public.profiles (id)
ON DELETE SET NULL;

-- PASO 4: Restaurar las políticas (recrearlas)

-- Policy: Orders (View Own)
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id_ref);

-- Policy: Orders (Create)
CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id_ref);

-- Policy: Order Items (View Own) - Ahora user_id_ref es UUID, no necesita cast
CREATE POLICY "Users can view own order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id_ref = auth.uid()
  )
);

-- Policy: Order Items (Insert)
CREATE POLICY "Users can insert order items" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id_ref = auth.uid()
  )
);

-- Comentario final
COMMENT ON COLUMN public.orders.user_id_ref IS 'Enlace UUID al perfil de usuario (Corregido)';
