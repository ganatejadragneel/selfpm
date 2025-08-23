-- IMPORTANT: Run this entire SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard -> SQL Editor -> New Query
-- Copy and paste all of this, then click "Run"

-- =====================================================
-- MIGRATION 3: Activity History and Comments
-- =====================================================

-- Create activity history table for tracking all task changes
CREATE TABLE IF NOT EXISTS task_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'updated', 'status_changed', 'priority_changed', 
    'due_date_changed', 'description_updated', 'subtask_added', 
    'subtask_completed', 'subtask_deleted', 'attachment_added', 
    'attachment_deleted', 'comment_added', 'progress_updated',
    'note_added', 'moved_category', 'reordered'
  )),
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table for task discussions
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_user_id ON task_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_task_activities_created_at ON task_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_comment_id);

-- Enable RLS (using application-level auth)
ALTER TABLE task_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy placeholders (allow all since we use app-level auth)
CREATE POLICY "Allow all operations on task_activities" ON task_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on task_comments" ON task_comments
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- After running this, you should see "Success. No rows returned"
-- The tables are now created and ready to use!