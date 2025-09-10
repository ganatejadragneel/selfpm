-- Add alt_task fields to custom_tasks table
ALTER TABLE custom_tasks
ADD COLUMN IF NOT EXISTS alt_task TEXT,
ADD COLUMN IF NOT EXISTS alt_task_done BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alt_task_last_reset DATE DEFAULT CURRENT_DATE;

-- Create function to reset alt_task_done daily
CREATE OR REPLACE FUNCTION reset_alt_task_daily()
RETURNS void AS $$
BEGIN
  UPDATE custom_tasks
  SET alt_task_done = false,
      alt_task_last_reset = CURRENT_DATE
  WHERE alt_task_last_reset < CURRENT_DATE
    AND new_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- You can call this function manually or set up a cron job
-- To call manually from your app on each load:
-- SELECT reset_alt_task_daily();