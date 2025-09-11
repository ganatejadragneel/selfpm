/**
 * TaskService - Business logic for task operations
 * Following SOLID principles: Single responsibility for task business logic
 */

import { TaskRepository } from '../repositories/TaskRepository';
import type { Task, TaskCategory, TaskStatus, TaskPriority } from '../types';
import { getWeek } from 'date-fns';

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  /**
   * Create a new task with business rules applied
   */
  async createTask(
    userId: string,
    taskData: {
      title: string;
      description?: string;
      category: TaskCategory;
      priority?: TaskPriority;
      dueDate?: Date;
      progressTotal?: number;
      estimatedDuration?: number;
    },
    weekNumber?: number
  ): Promise<Task> {
    // Business rule: Validate required fields
    if (!taskData.title?.trim()) {
      throw new Error('Task title is required');
    }

    if (!taskData.category) {
      throw new Error('Task category is required');
    }

    // Business rule: Set defaults
    const currentWeek = weekNumber ?? getWeek(new Date());
    // const currentYear = getYear(new Date()); // Reserved for future use

    // Business rule: Weekly recurring tasks need special handling
    const isWeeklyRecurring = taskData.category === 'weekly_recurring';
    
    const task: Omit<Task, 'id'> = {
      title: taskData.title.trim(),
      description: taskData.description?.trim(),
      category: taskData.category,
      status: 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
      weekNumber: currentWeek,
      progressCurrent: 0,
      progressTotal: taskData.progressTotal,
      estimatedDuration: taskData.estimatedDuration || 5,
      timeSpent: 0,
      isRecurring: isWeeklyRecurring,
      recurrenceWeeks: isWeeklyRecurring ? 1 : undefined,
      originalWeekNumber: isWeeklyRecurring ? currentWeek : undefined,
      newUserId: userId,
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
   * Update task with business validation
   */
  async updateTask(
    taskId: string,
    updates: Partial<Task>,
    _userId: string
  ): Promise<Task> {
    // Business rule: Cannot change task to done if it has incomplete dependencies
    if (updates.status === 'done') {
      const canComplete = await this.canCompleteTask(taskId);
      if (!canComplete) {
        throw new Error('Cannot complete task with incomplete dependencies');
      }
    }

    // Business rule: Validate progress values
    if (updates.progressCurrent !== undefined && updates.progressTotal !== undefined) {
      if (updates.progressCurrent > updates.progressTotal) {
        throw new Error('Current progress cannot exceed total progress');
      }
    }

    const result = await this.taskRepository.update(taskId, updates);
    if (result.error) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Delete task with cascade handling
   */
  async deleteTask(taskId: string, _userId: string): Promise<boolean> {
    // Business rule: Check if task can be deleted (no dependent tasks)
    const hasDependents = await this.taskHasDependents(taskId);
    if (hasDependents) {
      throw new Error('Cannot delete task with dependent tasks');
    }

    const result = await this.taskRepository.delete(taskId);
    if (result.error) {
      throw result.error;
    }

    return result.data!;
  }

  /**
   * Move task to different category with validation
   */
  async moveTaskToCategory(
    taskId: string,
    newCategory: TaskCategory,
    _userId: string
  ): Promise<Task> {
    // Business rule: Cannot move weekly recurring tasks
    const taskResult = await this.taskRepository.findById(taskId);
    if (taskResult.error) {
      throw taskResult.error;
    }

    const task = taskResult.data;
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.category === 'weekly_recurring' && newCategory !== 'weekly_recurring') {
      throw new Error('Cannot move weekly recurring tasks to other categories');
    }

    const result = await this.taskRepository.moveToCategory(taskId, newCategory);
    if (!result) {
      throw new Error('Failed to move task');
    }

    return result;
  }

  /**
   * Get tasks for a specific week with business logic applied
   */
  async getTasksForWeek(
    userId: string,
    weekNumber: number
  ): Promise<Task[]> {
    const tasks = await this.taskRepository.findByWeek(userId, weekNumber);
    
    // Business logic: Sort tasks by priority and status
    return this.sortTasksByPriorityAndStatus(tasks);
  }

  /**
   * Update task status with business rules
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    _userId: string
  ): Promise<Task> {
    // Business rule: Check dependencies before marking as in_progress or done
    if (status === 'in_progress' || status === 'done') {
      const canProceed = await this.canProgressTask(taskId);
      if (!canProceed) {
        throw new Error('Task has incomplete dependencies');
      }
    }

    const result = await this.taskRepository.updateStatus(taskId, status);
    if (!result) {
      throw new Error('Failed to update task status');
    }

    // Business rule: Auto-update progress for completed tasks
    if (status === 'done' && result.progressTotal) {
      await this.taskRepository.update(taskId, {
        progressCurrent: result.progressTotal
      });
    }

    return result;
  }

  /**
   * Rollover incomplete tasks to current week
   */
  async rolloverIncompleteTasks(userId: string): Promise<number> {
    const currentWeek = getWeek(new Date());
    return await this.taskRepository.rolloverTasks(userId, currentWeek);
  }

  /**
   * Get task statistics for dashboard
   */
  async getTaskStatistics(
    userId: string,
    weekNumber?: number
  ): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    completionRate: number;
    averageTimeSpent: number;
  }> {
    const stats = await this.taskRepository.getTaskStats(userId, weekNumber);
    
    // Calculate additional metrics
    const completionRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;

    // TODO: Calculate average time spent from tasks
    const averageTimeSpent = 0;

    return {
      ...stats,
      completionRate,
      averageTimeSpent,
    };
  }

  /**
   * Search tasks with filtering
   */
  async searchTasks(
    userId: string,
    searchTerm: string,
    filters?: {
      category?: TaskCategory;
      status?: TaskStatus;
      priority?: TaskPriority;
    }
  ): Promise<Task[]> {
    let tasks = await this.taskRepository.searchTasks(userId, searchTerm);

    // Apply additional filters
    if (filters?.category) {
      tasks = tasks.filter(t => t.category === filters.category);
    }
    if (filters?.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters?.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }

    return this.sortTasksByPriorityAndStatus(tasks);
  }

  /**
   * Batch update multiple tasks
   */
  async batchUpdateTasks(
    taskIds: string[],
    updates: Partial<Task>,
    _userId: string
  ): Promise<Task[]> {
    // Validate each task before batch update
    for (const taskId of taskIds) {
      if (updates.status === 'done') {
        const canComplete = await this.canCompleteTask(taskId);
        if (!canComplete) {
          throw new Error(`Task ${taskId} has incomplete dependencies`);
        }
      }
    }

    const result = await this.taskRepository.bulkUpdate(
      taskIds.map(id => ({ id, data: updates }))
    );

    if (result.error) {
      throw result.error;
    }

    return result.data || [];
  }

  // Private helper methods

  private async canCompleteTask(_taskId: string): Promise<boolean> {
    // Check if all dependencies are completed
    // This would integrate with DependencyService
    return true; // Simplified for now
  }

  private async canProgressTask(_taskId: string): Promise<boolean> {
    // Check if dependencies allow task to progress
    return true; // Simplified for now
  }

  private async taskHasDependents(_taskId: string): Promise<boolean> {
    // Check if other tasks depend on this one
    return false; // Simplified for now
  }

  private sortTasksByPriorityAndStatus(tasks: Task[]): Task[] {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { blocked: 0, in_progress: 1, todo: 2, done: 3 };

    return tasks.sort((a, b) => {
      // First sort by status
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then by priority
      const aPriority = a.priority || 'medium';
      const bPriority = b.priority || 'medium';
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });
  }

  /**
   * Calculate estimated completion date based on velocity
   */
  calculateEstimatedCompletion(
    task: Task,
    averageVelocity: number
  ): Date | null {
    if (!task.progressTotal || task.status === 'done') {
      return null;
    }

    const remaining = task.progressTotal - (task.progressCurrent || 0);
    if (remaining <= 0 || averageVelocity <= 0) {
      return null;
    }

    const daysToComplete = Math.ceil(remaining / averageVelocity);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);
    
    return completionDate;
  }
}