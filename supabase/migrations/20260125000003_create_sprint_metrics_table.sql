-- Migration: Create Sprint Metrics Table
-- Date: 2026-01-25
-- Purpose: Define metrics tracked within each sprint

-- ============================================================
-- SPRINT METRICS TABLE
-- ============================================================

CREATE TABLE sprint_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric_type metric_type NOT NULL,
  components JSONB NOT NULL,
  daily_target JSONB NOT NULL,
  weekly_target JSONB NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique display order per sprint
  CONSTRAINT unique_display_order_per_sprint UNIQUE (sprint_id, display_order)
);

-- Indexes
CREATE INDEX idx_sprint_metrics_sprint_id ON sprint_metrics(sprint_id);
CREATE INDEX idx_sprint_metrics_user_id ON sprint_metrics(user_id);


-- ============================================================
-- OWNERSHIP ENFORCEMENT TRIGGER
-- ============================================================

-- Trigger to enforce user_id matches parent sprint
-- Allows service role with explicit user_id validation
CREATE OR REPLACE FUNCTION enforce_metric_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_sprint_owner UUID;
BEGIN
  -- Get sprint owner
  SELECT user_id INTO v_sprint_owner FROM sprints WHERE id = NEW.sprint_id;

  IF v_sprint_owner IS NULL THEN
    RAISE EXCEPTION 'Sprint not found';
  END IF;

  -- Service role path: trust passed user_id but validate it matches sprint owner
  IF is_service_role() THEN
    IF NEW.user_id != v_sprint_owner THEN
      RAISE EXCEPTION 'user_id must match sprint owner';
    END IF;
    RETURN NEW;
  END IF;

  -- Normal user path: must be authenticated and own the sprint
  IF v_sprint_owner != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create metric for sprint you do not own';
  END IF;

  -- Force user_id to match authenticated user
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE TRIGGER enforce_metric_ownership
  BEFORE INSERT ON sprint_metrics
  FOR EACH ROW EXECUTE FUNCTION enforce_metric_user_ownership();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sprint_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sprint metrics"
  ON sprint_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sprint metrics"
  ON sprint_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sprint metrics"
  ON sprint_metrics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass
-- NOTE: Test in Phase 1 if this is actually needed (see note on sprints table)
CREATE POLICY "Service role full access to metrics"
  ON sprint_metrics FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sprint_metrics'
ORDER BY ordinal_position;

-- Verify trigger
SELECT tgname FROM pg_trigger WHERE tgrelid = 'sprint_metrics'::regclass;
