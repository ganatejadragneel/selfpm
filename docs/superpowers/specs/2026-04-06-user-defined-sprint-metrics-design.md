# User-Defined Sprint Metrics

**Date:** 2026-04-06
**Status:** Approved

## Problem

Sprint metrics are hardcoded to 5 specific items (Sleep, Morning Routine, IP Attack, Gym, Anthropic Progress) in both the frontend constants and the `create_sprint_with_metrics` Supabase RPC. Users cannot add, remove, or customise metrics. New sprints always start with these 5 pre-seeded items.

## Goal

Allow users to define their own sprint metrics — any number, any configuration — while keeping the ability to clone metrics from a previous sprint or pick suggestions from the last 4 sprints.

---

## Metric Types

Three types, unchanged from current schema:

| Type | Description | Daily target input |
|---|---|---|
| **Time of Day** | Renamed from "sleep"; tracks a timestamp (e.g. wake time) | Time picker (HH:MM) |
| **Boolean** | Done / not done | Toggle |
| **Duration** | Time in minutes | Number input |

---

## Database Changes

### RPCs

| Before | After |
|---|---|
| `create_sprint_with_metrics(start, end)` — creates sprint + seeds 5 hardcoded metrics | `create_sprint(start, end)` — creates empty sprint, no metrics |
| `complete_sprint(sprint_id)` — auto-seeds 5 metrics on new sprint | `complete_sprint(sprint_id)` — creates next sprint empty, no seeding |
| _(new)_ | `clone_sprint_metrics(from_sprint_id, to_sprint_id)` — atomically copies all metric rows |

### Tables

No schema changes required. `sprint_metrics` is already fully generic (`name`, `metric_type`, `daily_target` JSONB, `weekly_target` JSONB, `display_order`).

Metric CRUD (add / edit / delete) is handled via direct Supabase table operations from the frontend — no RPCs needed.

### Deletions

- `seed_sprint_metrics` DB function — removed entirely.

---

## Frontend Changes

### Removed

- `FOCUS_METRICS`, `SLEEP_WAKE_TARGET`, `DURATION_TARGETS` from `src/constants/sprint.ts`
- `FocusMetricName` type from `src/types/sprint.ts`
- Any hardcoded metric name string literals in logic (e.g. `'IP Attack'`, `'Gym'`)
- Hardcoded subtitle "Track your 5 core metrics" → replaced with dynamic count

### Start New Sprint screen

Shown when no active sprint exists (navigating to `/sprints` or after completing one).

- **First-ever sprint** (no completed sprints in history): shows only **Start Fresh**
- **Subsequent sprints**: shows **Clone Last Sprint** + **Start Fresh**

Clone Last Sprint calls `clone_sprint_metrics(lastSprintId, newSprintId)` and navigates directly to the populated grid. Start Fresh creates an empty sprint and opens the Manage Metrics panel.

### Manage Metrics panel

Persistent panel on the sprint page (always visible, active or not). Contains:

- List of current metrics with drag handles for reordering
- Per-metric row: type badge, name, target summary, edit button, delete button
- **Add Metric** button at the bottom

Reordering updates `display_order` on the affected rows via direct table update.

### Add / Edit Metric form

Fields:

| Field | Input | Notes |
|---|---|---|
| Name | Text input | Shows suggestion dropdown on focus/type |
| Type | 3-option selector | Time of Day / Boolean / Duration |
| Daily target | Context-sensitive | Time picker / toggle / number (minutes) |
| Weekly target | Number input | "X out of 7 days" |

**Suggestions dropdown** (shown when name field is focused):

- Fetched once when the Manage Metrics panel opens
- Query: last 4 completed sprints → pull their metrics → deduplicate by name (keep most recent config if duplicate names)
- Each suggestion shows: name, type badge, daily target summary, weekly target, "used N sprints ago"
- Selecting a suggestion pre-fills all fields; user can override before saving
- If no completed sprints exist, no suggestions shown — blank form only

A **suggestions side panel** displays the same list persistently beside the form for quick reference and click-to-fill.

---

## Data Flow

### New sprint (fresh)
1. User hits `/sprints`, no active sprint found
2. Start New Sprint screen shown
3. User clicks Start Fresh → `create_sprint(startDate, endDate)` called → empty sprint created
4. Manage Metrics panel opens, user adds metrics via form
5. Each metric saved via direct insert to `sprint_metrics`

### New sprint (clone)
1. Same entry point
2. User clicks Clone Last Sprint → `create_sprint` + `clone_sprint_metrics(lastId, newId)` called atomically
3. Sprint opens with cloned metrics populated in grid

### Adding a metric mid-sprint
1. User opens Manage Metrics panel on active sprint
2. Clicks Add Metric → form opens with suggestions from last 4 sprints
3. Fills form (or selects suggestion) → insert to `sprint_metrics`
4. Grid re-renders with new metric row

### Completing a sprint
1. User clicks Complete Sprint → `complete_sprint(sprintId)` called
2. Current sprint marked complete, new empty sprint created for next week
3. User lands on Start New Sprint screen (with Clone Last Sprint option now available)

---

## Migration / Backwards Compatibility

Existing active sprints with the 5 hardcoded metrics are unaffected — their rows remain in `sprint_metrics` and the grid/entry UI renders them dynamically already. No data migration needed. The only change in behaviour is that completing a sprint no longer auto-seeds the next one.
