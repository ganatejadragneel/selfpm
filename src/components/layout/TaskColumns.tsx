import React from 'react';
import type { Task, TaskCategory } from '../../types';
import { ModernCategoryColumn } from '../ModernCategoryColumn';
import { useResponsive } from '../../hooks/useResponsive';

interface TaskColumnsProps {
  tasksByCategory: {
    life_admin: Task[];
    work: Task[];
    weekly_recurring: Task[];
  };
  onTaskSelect: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

const categoryConfig = [
  {
    key: 'life_admin' as TaskCategory,
    title: 'Life & Admin',
    color: '#e11d48',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)'
  },
  {
    key: 'work' as TaskCategory,
    title: 'Work',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)'
  },
  {
    key: 'weekly_recurring' as TaskCategory,
    title: 'Weekly Recurring',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
  }
];

export const TaskColumns: React.FC<TaskColumnsProps> = ({
  tasksByCategory,
  onTaskSelect,
  onStatusToggle,
  onTaskDelete,
}) => {
  const { isMobile } = useResponsive();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '24px',
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px 16px'
    }}>
      {categoryConfig.map(({ key }) => (
        <ModernCategoryColumn
          key={key}
          category={key}
          tasks={tasksByCategory[key]}
          onTaskClick={onTaskSelect}
          onTaskStatusToggle={(task) => onStatusToggle(task.id)}
          onDeleteTask={(task) => onTaskDelete(task.id)}
          onAddTask={() => {}}
        />
      ))}
    </div>
  );
};