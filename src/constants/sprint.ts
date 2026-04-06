// =====================================================
// SPRINT FOCUS SYSTEM CONSTANTS
// Following DRY principle - single source of truth
// =====================================================

import type { MetricType, MetricComponents } from '../types/sprint';

/**
 * Static components descriptor for each metric type.
 * Labels are defaults; for time_of_day they are user-editable.
 */
export const COMPONENTS_FOR_TYPE: Record<MetricType, MetricComponents> = {
  sleep: {
    bed_at:  { type: 'timestamp', label: 'Start Time' },
    wake_at: { type: 'timestamp', label: 'End Time' },
  },
  boolean: {
    completed: { type: 'boolean', label: 'Completed' },
  },
  duration: {
    duration_minutes: { type: 'number', unit: 'min', label: 'Duration' },
  },
};

// =====================================================
// SPRINT TIMING
// =====================================================

/**
 * Sprint duration in days
 */
export const SPRINT_DURATION_DAYS = 7;

/**
 * User timezone (hardcoded for v1)
 */
export const USER_TIMEZONE = 'America/New_York';

// =====================================================
// CHARACTER LIMITS
// =====================================================

/**
 * Maximum characters for notes field
 * Matches database constraint
 */
export const MAX_NOTES_LENGTH = 2500;

// =====================================================
// UI DISPLAY
// =====================================================

/**
 * Day abbreviations for grid header
 */
export const DAY_ABBREVIATIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Colors for cell states
 */
export const CELL_COLORS = {
  met: '#22c55e',        // Green - target met
  notMet: '#f97316',     // Orange - target not met
  noEntry: '#9ca3af',    // Gray - no entry
  future: '#e5e7eb',     // Light gray - future date
} as const;

/**
 * Progress bar colors
 */
export const PROGRESS_COLORS = {
  onTrack: '#22c55e',    // Green
  atRisk: '#f59e0b',     // Yellow/amber
  behind: '#ef4444',     // Red
} as const;

// =====================================================
// UI LABELS & MESSAGES
// =====================================================

export const UI_LABELS = {
  // Dashboard
  dashboardTitle: 'Sprint Focus',
  dashboardSubtitle: '{n} metric{s}',
  progressColumn: 'Progress',

  // Entry panel
  entryPanelTitle: 'Log Entry',
  selectDay: 'Select Day',
  today: 'Today',
  yesterday: 'Yesterday',

  // Metric inputs
  sleepBedtime: 'Bedtime',
  sleepWakeTime: 'Wake Time',
  sleepDuration: 'Duration',
  routineCompleted: 'Completed',
  durationMinutes: 'Minutes',
  notesLabel: 'Notes (optional)',
  notesPlaceholder: 'Add notes about this entry...',

  // Actions
  save: 'Save',
  cancel: 'Cancel',
  expand: 'Expand',
  collapse: 'Collapse',

  // Coming soon
  comingSoonTitle: 'Sprint Focus Coming Soon',
  comingSoonMessage: 'This feature is currently in beta testing.',

  // Sprint history
  historyTitle: 'Past Sprints',
  noSprintsYet: 'No completed sprints yet',
  viewDetails: 'View Details',
  exportSprint: 'Export JSON',

  // Common
  loading: 'Loading...',
  error: 'An error occurred',
} as const;

export const ERROR_MESSAGES = {
  notAuthenticated: 'You must be logged in to use this feature',
  featureNotEnabled: 'Sprint feature is not enabled for your account',
  sprintNotFound: 'Sprint not found',
  metricNotFound: 'Metric not found',
  entryNotFound: 'Entry not found',
  createSprintFailed: 'Failed to create sprint',
  createEntryFailed: 'Failed to save entry',
  updateEntryFailed: 'Failed to update entry',
  fetchFailed: 'Failed to load sprint data',
  invalidDate: 'Invalid date',
  outsideEditWindow: 'Can only edit entries for today or yesterday',
  outsideSprintRange: 'Entry date must be within sprint date range',
  invalidSleepData: 'Wake time must be after bedtime',
  sleepDurationTooLong: 'Sleep duration cannot exceed 20 hours',
  notesTooLong: `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`,
} as const;

// =====================================================
// VALIDATION RULES
// =====================================================

export const VALIDATION_RULES = {
  notes: {
    required: false,
    maxLength: MAX_NOTES_LENGTH,
  },
  duration: {
    min: 0,
    max: 1440, // 24 hours in minutes
  },
  sleepDuration: {
    maxHours: 20,
  },
} as const;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get the Monday of the current week
 */
export const getCurrentWeekMonday = (): Date => {
  const now = new Date();
  // Convert to user timezone
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: USER_TIMEZONE }));
  const dayOfWeek = localDate.getDay();
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want Monday = 0, so adjust
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(localDate);
  monday.setDate(localDate.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Format a date as YYYY-MM-DD
 */
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get sprint dates for the current week
 */
export const getCurrentSprintDates = (): { startDate: string; endDate: string } => {
  const monday = getCurrentWeekMonday();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: formatDateISO(monday),
    endDate: formatDateISO(sunday),
  };
};
