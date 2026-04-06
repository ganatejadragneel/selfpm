// =====================================================
// SPRINT FOCUS SYSTEM TYPE DEFINITIONS
// Following project patterns from src/types/blueprint.ts
// =====================================================

// =====================================================
// DATABASE ENTITY TYPES
// =====================================================

/**
 * Sprint Status - matches database enum sprint_status
 */
export type SprintStatus = 'active' | 'completed';

/**
 * Metric Type - matches database enum metric_type
 */
export type MetricType = 'sleep' | 'boolean' | 'duration';

/**
 * Sprint - Represents a 7-day sprint (Monday-Sunday)
 * Maps directly to sprints table
 */
export interface Sprint {
  id: string;
  user_id: string;
  name: string;
  start_date: string; // ISO date string (YYYY-MM-DD), always a Monday
  end_date: string;   // ISO date string (YYYY-MM-DD), always a Sunday
  status: SprintStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Sprint Metric - Configuration for a metric tracked within a sprint
 * Maps directly to sprint_metrics table
 */
export interface SprintMetric {
  id: string;
  sprint_id: string;
  user_id: string;
  name: string;
  metric_type: MetricType;
  components: MetricComponents;
  daily_target: DailyTarget;
  weekly_target: WeeklyTarget;
  display_order: number;
  created_at: string;
}

/**
 * Sprint Metric Entry - Daily data entry for a metric
 * Maps directly to sprint_metric_entries table
 */
export interface SprintMetricEntry {
  id: string;
  metric_id: string;
  user_id: string;
  entry_date: string; // ISO date string (YYYY-MM-DD)

  // Sleep entries (TIMESTAMPTZ in DB)
  bed_at: string | null;  // ISO timestamp
  wake_at: string | null; // ISO timestamp

  // Boolean entries
  completed: boolean | null;

  // Duration entries (minutes)
  duration_minutes: number | null;

  // Optional notes
  notes: string | null;

  created_at: string;
  updated_at: string;
}

// =====================================================
// JSONB FIELD TYPES
// =====================================================

/**
 * Metric component configuration stored in JSONB
 */
export interface MetricComponents {
  // For sleep
  bed_at?: { type: 'timestamp'; label: string };
  wake_at?: { type: 'timestamp'; label: string };

  // For boolean
  completed?: { type: 'boolean'; label: string };

  // For duration
  duration_minutes?: { type: 'number'; unit: string; label: string };
}

/**
 * Daily target configuration stored in JSONB
 */
export type DailyTarget =
  | { type: 'time_of_day'; target_start: string; target_end: string }
  | { type: 'boolean'; value: true }
  | { type: 'number'; value: number };

/**
 * Weekly target configuration stored in JSONB
 */
export interface WeeklyTarget {
  type: 'frequency';
  count: number; // Number of days required
  total: number; // Always 7
}

// =====================================================
// VIEW MODELS (for UI components)
// =====================================================

/**
 * Sprint with all metrics and their entries
 */
export interface SprintWithMetrics extends Sprint {
  metrics: SprintMetricWithEntries[];
}

/**
 * Metric with all its daily entries
 */
export interface SprintMetricWithEntries extends SprintMetric {
  entries: SprintMetricEntry[];
}

/**
 * Progress for a single metric within a sprint
 */
export interface MetricProgress {
  metricId: string;
  metricName: string;
  current: number;      // Days that met daily target
  target: number;       // Weekly target count
  totalEntries: number; // Days with any entry
  daysElapsed: number;  // Days so far in the sprint
  isMet: boolean;       // current >= target
}

/**
 * Overall sprint progress summary
 */
export interface SprintProgress {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  daysElapsed: number;
  daysRemaining: number;
  metrics: MetricProgress[];
  overallScore: number; // Metrics that are on track (percentage)
}

// =====================================================
// ENTRY DATA TYPES (for creating/updating entries)
// =====================================================

/**
 * Sleep entry data
 */
export interface SleepEntryData {
  bed_at: string;  // ISO timestamp
  wake_at: string; // ISO timestamp
  notes?: string;
}

/**
 * Boolean entry data
 */
export interface BooleanEntryData {
  completed: boolean;
  notes?: string;
}

/**
 * Duration entry data
 */
export interface DurationEntryData {
  duration_minutes: number;
  notes?: string;
}

/**
 * Union type for entry data based on metric type
 */
export type EntryData = SleepEntryData | BooleanEntryData | DurationEntryData;

/**
 * Create entry request
 */
export interface CreateEntryRequest {
  metric_id: string;
  entry_date: string;
  data: EntryData;
}

/**
 * Update entry request
 */
export interface UpdateEntryRequest {
  entry_id: string;
  data: Partial<EntryData>;
}

// =====================================================
// RPC RESPONSE TYPES
// =====================================================

/**
 * Response from create_sprint RPC
 */
export type CreateSprintResponse = string; // Returns sprint UUID

/**
 * Response from complete_sprint RPC
 */
export type CompleteSprintResponse = { completed_sprint_id: string };

// =====================================================
// UI STATE TYPES
// =====================================================

/**
 * Selected date for entry editing
 */
export type EditableDay = 'today' | 'yesterday';

/**
 * Cell display value for the grid
 */
export interface CellDisplayValue {
  hasEntry: boolean;
  displayText: string;       // e.g., "7.5h / 5:15am", "145", "✓"
  metTarget: boolean | null; // null if no entry
  hasNotes: boolean;
  notes: string | null;      // Full notes text for popup/tooltip
}

/**
 * Day column in the grid
 */
export interface DayColumn {
  date: string;         // ISO date
  dayName: string;      // "Mon", "Tue", etc.
  dayNumber: number;    // 1-31
  isToday: boolean;
  isYesterday: boolean;
  isEditable: boolean;  // today or yesterday
  isPast: boolean;      // before sprint start
  isFuture: boolean;    // after today
}

// =====================================================
// EXPORT TYPES
// =====================================================

/**
 * Exported sprint data structure (JSON export)
 */
export interface SprintExport {
  export_version: string;
  exported_at: string;
  sprint: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: SprintStatus;
  };
  metrics: Array<{
    name: string;
    metric_type: MetricType;
    daily_target: string;
    weekly_target: WeeklyTarget;
    weekly_result: {
      achieved: number;
      target: number;
      met: boolean;
    };
    entries: Array<{
      date: string;
      has_entry: boolean;
      values: Record<string, unknown> | null;
      met_target: boolean | null;
      notes: string | null;
    }>;
  }>;
  summary: {
    metrics_fully_met: number;
    metrics_total: number;
    days_with_all_entries: number;
    days_total: number;
  };
}

// =====================================================
// TYPE GUARDS
// =====================================================

export const isSleepEntry = (entry: SprintMetricEntry): boolean => {
  return entry.bed_at !== null && entry.wake_at !== null;
};

export const isBooleanEntry = (entry: SprintMetricEntry): boolean => {
  return entry.completed !== null;
};

export const isDurationEntry = (entry: SprintMetricEntry): boolean => {
  return entry.duration_minutes !== null;
};

export const isSleepEntryData = (data: EntryData): data is SleepEntryData => {
  return 'bed_at' in data && 'wake_at' in data;
};

export const isBooleanEntryData = (data: EntryData): data is BooleanEntryData => {
  return 'completed' in data;
};

export const isDurationEntryData = (data: EntryData): data is DurationEntryData => {
  return 'duration_minutes' in data;
};

// =====================================================
// HELPER TYPES
// =====================================================

/** A metric suggestion drawn from a past sprint */
export interface SprintSuggestion {
  name: string;
  metric_type: MetricType;
  components: MetricComponents;
  daily_target: DailyTarget;
  weekly_target: WeeklyTarget;
  usedNSprintsAgo: number; // 1 = most recent completed sprint
}
