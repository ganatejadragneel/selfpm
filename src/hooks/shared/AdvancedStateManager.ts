// Phase 5: Advanced State Management Hooks
// Optimized state patterns for the 206 hook instances found in components

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { asyncStateUtils } from '../../utils/shared';

// Advanced async state hook with caching and deduplication
export const useOptimizedAsyncState = <T = any>(
  key?: string,
  cacheTTL: number = 5 * 60 * 1000 // 5 minutes default
) => {
  const cache = useRef<Map<string, { data: T; timestamp: number; promise?: Promise<T> }>>(new Map());
  const loadingUtils = asyncStateUtils.state;
  const [asyncState, setAsyncState] = useState(() => loadingUtils.reset<T>());

  const execute = useCallback(async (
    asyncFn: () => Promise<T>,
    cacheKey: string = key || 'default'
  ): Promise<T | null> => {
    // Check cache first
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      setAsyncState(current => loadingUtils.setSuccess(current, cached.data));
      return cached.data;
    }

    // Check if request is already in flight
    if (cached?.promise) {
      try {
        const result = await cached.promise;
        return result;
      } catch (error) {
        // Let it fall through to new request
      }
    }

    setAsyncState(current => loadingUtils.setLoading(current));

    try {
      const promise = asyncFn();

      // Store promise to prevent duplicate requests
      if (cache.current.has(cacheKey)) {
        cache.current.get(cacheKey)!.promise = promise;
      } else {
        cache.current.set(cacheKey, { data: undefined as any, timestamp: 0, promise });
      }

      const result = await promise;

      // Update cache
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      setAsyncState(current => loadingUtils.setSuccess(current, result));
      return result;
    } catch (error) {
      const errorMessage = asyncStateUtils.error.normalize(error);
      setAsyncState(current => loadingUtils.setError(current, errorMessage));
      return null;
    }
  }, [key, cacheTTL, loadingUtils]);

  const clearCache = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      cache.current.delete(cacheKey);
    } else {
      cache.current.clear();
    }
  }, []);

  const invalidateCache = useCallback((cacheKey: string = key || 'default') => {
    cache.current.delete(cacheKey);
  }, [key]);

  return {
    ...asyncState,
    execute,
    clearCache,
    invalidateCache,
  };
};

// Optimized state selector hook for large objects
export const useStateSelector = <T extends Record<string, any>, R>(
  state: T,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): R => {
  const selectedValue = selector(state);
  const previousValue = useRef<R | undefined>(undefined);
  const hasInitialized = useRef(false);

  return useMemo(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousValue.current = selectedValue;
      return selectedValue;
    }

    const isEqual = equalityFn
      ? equalityFn(selectedValue, previousValue.current!)
      : selectedValue === previousValue.current;

    if (!isEqual) {
      previousValue.current = selectedValue;
    }

    return previousValue.current!;
  }, [selectedValue, equalityFn]);
};

// Debounced state hook with immediate and delayed values
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] => {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [immediateValue, debouncedValue, setValue];
};

// Computed state with dependency tracking
export const useComputedState = <T extends any[], R>(
  dependencies: T,
  computeFn: (deps: T) => R,
  options: {
    equalityFn?: (a: R, b: R) => boolean;
    debug?: boolean;
  } = {}
): R => {
  const { equalityFn, debug } = options;
  const computeCount = useRef(0);
  const lastCompute = useRef<number>(0);

  return useMemo(() => {
    const start = performance.now();
    const result = computeFn(dependencies);
    const end = performance.now();

    computeCount.current += 1;
    lastCompute.current = end - start;

    if (debug) {
      console.log(`Computed state #${computeCount.current} took ${lastCompute.current.toFixed(2)}ms`);
    }

    return result;
  }, equalityFn ? [JSON.stringify(dependencies)] : [...dependencies]);
};

// Multi-state manager for complex forms
export const useMultiState = <T extends Record<string, any>>(
  initialState: T
) => {
  const [state, setState] = useState<T>(initialState);
  const stateRef = useRef<T>(initialState);

  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K] | ((prev: T[K]) => T[K])
  ) => {
    setState(current => ({
      ...current,
      [field]: typeof value === 'function'
        ? (value as (prev: T[K]) => T[K])(current[field])
        : value,
    }));
  }, []);

  const setFields = useCallback((
    updates: Partial<T> | ((current: T) => Partial<T>)
  ) => {
    setState(current => ({
      ...current,
      ...(typeof updates === 'function' ? updates(current) : updates),
    }));
  }, []);

  const resetField = useCallback(<K extends keyof T>(field: K) => {
    setState(current => ({
      ...current,
      [field]: initialState[field],
    }));
  }, [initialState]);

  const resetAll = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const getField = useCallback(<K extends keyof T>(field: K): T[K] => {
    return stateRef.current[field];
  }, []);

  const validateField = useCallback(<K extends keyof T>(
    field: K,
    validator: (value: T[K]) => string | null
  ): string | null => {
    return validator(stateRef.current[field]);
  }, []);

  return {
    state,
    setField,
    setFields,
    resetField,
    resetAll,
    getField,
    validateField,
  };
};

// Persistent state hook with localStorage/sessionStorage
export const usePersistentState = <T>(
  key: string,
  defaultValue: T,
  storage: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, (value: T | ((prev: T) => T)) => void, () => void] => {
  const storageObject = typeof window !== 'undefined'
    ? (storage === 'localStorage' ? window.localStorage : window.sessionStorage)
    : null;

  const [state, setState] = useState<T>(() => {
    if (!storageObject) return defaultValue;

    try {
      const item = storageObject.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse stored value for key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(current => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(current) : value;

      if (storageObject) {
        try {
          storageObject.setItem(key, JSON.stringify(newValue));
        } catch (error) {
          console.warn(`Failed to store value for key "${key}":`, error);
        }
      }

      return newValue;
    });
  }, [key, storageObject]);

  const clearValue = useCallback(() => {
    setState(defaultValue);
    if (storageObject) {
      try {
        storageObject.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove stored value for key "${key}":`, error);
      }
    }
  }, [key, defaultValue, storageObject]);

  return [state, setValue, clearValue];
};

// State machine hook for complex state transitions
export const useStateMachine = <
  TState extends string,
  TEvent extends string,
  TContext extends Record<string, any> = {}
>(
  initialState: TState,
  initialContext: TContext,
  transitions: Record<TState, Record<TEvent, {
    target: TState;
    action?: (context: TContext, event?: any) => TContext;
    guard?: (context: TContext, event?: any) => boolean;
  }>>
) => {
  const [current, setCurrent] = useState<{
    state: TState;
    context: TContext;
  }>({
    state: initialState,
    context: initialContext,
  });

  const send = useCallback((event: TEvent, eventData?: any) => {
    setCurrent(({ state, context }) => {
      const stateTransitions = transitions[state];
      if (!stateTransitions || !stateTransitions[event]) {
        console.warn(`No transition defined for event "${event}" in state "${state}"`);
        return { state, context };
      }

      const transition = stateTransitions[event];

      // Check guard condition
      if (transition.guard && !transition.guard(context, eventData)) {
        return { state, context };
      }

      // Execute action and get new context
      const newContext = transition.action
        ? transition.action(context, eventData)
        : context;

      return {
        state: transition.target,
        context: newContext,
      };
    });
  }, [transitions]);

  const can = useCallback((event: TEvent): boolean => {
    const stateTransitions = transitions[current.state];
    return !!(stateTransitions && stateTransitions[event]);
  }, [current.state, transitions]);

  const reset = useCallback(() => {
    setCurrent({
      state: initialState,
      context: initialContext,
    });
  }, [initialState, initialContext]);

  return {
    state: current.state,
    context: current.context,
    send,
    can,
    reset,
  };
};

// Export grouped advanced state utilities
export const advancedStateUtils = {
  asyncState: useOptimizedAsyncState,
  selector: useStateSelector,
  debounced: useDebouncedState,
  computed: useComputedState,
  multiState: useMultiState,
  persistent: usePersistentState,
  stateMachine: useStateMachine,
};