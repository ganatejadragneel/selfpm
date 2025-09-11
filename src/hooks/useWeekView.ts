/**
 * useWeekView - Custom hook for week view operations
 * Manages week navigation and task filtering
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useUIStore } from '../store/uiStore';
import { useUserPreferencesStore } from '../store/userPreferencesStore';
import { getWeek, addWeeks, startOfWeek, endOfWeek, format } from 'date-fns';
import type { Task, TaskCategory } from '../types';

export function useWeekView() {
  const {
    tasks,
    loading,
    error,
    currentWeek,
    setCurrentWeek,
    navigateWeek,
    fetchTasks,
    rolloverIncompleteTasks,
    filterState,
    applyFilter,
    clearFilters
  } = useTaskStore();
  
  const {
    viewMode,
    setViewMode,
    showToast
  } = useUIStore();
  
  const {
    categoryPreferences,
    displayPreferences
  } = useUserPreferencesStore();
  
  // Fetch tasks on week change
  useEffect(() => {
    fetchTasks(currentWeek);
  }, [currentWeek, fetchTasks]);
  
  // Calculate week dates
  const weekDates = useMemo(() => {
    const now = new Date();
    const currentWeekNumber = getWeek(now);
    const weekOffset = currentWeek - currentWeekNumber;
    const targetDate = addWeeks(now, weekOffset);
    
    return {
      start: startOfWeek(targetDate, { weekStartsOn: 1 }),
      end: endOfWeek(targetDate, { weekStartsOn: 1 }),
      weekNumber: currentWeek,
      year: targetDate.getFullYear(),
      isCurrentWeek: currentWeek === currentWeekNumber,
      isPastWeek: currentWeek < currentWeekNumber,
      isFutureWeek: currentWeek > currentWeekNumber
    };
  }, [currentWeek]);
  
  // Format week display
  const weekDisplay = useMemo(() => {
    const { start, end, weekNumber, year, isCurrentWeek } = weekDates;
    
    const dateRange = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    const weekLabel = isCurrentWeek ? 'Current Week' : `Week ${weekNumber}`;
    
    return {
      dateRange,
      weekLabel,
      fullLabel: `${weekLabel} (${dateRange})`,
      year
    };
  }, [weekDates]);
  
  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped = new Map<TaskCategory, Task[]>();
    
    // Initialize with ordered categories
    const orderedCategories = categoryPreferences.categoryOrder as TaskCategory[];
    orderedCategories.forEach(cat => {
      if (!categoryPreferences.hiddenCategories.includes(cat)) {
        grouped.set(cat, []);
      }
    });
    
    // Group tasks
    tasks.forEach(task => {
      if (!categoryPreferences.hiddenCategories.includes(task.category)) {
        const categoryTasks = grouped.get(task.category) || [];
        categoryTasks.push(task);
        grouped.set(task.category, categoryTasks);
      }
    });
    
    // Sort tasks within each category
    grouped.forEach((categoryTasks) => {
      categoryTasks.sort((a, b) => {
        // Sort by status first (in progress > todo > blocked > done)
        const statusOrder = { 'in_progress': 0, 'todo': 1, 'blocked': 2, 'done': 3 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // Then by priority
        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
        const aPriority = a.priority || 'medium';
        const bPriority = b.priority || 'medium';
        const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Finally by order
        return (a.order || 0) - (b.order || 0);
      });
    });
    
    return grouped;
  }, [tasks, categoryPreferences]);
  
  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      todo: 0,
      completionRate: 0,
      estimatedHours: 0,
      actualHours: 0,
      byCategory: new Map<TaskCategory, {
        total: number;
        completed: number;
        percentage: number;
      }>()
    };
    
    tasks.forEach(task => {
      // Status counts
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
      
      // Time tracking
      stats.estimatedHours += (task.estimatedDuration || 0) / 60;
      stats.actualHours += (task.timeSpent || 0) / 60;
      
      // Category statistics
      const catStats = stats.byCategory.get(task.category) || {
        total: 0,
        completed: 0,
        percentage: 0
      };
      
      catStats.total++;
      if (task.status === 'done') {
        catStats.completed++;
      }
      catStats.percentage = Math.round((catStats.completed / catStats.total) * 100);
      
      stats.byCategory.set(task.category, catStats);
    });
    
    stats.completionRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100)
      : 0;
    
    return stats;
  }, [tasks]);
  
  // Navigation handlers
  const goToCurrentWeek = useCallback(() => {
    const currentWeekNumber = getWeek(new Date());
    setCurrentWeek(currentWeekNumber);
  }, [setCurrentWeek]);
  
  const goToPreviousWeek = useCallback(() => {
    navigateWeek('prev');
  }, [navigateWeek]);
  
  const goToNextWeek = useCallback(() => {
    navigateWeek('next');
  }, [navigateWeek]);
  
  const goToWeek = useCallback((weekNumber: number) => {
    setCurrentWeek(weekNumber);
  }, [setCurrentWeek]);
  
  // Task rollover
  const handleRollover = useCallback(async () => {
    try {
      await rolloverIncompleteTasks();
      showToast('success', 'Tasks rolled over successfully');
    } catch (error) {
      showToast('error', 'Failed to rollover tasks');
    }
  }, [rolloverIncompleteTasks, showToast]);
  
  // Filter handlers
  const filterByCategory = useCallback((category: TaskCategory | null) => {
    if (category) {
      applyFilter({ category });
    } else {
      clearFilters();
    }
  }, [applyFilter, clearFilters]);
  
  const filterByStatus = useCallback((status: string | null) => {
    if (status && ['todo', 'in_progress', 'done', 'blocked'].includes(status)) {
      applyFilter({ status: status as any });
    } else {
      clearFilters();
    }
  }, [applyFilter, clearFilters]);
  
  // View mode handlers
  const changeViewMode = useCallback((mode: 'board' | 'list' | 'calendar' | 'timeline') => {
    setViewMode(mode);
  }, [setViewMode]);
  
  // Check if we should show rollover prompt
  const shouldShowRollover = useMemo(() => {
    if (!weekDates.isCurrentWeek) return false;
    
    // Check if there are incomplete tasks from previous weeks
    const hasOldIncompleteTasks = tasks.some(task => 
      task.weekNumber < currentWeek && 
      task.status !== 'done' &&
      !task.isRecurring
    );
    
    return hasOldIncompleteTasks;
  }, [tasks, currentWeek, weekDates.isCurrentWeek]);
  
  return {
    // State
    tasks,
    tasksByCategory,
    loading,
    error,
    statistics,
    
    // Week info
    currentWeek,
    weekDates,
    weekDisplay,
    
    // Navigation
    goToCurrentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToWeek,
    
    // Operations
    rolloverTasks: handleRollover,
    shouldShowRollover,
    
    // Filtering
    filterState,
    filterByCategory,
    filterByStatus,
    clearFilters,
    
    // View mode
    viewMode,
    changeViewMode,
    
    // Preferences
    displayPreferences,
    categoryColors: categoryPreferences.categoryColors
  };
}