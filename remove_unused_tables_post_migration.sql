-- ================================================================
-- REMOVE UNUSED TABLES - POST MIGRATION (Remove after migration is complete)
-- ⚠️  ONLY run this script AFTER your migration to Supabase Auth is fully complete
-- ================================================================

-- WARNING: These tables contain migration-related data and backup information
-- Make sure your migration is successful before removing these tables

-- 1. Drop migration backup table (only needed during migration process)
DROP TABLE IF EXISTS public.migration_backup CASCADE;

-- 2. Drop legacy users table (replaced by Supabase Auth - auth.users)
-- ⚠️  CAUTION: Only drop after ALL users are migrated to Supabase Auth
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. Drop backup tables (temporary backup tables)
DROP TABLE IF EXISTS public.tasks_backup CASCADE;
DROP TABLE IF EXISTS public.users_backup CASCADE;

-- 4. Optional: Drop user migration mapping table 
-- ⚠️  KEEP this table if you need to track migration history
-- Uncomment the line below only if you're sure you don't need migration tracking
-- DROP TABLE IF EXISTS public.user_migration_mapping CASCADE;

-- Success message
SELECT 'POST-MIGRATION: Successfully removed migration and backup tables' AS status;

-- ================================================================
-- VERIFICATION QUERIES
-- Run these queries to confirm the tables are removed
-- ================================================================

-- Check which tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('migration_backup', 'users', 'tasks_backup', 'users_backup')
ORDER BY table_name;

-- Should return 0 rows if all tables were successfully removed