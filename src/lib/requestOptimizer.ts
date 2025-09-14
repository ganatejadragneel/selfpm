// API Request Optimization - Phase 6 Performance & API Optimization
// Request deduplication, batching, and intelligent retry mechanisms

import { ErrorHandler, withRetry } from '../utils/errorHandling';
import type { AppError } from '../utils/errorHandling';
import type { RequestConfig, ApiResponse } from './apiClient';

// Request deduplication types
interface PendingRequest<T = any> {
  promise: Promise<ApiResponse<T>>;
  resolve: (value: ApiResponse<T>) => void;
  reject: (error: AppError) => void;
  timestamp: number;
  config: RequestConfig;
}

interface BatchRequest {
  id: string;
  config: RequestConfig;
  resolve: (value: ApiResponse<any>) => void;
  reject: (error: AppError) => void;
  timestamp: number;
}

interface RequestBatch {
  requests: BatchRequest[];
  timer: NodeJS.Timeout;
  table: string;
  operation: string;
}

// Request optimization configuration
export interface RequestOptimizerConfig {
  // Deduplication settings
  deduplicationEnabled: boolean;
  deduplicationTTL: number; // milliseconds

  // Batching settings
  batchingEnabled: boolean;
  batchSize: number;
  batchTimeout: number; // milliseconds

  // Retry settings
  retryEnabled: boolean;
  maxRetries: number;
  retryDelayBase: number; // milliseconds

  // Performance settings
  cacheKeyGenerator?: (config: RequestConfig) => string;
  shouldBatch?: (config: RequestConfig) => boolean;
  shouldDeduplicate?: (config: RequestConfig) => boolean;
}

// Default configuration
const DEFAULT_CONFIG: RequestOptimizerConfig = {
  deduplicationEnabled: true,
  deduplicationTTL: 5000, // 5 seconds

  batchingEnabled: true,
  batchSize: 10,
  batchTimeout: 50, // 50ms

  retryEnabled: true,
  maxRetries: 3,
  retryDelayBase: 1000,

  cacheKeyGenerator: (config) => JSON.stringify({
    table: config.table,
    operation: config.operation,
    filters: config.filters,
    params: config.params,
    columns: config.columns
  }),

  shouldBatch: (config) => config.operation === 'select' && !config.skipCache,
  shouldDeduplicate: (config) => config.operation === 'select'
};

export class RequestOptimizer {
  private config: RequestOptimizerConfig;
  private pendingRequests = new Map<string, PendingRequest[]>();
  private batches = new Map<string, RequestBatch>();
  private requestMetrics = {
    total: 0,
    deduplicated: 0,
    batched: 0,
    retried: 0,
    failed: 0
  };

  constructor(config: Partial<RequestOptimizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Main optimization method
  async optimizeRequest<T = any>(
    config: RequestConfig,
    executor: (config: RequestConfig) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    this.requestMetrics.total++;

    try {
      // Check for deduplication first
      if (this.config.deduplicationEnabled && this.config.shouldDeduplicate?.(config)) {
        const deduped = await this.handleDeduplication(config, executor);
        if (deduped) return deduped;
      }

      // Check for batching
      if (this.config.batchingEnabled && this.config.shouldBatch?.(config)) {
        const batched = await this.handleBatching(config, executor);
        if (batched) return batched;
      }

      // Execute with retry logic
      if (this.config.retryEnabled) {
        return await this.executeWithRetry(config, executor);
      }

      // Execute directly
      return await executor(config);

    } catch (error) {
      this.requestMetrics.failed++;
      throw ErrorHandler.detectNetworkError(error);
    }
  }

  // Request deduplication
  private async handleDeduplication<T>(
    config: RequestConfig,
    executor: (config: RequestConfig) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T> | null> {
    const key = this.config.cacheKeyGenerator!(config);
    const existing = this.pendingRequests.get(key);

    if (existing && existing.length > 0) {
      // Check if any existing requests are still valid (not expired)
      const validRequests = existing.filter(
        req => Date.now() - req.timestamp < this.config.deduplicationTTL
      );

      if (validRequests.length > 0) {
        this.requestMetrics.deduplicated++;
        console.log(`[Deduplication] Reusing request for key: ${key}`);

        // Return the first valid pending request
        return validRequests[0].promise;
      } else {
        // Clean up expired requests
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    let resolve: (value: ApiResponse<T>) => void;
    let reject: (error: AppError) => void;

    const promise = new Promise<ApiResponse<T>>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!,
      timestamp: Date.now(),
      config
    };

    // Add to pending requests
    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.set(key, []);
    }
    this.pendingRequests.get(key)!.push(pendingRequest);

    // Execute the actual request
    try {
      const result = await (this.config.retryEnabled
        ? this.executeWithRetry(config, executor)
        : executor(config)
      );

      // Resolve all pending requests with the same result
      const allPending = this.pendingRequests.get(key) || [];
      allPending.forEach(req => req.resolve(result));
      this.pendingRequests.delete(key);

      return result;
    } catch (error) {
      // Reject all pending requests
      const appError = ErrorHandler.detectNetworkError(error);
      const allPending = this.pendingRequests.get(key) || [];
      allPending.forEach(req => req.reject(appError));
      this.pendingRequests.delete(key);

      throw appError;
    }
  }

  // Request batching (for similar operations)
  private async handleBatching<T>(
    config: RequestConfig,
    executor: (config: RequestConfig) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T> | null> {
    // Only batch select operations for now
    if (config.operation !== 'select') {
      return null;
    }

    const batchKey = `${config.table}:${config.operation}`;

    return new Promise<ApiResponse<T>>((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 15);
      const batchRequest: BatchRequest = {
        id: requestId,
        config,
        resolve: resolve as any,
        reject,
        timestamp: Date.now()
      };

      let batch = this.batches.get(batchKey);

      if (!batch) {
        // Create new batch
        batch = {
          requests: [],
          timer: setTimeout(() => this.executeBatch(batchKey, executor), this.config.batchTimeout),
          table: config.table,
          operation: config.operation
        };
        this.batches.set(batchKey, batch);
      }

      // Add request to batch
      batch.requests.push(batchRequest);

      // Execute batch if it's full
      if (batch.requests.length >= this.config.batchSize) {
        clearTimeout(batch.timer);
        this.executeBatch(batchKey, executor);
      }
    });
  }

  // Execute a batch of requests
  private async executeBatch(
    batchKey: string,
    executor: (config: RequestConfig) => Promise<ApiResponse<any>>
  ) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.requests.length === 0) return;

    this.batches.delete(batchKey);
    this.requestMetrics.batched += batch.requests.length;

    console.log(`[Batching] Executing batch of ${batch.requests.length} requests for ${batchKey}`);

    try {
      // For now, execute requests individually but in parallel
      // Future enhancement: implement true SQL batching for supported operations
      const promises = batch.requests.map(async (request) => {
        try {
          const result = await executor(request.config);
          request.resolve(result);
          return result;
        } catch (error) {
          const appError = ErrorHandler.detectNetworkError(error);
          request.reject(appError);
          throw appError;
        }
      });

      await Promise.allSettled(promises);

    } catch (error) {
      // This should not happen as errors are handled individually above
      console.error('Unexpected batch execution error:', error);
    }
  }

  // Execute request with retry logic
  private async executeWithRetry<T>(
    config: RequestConfig,
    executor: (config: RequestConfig) => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    return withRetry(
      () => executor(config),
      this.config.maxRetries,
      {
        customDelay: (error, attempt) => {
          this.requestMetrics.retried++;
          return ErrorHandler.getRetryDelay(error, attempt);
        },
        shouldRetry: (error, attempt) => {
          return ErrorHandler.isRetryable(error) && attempt < this.config.maxRetries!;
        },
        onRetry: (error, attempt) => {
          console.log(`[Retry] Attempt ${attempt} for ${config.table}:${config.operation}`, error.message);
        },
        timeout: config.timeout
      }
    );
  }

  // Smart request prioritization
  prioritizeRequests(requests: RequestConfig[]): RequestConfig[] {
    return requests.sort((a, b) => {
      // Prioritize by operation type
      const operationPriority = {
        select: 1,
        insert: 2,
        update: 3,
        delete: 4,
        upsert: 5
      };

      const aPriority = operationPriority[a.operation] || 99;
      const bPriority = operationPriority[b.operation] || 99;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Prioritize cached requests
      if (a.skipCache !== b.skipCache) {
        return a.skipCache ? 1 : -1;
      }

      // Prioritize by table importance (tasks > subtasks > others)
      const tableImportance = {
        tasks: 1,
        subtasks: 2,
        task_updates: 3,
        custom_tasks: 2,
        daily_task_completions: 4
      };

      const aImportance = tableImportance[a.table as keyof typeof tableImportance] || 99;
      const bImportance = tableImportance[b.table as keyof typeof tableImportance] || 99;

      return aImportance - bImportance;
    });
  }

  // Request queue with priority and rate limiting
  private requestQueue: Array<{
    config: RequestConfig;
    executor: (config: RequestConfig) => Promise<ApiResponse<any>>;
    resolve: (value: ApiResponse<any>) => void;
    reject: (error: AppError) => void;
    priority: number;
    timestamp: number;
  }> = [];

  private queueProcessor?: NodeJS.Timeout;
  private concurrentRequests = 0;
  private maxConcurrentRequests = 6; // Browser limit is typically 6

  async queueRequest<T>(
    config: RequestConfig,
    executor: (config: RequestConfig) => Promise<ApiResponse<T>>,
    priority = 5
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        config,
        executor,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      });

      // Sort queue by priority (lower number = higher priority)
      this.requestQueue.sort((a, b) => a.priority - b.priority);

      // Start processing if not already running
      if (!this.queueProcessor) {
        this.processQueue();
      }
    });
  }

  private processQueue = async () => {
    if (this.requestQueue.length === 0 || this.concurrentRequests >= this.maxConcurrentRequests) {
      // Stop processing if queue is empty or at max concurrency
      if (this.requestQueue.length === 0) {
        this.queueProcessor = undefined;
      } else {
        // Check again after a short delay
        this.queueProcessor = setTimeout(this.processQueue, 10);
      }
      return;
    }

    // Process next request
    const nextRequest = this.requestQueue.shift();
    if (!nextRequest) return;

    this.concurrentRequests++;

    try {
      const result = await this.optimizeRequest(nextRequest.config, nextRequest.executor);
      nextRequest.resolve(result);
    } catch (error) {
      nextRequest.reject(error as AppError);
    } finally {
      this.concurrentRequests--;
    }

    // Continue processing
    this.queueProcessor = setTimeout(this.processQueue, 0);
  };

  // Performance metrics
  getMetrics() {
    const { total, deduplicated, batched, retried, failed } = this.requestMetrics;

    return {
      totalRequests: total,
      deduplicatedRequests: deduplicated,
      batchedRequests: batched,
      retriedRequests: retried,
      failedRequests: failed,
      successRate: total > 0 ? ((total - failed) / total) * 100 : 100,
      deduplicationRate: total > 0 ? (deduplicated / total) * 100 : 0,
      batchingRate: total > 0 ? (batched / total) * 100 : 0,
      concurrentRequests: this.concurrentRequests,
      queueLength: this.requestQueue.length,
      pendingDeduplication: Array.from(this.pendingRequests.values()).reduce((sum, arr) => sum + arr.length, 0),
      activeBatches: this.batches.size
    };
  }

  // Clean up resources
  cleanup() {
    // Clear all timers
    this.batches.forEach(batch => clearTimeout(batch.timer));
    this.batches.clear();

    if (this.queueProcessor) {
      clearTimeout(this.queueProcessor);
      this.queueProcessor = undefined;
    }

    // Reject pending requests
    this.pendingRequests.forEach(requests => {
      requests.forEach(req => {
        req.reject(ErrorHandler.createError('unknown', 'Request optimizer is being cleaned up'));
      });
    });
    this.pendingRequests.clear();

    // Clear request queue
    this.requestQueue.forEach(req => {
      req.reject(ErrorHandler.createError('unknown', 'Request optimizer is being cleaned up'));
    });
    this.requestQueue.length = 0;
  }

  // Configuration updates
  updateConfig(newConfig: Partial<RequestOptimizerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RequestOptimizerConfig {
    return { ...this.config };
  }
}

// Global request optimizer instance
export const requestOptimizer = new RequestOptimizer();

