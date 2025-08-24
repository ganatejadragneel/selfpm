import type { Task } from '../types';
import { theme } from '../styles/theme';
import { isDatePast, isDateToday, isDateTomorrow } from '../utils/dateUtils';

// Custom hook for task priority calculation
// Following Single Responsibility Principle
export const useTaskPriority = () => {
  const getPriorityStyle = (task: Task, categoryAccentColor: string) => {
    if (task.dueDate) {
      if (isDatePast(task.dueDate) && task.status !== 'done') {
        return {
          borderLeft: `5px solid ${theme.colors.status.error.dark}`,
          background: `linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)`,
          boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.1)',
        };
      }
      
      if (isDateToday(task.dueDate)) {
        return {
          borderLeft: `5px solid ${theme.colors.status.warning.dark}`,
          background: `linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)`,
          boxShadow: 'inset 0 0 20px rgba(245, 158, 11, 0.1)',
        };
      }
      
      if (isDateTomorrow(task.dueDate)) {
        return {
          borderLeft: '5px solid #facc15',
          background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
          boxShadow: 'inset 0 0 15px rgba(250, 204, 21, 0.08)',
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
    if (isDatePast(dueDate) && taskStatus !== 'done') {
      return {
        background: 'rgba(239, 68, 68, 0.3)',
        color: '#dc2626',
        fontWeight: '700',
        border: '1px solid rgba(239, 68, 68, 0.3)',
      };
    }
    
    if (isDateToday(dueDate)) {
      return {
        background: 'rgba(245, 158, 11, 0.3)',
        color: '#d97706',
        fontWeight: '700',
        border: '1px solid rgba(245, 158, 11, 0.3)',
      };
    }
    
    return {
      background: 'rgba(107, 114, 128, 0.1)',
      color: '#4b5563',
      fontWeight: '500',
    };
  };
  
  return {
    getPriorityStyle,
    getDueDateBadgeStyle,
  };
};