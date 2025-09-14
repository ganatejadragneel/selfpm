// Phase 5: Hook Composition and Standardization Patterns
// Advanced hook patterns that work alongside existing hooks

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';

// Hook composition utilities for common patterns
export interface ComposedHookState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Create composed hook state manager
export const createComposedHookState = <T = any>(initialData: T | null = null) => {
  const [state, setState] = useState<ComposedHookState<T>>({
    data: initialData,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const setLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      loading: false,
      error: null,
      lastUpdated: Date.now(),
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      lastUpdated: null,
    });
  }, [initialData]);

  return {
    state,
    setLoading,
    setData,
    setError,
    reset,
  };
};

// Cross-hook state sharing utility
export const createHookStateShare = <T extends Record<string, any>>() => {
  const sharedState = useRef<Partial<T>>({});
  const listeners = useRef<Map<string, Set<(value: any) => void>>>(new Map());

  const subscribe = useCallback(<K extends keyof T>(
    key: K,
    callback: (value: T[K]) => void
  ) => {
    const keyStr = String(key);
    if (!listeners.current.has(keyStr)) {
      listeners.current.set(keyStr, new Set());
    }
    listeners.current.get(keyStr)!.add(callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = listeners.current.get(keyStr);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          listeners.current.delete(keyStr);
        }
      }
    };
  }, []);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    sharedState.current[key] = value;
    const keyStr = String(key);
    const keyListeners = listeners.current.get(keyStr);
    if (keyListeners) {
      keyListeners.forEach(callback => callback(value));
    }
  }, []);

  const getValue = useCallback(<K extends keyof T>(key: K): T[K] | undefined => {
    return sharedState.current[key];
  }, []);

  const clearValue = useCallback(<K extends keyof T>(key: K) => {
    delete sharedState.current[key];
    const keyStr = String(key);
    const keyListeners = listeners.current.get(keyStr);
    if (keyListeners) {
      keyListeners.forEach(callback => callback(undefined));
    }
  }, []);

  return {
    subscribe,
    setValue,
    getValue,
    clearValue,
  };
};

// Hook lifecycle management
export const createHookLifecycle = () => {
  const mountedRef = useRef(false);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Run all cleanup functions
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
  }, []);

  const isMounted = useCallback(() => mountedRef.current, []);

  const safeSetState = useCallback(<T>(
    setter: (value: T) => void,
    value: T
  ) => {
    if (mountedRef.current) {
      setter(value);
    }
  }, []);

  return {
    isMounted,
    addCleanup,
    safeSetState,
  };
};

// Computed state hooks (memoized derivations)
export const createComputedState = <T, R>(
  dependencies: T[],
  computeFn: (deps: T[]) => R,
  isEqual?: (a: R, b: R) => boolean
) => {
  const previousDeps = useRef<T[]>([]);
  const previousResult = useRef<R | undefined>(undefined);
  const hasComputed = useRef(false);

  return useMemo(() => {
    // Check if dependencies changed
    const depsChanged = dependencies.length !== previousDeps.current.length ||
      dependencies.some((dep, index) => dep !== previousDeps.current[index]);

    if (!hasComputed.current || depsChanged) {
      const newResult = computeFn(dependencies);

      // Check if result actually changed (if equality function provided)
      if (isEqual && hasComputed.current && previousResult.current !== undefined) {
        if (!isEqual(newResult, previousResult.current)) {
          previousResult.current = newResult;
        }
      } else {
        previousResult.current = newResult;
      }

      previousDeps.current = [...dependencies];
      hasComputed.current = true;
    }

    return previousResult.current as R;
  }, dependencies);
};

// Selective re-render hook
export const createSelectiveRenderer = <T extends Record<string, any>>(
  state: T,
  selector: (state: T) => any[]
) => {
  const selectedValues = selector(state);
  const previousValues = useRef(selectedValues);

  const hasChanged = useMemo(() => {
    const changed = selectedValues.length !== previousValues.current.length ||
      selectedValues.some((value, index) => value !== previousValues.current[index]);

    if (changed) {
      previousValues.current = selectedValues;
    }

    return changed;
  }, selectedValues);

  // Force re-render only when selected values change
  const [, forceRender] = useState<object>({});
  const triggerRender = useCallback(() => {
    forceRender({});
  }, []);

  useEffect(() => {
    if (hasChanged) {
      triggerRender();
    }
  }, [hasChanged, triggerRender]);

  return selectedValues;
};

// Hook error boundary integration
export const createHookErrorHandler = () => {
  const [error, setError] = useState<Error | null>(null);
  const errorRef = useRef<Error | null>(null);

  const captureError = useCallback((error: Error | unknown) => {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    errorRef.current = normalizedError;
    setError(normalizedError);
  }, []);

  const clearError = useCallback(() => {
    errorRef.current = null;
    setError(null);
  }, []);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        captureError(error);
        return null;
      }
    };
  }, [captureError]);

  return {
    error,
    captureError,
    clearError,
    withErrorHandling,
  };
};

// Hook performance optimization utilities
export const createHookOptimization = () => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    lastRenderTime.current = performance.now();
  });

  const memoizedCallback = useCallback(<T extends any[], R>(
    callback: (...args: T) => R,
    deps: React.DependencyList
  ) => {
    return useCallback(callback, deps);
  }, []);

  const memoizedValue = useCallback(<T>(
    factory: () => T,
    deps: React.DependencyList
  ) => {
    return useMemo(factory, deps);
  }, []);

  const stableCallback = useCallback(<T extends any[], R>(
    callback: (...args: T) => R
  ) => {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    return useCallback((...args: T) => {
      return callbackRef.current(...args);
    }, []);
  }, []);

  const getRenderStats = useCallback(() => {
    return {
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
      averageRenderInterval: renderCount.current > 1
        ? (performance.now() - lastRenderTime.current) / renderCount.current
        : 0,
    };
  }, []);

  return {
    memoizedCallback,
    memoizedValue,
    stableCallback,
    getRenderStats,
  };
};

// Hook state synchronization
export const createHookSync = <T>() => {
  const syncedState = useRef<T | undefined>(undefined);
  const syncListeners = useRef<Set<(state: T) => void>>(new Set());

  const syncState = useCallback((state: T) => {
    syncedState.current = state;
    syncListeners.current.forEach(listener => listener(state));
  }, []);

  const subscribeTo = useCallback((listener: (state: T) => void) => {
    syncListeners.current.add(listener);

    // Send current state if available
    if (syncedState.current !== undefined) {
      listener(syncedState.current);
    }

    return () => {
      syncListeners.current.delete(listener);
    };
  }, []);

  const getCurrentState = useCallback(() => {
    return syncedState.current;
  }, []);

  return {
    syncState,
    subscribeTo,
    getCurrentState,
  };
};

// Export grouped hook composition utilities
export const hookCompositionUtils = {
  state: createComposedHookState,
  share: createHookStateShare,
  lifecycle: createHookLifecycle,
  computed: createComputedState,
  selective: createSelectiveRenderer,
  errors: createHookErrorHandler,
  optimization: createHookOptimization,
  sync: createHookSync,
};