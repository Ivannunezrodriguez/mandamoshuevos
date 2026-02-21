-- Añadir columna para marcar pedidos recurrentes
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- (Opcional) Si quisieras hacerlo en items también, pero con orders basta para el filtro visual
