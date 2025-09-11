/**
 * useTaskOperations - Custom hook for task operations
 * Provides a clean interface to task store operations with error handling
 */

import { useCallback, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useUIStore } from '../store/uiStore';
import type { Task, TaskCategory, TaskStatus, TaskPriority } from '../types';

export function useTaskOperations() {
  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    moveTaskToCategory,
    bulkUpdateTasks,
    bulkDeleteTasks,
    selectedTaskIds,
    selectTask,
    selectAllTasks,
    searchTasks,
    applyFilter,
    clearFilters,
    getFilteredTasks
  } = useTaskStore();
  
  const { showToast, setGlobalLoading } = useUIStore();
  
  // Wrapped operations with error handling and notifications
  const handleCreateTask = useCallback(async (
    taskData: Parameters<typeof createTask>[0]
  ) => {
    try {
      setGlobalLoading(true, 'Creating task...');
      await createTask(taskData);
      showToast('success', 'Task created successfully');
    } catch (error) {
      showToast('error', `Failed to create task: ${error}`);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  }, [createTask, showToast, setGlobalLoading]);
  
  const handleUpdateTask = useCallback(async (
    id: string,
    updates: Partial<Task>
  ) => {
    try {
      await updateTask(id, updates);
      showToast('success', 'Task updated');
    } catch (error) {
      showToast('error', `Failed to update task: ${error}`);
      throw error;
    }
  }, [updateTask, showToast]);
  
  const handleDeleteTask = useCallback(async (id: string) => {
    try {
      setGlobalLoading(true, 'Deleting task...');
      await deleteTask(id);
      showToast('success', 'Task deleted');
    } catch (error) {
      showToast('error', `Failed to delete task: ${error}`);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  }, [deleteTask, showToast, setGlobalLoading]);
  
  const handleStatusChange = useCallback(async (
    id: string,
    status: TaskStatus
  ) => {
    try {
      await updateTaskStatus(id, status);
      
      const statusMessages = {
        'done': 'Task completed! 🎉',
        'in_progress': 'Task in progress',
        'blocked': 'Task blocked',
        'todo': 'Task reopened'
      };
      
      showToast('success', statusMessages[status]);
    } catch (error) {
      showToast('error', `Failed to update status: ${error}`);
      throw error;
    }
  }, [updateTaskStatus, showToast]);
  
  const handleCategoryMove = useCallback(async (
    taskId: string,
    category: TaskCategory
  ) => {
    try {
      await moveTaskToCategory(taskId, category);
      showToast('success', 'Task moved successfully');
    } catch (error) {
      showToast('error', `Failed to move task: ${error}`);
      throw error;
    }
  }, [moveTaskToCategory, showToast]);
  
  const handleBulkUpdate = useCallback(async (
    updates: Partial<Task>
  ) => {
    if (selectedTaskIds.size === 0) {
      showToast('warning', 'No tasks selected');
      return;
    }
    
    try {
      setGlobalLoading(true, `Updating ${selectedTaskIds.size} tasks...`);
      await bulkUpdateTasks(Array.from(selectedTaskIds), updates);
      showToast('success', `${selectedTaskIds.size} tasks updated`);
      selectAllTasks(false); // Clear selection
    } catch (error) {
      showToast('error', `Failed to update tasks: ${error}`);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  }, [bulkUpdateTasks, selectedTaskIds, showToast, setGlobalLoading, selectAllTasks]);
  
  const handleBulkDelete = useCallback(async () => {
    if (selectedTaskIds.size === 0) {
      showToast('warning', 'No tasks selected');
      return;
    }
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedTaskIds.size} task(s)?`
    );
    
    if (!confirmDelete) return;
    
    try {
      setGlobalLoading(true, `Deleting ${selectedTaskIds.size} tasks...`);
      await bulkDeleteTasks(Array.from(selectedTaskIds));
      showToast('success', `${selectedTaskIds.size} tasks deleted`);
    } catch (error) {
      showToast('error', `Failed to delete tasks: ${error}`);
      throw error;
    } finally {
      setGlobalLoading(false);
    }
  }, [bulkDeleteTasks, selectedTaskIds, showToast, setGlobalLoading]);
  
  // Task filtering and searching
  const handleSearch = useCallback(async (term: string) => {
    try {
      await searchTasks(term);
    } catch (error) {
      showToast('error', `Search failed: ${error}`);
    }
  }, [searchTasks, showToast]);
  
  const handleFilter = useCallback((
    filter: {
      category?: TaskCategory;
      status?: TaskStatus;
      priority?: TaskPriority;
    }
  ) => {
    applyFilter(filter);
  }, [applyFilter]);
  
  // Computed values
  const filteredTasks = useMemo(() => getFilteredTasks(), [getFilteredTasks, tasks]);
  
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<TaskCategory, Task[]>();
    
    for (const task of filteredTasks) {
      const category = task.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(task);
    }
    
    return grouped;
  }, [filteredTasks]);
  
  const statistics = useMemo(() => {
    const stats = {
      total: filteredTasks.length,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      todo: 0
    };
    
    for (const task of filteredTasks) {
      switch (task.status) {
        case 'done':
          stats.completed++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
        case 'blocked':
          stats.blocked++;
          break;
        case 'todo':
          stats.todo++;
          break;
      }
    }
    
    return stats;
  }, [filteredTasks]);
  
  return {
    // State
    tasks: filteredTasks,
    tasksByCategory,
    loading,
    error,
    selectedTaskIds,
    statistics,
    
    // Operations
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    updateStatus: handleStatusChange,
    moveToCategory: handleCategoryMove,
    bulkUpdate: handleBulkUpdate,
    bulkDelete: handleBulkDelete,
    
    // Selection
    selectTask,
    selectAll: selectAllTasks,
    
    // Search & Filter
    search: handleSearch,
    filter: handleFilter,
    clearFilters
  };
}