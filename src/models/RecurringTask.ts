/**
 * RecurringTask - Domain model for recurring tasks
 * Following SOLID principles: Extends BaseTask for recurring task behavior
 */

import { BaseTask } from './BaseTask';
import type { TaskCategory, TaskStatus, TaskPriority } from '../types';
import { getWeek, addWeeks, startOfWeek } from 'date-fns';

export interface WeeklyCompletion {
  weekNumber: number;
  status: TaskStatus;
  progressCurrent: number;
  timeSpent: number;
  completedAt?: Date;
}

export class RecurringTask extends BaseTask {
  private _recurrenceWeeks: number;
  private _originalWeekNumber: number;
  private _weeklyCompletions: Map<number, WeeklyCompletion>;
  private _alternativeTaskId?: string;

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
    recurrenceWeeks: number;
    originalWeekNumber?: number;
    weeklyCompletions?: WeeklyCompletion[];
    alternativeTaskId?: string;
  }) {
    // Force category to be weekly_recurring
    super({
      ...data,
      category: 'weekly_recurring',
    });
    
    this._recurrenceWeeks = data.recurrenceWeeks;
    this._originalWeekNumber = data.originalWeekNumber || data.weekNumber;
    this._alternativeTaskId = data.alternativeTaskId;
    
    // Initialize weekly completions map
    this._weeklyCompletions = new Map();
    if (data.weeklyCompletions) {
      for (const completion of data.weeklyCompletions) {
        this._weeklyCompletions.set(completion.weekNumber, completion);
      }
    }
    
    this.validateRecurrence();
  }

  getType(): 'recurring' {
    return 'recurring';
  }

  /**
   * Recurring tasks can always be completed for the current week
   */
  canBeCompleted(): boolean {
    const currentWeek = getWeek(new Date());
    return this.isActiveInWeek(currentWeek);
  }

  /**
   * Clone the recurring task
   */
  clone(): RecurringTask {
    return new RecurringTask({
      id: `${this._id}_clone_${Date.now()}`,
      title: `Copy of ${this._title}`,
      description: this._description,
      category: 'weekly_recurring',
      status: 'todo',
      priority: this._priority,
      weekNumber: this._weekNumber,
      progressCurrent: 0,
      progressTotal: this._progressTotal,
      estimatedDuration: this._estimatedDuration,
      timeSpent: 0,
      dueDate: undefined, // Recurring tasks typically don't have due dates
      userId: this._userId,
      recurrenceWeeks: this._recurrenceWeeks,
      originalWeekNumber: getWeek(new Date()),
      weeklyCompletions: [],
    });
  }

  // Recurring task specific methods

  /**
   * Check if task is active in a specific week
   */
  isActiveInWeek(weekNumber: number): boolean {
    const endWeek = this._originalWeekNumber + this._recurrenceWeeks - 1;
    return weekNumber >= this._originalWeekNumber && weekNumber <= endWeek;
  }

  /**
   * Get status for a specific week
   */
  getWeekStatus(weekNumber: number): TaskStatus {
    if (!this.isActiveInWeek(weekNumber)) {
      return 'todo';
    }
    
    const completion = this._weeklyCompletions.get(weekNumber);
    return completion?.status || 'todo';
  }

  /**
   * Update status for a specific week
   */
  updateWeekStatus(weekNumber: number, status: TaskStatus, timeSpent?: number): void {
    if (!this.isActiveInWeek(weekNumber)) {
      throw new Error(`Task is not active in week ${weekNumber}`);
    }
    
    const existingCompletion = this._weeklyCompletions.get(weekNumber);
    
    const completion: WeeklyCompletion = {
      weekNumber,
      status,
      progressCurrent: status === 'done' ? (this._progressTotal || 1) : (existingCompletion?.progressCurrent || 0),
      timeSpent: timeSpent || existingCompletion?.timeSpent || 0,
      completedAt: status === 'done' ? new Date() : undefined,
    };
    
    this._weeklyCompletions.set(weekNumber, completion);
    this.markAsUpdated();
  }

  /**
   * Get progress for a specific week
   */
  getWeekProgress(weekNumber: number): { current: number; total: number } {
    const completion = this._weeklyCompletions.get(weekNumber);
    return {
      current: completion?.progressCurrent || 0,
      total: this._progressTotal || 1,
    };
  }

  /**
   * Update progress for a specific week
   */
  updateWeekProgress(weekNumber: number, current: number): void {
    if (!this.isActiveInWeek(weekNumber)) {
      throw new Error(`Task is not active in week ${weekNumber}`);
    }
    
    if (current < 0) {
      throw new Error('Progress cannot be negative');
    }
    
    if (this._progressTotal && current > this._progressTotal) {
      throw new Error('Progress cannot exceed total');
    }
    
    const existingCompletion = this._weeklyCompletions.get(weekNumber);
    const completion: WeeklyCompletion = {
      ...existingCompletion,
      weekNumber,
      status: existingCompletion?.status || 'todo',
      progressCurrent: current,
      timeSpent: existingCompletion?.timeSpent || 0,
    };
    
    // Auto-mark as done if progress is complete
    if (this._progressTotal && current >= this._progressTotal) {
      completion.status = 'done';
      completion.completedAt = new Date();
    }
    
    this._weeklyCompletions.set(weekNumber, completion);
    this.markAsUpdated();
  }

  /**
   * Add time spent for a specific week
   */
  addWeekTimeSpent(weekNumber: number, minutes: number): void {
    if (!this.isActiveInWeek(weekNumber)) {
      throw new Error(`Task is not active in week ${weekNumber}`);
    }
    
    if (minutes < 0) {
      throw new Error('Time spent cannot be negative');
    }
    
    const existingCompletion = this._weeklyCompletions.get(weekNumber);
    const completion: WeeklyCompletion = {
      ...existingCompletion,
      weekNumber,
      status: existingCompletion?.status || 'todo',
      progressCurrent: existingCompletion?.progressCurrent || 0,
      timeSpent: (existingCompletion?.timeSpent || 0) + minutes,
    };
    
    this._weeklyCompletions.set(weekNumber, completion);
    this.markAsUpdated();
  }

  /**
   * Extend recurrence period
   */
  extendRecurrence(additionalWeeks: number): void {
    if (additionalWeeks < 0) {
      throw new Error('Cannot reduce recurrence weeks');
    }
    
    const newTotal = this._recurrenceWeeks + additionalWeeks;
    if (newTotal > 52) {
      throw new Error('Recurrence cannot exceed 52 weeks');
    }
    
    this._recurrenceWeeks = newTotal;
    this.markAsUpdated();
  }

  /**
   * Shorten recurrence period
   */
  shortenRecurrence(weeksToRemove: number): void {
    if (weeksToRemove < 0) {
      throw new Error('Weeks to remove must be positive');
    }
    
    const newTotal = this._recurrenceWeeks - weeksToRemove;
    if (newTotal < 1) {
      throw new Error('Recurrence must be at least 1 week');
    }
    
    // Check if we're removing weeks with completions
    const endWeek = this._originalWeekNumber + newTotal;
    const removedCompletions: number[] = [];
    
    for (const [week] of this._weeklyCompletions) {
      if (week >= endWeek) {
        removedCompletions.push(week);
      }
    }
    
    if (removedCompletions.length > 0) {
      console.warn(`Removing ${removedCompletions.length} week completions`);
      for (const week of removedCompletions) {
        this._weeklyCompletions.delete(week);
      }
    }
    
    this._recurrenceWeeks = newTotal;
    this.markAsUpdated();
  }

  /**
   * Get completion statistics
   */
  getCompletionStats(): {
    totalWeeks: number;
    completedWeeks: number;
    completionRate: number;
    currentStreak: number;
    bestStreak: number;
    averageTimeSpent: number;
  } {
    const completedWeeks = Array.from(this._weeklyCompletions.values())
      .filter(c => c.status === 'done').length;
    
    const completionRate = this._recurrenceWeeks > 0
      ? Math.round((completedWeeks / this._recurrenceWeeks) * 100)
      : 0;
    
    const totalTimeSpent = Array.from(this._weeklyCompletions.values())
      .reduce((sum, c) => sum + c.timeSpent, 0);
    
    const averageTimeSpent = completedWeeks > 0
      ? Math.round(totalTimeSpent / completedWeeks)
      : 0;
    
    const { currentStreak, bestStreak } = this.calculateStreaks();
    
    return {
      totalWeeks: this._recurrenceWeeks,
      completedWeeks,
      completionRate,
      currentStreak,
      bestStreak,
      averageTimeSpent,
    };
  }

  /**
   * Set alternative task for a specific week
   */
  setAlternativeTask(taskId: string): void {
    this._alternativeTaskId = taskId;
    this.markAsUpdated();
  }

  /**
   * Get alternative task ID
   */
  getAlternativeTaskId(): string | undefined {
    return this._alternativeTaskId;
  }

  /**
   * Convert to regular task for a specific week
   */
  convertToRegularForWeek(weekNumber: number): Record<string, unknown> {
    if (!this.isActiveInWeek(weekNumber)) {
      throw new Error(`Task is not active in week ${weekNumber}`);
    }
    
    const weekCompletion = this._weeklyCompletions.get(weekNumber);
    
    return {
      id: `${this._id}_week_${weekNumber}_${Date.now()}`,
      title: this._title,
      description: this._description,
      category: 'life_admin', // Default to life_admin
      status: weekCompletion?.status || 'todo',
      priority: this._priority,
      weekNumber,
      progressCurrent: weekCompletion?.progressCurrent || 0,
      progressTotal: this._progressTotal,
      estimatedDuration: this._estimatedDuration,
      timeSpent: weekCompletion?.timeSpent || 0,
      newUserId: this._userId,
      isRecurring: false,
    };
  }

  /**
   * Get next occurrence date
   */
  getNextOccurrence(): Date | null {
    const currentWeek = getWeek(new Date());
    const endWeek = this._originalWeekNumber + this._recurrenceWeeks - 1;
    
    if (currentWeek > endWeek) {
      return null; // Task has ended
    }
    
    // Find next incomplete week
    for (let week = Math.max(currentWeek, this._originalWeekNumber); week <= endWeek; week++) {
      const status = this.getWeekStatus(week);
      if (status !== 'done') {
        const weeksFromNow = week - currentWeek;
        return startOfWeek(addWeeks(new Date(), weeksFromNow));
      }
    }
    
    return null; // All weeks completed
  }

  /**
   * Export to plain object with recurring task specific fields
   */
  toObject(): Record<string, unknown> {
    const weeklyCompletions = Array.from(this._weeklyCompletions.values());
    
    return {
      ...super.toObject(),
      isRecurring: true,
      recurrenceWeeks: this._recurrenceWeeks,
      originalWeekNumber: this._originalWeekNumber,
      weeklyCompletions,
      alternativeTaskId: this._alternativeTaskId,
    };
  }

  // Private methods

  private validateRecurrence(): void {
    if (this._recurrenceWeeks < 1) {
      throw new Error('Recurrence must be at least 1 week');
    }
    
    if (this._recurrenceWeeks > 52) {
      throw new Error('Recurrence cannot exceed 52 weeks');
    }
    
    if (this._originalWeekNumber < 1 || this._originalWeekNumber > 53) {
      throw new Error('Invalid original week number');
    }
  }

  private calculateStreaks(): { currentStreak: number; bestStreak: number } {
    const sortedWeeks = Array.from(this._weeklyCompletions.entries())
      .sort((a, b) => a[0] - b[0]);
    
    if (sortedWeeks.length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastWeek = -1;
    
    for (const [week, completion] of sortedWeeks) {
      if (completion.status === 'done') {
        if (lastWeek === -1 || week === lastWeek + 1) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
        lastWeek = week;
      } else {
        tempStreak = 0;
        lastWeek = -1;
      }
    }
    
    // Check if current streak extends to current week
    const currentWeek = getWeek(new Date());
    const lastCompletion = sortedWeeks[sortedWeeks.length - 1];
    
    if (lastCompletion && 
        lastCompletion[1].status === 'done' && 
        lastCompletion[0] >= currentWeek - 1) {
      currentStreak = tempStreak;
    }
    
    return { currentStreak, bestStreak };
  }
}