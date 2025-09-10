-- Fix RLS Security Issues
-- Enable Row Level Security on all tables that have policies but RLS disabled

-- Enable RLS on core tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_migration_mapping ENABLE ROW LEVEL SECURITY;

-- Enable RLS on additional tables that might have been missed
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_task_completions ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled (these queries should show 'true' for all tables)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'tasks', 'subtasks', 'task_updates', 'users', 'user_migration_mapping',
    'notes', 'attachments', 'task_activities', 'task_comments', 
    'task_dependencies', 'recurring_task_templates', 'custom_tasks',
    'daily_task_completions', 'daily_task_notes', 'weekly_task_completions'
  )
ORDER BY tablename;