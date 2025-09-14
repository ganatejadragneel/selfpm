// Phase 3: Async State Management Utilities
// Standardize loading, error, and async patterns across components

import { useState, useCallback, useRef, useEffect } from 'react';

// Async state interface for consistent usage
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Initial async state factory
export const createAsyncState = <T = any>(initialData: T | null = null): AsyncState<T> => ({
  data: initialData,
  loading: false,
  error: null,
});

// Loading state utilities
export const loadingUtils = {
  // Set loading state
  setLoading: <T>(state: AsyncState<T>): AsyncState<T> => ({
    ...state,
    loading: true,
    error: null,
  }),

  // Set success state
  setSuccess: <T>(state: AsyncState<T>, data: T): AsyncState<T> => ({
    ...state,
    data,
    loading: false,
    error: null,
  }),

  // Set error state
  setError: <T>(state: AsyncState<T>, error: string): AsyncState<T> => ({
    ...state,
    loading: false,
    error,
  }),

  // Reset state
  reset: <T>(initialData: T | null = null): AsyncState<T> =>
    createAsyncState(initialData),
};

// Hook for async operations with consistent state management
export const useAsyncOperation = <T = any>(initialData: T | null = null) => {
  const [state, setState] = useState<AsyncState<T>>(createAsyncState(initialData));

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(current => loadingUtils.setLoading(current));

    try {
      const result = await operation();
      setState(current => loadingUtils.setSuccess(current, result));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(current => loadingUtils.setError(current, errorMessage));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState(loadingUtils.reset(initialData));
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
};

// Debounce utility
export const createDebouncer = (delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;

  return <T extends any[]>(fn: (...args: T) => void) => {
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };
};

// Throttle utility
export const createThrottler = (delay: number = 300) => {
  let lastRun = 0;

  return <T extends any[]>(fn: (...args: T) => void) => {
    return (...args: T) => {
      if (Date.now() - lastRun >= delay) {
        fn(...args);
        lastRun = Date.now();
      }
    };
  };
};

// Hook for debounced values
export const useDebounced = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttled callbacks
export const useThrottled = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number = 300
) => {
  const lastRun = useRef(0);

  return useCallback((...args: T) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Cleanup utilities for effects
export const cleanupUtils = {
  // Create cleanup function for timeouts
  timeout: (id: NodeJS.Timeout) => () => clearTimeout(id),

  // Create cleanup function for intervals
  interval: (id: NodeJS.Timeout) => () => clearInterval(id),

  // Create cleanup function for event listeners
  eventListener: (element: Element, event: string, handler: EventListener) => () => {
    element.removeEventListener(event, handler);
  },

  // Create cleanup function for abort controllers
  abortController: (controller: AbortController) => () => controller.abort(),
};

// Error normalization utilities
export const errorUtils = {
  // Normalize error to string message
  normalize: (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'An unknown error occurred';
  },

  // Create user-friendly error messages
  friendly: (error: unknown): string => {
    const message = errorUtils.normalize(error);

    // Common error mappings
    if (message.includes('Network Error') || message.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Please log in to continue.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }
    if (message.includes('404') || message.includes('Not Found')) {
      return 'The requested item could not be found.';
    }
    if (message.includes('500') || message.includes('Internal Server')) {
      return 'Server error. Please try again later.';
    }

    return message;
  },

  // Check if error is a specific type
  isNetworkError: (error: unknown): boolean => {
    const message = errorUtils.normalize(error);
    return message.includes('Network Error') || message.includes('fetch');
  },

  isAuthError: (error: unknown): boolean => {
    const message = errorUtils.normalize(error);
    return message.includes('401') || message.includes('Unauthorized');
  },
};

// Success state utilities
export const successUtils = {
  // Create success message with auto-dismiss
  createToast: (message: string, duration: number = 3000) => ({
    message,
    type: 'success' as const,
    duration,
    timestamp: Date.now(),
  }),

  // Common success messages
  messages: {
    saved: 'Changes saved successfully',
    created: 'Item created successfully',
    updated: 'Item updated successfully',
    deleted: 'Item deleted successfully',
    uploaded: 'File uploaded successfully',
  },
};

// Export grouped utilities
export const asyncStateUtils = {
  state: loadingUtils,
  debounce: createDebouncer,
  throttle: createThrottler,
  cleanup: cleanupUtils,
  error: errorUtils,
  success: successUtils,
  hooks: {
    useAsyncOperation,
    useDebounced,
    useThrottled,
  },
};