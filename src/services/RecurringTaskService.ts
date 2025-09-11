/**
 * RecurringTaskService - Business logic for recurring task operations
 * Following SOLID principles: Single responsibility for recurring task logic
 */

import { TaskRepository } from '../repositories/TaskRepository';
import type { Task, RecurringTaskTemplate, WeeklyTaskCompletion } from '../types';
import { getWeek, addWeeks, startOfWeek } from 'date-fns';

export class RecurringTaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  /**
   * Create a weekly recurring task
   */
  async createWeeklyRecurringTask(
    userId: string,
    taskData: {
      title: string;
      description?: string;
      priority?: string;
      recurrenceWeeks: number;
      estimatedDuration?: number;
    },
    startWeek?: number
  ): Promise<Task> {
    // Business rule: Validate recurrence weeks (1-15)
    if (taskData.recurrenceWeeks < 1 || taskData.recurrenceWeeks > 15) {
      throw new Error('Recurrence weeks must be between 1 and 15');
    }

    const currentWeek = startWeek ?? getWeek(new Date());
    
    const task: Omit<Task, 'id'> = {
      title: taskData.title.trim(),
      description: taskData.description?.trim(),
      category: 'weekly_recurring',
      status: 'todo',
      priority: taskData.priority as any || 'medium',
      weekNumber: currentWeek,
      isRecurring: true,
      recurrenceWeeks: taskData.recurrenceWeeks,
      originalWeekNumber: currentWeek,
      progressCurrent: 0,
      progressTotal: undefined,
      estimatedDuration: taskData.estimatedDuration || 5,
      timeSpent: 0,
      newUserId: userId,
      dueDate: undefined,
      recurrencePattern: 'weekly',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
      subtasks: [],
    };

    const result = await this.taskRepository.create(task);
    if (result.error) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Update weekly recurring task status for a specific week
   */
  async updateWeeklyTaskStatus(
    taskId: string,
    weekNumber: number,
    status: string,
    progressCurrent?: number,
    timeSpent?: number
  ): Promise<WeeklyTaskCompletion> {
    // This would interact with a WeeklyTaskCompletionRepository
    // For now, we'll use the task repository pattern
    
    const weeklyCompletion: WeeklyTaskCompletion = {
      id: '', // Will be generated
      taskId,
      userId: '', // Will be set from task
      weekNumber,
      status: status as any,
      progressCurrent: progressCurrent || 0,
      timeSpent: timeSpent || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, this would save to weekly_task_completions table
    return weeklyCompletion;
  }

  /**
   * Get recurring tasks for a specific week range
   */
  async getRecurringTasksForWeekRange(
    userId: string,
    startWeek: number,
    endWeek: number
  ): Promise<Task[]> {
    const tasks = await this.taskRepository.findByCategory(userId, 'weekly_recurring');
    
    // Filter tasks that span the requested week range
    return tasks.filter(task => {
      const taskStartWeek = task.originalWeekNumber || task.weekNumber;
      const taskEndWeek = taskStartWeek + (task.recurrenceWeeks || 1) - 1;
      
      // Check if task overlaps with requested range
      return taskStartWeek <= endWeek && taskEndWeek >= startWeek;
    });
  }

  /**
   * Extend recurring task duration
   */
  async extendRecurringTask(
    taskId: string,
    additionalWeeks: number,
    _userId: string
  ): Promise<Task> {
    const taskResult = await this.taskRepository.findById(taskId);
    if (taskResult.error) {
      throw taskResult.error;
    }

    const task = taskResult.data;
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.category !== 'weekly_recurring') {
      throw new Error('Task is not a weekly recurring task');
    }

    const currentWeeks = task.recurrenceWeeks || 1;
    const newWeeks = currentWeeks + additionalWeeks;

    // Business rule: Maximum 15 weeks
    if (newWeeks > 15) {
      throw new Error('Cannot extend beyond 15 weeks');
    }

    const result = await this.taskRepository.update(taskId, {
      recurrenceWeeks: newWeeks
    });

    if (result.error) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Convert recurring task to regular task
   */
  async convertToRegularTask(
    taskId: string,
    targetWeek: number,
    userId: string
  ): Promise<Task> {
    const taskResult = await this.taskRepository.findById(taskId);
    if (taskResult.error) {
      throw taskResult.error;
    }

    const task = taskResult.data;
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.category !== 'weekly_recurring') {
      throw new Error('Task is not a weekly recurring task');
    }

    // Create a new regular task for the specific week
    const regularTask: Omit<Task, 'id'> = {
      title: task.title,
      description: task.description,
      category: 'life_admin', // Default to life_admin
      status: 'todo',
      priority: task.priority,
      weekNumber: targetWeek,
      isRecurring: false,
      progressCurrent: 0,
      progressTotal: task.progressTotal,
      estimatedDuration: task.estimatedDuration,
      timeSpent: 0,
      newUserId: userId,
      dueDate: task.dueDate,
      recurrencePattern: undefined,
      recurrenceWeeks: undefined,
      originalWeekNumber: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
      subtasks: [],
    };

    const result = await this.taskRepository.create(regularTask);
    if (result.error) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Get completion status for recurring task across weeks
   */
  async getRecurringTaskCompletionHistory(
    _taskId: string,
    _userId: string
  ): Promise<{
    week: number;
    status: string;
    completionDate?: Date;
    timeSpent: number;
  }[]> {
    // This would query the weekly_task_completions table
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Calculate recurring task statistics
   */
  async calculateRecurringTaskStats(
    taskId: string,
    userId: string
  ): Promise<{
    totalWeeks: number;
    completedWeeks: number;
    completionRate: number;
    averageTimeSpent: number;
    currentStreak: number;
    bestStreak: number;
  }> {
    const taskResult = await this.taskRepository.findById(taskId);
    if (taskResult.error || !taskResult.data) {
      throw new Error('Task not found');
    }

    const task = taskResult.data;
    const history = await this.getRecurringTaskCompletionHistory(taskId, userId);
    
    const completedWeeks = history.filter(h => h.status === 'done').length;
    const totalWeeks = task.recurrenceWeeks || 1;
    const completionRate = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;
    
    const totalTimeSpent = history.reduce((sum, h) => sum + h.timeSpent, 0);
    const averageTimeSpent = completedWeeks > 0 ? totalTimeSpent / completedWeeks : 0;
    
    // Calculate streaks
    const { currentStreak, bestStreak } = this.calculateStreaks(history);
    
    return {
      totalWeeks,
      completedWeeks,
      completionRate: Math.round(completionRate),
      averageTimeSpent: Math.round(averageTimeSpent),
      currentStreak,
      bestStreak,
    };
  }

  /**
   * Auto-generate recurring tasks for upcoming weeks
   */
  async generateUpcomingRecurringTasks(
    _userId: string,
    _weeksAhead: number = 2
  ): Promise<Task[]> {
    // const currentWeek = getWeek(new Date());
    // const targetWeek = currentWeek + weeksAhead;
    
    // Get all active recurring templates
    // This would query recurring_task_templates table
    // For now, return empty array
    return [];
  }

  /**
   * Check if recurring task should be visible in current week
   */
  isRecurringTaskVisibleInWeek(task: Task, weekNumber: number): boolean {
    if (task.category !== 'weekly_recurring') {
      return false;
    }

    const taskStartWeek = task.originalWeekNumber || task.weekNumber;
    const taskEndWeek = taskStartWeek + (task.recurrenceWeeks || 1) - 1;
    
    return weekNumber >= taskStartWeek && weekNumber <= taskEndWeek;
  }

  /**
   * Get next occurrence date for recurring task
   */
  getNextOccurrence(task: Task): Date | null {
    if (!task.isRecurring) {
      return null;
    }

    const currentWeek = getWeek(new Date());
    const taskStartWeek = task.originalWeekNumber || task.weekNumber;
    const taskEndWeek = taskStartWeek + (task.recurrenceWeeks || 1) - 1;
    
    if (currentWeek > taskEndWeek) {
      return null; // Task has ended
    }

    const nextWeek = Math.max(currentWeek, taskStartWeek);
    return startOfWeek(addWeeks(new Date(), nextWeek - currentWeek));
  }

  // Private helper methods

  private calculateStreaks(
    history: { week: number; status: string }[]
  ): { currentStreak: number; bestStreak: number } {
    if (history.length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    // Sort by week
    const sorted = history.sort((a, b) => a.week - b.week);
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].status === 'done') {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
        
        // Check if this continues to current week
        if (i === sorted.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
        if (i === sorted.length - 1) {
          currentStreak = 0;
        }
      }
    }
    
    return { currentStreak, bestStreak };
  }

  /**
   * Validate recurring task template
   */
  validateRecurringTemplate(template: Partial<RecurringTaskTemplate>): string[] {
    const errors: string[] = [];
    
    if (!template.title?.trim()) {
      errors.push('Title is required');
    }
    
    if (!template.recurrencePattern) {
      errors.push('Recurrence pattern is required');
    }
    
    if (template.recurrencePattern === 'weekly' && !template.recurrenceDayOfWeek) {
      errors.push('Day of week is required for weekly recurrence');
    }
    
    if (template.recurrencePattern === 'monthly' && !template.recurrenceDayOfMonth) {
      errors.push('Day of month is required for monthly recurrence');
    }
    
    return errors;
  }
}