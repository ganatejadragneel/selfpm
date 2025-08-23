# Database Migration Instructions

## Important: Run These Migrations in Order

## Add Order Column for Task Sorting

Please run the following SQL in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query):

```sql
-- Add order column to tasks table for sorting within categories
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_tasks_category_order ON tasks(category, "order");

-- Update existing tasks to have sequential order within their categories
DO $$
DECLARE
  cat TEXT;
BEGIN
  FOR cat IN SELECT DISTINCT category FROM tasks LOOP
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at) - 1 as new_order
      FROM tasks
      WHERE category = cat
    )
    UPDATE tasks
    SET "order" = numbered.new_order
    FROM numbered
    WHERE tasks.id = numbered.id;
  END LOOP;
END $$;
```

This migration adds an `order` column to support drag-and-drop reordering of tasks within and across categories.

## 2. Add Attachments Support

Run this SQL to enable file attachments for tasks:

```sql
-- Create attachments table for storing file metadata
-- Note: file_url stores base64 data URLs for now (no separate storage bucket needed)
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,  -- Stores base64 data URL
  thumbnail_url TEXT,       -- Stores base64 data URL for images
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);

-- Enable RLS (Note: Since we're using application-level auth, these policies won't be enforced)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy placeholders
CREATE POLICY "Allow all operations on attachments" ON attachments
  FOR ALL USING (true) WITH CHECK (true);
```

### Important Note

This implementation stores files as base64 data URLs directly in the database. This approach:
- ✅ Works without needing Supabase Storage configuration
- ✅ Keeps everything in one place
- ⚠️ Best for small files (images under 1-2MB, documents under 500KB)
- ⚠️ Not recommended for large files or high volume

For production use with larger files, consider setting up Supabase Storage or another file storage service.

This migration adds support for file attachments with upload, preview, and download capabilities.

## 3. Add Activity History and Comments

Run this SQL to enable activity tracking and comments:

```sql
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
```

This migration adds comprehensive activity tracking and commenting system for better task collaboration and history.