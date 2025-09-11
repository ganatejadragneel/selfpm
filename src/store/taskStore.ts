/**
 * TaskStore - Refactored store using service layer
 * Following SOLID principles with proper separation of concerns
 */

import { create } from 'zustand';
import { TaskService } from '../services/TaskService';
import { RecurringTaskService } from '../services/RecurringTaskService';
import { DependencyService } from '../services/DependencyService';
import { ProgressCalculationService } from '../services/ProgressCalculationService';
import type { 
  Task, 
  TaskDependency, 
  DependencyType, 
  RecurringTaskTemplate,
  TaskActivity,
  WeeklyTaskCompletion,
  TaskCategory,
  TaskStatus,
  TaskPriority
} from '../types';
import { getWeek, getYear } from 'date-fns';
import { useSupabaseAuthStore } from './supabaseAuthStore';

interface TaskStore {
  // State
  tasks: Task[];
  dependencies: TaskDependency[];
  recurringTemplates: RecurringTaskTemplate[];
  activities: TaskActivity[];
  weeklyCompletions: Map<string, WeeklyTaskCompletion[]>;
  
  // UI State
  loading: boolean;
  error: string | null;
  currentWeek: number;
  currentYear: number;
  selectedTaskIds: Set<string>;
  filterState: {
    category?: TaskCategory;
    status?: TaskStatus;
    priority?: TaskPriority;
    searchTerm?: string;
  };
  
  // Services (initialized in store)
  taskService: TaskService;
  recurringTaskService: RecurringTaskService;
  dependencyService: DependencyService;
  progressService: ProgressCalculationService;
  
  // Core Task Actions
  fetchTasks: (weekNumber?: number) => Promise<void>;
  createTask: (taskData: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority?: TaskPriority;
    dueDate?: Date;
    progressTotal?: number;
    estimatedDuration?: number;
  }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Task Status Management
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  moveTaskToCategory: (taskId: string, category: TaskCategory) => Promise<void>;
  rolloverIncompleteTasks: () => Promise<void>;
  
  // Progress Management
  updateProgress: (taskId: string, current: number) => Promise<void>;
  calculateProgress: (taskId: string) => ReturnType<ProgressCalculationService['calculateTaskProgress']>;
  getAggregateProgress: () => ReturnType<ProgressCalculationService['calculateAggregateProgress']>;
  
  // Dependency Management
  addDependency: (taskId: string, dependsOnTaskId: string, type: DependencyType) => Promise<void>;
  removeDependency: (dependencyId: string) => Promise<void>;
  checkDependencyStatus: (taskId: string) => Promise<boolean>;
  getCriticalPath: () => Promise<Task[]>;
  
  // Recurring Task Management
  createRecurringTask: (taskData: {
    title: string;
    description?: string;
    priority?: string;
    recurrenceWeeks: number;
    estimatedDuration?: number;
  }) => Promise<void>;
  extendRecurringTask: (taskId: string, additionalWeeks: number) => Promise<void>;
  convertToRegularTask: (taskId: string, targetWeek: number) => Promise<void>;
  
  // Bulk Operations
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  selectTask: (taskId: string, selected: boolean) => void;
  selectAllTasks: (selected: boolean) => void;
  
  // Search and Filter
  searchTasks: (searchTerm: string) => Promise<void>;
  applyFilter: (filter: Partial<TaskStore['filterState']>) => void;
  clearFilters: () => void;
  getFilteredTasks: () => Task[];
  
  // Week Management
  setCurrentWeek: (weekNumber: number) => void;
  navigateWeek: (direction: 'prev' | 'next') => void;
  
  // Statistics
  getTaskStatistics: () => Promise<{
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    completionRate: number;
    averageTimeSpent: number;
  }>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => {
  // Initialize services
  const taskService = new TaskService();
  const recurringTaskService = new RecurringTaskService();
  const dependencyService = new DependencyService();
  const progressService = new ProgressCalculationService();
  
  return {
    // State initialization
    tasks: [],
    dependencies: [],
    recurringTemplates: [],
    activities: [],
    weeklyCompletions: new Map(),
    loading: false,
    error: null,
    currentWeek: getWeek(new Date()),
    currentYear: getYear(new Date()),
    selectedTaskIds: new Set(),
    filterState: {},
    
    // Service instances
    taskService,
    recurringTaskService,
    dependencyService,
    progressService,
    
    // Core Task Actions
    fetchTasks: async (weekNumber) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const week = weekNumber || get().currentWeek;
        const tasks = await taskService.getTasksForWeek(userId, week);
        
        // Also fetch recurring tasks that span this week
        const recurringTasks = await recurringTaskService.getRecurringTasksForWeekRange(
          userId,
          week,
          week
        );
        
        // Merge and dedupe tasks
        const allTasks = [...tasks, ...recurringTasks];
        const uniqueTasks = Array.from(
          new Map(allTasks.map(t => [t.id, t])).values()
        );
        
        set({ tasks: uniqueTasks, loading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch tasks',
          loading: false 
        });
      }
    },
    
    createTask: async (taskData) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const task = await taskService.createTask(userId, taskData, get().currentWeek);
        
        set(state => ({
          tasks: [...state.tasks, task],
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create task',
          loading: false 
        });
      }
    },
    
    updateTask: async (id, updates) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const updatedTask = await taskService.updateTask(id, updates, userId);
        
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update task',
          loading: false 
        });
      }
    },
    
    deleteTask: async (id) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        await taskService.deleteTask(id, userId);
        
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
          selectedTaskIds: new Set([...state.selectedTaskIds].filter(tid => tid !== id)),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete task',
          loading: false 
        });
      }
    },
    
    // Task Status Management
    updateTaskStatus: async (id, status) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const updatedTask = await taskService.updateTaskStatus(id, status, userId);
        
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? updatedTask : t),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update task status',
          loading: false 
        });
      }
    },
    
    moveTaskToCategory: async (taskId, category) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const updatedTask = await taskService.moveTaskToCategory(taskId, category, userId);
        
        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to move task',
          loading: false 
        });
      }
    },
    
    rolloverIncompleteTasks: async () => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const rolledOverCount = await taskService.rolloverIncompleteTasks(userId);
        
        // Refresh tasks for current week
        await get().fetchTasks();
        
        set({ loading: false });
        
        console.log(`Rolled over ${rolledOverCount} tasks to current week`);
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to rollover tasks',
          loading: false 
        });
      }
    },
    
    // Progress Management
    updateProgress: async (taskId, current) => {
      await get().updateTask(taskId, { progressCurrent: current });
    },
    
    calculateProgress: (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      return progressService.calculateTaskProgress(task);
    },
    
    getAggregateProgress: () => {
      return progressService.calculateAggregateProgress(get().tasks);
    },
    
    // Dependency Management
    addDependency: async (taskId, dependsOnTaskId, type) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const dependency = await dependencyService.addDependency(
          taskId,
          dependsOnTaskId,
          type
        );
        
        set(state => ({
          dependencies: [...state.dependencies, dependency],
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add dependency',
          loading: false 
        });
      }
    },
    
    removeDependency: async (dependencyId) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        await dependencyService.removeDependency(dependencyId);
        
        set(state => ({
          dependencies: state.dependencies.filter(d => d.id !== dependencyId),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to remove dependency',
          loading: false 
        });
      }
    },
    
    checkDependencyStatus: async (taskId) => {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return false;
      
      return await dependencyService.canStartTask(task, get().tasks, get().dependencies);
    },
    
    getCriticalPath: async () => {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      return await dependencyService.calculateCriticalPath(userId, get().tasks, get().dependencies);
    },
    
    // Recurring Task Management
    createRecurringTask: async (taskData) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const task = await recurringTaskService.createWeeklyRecurringTask(
          userId,
          taskData,
          get().currentWeek
        );
        
        set(state => ({
          tasks: [...state.tasks, task],
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create recurring task',
          loading: false 
        });
      }
    },
    
    extendRecurringTask: async (taskId, additionalWeeks) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const updatedTask = await recurringTaskService.extendRecurringTask(
          taskId,
          additionalWeeks,
          userId
        );
        
        set(state => ({
          tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to extend recurring task',
          loading: false 
        });
      }
    },
    
    convertToRegularTask: async (taskId, targetWeek) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const regularTask = await recurringTaskService.convertToRegularTask(
          taskId,
          targetWeek,
          userId
        );
        
        set(state => ({
          tasks: [...state.tasks.filter(t => t.id !== taskId), regularTask],
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to convert task',
          loading: false 
        });
      }
    },
    
    // Bulk Operations
    bulkUpdateTasks: async (taskIds, updates) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const updatedTasks = await taskService.batchUpdateTasks(taskIds, updates, userId);
        
        set(state => {
          const updatedTaskMap = new Map(updatedTasks.map(t => [t.id, t]));
          return {
            tasks: state.tasks.map(t => updatedTaskMap.get(t.id) || t),
            loading: false
          };
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update tasks',
          loading: false 
        });
      }
    },
    
    bulkDeleteTasks: async (taskIds) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        // Delete each task
        await Promise.all(
          taskIds.map(id => taskService.deleteTask(id, userId))
        );
        
        set(state => ({
          tasks: state.tasks.filter(t => !taskIds.includes(t.id)),
          selectedTaskIds: new Set(),
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete tasks',
          loading: false 
        });
      }
    },
    
    selectTask: (taskId, selected) => {
      set(state => {
        const newSelectedIds = new Set(state.selectedTaskIds);
        if (selected) {
          newSelectedIds.add(taskId);
        } else {
          newSelectedIds.delete(taskId);
        }
        return { selectedTaskIds: newSelectedIds };
      });
    },
    
    selectAllTasks: (selected) => {
      set(state => ({
        selectedTaskIds: selected ? new Set(state.tasks.map(t => t.id)) : new Set()
      }));
    },
    
    // Search and Filter
    searchTasks: async (searchTerm) => {
      set({ loading: true, error: null });
      
      try {
        const authStore = useSupabaseAuthStore.getState();
        const userId = authStore.user?.id;
        
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const tasks = await taskService.searchTasks(userId, searchTerm, get().filterState);
        
        set({ 
          tasks,
          filterState: { ...get().filterState, searchTerm },
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to search tasks',
          loading: false 
        });
      }
    },
    
    applyFilter: (filter) => {
      set(state => ({
        filterState: { ...state.filterState, ...filter }
      }));
    },
    
    clearFilters: () => {
      set({ filterState: {} });
    },
    
    getFilteredTasks: () => {
      const { tasks, filterState } = get();
      
      return tasks.filter(task => {
        if (filterState.category && task.category !== filterState.category) return false;
        if (filterState.status && task.status !== filterState.status) return false;
        if (filterState.priority && task.priority !== filterState.priority) return false;
        if (filterState.searchTerm) {
          const term = filterState.searchTerm.toLowerCase();
          return task.title.toLowerCase().includes(term) || 
                 task.description?.toLowerCase().includes(term);
        }
        return true;
      });
    },
    
    // Week Management
    setCurrentWeek: (weekNumber) => {
      set({ currentWeek: weekNumber });
      get().fetchTasks(weekNumber);
    },
    
    navigateWeek: (direction) => {
      const newWeek = get().currentWeek + (direction === 'next' ? 1 : -1);
      get().setCurrentWeek(newWeek);
    },
    
    // Statistics
    getTaskStatistics: async () => {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      return await taskService.getTaskStatistics(userId, get().currentWeek);
    },
    
    // Utility
    clearError: () => set({ error: null }),
    
    reset: () => set({
      tasks: [],
      dependencies: [],
      recurringTemplates: [],
      activities: [],
      weeklyCompletions: new Map(),
      loading: false,
      error: null,
      currentWeek: getWeek(new Date()),
      currentYear: getYear(new Date()),
      selectedTaskIds: new Set(),
      filterState: {}
    })
  };
});