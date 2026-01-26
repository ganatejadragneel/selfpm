# Sprint Focus System - Database Migration

## Quick Start

**Run this file in Supabase SQL Editor:**

```
SPRINT_COMBINED_MIGRATION.sql
```

That's it. Copy the entire file contents, paste into Supabase Dashboard → SQL Editor, and click Run.

---

## What Gets Created

### Tables
- `sprints` - Sprint records (7-day periods)
- `sprint_metrics` - The 5 focus metrics per sprint
- `sprint_metric_entries` - Daily data entries

### Enums
- `sprint_status` - 'active' | 'completed'
- `metric_type` - 'sleep' | 'boolean' | 'duration'

### Functions
- `is_service_role()` - Helper for admin detection
- `seed_sprint_metrics()` - Creates the 5 default metrics
- `create_sprint_with_metrics()` - Main RPC for sprint creation
- `complete_sprint()` - Complete sprint and auto-create next
- `auto_complete_expired_sprints()` - Admin/cron function

### Triggers
- Entry validation (type-specific fields, edit window, date range)
- Ownership enforcement (user_id must match)

### RLS Policies
- Users can only access their own data
- Service role bypass for admin operations

---

## Verification

After running, the final output should show:
- 3 tables created
- 2 enums created
- 8 functions created
- "Sprint Focus System migration completed successfully!"

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `SPRINT_COMBINED_MIGRATION.sql` | **RUN THIS ONE** - All SQL in one file |
| `20260125000001_create_sprint_enums.sql` | Individual migration (reference only) |
| `20260125000002_create_sprints_table.sql` | Individual migration (reference only) |
| `20260125000003_create_sprint_metrics_table.sql` | Individual migration (reference only) |
| `20260125000004_create_sprint_entries_table.sql` | Individual migration (reference only) |
| `20260125000005_create_sprint_rpcs.sql` | Individual migration (reference only) |
| `PHASE1_TESTING_GUIDE.md` | Detailed testing instructions |

---

## Rollback

If you need to remove everything:

```sql
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
```
