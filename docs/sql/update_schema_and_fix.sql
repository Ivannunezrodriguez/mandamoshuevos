
-- 1. Asegurar acceso a perfiles (Desactivar RLS por ahora)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Añadir columna de descuentos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;

-- 3. Permisos explícitos (Fuerza bruta para asegurar que Admin ve todo)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 4. Asegurar que el inventario existe para los base
INSERT INTO public.inventory (product_id, stock_quantity) 
VALUES 
('carton-xxl', 100), 
('carton-l', 100), 
('carton-m', 100)
ON CONFLICT (product_id) DO NOTHING;
