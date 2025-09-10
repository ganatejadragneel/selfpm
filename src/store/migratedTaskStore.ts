import { create } from 'zustand';
import type { Task, TaskDependency, DependencyType, RecurringTaskTemplate, TaskActivity, Attachment, WeeklyTaskCompletion } from '../types';
import { supabase } from '../lib/supabase';
import { getWeek, getYear } from 'date-fns';
import { useSupabaseAuthStore } from './supabaseAuthStore';

interface MigratedTaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentWeek: number;
  currentYear: number;
  dependencies: TaskDependency[];
  recurringTemplates: RecurringTaskTemplate[];
  
  // Actions - Updated to use Supabase Auth
  fetchTasks: (weekNumber?: number) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Subtask actions
  addSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (subtaskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  reorderSubtasks: (taskId: string, subtaskIds: string[]) => Promise<void>;
  updateSubtaskWeight: (subtaskId: string, weight: number) => Promise<void>;
  
  // Progress actions
  updateProgress: (taskId: string, current: number) => Promise<void>;
  addTaskUpdate: (taskId: string, updateText: string, progressValue?: number) => Promise<void>;
  updateProgressSettings: (taskId: string, settings: { autoProgress: boolean; weightedProgress: boolean }) => Promise<void>;
  calculateAutoProgress: (taskId: string) => Promise<void>;
  
  // Attachment actions
  uploadAttachment: (taskId: string, file: File) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  
  // Activity and Comment actions
  logActivity: (taskId: string, activityType: string, oldValue?: string, newValue?: string, metadata?: any) => Promise<void>;
  fetchActivities: (startDate: Date, endDate: Date) => Promise<TaskActivity[]>;
  addComment: (taskId: string, content: string, parentCommentId?: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  // Task reordering and category management
  reorderTasks: (sourceCategory: string, destinationCategory: string, taskIds: string[]) => Promise<void>;
  moveTaskToCategory: (taskId: string, newCategory: string) => Promise<void>;
  
  // Week management
  rolloverIncompleteTasks: () => Promise<void>;
  setCurrentWeek: (weekNumber: number) => void;
  
  // Dependency actions
  addDependency: (taskId: string, dependsOnTaskId: string, type: DependencyType) => Promise<void>;
  removeDependency: (dependencyId: string) => Promise<void>;
  fetchDependencies: () => Promise<void>;
  checkDependencyStatus: (taskId: string) => boolean;
  
  // Recurring task actions
  createRecurringTemplate: (template: Partial<RecurringTaskTemplate>) => Promise<void>;
  updateRecurringTemplate: (id: string, updates: Partial<RecurringTaskTemplate>) => Promise<void>;
  deleteRecurringTemplate: (id: string) => Promise<void>;
  fetchRecurringTemplates: () => Promise<void>;
  generateRecurringTasks: () => Promise<void>;
  
  // Bulk operations
  bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  bulkDeleteTasks: (taskIds: string[]) => Promise<void>;
  bulkMoveTasks: (taskIds: string[], category: string) => Promise<void>;
  
  // Weekly task completion management
  getWeeklyTaskCompletion: (taskId: string, weekNumber: number) => Promise<WeeklyTaskCompletion | null>;
  setWeeklyTaskCompletion: (taskId: string, weekNumber: number, status: string, progressCurrent?: number) => Promise<void>;
  updateWeeklyRecurringTaskStatus: (taskId: string, updates: Partial<Task>) => Promise<void>;
  
  // Migration management
  migrateAllTasks: () => Promise<void>;
}

export const useMigratedTaskStore = create<MigratedTaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  currentWeek: getWeek(new Date()),
  currentYear: getYear(new Date()),
  dependencies: [],
  recurringTemplates: [],

  fetchTasks: async (weekNumber) => {
    set({ loading: true, error: null });
    const week = weekNumber || get().currentWeek;
    
    // Get current user from Supabase Auth store
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;
    
    if (!userId) {
      set({ loading: false, error: 'User not authenticated' });
      return;
    }
    
    try {
      // Fetch tasks using NEW_USER_ID column (references auth.users)
      // For regular tasks, fetch only tasks with week_number = current week
      // For weekly_recurring tasks, fetch if the task spans this week
      const { data: regularTasks, error: regularError } = await supabase
        .from('tasks')
        .select('*')
        .eq('new_user_id', userId) // Updated to use new_user_id
        .eq('week_number', week)
        .neq('category', 'weekly_recurring')
        .order('category')
        .order('order', { ascending: true });
      
      // Fetch weekly recurring tasks that should appear in this week
      const { data: recurringTasks, error: recurringError } = await supabase
        .from('tasks')
        .select('*')
        .eq('new_user_id', userId) // Updated to use new_user_id
        .eq('category', 'weekly_recurring')
        .lte('original_week_number', week)
        .gte('original_week_number', week - 14) // Look back max 14 weeks
        .order('order', { ascending: true });
      
      if (regularError) throw regularError;
      if (recurringError) throw recurringError;
      
      // Filter recurring tasks to only show those that span the current week
      const filteredRecurringTasks = (recurringTasks || []).filter(task => {
        const originalWeek = task.original_week_number || task.week_number;
        const weeks = task.recurrence_weeks || 1;
        return week >= originalWeek && week < originalWeek + weeks;
      });
      
      // Fetch weekly completion data for recurring tasks
      const recurringTaskIds = filteredRecurringTasks.map(task => task.id);
      const { data: weeklyCompletions } = await supabase
        .from('weekly_task_completions')
        .select('*')
        .eq('new_user_id', userId)
        .eq('week_number', week)
        .in('task_id', recurringTaskIds);
      
      // Apply weekly completion status to recurring tasks
      const recurringTasksWithWeeklyStatus = filteredRecurringTasks.map(task => {
        const weeklyCompletion = (weeklyCompletions || []).find(wc => wc.task_id === task.id);
        if (weeklyCompletion) {
          // Override status and progress with weekly-specific values
          return {
            ...task,
            status: weeklyCompletion.status,
            progress_current: weeklyCompletion.progress_current
          };
        }
        // No weekly completion found, use default 'todo' status for new week
        return {
          ...task,
          status: 'todo',
          progress_current: 0
        };
      });
      
      const tasks = [...(regularTasks || []), ...recurringTasksWithWeeklyStatus];
      
      // Fetch related data for each task and convert snake_case to camelCase
      const tasksWithRelations = await Promise.all(
        (tasks || []).map(async (task) => {
          const [subtasksRes, updatesRes, attachmentsRes, activitiesRes, commentsRes, dependenciesRes, dependentsRes] = await Promise.all([
            supabase.from('subtasks').select('*').eq('task_id', task.id).order('position'),
            supabase.from('task_updates').select('*').eq('task_id', task.id).order('created_at', { ascending: false }),
            supabase.from('attachments').select('*').eq('task_id', task.id).order('uploaded_at', { ascending: false }),
            supabase.from('task_activities').select('*').eq('task_id', task.id).order('created_at', { ascending: false }).limit(20),
            supabase.from('task_comments').select('*').eq('task_id', task.id).is('parent_comment_id', null).order('created_at', { ascending: false }),
            supabase.from('task_dependencies').select('*').eq('task_id', task.id),
            supabase.from('task_dependencies').select('*').eq('depends_on_task_id', task.id)
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
            recurrenceWeeks: task.recurrence_weeks,
            originalWeekNumber: task.original_week_number,
            progressCurrent: task.progress_current,
            progressTotal: task.progress_total,
            weekNumber: task.week_number,
            order: task.order || 0,
            createdAt: task.created_at,
            updatedAt: task.updated_at,
            subtasks: (subtasksRes.data || []).map(subtask => ({
              id: subtask.id,
              taskId: subtask.task_id,
              title: subtask.title,
              isCompleted: subtask.is_completed,
              position: subtask.position,
              weight: subtask.weight,
              autoCompleteParent: subtask.auto_complete_parent,
              createdAt: subtask.created_at
            })),
            updates: (updatesRes.data || []).map(update => ({
              id: update.id,
              taskId: update.task_id,
              updateText: update.update_text,
              progressValue: update.progress_value,
              createdAt: update.created_at
            })),
            attachments: (attachmentsRes.data || []).map(attachment => ({
              id: attachment.id,
              taskId: attachment.task_id,
              userId: attachment.new_user_id, // Updated field
              fileName: attachment.file_name,
              fileSize: attachment.file_size,
              fileType: attachment.file_type,
              fileUrl: attachment.file_url,
              thumbnailUrl: attachment.thumbnail_url,
              uploadedAt: attachment.uploaded_at
            })),
            activities: (activitiesRes.data || []).map(activity => ({
              id: activity.id,
              taskId: activity.task_id,
              userId: activity.new_user_id, // Updated field
              activityType: activity.activity_type,
              oldValue: activity.old_value,
              newValue: activity.new_value,
              metadata: activity.metadata,
              createdAt: activity.created_at,
              user: undefined // User details not available due to auth.users join limitations
            })),
            comments: (commentsRes.data || []).map(comment => ({
              id: comment.id,
              taskId: comment.task_id,
              userId: comment.new_user_id, // Updated field
              parentCommentId: comment.parent_comment_id,
              content: comment.content,
              isEdited: comment.is_edited,
              editedAt: comment.edited_at,
              createdAt: comment.created_at,
              user: undefined // User details not available due to auth.users join limitations
            })),
            dependencies: (dependenciesRes.data || []).map(dep => ({
              id: dep.id,
              taskId: dep.task_id,
              dependsOnTaskId: dep.depends_on_task_id,
              dependencyType: dep.dependency_type,
              createdAt: dep.created_at
            })),
            dependents: (dependentsRes.data || []).map(dep => ({
              id: dep.id,
              taskId: dep.task_id,
              dependsOnTaskId: dep.depends_on_task_id,
              dependencyType: dep.dependency_type,
              createdAt: dep.created_at
            })),
            autoProgress: task.auto_progress,
            weightedProgress: task.weighted_progress,
            completionVelocity: task.completion_velocity,
            estimatedCompletionDate: task.estimated_completion_date,
            recurringTemplateId: task.recurring_template_id
          };
        })
      );
      
      set({ tasks: tasksWithRelations, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createTask: async (taskData) => {
    const currentWeek = get().currentWeek;
    // Ensure we have a valid week number, fallback to current week of the year
    const week = (currentWeek && typeof currentWeek === 'number' && currentWeek >= 1) 
      ? currentWeek 
      : Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    // Get current user from Supabase Auth store
    const authStore = useSupabaseAuthStore.getState();
    const userId = authStore.user?.id;
    
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }
    
    const newTask = {
      new_user_id: userId, // Updated to use new_user_id
      category: taskData.category,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      due_date: taskData.dueDate,
      is_recurring: taskData.isRecurring || false,
      recurrence_pattern: taskData.recurrencePattern,
      recurrence_weeks: taskData.category === 'weekly_recurring' ? (taskData.recurrenceWeeks || 1) : null,
      original_week_number: taskData.category === 'weekly_recurring' ? week : null,
      progress_current: taskData.progressCurrent || 0,
      progress_total: taskData.progressTotal,
      week_number: week,
      order: taskData.order || 999
    };
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity for task creation
      await get().logActivity(data.id, 'created', undefined, data.title, { category: data.category });
      
      // Transform database format to frontend format (snake_case to camelCase)
      const transformedTask = {
        id: data.id,
        category: data.category,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.due_date,
        isRecurring: data.is_recurring,
        recurrencePattern: data.recurrence_pattern,
        recurrenceWeeks: data.recurrence_weeks,
        originalWeekNumber: data.original_week_number,
        progressCurrent: data.progress_current,
        progressTotal: data.progress_total,
        weekNumber: data.week_number,
        order: data.order || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        subtasks: [],
        updates: [],
        attachments: [],
        activities: [],
        comments: []
      };
      
      set(state => ({
        tasks: [...state.tasks, transformedTask]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Add remaining methods... (truncated for brevity)
  // The pattern is: replace user_id with new_user_id in all database operations
  // and use useSupabaseAuthStore.getState().user?.id instead of useAuthStore

  // Week management and other methods remain the same structure
  // but with updated user ID references
  
  updateTask: async (id, updates) => {
    try {
      // Get current user from Supabase Auth store
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      // Get current task values before updating for activity logging
      const currentTask = get().tasks.find(task => task.id === id);
      if (!currentTask) {
        set({ error: 'Task not found' });
        return;
      }

      // Transform frontend format to database format (camelCase to snake_case)
      const dbUpdates: any = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.progressCurrent !== undefined) dbUpdates.progress_current = updates.progressCurrent;
      if (updates.progressTotal !== undefined) dbUpdates.progress_total = updates.progressTotal;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.order !== undefined) dbUpdates.order = updates.order;
      if (updates.weekNumber !== undefined) dbUpdates.week_number = updates.weekNumber;
      if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
      if (updates.recurrencePattern !== undefined) dbUpdates.recurrence_pattern = updates.recurrencePattern;
      if (updates.recurrenceWeeks !== undefined) dbUpdates.recurrence_weeks = updates.recurrenceWeeks;
      if (updates.autoProgress !== undefined) dbUpdates.auto_progress = updates.autoProgress;
      if (updates.weightedProgress !== undefined) dbUpdates.weighted_progress = updates.weightedProgress;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .eq('new_user_id', userId); // Ensure user can only update their own tasks

      if (error) throw error;

      // Log activity if there were meaningful changes (using captured old values)
      if (updates.status) {
        await get().logActivity(id, 'status_changed', currentTask.status, updates.status);
      }
      if (updates.priority) {
        await get().logActivity(id, 'priority_changed', currentTask.priority, updates.priority);
      }
      if (updates.progressCurrent !== undefined) {
        await get().logActivity(id, 'progress_updated', currentTask.progressCurrent?.toString(), updates.progressCurrent.toString());
      }
      if (updates.weekNumber !== undefined) {
        await get().logActivity(id, 'moved_week', currentTask.weekNumber?.toString(), updates.weekNumber.toString());
      }

      // Update local state
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // ... (implement all other methods with the same pattern)
  
  setCurrentWeek: (weekNumber) => {
    set({ currentWeek: weekNumber });
  },

  // Placeholder implementations for brevity - would implement all methods
  deleteTask: async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Optimistic UI update - immediately remove from state
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  addSubtask: async (taskId, title) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      const task = get().tasks.find(t => t.id === taskId);
      const position = (task?.subtasks?.length || 0) + 1;
      
      const { data, error } = await supabase
        .from('subtasks')
        .insert([{ task_id: taskId, title, position, is_completed: false }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await get().logActivity(taskId, 'subtask_added', undefined, title);
      
      // Optimistically update local state
      const newSubtask = {
        id: data.id,
        taskId: data.task_id,
        title: data.title,
        isCompleted: data.is_completed,
        position: data.position,
        createdAt: data.created_at
      };

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, subtasks: [...(task.subtasks || []), newSubtask] }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateSubtask: async (subtaskId, title) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ title })
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          subtasks: task.subtasks?.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, title } : subtask
          )
        }))
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
      
      // Log activity
      if (!subtask.isCompleted) {
        await get().logActivity(task.id, 'subtask_completed', undefined, subtask.title);
      }
      
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
          subtasks: task.subtasks?.filter(subtask => subtask.id !== subtaskId)
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  reorderSubtasks: async (taskId, subtaskIds) => {
    try {
      // Update positions in database
      const updates = subtaskIds.map((id, index) => 
        supabase
          .from('subtasks')
          .update({ position: index + 1 })
          .eq('id', id)
      );
      
      await Promise.all(updates);
      
      // Update local state
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.sort((a, b) => {
                  const aIndex = subtaskIds.indexOf(a.id);
                  const bIndex = subtaskIds.indexOf(b.id);
                  return aIndex - bIndex;
                })
              }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateSubtaskWeight: async (subtaskId, weight) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ weight })
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          subtasks: task.subtasks?.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, weight } : subtask
          )
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  updateProgress: async (taskId, current) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({ progress_current: current })
        .eq('id', taskId)
        .eq('new_user_id', userId);

      if (error) throw error;

      // Log activity
      await get().logActivity(taskId, 'progress_updated', undefined, current.toString());

      // Update local state
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, progressCurrent: current } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  addTaskUpdate: async (taskId, updateText, progressValue?) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      // Add the update to task_updates table (this table doesn't have user_id field)
      const { error: updateError } = await supabase
        .from('task_updates')
        .insert({
          task_id: taskId,
          update_text: updateText,
          progress_value: progressValue
        });

      if (updateError) throw updateError;

      // If progress value was provided, update the task progress
      if (progressValue !== undefined) {
        const { error: progressError } = await supabase
          .from('tasks')
          .update({ progress_current: progressValue })
          .eq('id', taskId)
          .eq('new_user_id', userId);

        if (progressError) throw progressError;

        // Update local state with new progress
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === taskId ? { ...task, progressCurrent: progressValue } : task
          )
        }));
      }

      // Log activity
      await get().logActivity(taskId, 'updated', undefined, updateText);

      // Optimistically update local state to show the new update immediately
      const newUpdate = {
        id: crypto.randomUUID(), // Temporary ID
        taskId: taskId,
        updateText: updateText,
        progressValue: progressValue,
        createdAt: new Date().toISOString()
      };

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                updates: [newUpdate, ...(task.updates || [])] // Add new update at the beginning
              }
            : task
        )
      }));

    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  updateProgressSettings: async (taskId, settings) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          auto_progress: settings.autoProgress,
          weighted_progress: settings.weightedProgress
        })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, autoProgress: settings.autoProgress, weightedProgress: settings.weightedProgress }
            : task
        )
      }));
      
      // Calculate progress if auto-progress is enabled
      if (settings.autoProgress) {
        await get().calculateAutoProgress(taskId);
      }
    } catch (error) {
      console.error('Failed to update progress settings:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  calculateAutoProgress: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task || !task.autoProgress || !task.subtasks || task.subtasks.length === 0) return;
    
    let progress = 0;
    
    if (task.weightedProgress) {
      const totalWeight = task.subtasks.reduce((sum, st) => sum + (st.weight || 1), 0);
      const completedWeight = task.subtasks
        .filter(st => st.isCompleted)
        .reduce((sum, st) => sum + (st.weight || 1), 0);
      progress = Math.round((completedWeight / totalWeight) * 100);
    } else {
      const completed = task.subtasks.filter(st => st.isCompleted).length;
      progress = Math.round((completed / task.subtasks.length) * 100);
    }
    
    // Update progress in database and locally
    await get().updateProgress(taskId, progress);
  },
  uploadAttachment: async (taskId, file) => {
    try {
      // Get current user from Supabase Auth store
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      // Convert file to base64 data URL (same approach as old store)
      const reader = new FileReader();
      
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Create thumbnail URL if it's an image
      let thumbnailUrl = undefined;
      if (file.type.startsWith('image/')) {
        thumbnailUrl = fileDataUrl; // Use the data URL as thumbnail
      }
      
      // Save attachment metadata to database with data URL
      const { data, error } = await supabase
        .from('attachments')
        .insert([{
          task_id: taskId,
          new_user_id: userId, // Use new_user_id for Supabase Auth
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: fileDataUrl, // Store the data URL directly
          thumbnail_url: thumbnailUrl
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await get().logActivity(taskId, 'attachment_added', undefined, file.name);
      
      // Create formatted attachment for optimistic UI update
      const formattedAttachment: Attachment = {
        id: data.id,
        taskId: data.task_id,
        userId: userId,
        fileName: data.file_name,
        fileSize: data.file_size,
        fileType: data.file_type,
        fileUrl: data.file_url,
        thumbnailUrl: data.thumbnail_url,
        uploadedAt: data.uploaded_at
      };
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, attachments: [...(task.attachments || []), formattedAttachment] }
            : task
        )
      }));
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteAttachment: async (attachmentId) => {
    try {
      // Find the attachment to log activity
      const attachment = get().tasks
        .flatMap(t => t.attachments || [])
        .find(a => a.id === attachmentId);
      const task = get().tasks.find(t => 
        t.attachments?.some(a => a.id === attachmentId)
      );
      
      // Delete from database (no need to delete from storage since we're using data URLs)
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (error) throw error;
      
      // Log activity
      if (task && attachment) {
        await get().logActivity(task.id, 'attachment_deleted', attachment.fileName);
      }
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          attachments: task.attachments?.filter(a => a.id !== attachmentId)
        }))
      }));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  logActivity: async (taskId, activityType, oldValue?, newValue?, metadata?) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        return; // Don't throw error for activity logging, just skip
      }

      const { error } = await supabase
        .from('task_activities')
        .insert({
          task_id: taskId,
          new_user_id: userId, // Use new_user_id for migrated table
          activity_type: activityType,
          old_value: oldValue,
          new_value: newValue,
          metadata: metadata
        });

      if (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to avoid breaking main operations
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking main operations
    }
  },
  fetchActivities: async (startDate, endDate) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      console.log('fetchActivities: userId =', userId);
      console.log('fetchActivities: date range =', startDate.toISOString(), 'to', endDate.toISOString());
      
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('task_activities')
        .select('*')
        .eq('new_user_id', userId) // Use new_user_id for Supabase Auth
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      console.log('fetchActivities: raw data =', data);
      console.log('fetchActivities: error =', error);
      
      if (error) throw error;
      
      // Format the activities to match our TypeScript interface
      const formattedActivities: TaskActivity[] = (data || []).map(activity => ({
        id: activity.id,
        taskId: activity.task_id,
        userId: activity.new_user_id, // Map from new_user_id
        activityType: activity.activity_type,
        oldValue: activity.old_value,
        newValue: activity.new_value,
        metadata: activity.metadata,
        createdAt: activity.created_at,
        user: undefined // No user join data available from client side
      }));
      
      console.log('fetchActivities: formatted activities =', formattedActivities.length);
      return formattedActivities;
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      set({ error: (error as Error).message });
      return [];
    }
  },
  addComment: async (taskId, content, parentCommentId?) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      // For now, we need to set both user_id and new_user_id due to schema constraints
      // user_id should be null for new Supabase Auth users, but the schema might require it
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          new_user_id: userId, // Use new_user_id for Supabase Auth
          content: content,
          parent_comment_id: parentCommentId
        });

      if (error) throw error;

      // Log activity
      await get().logActivity(taskId, 'comment_added', undefined, content);

      // Refresh the task data to show the new comment
      await get().fetchTasks();

    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  editComment: async (commentId, content) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      const { error } = await supabase
        .from('task_comments')
        .update({ 
          content: content,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('new_user_id', userId); // Ensure user can only edit their own comments

      if (error) throw error;

      // Refresh the task data to show the updated comment
      await get().fetchTasks();

    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteComment: async (commentId) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)
        .eq('new_user_id', userId); // Ensure user can only delete their own comments

      if (error) throw error;

      // Refresh the task data to show the comment was deleted
      await get().fetchTasks();

    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
  reorderTasks: async (sourceCategory, destinationCategory, taskIds) => {
    try {
      // If tasks are moving to a different category, update their category
      if (sourceCategory !== destinationCategory) {
        await Promise.all(
          taskIds.map(taskId =>
            supabase
              .from('tasks')
              .update({ category: destinationCategory })
              .eq('id', taskId)
          )
        );
      }
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task => {
          if (taskIds.includes(task.id)) {
            return { ...task, category: destinationCategory as any };
          }
          return task;
        })
      }));
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  moveTaskToCategory: async (taskId, newCategory) => {
    try {
      // Get current task for comparison
      const currentTask = get().tasks.find(t => t.id === taskId);
      if (!currentTask) return;
      
      const { error } = await supabase
        .from('tasks')
        .update({ category: newCategory })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Log activity for category change
      await get().logActivity(taskId, 'moved_category', currentTask.category, newCategory);
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, category: newCategory as any } : task
        )
      }));
    } catch (error) {
      console.error('Failed to move task to category:', error);
      set({ error: (error as Error).message });
      throw error;
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
      
      // Generate fresh recurring tasks for next week
      await get().generateRecurringTasks();
      
      // Update current week
      get().setCurrentWeek(nextWeek);
      
      // Refresh tasks to show the new week's tasks
      await get().fetchTasks();
    } catch (error) {
      console.error('Failed to rollover incomplete tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  addDependency: async (taskId, dependsOnTaskId, type) => {
    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert([{
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
          dependency_type: type
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const formattedDependency: TaskDependency = {
        id: data.id,
        taskId: data.task_id,
        dependsOnTaskId: data.depends_on_task_id,
        dependencyType: data.dependency_type,
        createdAt: data.created_at
      };
      
      // Optimistic UI update
      set(state => ({
        dependencies: [...(state.dependencies || []), formattedDependency],
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, dependencies: [...(task.dependencies || []), formattedDependency] }
            : task
        )
      }));
      
      // Check if task should be blocked based on dependencies
      const task = get().tasks.find(t => t.id === taskId);
      const canStart = get().checkDependencyStatus(taskId);
      if (!canStart && task?.status === 'todo') {
        await get().updateTask(taskId, { status: 'blocked' });
      }
    } catch (error) {
      console.error('Failed to add dependency:', error);
      throw error;
    }
  },

  removeDependency: async (dependencyId) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);
      
      if (error) throw error;
      
      // Optimistic UI update
      set(state => ({
        dependencies: (state.dependencies || []).filter(d => d.id !== dependencyId),
        tasks: state.tasks.map(task => ({
          ...task,
          dependencies: task.dependencies?.filter(d => d.id !== dependencyId)
        }))
      }));
    } catch (error) {
      console.error('Failed to remove dependency:', error);
      throw error;
    }
  },
  fetchDependencies: async () => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      // Note: Can't join with auth.users from client side, so we get basic dependency data
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*');
      
      if (error) throw error;
      
      const formattedDeps = (data || []).map(dep => ({
        id: dep.id,
        taskId: dep.task_id,
        dependsOnTaskId: dep.depends_on_task_id,
        dependencyType: dep.dependency_type,
        createdAt: dep.created_at
      }));

      set({ dependencies: formattedDeps });
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  checkDependencyStatus: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies || task.dependencies.length === 0) return true;
    
    return task.dependencies.every(dep => {
      const depTask = get().tasks.find(t => t.id === dep.dependsOnTaskId);
      if (!depTask) return true;
      
      switch (dep.dependencyType) {
        case 'finish_to_start':
          return depTask.status === 'done';
        case 'start_to_start':
          return depTask.status !== 'todo';
        case 'finish_to_finish':
          return true;
        case 'start_to_finish':
          return depTask.status !== 'todo';
        default:
          return true;
      }
    });
  },
  createRecurringTemplate: async (template) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      const { error } = await supabase
        .from('recurring_task_templates')
        .insert([{
          new_user_id: userId, // Use new_user_id for Supabase Auth
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          recurrence_pattern: template.recurrencePattern,
          recurrence_day_of_week: template.recurrenceDayOfWeek,
          recurrence_day_of_month: template.recurrenceDayOfMonth,
          recurrence_months: template.recurrenceMonths,
          auto_create_days_before: template.autoCreateDaysBefore || 0,
          is_active: true,
          metadata: template.metadata
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh recurring templates
      await get().fetchRecurringTemplates();
    } catch (error) {
      console.error('Failed to create recurring template:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateRecurringTemplate: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('recurring_task_templates')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh recurring templates
      await get().fetchRecurringTemplates();
    } catch (error) {
      console.error('Failed to update recurring template:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteRecurringTemplate: async (id) => {
    try {
      const { error } = await supabase
        .from('recurring_task_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh recurring templates
      await get().fetchRecurringTemplates();
    } catch (error) {
      console.error('Failed to delete recurring template:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  fetchRecurringTemplates: async () => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('recurring_task_templates')
        .select('*')
        .eq('new_user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Store in recurring templates state if it exists
      // For now, we'll just log success
      console.log('Fetched recurring templates:', data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch recurring templates:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  generateRecurringTasks: async () => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      // Get active recurring templates
      const { data: templates, error } = await supabase
        .from('recurring_task_templates')
        .select('*')
        .eq('new_user_id', userId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const currentWeek = get().currentWeek;
      
      // Simple logic to generate recurring tasks - this could be made more sophisticated
      for (const template of templates || []) {
        // Check if task already exists for this week
        const existingTask = get().tasks.find(
          task => task.recurringTemplateId === template.id && task.weekNumber === currentWeek
        );
        
        if (!existingTask) {
          // Create new recurring task
          await get().createTask({
            title: template.title,
            description: template.description,
            category: template.category,
            priority: template.priority,
            status: 'todo',
            isRecurring: true,
            recurringTemplateId: template.id,
            weekNumber: currentWeek
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate recurring tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
  bulkUpdateTasks: async (taskIds, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: updates.status,
          priority: updates.priority,
          category: updates.category,
          due_date: updates.dueDate,
          updated_at: new Date().toISOString()
        })
        .in('id', taskIds);
      
      if (error) throw error;
      
      // Log activity for each task
      for (const taskId of taskIds) {
        await get().logActivity(taskId, 'updated', undefined, 'Bulk update');
      }
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task =>
          taskIds.includes(task.id) ? { ...task, ...updates } : task
        )
      }));
    } catch (error) {
      console.error('Failed to bulk update tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  bulkDeleteTasks: async (taskIds) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds);
      
      if (error) throw error;
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.filter(task => !taskIds.includes(task.id))
      }));
    } catch (error) {
      console.error('Failed to bulk delete tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  bulkMoveTasks: async (taskIds, category) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          category,
          updated_at: new Date().toISOString()
        })
        .in('id', taskIds);
      
      if (error) throw error;
      
      // Log activity for each task
      for (const taskId of taskIds) {
        const task = get().tasks.find(t => t.id === taskId);
        if (task) {
          await get().logActivity(taskId, 'moved_category', task.category, category);
        }
      }
      
      // Optimistic UI update
      set(state => ({
        tasks: state.tasks.map(task =>
          taskIds.includes(task.id) ? { ...task, category: category as any } : task
        )
      }));
    } catch (error) {
      console.error('Failed to bulk move tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Weekly task completion management
  getWeeklyTaskCompletion: async (taskId, weekNumber) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('weekly_task_completions')
        .select('*')
        .eq('task_id', taskId)
        .eq('new_user_id', userId)
        .eq('week_number', weekNumber)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      if (!data) return null;
      
      return {
        id: data.id,
        taskId: data.task_id,
        userId: data.new_user_id,
        weekNumber: data.week_number,
        status: data.status,
        progressCurrent: data.progress_current,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Failed to get weekly task completion:', error);
      return null;
    }
  },

  setWeeklyTaskCompletion: async (taskId, weekNumber, status, progressCurrent = 0) => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }
      
      const { error } = await supabase
        .from('weekly_task_completions')
        .upsert({
          task_id: taskId,
          new_user_id: userId,
          week_number: weekNumber,
          status: status,
          progress_current: progressCurrent
        }, {
          onConflict: 'task_id,new_user_id,week_number'
        });
      
      if (error) throw error;
      
      // Log activity for the status change
      await get().logActivity(taskId, 'status_changed', undefined, status, { weekNumber });
      
    } catch (error) {
      console.error('Failed to set weekly task completion:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateWeeklyRecurringTaskStatus: async (taskId, updates) => {
    try {
      const currentWeek = get().currentWeek;
      const task = get().tasks.find(t => t.id === taskId);
      
      if (!task) {
        set({ error: 'Task not found' });
        return;
      }
      
      // For weekly recurring tasks, update the weekly completion table
      if (task.category === 'weekly_recurring') {
        if (updates.status !== undefined) {
          await get().setWeeklyTaskCompletion(
            taskId, 
            currentWeek, 
            updates.status, 
            updates.progressCurrent || task.progressCurrent || 0
          );
        }
        
        // Update local state immediately for UI responsiveness
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === taskId ? { ...t, ...updates } : t
          )
        }));
      } else {
        // For non-weekly recurring tasks, use the regular update method
        await get().updateTask(taskId, updates);
      }
    } catch (error) {
      console.error('Failed to update weekly recurring task status:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  migrateAllTasks: async () => {
    try {
      const authStore = useSupabaseAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      const currentWeek = get().currentWeek;
      const actualCurrentWeek = getWeek(new Date());
      
      // Only allow migration from older weeks
      if (currentWeek >= actualCurrentWeek) {
        set({ error: 'Migration is only available for older weeks' });
        return;
      }

      // Get tasks that need migration (exclude weekly_recurring and completed tasks)
      const tasksToMigrate = get().tasks.filter(task => 
        task.category !== 'weekly_recurring' && 
        (task.status === 'todo' || task.status === 'in_progress')
      );

      if (tasksToMigrate.length === 0) {
        return; // Nothing to migrate
      }

      const todoTasks = tasksToMigrate.filter(task => task.status === 'todo');
      const inProgressTasks = tasksToMigrate.filter(task => task.status === 'in_progress');

      // For To-Do tasks: Update weekNumber to current week (move)
      for (const task of todoTasks) {
        const { error } = await supabase
          .from('tasks')
          .update({ week_number: actualCurrentWeek })
          .eq('id', task.id)
          .eq('new_user_id', userId);

        if (error) throw error;

        // Log activity
        await get().logActivity(task.id, 'moved_week', currentWeek.toString(), actualCurrentWeek.toString());
      }

      // For In-Progress tasks: Create new task records for current week
      for (const task of inProgressTasks) {
        // Create new task record
        const newTaskData = {
          new_user_id: userId,
          category: task.category,
          title: task.title,
          description: task.description,
          status: 'in_progress',
          priority: task.priority,
          due_date: task.dueDate,
          is_recurring: task.isRecurring,
          recurrence_pattern: task.recurrencePattern,
          progress_current: task.progressCurrent || 0,
          progress_total: task.progressTotal,
          week_number: actualCurrentWeek,
          order: 0, // Add at beginning of category
          auto_progress: task.autoProgress,
          weighted_progress: task.weightedProgress
        };

        const { data: newTask, error: taskError } = await supabase
          .from('tasks')
          .insert([newTaskData])
          .select()
          .single();

        if (taskError) throw taskError;

        // Copy subtasks with preserved completion status
        if (task.subtasks && task.subtasks.length > 0) {
          const subtasksData = task.subtasks.map(subtask => ({
            task_id: newTask.id,
            title: subtask.title,
            is_completed: subtask.isCompleted,
            position: subtask.position,
            weight: subtask.weight,
            auto_complete_parent: subtask.autoCompleteParent
          }));

          const { error: subtasksError } = await supabase
            .from('subtasks')
            .insert(subtasksData);

          if (subtasksError) throw subtasksError;
        }

        // Copy task dependencies (keep references to same dependency tasks)
        if (task.dependencies && task.dependencies.length > 0) {
          const dependenciesData = task.dependencies.map(dep => ({
            task_id: newTask.id,
            depends_on_task_id: dep.dependsOnTaskId,
            dependency_type: dep.dependencyType
          }));

          const { error: depsError } = await supabase
            .from('task_dependencies')
            .insert(dependenciesData);

          if (depsError) throw depsError;
        }

        // Attachments are shared/referenced by both tasks (no copying needed)
        // since they reference the original task_id

        // Log activity
        await get().logActivity(newTask.id, 'created', undefined, `Migrated from week ${currentWeek}`, { 
          originalTaskId: task.id,
          migration: true 
        });
      }

      // Refresh tasks to show the migrated tasks
      await get().fetchTasks(actualCurrentWeek);
      
      // Switch to current week to show migrated tasks
      get().setCurrentWeek(actualCurrentWeek);

    } catch (error) {
      console.error('Failed to migrate tasks:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));