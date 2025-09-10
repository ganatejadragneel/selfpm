import type { TaskCategory, TaskStatus, TaskPriority } from './index';

// Base task interface with only essential properties
export interface BaseTask {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  weekNumber: number;
  createdAt: string;
  updatedAt: string;
}

// Task display interface for cards and lists
export interface TaskDisplay extends BaseTask {
  description?: string;
  dueDate?: string;
  order?: number;
}

// Task with progress tracking
export interface TaskWithProgress extends BaseTask {
  progressCurrent?: number;
  progressTotal?: number;
  autoProgress?: boolean;
  weightedProgress?: boolean;
}

// Task with time tracking
export interface TaskWithTime extends BaseTask {
  estimatedDuration?: number; // in minutes
  timeSpent?: number; // in minutes
  completionVelocity?: number;
  estimatedCompletionDate?: string;
}

// Task with scheduling information
export interface TaskWithScheduling extends BaseTask {
  dueDate?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceWeeks?: number;
  originalWeekNumber?: number;
  recurringTemplateId?: string;
}

// Full task for detailed views/editing (combines all aspects)
export interface FullTask extends BaseTask {
  description?: string;
  dueDate?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceWeeks?: number;
  originalWeekNumber?: number;
  progressCurrent?: number;
  progressTotal?: number;
  order?: number;
  autoProgress?: boolean;
  weightedProgress?: boolean;
  completionVelocity?: number;
  estimatedCompletionDate?: string;
  recurringTemplateId?: string;
  estimatedDuration?: number;
  timeSpent?: number;
}

// Task with relationships
export interface TaskWithRelations extends FullTask {
  subtasks?: Array<{
    id: string;
    taskId: string;
    title: string;
    isCompleted: boolean;
    position: number;
    weight?: number;
    autoCompleteParent?: boolean;
    createdAt: string;
  }>;
  attachments?: Array<{
    id: string;
    taskId: string;
    userId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    thumbnailUrl?: string;
    uploadedAt: string;
  }>;
  dependencies?: Array<{
    id: string;
    taskId: string;
    dependsOnTaskId: string;
    dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
    createdAt: string;
  }>;
  dependents?: Array<{
    id: string;
    taskId: string;
    dependsOnTaskId: string;
    dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
    createdAt: string;
  }>;
}

// Task creation interface
export interface TaskCreate {
  title: string;
  category: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
  description?: string;
  dueDate?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  recurrenceWeeks?: number;
  progressTotal?: number;
  estimatedDuration?: number;
  weekNumber: number;
}

// Task update interface
export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  progressCurrent?: number;
  progressTotal?: number;
  estimatedDuration?: number;
  timeSpent?: number;
  order?: number;
}

// Task list item for efficient rendering
export interface TaskListItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  progressCurrent?: number;
  progressTotal?: number;
  estimatedDuration?: number;
  timeSpent?: number;
  order?: number;
}

// Task summary for analytics and reporting
export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  category: TaskCategory;
  weekNumber: number;
  completedAt?: string;
  timeSpent?: number;
  progressCurrent?: number;
  progressTotal?: number;
}

// Task filter and sorting interfaces
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  hasProgress?: boolean;
  hasDueDate?: boolean;
  isOverdue?: boolean;
  weekNumber?: number;
}

export interface TaskSortOptions {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'order' | 'progress';
  direction: 'asc' | 'desc';
}