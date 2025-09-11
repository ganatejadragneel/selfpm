/**
 * useModalOperations - Custom hook for modal operations
 * Provides a clean interface for modal management
 */

import { useCallback, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useUIStore } from '../store/uiStore';
import { TaskValidator } from '../validators/TaskValidator';
import type { Task, TaskCategory, TaskPriority } from '../types';

export function useModalOperations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const {
    createTask,
    updateTask,
    deleteTask,
    createRecurringTask,
    currentWeek
  } = useTaskStore();
  
  const {
    taskModal,
    closeTaskModal,
    showToast,
    setGlobalLoading
  } = useUIStore();
  
  // Handle task form submission
  const handleTaskSubmit = useCallback(async (formData: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority?: TaskPriority;
    dueDate?: Date;
    progressTotal?: number;
    estimatedDuration?: number;
    isRecurring?: boolean;
    recurrenceWeeks?: number;
  }) => {
    setIsSubmitting(true);
    setValidationErrors([]);
    
    try {
      // Basic validation
      const validation = TaskValidator.validateCreate({
        ...formData,
        dueDate: formData.dueDate?.toISOString()
      });
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors.map(e => e.message));
        showToast('error', 'Please fix validation errors');
        return false;
      }
      
      // Handle recurring task creation
      if (formData.isRecurring && formData.recurrenceWeeks) {
        await createRecurringTask({
          title: formData.title,
          description: formData.description,
          priority: formData.priority?.toString(),
          recurrenceWeeks: formData.recurrenceWeeks,
          estimatedDuration: formData.estimatedDuration
        });
        
        showToast('success', 'Recurring task created successfully');
      } else {
        // Create regular task
        if (taskModal.mode === 'create') {
          await createTask({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            dueDate: formData.dueDate,
            progressTotal: formData.progressTotal,
            estimatedDuration: formData.estimatedDuration
          });
          
          showToast('success', 'Task created successfully');
        } else if (taskModal.mode === 'edit' && taskModal.taskId) {
          await updateTask(taskModal.taskId, {
            ...formData,
            dueDate: formData.dueDate?.toISOString()
          });
          showToast('success', 'Task updated successfully');
        }
      }
      
      closeTaskModal();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      showToast('error', errorMessage);
      setValidationErrors([errorMessage]);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    taskModal,
    createTask,
    updateTask,
    createRecurringTask,
    currentWeek,
    closeTaskModal,
    showToast
  ]);
  
  // Handle task deletion from modal
  const handleTaskDelete = useCallback(async (taskId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (!confirmed) return false;
    
    setIsSubmitting(true);
    
    try {
      setGlobalLoading(true, 'Deleting task...');
      await deleteTask(taskId);
      showToast('success', 'Task deleted successfully');
      closeTaskModal();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      showToast('error', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  }, [deleteTask, closeTaskModal, showToast, setGlobalLoading]);
  
  // Handle subtask operations
  const handleSubtaskAdd = useCallback(async (
    taskId: string,
    subtaskTitle: string
  ) => {
    try {
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const newSubtask: any = {
        id: Date.now().toString(),
        title: subtaskTitle,
        isCompleted: false,
        taskId: taskId,
        position: task.subtasks?.length || 0,
        weight: 1,
        createdAt: new Date().toISOString()
      };
      
      const updatedSubtasks = [...(task.subtasks || []), newSubtask];
      await updateTask(taskId, { subtasks: updatedSubtasks });
      
      showToast('success', 'Subtask added');
      return true;
    } catch (error) {
      showToast('error', 'Failed to add subtask');
      return false;
    }
  }, [updateTask, showToast]);
  
  const handleSubtaskToggle = useCallback(async (
    taskId: string,
    subtaskId: string
  ) => {
    try {
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const updatedSubtasks = task.subtasks?.map(st =>
        st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
      );
      
      await updateTask(taskId, { subtasks: updatedSubtasks });
      return true;
    } catch (error) {
      showToast('error', 'Failed to toggle subtask');
      return false;
    }
  }, [updateTask, showToast]);
  
  const handleSubtaskDelete = useCallback(async (
    taskId: string,
    subtaskId: string
  ) => {
    try {
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const updatedSubtasks = task.subtasks?.filter(st => st.id !== subtaskId);
      await updateTask(taskId, { subtasks: updatedSubtasks });
      
      showToast('success', 'Subtask deleted');
      return true;
    } catch (error) {
      showToast('error', 'Failed to delete subtask');
      return false;
    }
  }, [updateTask, showToast]);
  
  // Handle progress update
  const handleProgressUpdate = useCallback(async (
    taskId: string,
    progressCurrent: number,
    progressTotal?: number
  ) => {
    try {
      const updates: Partial<Task> = { progressCurrent };
      if (progressTotal !== undefined) {
        updates.progressTotal = progressTotal;
      }
      
      await updateTask(taskId, updates);
      
      // Auto-complete task if progress reaches 100%
      if (progressTotal && progressCurrent >= progressTotal) {
        await updateTask(taskId, { status: 'done' });
        showToast('success', 'Task completed! 🎉');
      }
      
      return true;
    } catch (error) {
      showToast('error', 'Failed to update progress');
      return false;
    }
  }, [updateTask, showToast]);
  
  // Handle time tracking
  const handleTimeUpdate = useCallback(async (
    taskId: string,
    timeSpent: number
  ) => {
    try {
      await updateTask(taskId, { timeSpent });
      return true;
    } catch (error) {
      showToast('error', 'Failed to update time');
      return false;
    }
  }, [updateTask, showToast]);
  
  return {
    // State
    isSubmitting,
    validationErrors,
    modalState: taskModal,
    
    // Operations
    submitTask: handleTaskSubmit,
    deleteTask: handleTaskDelete,
    
    // Subtask operations
    addSubtask: handleSubtaskAdd,
    toggleSubtask: handleSubtaskToggle,
    deleteSubtask: handleSubtaskDelete,
    
    // Progress and time
    updateProgress: handleProgressUpdate,
    updateTime: handleTimeUpdate,
    
    // UI actions
    closeModal: closeTaskModal,
    clearErrors: () => setValidationErrors([])
  };
}