-- ================================================================
-- VERIFICATION QUERIES FOR TABLE CLEANUP
-- Run these queries to verify unused tables have been removed
-- ================================================================

-- 1. Check if high priority unused tables were removed
SELECT 'HIGH PRIORITY CLEANUP VERIFICATION' AS check_type;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All high priority unused tables removed'
    ELSE '❌ WARNING: Some high priority tables still exist'
  END AS status,
  COALESCE(STRING_AGG(table_name, ', '), 'None') AS remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notes', 'task_analytics', 'daily_task_tracking');

-- 2. Check if notifications table was removed (from previous cleanup)
SELECT 'NOTIFICATIONS TABLE VERIFICATION' AS check_type;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: Notifications table removed'
    ELSE '❌ WARNING: Notifications table still exists'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'notifications';

-- 3. List all remaining tables (should match actively used tables)
SELECT 'REMAINING TABLES' AS check_type;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'attachments', 'custom_tasks', 'daily_task_completions', 
      'daily_task_notes', 'recurring_task_templates', 'subtasks',
      'task_activities', 'task_comments', 'task_dependencies', 
      'task_updates', 'tasks', 'user_migration_mapping'
    ) THEN '✅ ACTIVE'
    WHEN table_name IN (
      'migration_backup', 'users', 'tasks_backup', 'users_backup'
    ) THEN '⚠️  MIGRATION/BACKUP (can be removed after migration complete)'
    ELSE '❓ UNKNOWN - investigate'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
  CASE 
    WHEN table_name IN (
      'attachments', 'custom_tasks', 'daily_task_completions', 
      'daily_task_notes', 'recurring_task_templates', 'subtasks',
      'task_activities', 'task_comments', 'task_dependencies', 
      'task_updates', 'tasks', 'user_migration_mapping'
    ) THEN 1
    WHEN table_name IN (
      'migration_backup', 'users', 'tasks_backup', 'users_backup'
    ) THEN 2
    ELSE 3
  END,
  table_name;

-- 4. Count active vs migration/backup tables
SELECT 'TABLE SUMMARY' AS check_type;

WITH table_categories AS (
  SELECT 
    table_name,
    CASE 
      WHEN table_name IN (
        'attachments', 'custom_tasks', 'daily_task_completions', 
        'daily_task_notes', 'recurring_task_templates', 'subtasks',
        'task_activities', 'task_comments', 'task_dependencies', 
        'task_updates', 'tasks', 'user_migration_mapping'
      ) THEN 'Active'
      WHEN table_name IN (
        'migration_backup', 'users', 'tasks_backup', 'users_backup'
      ) THEN 'Migration/Backup'
      ELSE 'Unknown'
    END AS category
  FROM information_schema.tables 
  WHERE table_schema = 'public'
)
SELECT 
  category,
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ') AS tables
FROM table_categories 
GROUP BY category
ORDER BY category;