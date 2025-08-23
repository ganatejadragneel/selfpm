import { create } from 'zustand';
import type { Task } from '../types';
import { supabase } from '../lib/supabase';
import { getWeek, getYear } from 'date-fns';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentWeek: number;
  currentYear: number;
  
  // Actions
  fetchTasks: (weekNumber?: number) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Subtask actions
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  
  // Progress actions
  updateProgress: (taskId: string, current: number) => Promise<void>;
  addTaskUpdate: (taskId: string, updateText: string, progressValue?: number) => Promise<void>;
  
  // Note actions
  addNote: (taskId: string, content: string) => Promise<void>;
  
  // Week management
  rolloverIncompleteTasks: () => Promise<void>;
  setCurrentWeek: (weekNumber: number) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  currentWeek: getWeek(new Date()),
  currentYear: getYear(new Date()),

  fetchTasks: async (weekNumber) => {
    set({ loading: true, error: null });
    const week = weekNumber || get().currentWeek;
    
    try {
      // Fetch tasks for the current week
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('week_number', week)
        .order('category')
        .order('created_at');
      
      if (tasksError) throw tasksError;
      
      // Fetch related data for each task and convert snake_case to camelCase
      const tasksWithRelations = await Promise.all(
        (tasks || []).map(async (task) => {
          const [subtasksRes, updatesRes, notesRes] = await Promise.all([
            supabase.from('subtasks').select('*').eq('task_id', task.id).order('position'),
            supabase.from('task_updates').select('*').eq('task_id', task.id).order('created_at', { ascending: false }),
            supabase.from('notes').select('*').eq('task_id', task.id).order('created_at', { ascending: false })
          ]);
          
          // Convert database snake_case to frontend camelCase
          return {
            id: task.id,
            category: task.category,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.due_date,
            isRecurring: task.is_recurring,
            recurrencePattern: task.recurrence_pattern,
            progressCurrent: task.progress_current,
            progressTotal: task.progress_total,
            weekNumber: task.week_number,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
            subtasks: (subtasksRes.data || []).map(subtask => ({
              id: subtask.id,
              taskId: subtask.task_id,
              title: subtask.title,
              isCompleted: subtask.is_completed,
              position: subtask.position,
              createdAt: subtask.created_at
            })),
            updates: (updatesRes.data || []).map(update => ({
              id: update.id,
              taskId: update.task_id,
              updateText: update.update_text,
              progressValue: update.progress_value,
              createdAt: update.created_at
            })),
            notes: notesRes.data || []
          };
        })
      );
      
      set({ tasks: tasksWithRelations, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createTask: async (taskData) => {
    const week = get().currentWeek;
    const newTask = {
      category: taskData.category,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      due_date: taskData.dueDate,
      is_recurring: taskData.isRecurring || false,
      recurrence_pattern: taskData.recurrencePattern,
      progress_current: taskData.progressCurrent || 0,
      progress_total: taskData.progressTotal,
      week_number: week
    };
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        tasks: [...state.tasks, { ...data, subtasks: [], updates: [], notes: [] }]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateTask: async (id, updates) => {
    try {
      // Convert camelCase updates to snake_case for database
      const dbUpdates: any = {};
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
      if (updates.progressCurrent !== undefined) dbUpdates.progress_current = updates.progressCurrent;
      if (updates.progressTotal !== undefined) dbUpdates.progress_total = updates.progressTotal;
      if (updates.weekNumber !== undefined) dbUpdates.week_number = updates.weekNumber;
      if (updates.recurrencePattern !== undefined) dbUpdates.recurrence_pattern = updates.recurrencePattern;
      
      // Direct mappings (same names)
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      
      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteTask: async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id)
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addSubtask: async (taskId, title) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      const position = (task?.subtasks?.length || 0) + 1;
      
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{ task_id: taskId, title, position, is_completed: false }])
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, subtasks: [...(task.subtasks || []), data] }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  toggleSubtask: async (subtaskId) => {
    try {
      // Find the subtask
      const task = get().tasks.find(t => 
        t.subtasks?.some(s => s.id === subtaskId)
      );
      if (!task) return;
      const subtask = task.subtasks?.find(s => s.id === subtaskId);
      
      if (!subtask) return;
      
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: !subtask.isCompleted })
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === task.id
            ? {
                ...t,
                subtasks: t.subtasks?.map(s =>
                  s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
                )
              }
            : t
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteSubtask: async (subtaskId) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          subtasks: task.subtasks?.filter(s => s.id !== subtaskId)
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateProgress: async (taskId, current) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ progress_current: current })
        .eq('id', taskId);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, progressCurrent: current } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addTaskUpdate: async (taskId, updateText, progressValue) => {
    try {
      const { data, error } = await supabase
        .from('task_updates')
        .insert([{ task_id: taskId, update_text: updateText, progress_value: progressValue }])
        .select()
        .single();
      
      if (error) throw error;
      
      // If progress value provided, update task progress too
      if (progressValue !== undefined) {
        await get().updateProgress(taskId, progressValue);
      }
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, updates: [data, ...(task.updates || [])] }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addNote: async (taskId, content) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{ task_id: taskId, content }])
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: [data, ...(task.notes || [])] }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  rolloverIncompleteTasks: async () => {
    const currentWeek = get().currentWeek;
    const nextWeek = currentWeek + 1;
    
    try {
      // Get incomplete tasks from current week (excluding recurring)
      const incompleteTasks = get().tasks.filter(
        task => task.status !== 'done' && !task.isRecurring
      );
      
      // Update their week number to next week
      await Promise.all(
        incompleteTasks.map(task =>
          supabase
            .from('tasks')
            .update({ week_number: nextWeek })
            .eq('id', task.id)
        )
      );
      
      // Create fresh recurring tasks for next week
      const recurringTasks = get().tasks.filter(task => task.isRecurring);
      
      await Promise.all(
        recurringTasks.map(task => {
          const { id, createdAt, updatedAt, subtasks, updates, notes, ...taskData } = task;
          return get().createTask({
            ...taskData,
            status: 'todo',
            progressCurrent: 0,
            weekNumber: nextWeek
          });
        })
      );
      
      set({ currentWeek: nextWeek });
      await get().fetchTasks(nextWeek);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setCurrentWeek: (weekNumber) => {
    set({ currentWeek: weekNumber });
  }
}));