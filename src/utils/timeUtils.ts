/**
 * Format minutes into a human-readable string
 * @param minutes - The number of minutes to format
 * @returns Formatted string like "2h 30m" or "45m"
 */
export const formatDuration = (minutes: number | undefined): string => {
  if (minutes === undefined || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
};

/**
 * Calculate time remaining from estimated duration and time spent
 * @param estimatedDuration - The estimated duration in minutes
 * @param timeSpent - The time already spent in minutes
 * @param status - The task status (optional)
 * @returns The time remaining in minutes
 */
export const calculateTimeRemaining = (
  estimatedDuration: number | undefined,
  timeSpent: number | undefined,
  status?: string
): number | undefined => {
  if (estimatedDuration === undefined) return undefined;
  if (status === 'done') return 0; // Show 0 time remaining for completed tasks
  const spent = timeSpent || 0;
  return Math.max(0, estimatedDuration - spent);
};

/**
 * Get color for time remaining based on percentage left
 * @param timeRemaining - The time remaining in minutes
 * @param estimatedDuration - The estimated duration in minutes
 * @param status - The task status
 * @returns The color to use for display
 */
export const getTimeRemainingColor = (
  timeRemaining: number | undefined,
  estimatedDuration: number | undefined,
  status: string
): string => {
  if (status === 'done') return '#10b981'; // Green for completed
  if (timeRemaining === undefined || estimatedDuration === undefined) return '#6b7280'; // Gray for no estimate
  if (timeRemaining === 0) return '#ef4444'; // Red for no time left
  
  const percentageRemaining = (timeRemaining / estimatedDuration) * 100;
  if (percentageRemaining > 30) return '#374151'; // Default dark gray
  if (percentageRemaining > 10) return '#f59e0b'; // Yellow/amber warning
  return '#ef4444'; // Red for very low time
};