import { isPast, isToday, isTomorrow } from 'date-fns';
import type { Task } from '../types';
import { theme } from '../styles/theme';

// Helper function to parse date string without timezone conversion
const parseLocalDate = (dateString: string): Date => {
  // Split the date string (YYYY-MM-DD) and create date with local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed in JS Date
};

// Custom hook for task priority calculation
// Following Single Responsibility Principle
export const useTaskPriority = () => {
  const getPriorityStyle = (task: Task, categoryAccentColor: string) => {
    if (task.dueDate) {
      const dueDate = parseLocalDate(task.dueDate);
      
      if (isPast(dueDate) && task.status !== 'done') {
        return {
          borderLeft: `5px solid ${theme.colors.status.error.dark}`,
          background: `linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)`,
          boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.1)',
        };
      }
      
      if (isToday(dueDate)) {
        return {
          borderLeft: `5px solid ${theme.colors.status.warning.dark}`,
          background: `linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)`,
          boxShadow: 'inset 0 0 20px rgba(245, 158, 11, 0.1)',
        };
      }
      
      if (isTomorrow(dueDate)) {
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
    const date = parseLocalDate(dueDate);
    
    if (isPast(date) && taskStatus !== 'done') {
      return {
        background: 'rgba(239, 68, 68, 0.3)',
        color: '#dc2626',
        fontWeight: '700',
        border: '1px solid rgba(239, 68, 68, 0.3)',
      };
    }
    
    if (isToday(date)) {
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