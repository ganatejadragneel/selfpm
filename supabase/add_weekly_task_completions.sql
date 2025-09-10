-- Add table for tracking weekly recurring task completion status per week
-- This allows each week to have its own completion status for recurring tasks

CREATE TABLE weekly_task_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  new_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  progress_current INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one completion record per task per week per user
  UNIQUE(task_id, new_user_id, week_number)
);

-- Index for performance
CREATE INDEX idx_weekly_task_completions_task_week ON weekly_task_completions(task_id, week_number);
CREATE INDEX idx_weekly_task_completions_user ON weekly_task_completions(new_user_id);
CREATE INDEX idx_weekly_task_completions_week ON weekly_task_completions(week_number);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_weekly_task_completions_updated_at
  BEFORE UPDATE ON weekly_task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE weekly_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on weekly_task_completions" ON weekly_task_completions
  FOR ALL USING (true) WITH CHECK (true);