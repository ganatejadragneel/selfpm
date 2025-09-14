import { useState, useCallback } from 'react';
import { useMigratedTaskStore } from '../store/migratedTaskStore';
import type { Task, TaskStatus, TaskCategory } from '../types';

export interface UseTaskOperationsReturn {
  loading: boolean;
  error: string | null;
  createTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (task: Task) => Promise<void>;
  moveTaskToCategory: (taskId: string, newCategory: TaskCategory) => Promise<void>;
  duplicateTask: (task: Task) => Promise<void>;
  clearError: () => void;
}

export const useTaskOperations = (): UseTaskOperationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    createTask: storeCreateTask, 
    updateTask: storeUpdateTask, 
    deleteTask: storeDeleteTask
  } = useMigratedTaskStore();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      await storeCreateTask(taskData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeCreateTask]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      await storeUpdateTask(id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeUpdateTask]);

  const deleteTask = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await storeDeleteTask(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeDeleteTask]);

  const toggleTaskStatus = useCallback(async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: newStatus });
  }, [updateTask]);

  const moveTaskToCategory = useCallback(async (taskId: string, newCategory: TaskCategory) => {
    await updateTask(taskId, { category: newCategory });
  }, [updateTask]);

  const duplicateTask = useCallback(async (task: Task) => {
    const duplicatedTask: Partial<Task> = {
      ...task,
      id: undefined, // Let the store generate new ID
      title: `${task.title} (Copy)`,
      status: 'todo',
      // progress: 0, // Remove if not in Task type
      createdAt: undefined,
      updatedAt: undefined,
    };
    await createTask(duplicatedTask);
  }, [createTask]);

  return {
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    moveTaskToCategory,
    duplicateTask,
    clearError,
  };
};