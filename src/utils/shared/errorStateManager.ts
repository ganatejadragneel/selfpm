// Phase 6: Unified Error State Management
// Standardize error handling patterns across all components

import { useState, useCallback, useRef, useEffect } from 'react';

// Error severity levels for consistent UI representation
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

// Standardized error interface
export interface AppError {
  id: string;
  message: string;
  code?: string;
  severity: ErrorSeverity;
  timestamp: number;
  context?: Record<string, any>;
  retryable?: boolean;
  actionLabel?: string;
  action?: () => void;
}

// Error normalization utilities
export const errorUtils = {
  // Convert any error-like object to AppError
  normalize: (
    error: unknown,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>
  ): AppError => {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (error instanceof Error) {
      return {
        id,
        message: error.message,
        code: error.name,
        severity,
        timestamp: Date.now(),
        context,
      };
    }

    if (typeof error === 'string') {
      return {
        id,
        message: error,
        severity,
        timestamp: Date.now(),
        context,
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return {
        id,
        message: String((error as any).message),
        code: (error as any).code || (error as any).name,
        severity,
        timestamp: Date.now(),
        context,
      };
    }

    return {
      id,
      message: 'An unexpected error occurred',
      severity,
      timestamp: Date.now(),
      context: { ...context, originalError: error },
    };
  },

  // Create retryable error
  retryable: (message: string, action: () => void, actionLabel = 'Retry'): AppError => ({
    id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    message,
    severity: ErrorSeverity.WARNING,
    timestamp: Date.now(),
    retryable: true,
    action,
    actionLabel,
  }),

  // Common error patterns
  patterns: {
    network: (context?: Record<string, any>) => errorUtils.normalize(
      'Network connection failed. Please check your internet connection.',
      ErrorSeverity.WARNING,
      { type: 'network', ...context }
    ),

    validation: (field: string, message: string) => errorUtils.normalize(
      message,
      ErrorSeverity.INFO,
      { type: 'validation', field }
    ),

    authentication: (message = 'Authentication required') => errorUtils.normalize(
      message,
      ErrorSeverity.ERROR,
      { type: 'auth' }
    ),

    permission: (resource?: string) => errorUtils.normalize(
      `You don't have permission to access${resource ? ` ${resource}` : ' this resource'}`,
      ErrorSeverity.ERROR,
      { type: 'permission', resource }
    ),

    notFound: (resource = 'resource') => errorUtils.normalize(
      `${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`,
      ErrorSeverity.WARNING,
      { type: 'not_found', resource }
    ),
  }
};

// Centralized error state hook
export const useErrorState = (options: {
  maxErrors?: number;
  autoExpire?: number; // milliseconds
  onError?: (error: AppError) => void;
} = {}) => {
  const { maxErrors = 5, autoExpire = 10000, onError } = options;
  const [errors, setErrors] = useState<AppError[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addError = useCallback((
    error: unknown,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>
  ) => {
    const normalizedError = errorUtils.normalize(error, severity, context);

    setErrors(prev => {
      const newErrors = [normalizedError, ...prev];
      // Keep only max errors
      if (newErrors.length > maxErrors) {
        newErrors.splice(maxErrors);
      }
      return newErrors;
    });

    // Auto-expire error
    if (autoExpire > 0) {
      const timeoutId = setTimeout(() => {
        removeError(normalizedError.id);
        timeoutRefs.current.delete(normalizedError.id);
      }, autoExpire);

      timeoutRefs.current.set(normalizedError.id, timeoutId);
    }

    // Call error callback
    if (onError) {
      onError(normalizedError);
    }

    return normalizedError;
  }, [maxErrors, autoExpire, onError]);

  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(err => err.id !== errorId));

    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(errorId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(errorId);
    }
  }, []);

  const clearErrors = useCallback((severity?: ErrorSeverity) => {
    if (severity) {
      setErrors(prev => prev.filter(err => err.severity !== severity));
    } else {
      setErrors([]);
      // Clear all timeouts
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    }
  }, []);

  const hasErrors = errors.length > 0;
  const hasErrorsOfSeverity = useCallback((severity: ErrorSeverity) => {
    return errors.some(err => err.severity === severity);
  }, [errors]);

  const getErrorsBySeverity = useCallback((severity: ErrorSeverity) => {
    return errors.filter(err => err.severity === severity);
  }, [errors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    errors,
    hasErrors,
    hasErrorsOfSeverity,
    getErrorsBySeverity,
    addError,
    removeError,
    clearErrors,
  };
};

// Enhanced async error handling hook
export const useAsyncErrorHandler = <T = any>() => {
  const errorState = useErrorState();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const executeAsync = useCallback(async <R = T>(
    operation: () => Promise<R>,
    options?: {
      successMessage?: string;
      errorSeverity?: ErrorSeverity;
      context?: Record<string, any>;
      onSuccess?: (result: R) => void;
      onError?: (error: AppError) => void;
    }
  ): Promise<R | null> => {
    setIsLoading(true);

    try {
      const result = await operation();
      setData(result as unknown as T);

      if (options?.successMessage) {
        // Could integrate with notification system here
        console.log(options.successMessage);
      }

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const appError = errorState.addError(
        error,
        options?.errorSeverity,
        options?.context
      );

      if (options?.onError) {
        options.onError(appError);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [errorState]);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    errorState.clearErrors();
  }, [errorState]);

  return {
    ...errorState,
    isLoading,
    data,
    executeAsync,
    reset,
  };
};

// Form-specific error handling
export const useFormErrorState = (_fieldNames?: string[]) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldError = useCallback((field: string, error: string | null) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error || '',
    }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldErrors = Object.values(fieldErrors).some(error => error);
  const getFieldError = useCallback((field: string) => fieldErrors[field] || null, [fieldErrors]);

  const handleAsyncSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: string) => void;
      clearErrorsOnSubmit?: boolean;
    }
  ): Promise<T | null> => {
    if (options?.clearErrorsOnSubmit !== false) {
      setSubmitError(null);
      clearAllFieldErrors();
    }

    setIsSubmitting(true);

    try {
      const result = await submitFn();

      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setSubmitError(errorMessage);

      if (options?.onError) {
        options.onError(errorMessage);
      }

      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [clearAllFieldErrors]);

  const reset = useCallback(() => {
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  return {
    fieldErrors,
    submitError,
    isSubmitting,
    hasFieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    setSubmitError,
    getFieldError,
    handleAsyncSubmit,
    reset,
  };
};

// Global error boundary integration
export const createErrorReporting = () => {
  const reportError = useCallback((error: Error, errorInfo?: any) => {
    const normalizedError = errorUtils.normalize(error, ErrorSeverity.CRITICAL, {
      errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });

    // Here you could integrate with error reporting services
    console.error('Error boundary caught error:', normalizedError);

    // Could send to analytics or error reporting service
    // analytics.track('error_boundary_triggered', normalizedError);

    return normalizedError;
  }, []);

  return { reportError };
};