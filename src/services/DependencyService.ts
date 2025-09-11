/**
 * DependencyService - Business logic for task dependencies and relationships
 * Following SOLID principles: Single responsibility for dependency management
 */

import { TaskRepository } from '../repositories/TaskRepository';
import type { Task, TaskDependency } from '../types';

export interface DependencyGraph {
  nodes: Map<string, Task>;
  edges: Map<string, Set<string>>; // taskId -> dependent taskIds
  reverseEdges: Map<string, Set<string>>; // taskId -> prerequisite taskIds
}

export interface DependencyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CriticalPath {
  tasks: Task[];
  totalDuration: number;
  criticalDate: Date;
}

export class DependencyService {
  private taskRepository: TaskRepository;
  private dependencyCache: Map<string, DependencyGraph>;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.dependencyCache = new Map();
  }

  /**
   * Add dependency between tasks
   */
  async addDependency(
    taskId: string,
    dependsOnTaskId: string,
    userId: string
  ): Promise<TaskDependency> {
    // Validate that both tasks exist
    const [task, dependsOnTask] = await Promise.all([
      this.taskRepository.findById(taskId),
      this.taskRepository.findById(dependsOnTaskId),
    ]);

    if (task.error || !task.data) {
      throw new Error(`Task ${taskId} not found`);
    }
    if (dependsOnTask.error || !dependsOnTask.data) {
      throw new Error(`Dependency task ${dependsOnTaskId} not found`);
    }

    // Check for circular dependencies
    const wouldCreateCycle = await this.wouldCreateCycle(taskId, dependsOnTaskId, userId);
    if (wouldCreateCycle) {
      throw new Error('Adding this dependency would create a circular reference');
    }

    // Check if dependency already exists
    const existingDependencies = await this.getTaskDependencies(taskId);
    if (existingDependencies.some(d => d.dependsOnTaskId === dependsOnTaskId)) {
      throw new Error('Dependency already exists');
    }

    // Create the dependency
    const dependency: TaskDependency = {
      id: `${taskId}_${dependsOnTaskId}`,
      taskId,
      dependsOnTaskId,
      dependencyType: 'finish_to_start',
      createdAt: new Date().toISOString(),
    };

    // Clear cache for affected user
    this.clearCache(userId);

    // In a real implementation, this would save to task_dependencies table
    return dependency;
  }

  /**
   * Remove dependency between tasks
   */
  async removeDependency(
    _taskId: string,
    _dependsOnTaskId: string,
    userId: string
  ): Promise<boolean> {
    // Clear cache for affected user
    this.clearCache(userId);
    
    // In a real implementation, this would delete from task_dependencies table
    return true;
  }

  /**
   * Get all dependencies for a task
   */
  async getTaskDependencies(_taskId: string): Promise<TaskDependency[]> {
    // In a real implementation, this would query task_dependencies table
    // For now, return empty array
    return [];
  }

  /**
   * Get all tasks that depend on a given task
   */
  async getTaskDependents(_taskId: string): Promise<Task[]> {
    // In a real implementation, this would query for reverse dependencies
    return [];
  }

  /**
   * Build dependency graph for user's tasks
   */
  async buildDependencyGraph(userId: string): Promise<DependencyGraph> {
    // Check cache first
    const cacheKey = `graph_${userId}`;
    if (this.dependencyCache.has(cacheKey)) {
      return this.dependencyCache.get(cacheKey)!;
    }

    // TODO: Implement findByUser in TaskRepository
    const tasks: Task[] = []; // await this.taskRepository.findByUser(userId);
    const graph: DependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      reverseEdges: new Map(),
    };

    // Add all tasks as nodes
    for (const task of tasks) {
      graph.nodes.set(task.id, task);
      graph.edges.set(task.id, new Set());
      graph.reverseEdges.set(task.id, new Set());
    }

    // Add edges based on dependencies
    // In a real implementation, this would query task_dependencies
    // For now, we'll simulate with empty edges

    // Cache the graph
    this.dependencyCache.set(cacheKey, graph);
    
    return graph;
  }

  /**
   * Check if task can be started (all dependencies completed)
   */
  async canStartTask(taskId: string, _userId: string): Promise<boolean> {
    const dependencies = await this.getTaskDependencies(taskId);
    
    for (const dep of dependencies) {
      const depTask = await this.taskRepository.findById(dep.dependsOnTaskId);
      if (depTask.error || !depTask.data) continue;
      
      if (depTask.data.status !== 'done') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get tasks that are ready to start (no incomplete dependencies)
   */
  async getReadyTasks(userId: string): Promise<Task[]> {
    const graph = await this.buildDependencyGraph(userId);
    const readyTasks: Task[] = [];

    for (const [taskId, task] of graph.nodes) {
      if (task.status === 'todo') {
        const canStart = await this.canStartTask(taskId, userId);
        if (canStart) {
          readyTasks.push(task);
        }
      }
    }

    return readyTasks;
  }

  /**
   * Get blocked tasks (have incomplete dependencies)
   */
  async getBlockedTasks(userId: string): Promise<{
    task: Task;
    blockingTasks: Task[];
  }[]> {
    const graph = await this.buildDependencyGraph(userId);
    const blockedTasks: { task: Task; blockingTasks: Task[] }[] = [];

    for (const [taskId, task] of graph.nodes) {
      if (task.status === 'todo' || task.status === 'blocked') {
        const dependencies = await this.getTaskDependencies(taskId);
        const blockingTasks: Task[] = [];

        for (const dep of dependencies) {
          const depTask = graph.nodes.get(dep.dependsOnTaskId);
          if (depTask && depTask.status !== 'done') {
            blockingTasks.push(depTask);
          }
        }

        if (blockingTasks.length > 0) {
          blockedTasks.push({ task, blockingTasks });
        }
      }
    }

    return blockedTasks;
  }

  /**
   * Validate dependency graph for issues
   */
  async validateDependencyGraph(_userId: string): Promise<DependencyValidation> {
    const graph = await this.buildDependencyGraph(_userId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for cycles
    const cycles = this.detectCycles(graph);
    if (cycles.length > 0) {
      errors.push(`Circular dependencies detected: ${cycles.join(', ')}`);
    }

    // Check for orphaned dependencies (dependencies on deleted tasks)
    for (const [taskId, task] of graph.nodes) {
      const dependencies = await this.getTaskDependencies(taskId);
      for (const dep of dependencies) {
        if (!graph.nodes.has(dep.dependsOnTaskId)) {
          warnings.push(`Task "${task.title}" depends on deleted task ${dep.dependsOnTaskId}`);
        }
      }
    }

    // Check for long dependency chains
    const maxChainLength = this.findLongestDependencyChain(graph);
    if (maxChainLength > 5) {
      warnings.push(`Long dependency chain detected (${maxChainLength} levels deep)`);
    }

    // Check for bottleneck tasks (many tasks depend on them)
    const bottlenecks = this.findBottleneckTasks(graph, 3);
    if (bottlenecks.length > 0) {
      const titles = bottlenecks.map(t => t.title).join(', ');
      warnings.push(`Potential bottleneck tasks: ${titles}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate critical path for project completion
   */
  async calculateCriticalPath(userId: string): Promise<CriticalPath> {
    const graph = await this.buildDependencyGraph(userId);
    
    // Topological sort to find task order
    const sortedTasks = this.topologicalSort(graph);
    if (sortedTasks.length === 0) {
      return {
        tasks: [],
        totalDuration: 0,
        criticalDate: new Date(),
      };
    }

    // Calculate earliest start and finish times
    const earliestTimes = new Map<string, { start: number; finish: number }>();
    
    for (const task of sortedTasks) {
      const dependencies = Array.from(graph.reverseEdges.get(task.id) || []);
      let earliestStart = 0;

      for (const depId of dependencies) {
        const depTime = earliestTimes.get(depId);
        if (depTime) {
          earliestStart = Math.max(earliestStart, depTime.finish);
        }
      }

      const duration = task.estimatedDuration || 1;
      earliestTimes.set(task.id, {
        start: earliestStart,
        finish: earliestStart + duration,
      });
    }

    // Find the critical path (longest path)
    let maxFinishTime = 0;
    let endTask: Task | null = null;

    for (const [taskId, times] of earliestTimes) {
      if (times.finish > maxFinishTime) {
        maxFinishTime = times.finish;
        endTask = graph.nodes.get(taskId) || null;
      }
    }

    // Trace back the critical path
    const criticalPath: Task[] = [];
    if (endTask) {
      criticalPath.push(endTask);
      let currentTask = endTask;

      while (currentTask) {
        const dependencies = Array.from(graph.reverseEdges.get(currentTask.id) || []);
        let nextTask: Task | null = null;
        let latestFinish = -1;

        for (const depId of dependencies) {
          const depTask = graph.nodes.get(depId);
          const depTime = earliestTimes.get(depId);
          if (depTask && depTime && depTime.finish > latestFinish) {
            latestFinish = depTime.finish;
            nextTask = depTask;
          }
        }

        if (nextTask) {
          criticalPath.unshift(nextTask);
          currentTask = nextTask;
        } else {
          break;
        }
      }
    }

    const criticalDate = new Date();
    criticalDate.setDate(criticalDate.getDate() + maxFinishTime);

    return {
      tasks: criticalPath,
      totalDuration: maxFinishTime,
      criticalDate,
    };
  }

  /**
   * Suggest dependency optimizations
   */
  async suggestOptimizations(userId: string): Promise<{
    type: string;
    description: string;
    affectedTasks: Task[];
  }[]> {
    const graph = await this.buildDependencyGraph(userId);
    const suggestions: {
      type: string;
      description: string;
      affectedTasks: Task[];
    }[] = [];

    // Find parallel opportunities
    const parallelOpportunities = this.findParallelOpportunities(graph);
    if (parallelOpportunities.length > 0) {
      suggestions.push({
        type: 'parallel',
        description: 'These tasks can be done in parallel',
        affectedTasks: parallelOpportunities,
      });
    }

    // Find redundant dependencies
    const redundantDeps = this.findRedundantDependencies(graph);
    if (redundantDeps.length > 0) {
      suggestions.push({
        type: 'redundant',
        description: 'These dependencies are redundant and can be removed',
        affectedTasks: redundantDeps,
      });
    }

    // Find tasks that could be decomposed
    const largeTasks = Array.from(graph.nodes.values()).filter(
      t => (t.estimatedDuration || 0) > 20
    );
    if (largeTasks.length > 0) {
      suggestions.push({
        type: 'decompose',
        description: 'Consider breaking down these large tasks',
        affectedTasks: largeTasks,
      });
    }

    return suggestions;
  }

  /**
   * Auto-resolve simple dependency conflicts
   */
  async autoResolveDependencies(userId: string): Promise<{
    resolved: number;
    actions: string[];
  }> {
    const actions: string[] = [];
    let resolved = 0;

    // Auto-update blocked status based on dependencies
    const blockedTasks = await this.getBlockedTasks(userId);
    for (const { task } of blockedTasks) {
      if (task.status !== 'blocked') {
        await this.taskRepository.updateStatus(task.id, 'blocked');
        actions.push(`Marked "${task.title}" as blocked`);
        resolved++;
      }
    }

    // Auto-unblock tasks with completed dependencies
    const readyTasks = await this.getReadyTasks(userId);
    for (const task of readyTasks) {
      if (task.status === 'blocked') {
        await this.taskRepository.updateStatus(task.id, 'todo');
        actions.push(`Unblocked "${task.title}"`);
        resolved++;
      }
    }

    return { resolved, actions };
  }

  // Private helper methods

  private async wouldCreateCycle(
    taskId: string,
    dependsOnTaskId: string,
    _userId: string
  ): Promise<boolean> {
    // Check if adding this dependency would create a cycle
    const visited = new Set<string>();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (current === taskId) {
        return true; // Cycle detected
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);
      
      const dependencies = await this.getTaskDependencies(current);
      for (const dep of dependencies) {
        stack.push(dep.dependsOnTaskId);
      }
    }

    return false;
  }

  private detectCycles(graph: DependencyGraph): string[] {
    const cycles: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const dependencies = graph.edges.get(taskId) || new Set();
      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          cycles.push(`${taskId} -> ${depId}`);
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of graph.nodes.keys()) {
      if (!visited.has(taskId)) {
        hasCycle(taskId);
      }
    }

    return cycles;
  }

  private findLongestDependencyChain(graph: DependencyGraph): number {
    const memo = new Map<string, number>();

    const getChainLength = (taskId: string): number => {
      if (memo.has(taskId)) {
        return memo.get(taskId)!;
      }

      const dependencies = graph.reverseEdges.get(taskId) || new Set();
      if (dependencies.size === 0) {
        memo.set(taskId, 1);
        return 1;
      }

      let maxLength = 0;
      for (const depId of dependencies) {
        maxLength = Math.max(maxLength, getChainLength(depId));
      }

      const length = maxLength + 1;
      memo.set(taskId, length);
      return length;
    };

    let maxChain = 0;
    for (const taskId of graph.nodes.keys()) {
      maxChain = Math.max(maxChain, getChainLength(taskId));
    }

    return maxChain;
  }

  private findBottleneckTasks(graph: DependencyGraph, threshold: number): Task[] {
    const bottlenecks: Task[] = [];

    for (const [taskId, task] of graph.nodes) {
      const dependents = graph.edges.get(taskId) || new Set();
      if (dependents.size >= threshold) {
        bottlenecks.push(task);
      }
    }

    return bottlenecks;
  }

  private topologicalSort(graph: DependencyGraph): Task[] {
    const sorted: Task[] = [];
    const visited = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const dependencies = graph.reverseEdges.get(taskId) || new Set();
      for (const depId of dependencies) {
        visit(depId);
      }

      const task = graph.nodes.get(taskId);
      if (task) {
        sorted.push(task);
      }
    };

    for (const taskId of graph.nodes.keys()) {
      visit(taskId);
    }

    return sorted;
  }

  private findParallelOpportunities(graph: DependencyGraph): Task[] {
    const parallel: Task[] = [];
    const independentTasks = new Set<string>();

    // Find tasks with no dependencies on each other
    for (const [taskId1, task1] of graph.nodes) {
      if (task1.status !== 'todo') continue;

      let isIndependent = true;
      for (const [taskId2, task2] of graph.nodes) {
        if (taskId1 === taskId2 || task2.status !== 'todo') continue;

        const edges1 = graph.edges.get(taskId1) || new Set();
        const edges2 = graph.edges.get(taskId2) || new Set();

        if (edges1.has(taskId2) || edges2.has(taskId1)) {
          isIndependent = false;
          break;
        }
      }

      if (isIndependent) {
        independentTasks.add(taskId1);
      }
    }

    for (const taskId of independentTasks) {
      const task = graph.nodes.get(taskId);
      if (task) {
        parallel.push(task);
      }
    }

    return parallel;
  }

  private findRedundantDependencies(_graph: DependencyGraph): Task[] {
    // Find dependencies that are implied by transitive dependencies
    const redundant: Task[] = [];
    
    // This is a simplified implementation
    // In a real system, we'd check for transitive redundancy
    
    return redundant;
  }

  private clearCache(userId: string): void {
    const cacheKey = `graph_${userId}`;
    this.dependencyCache.delete(cacheKey);
  }
}