-- Create attachments table for storing file metadata
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see and manage their own attachments
CREATE POLICY "Users can view own attachments" ON attachments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attachments" ON attachments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own attachments" ON attachments
  FOR DELETE USING (user_id = auth.uid());

-- Create a storage bucket for attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-attachments' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );