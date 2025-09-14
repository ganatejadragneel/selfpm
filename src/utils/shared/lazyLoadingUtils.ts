// Phase 10: Lazy Loading and Code Splitting Utilities
// Advanced utilities for implementing efficient lazy loading and code splitting

import React, { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import type { ComponentType } from 'react';
import { performanceMonitor } from './performanceMonitoring';

// Lazy loading configuration
export interface LazyLoadingConfig {
  fallback?: React.ReactNode;
  errorBoundary?: ComponentType<{ error: Error; retry: () => void }>;
  preload?: boolean;
  delay?: number;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Code splitting utilities
export const codeSplittingUtils = {
  // Enhanced lazy component loader with error handling and preloading
  createLazyComponent: <P extends object>(
    importFunction: () => Promise<{ default: ComponentType<P> }>,
    config: LazyLoadingConfig = {}
  ) => {
    const {
      fallback = React.createElement('div', null, 'Loading...'),
      errorBoundary: ErrorBoundary,
      preload = false,
      delay = 0,
      timeout = 10000,
      retries = 2,
      retryDelay = 1000,
    } = config;

    // Enhanced import function with retry logic
    const enhancedImport = async (): Promise<{ default: ComponentType<P> }> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          performanceMonitor.startTiming('lazy_component_load');

          const importPromise = importFunction();

          // Add timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Component load timeout')), timeout);
          });

          const result = await Promise.race([importPromise, timeoutPromise]);
          performanceMonitor.endTiming('lazy_component_load');

          return result;
        } catch (error) {
          lastError = error as Error;

          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }

      throw lastError!;
    };

    const LazyComponent = lazy(() => {
      if (delay > 0) {
        return new Promise<{ default: ComponentType<P> }>(resolve => {
          setTimeout(() => {
            resolve(enhancedImport());
          }, delay);
        });
      }
      return enhancedImport();
    });

    // Preload function
    const preloadComponent = () => {
      enhancedImport().catch(() => {
        // Silently fail preloading
      });
    };

    // Auto-preload if enabled
    if (preload) {
      preloadComponent();
    }

    // Wrapper component with error boundary
    const WrappedComponent = (props: P) => {
      const [error, setError] = useState<Error | null>(null);
      const [retryCount, setRetryCount] = useState(0);

      const handleRetry = useCallback(() => {
        setError(null);
        setRetryCount(prev => prev + 1);
      }, []);

      if (error && ErrorBoundary) {
        return React.createElement(ErrorBoundary, { error, retry: handleRetry });
      }

      if (error) {
        return React.createElement('div',
          { style: { padding: '20px', textAlign: 'center', color: '#ef4444' } },
          React.createElement('p', null, 'Failed to load component'),
          React.createElement('button', {
            onClick: handleRetry,
            style: {
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            },
          }, 'Retry')
        );
      }

      return React.createElement(Suspense, { fallback },
        React.createElement(LazyComponent, { ...props, key: retryCount })
      );
    };

    WrappedComponent.preload = preloadComponent;
    WrappedComponent.displayName = `LazyComponent(Unknown)`;

    return WrappedComponent;
  },

  // Create route-based code splitting
  createRouteLoader: <P extends object>(routes: Record<string, () => Promise<{ default: ComponentType<P> }>>) => {
    const lazyRoutes = Object.entries(routes).reduce(
      (acc, [path, importFn]) => {
        acc[path] = codeSplittingUtils.createLazyComponent(importFn, {
          fallback: React.createElement('div', null, 'Loading page...'),
          preload: false,
        });
        return acc;
      },
      {} as Record<string, ComponentType<P> & { preload: () => void }>
    );

    const preloadRoute = (path: string) => {
      if (lazyRoutes[path]) {
        lazyRoutes[path].preload();
      }
    };

    const preloadMultipleRoutes = (paths: string[]) => {
      paths.forEach(preloadRoute);
    };

    return {
      routes: lazyRoutes,
      preloadRoute,
      preloadMultipleRoutes,
    };
  },

  // Create feature-based code splitting
  createFeatureLoader: <T extends Record<string, any>>(
    features: Record<string, () => Promise<T>>
  ) => {
    const loadedFeatures = new Map<string, T>();
    const loadingPromises = new Map<string, Promise<T>>();

    const loadFeature = async (featureName: string): Promise<T> => {
      // Return cached feature if already loaded
      if (loadedFeatures.has(featureName)) {
        return loadedFeatures.get(featureName)!;
      }

      // Return existing loading promise if in progress
      if (loadingPromises.has(featureName)) {
        return loadingPromises.get(featureName)!;
      }

      // Load new feature
      if (!features[featureName]) {
        throw new Error(`Feature '${featureName}' not found`);
      }

      const loadingPromise = performanceMonitor.measureApiCall(
        `feature_${featureName}`,
        features[featureName]
      );

      loadingPromises.set(featureName, loadingPromise);

      try {
        const feature = await loadingPromise;
        loadedFeatures.set(featureName, feature);
        loadingPromises.delete(featureName);
        return feature;
      } catch (error) {
        loadingPromises.delete(featureName);
        throw error;
      }
    };

    const preloadFeature = (featureName: string) => {
      loadFeature(featureName).catch(() => {
        // Silently fail preloading
      });
    };

    const isFeatureLoaded = (featureName: string): boolean => {
      return loadedFeatures.has(featureName);
    };

    const unloadFeature = (featureName: string) => {
      loadedFeatures.delete(featureName);
      loadingPromises.delete(featureName);
    };

    return {
      loadFeature,
      preloadFeature,
      isFeatureLoaded,
      unloadFeature,
      getLoadedFeatures: () => Array.from(loadedFeatures.keys()),
    };
  },
};

// Image lazy loading utilities
export const imageLazyLoadingUtils = {
  // Intersection Observer based image lazy loading
  createImageLazyLoader: (config: {
    rootMargin?: string;
    threshold?: number;
    placeholder?: string;
    errorImage?: string;
    fadeInDuration?: number;
  } = {}) => {
    const {
      rootMargin = '50px',
      threshold = 0.1,
      placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E',
      errorImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ctext y="50" font-size="14"%3EError%3C/text%3E%3C/svg%3E',
      fadeInDuration = 300,
    } = config;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const actualSrc = img.dataset.src;

            if (actualSrc && actualSrc !== img.src) {
              const tempImg = new Image();

              tempImg.onload = () => {
                img.src = actualSrc;
                img.style.opacity = '0';
                img.style.transition = `opacity ${fadeInDuration}ms ease-in-out`;

                requestAnimationFrame(() => {
                  img.style.opacity = '1';
                });

                observer.unobserve(img);
              };

              tempImg.onerror = () => {
                img.src = errorImage;
                observer.unobserve(img);
              };

              tempImg.src = actualSrc;
            }
          }
        });
      },
      { rootMargin, threshold }
    );

    const observeImage = (img: HTMLImageElement, src: string) => {
      img.src = placeholder;
      img.dataset.src = src;
      observer.observe(img);
    };

    const disconnect = () => {
      observer.disconnect();
    };

    return {
      observeImage,
      disconnect,
      observer,
    };
  },

  // React hook for image lazy loading
  useImageLazyLoading: (src: string, options: {
    placeholder?: string;
    errorImage?: string;
    rootMargin?: string;
    threshold?: number;
  } = {}) => {
    const [imageSrc, setImageSrc] = useState(options.placeholder || '');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const img = imgRef.current;
      if (!img || !src) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsLoading(true);
            setHasError(false);

            const tempImg = new Image();

            tempImg.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };

            tempImg.onerror = () => {
              setHasError(true);
              setIsLoading(false);
              if (options.errorImage) {
                setImageSrc(options.errorImage);
              }
            };

            tempImg.src = src;
            observer.unobserve(img);
          }
        },
        {
          rootMargin: options.rootMargin || '50px',
          threshold: options.threshold || 0.1,
        }
      );

      observer.observe(img);

      return () => {
        observer.disconnect();
      };
    }, [src, options.rootMargin, options.threshold, options.errorImage]);

    return {
      ref: imgRef,
      src: imageSrc,
      isLoading,
      hasError,
    };
  },
};

// Content lazy loading utilities
export const contentLazyLoadingUtils = {
  // Virtual scrolling for large lists
  useVirtualScrolling: <T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5
  ) => {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const startIndex = Math.max(visibleStart - overscan, 0);
    const endIndex = Math.min(visibleEnd + overscan, items.length - 1);

    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));

    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }, []);

    return {
      visibleItems,
      totalHeight,
      offsetY,
      handleScroll,
      scrollTop,
    };
  },

  // Infinite scrolling hook
  useInfiniteScrolling: <T>(
    loadMore: () => Promise<T[]>,
    options: {
      threshold?: number;
      hasMore?: boolean;
      isLoading?: boolean;
    } = {}
  ) => {
    const { threshold = 100, hasMore = true, isLoading = false } = options;
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const sentinel = sentinelRef.current;
      if (!sentinel || !hasMore || loading || isLoading) return;

      const observer = new IntersectionObserver(
        async ([entry]) => {
          if (entry.isIntersecting) {
            setLoading(true);
            setError(null);

            try {
              const newItems = await loadMore();
              setItems(prev => [...prev, ...newItems]);
            } catch (err) {
              setError(err as Error);
            } finally {
              setLoading(false);
            }
          }
        },
        { rootMargin: `${threshold}px` }
      );

      observer.observe(sentinel);

      return () => {
        observer.disconnect();
      };
    }, [hasMore, loading, isLoading, loadMore, threshold]);

    const reset = useCallback(() => {
      setItems([]);
      setError(null);
      setLoading(false);
    }, []);

    return {
      items,
      loading,
      error,
      sentinelRef,
      reset,
    };
  },

  // Intersection observer based content loading
  useIntersectionLoader: <T>(
    loadContent: () => Promise<T>,
    options: {
      rootMargin?: string;
      threshold?: number;
      triggerOnce?: boolean;
    } = {}
  ) => {
    const { rootMargin = '0px', threshold = 0.1, triggerOnce = true } = options;
    const [content, setContent] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasTriggered, setHasTriggered] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const element = ref.current;
      if (!element || (triggerOnce && hasTriggered)) return;

      const observer = new IntersectionObserver(
        async ([entry]) => {
          if (entry.isIntersecting && !loading) {
            setLoading(true);
            setError(null);
            setHasTriggered(true);

            try {
              const result = await loadContent();
              setContent(result);
            } catch (err) {
              setError(err as Error);
            } finally {
              setLoading(false);
            }

            if (triggerOnce) {
              observer.unobserve(element);
            }
          }
        },
        { rootMargin, threshold }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [loadContent, rootMargin, threshold, triggerOnce, hasTriggered, loading]);

    const reset = useCallback(() => {
      setContent(null);
      setError(null);
      setLoading(false);
      setHasTriggered(false);
    }, []);

    return {
      ref,
      content,
      loading,
      error,
      hasTriggered,
      reset,
    };
  },
};

// Preloading utilities
export const preloadingUtils = {
  // Preload resources on hover/focus
  createHoverPreloader: (preloadFunction: () => void, delay: number = 100) => {
    let timeoutId: NodeJS.Timeout;
    let hasPreloaded = false;

    const handleMouseEnter = () => {
      if (hasPreloaded) return;

      timeoutId = setTimeout(() => {
        preloadFunction();
        hasPreloaded = true;
      }, delay);
    };

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handleFocus = () => {
      if (hasPreloaded) return;
      preloadFunction();
      hasPreloaded = true;
    };

    return {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      hasPreloaded: () => hasPreloaded,
      reset: () => { hasPreloaded = false; },
    };
  },

  // Preload based on user behavior predictions
  createPredictivePreloader: (
    predictions: Record<string, number>, // route -> probability
    threshold: number = 0.3
  ) => {
    const preloadedRoutes = new Set<string>();

    const updatePredictions = (currentRoute: string, nextRoute: string) => {
      const key = `${currentRoute}->${nextRoute}`;
      predictions[key] = (predictions[key] || 0) + 0.1;
    };

    const getPreloadCandidates = (currentRoute: string): string[] => {
      return Object.entries(predictions)
        .filter(([key, probability]) =>
          key.startsWith(currentRoute + '->') && probability > threshold
        )
        .map(([key]) => key.split('->')[1]);
    };

    const preloadPredictedRoutes = (currentRoute: string, preloadFn: (route: string) => void) => {
      const candidates = getPreloadCandidates(currentRoute);

      candidates.forEach(route => {
        if (!preloadedRoutes.has(route)) {
          preloadFn(route);
          preloadedRoutes.add(route);
        }
      });
    };

    return {
      updatePredictions,
      getPreloadCandidates,
      preloadPredictedRoutes,
      preloadedRoutes: Array.from(preloadedRoutes),
    };
  },

  // Network-aware preloading
  createNetworkAwarePreloader: () => {
    const getNetworkInfo = () => {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        return {
          effectiveType: connection?.effectiveType || '4g',
          downlink: connection?.downlink || 10,
          rtt: connection?.rtt || 100,
          saveData: connection?.saveData || false,
        };
      }
      return null;
    };

    const shouldPreload = (): boolean => {
      const networkInfo = getNetworkInfo();
      if (!networkInfo) return true; // Default to preload if no info

      // Don't preload on save-data mode
      if (networkInfo.saveData) return false;

      // Don't preload on slow connections
      if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
        return false;
      }

      // Limit preloading on 3g
      if (networkInfo.effectiveType === '3g' && networkInfo.downlink < 1) {
        return false;
      }

      return true;
    };

    const getPreloadStrategy = (): 'aggressive' | 'moderate' | 'conservative' | 'none' => {
      const networkInfo = getNetworkInfo();
      if (!networkInfo) return 'moderate';

      if (networkInfo.saveData) return 'none';
      if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') return 'none';
      if (networkInfo.effectiveType === '3g') return 'conservative';
      if (networkInfo.effectiveType === '4g' && networkInfo.downlink > 4) return 'aggressive';

      return 'moderate';
    };

    return {
      shouldPreload,
      getPreloadStrategy,
      getNetworkInfo,
    };
  },
};