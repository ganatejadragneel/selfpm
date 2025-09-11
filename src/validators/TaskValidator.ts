/**
 * TaskValidator - Validation logic for task operations
 * Following SOLID principles: Single responsibility for task validation
 */

import type { Task, TaskCategory, TaskStatus, TaskPriority } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class TaskValidator {
  private static readonly MIN_TITLE_LENGTH = 1;
  private static readonly MAX_TITLE_LENGTH = 200;
  private static readonly MAX_DESCRIPTION_LENGTH = 2000;
  private static readonly MIN_DURATION = 1;
  private static readonly MAX_DURATION = 480; // 8 hours
  private static readonly MAX_RECURRENCE_WEEKS = 52;
  private static readonly VALID_CATEGORIES: TaskCategory[] = [
    'life_admin',
    'work',
    'weekly_recurring',
  ];
  private static readonly VALID_PRIORITIES: TaskPriority[] = [
    'urgent',
    'high',
    'medium',
    'low',
  ];

  /**
   * Validate task creation data
   */
  static validateCreate(data: Partial<Task>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED_FIELD',
      });
    } else {
      const titleValidation = this.validateTitle(data.title);
      errors.push(...titleValidation.errors);
      warnings.push(...titleValidation.warnings);
    }

    if (!data.category) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        code: 'REQUIRED_FIELD',
      });
    } else {
      const categoryValidation = this.validateCategory(data.category);
      errors.push(...categoryValidation.errors);
    }

    // Optional fields
    if (data.description !== undefined) {
      const descValidation = this.validateDescription(data.description);
      errors.push(...descValidation.errors);
      warnings.push(...descValidation.warnings);
    }

    if (data.priority !== undefined) {
      const priorityValidation = this.validatePriority(data.priority);
      errors.push(...priorityValidation.errors);
    }

    if (data.estimatedDuration !== undefined) {
      const durationValidation = this.validateDuration(data.estimatedDuration);
      errors.push(...durationValidation.errors);
      warnings.push(...durationValidation.warnings);
    }

    if (data.progressCurrent !== undefined || data.progressTotal !== undefined) {
      const progressValidation = this.validateProgress(
        data.progressCurrent,
        data.progressTotal
      );
      errors.push(...progressValidation.errors);
    }

    if (data.dueDate !== undefined) {
      const dueDateValidation = this.validateDueDate(data.dueDate);
      errors.push(...dueDateValidation.errors);
      warnings.push(...dueDateValidation.warnings);
    }

    // Recurring task specific validation
    if (data.category === 'weekly_recurring' || data.isRecurring) {
      const recurringValidation = this.validateRecurringTask(data);
      errors.push(...recurringValidation.errors);
      warnings.push(...recurringValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate task update data
   */
  static validateUpdate(
    existingTask: Task,
    updates: Partial<Task>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validate individual field updates
    if (updates.title !== undefined) {
      const titleValidation = this.validateTitle(updates.title);
      errors.push(...titleValidation.errors);
      warnings.push(...titleValidation.warnings);
    }

    if (updates.description !== undefined) {
      const descValidation = this.validateDescription(updates.description);
      errors.push(...descValidation.errors);
      warnings.push(...descValidation.warnings);
    }

    if (updates.status !== undefined) {
      const statusValidation = this.validateStatusTransition(
        existingTask.status,
        updates.status
      );
      errors.push(...statusValidation.errors);
      warnings.push(...statusValidation.warnings);
    }

    if (updates.priority !== undefined) {
      const priorityValidation = this.validatePriority(updates.priority);
      errors.push(...priorityValidation.errors);
    }

    if (updates.progressCurrent !== undefined || updates.progressTotal !== undefined) {
      const currentProgress = updates.progressCurrent ?? existingTask.progressCurrent;
      const totalProgress = updates.progressTotal ?? existingTask.progressTotal;
      const progressValidation = this.validateProgress(currentProgress, totalProgress);
      errors.push(...progressValidation.errors);
    }

    // Validate category change restrictions
    if (updates.category !== undefined && updates.category !== existingTask.category) {
      const categoryChangeValidation = this.validateCategoryChange(
        existingTask,
        updates.category
      );
      errors.push(...categoryChangeValidation.errors);
      warnings.push(...categoryChangeValidation.warnings);
    }

    // Validate week number change
    if (updates.weekNumber !== undefined) {
      const weekValidation = this.validateWeekNumber(updates.weekNumber);
      errors.push(...weekValidation.errors);
      warnings.push(...weekValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate batch operations
   */
  static validateBatch(
    tasks: Task[],
    operation: 'update' | 'delete' | 'move'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (tasks.length === 0) {
      errors.push({
        field: 'tasks',
        message: 'No tasks selected for batch operation',
        code: 'EMPTY_BATCH',
      });
    }

    if (tasks.length > 100) {
      warnings.push('Large batch operation may take some time');
    }

    // Check for mixed recurring/regular tasks in certain operations
    if (operation === 'move') {
      const hasRecurring = tasks.some(t => t.isRecurring);
      const hasRegular = tasks.some(t => !t.isRecurring);
      
      if (hasRecurring && hasRegular) {
        warnings.push('Batch contains both recurring and regular tasks');
      }
    }

    // Check for completed tasks in delete operation
    if (operation === 'delete') {
      const completedCount = tasks.filter(t => t.status === 'done').length;
      if (completedCount > 0) {
        warnings.push(`${completedCount} completed task(s) will be deleted`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Private validation methods

  private static validateTitle(title: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const trimmedTitle = title.trim();

    if (trimmedTitle.length < this.MIN_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must be at least ${this.MIN_TITLE_LENGTH} character`,
        code: 'MIN_LENGTH',
      });
    }

    if (trimmedTitle.length > this.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title must not exceed ${this.MAX_TITLE_LENGTH} characters`,
        code: 'MAX_LENGTH',
      });
    }

    // Check for special characters that might cause issues
    if (/[<>]/.test(trimmedTitle)) {
      warnings.push('Title contains special characters that may not display correctly');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateDescription(description: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (description.length > this.MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must not exceed ${this.MAX_DESCRIPTION_LENGTH} characters`,
        code: 'MAX_LENGTH',
      });
    }

    // Check for potential XSS attempts
    if (/<script|javascript:/i.test(description)) {
      errors.push({
        field: 'description',
        message: 'Description contains potentially unsafe content',
        code: 'UNSAFE_CONTENT',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateCategory(category: TaskCategory): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.VALID_CATEGORIES.includes(category)) {
      errors.push({
        field: 'category',
        message: `Invalid category. Must be one of: ${this.VALID_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY',
      });
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private static validatePriority(priority: TaskPriority): ValidationResult {
    const errors: ValidationError[] = [];

    if (!this.VALID_PRIORITIES.includes(priority)) {
      errors.push({
        field: 'priority',
        message: `Invalid priority. Must be one of: ${this.VALID_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY',
      });
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private static validateDuration(duration: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (duration < this.MIN_DURATION) {
      errors.push({
        field: 'estimatedDuration',
        message: `Duration must be at least ${this.MIN_DURATION} minute`,
        code: 'MIN_DURATION',
      });
    }

    if (duration > this.MAX_DURATION) {
      errors.push({
        field: 'estimatedDuration',
        message: `Duration must not exceed ${this.MAX_DURATION} minutes`,
        code: 'MAX_DURATION',
      });
    }

    if (duration > 240) {
      warnings.push('Consider breaking down tasks longer than 4 hours');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateProgress(
    current?: number,
    total?: number
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (current !== undefined && current < 0) {
      errors.push({
        field: 'progressCurrent',
        message: 'Current progress cannot be negative',
        code: 'NEGATIVE_VALUE',
      });
    }

    if (total !== undefined && total < 0) {
      errors.push({
        field: 'progressTotal',
        message: 'Total progress cannot be negative',
        code: 'NEGATIVE_VALUE',
      });
    }

    if (
      current !== undefined &&
      total !== undefined &&
      current > total
    ) {
      errors.push({
        field: 'progressCurrent',
        message: 'Current progress cannot exceed total progress',
        code: 'EXCEEDS_TOTAL',
      });
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private static validateDueDate(dueDate: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!(dueDate instanceof Date) && typeof dueDate !== 'string') {
      errors.push({
        field: 'dueDate',
        message: 'Due date must be a valid date',
        code: 'INVALID_DATE',
      });
      return { isValid: false, errors, warnings };
    }

    const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
    
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'dueDate',
        message: 'Invalid date format',
        code: 'INVALID_DATE',
      });
    } else {
      const now = new Date();
      const daysDiff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0) {
        warnings.push('Due date is in the past');
      } else if (daysDiff === 0) {
        warnings.push('Task is due today');
      } else if (daysDiff === 1) {
        warnings.push('Task is due tomorrow');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      'todo': ['in_progress', 'blocked', 'done'],
      'in_progress': ['todo', 'blocked', 'done'],
      'blocked': ['todo', 'in_progress'],
      'done': ['todo', 'in_progress'],
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      errors.push({
        field: 'status',
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
        code: 'INVALID_TRANSITION',
      });
    }

    // Warnings for unusual transitions
    if (currentStatus === 'done' && newStatus !== 'done') {
      warnings.push('Reopening a completed task');
    }

    if (newStatus === 'blocked') {
      warnings.push('Task will be marked as blocked');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateRecurringTask(data: Partial<Task>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!data.recurrenceWeeks) {
      errors.push({
        field: 'recurrenceWeeks',
        message: 'Recurrence weeks is required for recurring tasks',
        code: 'REQUIRED_FIELD',
      });
    } else if (data.recurrenceWeeks < 1) {
      errors.push({
        field: 'recurrenceWeeks',
        message: 'Recurrence must be at least 1 week',
        code: 'MIN_VALUE',
      });
    } else if (data.recurrenceWeeks > this.MAX_RECURRENCE_WEEKS) {
      errors.push({
        field: 'recurrenceWeeks',
        message: `Recurrence cannot exceed ${this.MAX_RECURRENCE_WEEKS} weeks`,
        code: 'MAX_VALUE',
      });
    }

    if (data.recurrenceWeeks && data.recurrenceWeeks > 12) {
      warnings.push('Long recurrence period - consider shorter intervals');
    }

    if (data.dueDate) {
      warnings.push('Due dates are typically not used with recurring tasks');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateCategoryChange(
    task: Task,
    newCategory: TaskCategory
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Prevent changing from/to weekly_recurring
    if (task.category === 'weekly_recurring' && newCategory !== 'weekly_recurring') {
      errors.push({
        field: 'category',
        message: 'Cannot change category of recurring tasks',
        code: 'INVALID_CATEGORY_CHANGE',
      });
    }

    if (task.category !== 'weekly_recurring' && newCategory === 'weekly_recurring') {
      errors.push({
        field: 'category',
        message: 'Cannot convert regular task to recurring through category change',
        code: 'INVALID_CATEGORY_CHANGE',
      });
    }

    // Warn about changing category of completed tasks
    if (task.status === 'done') {
      warnings.push('Changing category of completed task');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static validateWeekNumber(weekNumber: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    if (!Number.isInteger(weekNumber)) {
      errors.push({
        field: 'weekNumber',
        message: 'Week number must be an integer',
        code: 'INVALID_TYPE',
      });
    } else if (weekNumber < 1 || weekNumber > 53) {
      errors.push({
        field: 'weekNumber',
        message: 'Week number must be between 1 and 53',
        code: 'OUT_OF_RANGE',
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate task dependencies
   */
  static validateDependencies(
    taskId: string,
    dependencyIds: string[],
    allTasks: Task[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check for self-dependency
    if (dependencyIds.includes(taskId)) {
      errors.push({
        field: 'dependencies',
        message: 'Task cannot depend on itself',
        code: 'SELF_DEPENDENCY',
      });
    }

    // Check for non-existent dependencies
    const taskIds = new Set(allTasks.map(t => t.id));
    for (const depId of dependencyIds) {
      if (!taskIds.has(depId)) {
        errors.push({
          field: 'dependencies',
          message: `Dependency task ${depId} does not exist`,
          code: 'INVALID_DEPENDENCY',
        });
      }
    }

    // Check for circular dependencies (simplified check)
    if (dependencyIds.length > 10) {
      warnings.push('Complex dependency chain - consider simplifying');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}