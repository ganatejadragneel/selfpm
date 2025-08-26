-- Add recurrence_weeks and original_week_number columns to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS recurrence_weeks INTEGER DEFAULT 1 CHECK (recurrence_weeks >= 1 AND recurrence_weeks <= 15),
ADD COLUMN IF NOT EXISTS original_week_number INTEGER;

-- Update existing weekly_recurring tasks to have default values
UPDATE tasks 
SET recurrence_weeks = 1,
    original_week_number = week_number
WHERE category = 'weekly_recurring' 
  AND recurrence_weeks IS NULL;