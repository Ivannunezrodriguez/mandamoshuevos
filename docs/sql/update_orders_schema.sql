-- SCRIPT PARA AÑADIR COLUMNAS DE ENVÍO
-- Ejecuta esto en el Editor SQL de Supabase para corregir el error "column does not exist".

-- Añadir columna para la dirección de calle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address text;

-- Añadir columna para el pueblo/localidad
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_town text;

-- (Opcional) Si quieres que los pedidos antiguos tengan un valor por defecto, puedes ejecutar:
-- UPDATE orders SET shipping_town = 'Desconocido' WHERE shipping_town IS NULL;
