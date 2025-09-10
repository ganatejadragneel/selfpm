import React from 'react';
import { DndContext, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, TaskCategory } from '../../types';
import { useMigratedTaskStore } from '../../store/migratedTaskStore';
import { TaskColumns } from './TaskColumns';
import { ModernTaskCard } from '../ModernTaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onStatusToggle: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onTaskSelect,
  onStatusToggle,
  onTaskDelete,
}) => {
  const { moveTaskToCategory } = useMigratedTaskStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5
      },
    })
  );

  const tasksByCategory = React.useMemo(() => ({
    life_admin: tasks.filter(t => t.category === 'life_admin').sort((a, b) => (a.order || 0) - (b.order || 0)),
    work: tasks.filter(t => t.category === 'work').sort((a, b) => (a.order || 0) - (b.order || 0)),
    weekly_recurring: tasks.filter(t => t.category === 'weekly_recurring').sort((a, b) => (a.order || 0) - (b.order || 0))
  }), [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    
    // Find the active task
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // Check if we're dropping over a category column or another task
    const isDroppedOnCategory = ['life_admin', 'work', 'weekly_recurring'].includes(overId);
    
    if (isDroppedOnCategory) {
      // Moving to a different category (dropped on empty category area)
      const newCategory = overId as TaskCategory;
      if (activeTask.category !== newCategory) {
        await moveTaskToCategory(activeTaskId, newCategory);
      }
    } else {
      // Dropped on another task
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;

      const activeCategory = activeTask.category;
      const overCategory = overTask.category;
      
      if (activeCategory === overCategory) {
        // Reordering within the same category
        const categoryTasks = tasksByCategory[activeCategory];
        const oldIndex = categoryTasks.findIndex(t => t.id === activeTaskId);
        const newIndex = categoryTasks.findIndex(t => t.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Create new order array
          const newTaskOrder = arrayMove(categoryTasks, oldIndex, newIndex);
          // Update the local state immediately for smooth UX
          const updatedTasks = tasks.map(task => {
            const orderIndex = newTaskOrder.findIndex(t => t.id === task.id);
            if (orderIndex !== -1) {
              return { ...task, order: orderIndex };
            }
            return task;
          });
          
          // Sort tasks by order for display
          useMigratedTaskStore.setState({ tasks: updatedTasks });
          
          // Then update in database (will work when order column exists)
          try {
            await Promise.all(
              newTaskOrder.map((task, index) => 
                useMigratedTaskStore.getState().updateTask(task.id, { 
                  order: index 
                })
              )
            );
          } catch (error) {
            // Order column may not exist yet. Tasks reordered in UI only.
            console.warn('Failed to persist task order:', error);
          }
        }
      } else {
        // Moving between categories
        await moveTaskToCategory(activeTaskId, overCategory);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <TaskColumns
        tasksByCategory={tasksByCategory}
        onTaskSelect={onTaskSelect}
        onStatusToggle={onStatusToggle}
        onTaskDelete={onTaskDelete}
      />
      
      <DragOverlay>
        {activeTask ? (
          <div style={{ transform: 'rotate(5deg)', opacity: 0.9 }}>
            <ModernTaskCard
              task={activeTask}
              categoryConfig={{}}
              onClick={() => {}}
              onStatusToggle={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};