-- Create daily_task_notes table for storing user notes on daily tasks
CREATE TABLE daily_task_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    custom_task_id UUID NOT NULL REFERENCES custom_tasks(id) ON DELETE CASCADE,
    new_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    note_text TEXT NOT NULL CHECK (char_length(note_text) <= 200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Ensure one note per task per day per user
    UNIQUE(custom_task_id, new_user_id, note_date)
);

-- Add RLS policy for daily_task_notes
ALTER TABLE daily_task_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own notes
CREATE POLICY "Users can manage their own daily task notes" ON daily_task_notes
    FOR ALL USING (auth.uid() = new_user_id);

-- Add index for efficient queries
CREATE INDEX idx_daily_task_notes_user_date ON daily_task_notes(new_user_id, note_date);
CREATE INDEX idx_daily_task_notes_task_date ON daily_task_notes(custom_task_id, note_date);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_task_notes_updated_at 
    BEFORE UPDATE ON daily_task_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();