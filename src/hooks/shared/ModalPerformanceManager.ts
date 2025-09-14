// Phase 4: Modal Performance Management
// Optimize modal rendering and interactions

import { useRef, useCallback, useEffect, useState } from 'react';

// Modal content lazy loading system
export interface LazyModalConfig {
  preload?: boolean;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  timeout?: number;
}

export const createLazyModalLoader = <T = any>(
  loader: () => Promise<React.ComponentType<T>>,
  config: LazyModalConfig = {}
) => {
  const [component, setComponent] = useState<React.ComponentType<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadPromise = useRef<Promise<void> | null>(null);

  const load = useCallback(async () => {
    if (component || loading || loadPromise.current) {
      return loadPromise.current;
    }

    setLoading(true);
    setError(null);

    loadPromise.current = (async () => {
      try {
        const timeoutMs = config.timeout || 10000;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Modal load timeout')), timeoutMs);
        });

        const loadedComponent = await Promise.race([loader(), timeoutPromise]);
        setComponent(() => loadedComponent);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load modal'));
      } finally {
        setLoading(false);
        loadPromise.current = null;
      }
    })();

    return loadPromise.current;
  }, [loader, component, loading, config.timeout]);

  const retry = useCallback(() => {
    setError(null);
    setComponent(null);
    loadPromise.current = null;
    load();
  }, [load]);

  // Preload if configured
  useEffect(() => {
    if (config.preload) {
      load();
    }
  }, [config.preload, load]);

  return {
    component,
    loading,
    error,
    load,
    retry,
  };
};

// Modal content memoization system
export const createModalMemoization = <T extends Record<string, any>>() => {
  const cache = useRef<Map<string, { data: T; timestamp: number; component: React.ReactNode }>>(new Map());
  const maxAge = 5 * 60 * 1000; // 5 minutes
  const maxSize = 50;

  const getCacheKey = useCallback((data: T): string => {
    return JSON.stringify(data);
  }, []);

  const get = useCallback((data: T): React.ReactNode | null => {
    const key = getCacheKey(data);
    const cached = cache.current.get(key);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.component;
    }

    if (cached) {
      cache.current.delete(key);
    }

    return null;
  }, [getCacheKey, maxAge]);

  const set = useCallback((data: T, component: React.ReactNode) => {
    const key = getCacheKey(data);

    // Cleanup old entries if cache is full
    if (cache.current.size >= maxSize) {
      const entries = Array.from(cache.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, Math.floor(maxSize / 2));
      toDelete.forEach(([key]) => cache.current.delete(key));
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      component,
    });
  }, [getCacheKey, maxSize]);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  const cleanup = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of cache.current.entries()) {
      if (now - value.timestamp > maxAge) {
        cache.current.delete(key);
      }
    }
  }, [maxAge]);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    get,
    set,
    clear,
    cleanup,
    cacheSize: cache.current.size,
  };
};

// Modal state persistence system
export const createModalStatePersistence = (storageKey: string = 'modal-states') => {
  const storage = useRef(typeof window !== 'undefined' ? window.sessionStorage : null);

  const saveState = useCallback(<T>(modalId: string, data: T) => {
    if (!storage.current) return;

    try {
      const existingData = storage.current.getItem(storageKey);
      const states = existingData ? JSON.parse(existingData) : {};
      states[modalId] = {
        data,
        timestamp: Date.now(),
      };
      storage.current.setItem(storageKey, JSON.stringify(states));
    } catch (error) {
      console.warn('Failed to save modal state:', error);
    }
  }, [storageKey]);

  const loadState = useCallback(<T>(modalId: string): T | null => {
    if (!storage.current) return null;

    try {
      const existingData = storage.current.getItem(storageKey);
      if (!existingData) return null;

      const states = JSON.parse(existingData);
      const modalState = states[modalId];

      if (modalState) {
        // Check if state is not too old (1 hour)
        const maxAge = 60 * 60 * 1000;
        if (Date.now() - modalState.timestamp < maxAge) {
          return modalState.data;
        } else {
          // Remove old state
          delete states[modalId];
          storage.current.setItem(storageKey, JSON.stringify(states));
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to load modal state:', error);
      return null;
    }
  }, [storageKey]);

  const clearState = useCallback((modalId?: string) => {
    if (!storage.current) return;

    try {
      if (modalId) {
        const existingData = storage.current.getItem(storageKey);
        if (existingData) {
          const states = JSON.parse(existingData);
          delete states[modalId];
          storage.current.setItem(storageKey, JSON.stringify(states));
        }
      } else {
        storage.current.removeItem(storageKey);
      }
    } catch (error) {
      console.warn('Failed to clear modal state:', error);
    }
  }, [storageKey]);

  return {
    saveState,
    loadState,
    clearState,
  };
};

// Modal accessibility enhancements
export const createModalAccessibility = () => {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const preventBodyScroll = useCallback(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const announceModal = useCallback((message: string) => {
    // Create live region for screen readers
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';

    document.body.appendChild(liveRegion);

    // Announce the message
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  return {
    trapFocus,
    preventBodyScroll,
    announceModal,
  };
};

// Modal performance monitoring
export const createModalPerformanceMonitor = () => {
  const metrics = useRef<{
    openTimes: number[];
    closeTimes: number[];
    renderTimes: number[];
  }>({
    openTimes: [],
    closeTimes: [],
    renderTimes: [],
  });

  const startOpenTimer = useCallback(() => {
    return performance.now();
  }, []);

  const endOpenTimer = useCallback((startTime: number) => {
    const duration = performance.now() - startTime;
    metrics.current.openTimes.push(duration);

    // Keep only last 100 measurements
    if (metrics.current.openTimes.length > 100) {
      metrics.current.openTimes.shift();
    }

    return duration;
  }, []);

  const startCloseTimer = useCallback(() => {
    return performance.now();
  }, []);

  const endCloseTimer = useCallback((startTime: number) => {
    const duration = performance.now() - startTime;
    metrics.current.closeTimes.push(duration);

    if (metrics.current.closeTimes.length > 100) {
      metrics.current.closeTimes.shift();
    }

    return duration;
  }, []);

  const getAverageOpenTime = useCallback(() => {
    const times = metrics.current.openTimes;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, []);

  const getAverageCloseTime = useCallback(() => {
    const times = metrics.current.closeTimes;
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, []);

  const getPerformanceReport = useCallback(() => {
    return {
      averageOpenTime: getAverageOpenTime(),
      averageCloseTime: getAverageCloseTime(),
      totalMeasurements: metrics.current.openTimes.length,
      lastOpenTime: metrics.current.openTimes[metrics.current.openTimes.length - 1] || 0,
      lastCloseTime: metrics.current.closeTimes[metrics.current.closeTimes.length - 1] || 0,
    };
  }, [getAverageOpenTime, getAverageCloseTime]);

  return {
    startOpenTimer,
    endOpenTimer,
    startCloseTimer,
    endCloseTimer,
    getPerformanceReport,
  };
};

// Export grouped modal performance utilities
export const modalPerformanceUtils = {
  lazy: createLazyModalLoader,
  memoization: createModalMemoization,
  persistence: createModalStatePersistence,
  accessibility: createModalAccessibility,
  monitoring: createModalPerformanceMonitor,
};