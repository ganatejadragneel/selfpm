// Shared Icon Mappings - Phase 7D DRY Refactoring
// PURE FUNCTIONS - Consolidates icon mapping logic from multiple components

import {
  Clock, Check, AlertCircle, Circle, CheckCircle2,
  Home, Briefcase, RotateCcw,
  ArrowUp, ArrowDown, Minus, Zap,
  Plus, Edit, Calendar, FileText, Trash2,
  Paperclip, MessageSquare, TrendingUp, ArrowRight
} from 'lucide-react';

import type { TaskStatus, TaskPriority, TaskCategory, ActivityType } from '../../types';

// Status icon mappings - Extracted from multiple components
export const statusIconMappings = {
  todo: Clock,
  in_progress: Clock,
  done: Check,
  blocked: AlertCircle
} as const;

export const statusIconMappingsAlternate = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle
} as const;

// Category icon mappings - Extracted from ModernCategoryColumn.tsx
export const categoryIconMappings = {
  life_admin: Home,
  work: Briefcase,
  weekly_recurring: RotateCcw
} as const;

// Priority icon mappings - Extracted from configuration files
export const priorityIconMappings = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: Zap
} as const;

// Activity type icon mappings - Extracted from ActivityTrackerModal.tsx
export const activityIconMappings: Record<ActivityType, typeof Plus> = {
  created: Plus,
  updated: Edit,
  status_changed: CheckCircle2,
  priority_changed: AlertCircle,
  due_date_changed: Calendar,
  description_updated: FileText,
  subtask_added: Plus,
  subtask_completed: CheckCircle2,
  subtask_deleted: Trash2,
  attachment_added: Paperclip,
  attachment_deleted: Trash2,
  comment_added: MessageSquare,
  progress_updated: TrendingUp,
  moved_category: ArrowRight,
  moved_week: Calendar,
  reordered: Zap
};

// Icon getter functions (pure functions)
export const getStatusIcon = (status: TaskStatus, alternate = false) => {
  return alternate ? statusIconMappingsAlternate[status] : statusIconMappings[status];
};

export const getCategoryIcon = (category: TaskCategory) => {
  return categoryIconMappings[category];
};

export const getPriorityIcon = (priority: TaskPriority) => {
  return priorityIconMappings[priority];
};

export const getActivityIcon = (activityType: ActivityType) => {
  return activityIconMappings[activityType];
};

// Icon props helper (standardized icon styling)
export const createIconProps = (className = "w-5 h-5", color?: string) => ({
  className,
  ...(color && { style: { color } })
});

// Common icon sizes
export const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8"
} as const;

// Icon with size helper
export const getIconWithSize = (IconComponent: typeof Plus, size: keyof typeof iconSizes = 'md', color?: string) => {
  const props = createIconProps(iconSizes[size], color);
  return { Icon: IconComponent, props };
};