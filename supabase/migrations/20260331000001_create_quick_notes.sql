-- Create quick_notes table for free-form seeker reflections
CREATE TABLE quick_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  new_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast user queries ordered by date
CREATE INDEX idx_quick_notes_user_created ON quick_notes(new_user_id, created_at DESC);

-- Row Level Security
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON quick_notes FOR SELECT
  USING (auth.uid() = new_user_id);

CREATE POLICY "Users can insert own notes"
  ON quick_notes FOR INSERT
  WITH CHECK (auth.uid() = new_user_id);

CREATE POLICY "Users can update own notes"
  ON quick_notes FOR UPDATE
  USING (auth.uid() = new_user_id);

CREATE POLICY "Users can delete own notes"
  ON quick_notes FOR DELETE
  USING (auth.uid() = new_user_id);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_quick_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quick_notes_updated_at
  BEFORE UPDATE ON quick_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_notes_updated_at();
