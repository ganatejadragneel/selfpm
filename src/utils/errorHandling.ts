// Centralized error handling utilities

export interface AppError {
  type: 'validation' | 'network' | 'auth' | 'permission' | 'not_found' | 'server' | 'unknown';
  message: string;
  details?: string;
  field?: string;
  code?: string | number;
  timestamp: Date;
}

export class ErrorHandler {
  static createError(
    type: AppError['type'],
    message: string,
    options: Partial<Pick<AppError, 'details' | 'field' | 'code'>> = {}
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

  static fromNetwork(message = 'Network error occurred'): AppError {
    return this.createError('network', message);
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
    return error.type === 'network' || error.type === 'server';
  }

  static getErrorIcon(error: AppError): string {
    switch (error.type) {
      case 'validation':
        return '⚠️';
      case 'network':
        return '🌐';
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

// Retry mechanism for network operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error = new Error('Operation failed after retries');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
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