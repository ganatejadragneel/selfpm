// Shared Configuration Utilities - Phase 7D DRY Refactoring
// PURE FUNCTIONS - Consolidates configuration access patterns

import { categoryConfigs, priorityConfigs } from '../../styles/theme';
import type { TaskCategory, TaskPriority, TaskStatus } from '../../types';

// Status configuration (consolidated from multiple components)
export const statusConfigs = {
  todo: {
    value: 'todo' as TaskStatus,
    label: 'To Do',
    color: '#6b7280', // gray-500
    bgColor: '#f3f4f6', // gray-100
    borderColor: '#d1d5db' // gray-300
  },
  in_progress: {
    value: 'in_progress' as TaskStatus,
    label: 'In Progress',
    color: '#3b82f6', // blue-500
    bgColor: '#eff6ff', // blue-50
    borderColor: '#93c5fd' // blue-300
  },
  done: {
    value: 'done' as TaskStatus,
    label: 'Done',
    color: '#059669', // emerald-600
    bgColor: '#d1fae5', // emerald-100
    borderColor: '#34d399' // emerald-400
  },
  blocked: {
    value: 'blocked' as TaskStatus,
    label: 'Blocked',
    color: '#dc2626', // red-600
    bgColor: '#fef2f2', // red-50
    borderColor: '#f87171' // red-400
  }
} as const;

// Universal configuration getter (type-safe)
export const getConfig = {
  category: (category: TaskCategory) => categoryConfigs[category],
  priority: (priority: TaskPriority) => priorityConfigs[priority],
  status: (status: TaskStatus) => statusConfigs[status]
} as const;

// Configuration option generators for forms/selects
export const generateOptions = {
  categories: () => Object.entries(categoryConfigs).map(([value, config]) => ({
    value: value as TaskCategory,
    label: config.label,
    color: config.color,
    icon: config.emoji
  })),

  priorities: () => Object.entries(priorityConfigs).map(([value, config]) => ({
    value: value as TaskPriority,
    label: config.title,
    color: config.color,
    bgColor: config.bgColor,
    borderColor: config.borderColor
  })),

  statuses: () => Object.entries(statusConfigs).map(([, config]) => ({
    value: config.value,
    label: config.label,
    color: config.color,
    bgColor: config.bgColor,
    borderColor: config.borderColor
  }))
} as const;

// Configuration style generators
export const generateStyles = {
  categoryBadge: (category: TaskCategory, isActive = false) => ({
    backgroundColor: isActive ? categoryConfigs[category].color : 'transparent',
    borderColor: categoryConfigs[category].borderColor,
    color: isActive ? 'white' : categoryConfigs[category].accentColor,
    border: `1px solid ${categoryConfigs[category].borderColor}`,
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600' as const
  }),

  priorityBadge: (priority: TaskPriority) => ({
    background: priorityConfigs[priority].bgColor,
    color: priorityConfigs[priority].color,
    border: `1px solid ${priorityConfigs[priority].borderColor}`,
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '4px'
  }),

  statusBadge: (status: TaskStatus) => ({
    background: statusConfigs[status].bgColor,
    color: statusConfigs[status].color,
    border: `1px solid ${statusConfigs[status].borderColor}`,
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '4px'
  })
} as const;

// Validation utilities
export const isValidConfig = {
  category: (value: string): value is TaskCategory =>
    Object.keys(categoryConfigs).includes(value),

  priority: (value: string): value is TaskPriority =>
    Object.keys(priorityConfigs).includes(value),

  status: (value: string): value is TaskStatus =>
    Object.keys(statusConfigs).includes(value)
} as const;

// Configuration comparison utilities
export const compareByConfig = {
  priority: (a: TaskPriority, b: TaskPriority) => {
    const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
    return priorityOrder[a] - priorityOrder[b];
  },

  status: (a: TaskStatus, b: TaskStatus) => {
    const statusOrder = { todo: 0, in_progress: 1, blocked: 2, done: 3 };
    return statusOrder[a] - statusOrder[b];
  }
} as const;

// Export all utilities as a single object for convenience
export const configUtils = {
  get: getConfig,
  generate: generateOptions,
  styles: generateStyles,
  validate: isValidConfig,
  compare: compareByConfig
} as const;