-- Clean up duplicate functions and ensure proper search_path security

-- First, drop all existing versions of the functions to start clean
DROP FUNCTION IF EXISTS public.ensure_user_in_mapping_table() CASCADE;
DROP FUNCTION IF EXISTS public.set_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate functions with proper security settings

-- 1. Update timestamp function (simple, no external dependencies)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = '';

-- 2. User mapping function (needs public schema access)
CREATE OR REPLACE FUNCTION public.ensure_user_in_mapping_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_migration_mapping if not exists
  INSERT INTO public.user_migration_mapping (new_user_id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (new_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public';

-- 3. Set user ID function (needs auth.uid() access)
CREATE OR REPLACE FUNCTION public.set_current_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the current user ID from auth.uid() for new records
  IF TG_OP = 'INSERT' THEN
    NEW.new_user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public, auth';

-- Recreate any triggers that might have been dropped
-- (You may need to check what triggers were using these functions)

-- Verify the cleanup worked - should show only one entry per function
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  CASE 
    WHEN p.proconfig IS NULL THEN 'No search_path set'
    ELSE array_to_string(p.proconfig, ', ')
  END as search_path_config,
  p.oid as function_oid
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('ensure_user_in_mapping_table', 'update_updated_at_column', 'set_current_user_id')
ORDER BY p.proname, p.oid;