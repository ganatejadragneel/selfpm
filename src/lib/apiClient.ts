// Unified API Client - Phase 6 Performance & API Optimization
// Centralized wrapper for Supabase with interceptors, error handling, and caching

import { supabase } from './supabase';
import { ErrorHandler } from '../utils/errorHandling';
import { requestOptimizer } from './requestOptimizer';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import type { AppError } from '../utils/errorHandling';

// Request/Response interceptor types
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onRequestError?: (error: unknown) => Promise<never>;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  onResponseError?: (error: AppError) => Promise<never>;
}

export interface RequestConfig {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  params?: Record<string, any>;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  range?: { from: number; to: number };
  columns?: string;
  cacheKey?: string;
  cacheTTL?: number;
  skipCache?: boolean;
  retryCount?: number;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: AppError | null;
  count?: number | null;
  status: number;
  statusText: string;
  cached?: boolean;
  timestamp: Date;
}

class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private requestCount = 0;
  private failureCount = 0;

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Request processing pipeline
  private async processRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            await interceptor.onRequestError(error);
          }
          throw error;
        }
      }
    }

    return processedConfig;
  }

  // Response processing pipeline
  private async processResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let processedResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        try {
          processedResponse = await interceptor.onResponse(processedResponse);
        } catch (error) {
          if (interceptor.onResponseError && error instanceof Error) {
            const appError = ErrorHandler.fromNetwork(error.message);
            await interceptor.onResponseError(appError);
          }
          throw error;
        }
      }
    }

    return processedResponse;
  }

  // Convert Supabase response to unified format
  private transformSupabaseResponse<T>(
    supabaseResponse: PostgrestResponse<T> | PostgrestSingleResponse<T>,
    cached = false
  ): ApiResponse<T> {
    const { data, error, count, status, statusText } = supabaseResponse;

    return {
      data: data as T || null,
      error: error ? ErrorHandler.fromNetwork(`Database error: ${error.message}`) : null,
      count: count || null,
      status,
      statusText,
      cached,
      timestamp: new Date()
    };
  }

  // Core query method
  async query<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Use request optimizer for deduplication, batching, and retry logic
    return requestOptimizer.optimizeRequest(config, async (optimizedConfig) => {
      return this.executeQuery<T>(optimizedConfig);
    });
  }

  // Internal query execution method
  private async executeQuery<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      this.requestCount++;

      // Process request interceptors
      const processedConfig = await this.processRequestInterceptors(config);

      // Build Supabase query
      let query: any = supabase.from(processedConfig.table);

      switch (processedConfig.operation) {
        case 'select':
          query = query.select(processedConfig.columns || '*');
          break;
        case 'insert':
          query = query.insert(processedConfig.params);
          break;
        case 'update':
          query = query.update(processedConfig.params);
          break;
        case 'delete':
          query = query.delete();
          break;
        case 'upsert':
          query = query.upsert(processedConfig.params);
          break;
      }

      // Apply filters
      if (processedConfig.filters) {
        Object.entries(processedConfig.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Handle complex filters like .gte(), .lte(), etc.
            Object.entries(value).forEach(([operator, operatorValue]) => {
              query = (query as any)[operator](key, operatorValue);
            });
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (processedConfig.orderBy) {
        query = query.order(processedConfig.orderBy.column, {
          ascending: processedConfig.orderBy.ascending !== false
        });
      }

      // Apply limit
      if (processedConfig.limit) {
        query = query.limit(processedConfig.limit);
      }

      // Apply range
      if (processedConfig.range) {
        query = query.range(processedConfig.range.from, processedConfig.range.to);
      }

      // Execute query
      const supabaseResponse = await query;

      // Transform response
      const response = this.transformSupabaseResponse<T>(supabaseResponse);

      // Process response interceptors
      const processedResponse = await this.processResponseInterceptors(response);

      return processedResponse;

    } catch (error) {
      this.failureCount++;

      const appError = ErrorHandler.fromUnknown(error, `API Client Query Error`);
      const errorResponse: ApiResponse<T> = {
        data: null,
        error: appError,
        status: 500,
        statusText: 'Internal Server Error',
        timestamp: new Date()
      };

      return this.processResponseInterceptors(errorResponse);
    }
  }

  // Convenience methods for common operations
  async select<T = any>(
    table: string,
    options: Omit<RequestConfig, 'table' | 'operation'> = {}
  ): Promise<ApiResponse<T[]>> {
    return this.query<T[]>({ table, operation: 'select', ...options });
  }

  async selectSingle<T = any>(
    table: string,
    options: Omit<RequestConfig, 'table' | 'operation'> = {}
  ): Promise<ApiResponse<T>> {
    const response = await this.query<T[]>({ table, operation: 'select', limit: 1, ...options });

    return {
      ...response,
      data: response.data?.[0] || null
    };
  }

  async insert<T = any>(
    table: string,
    data: any,
    options: Omit<RequestConfig, 'table' | 'operation' | 'params'> = {}
  ): Promise<ApiResponse<T>> {
    return this.query<T>({ table, operation: 'insert', params: data, ...options });
  }

  async update<T = any>(
    table: string,
    data: any,
    options: Omit<RequestConfig, 'table' | 'operation' | 'params'> = {}
  ): Promise<ApiResponse<T>> {
    return this.query<T>({ table, operation: 'update', params: data, ...options });
  }

  async delete<T = any>(
    table: string,
    options: Omit<RequestConfig, 'table' | 'operation'> = {}
  ): Promise<ApiResponse<T>> {
    return this.query<T>({ table, operation: 'delete', ...options });
  }

  async upsert<T = any>(
    table: string,
    data: any,
    options: Omit<RequestConfig, 'table' | 'operation' | 'params'> = {}
  ): Promise<ApiResponse<T>> {
    return this.query<T>({ table, operation: 'upsert', params: data, ...options });
  }

  // Batch operations
  async batch<T = any>(requests: RequestConfig[]): Promise<ApiResponse<T>[]> {
    const promises = requests.map(config => this.query<T>(config));
    return Promise.all(promises);
  }

  // Priority-based query execution
  async priorityQuery<T = any>(config: RequestConfig, priority = 5): Promise<ApiResponse<T>> {
    return requestOptimizer.queueRequest(config, async (queuedConfig) => {
      return this.executeQuery<T>(queuedConfig);
    }, priority);
  }

  // Batch execute multiple queries
  async batchQuery<T = any>(configs: RequestConfig[]): Promise<ApiResponse<T>[]> {
    // Prioritize requests before execution
    const prioritizedConfigs = requestOptimizer.prioritizeRequests(configs);

    const promises = prioritizedConfigs.map(config => this.query<T>(config));
    return Promise.all(promises);
  }

  // Health and metrics (now includes optimizer metrics)
  getMetrics() {
    const optimizerMetrics = requestOptimizer.getMetrics();

    return {
      // API Client metrics
      apiClientRequests: this.requestCount,
      apiClientFailures: this.failureCount,
      apiClientSuccessRate: this.requestCount > 0 ? ((this.requestCount - this.failureCount) / this.requestCount) * 100 : 100,

      // Optimizer metrics
      ...optimizerMetrics,

      // Combined efficiency score
      efficiencyScore: this.calculateEfficiencyScore(optimizerMetrics)
    };
  }

  private calculateEfficiencyScore(optimizerMetrics: ReturnType<typeof requestOptimizer.getMetrics>): number {
    let score = 100;

    // Deduct points for failures
    if (optimizerMetrics.totalRequests > 0) {
      const failureRate = (optimizerMetrics.failedRequests / optimizerMetrics.totalRequests) * 100;
      score -= failureRate * 2; // Each 1% failure rate costs 2 points
    }

    // Add points for optimization
    score += optimizerMetrics.deduplicationRate * 0.5; // Deduplication adds efficiency
    score += optimizerMetrics.batchingRate * 0.3; // Batching adds efficiency

    // Deduct points for retries (they indicate network issues)
    if (optimizerMetrics.totalRequests > 0) {
      const retryRate = (optimizerMetrics.retriedRequests / optimizerMetrics.totalRequests) * 100;
      score -= retryRate * 0.5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  resetMetrics() {
    this.requestCount = 0;
    this.failureCount = 0;
    // Note: We don't reset optimizer metrics as they're managed separately
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Default interceptors
apiClient.addRequestInterceptor({
  onRequest: (config) => {
    // Add request ID and timestamp
    console.log(`[API] ${config.operation.toUpperCase()} ${config.table}`, config);
    return config;
  }
});

apiClient.addResponseInterceptor({
  onResponse: (response) => {
    // Log response timing and status
    if (response.error) {
      console.error(`[API Error]`, response.error);
    } else {
      console.log(`[API Success]`, response.status, response.statusText);
    }
    return response;
  }
});

