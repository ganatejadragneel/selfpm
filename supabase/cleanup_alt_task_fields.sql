-- Cleanup: Remove unused alt_task_done and alt_task_last_reset fields
-- These are no longer needed since we track alt task status in daily_task_completions

-- Drop the reset function if it exists
DROP FUNCTION IF EXISTS reset_alt_task_daily();

-- Remove the unused columns from custom_tasks table
ALTER TABLE custom_tasks 
DROP COLUMN IF EXISTS alt_task_done,
DROP COLUMN IF EXISTS alt_task_last_reset;

-- Note: We keep the alt_task column as it stores the alternative task description