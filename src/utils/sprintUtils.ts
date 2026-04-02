// =====================================================
// SPRINT UTILITY FUNCTIONS
// =====================================================

import { format, parseISO, eachDayOfInterval, isFuture } from 'date-fns';
import {
  SLEEP_WAKE_TARGET,
  DURATION_TARGETS,
  USER_TIMEZONE,
  DAY_ABBREVIATIONS,
} from '../constants/sprint';
import type {
  SprintMetricEntry,
  SprintMetricWithEntries,
  DayColumn,
  CellDisplayValue,
  MetricType,
} from '../types/sprint';

// =====================================================
// DATE UTILITIES
// =====================================================

/**
 * Get today's date in user timezone as YYYY-MM-DD
 */
export const getTodayDateString = (): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: USER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

/**
 * Get yesterday's date in user timezone as YYYY-MM-DD
 */
export const getYesterdayDateString = (): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: USER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(yesterday);
};

/**
 * Generate day columns for a sprint
 */
export const generateDayColumns = (startDate: string, endDate: string): DayColumn[] => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const days = eachDayOfInterval({ start, end });

  return days.map((day, index) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return {
      date: dateStr,
      dayName: DAY_ABBREVIATIONS[index] || format(day, 'EEE'),
      dayNumber: day.getDate(),
      isToday: dateStr === today,
      isYesterday: dateStr === yesterday,
      isFuture: isFuture(day) && dateStr !== today,
      isPast: dateStr < yesterday,
      isEditable: dateStr === today || dateStr === yesterday,
    };
  });
};

// =====================================================
// SLEEP UTILITIES
// =====================================================

/**
 * Format wake time for display (e.g., "4:15am")
 */
export const formatWakeTime = (wakeAt: string): string => {
  const date = new Date(wakeAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? 'am' : 'pm';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
};

/**
 * Calculate sleep duration in hours
 */
export const calculateSleepDuration = (bedAt: string, wakeAt: string): number => {
  const bed = new Date(bedAt);
  const wake = new Date(wakeAt);
  const diffMs = wake.getTime() - bed.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Format sleep duration for display (e.g., "7.5h")
 */
export const formatSleepDuration = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
};

/**
 * Check if wake time meets target (≤ 4:30am)
 */
export const checkWakeTimeTarget = (wakeAt: string): boolean => {
  const date = new Date(wakeAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Target: wake by 4:30am
  if (hours < SLEEP_WAKE_TARGET.hours) return true;
  if (hours === SLEEP_WAKE_TARGET.hours && minutes <= SLEEP_WAKE_TARGET.minutes) return true;
  return false;
};

// =====================================================
// TARGET EVALUATION
// =====================================================

/**
 * Check if a duration entry meets target
 */
export const checkDurationTarget = (
  metricName: string,
  durationMinutes: number
): boolean => {
  const target = DURATION_TARGETS[metricName as keyof typeof DURATION_TARGETS];
  if (!target) return durationMinutes > 0;
  return durationMinutes >= target;
};

/**
 * Check if a boolean entry meets target (true = met)
 */
export const checkBooleanTarget = (completed: boolean): boolean => {
  return completed === true;
};

/**
 * Check if any entry meets its daily target
 */
export const checkEntryMeetsTarget = (
  entry: SprintMetricEntry,
  metricType: MetricType,
  metricName: string
): boolean => {
  switch (metricType) {
    case 'sleep':
      return entry.wake_at ? checkWakeTimeTarget(entry.wake_at) : false;
    case 'boolean':
      return entry.completed !== null ? checkBooleanTarget(entry.completed) : false;
    case 'duration':
      return entry.duration_minutes !== null
        ? checkDurationTarget(metricName, entry.duration_minutes)
        : false;
    default:
      return false;
  }
};

// =====================================================
// CELL DISPLAY FORMATTING
// =====================================================

/**
 * Get display value for a cell
 */
export const getCellDisplayValue = (
  entry: SprintMetricEntry | null,
  metricType: MetricType,
  metricName: string,
  isFuture: boolean
): CellDisplayValue => {
  // Future dates
  if (isFuture) {
    return {
      hasEntry: false,
      displayText: '—',
      metTarget: null,
      hasNotes: false,
      notes: null,
    };
  }

  // No entry
  if (!entry) {
    return {
      hasEntry: false,
      displayText: '—',
      metTarget: null,
      hasNotes: false,
      notes: null,
    };
  }

  // Has entry - format based on type
  switch (metricType) {
    case 'sleep': {
      if (!entry.bed_at || !entry.wake_at) {
        return { hasEntry: false, displayText: '—', metTarget: null, hasNotes: false, notes: null };
      }
      const duration = calculateSleepDuration(entry.bed_at, entry.wake_at);
      const wakeTime = formatWakeTime(entry.wake_at);
      const metTarget = checkWakeTimeTarget(entry.wake_at);
      return {
        hasEntry: true,
        displayText: `${formatSleepDuration(duration)} / ${wakeTime}`,
        metTarget,
        hasNotes: !!entry.notes,
        notes: entry.notes || null,
      };
    }

    case 'boolean': {
      if (entry.completed === null) {
        return { hasEntry: false, displayText: '—', metTarget: null, hasNotes: false, notes: null };
      }
      const metTarget = checkBooleanTarget(entry.completed);
      return {
        hasEntry: true,
        displayText: entry.completed ? '✓' : '✗',
        metTarget,
        hasNotes: !!entry.notes,
        notes: entry.notes || null,
      };
    }

    case 'duration': {
      if (entry.duration_minutes === null) {
        return { hasEntry: false, displayText: '—', metTarget: null, hasNotes: false, notes: null };
      }
      const metTarget = checkDurationTarget(metricName, entry.duration_minutes);
      return {
        hasEntry: true,
        displayText: `${entry.duration_minutes}`,
        metTarget,
        hasNotes: !!entry.notes,
        notes: entry.notes || null,
      };
    }

    default:
      return { hasEntry: false, displayText: '—', metTarget: null, hasNotes: false, notes: null };
  }
};

/**
 * Get entry for a specific date from metric entries
 */
export const getEntryForDate = (
  entries: SprintMetricEntry[],
  date: string
): SprintMetricEntry | null => {
  return entries.find((e) => e.entry_date === date) || null;
};

// =====================================================
// PROGRESS CALCULATIONS
// =====================================================

/**
 * Calculate weekly progress for a metric
 */
export const calculateMetricWeeklyProgress = (
  metric: SprintMetricWithEntries,
  dayColumns: DayColumn[]
): { current: number; target: number } => {
  const weeklyTarget = metric.weekly_target as { count: number; total: number };
  let metCount = 0;

  for (const day of dayColumns) {
    if (day.isFuture) continue;

    const entry = getEntryForDate(metric.entries, day.date);
    if (entry && checkEntryMeetsTarget(entry, metric.metric_type, metric.name)) {
      metCount++;
    }
  }

  return {
    current: metCount,
    target: weeklyTarget.count,
  };
};
