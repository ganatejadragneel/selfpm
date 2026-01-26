-- Migration: Create Sprint RPC Functions
-- Date: 2026-01-25
-- Purpose: Atomic operations for sprint lifecycle management

-- ============================================================
-- HELPER: Seed Sprint Metrics (internal use only)
-- ============================================================

CREATE OR REPLACE FUNCTION seed_sprint_metrics(
  p_sprint_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- 1. Sleep
  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id,
    p_user_id,
    'Sleep',
    'sleep',
    '{"bed_at": {"type": "timestamp", "label": "Bedtime"}, "wake_at": {"type": "timestamp", "label": "Wake Time"}}'::JSONB,
    '{"field": "wake_at", "operator": "<=", "value": "04:30", "type": "time_of_day"}'::JSONB,
    '{"type": "frequency", "count": 3, "total": 7}'::JSONB,
    1
  );

  -- 2. Morning Routine
  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id,
    p_user_id,
    'Morning Routine',
    'boolean',
    '{"completed": {"type": "boolean", "label": "Completed (Jabam + Reading + Visualization)"}}'::JSONB,
    '{"field": "completed", "operator": "==", "value": true, "type": "boolean"}'::JSONB,
    '{"type": "frequency", "count": 6, "total": 7}'::JSONB,
    2
  );

  -- 3. IP Attack
  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id,
    p_user_id,
    'IP Attack',
    'duration',
    '{"duration_minutes": {"type": "number", "unit": "minutes", "label": "Duration"}}'::JSONB,
    '{"field": "duration_minutes", "operator": ">=", "value": 120, "type": "number"}'::JSONB,
    '{"type": "frequency", "count": 6, "total": 7}'::JSONB,
    3
  );

  -- 4. Gym
  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id,
    p_user_id,
    'Gym',
    'duration',
    '{"duration_minutes": {"type": "number", "unit": "minutes", "label": "Duration"}}'::JSONB,
    '{"field": "duration_minutes", "operator": ">=", "value": 60, "type": "number"}'::JSONB,
    '{"type": "frequency", "count": 5, "total": 7}'::JSONB,
    4
  );

  -- 5. Anthropic Progress
  INSERT INTO sprint_metrics (sprint_id, user_id, name, metric_type, components, daily_target, weekly_target, display_order)
  VALUES (
    p_sprint_id,
    p_user_id,
    'Anthropic Progress',
    'duration',
    '{"duration_minutes": {"type": "number", "unit": "minutes", "label": "Duration"}}'::JSONB,
    '{"field": "duration_minutes", "operator": ">=", "value": 120, "type": "number"}'::JSONB,
    '{"type": "frequency", "count": 6, "total": 7}'::JSONB,
    5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Lock down: only callable by SECURITY DEFINER functions, not directly by users
REVOKE ALL ON FUNCTION seed_sprint_metrics(UUID, UUID) FROM PUBLIC;
-- Do NOT grant to authenticated - only internal definer functions call it


-- ============================================================
-- RPC: Create Sprint with Seed Metrics
-- ============================================================

CREATE OR REPLACE FUNCTION create_sprint_with_metrics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_sprint_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Sprint feature gating: only enabled for specific user
  -- This is the server-side enforcement (client also checks, but this is authoritative)
  IF v_user_id != '41a94776-0ab1-4ae3-a752-2cb1c6ae0d27' THEN
    RAISE EXCEPTION 'Sprint feature not enabled for this user';
  END IF;

  -- Validate start_date is Monday (ISODOW: 1 = Monday)
  IF EXTRACT(ISODOW FROM p_start_date) != 1 THEN
    RAISE EXCEPTION 'Start date must be a Monday. Got: %', p_start_date;
  END IF;

  -- Validate end_date is exactly 6 days after start (Sunday)
  IF p_end_date != p_start_date + 6 THEN
    RAISE EXCEPTION 'End date must be 6 days after start date (Sunday). Expected: %, Got: %',
      p_start_date + 6, p_end_date;
  END IF;

  -- Check no active sprint exists
  IF EXISTS (SELECT 1 FROM sprints WHERE user_id = v_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'User already has an active sprint';
  END IF;

  -- Create sprint
  INSERT INTO sprints (user_id, name, start_date, end_date, status)
  VALUES (
    v_user_id,
    'Week of ' || TO_CHAR(p_start_date, 'Mon DD'),
    p_start_date,
    p_end_date,
    'active'
  )
  RETURNING id INTO v_sprint_id;

  -- Seed the 5 metrics using helper
  PERFORM seed_sprint_metrics(v_sprint_id, v_user_id);

  RETURN v_sprint_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Lock down permissions
REVOKE ALL ON FUNCTION create_sprint_with_metrics(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_sprint_with_metrics(DATE, DATE) TO authenticated;


-- ============================================================
-- RPC: Complete Sprint (manual completion)
-- ============================================================

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
  -- Get sprint and verify ownership
  SELECT * INTO v_sprint FROM sprints
  WHERE id = p_sprint_id AND user_id = v_user_id;

  IF v_sprint IS NULL THEN
    RAISE EXCEPTION 'Sprint not found or not owned by user';
  END IF;

  IF v_sprint.status != 'active' THEN
    RAISE EXCEPTION 'Sprint is not active';
  END IF;

  -- Mark as completed
  UPDATE sprints SET status = 'completed' WHERE id = p_sprint_id;

  v_result := jsonb_build_object('completed_sprint_id', p_sprint_id);

  -- Auto-create next sprint
  v_next_start := v_sprint.end_date + 1;
  v_next_end := v_sprint.end_date + 7;

  v_next_sprint_id := create_sprint_with_metrics(v_next_start, v_next_end);
  v_result := v_result || jsonb_build_object('new_sprint_id', v_next_sprint_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Lock down permissions
REVOKE ALL ON FUNCTION complete_sprint(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_sprint(UUID) TO authenticated;


-- ============================================================
-- RPC: Auto-Complete Expired Sprints (admin/cron use)
-- This function does NOT use auth.uid() - it's for service role
-- ============================================================

CREATE OR REPLACE FUNCTION auto_complete_expired_sprints()
RETURNS INT AS $$
DECLARE
  v_sprint RECORD;
  v_count INT := 0;
  v_next_start DATE;
  v_next_end DATE;
  v_new_sprint_id UUID;
BEGIN
  -- Find all active sprints where end_date has passed
  -- Use FOR UPDATE SKIP LOCKED for concurrency safety (if cron runs twice)
  FOR v_sprint IN
    SELECT id, user_id, end_date FROM sprints
    WHERE status = 'active' AND end_date < CURRENT_DATE
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark as completed
    UPDATE sprints SET status = 'completed' WHERE id = v_sprint.id;

    -- Calculate next sprint dates
    v_next_start := v_sprint.end_date + 1;
    v_next_end := v_sprint.end_date + 7;

    -- Create next sprint directly (bypassing the user-gated RPC)
    INSERT INTO sprints (user_id, name, start_date, end_date, status)
    VALUES (
      v_sprint.user_id,
      'Week of ' || TO_CHAR(v_next_start, 'Mon DD'),
      v_next_start,
      v_next_end,
      'active'
    )
    RETURNING id INTO v_new_sprint_id;

    -- Seed metrics using helper
    PERFORM seed_sprint_metrics(v_new_sprint_id, v_sprint.user_id);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- Only service role can execute this
REVOKE ALL ON FUNCTION auto_complete_expired_sprints() FROM PUBLIC;
-- Service role has implicit access via SECURITY DEFINER


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify functions exist
SELECT proname, prosecdef as security_definer
FROM pg_proc
WHERE proname IN (
  'seed_sprint_metrics',
  'create_sprint_with_metrics',
  'complete_sprint',
  'auto_complete_expired_sprints'
);

-- Verify permissions on seed_sprint_metrics (should have no grants)
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'seed_sprint_metrics';

-- Verify permissions on create_sprint_with_metrics (should have authenticated grant)
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'create_sprint_with_metrics';
