// =====================================================
// SPRINT FOCUS SYSTEM CONSTANTS
// Following DRY principle - single source of truth
// =====================================================

import type { FocusMetricConfig } from '../types/sprint';

// =====================================================
// USER GATING
// =====================================================

/**
 * Only this user ID has sprint feature enabled
 * Server-side enforcement in create_sprint_with_metrics RPC
 * Client-side check for showing/hiding UI
 */
export const SPRINT_ENABLED_USER_ID = '41a94776-0ab1-4ae3-a752-2cb1c6ae0d27';

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
// THE 5 FOCUS METRICS
// =====================================================

/**
 * Configuration for the 5 hardcoded focus metrics
 * Matches what seed_sprint_metrics() creates in the database
 */
export const FOCUS_METRICS: FocusMetricConfig[] = [
  {
    name: 'Sleep',
    type: 'sleep',
    dailyTargetDescription: 'Wake by 4:30am',
    weeklyTargetCount: 3,
  },
  {
    name: 'Morning Routine',
    type: 'boolean',
    dailyTargetDescription: 'Complete routine',
    weeklyTargetCount: 6,
  },
  {
    name: 'IP Attack',
    type: 'duration',
    dailyTargetDescription: '120+ minutes',
    weeklyTargetCount: 6,
  },
  {
    name: 'Gym',
    type: 'duration',
    dailyTargetDescription: '60+ minutes',
    weeklyTargetCount: 5,
  },
  {
    name: 'Anthropic Progress',
    type: 'duration',
    dailyTargetDescription: '120+ minutes',
    weeklyTargetCount: 6,
  },
] as const;

// =====================================================
// DAILY TARGETS (for evaluation)
// =====================================================

/**
 * Wake time threshold for sleep target (4:30 AM)
 * Stored as hours and minutes for comparison
 */
export const SLEEP_WAKE_TARGET = {
  hours: 4,
  minutes: 30,
} as const;

/**
 * Duration thresholds in minutes
 */
export const DURATION_TARGETS = {
  'IP Attack': 120,
  'Gym': 60,
  'Anthropic Progress': 120,
} as const;

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
  dashboardSubtitle: 'Track your 5 core metrics',
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
 * Check if a user has sprint feature enabled
 */
export const isSprintEnabledForUser = (userId: string | undefined): boolean => {
  return userId === SPRINT_ENABLED_USER_ID;
};

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
