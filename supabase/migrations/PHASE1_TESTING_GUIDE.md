# Phase 1: Database Migration Testing Guide

## How to Run the Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `SPRINT_COMBINED_MIGRATION.sql`
3. Paste into the SQL Editor
4. Click "Run"
5. Verify the final verification queries show expected results

---

## Test Cases to Run After Migration

Run these tests in the SQL Editor after the migration completes.

### Test 1: Verify Tables and Functions Exist

```sql
-- Should return 3 rows: sprints, sprint_metrics, sprint_metric_entries
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sprints', 'sprint_metrics', 'sprint_metric_entries');

-- Should return 2 rows: sprint_status, metric_type
SELECT typname FROM pg_type WHERE typname IN ('sprint_status', 'metric_type');

-- Should return 8 rows (all functions)
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
```

### Test 2: Test is_service_role() Never Throws

```sql
-- Should return FALSE (not service role context)
SELECT is_service_role();

-- Should not throw any errors
SELECT is_service_role() as result;
```

### Test 3: Test create_sprint_with_metrics() - Valid Request

**Important**: Run this as your authenticated user (use the app or set auth context).

From the app's perspective, you can test this after Phase 3 when the UI is connected.

For now, test with direct SQL using service role:

```sql
-- First, check your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Test the RPC exists and has correct signature
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'create_sprint_with_metrics';
```

### Test 4: Test Date Validation

```sql
-- These should FAIL with appropriate errors (test from app or with auth context):

-- Non-Monday start date (should fail)
-- SELECT create_sprint_with_metrics('2026-01-28', '2026-02-03');
-- Expected error: "Start date must be a Monday"

-- Wrong duration (should fail)
-- SELECT create_sprint_with_metrics('2026-01-27', '2026-02-03');
-- Expected error: "End date must be 6 days after start date"
```

### Test 5: Test Entry Type Validation

After you have a sprint created (Phase 3+), test entry validation:

```sql
-- Get a metric ID for testing (replace with actual IDs)
-- SELECT id, name, metric_type FROM sprint_metrics LIMIT 5;

-- Sleep entry with missing fields - should FAIL
-- INSERT INTO sprint_metric_entries (metric_id, user_id, entry_date, bed_at)
-- VALUES ('metric-uuid', 'user-uuid', '2026-01-27', '2026-01-26 22:00:00-05');
-- Expected error: "Sleep entries must have bed_at and wake_at"

-- Sleep entry with wake_at <= bed_at - should FAIL
-- INSERT INTO sprint_metric_entries (metric_id, user_id, entry_date, bed_at, wake_at)
-- VALUES ('metric-uuid', 'user-uuid', '2026-01-27',
--         '2026-01-27 05:00:00-05', '2026-01-27 04:00:00-05');
-- Expected error: "wake_at must be after bed_at"

-- Boolean entry with wrong fields - should FAIL
-- INSERT INTO sprint_metric_entries (metric_id, user_id, entry_date, duration_minutes)
-- VALUES ('boolean-metric-uuid', 'user-uuid', '2026-01-27', 120);
-- Expected error: "Boolean entries must have completed"
```

### Test 6: Test seed_sprint_metrics is Locked Down

```sql
-- This should FAIL for authenticated users
-- (The function exists but is not directly callable)
SELECT has_function_privilege('authenticated', 'seed_sprint_metrics(uuid, uuid)', 'execute');
-- Should return FALSE
```

### Test 7: Verify RLS Policies

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('sprints', 'sprint_metrics', 'sprint_metric_entries');
-- All should show rowsecurity = true

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('sprints', 'sprint_metrics', 'sprint_metric_entries')
ORDER BY tablename, policyname;
-- Should show 4 policies per table
```

### Test 8: Test Partial Unique Index

```sql
-- This tests that only one active sprint per user is allowed
-- After creating one sprint, trying to create another should fail
-- with "User already has an active sprint"
```

---

## Expected Verification Output

After running `SPRINT_COMBINED_MIGRATION.sql`, the final queries should output:

1. **Tables**: 3 rows (sprints, sprint_metrics, sprint_metric_entries)
2. **Enums**: 2 rows (sprint_status, metric_type)
3. **Functions**: 8 rows (all function names)
4. **RLS**: All tables show `rowsecurity = true`
5. **Final message**: "Sprint Focus System migration completed successfully!"

---

## Rollback (if needed)

If you need to completely remove the sprint system:

```sql
-- WARNING: This deletes all sprint data!
DROP FUNCTION IF EXISTS auto_complete_expired_sprints() CASCADE;
DROP FUNCTION IF EXISTS complete_sprint(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_sprint_with_metrics(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS seed_sprint_metrics(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS enforce_entry_constraints() CASCADE;
DROP FUNCTION IF EXISTS enforce_metric_user_ownership() CASCADE;
DROP TABLE IF EXISTS sprint_metric_entries CASCADE;
DROP TABLE IF EXISTS sprint_metrics CASCADE;
DROP TABLE IF EXISTS sprints CASCADE;
DROP FUNCTION IF EXISTS is_service_role() CASCADE;
DROP TYPE IF EXISTS metric_type CASCADE;
DROP TYPE IF EXISTS sprint_status CASCADE;
-- Note: Don't drop update_updated_at() if other tables use it
```

---

## Next Steps

After Phase 1 testing passes:
- Phase 2: TypeScript types and Zustand store
- Phase 3: Sprint auto-creation on dashboard visit
