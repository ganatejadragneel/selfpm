import { useMemo } from 'react';
import type { TaskPriority } from '../types';
import { priorityConfigs } from '../styles/theme';

/**
 * Hook to provide priority configuration and utilities
 * Follows Single Responsibility Principle - handles only priority-related logic
 */
export const useTaskPriorityConfig = () => {
  /**
   * Get priority configuration for a specific priority
   */
  const getPriorityConfig = (priority: TaskPriority) => {
    return priorityConfigs[priority];
  };

  /**
   * Get badge styles for a priority
   */
  const getPriorityBadgeStyle = (priority: TaskPriority) => {
    const config = priorityConfigs[priority];
    return {
      background: config.bgColor,
      color: config.color,
      border: `1px solid ${config.borderColor}`,
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    };
  };

  /**
   * Get priority icon
   */
  const getPriorityIcon = (priority: TaskPriority) => {
    return priorityConfigs[priority].icon;
  };

  /**
   * Get priority display name
   */
  const getPriorityDisplayName = (priority: TaskPriority, short: boolean = false) => {
    const title = priorityConfigs[priority].title;
    return short ? title.replace(' Priority', '') : title;
  };

  /**
   * Sort priorities by urgency level
   */
  const priorityOrder = useMemo(() => ({
    'urgent': 0,
    'high': 1,
    'medium': 2,
    'low': 3
  }), []);

  /**
   * Compare two priorities by urgency
   */
  const comparePriorities = (a: TaskPriority, b: TaskPriority): number => {
    return priorityOrder[a] - priorityOrder[b];
  };

  /**
   * Check if a priority is considered urgent
   */
  const isUrgentPriority = (priority: TaskPriority): boolean => {
    return priority === 'urgent' || priority === 'high';
  };

  return {
    getPriorityConfig,
    getPriorityBadgeStyle,
    getPriorityIcon,
    getPriorityDisplayName,
    comparePriorities,
    isUrgentPriority,
    priorityOrder
  };
};