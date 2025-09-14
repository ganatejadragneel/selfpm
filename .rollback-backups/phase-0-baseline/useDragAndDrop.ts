import { useState, useCallback } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task, TaskCategory } from '../types';

export interface UseDragAndDropReturn {
  activeTask: Task | null;
  sensors: ReturnType<typeof useSensors>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export interface UseDragAndDropProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newCategory: TaskCategory) => Promise<void>;
  onError?: (error: string) => void;
}

export const useDragAndDrop = ({ 
  tasks, 
  onTaskMove, 
  onError 
}: UseDragAndDropProps): UseDragAndDropReturn => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find(t => t.id === taskId);
    setActiveTask(task || null);
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    
    if (!over || active.id === over.id) {
      return;
    }

    const taskId = active.id as string;
    const newCategory = over.id as TaskCategory;
    
    // Validate category
    const validCategories: TaskCategory[] = ['life_admin', 'work', 'weekly_recurring'];
    if (!validCategories.includes(newCategory)) {
      onError?.('Invalid category for task move');
      return;
    }

    try {
      await onTaskMove(taskId, newCategory);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      onError?.(errorMessage);
    }
  }, [onTaskMove, onError]);

  return {
    activeTask,
    sensors,
    handleDragStart,
    handleDragEnd,
  };
};