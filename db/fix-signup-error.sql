-- Fix for "Database error saving new user"
-- Run this in Supabase SQL Editor to fix the signup issue.

-- 1. Drop existing trigger and function to ensure a clean slate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_settings();
DROP FUNCTION IF EXISTS public.create_user_settings();

-- 2. Re-create function with proper schema qualification and search_path
-- This ensures the function can find the 'user_settings' table in the 'public' schema
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_settings();

-- 4. Verify Permissions (Optional but recommended)
GRANT ALL ON TABLE public.user_settings TO service_role;
GRANT ALL ON TABLE public.user_settings TO postgres;
