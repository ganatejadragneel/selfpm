// Phase 10: Performance Monitoring Utilities
// Comprehensive performance monitoring and optimization tools

import { useEffect, useRef, useState, useCallback } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte

  // Custom metrics
  componentRenderTime?: number;
  bundleLoadTime?: number;
  apiResponseTime?: number;
  memoryUsage?: number;

  // User interaction metrics
  userInteractionDelay?: number;
  formSubmissionTime?: number;
  navigationTime?: number;

  // Bundle metrics
  totalBundleSize?: number;
  initialChunkSize?: number;
  lazyChunkSizes?: Record<string, number>;
}

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  componentRender: { good: 16, needsImprovement: 50 },
  apiResponse: { good: 200, needsImprovement: 1000 },
  bundleSize: { good: 244 * 1024, needsImprovement: 488 * 1024 }, // KB
} as const;

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTimes: Map<string, number> = new Map();

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Core Web Vitals observer
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // LCP observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries[entries.length - 1] as any;
          this.metrics.lcp = lcpEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // FID observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.metrics.fid = (entry as any).processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // CLS observer
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cls = clsValue;
            }
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Navigation timing
      this.measureNavigationTiming();
    }
  }

  private measureNavigationTiming() {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;
      this.metrics.fcp = timing.domContentLoadedEventEnd - timing.navigationStart;
    }
  }

  // Start timing a custom metric
  startTiming(key: string) {
    this.startTimes.set(key, performance.now());
  }

  // End timing and record metric
  endTiming(key: string): number {
    const startTime = this.startTimes.get(key);
    if (startTime) {
      const duration = performance.now() - startTime;
      (this.metrics as any)[key] = duration;
      this.startTimes.delete(key);
      return duration;
    }
    return 0;
  }

  // Measure component render time
  measureComponentRender<T extends any[]>(
    componentName: string,
    renderFunction: (...args: T) => any
  ) {
    return (...args: T) => {
      this.startTiming(`${componentName}_render`);
      const result = renderFunction(...args);
      this.endTiming(`${componentName}_render`);
      return result;
    };
  }

  // Measure API call performance
  async measureApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    this.startTiming(`${apiName}_api`);
    try {
      const result = await apiCall();
      this.endTiming(`${apiName}_api`);
      return result;
    } catch (error) {
      this.endTiming(`${apiName}_api`);
      throw error;
    }
  }

  // Get current memory usage
  getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return undefined;
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Check if metric is within good threshold
  isMetricGood(metric: keyof typeof PERFORMANCE_THRESHOLDS, value: number): boolean {
    const threshold = PERFORMANCE_THRESHOLDS[metric];
    return threshold ? value <= threshold.good : true;
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const scores: number[] = [];

    if (this.metrics.lcp) {
      scores.push(this.isMetricGood('lcp', this.metrics.lcp) ? 100 :
        this.metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp.needsImprovement ? 50 : 0);
    }

    if (this.metrics.fid) {
      scores.push(this.isMetricGood('fid', this.metrics.fid) ? 100 :
        this.metrics.fid <= PERFORMANCE_THRESHOLDS.fid.needsImprovement ? 50 : 0);
    }

    if (this.metrics.cls) {
      scores.push(this.isMetricGood('cls', this.metrics.cls) ? 100 :
        this.metrics.cls <= PERFORMANCE_THRESHOLDS.cls.needsImprovement ? 50 : 0);
    }

    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hooks for performance monitoring
export const usePerformanceMonitoring = {
  // Hook for monitoring component render performance
  useRenderPerformance: (componentName: string) => {
    const renderCountRef = useRef(0);
    const [renderTime, setRenderTime] = useState<number>(0);

    useEffect(() => {
      renderCountRef.current += 1;
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        setRenderTime(duration);

        if (duration > PERFORMANCE_THRESHOLDS.componentRender.needsImprovement) {
          console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
        }
      };
    });

    return {
      renderTime,
      renderCount: renderCountRef.current,
    };
  },

  // Hook for monitoring API call performance
  useApiPerformance: () => {
    const [apiMetrics, setApiMetrics] = useState<Record<string, number>>({});

    const measureApiCall = useCallback(async <T>(
      apiName: string,
      apiCall: () => Promise<T>
    ): Promise<T> => {
      const result = await performanceMonitor.measureApiCall(apiName, apiCall);
      const metrics = performanceMonitor.getMetrics();
      const apiTime = metrics[`${apiName}_api` as keyof PerformanceMetrics] as number;

      setApiMetrics(prev => ({
        ...prev,
        [apiName]: apiTime,
      }));

      return result;
    }, []);

    return {
      apiMetrics,
      measureApiCall,
    };
  },

  // Hook for monitoring memory usage
  useMemoryMonitoring: (interval: number = 5000) => {
    const [memoryUsage, setMemoryUsage] = useState<number | undefined>();

    useEffect(() => {
      const updateMemoryUsage = () => {
        const usage = performanceMonitor.getMemoryUsage();
        setMemoryUsage(usage);
      };

      updateMemoryUsage();
      const intervalId = setInterval(updateMemoryUsage, interval);

      return () => clearInterval(intervalId);
    }, [interval]);

    return memoryUsage;
  },

  // Hook for monitoring user interactions
  useInteractionMonitoring: () => {
    const [interactionMetrics, setInteractionMetrics] = useState<{
      clickDelay: number[];
      formSubmissionTime: number[];
      navigationTime: number[];
    }>({
      clickDelay: [],
      formSubmissionTime: [],
      navigationTime: [],
    });

    const measureClick = useCallback((callback: () => void) => {
      return (_event: React.MouseEvent) => {
        const startTime = performance.now();
        callback();
        const endTime = performance.now();
        const delay = endTime - startTime;

        setInteractionMetrics(prev => ({
          ...prev,
          clickDelay: [...prev.clickDelay.slice(-9), delay],
        }));
      };
    }, []);

    const measureFormSubmission = useCallback(async (
      submitFunction: () => Promise<void>
    ) => {
      const startTime = performance.now();
      await submitFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;

      setInteractionMetrics(prev => ({
        ...prev,
        formSubmissionTime: [...prev.formSubmissionTime.slice(-9), duration],
      }));
    }, []);

    return {
      interactionMetrics,
      measureClick,
      measureFormSubmission,
    };
  },

  // Hook for overall performance monitoring
  useOverallPerformance: () => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({});
    const [performanceScore, setPerformanceScore] = useState<number>(0);

    useEffect(() => {
      const updateMetrics = () => {
        const currentMetrics = performanceMonitor.getMetrics();
        const score = performanceMonitor.getPerformanceScore();

        setMetrics(currentMetrics);
        setPerformanceScore(score);
      };

      updateMetrics();
      const intervalId = setInterval(updateMetrics, 2000);

      return () => clearInterval(intervalId);
    }, []);

    return {
      metrics,
      performanceScore,
      isGoodPerformance: performanceScore >= 75,
      needsImprovement: performanceScore < 50,
    };
  },
};

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T => {
    let timeout: NodeJS.Timeout | null;
    return ((...args: any[]) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    }) as T;
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Memoization with performance tracking
  memoizeWithPerf: <T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T & { cache: Map<string, any>; hits: number; misses: number } => {
    const cache = new Map();
    let hits = 0;
    let misses = 0;

    const memoized = ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      if (cache.has(key)) {
        hits++;
        return cache.get(key);
      }

      misses++;
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T & { cache: Map<string, any>; hits: number; misses: number };

    memoized.cache = cache;
    Object.defineProperty(memoized, 'hits', { get: () => hits });
    Object.defineProperty(memoized, 'misses', { get: () => misses });

    return memoized;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  },

  // Check connection quality
  getConnectionQuality: (): 'slow' | 'fast' | 'unknown' => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === '4g') return 'fast';
        if (connection.effectiveType === '3g') return 'fast';
        if (connection.effectiveType === '2g') return 'slow';
        if (connection.effectiveType === 'slow-2g') return 'slow';
      }
    }
    return 'unknown';
  },

  // Optimize images for performance
  createOptimizedImageLoader: (baseUrl?: string) => {
    return (src: string, width?: number, quality: number = 75): string => {
      if (!src) return '';

      // If it's already optimized or external, return as-is
      if (src.includes('?') || src.startsWith('http')) {
        return src;
      }

      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      params.set('q', quality.toString());

      const optimizedSrc = `${baseUrl || ''}${src}${params.toString() ? '?' + params.toString() : ''}`;
      return optimizedSrc;
    };
  },

  // Measure bundle impact
  measureBundleImpact: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigationEntries = performance.getEntriesByType('navigation')[0] as any;
      const resourceEntries = performance.getEntriesByType('resource');

      const bundleSize = resourceEntries
        .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
        .reduce((total, entry) => total + (entry as any).transferSize || 0, 0);

      return {
        totalBundleSize: bundleSize,
        loadTime: navigationEntries?.loadEventEnd - navigationEntries?.navigationStart || 0,
        domContentLoaded: navigationEntries?.domContentLoadedEventEnd - navigationEntries?.navigationStart || 0,
        resourceCount: resourceEntries.length,
      };
    }
    return null;
  },

  // Performance budget checker
  checkPerformanceBudget: (budget: {
    maxBundleSize?: number; // bytes
    maxLCP?: number; // ms
    maxFID?: number; // ms
    maxCLS?: number;
  }) => {
    const metrics = performanceMonitor.getMetrics();
    const bundleImpact = performanceUtils.measureBundleImpact();
    const violations: string[] = [];

    if (budget.maxBundleSize && bundleImpact && bundleImpact.totalBundleSize > budget.maxBundleSize) {
      violations.push(`Bundle size exceeds budget: ${bundleImpact.totalBundleSize} > ${budget.maxBundleSize}`);
    }

    if (budget.maxLCP && metrics.lcp && metrics.lcp > budget.maxLCP) {
      violations.push(`LCP exceeds budget: ${metrics.lcp} > ${budget.maxLCP}`);
    }

    if (budget.maxFID && metrics.fid && metrics.fid > budget.maxFID) {
      violations.push(`FID exceeds budget: ${metrics.fid} > ${budget.maxFID}`);
    }

    if (budget.maxCLS && metrics.cls && metrics.cls > budget.maxCLS) {
      violations.push(`CLS exceeds budget: ${metrics.cls} > ${budget.maxCLS}`);
    }

    return {
      passed: violations.length === 0,
      violations,
      metrics,
      bundleImpact,
    };
  },
};