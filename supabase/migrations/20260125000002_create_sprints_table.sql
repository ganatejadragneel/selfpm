-- Migration: Create Sprints Table
-- Date: 2026-01-25
-- Purpose: Core sprint tracking table

-- ============================================================
-- SPRINTS TABLE
-- ============================================================

CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status sprint_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_sprint_duration CHECK (end_date = start_date + 6)
);

-- One active sprint per user (partial unique index)
CREATE UNIQUE INDEX idx_one_active_sprint_per_user
  ON sprints (user_id)
  WHERE status = 'active';

-- Other indexes
CREATE INDEX idx_sprints_user_id ON sprints(user_id);
CREATE INDEX idx_sprints_status ON sprints(status);

-- Updated_at trigger
CREATE TRIGGER sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sprints"
  ON sprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sprints"
  ON sprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sprints"
  ON sprints FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass for admin operations
-- NOTE: Test if this is actually needed (service role may bypass RLS automatically)
-- If redundant, remove this policy in a follow-up migration
CREATE POLICY "Service role full access"
  ON sprints FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sprints'
ORDER BY ordinal_position;

-- Verify constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'sprints'::regclass;

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'sprints';
