export type TaskCategory = 'life_admin' | 'work' | 'weekly_recurring';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  category: TaskCategory;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  progressCurrent?: number;
  progressTotal?: number;
  weekNumber: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
  updates?: TaskUpdate[];
  notes?: Note[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  updateText: string;
  progressValue?: number;
  createdAt: string;
}

export interface Note {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
}

export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  categories: {
    lifeAdmin: { total: number; completed: number };
    work: { total: number; completed: number };
    weeklyRecurring: { total: number; completed: number };
  };
}