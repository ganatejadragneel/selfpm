import { isPast, isToday, isTomorrow } from 'date-fns';
import type { Task } from '../types';
import { theme } from '../styles/theme';

// Custom hook for task priority calculation
// Following Single Responsibility Principle
export const useTaskPriority = () => {
  const getPriorityStyle = (task: Task, categoryAccentColor: string) => {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      
      if (isPast(dueDate) && task.status !== 'done') {
        return {
          borderLeft: `4px solid ${theme.colors.status.error.dark}`,
          background: `linear-gradient(135deg, ${theme.colors.status.error.light} 0%, rgba(220, 38, 38, 0.02) 100%)`,
        };
      }
      
      if (isToday(dueDate)) {
        return {
          borderLeft: `4px solid ${theme.colors.status.warning.dark}`,
          background: `linear-gradient(135deg, ${theme.colors.status.warning.light} 0%, rgba(217, 119, 6, 0.02) 100%)`,
        };
      }
      
      if (isTomorrow(dueDate)) {
        return {
          borderLeft: '4px solid #eab308',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(202, 138, 4, 0.02) 100%)',
        };
      }
    }
    
    return {
      borderLeft: `4px solid ${categoryAccentColor}33`,
      background: task.status === 'done' 
        ? 'linear-gradient(135deg, rgba(156, 163, 175, 0.05) 0%, rgba(107, 114, 128, 0.02) 100%)'
        : theme.colors.surface.glass,
    };
  };
  
  const getDueDateBadgeStyle = (dueDate: string, taskStatus: string) => {
    const date = new Date(dueDate);
    
    if (isPast(date) && taskStatus !== 'done') {
      return {
        background: theme.colors.status.error.light,
        color: '#dc2626',
      };
    }
    
    if (isToday(date)) {
      return {
        background: theme.colors.status.warning.light,
        color: '#d97706',
      };
    }
    
    return {
      background: 'rgba(107, 114, 128, 0.1)',
      color: '#4b5563',
    };
  };
  
  return {
    getPriorityStyle,
    getDueDateBadgeStyle,
  };
};