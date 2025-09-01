import { useMigratedTaskStore } from '../store/migratedTaskStore';
import type { Task } from '../types';

// Custom hook following Single Responsibility Principle
// Handles all task-related actions, separating business logic from UI
export const useTaskActions = () => {
  const { updateTask, deleteTask } = useMigratedTaskStore();
  
  const handleStatusToggle = (task: Task) => {
    const statusFlow = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo',
      blocked: 'todo'
    } as const;
    
    const newStatus = statusFlow[task.status] || 'todo';
    updateTask(task.id, { status: newStatus });
  };
  
  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };
  
  return {
    handleStatusToggle,
    handleDelete,
  };
};