
-- START TRANSACTION;

-- 1. Habilitar RLS (por si acaso no lo está)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas de INSERT antiguas
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders; -- Nombre alternativo comun

-- 3. Crear políticas permisivas para INSERT
-- Permitimos a CUALQUIERA insertar. La seguridad real vendrá de las políticas de SELECT/UPDATE.
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK ( true );

CREATE POLICY "Anyone can insert items" 
ON public.order_items 
FOR INSERT 
WITH CHECK ( true );

-- 4. Verificar políticas de SELECT (opcional pero recomendado)
-- Asegura que los usuarios puedan ver sus propios pedidos
DROP POLICY IF EXISTS "Users can see their own orders" ON public.orders;
CREATE POLICY "Users can see their own orders" 
ON public.orders 
FOR SELECT 
USING ( 
  user_id_ref = auth.jwt() ->> 'email' 
  OR 
  (auth.uid() IS NOT NULL AND user_id_ref = auth.uid()::text)
);

-- COMMIT;
