import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskCategory } from '../types';
import { categoryConfigs } from '../styles/theme';
import { Home, Briefcase, RotateCcw } from 'lucide-react';

const categoryIcons = {
  life_admin: Home,
  work: Briefcase,
  weekly_recurring: RotateCcw,
};

export interface UseCategoryColumnReturn {
  config: typeof categoryConfigs[TaskCategory];
  Icon: typeof categoryIcons[TaskCategory];
  completedCount: number;
  totalCount: number;
  completionRate: number;
  progressStats: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  isOver: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
}

export const useCategoryColumn = (category: TaskCategory, tasks: Task[]): UseCategoryColumnReturn => {
  const config = categoryConfigs[category];
  const Icon = categoryIcons[category];
  
  const { setNodeRef, isOver } = useDroppable({
    id: category,
  });

  const stats = useMemo(() => {
    const completedCount = tasks.filter(t => t.status === 'done').length;
    const totalCount = tasks.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    const progressStats = {
      pending: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: completedCount,
    };

    return {
      completedCount,
      totalCount,
      completionRate,
      progressStats,
    };
  }, [tasks]);

  return {
    config,
    Icon,
    ...stats,
    isOver,
    setNodeRef,
  };
};