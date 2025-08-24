import type { Task, TaskCategory, TaskStatus, TaskPriority } from '../types';
import { getDaysUntilDate, parseLocalDate, getTodayAtMidnight } from './dateUtils';

/**
 * Filter tasks that are pending (not done and not recurring)
 */
export const filterPendingTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(t => t.status !== 'done' && !t.isRecurring);
};

/**
 * Filter tasks by category
 */
export const filterByCategory = (tasks: Task[], category: TaskCategory): Task[] => {
  return tasks.filter(t => t.category === category);
};

/**
 * Filter tasks by status
 */
export const filterByStatus = (tasks: Task[], status: TaskStatus): Task[] => {
  return tasks.filter(t => t.status === status);
};

/**
 * Filter tasks by priority
 */
export const filterByPriority = (tasks: Task[], priority: TaskPriority): Task[] => {
  return tasks.filter(t => t.priority === priority);
};

/**
 * Filter completed tasks
 */
export const filterCompletedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(t => t.status === 'done');
};

/**
 * Filter tasks with due dates
 */
export const filterTasksWithDueDates = (tasks: Task[]): Task[] => {
  return tasks.filter(t => t.dueDate);
};

/**
 * Filter overdue tasks
 */
export const filterOverdueTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const daysUntil = getDaysUntilDate(t.dueDate);
    return daysUntil < 0;
  });
};

/**
 * Filter tasks due today
 */
export const filterTasksDueToday = (tasks: Task[]): Task[] => {
  return tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const daysUntil = getDaysUntilDate(t.dueDate);
    return daysUntil === 0;
  });
};

/**
 * Filter urgent tasks (extreme priority or due soon)
 */
export const filterUrgentTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(t => {
    if (t.status === 'done') return false;
    
    // Check for extreme priority
    if (t.priority === 'urgent') return true;
    
    // Check for tasks due soon
    if (t.dueDate) {
      const daysUntil = getDaysUntilDate(t.dueDate);
      return daysUntil <= 2;
    }
    
    return false;
  });
};

/**
 * Sort tasks for deadline priority view
 * Extreme priority first, then by due date
 */
export const sortTasksByDeadlinePriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // First priority: Extreme priority tasks come first
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
    
    // Handle tasks without due dates - they go to the end
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    const dateA = parseLocalDate(a.dueDate);
    const dateB = parseLocalDate(b.dueDate);
    
    // Sort by date (earliest first)
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Check if tasks require deadline view to be shown
 * (has urgent priority or overdue/today deadlines)
 */
export const shouldShowDeadlineView = (tasks: Task[]): boolean => {
  const pendingTasks = filterPendingTasks(tasks);
  
  // Check for extreme priority tasks
  const hasUrgentTasks = pendingTasks.some(t => t.priority === 'urgent');
  
  // Check for tasks due today or overdue
  const today = getTodayAtMidnight();
  const hasTodayOrOverdueDeadlines = pendingTasks.some(t => {
    if (!t.dueDate) return false;
    const dueDate = parseLocalDate(t.dueDate);
    return dueDate.getTime() <= today.getTime();
  });
  
  return hasUrgentTasks || hasTodayOrOverdueDeadlines;
};