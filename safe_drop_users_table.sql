-- ================================================================
-- SAFELY DROP USERS TABLE (Run AFTER checking constraints)
-- Only run this after running check_users_table_constraints.sql
-- ================================================================

-- STEP 1: Drop foreign key constraints that reference users table
-- (Run this section if the constraint check revealed incoming foreign keys)

-- Drop foreign key constraints from common tables that might reference users
-- Note: Adjust constraint names based on your actual constraint check results

-- Example constraint drops (uncomment and adjust names as needed):
-- ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_user_id_fkey;
-- ALTER TABLE custom_tasks DROP CONSTRAINT IF EXISTS custom_tasks_user_id_fkey;
-- ALTER TABLE recurring_task_templates DROP CONSTRAINT IF EXISTS recurring_task_templates_user_id_fkey;
-- ALTER TABLE task_activities DROP CONSTRAINT IF EXISTS task_activities_user_id_fkey;
-- ALTER TABLE task_comments DROP CONSTRAINT IF EXISTS task_comments_user_id_fkey;
-- ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
-- ALTER TABLE user_migration_mapping DROP CONSTRAINT IF EXISTS user_migration_mapping_old_user_id_fkey;

-- STEP 2: Verify no constraints remain
SELECT 
    'REMAINING CONSTRAINTS CHECK' AS step,
    COUNT(*) AS remaining_fk_constraints
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'
    AND tc.table_schema = 'public';

-- STEP 3: Drop the users table (only if no constraints remain)
-- Uncomment the following line only after verifying no constraints remain:
-- DROP TABLE IF EXISTS public.users CASCADE;

-- STEP 4: Verification - confirm users table is gone
SELECT 
    'VERIFICATION' AS step,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: Users table removed'
        ELSE '❌ ERROR: Users table still exists'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'users';

-- ================================================================
-- SAFER ALTERNATIVE: STEP-BY-STEP MANUAL APPROACH
-- ================================================================

-- If you want to be extra cautious, run these queries one by one:

-- 1. First, get the exact constraint names:
-- SELECT constraint_name, table_name 
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.constraint_column_usage AS ccu
--     ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--     AND ccu.table_name = 'users';

-- 2. Then drop each constraint individually:
-- ALTER TABLE [table_name] DROP CONSTRAINT [constraint_name];

-- 3. Finally drop the users table:
-- DROP TABLE public.users CASCADE;

-- ================================================================
-- EMERGENCY ROLLBACK (if something goes wrong)
-- ================================================================

-- If you need to recreate the users table, use this structure:
-- CREATE TABLE public.users (
--   id uuid NOT NULL DEFAULT uuid_generate_v4(),
--   username text NOT NULL UNIQUE,
--   email text NOT NULL UNIQUE,
--   password_hash text NOT NULL,
--   created_at timestamp with time zone DEFAULT now(),
--   updated_at timestamp with time zone DEFAULT now(),
--   last_login timestamp with time zone,
--   is_active boolean DEFAULT true,
--   supabase_auth_id uuid,
--   migration_status text DEFAULT 'not_migrated'::text,
--   migrated_at timestamp with time zone,
--   CONSTRAINT users_pkey PRIMARY KEY (id)
-- );

-- Then restore the foreign key constraints as needed