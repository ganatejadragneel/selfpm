// Shared Data Transformation Utilities - Phase 7D DRY Refactoring
// PURE FUNCTIONS - Common data transformations used across components

import type { Task } from '../../types';

// Task statistics calculations (extracted from multiple components)
export const calculateTaskStats = (tasks: Task[]) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const blockedTasks = tasks.filter(task => task.status === 'blocked').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;

  return {
    total: totalTasks,
    completed: completedTasks,
    inProgress: inProgressTasks,
    blocked: blockedTasks,
    todo: todoTasks,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  };
};

// Subtask statistics calculations (used in multiple task components)
export const calculateSubtaskStats = (task: Task) => {
  const subtasks = task.subtasks || [];
  const completed = subtasks.filter(subtask => subtask.isCompleted).length;
  const total = subtasks.length;

  return {
    completed,
    total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    hasSubtasks: total > 0,
    allCompleted: total > 0 && completed === total
  };
};

// Category-based task grouping (common pattern)
export const groupTasksByCategory = (tasks: Task[]) => {
  return tasks.reduce((groups, task) => {
    const category = task.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
};

// Priority-based task sorting (common pattern)
export const sortTasksByPriority = (tasks: Task[]) => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};

// Status-based task sorting (common pattern)
export const sortTasksByStatus = (tasks: Task[]) => {
  const statusOrder = { todo: 0, in_progress: 1, blocked: 2, done: 3 };
  return [...tasks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
};

// Due date utilities (common across multiple components)
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date() && task.status !== 'done';
};

export const getDueDateStatus = (task: Task): 'overdue' | 'due-soon' | 'normal' | 'no-due-date' => {
  if (!task.dueDate) return 'no-due-date';

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0 && task.status !== 'done') return 'overdue';
  if (daysDiff <= 3 && task.status !== 'done') return 'due-soon';
  return 'normal';
};

// Progress calculations (used in multiple progress-related components)
export const calculateProgress = (task: Task) => {
  // If task has custom progress values
  if (typeof task.progressCurrent === 'number' && typeof task.progressTotal === 'number') {
    return Math.round((task.progressCurrent / task.progressTotal) * 100);
  }

  // If task has subtasks, calculate based on completion
  const subtaskStats = calculateSubtaskStats(task);
  if (subtaskStats.hasSubtasks) {
    return subtaskStats.completionRate;
  }

  // Default: based on status
  switch (task.status) {
    case 'todo': return 0;
    case 'in_progress': return 50;
    case 'blocked': return 25;
    case 'done': return 100;
    default: return 0;
  }
};

// Task filtering utilities (common patterns)
export const taskFilters = {
  byCategory: (category: string) => (task: Task) => task.category === category,
  byStatus: (status: string) => (task: Task) => task.status === status,
  byPriority: (priority: string) => (task: Task) => task.priority === priority,
  overdue: (task: Task) => isTaskOverdue(task),
  withSubtasks: (task: Task) => (task.subtasks?.length || 0) > 0,
  completed: (task: Task) => task.status === 'done',
  active: (task: Task) => task.status !== 'done',
  byWeek: (weekNumber: number) => (task: Task) => task.weekNumber === weekNumber
} as const;

// Search/filtering utilities
export const searchTasks = (tasks: Task[], query: string) => {
  if (!query.trim()) return tasks;

  const lowercaseQuery = query.toLowerCase();
  return tasks.filter(task =>
    task.title.toLowerCase().includes(lowercaseQuery) ||
    task.description?.toLowerCase().includes(lowercaseQuery) ||
    task.subtasks?.some(subtask =>
      subtask.title.toLowerCase().includes(lowercaseQuery)
    )
  );
};

// Time-based calculations (common in multiple components)
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const calculateTimeSpent = (task: Task): number => {
  return task.timeSpent || 0;
};

// Export all transformations as grouped utilities
export const taskTransforms = {
  stats: {
    task: calculateTaskStats,
    subtask: calculateSubtaskStats,
    progress: calculateProgress
  },
  grouping: {
    byCategory: groupTasksByCategory,
  },
  sorting: {
    byPriority: sortTasksByPriority,
    byStatus: sortTasksByStatus
  },
  filtering: {
    filters: taskFilters,
    search: searchTasks
  },
  dates: {
    isOverdue: isTaskOverdue,
    getDueDateStatus
  },
  time: {
    formatDuration,
    calculateTimeSpent
  }
} as const;