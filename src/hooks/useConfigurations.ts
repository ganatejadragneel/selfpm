import { useMemo } from 'react';
import { categoryConfigs, priorityConfigs, statusConfigs } from '../styles/theme';
import type { TaskCategory, TaskPriority, TaskStatus } from '../types';
import { Clock, Check, AlertCircle } from 'lucide-react';

// Unified configuration hook following DRY principles
export const useTaskConfigurations = () => {
  const configurations = useMemo(() => ({
    // Category configurations
    categories: categoryConfigs,
    getCategoryConfig: (category: TaskCategory) => categoryConfigs[category],
    getCategoryOptions: () => Object.entries(categoryConfigs).map(([value, config]) => ({
      value: value as TaskCategory,
      label: config.label,
      color: config.color,
      icon: config.emoji,
    })),

    // Priority configurations
    priorities: priorityConfigs,
    getPriorityConfig: (priority: TaskPriority) => priorityConfigs[priority],
    getPriorityOptions: () => Object.entries(priorityConfigs).map(([value, config]) => ({
      value: value as TaskPriority,
      label: config.title,
      color: config.color,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      icon: config.icon,
    })),

    // Status configurations
    statuses: statusConfigs,
    getStatusConfig: (status: TaskStatus) => statusConfigs[status],
    getStatusOptions: () => Object.entries(statusConfigs).map(([, config]) => ({
      value: config.value as TaskStatus,
      label: config.label,
      color: config.color,
      bgColor: config.bgColor,
      icon: config.icon,
    })),
  }), []);

  return configurations;
};

// Specialized hooks for specific use cases
export const useCategoryConfig = (category: TaskCategory) => {
  return useMemo(() => categoryConfigs[category], [category]);
};

export const usePriorityConfig = (priority: TaskPriority) => {
  return useMemo(() => priorityConfigs[priority], [priority]);
};

export const useStatusConfig = (status: TaskStatus) => {
  return useMemo(() => statusConfigs[status], [status]);
};

// Icon mapping for statuses
const statusIcons = {
  todo: Clock,
  in_progress: Clock,
  done: Check,
  blocked: AlertCircle,
} as const;

// Hook for form select options
export const useFormOptions = () => {
  return useMemo(() => ({
    categoryOptions: Object.entries(categoryConfigs).map(([value, config]) => ({
      value: value as TaskCategory,
      label: config.label,
      color: config.color,
    })),
    priorityOptions: Object.entries(priorityConfigs).map(([value, config]) => ({
      value: value as TaskPriority,
      label: config.title,
      color: config.color,
    })),
    statusOptions: Object.entries(statusConfigs).map(([, config]) => {
      const IconComponent = statusIcons[config.value as TaskStatus];
      return {
        value: config.value as TaskStatus,
        label: config.label,
        color: config.color,
        icon: IconComponent,
      };
    }),
  }), []);
};

// Hook for theme-aware styling
export const useConfigurationStyles = () => {
  return useMemo(() => ({
    getCategoryStyles: (category: TaskCategory, isActive = false) => ({
      backgroundColor: isActive ? categoryConfigs[category].color : 'white',
      borderColor: categoryConfigs[category].borderColor,
      color: categoryConfigs[category].accentColor,
    }),
    getPriorityStyles: (priority: TaskPriority, isActive = false) => ({
      backgroundColor: isActive ? priorityConfigs[priority].bgColor : 'white',
      borderColor: priorityConfigs[priority].borderColor,
      color: priorityConfigs[priority].color,
    }),
    getStatusStyles: (status: TaskStatus, isActive = false) => ({
      backgroundColor: isActive ? statusConfigs[status].bgColor : 'white',
      color: statusConfigs[status].color,
    }),
  }), []);
};