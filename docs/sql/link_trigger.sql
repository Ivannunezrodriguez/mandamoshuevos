
-- 1. Aseguramos permisos
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;

-- 2. Conectar el Trigger (Esto es lo que probablemente falta)
-- Primero borramos por si estaba mal definido
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Creamos el trigger explícitamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Asegurar Políticas RLS (Por si acaso)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT a uno mismo (necesario para el fallback del frontend)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Permitir UPDATE a uno mismo
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Permitir SELECT a todos (público) o solo autenticados
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING ( true );
