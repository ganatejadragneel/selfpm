/**
 * TaskRepository - Specialized repository for Task operations
 * Following SRP: Single responsibility for task data access
 */

import { BaseRepository } from './base/BaseRepository';
import type { Task, TaskCategory, TaskStatus, Subtask, WeeklyTaskCompletion } from '../types';

interface TaskWithRelations extends Task {
  subtasks?: Subtask[];
  weeklyCompletions?: WeeklyTaskCompletion[];
}

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super('tasks');
  }

  /**
   * Custom transformation for tasks (handles nested data)
   */
  protected transformFromDatabase(data: Record<string, unknown>): Task {
    if (!data) return data;

    const base = super.transformFromDatabase(data);
    
    // Handle specific task transformations
    if (data.subtasks) {
      (base as any).subtasks = (data.subtasks as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => super.transformFromDatabase(s));
    }
    
    if (data.attachments && typeof data.attachments === 'string') {
      try {
        (base as any).attachments = JSON.parse(data.attachments as string);
      } catch {
        (base as any).attachments = [];
      }
    }

    if (data.task_updates && typeof data.task_updates === 'string') {
      try {
        (base as any).taskUpdates = JSON.parse(data.task_updates as string);
      } catch {
        (base as any).taskUpdates = [];
      }
    }

    return base;
  }

  /**
   * Find tasks for a specific week and user
   */
  async findByWeek(userId: string, weekNumber: number): Promise<TaskWithRelations[]> {
    try {
      // Fetch regular tasks for the week
      const { data: regularTasks, error: regularError } = await this.client
        .from(this.tableName)
        .select(`
          *,
          subtasks (*)
        `)
        .eq('new_user_id', userId)
        .eq('week_number', weekNumber)
        .neq('category', 'weekly_recurring')
        .order('category')
        .order('order', { ascending: true });

      if (regularError) throw regularError;

      // Fetch weekly recurring tasks
      const { data: recurringTasks, error: recurringError } = await this.client
        .from(this.tableName)
        .select(`
          *,
          subtasks (*)
        `)
        .eq('new_user_id', userId)
        .eq('category', 'weekly_recurring')
        .lte('original_week_number', weekNumber)
        .gte('original_week_number', weekNumber - 14) // Look back max 14 weeks
        .order('order', { ascending: true });

      if (recurringError) throw recurringError;

      // Filter recurring tasks that span the current week
      const filteredRecurringTasks = (recurringTasks || []).filter(task => {
        const originalWeek = task.original_week_number || task.week_number;
        const weeks = task.recurrence_weeks || 1;
        return weekNumber >= originalWeek && weekNumber < originalWeek + weeks;
      });

      // Fetch weekly completion data for recurring tasks
      if (filteredRecurringTasks.length > 0) {
        const recurringTaskIds = filteredRecurringTasks.map(task => task.id);
        const { data: weeklyCompletions } = await this.client
          .from('weekly_task_completions')
          .select('*')
          .eq('new_user_id', userId)
          .eq('week_number', weekNumber)
          .in('task_id', recurringTaskIds);

        // Apply weekly completion status to recurring tasks
        const recurringTasksWithStatus = filteredRecurringTasks.map(task => {
          const weeklyCompletion = (weeklyCompletions || []).find(wc => wc.task_id === task.id);
          if (weeklyCompletion) {
            return {
              ...task,
              status: weeklyCompletion.status,
              progressCurrent: weeklyCompletion.progress_current || task.progress_current,
              timeSpent: weeklyCompletion.time_spent || task.time_spent,
            };
          }
          return task;
        });

        const allTasks = [...(regularTasks || []), ...recurringTasksWithStatus];
        return allTasks.map(task => this.transformFromDatabase(task));
      }

      const allTasks = [...(regularTasks || []), ...filteredRecurringTasks];
      return allTasks.map(task => this.transformFromDatabase(task));
    } catch (error) {
      console.error('Error fetching tasks by week:', error);
      throw error;
    }
  }

  /**
   * Find tasks by category
   */
  async findByCategory(userId: string, category: TaskCategory): Promise<Task[]> {
    const result = await this.findAll({
      filters: {
        newUserId: userId,
        category,
      },
      orderBy: [{ column: 'order', ascending: true }],
    });

    return result.data || [];
  }

  /**
   * Move task to a different category
   */
  async moveToCategory(taskId: string, newCategory: TaskCategory): Promise<Task | null> {
    const result = await this.update(taskId, { category: newCategory });
    return result.data;
  }

  /**
   * Update task status
   */
  async updateStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
    const result = await this.update(taskId, { status });
    return result.data;
  }

  /**
   * Reorder tasks within a category
   */
  async reorderTasks(taskIds: string[]): Promise<boolean> {
    try {
      const updates = taskIds.map((id, index) => ({
        id,
        data: { order: index },
      }));

      const result = await this.bulkUpdate(updates);
      return !result.error;
    } catch (error) {
      console.error('Error reordering tasks:', error);
      return false;
    }
  }

  /**
   * Get incomplete tasks from previous weeks
   */
  async getIncompleteTasks(userId: string, beforeWeek: number): Promise<Task[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('new_user_id', userId)
        .lt('week_number', beforeWeek)
        .neq('status', 'done')
        .neq('category', 'weekly_recurring');

      if (error) throw error;

      return data ? data.map(task => this.transformFromDatabase(task)) : [];
    } catch (error) {
      console.error('Error fetching incomplete tasks:', error);
      return [];
    }
  }

  /**
   * Rollover incomplete tasks to current week
   */
  async rolloverTasks(userId: string, targetWeek: number): Promise<number> {
    try {
      const incompleteTasks = await this.getIncompleteTasks(userId, targetWeek);
      
      if (incompleteTasks.length === 0) return 0;

      const updates = incompleteTasks.map(task => ({
        id: task.id,
        data: { weekNumber: targetWeek },
      }));

      const result = await this.bulkUpdate(updates);
      return result.data?.length || 0;
    } catch (error) {
      console.error('Error rolling over tasks:', error);
      return 0;
    }
  }

  /**
   * Get task statistics for a user
   */
  async getTaskStats(userId: string, weekNumber?: number): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
  }> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('status', { count: 'exact' })
        .eq('new_user_id', userId);

      if (weekNumber !== undefined) {
        query = query.eq('week_number', weekNumber);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        completed: 0,
        inProgress: 0,
        blocked: 0,
      };

      data?.forEach(task => {
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
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      return { total: 0, completed: 0, inProgress: 0, blocked: 0 };
    }
  }

  /**
   * Search tasks by title or description
   */
  async searchTasks(userId: string, searchTerm: string): Promise<Task[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('new_user_id', userId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      if (error) throw error;

      return data ? data.map(task => this.transformFromDatabase(task)) : [];
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  /**
   * Get tasks with dependencies
   */
  async getTasksWithDependencies(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          dependencies!task_dependencies_task_id_fkey (
            id,
            depends_on_task_id,
            dependency_type
          ),
          dependents:task_dependencies!task_dependencies_depends_on_task_id_fkey (
            id,
            task_id,
            dependency_type
          )
        `)
        .eq('new_user_id', userId);

      if (error) throw error;

      return data ? data.map(task => this.transformFromDatabase(task)) : [];
    } catch (error) {
      console.error('Error fetching tasks with dependencies:', error);
      return [];
    }
  }
}