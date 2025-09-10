-- Add alt_task field to custom_tasks table for storing alternative task descriptions
-- The completion status is tracked in daily_task_completions using the enhanced value encoding

ALTER TABLE custom_tasks
ADD COLUMN IF NOT EXISTS alt_task TEXT;