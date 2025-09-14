// Centralized error handling utilities

export interface AppError {
  type: 'validation' | 'network' | 'auth' | 'permission' | 'not_found' | 'server' | 'unknown' | 'timeout' | 'offline' | 'rate_limit';
  message: string;
  details?: string;
  field?: string;
  code?: string | number;
  timestamp: Date;
  retryable?: boolean;
  retryAfter?: number; // seconds
  context?: string;
}

export class ErrorHandler {
  static createError(
    type: AppError['type'],
    message: string,
    options: Partial<Pick<AppError, 'details' | 'field' | 'code' | 'retryable' | 'retryAfter' | 'context'>> = {}
  ): AppError {
    return {
      type,
      message,
      timestamp: new Date(),
      ...options
    };
  }

  static fromValidation(field: string, message: string): AppError {
    return this.createError('validation', message, { field });
  }

  static fromNetwork(message = 'Network error occurred', retryable = true): AppError {
    return this.createError('network', message, { retryable });
  }

  static fromTimeout(timeout = 30000): AppError {
    return this.createError('timeout', `Request timed out after ${timeout}ms`, {
      retryable: true,
      code: 'TIMEOUT'
    });
  }

  static fromOffline(): AppError {
    return this.createError('offline', 'You are currently offline', {
      retryable: true,
      code: 'OFFLINE'
    });
  }

  static fromRateLimit(retryAfter?: number): AppError {
    return this.createError('rate_limit', 'Too many requests. Please try again later.', {
      retryable: true,
      retryAfter: retryAfter || 60,
      code: 'RATE_LIMIT'
    });
  }

  static fromHttpStatus(status: number, statusText: string, retryAfter?: number): AppError {
    let type: AppError['type'] = 'unknown';
    let retryable = false;

    switch (Math.floor(status / 100)) {
      case 4: // 4xx client errors
        switch (status) {
          case 401:
            type = 'auth';
            break;
          case 403:
            type = 'permission';
            break;
          case 404:
            type = 'not_found';
            break;
          case 429:
            type = 'rate_limit';
            retryable = true;
            break;
          default:
            type = 'network';
        }
        break;
      case 5: // 5xx server errors
        type = 'server';
        retryable = true;
        break;
      default:
        type = 'network';
        retryable = status >= 500;
    }

    return this.createError(type, `HTTP ${status}: ${statusText}`, {
      code: status,
      retryable,
      retryAfter
    });
  }

  static fromAuth(message = 'Authentication failed'): AppError {
    return this.createError('auth', message);
  }

  static fromUnknown(error: unknown, context?: string): AppError {
    let message = 'An unexpected error occurred';
    let details: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      details = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      message = (error as any).message || message;
      details = JSON.stringify(error);
    }

    return this.createError('unknown', message, {
      details: context ? `${context}: ${details}` : details
    });
  }

  static format(error: AppError): string {
    switch (error.type) {
      case 'validation':
        return error.field ? `${error.field}: ${error.message}` : error.message;
      case 'network':
        return `Connection error: ${error.message}`;
      case 'auth':
        return `Authentication error: ${error.message}`;
      case 'permission':
        return `Permission denied: ${error.message}`;
      case 'not_found':
        return `Not found: ${error.message}`;
      case 'server':
        return `Server error: ${error.message}`;
      default:
        return error.message;
    }
  }

  static isRetryable(error: AppError): boolean {
    return error.retryable ?? (error.type === 'network' || error.type === 'server' || error.type === 'timeout' || error.type === 'rate_limit');
  }

  static getRetryDelay(error: AppError, attempt: number): number {
    // If error specifies retryAfter, use it
    if (error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }

    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;

    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  static getErrorIcon(error: AppError): string {
    switch (error.type) {
      case 'validation':
        return '⚠️';
      case 'network':
        return '🌐';
      case 'timeout':
        return '⏱️';
      case 'offline':
        return '📵';
      case 'rate_limit':
        return '🚦';
      case 'auth':
        return '🔒';
      case 'permission':
        return '🚫';
      case 'not_found':
        return '❓';
      case 'server':
        return '🔧';
      default:
        return '❌';
    }
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static detectNetworkError(error: unknown): AppError {
    // Check for specific error patterns
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return this.isOnline() ? this.fromNetwork('Network request failed') : this.fromOffline();
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      return this.fromTimeout();
    }

    if (error && typeof error === 'object') {
      const errorObj = error as any;

      // Check for HTTP status
      if (errorObj.status) {
        return this.fromHttpStatus(errorObj.status, errorObj.statusText || 'Unknown error');
      }

      // Check for Supabase-specific errors
      if (errorObj.code) {
        switch (errorObj.code) {
          case 'PGRST301':
            return this.createError('rate_limit', 'Too many requests', {
              retryable: true,
              code: errorObj.code
            });
          case 'PGRST204':
            return this.createError('not_found', 'Resource not found', {
              code: errorObj.code
            });
          default:
            return this.createError('server', errorObj.message || 'Database error', {
              retryable: true,
              code: errorObj.code
            });
        }
      }
    }

    return this.fromUnknown(error, 'Network detection');
  }
}

// Error boundary utilities
export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorId?: string;
}

export const createErrorBoundaryState = (): ErrorBoundaryState => ({
  hasError: false,
  error: null
});

export const handleErrorBoundary = (
  error: Error,
  errorInfo: { componentStack: string }
): ErrorBoundaryState => {
  const appError = ErrorHandler.fromUnknown(error, 'React Error Boundary');
  const errorId = Math.random().toString(36).substring(2, 15);

  // Log error details
  console.error('Error Boundary caught an error:', {
    errorId,
    error: appError,
    componentStack: errorInfo.componentStack
  });

  return {
    hasError: true,
    error: appError,
    errorId
  };
};

// Async error handling
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  errorContext?: string
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await asyncFn();
    return { data, error: null };
  } catch (error) {
    const appError = ErrorHandler.fromUnknown(error, errorContext);
    console.error('Async operation failed:', appError);
    return { data: null, error: appError };
  }
};

// Enhanced retry mechanism with intelligent error handling
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  options: {
    customDelay?: (error: AppError, attempt: number) => number;
    shouldRetry?: (error: AppError, attempt: number) => boolean;
    onRetry?: (error: AppError, attempt: number) => void;
    timeout?: number;
  } = {}
): Promise<T> => {
  let lastError: AppError = ErrorHandler.createError('unknown', 'Operation failed after retries');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout if specified
      if (options.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(ErrorHandler.fromTimeout(options.timeout)), options.timeout);
        });
        return await Promise.race([operation(), timeoutPromise]);
      }

      return await operation();
    } catch (error) {
      lastError = ErrorHandler.detectNetworkError(error);

      // Check if we should retry this error
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(lastError, attempt)
        : ErrorHandler.isRetryable(lastError) && attempt < maxRetries;

      if (!shouldRetry) {
        break;
      }

      // Calculate delay
      const delay = options.customDelay
        ? options.customDelay(lastError, attempt)
        : ErrorHandler.getRetryDelay(lastError, attempt);

      // Call retry callback
      if (options.onRetry) {
        options.onRetry(lastError, attempt);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Form error utilities
export interface FormErrors<T extends Record<string, any>> {
  fieldErrors: Partial<Record<keyof T, string>>;
  generalError: string | null;
}

export const createFormErrors = <T extends Record<string, any>>(): FormErrors<T> => ({
  fieldErrors: {},
  generalError: null
});

export const addFieldError = <T extends Record<string, any>>(
  errors: FormErrors<T>,
  field: keyof T,
  message: string
): FormErrors<T> => ({
  ...errors,
  fieldErrors: { ...errors.fieldErrors, [field]: message }
});

export const setGeneralError = <T extends Record<string, any>>(
  errors: FormErrors<T>,
  message: string
): FormErrors<T> => ({
  ...errors,
  generalError: message
});

export const clearErrors = <T extends Record<string, any>>(): FormErrors<T> => createFormErrors<T>();

export const hasErrors = <T extends Record<string, any>>(errors: FormErrors<T>): boolean => {
  return !!errors.generalError || Object.keys(errors.fieldErrors).length > 0;
};

// Network status monitoring
export class NetworkMonitor {
  private static listeners: Set<(online: boolean) => void> = new Set();
  private static initialized = false;

  static init() {
    if (this.initialized) return;

    window.addEventListener('online', () => this.notifyListeners(true));
    window.addEventListener('offline', () => this.notifyListeners(false));
    this.initialized = true;
  }

  static addListener(callback: (online: boolean) => void) {
    this.init();
    this.listeners.add(callback);

    // Return cleanup function
    return () => this.listeners.delete(callback);
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static getConnectionInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }

  private static notifyListeners(online: boolean) {
    this.listeners.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }
}

// Circuit breaker pattern for failing services
export class CircuitBreaker {
  private failures = 0;
  private nextAttempt = Date.now();
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureThreshold: number;
  private recoveryTimeout: number;

  constructor(
    failureThreshold = 5,
    recoveryTimeout = 60000 // 1 minute
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw ErrorHandler.createError('network', 'Circuit breaker is open', {
          retryable: true,
          retryAfter: Math.ceil((this.nextAttempt - Date.now()) / 1000)
        });
      } else {
        this.state = 'half-open';
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.nextAttempt
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
    this.nextAttempt = Date.now();
  }
}