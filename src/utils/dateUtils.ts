import { differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

/**
 * Parse a date string (YYYY-MM-DD) into a Date object without timezone conversion
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

/**
 * Get today's date at midnight for consistent date comparisons
 * @returns Date object set to midnight
 */
export const getTodayAtMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Check if a date string represents today
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if the date is today
 */
export const isDateToday = (dateString: string): boolean => {
  if (!dateString) return false;
  return isToday(parseLocalDate(dateString));
};

/**
 * Check if a date string represents a past date
 * @param dateString - Date string in YYYY-MM-DD format  
 * @returns true if the date is in the past
 */
export const isDatePast = (dateString: string): boolean => {
  if (!dateString) return false;
  return isPast(parseLocalDate(dateString));
};

/**
 * Check if a date string represents tomorrow
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if the date is tomorrow
 */
export const isDateTomorrow = (dateString: string): boolean => {
  if (!dateString) return false;
  return isTomorrow(parseLocalDate(dateString));
};

/**
 * Calculate days until a given date
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Number of days until the date (negative if past)
 */
export const getDaysUntilDate = (dateString: string): number => {
  if (!dateString) return Infinity;
  const today = getTodayAtMidnight();
  const targetDate = parseLocalDate(dateString);
  return differenceInDays(targetDate, today);
};

/**
 * Get urgency level based on due date
 * @param dueDate - Date string in YYYY-MM-DD format
 * @returns Urgency level: 'overdue' | 'today' | 'urgent' | 'soon' | 'normal'
 */
export const getDateUrgency = (dueDate: string | undefined): 'overdue' | 'today' | 'urgent' | 'soon' | 'normal' | 'none' => {
  if (!dueDate) return 'none';
  
  const daysUntil = getDaysUntilDate(dueDate);
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'today';
  if (daysUntil <= 2) return 'urgent';
  if (daysUntil <= 7) return 'soon';
  return 'normal';
};