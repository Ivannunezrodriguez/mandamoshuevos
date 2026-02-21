-- Migration: Add expanded billing and shipping fields
-- This script ensures consistent address fields across profiles and orders.

-- 1. Updates to public.profiles (Billing/User Data)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_2 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS town text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Updates to public.orders (Shipping Snapshot)
-- We store these separately in orders so that if a user changes their profile address, 
-- past orders still point to the original delivery location.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address_2 text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_town text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_postal_code text;

-- 3. Adjust handle_new_user trigger function to populate initial profile data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, email, address, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user',
    NEW.email,
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
