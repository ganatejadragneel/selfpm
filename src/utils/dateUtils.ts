// Import only specific functions to reduce bundle size
import { differenceInDays } from 'date-fns/differenceInDays';
import { isPast } from 'date-fns/isPast';
import { isToday } from 'date-fns/isToday';
import { isTomorrow } from 'date-fns/isTomorrow';

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

/**
 * Get current date in local timezone as YYYY-MM-DD string
 * This replaces new Date().toISOString().split('T')[0] to avoid UTC conversion
 * @returns Date string in YYYY-MM-DD format using local timezone
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 * @returns Today's date string in local timezone
 */
export const getTodayLocalString = (): string => {
  return getLocalDateString(new Date());
};

/**
 * Check if two date strings represent the same local date
 * @param dateStr1 - First date string (YYYY-MM-DD)
 * @param dateStr2 - Second date string (YYYY-MM-DD)
 * @returns true if dates are the same
 */
export const isSameLocalDate = (dateStr1: string, dateStr2: string): boolean => {
  return dateStr1 === dateStr2;
};

/**
 * Convert a Date object to YYYY-MM-DD string in local timezone
 * Useful for date-fns operations that return Date objects
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatLocalDateString = (date: Date): string => {
  return getLocalDateString(date);
};