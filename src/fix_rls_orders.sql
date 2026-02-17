-- Habilitar RLS en tabla orders (si no está ya)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA ORDERS

-- 1. Permitir a los usuarios ver sus propios pedidos
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id_ref);

-- 2. Permitir a los admins (o rol service_role) ver TODOS los pedidos
-- Asumiendo que admin tiene email específico o check de tabla profiles
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Permitir INSERT a usuarios autenticados (Crear pedido)
CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id_ref);

-- 4. Permitir UPDATE a admins (Cambiar estado)
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Permitir DELETE a admins (Eliminar pedido)
CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);


-- POLÍTICAS PARA ORDER_ITEMS

-- 1. Ver items de sus propios pedidos
CREATE POLICY "Users can view own order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id_ref = auth.uid()
  )
);

-- 2. Admins ven todo
CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Insertar items (al crear pedido)
CREATE POLICY "Users can insert order items" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id_ref = auth.uid()
  )
);

-- 4. Delete items (Cascade o manual por admin)
CREATE POLICY "Admins can delete order items" ON public.order_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
