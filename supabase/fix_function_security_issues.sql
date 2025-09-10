-- Fix Function Security Issues
-- Set immutable search_path for all database functions to prevent security vulnerabilities

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SET search_path = '';

-- Fix ensure_user_in_mapping_table function  
CREATE OR REPLACE FUNCTION ensure_user_in_mapping_table()
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

-- Fix set_current_user_id function
CREATE OR REPLACE FUNCTION set_current_user_id()
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

-- Verify functions have proper search_path set
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  CASE 
    WHEN p.proconfig IS NULL THEN 'No search_path set'
    ELSE array_to_string(p.proconfig, ', ')
  END as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('ensure_user_in_mapping_table', 'update_updated_at_column', 'set_current_user_id')
ORDER BY p.proname;