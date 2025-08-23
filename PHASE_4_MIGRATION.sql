-- =====================================================
-- PHASE 4: Enhanced Progress Tracking with Automation
-- =====================================================

-- 1. Task Dependencies Table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN (
    'finish_to_start',  -- Can't start until dependency finishes
    'start_to_start',   -- Can't start until dependency starts
    'finish_to_finish', -- Can't finish until dependency finishes
    'start_to_finish'   -- Can't finish until dependency starts
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- 2. Recurring Task Templates Table
CREATE TABLE IF NOT EXISTS recurring_task_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  recurrence_pattern TEXT NOT NULL CHECK (recurrence_pattern IN (
    'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
  )),
  recurrence_day_of_week INTEGER, -- 0-6 for weekly
  recurrence_day_of_month INTEGER, -- 1-31 for monthly
  recurrence_months TEXT[], -- For quarterly/yearly
  auto_create_days_before INTEGER DEFAULT 0, -- Days before due date to create task
  is_active BOOLEAN DEFAULT TRUE,
  last_created_at TIMESTAMPTZ,
  next_create_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Task Analytics Table
CREATE TABLE IF NOT EXISTS task_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_date DATE NOT NULL,
  category TEXT,
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  subtasks_completed INTEGER DEFAULT 0,
  average_completion_time INTERVAL,
  total_progress_points INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_date, category)
);

-- 4. Smart Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'due_soon',           -- Task due in X hours/days
    'overdue',           -- Task is overdue
    'stale',             -- Task hasn't been updated in X days
    'dependency_completed', -- Dependency task completed
    'milestone_reached',  -- Progress milestone (25%, 50%, 75%, 100%)
    'weekly_summary',    -- Weekly progress summary
    'recurring_created'  -- Recurring task auto-created
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add new columns to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
  auto_progress BOOLEAN DEFAULT FALSE;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
  weighted_progress BOOLEAN DEFAULT FALSE;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
  completion_velocity DECIMAL(5,2);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
  estimated_completion_date TIMESTAMPTZ;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS 
  recurring_template_id UUID REFERENCES recurring_task_templates(id) ON DELETE SET NULL;

-- 6. Add weight column to subtasks
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS 
  weight INTEGER DEFAULT 1 CHECK (weight > 0 AND weight <= 10);

ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS 
  auto_complete_parent BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_id ON recurring_task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_next_create ON recurring_task_templates(next_create_at);
CREATE INDEX IF NOT EXISTS idx_task_analytics_user_period ON task_analytics(user_id, period_type, period_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations on task_dependencies" ON task_dependencies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on recurring_task_templates" ON recurring_task_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on task_analytics" ON task_analytics
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- Run this migration in your Supabase SQL Editor
-- After running, Phase 4 tables will be ready for use!