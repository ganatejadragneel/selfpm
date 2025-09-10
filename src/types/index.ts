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
  recurrenceWeeks?: number; // Number of weeks this task should span (1-15)
  originalWeekNumber?: number; // The week when this task was originally created
  progressCurrent?: number;
  progressTotal?: number;
  weekNumber: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
  updates?: TaskUpdate[];
  attachments?: Attachment[];
  activities?: TaskActivity[];
  comments?: TaskComment[];
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  autoProgress?: boolean;
  weightedProgress?: boolean;
  completionVelocity?: number;
  estimatedCompletionDate?: string;
  recurringTemplateId?: string;
  estimatedDuration?: number; // in minutes
  timeSpent?: number; // in minutes
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  weight?: number;
  autoCompleteParent?: boolean;
  createdAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  updateText: string;
  progressValue?: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export type ActivityType = 
  | 'created' 
  | 'updated' 
  | 'status_changed' 
  | 'priority_changed'
  | 'due_date_changed' 
  | 'description_updated' 
  | 'subtask_added'
  | 'subtask_completed' 
  | 'subtask_deleted' 
  | 'attachment_added'
  | 'attachment_deleted' 
  | 'comment_added' 
  | 'progress_updated'
  | 'moved_category' 
  | 'moved_week'
  | 'reordered';

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  activityType: ActivityType;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
  };
  replies?: TaskComment[];
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

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  dependsOnTask?: Task;
  createdAt: string;
}

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTaskTemplate {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  recurrencePattern: RecurrencePattern;
  recurrenceDayOfWeek?: number;
  recurrenceDayOfMonth?: number;
  recurrenceMonths?: string[];
  autoCreateDaysBefore: number;
  isActive: boolean;
  lastCreatedAt?: string;
  nextCreateAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}


export interface TaskAnalytics {
  id: string;
  userId: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  periodDate: string;
  category?: TaskCategory;
  tasksCreated: number;
  tasksCompleted: number;
  tasksOverdue: number;
  subtasksCompleted: number;
  averageCompletionTime?: string;
  totalProgressPoints: number;
  completionRate: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Weekly task completion status for recurring tasks
export interface WeeklyTaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  weekNumber: number;
  status: TaskStatus;
  progressCurrent: number;
  timeSpent?: number; // in minutes, for weekly recurring tasks
  createdAt: string;
  updatedAt: string;
}

// Daily Task related types (shared across components)
export type DailyTaskType = 'yes_no' | 'dropdown';

export interface CustomDailyTask {
  id: string;
  name: string;
  description?: string;
  type: DailyTaskType;
  options?: string[] | null;
  currentValue?: string;
  completedToday?: boolean;
  noteText?: string;
  alt_task?: string;
  alt_task_done?: boolean;
}

export interface DailyTaskCompletion {
  id: string;
  custom_task_id: string;
  completion_date: string;
  value: string | boolean;
  created_at: string;
}

export interface DailyTaskNote {
  id: string;
  custom_task_id: string;
  note_date: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

// Modal props interfaces (shared pattern)
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}