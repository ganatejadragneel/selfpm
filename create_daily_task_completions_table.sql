-- Create daily_task_completions table for tracking custom daily task completion status
-- This stores the daily completion values for custom tasks created by users

CREATE TABLE IF NOT EXISTS daily_task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  custom_task_id UUID REFERENCES custom_tasks(id) ON DELETE CASCADE,
  new_user_id UUID NOT NULL, -- References auth.users
  value TEXT NOT NULL, -- The selected value (e.g., 'Done', 'Not Done', or dropdown option)
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one completion per task per user per day
  UNIQUE(custom_task_id, new_user_id, completion_date)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE daily_task_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own completions
CREATE POLICY "Users can view own daily task completions" ON daily_task_completions
  FOR SELECT USING (new_user_id = auth.uid());

-- Policy: Users can only insert their own completions
CREATE POLICY "Users can insert own daily task completions" ON daily_task_completions
  FOR INSERT WITH CHECK (new_user_id = auth.uid());

-- Policy: Users can only update their own completions
CREATE POLICY "Users can update own daily task completions" ON daily_task_completions
  FOR UPDATE USING (new_user_id = auth.uid());

-- Policy: Users can only delete their own completions
CREATE POLICY "Users can delete own daily task completions" ON daily_task_completions
  FOR DELETE USING (new_user_id = auth.uid());

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_task_completions_user_date 
  ON daily_task_completions(new_user_id, completion_date);

CREATE INDEX IF NOT EXISTS idx_daily_task_completions_task_user_date 
  ON daily_task_completions(custom_task_id, new_user_id, completion_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_task_completions_updated_at 
  BEFORE UPDATE ON daily_task_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();