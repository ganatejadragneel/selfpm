/**
 * RegularTask - Domain model for regular (non-recurring) tasks
 * Following SOLID principles: Extends BaseTask for regular task behavior
 */

import { BaseTask } from './BaseTask';
import type { TaskCategory, TaskStatus, TaskPriority } from '../types';

export class RegularTask extends BaseTask {
  private _tags: string[];
  private _attachments: string[];
  private _dependencies: string[];

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
    tags?: string[];
    attachments?: string[];
    dependencies?: string[];
  }) {
    super(data);
    this._tags = data.tags || [];
    this._attachments = data.attachments || [];
    this._dependencies = data.dependencies || [];
  }

  getType(): 'regular' {
    return 'regular';
  }

  /**
   * Check if task can be completed (no incomplete dependencies)
   */
  canBeCompleted(): boolean {
    // In a real implementation, this would check dependency statuses
    // For now, return true if not blocked
    return this._status !== 'blocked';
  }

  /**
   * Clone the task
   */
  clone(): RegularTask {
    return new RegularTask({
      id: `${this._id}_clone_${Date.now()}`,
      title: `Copy of ${this._title}`,
      description: this._description,
      category: this._category,
      status: 'todo',
      priority: this._priority,
      weekNumber: this._weekNumber,
      progressCurrent: 0,
      progressTotal: this._progressTotal,
      estimatedDuration: this._estimatedDuration,
      timeSpent: 0,
      dueDate: this._dueDate,
      userId: this._userId,
      tags: [...this._tags],
      attachments: [], // Don't copy attachments
      dependencies: [], // Don't copy dependencies
    });
  }

  // Regular task specific methods

  /**
   * Add a tag to the task
   */
  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) {
      throw new Error('Tag cannot be empty');
    }
    
    if (!this._tags.includes(normalizedTag)) {
      this._tags.push(normalizedTag);
      this.markAsUpdated();
    }
  }

  /**
   * Remove a tag from the task
   */
  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this._tags.indexOf(normalizedTag);
    
    if (index !== -1) {
      this._tags.splice(index, 1);
      this.markAsUpdated();
    }
  }

  /**
   * Check if task has a specific tag
   */
  hasTag(tag: string): boolean {
    const normalizedTag = tag.trim().toLowerCase();
    return this._tags.includes(normalizedTag);
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    return [...this._tags];
  }

  /**
   * Add an attachment
   */
  addAttachment(url: string): void {
    if (!url?.trim()) {
      throw new Error('Attachment URL cannot be empty');
    }
    
    if (!this._attachments.includes(url)) {
      this._attachments.push(url);
      this.markAsUpdated();
    }
  }

  /**
   * Remove an attachment
   */
  removeAttachment(url: string): void {
    const index = this._attachments.indexOf(url);
    
    if (index !== -1) {
      this._attachments.splice(index, 1);
      this.markAsUpdated();
    }
  }

  /**
   * Get all attachments
   */
  getAttachments(): string[] {
    return [...this._attachments];
  }

  /**
   * Add a dependency
   */
  addDependency(taskId: string): void {
    if (!taskId?.trim()) {
      throw new Error('Dependency task ID cannot be empty');
    }
    
    if (taskId === this._id) {
      throw new Error('Task cannot depend on itself');
    }
    
    if (!this._dependencies.includes(taskId)) {
      this._dependencies.push(taskId);
      this.markAsUpdated();
    }
  }

  /**
   * Remove a dependency
   */
  removeDependency(taskId: string): void {
    const index = this._dependencies.indexOf(taskId);
    
    if (index !== -1) {
      this._dependencies.splice(index, 1);
      this.markAsUpdated();
    }
  }

  /**
   * Get all dependencies
   */
  getDependencies(): string[] {
    return [...this._dependencies];
  }

  /**
   * Check if task has dependencies
   */
  hasDependencies(): boolean {
    return this._dependencies.length > 0;
  }

  /**
   * Convert to recurring task
   */
  convertToRecurring(recurrenceWeeks: number): Record<string, unknown> {
    return {
      ...this.toObject(),
      isRecurring: true,
      recurrenceWeeks,
      originalWeekNumber: this._weekNumber,
      category: 'weekly_recurring',
    };
  }

  /**
   * Split task into subtasks
   */
  split(subtaskTitles: string[]): RegularTask[] {
    if (subtaskTitles.length < 2) {
      throw new Error('Need at least 2 subtask titles to split');
    }
    
    const subtasks: RegularTask[] = [];
    const progressPerSubtask = this._progressTotal 
      ? Math.floor(this._progressTotal / subtaskTitles.length)
      : undefined;
    const durationPerSubtask = Math.floor(this._estimatedDuration / subtaskTitles.length);
    
    for (let i = 0; i < subtaskTitles.length; i++) {
      const subtask = new RegularTask({
        id: `${this._id}_sub_${i}_${Date.now()}`,
        title: subtaskTitles[i],
        description: `Subtask ${i + 1} of: ${this._title}`,
        category: this._category,
        status: 'todo',
        priority: this._priority,
        weekNumber: this._weekNumber,
        progressCurrent: 0,
        progressTotal: progressPerSubtask,
        estimatedDuration: durationPerSubtask,
        timeSpent: 0,
        dueDate: this._dueDate,
        userId: this._userId,
        tags: [...this._tags],
        dependencies: i > 0 ? [subtasks[i - 1].id] : this._dependencies,
      });
      
      subtasks.push(subtask);
    }
    
    return subtasks;
  }

  /**
   * Merge with another task
   */
  mergeWith(otherTask: RegularTask): void {
    // Combine descriptions
    if (otherTask.description) {
      this._description = this._description 
        ? `${this._description}\n\n${otherTask.description}`
        : otherTask.description;
    }
    
    // Combine progress
    if (this._progressTotal && otherTask.progressTotal) {
      this._progressTotal += otherTask.progressTotal;
      this._progressCurrent += otherTask.progressCurrent;
    }
    
    // Combine time estimates
    this._estimatedDuration += otherTask.estimatedDuration;
    this._timeSpent += otherTask.timeSpent;
    
    // Merge tags
    for (const tag of otherTask.getTags()) {
      this.addTag(tag);
    }
    
    // Merge attachments
    for (const attachment of otherTask.getAttachments()) {
      this.addAttachment(attachment);
    }
    
    // Take the higher priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[otherTask.priority] < priorityOrder[this._priority]) {
      this._priority = otherTask.priority;
    }
    
    // Take the earlier due date
    if (otherTask.dueDate && (!this._dueDate || otherTask.dueDate < this._dueDate)) {
      this._dueDate = otherTask.dueDate;
    }
    
    this.markAsUpdated();
  }

  /**
   * Export to plain object with regular task specific fields
   */
  toObject(): Record<string, unknown> {
    return {
      ...super.toObject(),
      tags: this._tags,
      attachments: this._attachments,
      dependencies: this._dependencies,
      isRecurring: false,
    };
  }
}