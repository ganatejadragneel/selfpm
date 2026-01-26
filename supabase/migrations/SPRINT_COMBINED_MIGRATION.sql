-- ============================================================
-- SPRINT FOCUS SYSTEM: COMBINED MIGRATION
-- ============================================================
--
-- Run this entire file in the Supabase SQL Editor
-- Date: 2026-01-25
-- Version: 5.0
--
-- This combines all 5 individual migrations for easy execution.
-- Individual files are available for reference.
-- ============================================================


-- ============================================================
-- PART 1: ENUMS AND HELPER FUNCTIONS
-- ============================================================

-- Sprint status enum
CREATE TYPE sprint_status AS ENUM ('active', 'completed');

-- Metric type enum
CREATE TYPE metric_type AS ENUM ('sleep', 'boolean', 'duration');

-- Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if running as service role
-- Hardened to never throw on malformed JSON or missing settings
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Try the direct claim first (more reliable)
  BEGIN
    v_role := current_setting('request.jwt.claim.role', true);
    IF v_role = 'service_role' THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from missing/invalid settings
  END;

  -- Try parsing the claims JSON
  BEGIN
    v_role := current_setting('request.jwt.claims', true)::json->>'role';
    IF v_role = 'service_role' THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from malformed JSON
  END;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- PART 2: SPRINTS TABLE
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

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_sprint_duration CHECK (end_date = start_date + 6)
);

CREATE UNIQUE INDEX idx_one_active_sprint_per_user
  ON sprints (user_id)
  WHERE status = 'active';

CREATE INDEX idx_sprints_user_id ON sprints(user_id);
CREATE INDEX idx_sprints_status ON sprints(status);

CREATE TRIGGER sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

CREATE POLICY "Service role full access"
  ON sprints FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());


-- ============================================================
-- PART 3: SPRINT METRICS TABLE
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

  CONSTRAINT unique_display_order_per_sprint UNIQUE (sprint_id, display_order)
);

CREATE INDEX idx_sprint_metrics_sprint_id ON sprint_metrics(sprint_id);
CREATE INDEX idx_sprint_metrics_user_id ON sprint_metrics(user_id);

CREATE OR REPLACE FUNCTION enforce_metric_user_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_sprint_owner UUID;
BEGIN
  SELECT user_id INTO v_sprint_owner FROM sprints WHERE id = NEW.sprint_id;

  IF v_sprint_owner IS NULL THEN
    RAISE EXCEPTION 'Sprint not found';
  END IF;

  IF is_service_role() THEN
    IF NEW.user_id != v_sprint_owner THEN
      RAISE EXCEPTION 'user_id must match sprint owner';
    END IF;
    RETURN NEW;
  END IF;

  IF v_sprint_owner != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create metric for sprint you do not own';
  END IF;

  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

CREATE TRIGGER enforce_metric_ownership
  BEFORE INSERT ON sprint_metrics
  FOR EACH ROW EXECUTE FUNCTION enforce_metric_user_ownership();

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

CREATE POLICY "Service role full access to metrics"
  ON sprint_metrics FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());


-- ============================================================
-- PART 4: SPRINT METRIC ENTRIES TABLE
-- ============================================================

CREATE TABLE sprint_metric_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES sprint_metrics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,

  bed_at TIMESTAMPTZ,
  wake_at TIMESTAMPTZ,
  completed BOOLEAN,
  duration_minutes INT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_metric_date UNIQUE (metric_id, entry_date),
  CONSTRAINT notes_length CHECK (char_length(notes) <= 2500),
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0)
);

CREATE INDEX idx_entries_metric_id ON sprint_metric_entries(metric_id);
CREATE INDEX idx_entries_user_id ON sprint_metric_entries(user_id);
CREATE INDEX idx_entries_date ON sprint_metric_entries(entry_date);

CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON sprint_metric_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION enforce_entry_constraints()
RETURNS TRIGGER AS $$
DECLARE
  v_metric_owner UUID;
  v_metric_type metric_type;
  v_start_date DATE;
  v_end_date DATE;
  v_user_tz TEXT := 'America/New_York';
  v_today_local DATE;
  v_yesterday_local DATE;
  v_sleep_duration INTERVAL;
  v_wake_local_date DATE;
BEGIN
  SELECT sm.user_id, sm.metric_type, s.start_date, s.end_date
  INTO v_metric_owner, v_metric_type, v_start_date, v_end_date
  FROM sprint_metrics sm
  JOIN sprints s ON s.id = sm.sprint_id
  WHERE sm.id = NEW.metric_id;

  IF v_metric_owner IS NULL THEN
    RAISE EXCEPTION 'Metric not found';
  END IF;

  IF is_service_role() THEN
    IF NEW.user_id != v_metric_owner THEN
      RAISE EXCEPTION 'user_id must match metric owner';
    END IF;
  ELSE
    IF v_metric_owner != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create entry for metric you do not own';
    END IF;
    NEW.user_id := auth.uid();
  END IF;

  IF NEW.entry_date < v_start_date OR NEW.entry_date > v_end_date THEN
    RAISE EXCEPTION 'Entry date must be within sprint date range (% to %)',
      v_start_date, v_end_date;
  END IF;

  IF NOT is_service_role() THEN
    v_today_local := (NOW() AT TIME ZONE v_user_tz)::DATE;
    v_yesterday_local := v_today_local - 1;

    IF NEW.entry_date < v_yesterday_local THEN
      RAISE EXCEPTION 'Can only edit entries for today or yesterday. Entry date: %, Yesterday: %',
        NEW.entry_date, v_yesterday_local;
    END IF;
  END IF;

  CASE v_metric_type
    WHEN 'sleep' THEN
      IF NEW.bed_at IS NULL OR NEW.wake_at IS NULL THEN
        RAISE EXCEPTION 'Sleep entries must have bed_at and wake_at';
      END IF;
      IF NEW.completed IS NOT NULL OR NEW.duration_minutes IS NOT NULL THEN
        RAISE EXCEPTION 'Sleep entries should not have completed or duration_minutes';
      END IF;

      IF NEW.wake_at <= NEW.bed_at THEN
        RAISE EXCEPTION 'wake_at must be after bed_at';
      END IF;

      v_sleep_duration := NEW.wake_at - NEW.bed_at;
      IF v_sleep_duration > INTERVAL '20 hours' THEN
        RAISE EXCEPTION 'Sleep duration cannot exceed 20 hours. Got: %', v_sleep_duration;
      END IF;

      v_wake_local_date := (NEW.wake_at AT TIME ZONE v_user_tz)::DATE;
      IF NEW.entry_date != v_wake_local_date THEN
        RAISE EXCEPTION 'entry_date must match the local date of wake_at. Expected: %, Got: %',
          v_wake_local_date, NEW.entry_date;
      END IF;

    WHEN 'boolean' THEN
      IF NEW.completed IS NULL THEN
        RAISE EXCEPTION 'Boolean entries must have completed';
      END IF;
      IF NEW.bed_at IS NOT NULL OR NEW.wake_at IS NOT NULL OR NEW.duration_minutes IS NOT NULL THEN
        RAISE EXCEPTION 'Boolean entries should not have bed_at, wake_at, or duration_minutes';
      END IF;

    WHEN 'duration' THEN
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

CREATE POLICY "Service role full access to entries"
  ON sprint_metric_entries FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());


-- ============================================================
-- PART 5: RPC FUNCTIONS
-- ============================================================

-- Helper: Seed Sprint Metrics
CREATE OR REPLACE FUNCTION seed_sprint_metrics(
  p_sprint_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id, p_user_id, 'Sleep', 'sleep',
    '{"bed_at": {"type": "timestamp", "label": "Bedtime"}, "wake_at": {"type": "timestamp", "label": "Wake Time"}}'::JSONB,
    '{"field": "wake_at", "operator": "<=", "value": "04:30", "type": "time_of_day"}'::JSONB,
    '{"type": "frequency", "count": 3, "total": 7}'::JSONB, 1
  );

  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id, p_user_id, 'Morning Routine', 'boolean',
    '{"completed": {"type": "boolean", "label": "Completed (Jabam + Reading + Visualization)"}}'::JSONB,
    '{"field": "completed", "operator": "==", "value": true, "type": "boolean"}'::JSONB,
    '{"type": "frequency", "count": 6, "total": 7}'::JSONB, 2
  );

  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id, p_user_id, 'IP Attack', 'duration',
    '{"duration_minutes": {"type": "number", "unit": "minutes", "label": "Duration"}}'::JSONB,
    '{"field": "duration_minutes", "operator": ">=", "value": 120, "type": "number"}'::JSONB,
    '{"type": "frequency", "count": 6, "total": 7}'::JSONB, 3
  );

  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id, p_user_id, 'Gym', 'duration',
    '{"duration_minutes": {"type": "number", "unit": "minutes", "label": "Duration"}}'::JSONB,
    '{"field": "duration_minutes", "operator": ">=", "value": 60, "type": "number"}'::JSONB,
    '{"type": "frequency", "count": 5, "total": 7}'::JSONB, 4
  );

  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id, p_user_id, 'Anthropic Progress', 'duration',
    '{"duration_minutes": {"type": "number", "unit": "minutes", "label": "Duration"}}'::JSONB,
    '{"field": "duration_minutes", "operator": ">=", "value": 120, "type": "number"}'::JSONB,
    '{"type": "frequency", "count": 6, "total": 7}'::JSONB, 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

REVOKE ALL ON FUNCTION seed_sprint_metrics(UUID, UUID) FROM PUBLIC;


-- RPC: Create Sprint with Metrics
CREATE OR REPLACE FUNCTION create_sprint_with_metrics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_sprint_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_user_id != '41a94776-0ab1-4ae3-a752-2cb1c6ae0d27' THEN
    RAISE EXCEPTION 'Sprint feature not enabled for this user';
  END IF;

  IF EXTRACT(ISODOW FROM p_start_date) != 1 THEN
    RAISE EXCEPTION 'Start date must be a Monday. Got: %', p_start_date;
  END IF;

  IF p_end_date != p_start_date + 6 THEN
    RAISE EXCEPTION 'End date must be 6 days after start date (Sunday). Expected: %, Got: %',
      p_start_date + 6, p_end_date;
  END IF;

  IF EXISTS (SELECT 1 FROM sprints WHERE user_id = v_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'User already has an active sprint';
  END IF;

  INSERT INTO sprints (user_id, name, start_date, end_date, status)
  VALUES (
    v_user_id,
    'Week of ' || TO_CHAR(p_start_date, 'Mon DD'),
    p_start_date,
    p_end_date,
    'active'
  )
  RETURNING id INTO v_sprint_id;

  PERFORM seed_sprint_metrics(v_sprint_id, v_user_id);

  RETURN v_sprint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

REVOKE ALL ON FUNCTION create_sprint_with_metrics(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sprint_with_metrics(DATE, DATE) TO authenticated;


-- RPC: Complete Sprint
CREATE OR REPLACE FUNCTION complete_sprint(
  p_sprint_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_sprint RECORD;
  v_next_start DATE;
  v_next_end DATE;
  v_next_sprint_id UUID;
  v_result JSONB;
BEGIN
  SELECT * INTO v_sprint FROM sprints
  WHERE id = p_sprint_id AND user_id = v_user_id;

  IF v_sprint IS NULL THEN
    RAISE EXCEPTION 'Sprint not found or not owned by user';
  END IF;

  IF v_sprint.status != 'active' THEN
    RAISE EXCEPTION 'Sprint is not active';
  END IF;

  UPDATE sprints SET status = 'completed' WHERE id = p_sprint_id;

  v_result := jsonb_build_object('completed_sprint_id', p_sprint_id);

  v_next_start := v_sprint.end_date + 1;
  v_next_end := v_sprint.end_date + 7;

  v_next_sprint_id := create_sprint_with_metrics(v_next_start, v_next_end);
  v_result := v_result || jsonb_build_object('new_sprint_id', v_next_sprint_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

REVOKE ALL ON FUNCTION complete_sprint(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_sprint(UUID) TO authenticated;


-- RPC: Auto-Complete Expired Sprints (admin/cron)
CREATE OR REPLACE FUNCTION auto_complete_expired_sprints()
RETURNS INT AS $$
DECLARE
  v_sprint RECORD;
  v_count INT := 0;
  v_next_start DATE;
  v_next_end DATE;
  v_new_sprint_id UUID;
BEGIN
  FOR v_sprint IN
    SELECT id, user_id, end_date FROM sprints
    WHERE status = 'active' AND end_date < CURRENT_DATE
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE sprints SET status = 'completed' WHERE id = v_sprint.id;

    v_next_start := v_sprint.end_date + 1;
    v_next_end := v_sprint.end_date + 7;

    INSERT INTO sprints (user_id, name, start_date, end_date, status)
    VALUES (
      v_sprint.user_id,
      'Week of ' || TO_CHAR(v_next_start, 'Mon DD'),
      v_next_start,
      v_next_end,
      'active'
    )
    RETURNING id INTO v_new_sprint_id;

    PERFORM seed_sprint_metrics(v_new_sprint_id, v_sprint.user_id);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

REVOKE ALL ON FUNCTION auto_complete_expired_sprints() FROM PUBLIC;


-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sprints', 'sprint_metrics', 'sprint_metric_entries');

-- Check enums exist
SELECT typname FROM pg_type WHERE typname IN ('sprint_status', 'metric_type');

-- Check functions exist
SELECT proname FROM pg_proc
WHERE proname IN (
  'update_updated_at',
  'is_service_role',
  'enforce_metric_user_ownership',
  'enforce_entry_constraints',
  'seed_sprint_metrics',
  'create_sprint_with_metrics',
  'complete_sprint',
  'auto_complete_expired_sprints'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('sprints', 'sprint_metrics', 'sprint_metric_entries');

-- Success message
SELECT 'Sprint Focus System migration completed successfully!' as status;
