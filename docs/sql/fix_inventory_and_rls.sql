
-- 1. Asegurar que haya inventario (Insertar si no existe)
INSERT INTO public.inventory (product_id, stock_quantity, min_stock_alert)
VALUES
  ('carton-xxl', 500, 20),
  ('carton-l', 800, 30),
  ('carton-m', 600, 25),
  ('oferta-3-xxl', 50, 5),
  ('oferta-3-l', 50, 5),
  ('oferta-3-m', 50, 5)
ON CONFLICT (product_id) DO UPDATE
SET stock_quantity = EXCLUDED.stock_quantity; -- Resetear stock para demo

-- 2. Corregir política RLS de Pedidos para ser más robusta
-- Permitir ver pedidos si 'user_id_ref' coincide con el email del usuario O con su UUID
DROP POLICY IF EXISTS "Users can see their own orders" ON public.orders;

CREATE POLICY "Users can see their own orders"
ON public.orders FOR SELECT
USING (
  user_id_ref = auth.jwt() ->> 'email'
  OR
  user_id_ref = auth.uid()::text
);

-- 3. Permitir a los usuarios INSERTAR pedidos con su propio ID (uuid o email)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (
  user_id_ref = auth.jwt() ->> 'email'
  OR
  user_id_ref = auth.uid()::text
  OR
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
