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

-- RLS Policy placeholders
CREATE POLICY "Allow all operations on task_activities" ON task_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on task_comments" ON task_comments
  FOR ALL USING (true) WITH CHECK (true);

-- Function to automatically log activities
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  activity_type TEXT;
  old_val TEXT;
  new_val TEXT;
  meta JSONB;
BEGIN
  -- Determine activity type based on operation
  IF TG_OP = 'INSERT' THEN
    activity_type := 'created';
    new_val := NEW.title;
    meta := jsonb_build_object('task_title', NEW.title, 'category', NEW.category);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check what changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      activity_type := 'status_changed';
      old_val := OLD.status;
      new_val := NEW.status;
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      activity_type := 'priority_changed';
      old_val := OLD.priority;
      new_val := NEW.priority;
    ELSIF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      activity_type := 'due_date_changed';
      old_val := OLD.due_date::TEXT;
      new_val := NEW.due_date::TEXT;
    ELSIF OLD.category IS DISTINCT FROM NEW.category THEN
      activity_type := 'moved_category';
      old_val := OLD.category;
      new_val := NEW.category;
    ELSIF OLD.description IS DISTINCT FROM NEW.description THEN
      activity_type := 'description_updated';
      old_val := SUBSTRING(OLD.description FROM 1 FOR 100);
      new_val := SUBSTRING(NEW.description FROM 1 FOR 100);
    ELSIF OLD.progress_current IS DISTINCT FROM NEW.progress_current THEN
      activity_type := 'progress_updated';
      old_val := OLD.progress_current::TEXT;
      new_val := NEW.progress_current::TEXT;
      meta := jsonb_build_object('progress_total', NEW.progress_total);
    ELSE
      activity_type := 'updated';
      meta := jsonb_build_object('fields_changed', 
        CASE 
          WHEN OLD.title != NEW.title THEN 'title'
          WHEN OLD."order" != NEW."order" THEN 'reordered'
          ELSE 'other'
        END
      );
    END IF;
  END IF;

  -- Insert activity record (only if we have a user_id in the NEW record)
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO task_activities (
      task_id, 
      user_id, 
      activity_type, 
      old_value, 
      new_value, 
      metadata
    ) VALUES (
      NEW.id, 
      NEW.user_id, 
      activity_type, 
      old_val, 
      new_val, 
      meta
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic activity logging
-- Note: This will only work if we add a user_id column to tasks table
-- For now, we'll log activities manually from the application