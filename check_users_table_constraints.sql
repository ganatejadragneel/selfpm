-- ================================================================
-- CHECK USERS TABLE FOREIGN KEY CONSTRAINTS AND DEPENDENCIES
-- Run these queries in Supabase SQL Editor to analyze safety of dropping users table
-- ================================================================

-- 1. Check for INCOMING foreign key constraints (other tables referencing users.id)
SELECT 
    'INCOMING FOREIGN KEYS' AS check_type,
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'users'  -- Tables that reference users table
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2. Check for OUTGOING foreign key constraints (users table referencing other tables)
SELECT 
    'OUTGOING FOREIGN KEYS' AS check_type,
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users'  -- users table referencing other tables
    AND tc.table_schema = 'public'
ORDER BY ccu.table_name;

-- 3. Check for any data in tables that reference users.id (to see if constraints are blocking)
-- This will show you if there's actual data that would prevent dropping
WITH referencing_tables AS (
    SELECT DISTINCT
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND tc.table_schema = 'public'
)
SELECT 
    'DATA IN REFERENCING TABLES' AS check_type,
    table_name,
    column_name,
    (CASE 
        WHEN table_name = 'attachments' THEN (SELECT COUNT(*) FROM attachments WHERE user_id IS NOT NULL)
        WHEN table_name = 'custom_tasks' THEN (SELECT COUNT(*) FROM custom_tasks WHERE user_id IS NOT NULL)
        WHEN table_name = 'notifications' THEN 0  -- notifications table already removed
        WHEN table_name = 'recurring_task_templates' THEN (SELECT COUNT(*) FROM recurring_task_templates WHERE user_id IS NOT NULL)
        WHEN table_name = 'task_activities' THEN (SELECT COUNT(*) FROM task_activities WHERE user_id IS NOT NULL)
        WHEN table_name = 'task_analytics' THEN 0  -- task_analytics table already removed
        WHEN table_name = 'task_comments' THEN (SELECT COUNT(*) FROM task_comments WHERE user_id IS NOT NULL)
        WHEN table_name = 'tasks' THEN (SELECT COUNT(*) FROM tasks WHERE user_id IS NOT NULL)
        WHEN table_name = 'user_migration_mapping' THEN (SELECT COUNT(*) FROM user_migration_mapping WHERE old_user_id IS NOT NULL)
        ELSE 0
    END) AS record_count_with_user_reference
FROM referencing_tables
ORDER BY table_name;

-- 4. Check if users table has any actual data
SELECT 
    'USERS TABLE DATA' AS check_type,
    COUNT(*) AS total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) AS active_users,
    COUNT(CASE WHEN migration_status = 'migrated' THEN 1 END) AS migrated_users,
    COUNT(CASE WHEN migration_status = 'not_migrated' THEN 1 END) AS not_migrated_users
FROM users;

-- 5. Check for any views or functions that might depend on users table
SELECT 
    'DEPENDENT VIEWS' AS check_type,
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition ILIKE '%users%'
    AND table_schema = 'public';

-- 6. Summary recommendation
WITH constraint_count AS (
    SELECT COUNT(*) as total_incoming_fks
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND tc.table_schema = 'public'
),
user_data AS (
    SELECT COUNT(*) as total_users FROM users
)
SELECT 
    'SAFETY ASSESSMENT' AS check_type,
    CASE 
        WHEN cc.total_incoming_fks = 0 AND ud.total_users = 0 THEN 
            '✅ SAFE TO DROP: No foreign keys and no data'
        WHEN cc.total_incoming_fks = 0 AND ud.total_users > 0 THEN 
            '⚠️ CAUTION: No foreign keys but has data - backup first'
        WHEN cc.total_incoming_fks > 0 THEN 
            '❌ NOT SAFE: Has foreign key constraints - check referencing tables first'
        ELSE '❓ UNKNOWN'
    END AS safety_status,
    cc.total_incoming_fks AS foreign_key_count,
    ud.total_users AS user_count
FROM constraint_count cc, user_data ud;

-- ================================================================
-- INTERPRETATION GUIDE:
-- ================================================================
-- 
-- SAFE TO DROP IF:
-- ✅ No incoming foreign keys (other tables don't reference users.id)
-- ✅ No data in users table, OR
-- ✅ All referencing tables use new_user_id instead of user_id
--
-- NOT SAFE TO DROP IF:
-- ❌ Incoming foreign keys exist with non-null data
-- ❌ Other tables still actively reference users.id
-- ❌ Views or functions depend on users table
--
-- NEXT STEPS IF NOT SAFE:
-- 1. Update referencing tables to use new_user_id
-- 2. Set user_id columns to NULL in referencing tables  
-- 3. Drop foreign key constraints manually
-- 4. Then drop users table
-- ================================================================