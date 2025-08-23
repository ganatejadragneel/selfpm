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