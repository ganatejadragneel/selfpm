-- ================================================================
-- REMOVE UNUSED TABLES - HIGH PRIORITY (Safe to remove immediately)
-- Run this script in your Supabase SQL Editor
-- ================================================================

-- These tables have NO references in the codebase and can be safely removed

-- 1. Drop 'notes' table (unused - likely replaced by task_updates)
DROP TABLE IF EXISTS public.notes CASCADE;

-- 2. Drop 'task_analytics' table (unused - no analytics implementation using this table)
DROP TABLE IF EXISTS public.task_analytics CASCADE;

-- 3. Drop 'daily_task_tracking' table (unused - superseded by daily_task_completions)
DROP TABLE IF EXISTS public.daily_task_tracking CASCADE;

-- Success message
SELECT 'HIGH PRIORITY: Successfully removed unused tables: notes, task_analytics, daily_task_tracking' AS status;