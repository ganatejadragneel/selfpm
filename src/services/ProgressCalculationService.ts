/**
 * ProgressCalculationService - Business logic for progress tracking and calculations
 * Following SOLID principles: Single responsibility for progress calculations
 */

import { TaskRepository } from '../repositories/TaskRepository';
import type { Task } from '../types';

export interface ProgressMetrics {
  percentage: number;
  timeRemaining: number;
  velocity: number;
  estimatedCompletion: Date | null;
  efficiency: number;
}

export interface WeeklyProgress {
  weekNumber: number;
  tasksCompleted: number;
  totalTasks: number;
  percentComplete: number;
  timeSpent: number;
  averageTaskTime: number;
}

export class ProgressCalculationService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  /**
   * Calculate progress metrics for a single task
   */
  calculateTaskProgress(task: Task): ProgressMetrics {
    const progressTotal = task.progressTotal || 1;
    const progressCurrent = task.progressCurrent || 0;
    const percentage = Math.round((progressCurrent / progressTotal) * 100);

    const estimatedDuration = task.estimatedDuration || 0;
    const timeSpent = task.timeSpent || 0;
    
    // Calculate time remaining based on velocity
    const velocity = progressCurrent > 0 && timeSpent > 0 
      ? progressCurrent / timeSpent 
      : 0;
    
    const remainingProgress = progressTotal - progressCurrent;
    const timeRemaining = velocity > 0 
      ? Math.round(remainingProgress / velocity)
      : estimatedDuration - timeSpent;

    // Calculate efficiency (actual vs estimated)
    const expectedProgress = timeSpent > 0 && estimatedDuration > 0
      ? (timeSpent / estimatedDuration) * progressTotal
      : 0;
    
    const efficiency = expectedProgress > 0 
      ? Math.round((progressCurrent / expectedProgress) * 100)
      : 100;

    // Estimate completion date
    const estimatedCompletion = this.calculateEstimatedCompletion(
      remainingProgress,
      velocity,
      task.dueDate ? new Date(task.dueDate) : null
    );

    return {
      percentage,
      timeRemaining: Math.max(0, timeRemaining),
      velocity,
      estimatedCompletion,
      efficiency,
    };
  }

  /**
   * Calculate aggregate progress for multiple tasks
   */
  calculateAggregateProgress(tasks: Task[]): {
    totalProgress: number;
    totalTimeSpent: number;
    totalEstimatedTime: number;
    averageEfficiency: number;
    tasksAtRisk: number;
  } {
    if (tasks.length === 0) {
      return {
        totalProgress: 0,
        totalTimeSpent: 0,
        totalEstimatedTime: 0,
        averageEfficiency: 100,
        tasksAtRisk: 0,
      };
    }

    let totalCurrent = 0;
    let totalMax = 0;
    let totalTimeSpent = 0;
    let totalEstimatedTime = 0;
    let efficiencySum = 0;
    let tasksAtRisk = 0;

    for (const task of tasks) {
      totalCurrent += task.progressCurrent || 0;
      totalMax += task.progressTotal || 1;
      totalTimeSpent += task.timeSpent || 0;
      totalEstimatedTime += task.estimatedDuration || 0;

      const metrics = this.calculateTaskProgress(task);
      efficiencySum += metrics.efficiency;

      // Check if task is at risk (behind schedule)
      if (this.isTaskAtRisk(task, metrics)) {
        tasksAtRisk++;
      }
    }

    const totalProgress = totalMax > 0 
      ? Math.round((totalCurrent / totalMax) * 100)
      : 0;

    const averageEfficiency = Math.round(efficiencySum / tasks.length);

    return {
      totalProgress,
      totalTimeSpent,
      totalEstimatedTime,
      averageEfficiency,
      tasksAtRisk,
    };
  }

  /**
   * Calculate weekly progress statistics
   */
  async calculateWeeklyProgress(
    userId: string,
    weekNumber: number
  ): Promise<WeeklyProgress> {
    const tasks = await this.taskRepository.findByWeek(userId, weekNumber);
    
    const completedTasks = tasks.filter(t => t.status === 'done');
    const totalTasks = tasks.length;
    const percentComplete = totalTasks > 0 
      ? Math.round((completedTasks.length / totalTasks) * 100)
      : 0;

    const timeSpent = tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const averageTaskTime = completedTasks.length > 0
      ? Math.round(timeSpent / completedTasks.length)
      : 0;

    return {
      weekNumber,
      tasksCompleted: completedTasks.length,
      totalTasks,
      percentComplete,
      timeSpent,
      averageTaskTime,
    };
  }

  /**
   * Calculate velocity (progress per time unit)
   */
  calculateVelocity(
    tasks: Task[],
    timeWindow: number = 7 // days
  ): {
    dailyVelocity: number;
    weeklyVelocity: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const recentTasks = this.filterRecentTasks(tasks, timeWindow);
    
    if (recentTasks.length === 0) {
      return {
        dailyVelocity: 0,
        weeklyVelocity: 0,
        trend: 'stable',
      };
    }

    // Calculate total progress and time
    let totalProgress = 0;
    let totalTime = 0;

    for (const task of recentTasks) {
      if (task.status === 'done') {
        totalProgress += task.progressTotal || 1;
        totalTime += task.timeSpent || 0;
      }
    }

    const dailyVelocity = totalTime > 0 ? totalProgress / timeWindow : 0;
    const weeklyVelocity = dailyVelocity * 7;

    // Calculate trend by comparing first half vs second half
    const trend = this.calculateVelocityTrend(recentTasks, timeWindow);

    return {
      dailyVelocity: Math.round(dailyVelocity * 100) / 100,
      weeklyVelocity: Math.round(weeklyVelocity * 100) / 100,
      trend,
    };
  }

  /**
   * Calculate burn rate (time spent vs estimated)
   */
  calculateBurnRate(tasks: Task[]): {
    actualBurnRate: number;
    plannedBurnRate: number;
    burnRateRatio: number;
    isOnTrack: boolean;
  } {
    const completedTasks = tasks.filter(t => t.status === 'done');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    let actualTimeSpent = 0;
    let estimatedTimeTotal = 0;

    // Calculate actual time spent
    [...completedTasks, ...inProgressTasks].forEach(task => {
      actualTimeSpent += task.timeSpent || 0;
      estimatedTimeTotal += task.estimatedDuration || 0;
    });

    // Calculate planned time for completed work
    let plannedTimeForCompleted = 0;
    completedTasks.forEach(task => {
      plannedTimeForCompleted += task.estimatedDuration || 0;
    });

    const actualBurnRate = actualTimeSpent;
    const plannedBurnRate = plannedTimeForCompleted;
    const burnRateRatio = plannedBurnRate > 0 
      ? actualBurnRate / plannedBurnRate 
      : 1;

    // On track if burn rate ratio is between 0.8 and 1.2
    const isOnTrack = burnRateRatio >= 0.8 && burnRateRatio <= 1.2;

    return {
      actualBurnRate,
      plannedBurnRate,
      burnRateRatio: Math.round(burnRateRatio * 100) / 100,
      isOnTrack,
    };
  }

  /**
   * Calculate progress distribution across categories
   */
  calculateCategoryProgress(tasks: Task[]): Map<string, {
    percentage: number;
    completed: number;
    total: number;
    timeSpent: number;
  }> {
    const categoryMap = new Map();

    // Group tasks by category
    const categories = new Set(tasks.map(t => t.category));
    
    for (const category of categories) {
      const categoryTasks = tasks.filter(t => t.category === category);
      const completedTasks = categoryTasks.filter(t => t.status === 'done');
      const timeSpent = categoryTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
      
      const percentage = categoryTasks.length > 0
        ? Math.round((completedTasks.length / categoryTasks.length) * 100)
        : 0;

      categoryMap.set(category, {
        percentage,
        completed: completedTasks.length,
        total: categoryTasks.length,
        timeSpent,
      });
    }

    return categoryMap;
  }

  /**
   * Project completion timeline based on current velocity
   */
  async projectCompletionTimeline(
    _userId: string,
    includeRecurring: boolean = false
  ): Promise<{
    estimatedCompletionDate: Date | null;
    remainingWorkDays: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    // TODO: Implement findByUser in TaskRepository
    const tasks: Task[] = []; // await this.taskRepository.findByUser(userId);
    
    // Filter out completed and optionally recurring tasks
    const pendingTasks = tasks.filter((t: Task) => {
      if (t.status === 'done') return false;
      if (!includeRecurring && t.isRecurring) return false;
      return true;
    });

    if (pendingTasks.length === 0) {
      return {
        estimatedCompletionDate: null,
        remainingWorkDays: 0,
        confidence: 'high',
      };
    }

    // Calculate velocity from recent completed tasks
    const velocity = this.calculateVelocity(tasks, 14);
    
    if (velocity.dailyVelocity === 0) {
      return {
        estimatedCompletionDate: null,
        remainingWorkDays: -1,
        confidence: 'low',
      };
    }

    // Calculate remaining work
    const remainingProgress = pendingTasks.reduce((sum: number, task: Task) => {
      const remaining = (task.progressTotal || 1) - (task.progressCurrent || 0);
      return sum + remaining;
    }, 0);

    const remainingWorkDays = Math.ceil(remainingProgress / velocity.dailyVelocity);
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + remainingWorkDays);

    // Determine confidence based on velocity trend and data points
    const confidence = this.determineConfidence(velocity.trend, tasks.length);

    return {
      estimatedCompletionDate: completionDate,
      remainingWorkDays,
      confidence,
    };
  }

  /**
   * Identify bottlenecks and suggest optimizations
   */
  identifyBottlenecks(tasks: Task[]): {
    bottleneckType: string;
    affectedTasks: Task[];
    suggestion: string;
  }[] {
    const bottlenecks = [];

    // Check for overdue tasks
    const overdueTasks = tasks.filter(t => this.isOverdue(t));
    if (overdueTasks.length > 0) {
      bottlenecks.push({
        bottleneckType: 'overdue',
        affectedTasks: overdueTasks,
        suggestion: 'Review and update due dates or increase focus on overdue tasks',
      });
    }

    // Check for tasks with low efficiency
    const inefficientTasks = tasks.filter(t => {
      const metrics = this.calculateTaskProgress(t);
      return metrics.efficiency < 50 && t.status !== 'done';
    });
    
    if (inefficientTasks.length > 0) {
      bottlenecks.push({
        bottleneckType: 'inefficient',
        affectedTasks: inefficientTasks,
        suggestion: 'Re-estimate task durations or identify blockers',
      });
    }

    // Check for blocked tasks
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    if (blockedTasks.length > 0) {
      bottlenecks.push({
        bottleneckType: 'blocked',
        affectedTasks: blockedTasks,
        suggestion: 'Resolve dependencies or remove blockers',
      });
    }

    return bottlenecks;
  }

  // Private helper methods

  private calculateEstimatedCompletion(
    remainingProgress: number,
    velocity: number,
    dueDate?: Date | null
  ): Date | null {
    if (remainingProgress <= 0) {
      return new Date(); // Already complete
    }

    if (velocity <= 0) {
      return dueDate || null;
    }

    const daysToComplete = Math.ceil(remainingProgress / velocity);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);

    return estimatedDate;
  }

  private isTaskAtRisk(task: Task, metrics: ProgressMetrics): boolean {
    // Task is at risk if behind schedule or efficiency is low
    if (metrics.efficiency < 70) return true;
    
    if (task.dueDate && metrics.estimatedCompletion) {
      return metrics.estimatedCompletion > new Date(task.dueDate);
    }

    return false;
  }

  private filterRecentTasks(tasks: Task[], days: number): Task[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return tasks.filter(task => {
      if (!task.updatedAt) return false;
      const taskDate = new Date(task.updatedAt);
      return taskDate >= cutoffDate;
    });
  }

  private calculateVelocityTrend(
    tasks: Task[],
    timeWindow: number
  ): 'increasing' | 'decreasing' | 'stable' {
    const midPoint = Math.floor(timeWindow / 2);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - midPoint);

    const firstHalf = tasks.filter(t => {
      if (!t.updatedAt) return false;
      return new Date(t.updatedAt) < cutoffDate;
    });

    const secondHalf = tasks.filter(t => {
      if (!t.updatedAt) return false;
      return new Date(t.updatedAt) >= cutoffDate;
    });

    const firstHalfVelocity = this.calculatePeriodVelocity(firstHalf);
    const secondHalfVelocity = this.calculatePeriodVelocity(secondHalf);

    const difference = secondHalfVelocity - firstHalfVelocity;
    const threshold = firstHalfVelocity * 0.1; // 10% change threshold

    if (Math.abs(difference) < threshold) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  private calculatePeriodVelocity(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.status === 'done');
    const totalProgress = completedTasks.reduce(
      (sum, t) => sum + (t.progressTotal || 1),
      0
    );
    return totalProgress;
  }

  private isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }

  private determineConfidence(
    trend: 'increasing' | 'decreasing' | 'stable',
    dataPoints: number
  ): 'high' | 'medium' | 'low' {
    if (dataPoints < 5) return 'low';
    if (dataPoints < 20) return trend === 'stable' ? 'medium' : 'low';
    return trend === 'decreasing' ? 'medium' : 'high';
  }
}