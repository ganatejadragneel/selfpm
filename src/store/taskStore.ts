import { create } from 'zustand';
import type { Task, TaskDependency, DependencyType, RecurringTaskTemplate } from '../types';
import { supabase } from '../lib/supabase';
import { getWeek, getYear, addDays } from 'date-fns';
import { useAuthStore } from './authStore';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentWeek: number;
  currentYear: number;
  dependencies: TaskDependency[];
  recurringTemplates: RecurringTaskTemplate[];
  
  // Actions
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
  
  // Note actions
  addNote: (taskId: string, content: string) => Promise<void>;
  
  // Attachment actions
  uploadAttachment: (taskId: string, file: File) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  
  // Activity and Comment actions
  logActivity: (taskId: string, activityType: string, oldValue?: string, newValue?: string, metadata?: any) => Promise<void>;
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
}

export const useTaskStore = create<TaskStore>((set, get) => ({
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
    
    // Get current user from auth store
    const authStore = useAuthStore.getState();
    const userId = authStore.user?.id;
    
    if (!userId) {
      set({ loading: false, error: 'User not authenticated' });
      return;
    }
    
    try {
      // Fetch tasks for the current week and user
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('week_number', week)
        .order('category')
        .order('order', { ascending: true });
      
      if (tasksError) throw tasksError;
      
      // Fetch related data for each task and convert snake_case to camelCase
      const tasksWithRelations = await Promise.all(
        (tasks || []).map(async (task) => {
          const [subtasksRes, updatesRes, notesRes, attachmentsRes, activitiesRes, commentsRes, dependenciesRes, dependentsRes] = await Promise.all([
            supabase.from('subtasks').select('*').eq('task_id', task.id).order('position'),
            supabase.from('task_updates').select('*').eq('task_id', task.id).order('created_at', { ascending: false }),
            supabase.from('notes').select('*').eq('task_id', task.id).order('created_at', { ascending: false }),
            supabase.from('attachments').select('*').eq('task_id', task.id).order('uploaded_at', { ascending: false }),
            supabase.from('task_activities').select('*, user:users(id, username)').eq('task_id', task.id).order('created_at', { ascending: false }).limit(20),
            supabase.from('task_comments').select('*, user:users(id, username)').eq('task_id', task.id).is('parent_comment_id', null).order('created_at', { ascending: false }),
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
            notes: notesRes.data || [],
            attachments: (attachmentsRes.data || []).map(attachment => ({
              id: attachment.id,
              taskId: attachment.task_id,
              userId: attachment.user_id,
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
              userId: activity.user_id,
              activityType: activity.activity_type,
              oldValue: activity.old_value,
              newValue: activity.new_value,
              metadata: activity.metadata,
              createdAt: activity.created_at,
              user: activity.user
            })),
            comments: (commentsRes.data || []).map(comment => ({
              id: comment.id,
              taskId: comment.task_id,
              userId: comment.user_id,
              parentCommentId: comment.parent_comment_id,
              content: comment.content,
              isEdited: comment.is_edited,
              editedAt: comment.edited_at,
              createdAt: comment.created_at,
              user: comment.user
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
    const week = get().currentWeek;
    
    // Get current user from auth store
    const authStore = useAuthStore.getState();
    const userId = authStore.user?.id;
    
    if (!userId) {
      set({ error: 'User not authenticated' });
      return;
    }
    
    const newTask = {
      user_id: userId,
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
      
      set(state => ({
        tasks: [...state.tasks, { ...data, subtasks: [], updates: [], notes: [], attachments: [], activities: [], comments: [] }]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateTask: async (id, updates) => {
    try {
      // Get current task for comparison
      const currentTask = get().tasks.find(t => t.id === id);
      if (!currentTask) return;
      
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
      if (updates.order !== undefined) dbUpdates.order = updates.order;
      
      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      // Log activities for significant changes
      if (updates.status !== undefined && updates.status !== currentTask.status) {
        await get().logActivity(id, 'status_changed', currentTask.status, updates.status);
      }
      if (updates.priority !== undefined && updates.priority !== currentTask.priority) {
        await get().logActivity(id, 'priority_changed', currentTask.priority, updates.priority);
      }
      if (updates.dueDate !== undefined && updates.dueDate !== currentTask.dueDate) {
        await get().logActivity(id, 'due_date_changed', currentTask.dueDate, updates.dueDate);
      }
      if (updates.description !== undefined && updates.description !== currentTask.description) {
        await get().logActivity(id, 'description_updated');
      }
      if (updates.category !== undefined && updates.category !== currentTask.category) {
        await get().logActivity(id, 'moved_category', currentTask.category, updates.category);
      }
      
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
      
      // Log activity
      await get().logActivity(taskId, 'subtask_added', undefined, title);
      
      // Convert snake_case to camelCase to match frontend expectations
      const formattedSubtask = {
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
            ? { ...task, subtasks: [...(task.subtasks || []), formattedSubtask] }
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
      
      // Recalculate progress if auto-progress is enabled
      if (task.autoProgress) {
        await get().calculateAutoProgress(task.id);
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteSubtask: async (subtaskId) => {
    try {
      // Find the subtask to get its title for activity log
      const task = get().tasks.find(t => 
        t.subtasks?.some(s => s.id === subtaskId)
      );
      const subtask = task?.subtasks?.find(s => s.id === subtaskId);
      
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      // Log activity
      if (task && subtask) {
        await get().logActivity(task.id, 'subtask_deleted', subtask.title);
      }
      
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

  reorderSubtasks: async (taskId, subtaskIds) => {
    try {
      // Update positions in database
      await Promise.all(
        subtaskIds.map((subtaskId, index) =>
          supabase
            .from('subtasks')
            .update({ position: index + 1 })
            .eq('id', subtaskId)
        )
      );

      // Update local state to reflect new order
      set(state => ({
        tasks: state.tasks.map(task => {
          if (task.id === taskId && task.subtasks) {
            const reorderedSubtasks = subtaskIds.map(id => 
              task.subtasks!.find(s => s.id === id)!
            ).filter(Boolean);
            return { ...task, subtasks: reorderedSubtasks };
          }
          return task;
        })
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
        const task = get().tasks.find(t => t.id === taskId);
        const oldProgress = task?.progressCurrent;
        await get().updateProgress(taskId, progressValue);
        await get().logActivity(taskId, 'progress_updated', oldProgress?.toString(), progressValue.toString(), 
          { progress_total: task?.progressTotal });
      }
      
      // Convert snake_case to camelCase to match frontend expectations
      const formattedUpdate = {
        id: data.id,
        taskId: data.task_id,
        updateText: data.update_text,
        progressValue: data.progress_value,
        createdAt: data.created_at
      };

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, updates: [formattedUpdate, ...(task.updates || [])] }
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
      
      // Log activity
      await get().logActivity(taskId, 'note_added', undefined, content.substring(0, 50));
      
      // Convert snake_case to camelCase to match frontend expectations
      const formattedNote = {
        id: data.id,
        taskId: data.task_id,
        content: data.content,
        createdAt: data.created_at
      };

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, notes: [formattedNote, ...(task.notes || [])] }
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

      // Update local state to reflect the reordering
      set(state => ({
        tasks: state.tasks.map(task => {
          if (taskIds.includes(task.id)) {
            return { ...task, category: destinationCategory as any };
          }
          return task;
        })
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  moveTaskToCategory: async (taskId, newCategory) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ category: newCategory })
        .eq('id', taskId);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, category: newCategory as any } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  uploadAttachment: async (taskId, file) => {
    try {
      // Get current user from auth store
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }

      // For now, we'll store the file as a base64 data URL in the database
      // This is a temporary solution until the storage bucket is properly configured
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
          user_id: userId,
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
      
      // Update local state
      const formattedAttachment = {
        id: data.id,
        taskId: data.task_id,
        userId: data.user_id,
        fileName: data.file_name,
        fileSize: data.file_size,
        fileType: data.file_type,
        fileUrl: data.file_url,
        thumbnailUrl: data.thumbnail_url,
        uploadedAt: data.uploaded_at
      };
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, attachments: [...(task.attachments || []), formattedAttachment] }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
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
      
      // Update local state
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          attachments: task.attachments?.filter(a => a.id !== attachmentId)
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  logActivity: async (taskId, activityType, oldValue, newValue, metadata) => {
    try {
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('task_activities')
        .insert([{
          task_id: taskId,
          user_id: userId,
          activity_type: activityType,
          old_value: oldValue,
          new_value: newValue,
          metadata
        }])
        .select('*, user:users(id, username)')
        .single();
      
      if (error) throw error;
      
      // Update local state
      const formattedActivity = {
        id: data.id,
        taskId: data.task_id,
        userId: data.user_id,
        activityType: data.activity_type,
        oldValue: data.old_value,
        newValue: data.new_value,
        metadata: data.metadata,
        createdAt: data.created_at,
        user: data.user
      };
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, activities: [formattedActivity, ...(task.activities || [])] }
            : task
        )
      }));
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  addComment: async (taskId, content, parentCommentId) => {
    try {
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) {
        set({ error: 'User not authenticated' });
        return;
      }
      
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          user_id: userId,
          parent_comment_id: parentCommentId,
          content
        }])
        .select('*, user:users(id, username)')
        .single();
      
      if (error) throw error;
      
      // Log activity
      await get().logActivity(taskId, 'comment_added', undefined, content.substring(0, 50));
      
      // Update local state
      const formattedComment = {
        id: data.id,
        taskId: data.task_id,
        userId: data.user_id,
        parentCommentId: data.parent_comment_id,
        content: data.content,
        isEdited: data.is_edited,
        editedAt: data.edited_at,
        createdAt: data.created_at,
        user: data.user
      };
      
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, comments: [...(task.comments || []), formattedComment] }
            : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  editComment: async (commentId, content) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .update({ 
          content,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          comments: task.comments?.map(comment =>
            comment.id === commentId
              ? { ...comment, content, isEdited: true, editedAt: new Date().toISOString() }
              : comment
          )
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteComment: async (commentId) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          comments: task.comments?.filter(c => c.id !== commentId)
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Smart Progress Methods
  updateSubtaskWeight: async (subtaskId, weight) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ weight })
        .eq('id', subtaskId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          subtasks: task.subtasks?.map(st =>
            st.id === subtaskId ? { ...st, weight } : st
          )
        }))
      }));
      
      // Recalculate progress if auto-progress is enabled
      const task = get().tasks.find(t => t.subtasks?.some(st => st.id === subtaskId));
      if (task?.autoProgress) {
        await get().calculateAutoProgress(task.id);
      }
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
      
      // Update local state
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
      set({ error: (error as Error).message });
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

  // Dependency Methods
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
      
      set(state => ({
        dependencies: [...state.dependencies, formattedDependency],
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, dependencies: [...(task.dependencies || []), formattedDependency] }
            : task
        )
      }));
      
      // Check if task should be blocked
      const canStart = get().checkDependencyStatus(taskId);
      if (!canStart && get().tasks.find(t => t.id === taskId)?.status === 'todo') {
        await get().updateTask(taskId, { status: 'blocked' });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  removeDependency: async (dependencyId) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId);
      
      if (error) throw error;
      
      set(state => ({
        dependencies: state.dependencies.filter(d => d.id !== dependencyId),
        tasks: state.tasks.map(task => ({
          ...task,
          dependencies: task.dependencies?.filter(d => d.id !== dependencyId)
        }))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchDependencies: async () => {
    try {
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*, task:tasks!task_id(user_id)')
        .eq('task.user_id', userId);
      
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
      set({ error: (error as Error).message });
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

  // Recurring Task Methods
  createRecurringTemplate: async (template) => {
    try {
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('recurring_task_templates')
        .insert([{
          user_id: userId,
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
      
      const formattedTemplate: RecurringTaskTemplate = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        recurrencePattern: data.recurrence_pattern,
        recurrenceDayOfWeek: data.recurrence_day_of_week,
        recurrenceDayOfMonth: data.recurrence_day_of_month,
        recurrenceMonths: data.recurrence_months,
        autoCreateDaysBefore: data.auto_create_days_before,
        isActive: data.is_active,
        lastCreatedAt: data.last_created_at,
        nextCreateAt: data.next_create_at,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      set(state => ({
        recurringTemplates: [...state.recurringTemplates, formattedTemplate]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateRecurringTemplate: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('recurring_task_templates')
        .update({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          priority: updates.priority,
          recurrence_pattern: updates.recurrencePattern,
          recurrence_day_of_week: updates.recurrenceDayOfWeek,
          recurrence_day_of_month: updates.recurrenceDayOfMonth,
          recurrence_months: updates.recurrenceMonths,
          auto_create_days_before: updates.autoCreateDaysBefore,
          is_active: updates.isActive,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        recurringTemplates: state.recurringTemplates.map(t =>
          t.id === id ? { ...t, ...updates } : t
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteRecurringTemplate: async (id) => {
    try {
      const { error } = await supabase
        .from('recurring_task_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        recurringTemplates: state.recurringTemplates.filter(t => t.id !== id)
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  fetchRecurringTemplates: async () => {
    try {
      const authStore = useAuthStore.getState();
      const userId = authStore.user?.id;
      
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('recurring_task_templates')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const formattedTemplates = (data || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        recurrencePattern: t.recurrence_pattern,
        recurrenceDayOfWeek: t.recurrence_day_of_week,
        recurrenceDayOfMonth: t.recurrence_day_of_month,
        recurrenceMonths: t.recurrence_months,
        autoCreateDaysBefore: t.auto_create_days_before,
        isActive: t.is_active,
        lastCreatedAt: t.last_created_at,
        nextCreateAt: t.next_create_at,
        metadata: t.metadata,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }));
      
      set({ recurringTemplates: formattedTemplates });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  generateRecurringTasks: async () => {
    const templates = get().recurringTemplates;
    const currentWeek = get().currentWeek;
    
    for (const template of templates) {
      if (!template.isActive) continue;
      
      // Logic to determine if task should be created based on recurrence pattern
      // This is simplified - you'd need more complex date logic for production
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
      
      // Update template's last created date
      await supabase
        .from('recurring_task_templates')
        .update({ 
          last_created_at: new Date().toISOString(),
          next_create_at: addDays(new Date(), 7).toISOString() // Simplified
        })
        .eq('id', template.id);
    }
  },

  // Bulk Operations
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
      
      set(state => ({
        tasks: state.tasks.map(task =>
          taskIds.includes(task.id) ? { ...task, ...updates } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  bulkDeleteTasks: async (taskIds) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds);
      
      if (error) throw error;
      
      set(state => ({
        tasks: state.tasks.filter(task => !taskIds.includes(task.id))
      }));
    } catch (error) {
      set({ error: (error as Error).message });
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
      
      set(state => ({
        tasks: state.tasks.map(task =>
          taskIds.includes(task.id) ? { ...task, category: category as any } : task
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  }
}));