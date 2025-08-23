-- Run this query to check which tables exist in your database

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users',
  'tasks', 
  'subtasks', 
  'task_updates', 
  'notes', 
  'attachments',
  'task_activities',
  'task_comments'
)
ORDER BY table_name;

-- This will show you which tables are already created
-- Missing tables need to be created using the migration scripts