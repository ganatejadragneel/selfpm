import type { Task, TaskCategory } from '../types';

export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  todo: number;
  completionRate: number;
  categories: {
    [key in TaskCategory]: {
      total: number;
      completed: number;
      completionRate: number;
    };
  };
  progress: {
    totalCurrent: number;
    totalGoal: number;
    percentComplete: number;
  };
}

/**
 * Calculate comprehensive statistics for a set of tasks
 */
export const calculateTaskStatistics = (tasks: Task[]): TaskStatistics => {
  const stats: TaskStatistics = {
    total: tasks.length,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    todo: 0,
    completionRate: 0,
    categories: {
      life_admin: { total: 0, completed: 0, completionRate: 0 },
      work: { total: 0, completed: 0, completionRate: 0 },
      weekly_recurring: { total: 0, completed: 0, completionRate: 0 }
    },
    progress: {
      totalCurrent: 0,
      totalGoal: 0,
      percentComplete: 0
    }
  };

  // Calculate status counts and category breakdowns
  tasks.forEach(task => {
    // Status counts
    switch (task.status) {
      case 'done':
        stats.completed++;
        break;
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'blocked':
        stats.blocked++;
        break;
      case 'todo':
        stats.todo++;
        break;
    }

    // Category counts
    const category = task.category as TaskCategory;
    stats.categories[category].total++;
    if (task.status === 'done') {
      stats.categories[category].completed++;
    }

    // Progress tracking
    if (task.progressTotal) {
      stats.progress.totalCurrent += task.progressCurrent || 0;
      stats.progress.totalGoal += task.progressTotal;
    }
  });

  // Calculate completion rates
  stats.completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  // Calculate category completion rates
  Object.keys(stats.categories).forEach(key => {
    const category = key as TaskCategory;
    const categoryStats = stats.categories[category];
    categoryStats.completionRate = categoryStats.total > 0
      ? Math.round((categoryStats.completed / categoryStats.total) * 100)
      : 0;
  });

  // Calculate overall progress percentage
  stats.progress.percentComplete = stats.progress.totalGoal > 0
    ? Math.round((stats.progress.totalCurrent / stats.progress.totalGoal) * 100)
    : 0;

  return stats;
};

/**
 * Calculate subtask completion statistics
 */
export const calculateSubtaskStats = (task: Task): { completed: number; total: number; percentage: number } => {
  const completed = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const total = task.subtasks?.length || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};