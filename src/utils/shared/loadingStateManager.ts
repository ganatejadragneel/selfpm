// Phase 6: Unified Loading State Management
// Standardize loading patterns and provide enhanced loading states

import { useState, useCallback, useRef, useEffect } from 'react';

// Loading state types
export const LoadingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type LoadingState = typeof LoadingState[keyof typeof LoadingState];

// Loading operation metadata
export interface LoadingOperation {
  id: string;
  label: string;
  startTime: number;
  progress?: number; // 0-100
  estimatedDuration?: number; // milliseconds
  cancelable?: boolean;
  cancel?: () => void;
}

// Global loading state manager for overlapping operations
export const useGlobalLoadingState = () => {
  const [operations, setOperations] = useState<Map<string, LoadingOperation>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const startOperation = useCallback((
    id: string,
    label: string,
    options?: {
      estimatedDuration?: number;
      cancelable?: boolean;
      cancel?: () => void;
    }
  ) => {
    const operation: LoadingOperation = {
      id,
      label,
      startTime: Date.now(),
      progress: 0,
      ...options,
    };

    setOperations(prev => new Map(prev).set(id, operation));

    // Auto-progress if estimated duration provided
    if (options?.estimatedDuration) {
      const startTime = Date.now();
      const duration = options.estimatedDuration;

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(90, (elapsed / duration) * 100); // Cap at 90% until completion

        setOperations(prev => {
          const newOperations = new Map(prev);
          const currentOp = newOperations.get(id);
          if (currentOp) {
            newOperations.set(id, { ...currentOp, progress });
          }
          return newOperations;
        });

        if (progress >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      timeoutRefs.current.set(id, progressInterval);
    }

    return operation;
  }, []);

  const updateOperation = useCallback((
    id: string,
    updates: Partial<LoadingOperation>
  ) => {
    setOperations(prev => {
      const newOperations = new Map(prev);
      const existing = newOperations.get(id);
      if (existing) {
        newOperations.set(id, { ...existing, ...updates });
      }
      return newOperations;
    });
  }, []);

  const completeOperation = useCallback((id: string, success = true) => {
    // Clear any timeout/interval for this operation
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }

    // Set to 100% progress briefly before removing
    if (success) {
      updateOperation(id, { progress: 100 });

      setTimeout(() => {
        setOperations(prev => {
          const newOperations = new Map(prev);
          newOperations.delete(id);
          return newOperations;
        });
      }, 300); // Brief delay to show 100%
    } else {
      setOperations(prev => {
        const newOperations = new Map(prev);
        newOperations.delete(id);
        return newOperations;
      });
    }
  }, [updateOperation]);

  const cancelOperation = useCallback((id: string) => {
    const operation = operations.get(id);
    if (operation?.cancel) {
      operation.cancel();
    }
    completeOperation(id, false);
  }, [operations, completeOperation]);

  const isLoading = operations.size > 0;
  const loadingCount = operations.size;
  const currentOperations = Array.from(operations.values());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    isLoading,
    loadingCount,
    operations: currentOperations,
    startOperation,
    updateOperation,
    completeOperation,
    cancelOperation,
  };
};

// Enhanced loading hook with better UX patterns
export const useSmartLoadingState = (options: {
  minimumLoadingTime?: number; // Prevent flash of loading state
  delayShowLoading?: number; // Delay before showing loading for fast operations
} = {}) => {
  const { minimumLoadingTime = 500, delayShowLoading = 200 } = options;

  const [state, setState] = useState<LoadingState>(LoadingState.IDLE);
  const [showLoading, setShowLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadingStartTime = useRef<number | null>(null);
  const showLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const minimumTimeTimeout = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((estimatedDuration?: number) => {
    setState(LoadingState.LOADING);
    setProgress(0);
    loadingStartTime.current = Date.now();

    // Delay showing loading indicator for fast operations
    if (delayShowLoading > 0) {
      showLoadingTimeout.current = setTimeout(() => {
        setShowLoading(true);
      }, delayShowLoading);
    } else {
      setShowLoading(true);
    }

    // Auto-progress if duration estimated
    if (estimatedDuration) {
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(85, (elapsed / estimatedDuration) * 100);
        setProgress(newProgress);

        if (newProgress >= 85) {
          clearInterval(progressInterval);
        }
      }, 50);

      return () => clearInterval(progressInterval);
    }
  }, [delayShowLoading]);

  const completeLoading = useCallback((success = true) => {
    // Clear show loading timeout if still pending
    if (showLoadingTimeout.current) {
      clearTimeout(showLoadingTimeout.current);
      showLoadingTimeout.current = null;
    }

    const finalize = () => {
      setState(success ? LoadingState.SUCCESS : LoadingState.ERROR);
      setProgress(success ? 100 : 0);
      setShowLoading(false);

      // Reset to idle after brief success/error display
      setTimeout(() => {
        setState(LoadingState.IDLE);
        setProgress(0);
      }, success ? 300 : 2000);
    };

    // Ensure minimum loading time for better UX
    if (loadingStartTime.current && minimumLoadingTime > 0) {
      const elapsed = Date.now() - loadingStartTime.current;
      if (elapsed < minimumLoadingTime) {
        minimumTimeTimeout.current = setTimeout(finalize, minimumLoadingTime - elapsed);
      } else {
        finalize();
      }
    } else {
      finalize();
    }

    loadingStartTime.current = null;
  }, [minimumLoadingTime]);

  const setLoadingProgress = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  const reset = useCallback(() => {
    if (showLoadingTimeout.current) {
      clearTimeout(showLoadingTimeout.current);
      showLoadingTimeout.current = null;
    }
    if (minimumTimeTimeout.current) {
      clearTimeout(minimumTimeTimeout.current);
      minimumTimeTimeout.current = null;
    }

    setState(LoadingState.IDLE);
    setShowLoading(false);
    setProgress(0);
    loadingStartTime.current = null;
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showLoadingTimeout.current) {
        clearTimeout(showLoadingTimeout.current);
      }
      if (minimumTimeTimeout.current) {
        clearTimeout(minimumTimeTimeout.current);
      }
    };
  }, []);

  const isLoading = state === LoadingState.LOADING;
  const isSuccess = state === LoadingState.SUCCESS;
  const isError = state === LoadingState.ERROR;
  const isIdle = state === LoadingState.IDLE;

  return {
    state,
    isLoading,
    isSuccess,
    isError,
    isIdle,
    showLoading,
    progress,
    startLoading,
    completeLoading,
    setLoadingProgress,
    reset,
  };
};

// Skeleton loading patterns
export const skeletonPatterns = {
  // Text line skeleton
  textLine: (width = '100%'): React.CSSProperties => ({
    height: '1rem',
    width,
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  }),

  // Avatar skeleton
  avatar: (size = '40px'): React.CSSProperties => ({
    width: size,
    height: size,
    backgroundColor: '#f0f0f0',
    borderRadius: '50%',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  }),

  // Card skeleton
  card: (): React.CSSProperties => ({
    height: '120px',
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  }),

  // Button skeleton
  button: (width = '100px'): React.CSSProperties => ({
    height: '36px',
    width,
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  }),

  // Table row skeleton
  tableRow: (): React.CSSProperties => ({
    height: '48px',
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  }),
};

// Combined async operation hook with enhanced loading states
export const useAsyncOperationWithLoading = <T = any>() => {
  const loadingState = useSmartLoadingState();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <R = T>(
    operation: () => Promise<R>,
    options?: {
      estimatedDuration?: number;
      onSuccess?: (result: R) => void;
      onError?: (error: string) => void;
      successMessage?: string;
      retryCount?: number;
    }
  ): Promise<R | null> => {
    let attemptCount = 0;
    const maxAttempts = (options?.retryCount || 0) + 1;

    const attempt = async (): Promise<R | null> => {
      attemptCount++;
      setError(null);
      loadingState.startLoading(options?.estimatedDuration);

      try {
        const result = await operation();
        setData(result as unknown as T);
        loadingState.completeLoading(true);

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        if (options?.successMessage) {
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Operation failed';

        // Retry logic
        if (attemptCount < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptCount)); // Exponential backoff
          return attempt();
        }

        setError(errorMessage);
        loadingState.completeLoading(false);

        if (options?.onError) {
          options.onError(errorMessage);
        }

        return null;
      }
    };

    return attempt();
  }, [loadingState]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    loadingState.reset();
  }, [loadingState]);

  return {
    ...loadingState,
    data,
    error,
    execute,
    reset,
  };
};

// Loading state utilities
export const loadingUtils = {
  // Create consistent loading messages
  messages: {
    saving: 'Saving changes...',
    loading: 'Loading...',
    deleting: 'Deleting...',
    uploading: 'Uploading...',
    processing: 'Processing...',
    authenticating: 'Signing in...',
    fetching: (resource: string) => `Loading ${resource}...`,
    updating: (resource: string) => `Updating ${resource}...`,
    creating: (resource: string) => `Creating ${resource}...`,
  },

  // Loading state CSS classes for consistent styling
  classes: {
    loadingOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    spinner: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500',
    skeleton: 'animate-pulse bg-gray-200 rounded',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  // Duration estimates for common operations
  durations: {
    fast: 500,      // Network requests, simple saves
    medium: 2000,   // File uploads, complex operations
    slow: 5000,     // Large file operations, bulk operations
  },
};