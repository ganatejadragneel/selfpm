-- Migration: Create Sprint Metric Entries Table
-- Date: 2026-01-25
-- Purpose: Daily data entries for sprint metrics

-- ============================================================
-- SPRINT METRIC ENTRIES TABLE
-- ============================================================

CREATE TABLE sprint_metric_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES sprint_metrics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,

  -- Sleep: store as TIMESTAMPTZ for DST safety
  bed_at TIMESTAMPTZ,
  wake_at TIMESTAMPTZ,

  -- Boolean metrics
  completed BOOLEAN,

  -- Duration metrics (minutes)
  duration_minutes INT,

  -- Notes (optional)
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_metric_date UNIQUE (metric_id, entry_date),
  CONSTRAINT notes_length CHECK (char_length(notes) <= 2500),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);

-- Indexes
CREATE INDEX idx_entries_metric_id ON sprint_metric_entries(metric_id);
CREATE INDEX idx_entries_user_id ON sprint_metric_entries(user_id);
CREATE INDEX idx_entries_date ON sprint_metric_entries(entry_date);

-- Updated_at trigger
CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON sprint_metric_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- ENTRY VALIDATION TRIGGER
-- ============================================================

-- Comprehensive trigger to enforce:
-- 1. user_id matches authenticated user (or service role validation)
-- 2. entry_date is within sprint date range
-- 3. entry_date is today or yesterday only (edit window)
-- 4. entry has correct fields for metric type
-- 5. sleep validity: wake_at > bed_at, duration < 20 hours
-- 6. sleep entry_date matches wake_at's local date

CREATE OR REPLACE FUNCTION enforce_entry_constraints()
RETURNS TRIGGER AS $$
DECLARE
  v_metric_owner UUID;
  v_metric_type metric_type;
  v_start_date DATE;
  v_end_date DATE;
  v_user_tz TEXT := 'America/New_York'; -- Fixed for v1
  v_today_local DATE;
  v_yesterday_local DATE;
  v_sleep_duration INTERVAL;
  v_wake_local_date DATE;
BEGIN
  -- Get metric info and sprint dates
  SELECT sm.user_id, sm.metric_type, s.start_date, s.end_date
  INTO v_metric_owner, v_metric_type, v_start_date, v_end_date
  FROM sprint_metrics sm
  JOIN sprints s ON s.id = sm.sprint_id
  WHERE sm.id = NEW.metric_id;

  IF v_metric_owner IS NULL THEN
    RAISE EXCEPTION 'Metric not found';
  END IF;

  -- Service role path: trust passed user_id but validate it matches metric owner
  IF is_service_role() THEN
    IF NEW.user_id != v_metric_owner THEN
      RAISE EXCEPTION 'user_id must match metric owner';
    END IF;
  ELSE
    -- Normal user path
    IF v_metric_owner != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create entry for metric you do not own';
    END IF;
    -- Force user_id to match authenticated user
    NEW.user_id := auth.uid();
  END IF;

  -- Check entry_date is within sprint range
  IF NEW.entry_date < v_start_date OR NEW.entry_date > v_end_date THEN
    RAISE EXCEPTION 'Entry date must be within sprint date range (% to %)',
      v_start_date, v_end_date;
  END IF;

  -- Check entry_date is today or yesterday (in user's timezone)
  -- Skip this check for service role (admin/testing)
  IF NOT is_service_role() THEN
    v_today_local := (NOW() AT TIME ZONE v_user_tz)::DATE;
    v_yesterday_local := v_today_local - 1;

    IF NEW.entry_date < v_yesterday_local THEN
      RAISE EXCEPTION 'Can only edit entries for today or yesterday. Entry date: %, Yesterday: %',
        NEW.entry_date, v_yesterday_local;
    END IF;
  END IF;

  -- Validate fields based on metric type
  CASE v_metric_type
    WHEN 'sleep' THEN
      -- Sleep must have bed_at and wake_at, not other fields
      IF NEW.bed_at IS NULL OR NEW.wake_at IS NULL THEN
        RAISE EXCEPTION 'Sleep entries must have bed_at and wake_at';
      END IF;
      IF NEW.completed IS NOT NULL OR NEW.duration_minutes IS NOT NULL THEN
        RAISE EXCEPTION 'Sleep entries should not have completed or duration_minutes';
      END IF;

      -- Validate wake_at > bed_at
      IF NEW.wake_at <= NEW.bed_at THEN
        RAISE EXCEPTION 'wake_at must be after bed_at';
      END IF;

      -- Validate reasonable sleep duration (< 20 hours)
      v_sleep_duration := NEW.wake_at - NEW.bed_at;
      IF v_sleep_duration > INTERVAL '20 hours' THEN
        RAISE EXCEPTION 'Sleep duration cannot exceed 20 hours. Got: %', v_sleep_duration;
      END IF;

      -- Validate entry_date matches wake_at's local date
      v_wake_local_date := (NEW.wake_at AT TIME ZONE v_user_tz)::DATE;
      IF NEW.entry_date != v_wake_local_date THEN
        RAISE EXCEPTION 'entry_date must match the local date of wake_at. Expected: %, Got: %',
          v_wake_local_date, NEW.entry_date;
      END IF;

    WHEN 'boolean' THEN
      -- Boolean must have completed, not other fields
      IF NEW.completed IS NULL THEN
        RAISE EXCEPTION 'Boolean entries must have completed';
      END IF;
      IF NEW.bed_at IS NOT NULL OR NEW.wake_at IS NOT NULL OR NEW.duration_minutes IS NOT NULL THEN
        RAISE EXCEPTION 'Boolean entries should not have bed_at, wake_at, or duration_minutes';
      END IF;

    WHEN 'duration' THEN
      -- Duration must have duration_minutes, not other fields
      IF NEW.duration_minutes IS NULL THEN
        RAISE EXCEPTION 'Duration entries must have duration_minutes';
      END IF;
      IF NEW.bed_at IS NOT NULL OR NEW.wake_at IS NOT NULL OR NEW.completed IS NOT NULL THEN
        RAISE EXCEPTION 'Duration entries should not have bed_at, wake_at, or completed';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE TRIGGER enforce_entry_rules
  BEFORE INSERT OR UPDATE ON sprint_metric_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_entry_constraints();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE sprint_metric_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON sprint_metric_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON sprint_metric_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON sprint_metric_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass
-- NOTE: Test in Phase 1 if this is actually needed (see note on sprints table)
CREATE POLICY "Service role full access to entries"
  ON sprint_metric_entries FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sprint_metric_entries'
ORDER BY ordinal_position;

-- Verify constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'sprint_metric_entries'::regclass;

-- Verify triggers
SELECT tgname FROM pg_trigger WHERE tgrelid = 'sprint_metric_entries'::regclass;
