/**
 * BaseTask - Domain model for task entity
 * Following SOLID principles: Base class for all task types
 */

import type { TaskCategory, TaskStatus, TaskPriority } from '../types';

export abstract class BaseTask {
  protected _id: string;
  protected _title: string;
  protected _description?: string;
  protected _category: TaskCategory;
  protected _status: TaskStatus;
  protected _priority: TaskPriority;
  protected _weekNumber: number;
  protected _progressCurrent: number;
  protected _progressTotal?: number;
  protected _estimatedDuration: number;
  protected _timeSpent: number;
  protected _dueDate?: Date;
  protected _userId: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(data: {
    id: string;
    title: string;
    description?: string;
    category: TaskCategory;
    status: TaskStatus;
    priority: TaskPriority;
    weekNumber: number;
    progressCurrent?: number;
    progressTotal?: number;
    estimatedDuration?: number;
    timeSpent?: number;
    dueDate?: Date;
    userId: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = data.id;
    this._title = data.title;
    this._description = data.description;
    this._category = data.category;
    this._status = data.status;
    this._priority = data.priority;
    this._weekNumber = data.weekNumber;
    this._progressCurrent = data.progressCurrent || 0;
    this._progressTotal = data.progressTotal;
    this._estimatedDuration = data.estimatedDuration || 5;
    this._timeSpent = data.timeSpent || 0;
    this._dueDate = data.dueDate;
    this._userId = data.userId;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();

    this.validate();
  }

  // Abstract methods for subclasses to implement
  abstract getType(): 'regular' | 'recurring';
  abstract canBeCompleted(): boolean;
  abstract clone(): BaseTask;

  // Getters
  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get description(): string | undefined { return this._description; }
  get category(): TaskCategory { return this._category; }
  get status(): TaskStatus { return this._status; }
  get priority(): TaskPriority { return this._priority; }
  get weekNumber(): number { return this._weekNumber; }
  get progressCurrent(): number { return this._progressCurrent; }
  get progressTotal(): number | undefined { return this._progressTotal; }
  get estimatedDuration(): number { return this._estimatedDuration; }
  get timeSpent(): number { return this._timeSpent; }
  get dueDate(): Date | undefined { return this._dueDate; }
  get userId(): string { return this._userId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Business logic methods

  /**
   * Update task title
   */
  updateTitle(title: string): void {
    if (!title?.trim()) {
      throw new Error('Title cannot be empty');
    }
    this._title = title.trim();
    this.markAsUpdated();
  }

  /**
   * Update task description
   */
  updateDescription(description: string): void {
    this._description = description.trim();
    this.markAsUpdated();
  }

  /**
   * Update task priority
   */
  updatePriority(priority: TaskPriority): void {
    this._priority = priority;
    this.markAsUpdated();
  }

  /**
   * Update task status with validation
   */
  updateStatus(status: TaskStatus): void {
    this.validateStatusTransition(status);
    this._status = status;
    
    // Auto-update progress when marked as done
    if (status === 'done' && this._progressTotal) {
      this._progressCurrent = this._progressTotal;
    }
    
    this.markAsUpdated();
  }

  /**
   * Update progress
   */
  updateProgress(current: number, total?: number): void {
    if (current < 0) {
      throw new Error('Progress cannot be negative');
    }
    
    if (total !== undefined) {
      if (total < 0) {
        throw new Error('Total progress cannot be negative');
      }
      if (current > total) {
        throw new Error('Current progress cannot exceed total');
      }
      this._progressTotal = total;
    } else if (this._progressTotal && current > this._progressTotal) {
      throw new Error('Current progress cannot exceed total');
    }
    
    this._progressCurrent = current;
    
    // Auto-mark as done if progress is complete
    if (this._progressTotal && current >= this._progressTotal) {
      this._status = 'done';
    }
    
    this.markAsUpdated();
  }

  /**
   * Add time spent on task
   */
  addTimeSpent(minutes: number): void {
    if (minutes < 0) {
      throw new Error('Time spent cannot be negative');
    }
    this._timeSpent += minutes;
    this.markAsUpdated();
  }

  /**
   * Set due date
   */
  setDueDate(date: Date | undefined): void {
    if (date && date < new Date()) {
      console.warn('Setting due date in the past');
    }
    this._dueDate = date;
    this.markAsUpdated();
  }

  /**
   * Move task to different week
   */
  moveToWeek(weekNumber: number): void {
    if (weekNumber < 1 || weekNumber > 53) {
      throw new Error('Invalid week number');
    }
    this._weekNumber = weekNumber;
    this.markAsUpdated();
  }

  /**
   * Check if task is overdue
   */
  isOverdue(): boolean {
    if (!this._dueDate || this._status === 'done') {
      return false;
    }
    return this._dueDate < new Date();
  }

  /**
   * Check if task is blocked
   */
  isBlocked(): boolean {
    return this._status === 'blocked';
  }

  /**
   * Check if task is complete
   */
  isComplete(): boolean {
    return this._status === 'done';
  }

  /**
   * Check if task is in progress
   */
  isInProgress(): boolean {
    return this._status === 'in_progress';
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    if (!this._progressTotal || this._progressTotal === 0) {
      return this._status === 'done' ? 100 : 0;
    }
    return Math.round((this._progressCurrent / this._progressTotal) * 100);
  }

  /**
   * Calculate efficiency (actual vs estimated time)
   */
  getEfficiency(): number {
    if (this._timeSpent === 0 || this._estimatedDuration === 0) {
      return 100;
    }
    
    const expectedProgress = (this._timeSpent / this._estimatedDuration) * (this._progressTotal || 1);
    const actualProgress = this._progressCurrent;
    
    if (expectedProgress === 0) {
      return 100;
    }
    
    return Math.round((actualProgress / expectedProgress) * 100);
  }

  /**
   * Get remaining work
   */
  getRemainingWork(): number {
    if (!this._progressTotal) {
      return this._status === 'done' ? 0 : 1;
    }
    return Math.max(0, this._progressTotal - this._progressCurrent);
  }

  /**
   * Get remaining time estimate
   */
  getRemainingTimeEstimate(): number {
    const remainingWork = this.getRemainingWork();
    if (remainingWork === 0) {
      return 0;
    }
    
    // Use velocity if available
    if (this._progressCurrent > 0 && this._timeSpent > 0) {
      const velocity = this._progressCurrent / this._timeSpent;
      return Math.round(remainingWork / velocity);
    }
    
    // Fall back to estimated duration
    const progressRatio = this._progressTotal 
      ? remainingWork / this._progressTotal 
      : 1;
    return Math.round(this._estimatedDuration * progressRatio);
  }

  /**
   * Export to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      category: this._category,
      status: this._status,
      priority: this._priority,
      weekNumber: this._weekNumber,
      progressCurrent: this._progressCurrent,
      progressTotal: this._progressTotal,
      estimatedDuration: this._estimatedDuration,
      timeSpent: this._timeSpent,
      dueDate: this._dueDate,
      newUserId: this._userId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  // Protected methods

  protected validate(): void {
    if (!this._title?.trim()) {
      throw new Error('Task title is required');
    }
    
    if (!this._category) {
      throw new Error('Task category is required');
    }
    
    if (!this._userId) {
      throw new Error('User ID is required');
    }
    
    if (this._progressCurrent < 0) {
      throw new Error('Progress cannot be negative');
    }
    
    if (this._progressTotal !== undefined && this._progressTotal < 0) {
      throw new Error('Total progress cannot be negative');
    }
    
    if (this._progressTotal !== undefined && this._progressCurrent > this._progressTotal) {
      throw new Error('Current progress cannot exceed total');
    }
    
    if (this._estimatedDuration < 0) {
      throw new Error('Estimated duration cannot be negative');
    }
    
    if (this._timeSpent < 0) {
      throw new Error('Time spent cannot be negative');
    }
  }

  protected validateStatusTransition(newStatus: TaskStatus): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      'todo': ['in_progress', 'blocked', 'done'],
      'in_progress': ['todo', 'blocked', 'done'],
      'blocked': ['todo', 'in_progress'],
      'done': ['todo', 'in_progress'], // Allow reopening
    };
    
    const allowedTransitions = validTransitions[this._status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Cannot transition from ${this._status} to ${newStatus}`);
    }
  }

  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }
}