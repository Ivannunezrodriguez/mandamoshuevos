
-- 1. Limpiar ofertas del inventario (solo queremos cartones base)
DELETE FROM public.inventory 
WHERE product_id LIKE 'oferta%' OR product_id LIKE 'pack%';

-- 2. Asegurar que los cartones base existen y tienen stock
INSERT INTO public.inventory (product_id, stock_quantity, min_stock_alert)
VALUES
  ('carton-xxl', 500, 20),
  ('carton-l', 800, 30),
  ('carton-m', 600, 25)
ON CONFLICT (product_id) DO UPDATE
SET stock_quantity = GREATEST(EXCLUDED.stock_quantity, public.inventory.stock_quantity);

-- 3. Verificación
SELECT * FROM public.inventory;
