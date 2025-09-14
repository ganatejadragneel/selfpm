// Activity Types - Standardized activity types for database constraint compliance
// Matches the database constraint task_activities_activity_type_check

export const ACTIVITY_TYPES = {
  // Exact match with database constraint values
  TASK_CREATED: 'created',
  TASK_UPDATED: 'updated',
  TASK_DELETED: 'updated', // No 'deleted' in constraint, use 'updated'

  // Status changes
  STATUS_CHANGED: 'status_changed',
  PRIORITY_CHANGED: 'priority_changed',

  // Progress tracking
  PROGRESS_UPDATED: 'progress_updated',

  // Movement/organization
  TASK_MOVED: 'reordered',
  CATEGORY_CHANGED: 'moved_category',

  // Subtasks
  SUBTASK_ADDED: 'subtask_added',
  SUBTASK_COMPLETED: 'subtask_completed',

  // Attachments
  ATTACHMENT_ADDED: 'attachment_added',
  ATTACHMENT_DELETED: 'attachment_deleted',

  // Comments
  COMMENT_ADDED: 'comment_added',

  // Time tracking
  TIME_LOGGED: 'updated', // Map to generic 'updated'

  // Duration
  DURATION_CHANGED: 'updated' // Map to generic 'updated'
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

// Map legacy activity types to standardized ones
export const LEGACY_ACTIVITY_TYPE_MAP: Record<string, ActivityType> = {
  // Exact database values (pass through)
  'created': 'created',
  'updated': 'updated',
  'status_changed': 'status_changed',
  'priority_changed': 'priority_changed',
  'progress_updated': 'progress_updated',
  'subtask_added': 'subtask_added',
  'subtask_completed': 'subtask_completed',
  'attachment_added': 'attachment_added',
  'attachment_deleted': 'attachment_deleted',
  'comment_added': 'comment_added',
  'moved_category': 'moved_category',

  // Legacy mappings to database values
  'moved_week': 'reordered',
  'duration_changed': 'updated',
  'time_logged': 'updated',
  'Bulk update': 'updated',
  'task_created': 'created'
};

// Helper function to normalize activity type
export const normalizeActivityType = (activityType: string): ActivityType => {
  return LEGACY_ACTIVITY_TYPE_MAP[activityType] || 'updated';
};