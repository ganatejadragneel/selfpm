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
  attachments?: Attachment[];
  activities?: TaskActivity[];
  comments?: TaskComment[];
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
  | 'note_added' 
  | 'moved_category' 
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