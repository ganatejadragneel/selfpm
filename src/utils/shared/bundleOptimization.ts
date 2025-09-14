// Phase 10: Bundle Analysis and Optimization Tools
// Comprehensive tools for analyzing and optimizing bundle size and performance

import { performanceMonitor } from './performanceMonitoring';

// Bundle analysis interfaces
export interface BundleChunk {
  name: string;
  size: number;
  gzipSize: number;
  modules: string[];
  dependencies: string[];
  isAsync: boolean;
  isEntry: boolean;
}

export interface BundleAnalysis {
  chunks: BundleChunk[];
  totalSize: number;
  totalGzipSize: number;
  duplicateModules: Array<{
    module: string;
    chunks: string[];
    duplicatedSize: number;
  }>;
  largeModules: Array<{
    module: string;
    size: number;
    chunk: string;
  }>;
  unusedExports: Array<{
    module: string;
    exports: string[];
  }>;
  recommendations: BundleRecommendation[];
}

export interface BundleRecommendation {
  type: 'split' | 'lazy' | 'tree-shake' | 'vendor' | 'preload' | 'compress';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  modules?: string[];
}

// Bundle optimization utilities
export const bundleOptimizationUtils = {
  // Analyze webpack/vite stats
  analyzeWebpackStats: (stats: any): BundleAnalysis => {
    const chunks: BundleChunk[] = [];
    const moduleMap = new Map<string, Set<string>>();
    const duplicateModules: Array<{ module: string; chunks: string[]; duplicatedSize: number }> = [];
    const largeModules: Array<{ module: string; size: number; chunk: string }> = [];

    // Process chunks
    stats.chunks?.forEach((chunk: any) => {
      const chunkModules = chunk.modules || [];
      const chunkDeps = chunk.children || [];

      chunks.push({
        name: chunk.names?.[0] || chunk.id,
        size: chunk.size || 0,
        gzipSize: Math.floor((chunk.size || 0) * 0.3), // Estimated gzip
        modules: chunkModules.map((m: any) => m.name || m.identifier),
        dependencies: chunkDeps,
        isAsync: !chunk.initial,
        isEntry: chunk.entry || false,
      });

      // Track modules for duplicate detection
      chunkModules.forEach((module: any) => {
        const moduleName = module.name || module.identifier;
        if (!moduleMap.has(moduleName)) {
          moduleMap.set(moduleName, new Set());
        }
        moduleMap.get(moduleName)!.add(chunk.names?.[0] || chunk.id);

        // Track large modules
        if (module.size > 50000) { // > 50KB
          largeModules.push({
            module: moduleName,
            size: module.size,
            chunk: chunk.names?.[0] || chunk.id,
          });
        }
      });
    });

    // Find duplicate modules
    moduleMap.forEach((chunks, moduleName) => {
      if (chunks.size > 1) {
        duplicateModules.push({
          module: moduleName,
          chunks: Array.from(chunks),
          duplicatedSize: chunks.size * 10000, // Estimated
        });
      }
    });

    const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);
    const totalGzipSize = chunks.reduce((total, chunk) => total + chunk.gzipSize, 0);

    // Generate recommendations
    const recommendations = bundleOptimizationUtils.generateRecommendations({
      chunks,
      totalSize,
      totalGzipSize,
      duplicateModules,
      largeModules,
      unusedExports: [], // Would need additional analysis
    });

    return {
      chunks,
      totalSize,
      totalGzipSize,
      duplicateModules,
      largeModules,
      unusedExports: [],
      recommendations,
    };
  },

  // Generate optimization recommendations
  generateRecommendations: (analysis: Partial<BundleAnalysis>): BundleRecommendation[] => {
    const recommendations: BundleRecommendation[] = [];

    // Large bundle warning
    if (analysis.totalSize && analysis.totalSize > 500000) { // > 500KB
      recommendations.push({
        type: 'split',
        severity: 'high',
        title: 'Large Main Bundle',
        description: 'Consider splitting your main bundle into smaller chunks',
        estimatedSavings: Math.floor(analysis.totalSize * 0.3),
      });
    }

    // Duplicate modules
    if (analysis.duplicateModules && analysis.duplicateModules.length > 0) {
      const totalDuplication = analysis.duplicateModules.reduce(
        (total, dup) => total + dup.duplicatedSize,
        0
      );

      recommendations.push({
        type: 'vendor',
        severity: 'high',
        title: 'Duplicate Modules Detected',
        description: `${analysis.duplicateModules.length} modules are duplicated across chunks`,
        estimatedSavings: totalDuplication,
        modules: analysis.duplicateModules.map(d => d.module),
      });
    }

    // Large modules that could be lazy loaded
    if (analysis.largeModules && analysis.largeModules.length > 0) {
      const lazyLoadCandidates = analysis.largeModules.filter(m =>
        !m.module.includes('polyfill') &&
        !m.module.includes('vendor')
      );

      if (lazyLoadCandidates.length > 0) {
        recommendations.push({
          type: 'lazy',
          severity: 'medium',
          title: 'Large Modules for Lazy Loading',
          description: `${lazyLoadCandidates.length} large modules could be lazy loaded`,
          estimatedSavings: lazyLoadCandidates.reduce((total, m) => total + m.size, 0),
          modules: lazyLoadCandidates.map(m => m.module),
        });
      }
    }

    // No gzip compression
    if (analysis.totalSize && analysis.totalGzipSize &&
        analysis.totalGzipSize > analysis.totalSize * 0.6) {
      recommendations.push({
        type: 'compress',
        severity: 'medium',
        title: 'Enable Better Compression',
        description: 'Bundle compression could be improved',
        estimatedSavings: Math.floor(analysis.totalSize * 0.4),
      });
    }

    return recommendations;
  },

  // Tree shaking analysis
  analyzeTreeShaking: (modules: string[]): Array<{
    module: string;
    unusedExports: string[];
    potentialSavings: number;
  }> => {
    // This would typically require build tool integration
    // Simplified analysis for demonstration
    return modules.map(module => ({
      module,
      unusedExports: [], // Would need static analysis
      potentialSavings: 0,
    }));
  },

  // Code splitting suggestions
  generateCodeSplittingStrategy: (routes: string[], components: string[]): {
    routeChunks: Record<string, string[]>;
    vendorChunks: Record<string, string[]>;
    sharedChunks: Record<string, string[]>;
  } => {
    // Route-based splitting
    const routeChunks = routes.reduce((acc, route) => {
      const routeName = route.replace(/[^\w]/g, '');
      acc[routeName] = [route];
      return acc;
    }, {} as Record<string, string[]>);

    // Vendor chunk strategy
    const vendorChunks = {
      react: ['react', 'react-dom', 'react-router'],
      ui: ['@headlessui', '@heroicons', 'framer-motion'],
      utils: ['lodash', 'date-fns', 'validator'],
    };

    // Shared chunks for common components
    const sharedChunks = {
      common: components.filter(c =>
        c.includes('Button') ||
        c.includes('Modal') ||
        c.includes('Form')
      ),
    };

    return { routeChunks, vendorChunks, sharedChunks };
  },

  // Bundle size tracking
  createBundleSizeTracker: () => {
    const measurements: Array<{
      timestamp: number;
      totalSize: number;
      gzipSize: number;
      chunks: number;
    }> = [];

    const track = (analysis: BundleAnalysis) => {
      measurements.push({
        timestamp: Date.now(),
        totalSize: analysis.totalSize,
        gzipSize: analysis.totalGzipSize,
        chunks: analysis.chunks.length,
      });

      // Keep only last 30 measurements
      if (measurements.length > 30) {
        measurements.splice(0, measurements.length - 30);
      }
    };

    const getTrend = (metric: 'totalSize' | 'gzipSize' | 'chunks') => {
      if (measurements.length < 2) return 'stable';

      const recent = measurements.slice(-5);
      const older = measurements.slice(-10, -5);

      if (recent.length === 0 || older.length === 0) return 'stable';

      const recentAvg = recent.reduce((sum, m) => sum + m[metric], 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m[metric], 0) / older.length;

      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (change > 5) return 'increasing';
      if (change < -5) return 'decreasing';
      return 'stable';
    };

    const getReport = () => {
      if (measurements.length === 0) return null;

      const latest = measurements[measurements.length - 1];
      const trends = {
        size: getTrend('totalSize'),
        gzip: getTrend('gzipSize'),
        chunks: getTrend('chunks'),
      };

      return {
        latest,
        trends,
        measurements: [...measurements],
      };
    };

    return { track, getTrend, getReport };
  },
};

// Dynamic import optimization utilities
export const dynamicImportUtils = {
  // Create import map for better caching
  createImportMap: (imports: Record<string, string>) => {
    const importMap = new Map<string, Promise<any>>();

    const optimizedImport = async (key: string) => {
      if (importMap.has(key)) {
        return importMap.get(key);
      }

      const importPath = imports[key];
      if (!importPath) {
        throw new Error(`Import key '${key}' not found`);
      }

      performanceMonitor.startTiming(`dynamic_import_${key}`);

      const importPromise = import(/* @vite-ignore */ importPath).then(module => {
        performanceMonitor.endTiming(`dynamic_import_${key}`);
        return module;
      });

      importMap.set(key, importPromise);
      return importPromise;
    };

    const preloadImports = (keys: string[]) => {
      keys.forEach(key => {
        optimizedImport(key).catch(() => {
          // Silently fail preloading
        });
      });
    };

    const clearCache = (key?: string) => {
      if (key) {
        importMap.delete(key);
      } else {
        importMap.clear();
      }
    };

    return {
      import: optimizedImport,
      preload: preloadImports,
      clearCache,
      getCachedImports: () => Array.from(importMap.keys()),
    };
  },

  // Module federation utilities
  createModuleFederation: (config: {
    remotes: Record<string, string>;
    shared: string[];
    timeout?: number;
  }) => {
    const { remotes, shared, timeout = 10000 } = config;
    const loadedRemotes = new Map<string, any>();

    const loadRemote = async (remoteName: string, moduleName: string = './App') => {
      const remoteUrl = remotes[remoteName];
      if (!remoteUrl) {
        throw new Error(`Remote '${remoteName}' not found`);
      }

      const cacheKey = `${remoteName}:${moduleName}`;
      if (loadedRemotes.has(cacheKey)) {
        return loadedRemotes.get(cacheKey);
      }

      try {
        // This would typically be handled by webpack/vite module federation
        const module = await Promise.race([
          import(/* @vite-ignore */ `${remoteUrl}/${moduleName}`),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Module federation timeout')), timeout)
          ),
        ]);

        loadedRemotes.set(cacheKey, module);
        return module;
      } catch (error) {
        console.error(`Failed to load remote module ${remoteName}:${moduleName}`, error);
        throw error;
      }
    };

    const preloadRemote = (remoteName: string, moduleName: string = './App') => {
      loadRemote(remoteName, moduleName).catch(() => {
        // Silently fail preloading
      });
    };

    const getSharedDependencies = () => shared;

    return {
      loadRemote,
      preloadRemote,
      getSharedDependencies,
      getLoadedRemotes: () => Array.from(loadedRemotes.keys()),
    };
  },
};

// Resource optimization utilities
export const resourceOptimizationUtils = {
  // Critical resource prioritization
  prioritizeResources: (resources: Array<{
    url: string;
    type: 'script' | 'style' | 'image' | 'font';
    priority: 'critical' | 'important' | 'normal' | 'low';
  }>) => {
    const priorityOrder = { critical: 0, important: 1, normal: 2, low: 3 };

    return resources
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .map(resource => ({
        ...resource,
        preloadHint: resource.priority === 'critical' ? 'preload' :
                    resource.priority === 'important' ? 'prefetch' : null,
      }));
  },

  // Resource hints generator
  generateResourceHints: (analysis: BundleAnalysis) => {
    const hints: Array<{
      rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
      href: string;
      as?: string;
      crossorigin?: boolean;
    }> = [];

    // Preload critical chunks
    const criticalChunks = analysis.chunks
      .filter(chunk => chunk.isEntry || chunk.size > 100000)
      .slice(0, 3);

    criticalChunks.forEach(chunk => {
      hints.push({
        rel: 'preload',
        href: chunk.name,
        as: 'script',
      });
    });

    // Prefetch async chunks
    const asyncChunks = analysis.chunks
      .filter(chunk => chunk.isAsync && chunk.size < 100000)
      .slice(0, 5);

    asyncChunks.forEach(chunk => {
      hints.push({
        rel: 'prefetch',
        href: chunk.name,
        as: 'script',
      });
    });

    return hints;
  },

  // Service Worker caching strategy
  generateCacheStrategy: (analysis: BundleAnalysis) => {
    const strategies: Record<string, {
      strategy: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate';
      maxAge: number;
      patterns: string[];
    }> = {};

    // Cache static assets aggressively
    const staticChunks = analysis.chunks.filter(chunk =>
      chunk.name.includes('vendor') ||
      chunk.name.includes('polyfill')
    );

    if (staticChunks.length > 0) {
      strategies.static = {
        strategy: 'CacheFirst',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        patterns: staticChunks.map(chunk => chunk.name),
      };
    }

    // Cache app chunks with revalidation
    const appChunks = analysis.chunks.filter(chunk =>
      !chunk.name.includes('vendor') &&
      !chunk.name.includes('polyfill')
    );

    if (appChunks.length > 0) {
      strategies.app = {
        strategy: 'StaleWhileRevalidate',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        patterns: appChunks.map(chunk => chunk.name),
      };
    }

    return strategies;
  },

  // Compression recommendations
  analyzeCompression: (files: Array<{ name: string; size: number; gzipSize?: number }>) => {
    const recommendations: Array<{
      file: string;
      currentRatio: number;
      recommendedAction: string;
      potentialSavings: number;
    }> = [];

    files.forEach(file => {
      const gzipRatio = file.gzipSize ? file.gzipSize / file.size : 0.7; // Estimated

      let recommendedAction = '';
      let potentialSavings = 0;

      if (gzipRatio > 0.8) {
        recommendedAction = 'Enable Brotli compression';
        potentialSavings = file.size * 0.15;
      } else if (gzipRatio > 0.5) {
        recommendedAction = 'Optimize gzip compression';
        potentialSavings = file.size * 0.1;
      } else if (file.name.includes('.js') && file.size > 50000) {
        recommendedAction = 'Consider code splitting';
        potentialSavings = file.size * 0.3;
      } else if (file.name.includes('.css') && file.size > 20000) {
        recommendedAction = 'Optimize CSS and remove unused styles';
        potentialSavings = file.size * 0.2;
      }

      if (recommendedAction) {
        recommendations.push({
          file: file.name,
          currentRatio: gzipRatio,
          recommendedAction,
          potentialSavings,
        });
      }
    });

    return recommendations;
  },
};

// Performance budgets and monitoring
export const performanceBudgetUtils = {
  // Define performance budgets
  createPerformanceBudget: (config: {
    maxBundleSize?: number; // bytes
    maxInitialLoad?: number; // ms
    maxChunkSize?: number; // bytes
    maxChunkCount?: number;
    maxGzipSize?: number; // bytes
    maxRenderTime?: number; // ms
  }) => {
    const budget = {
      maxBundleSize: config.maxBundleSize || 500 * 1024, // 500KB
      maxInitialLoad: config.maxInitialLoad || 3000, // 3s
      maxChunkSize: config.maxChunkSize || 250 * 1024, // 250KB
      maxChunkCount: config.maxChunkCount || 10,
      maxGzipSize: config.maxGzipSize || 150 * 1024, // 150KB
      maxRenderTime: config.maxRenderTime || 16, // 16ms
    };

    const checkBudget = (analysis: BundleAnalysis) => {
      const violations: Array<{
        type: keyof typeof budget;
        current: number;
        budget: number;
        severity: 'error' | 'warning';
      }> = [];

      // Check bundle size
      if (analysis.totalSize > budget.maxBundleSize) {
        violations.push({
          type: 'maxBundleSize',
          current: analysis.totalSize,
          budget: budget.maxBundleSize,
          severity: analysis.totalSize > budget.maxBundleSize * 1.5 ? 'error' : 'warning',
        });
      }

      // Check chunk count
      if (analysis.chunks.length > budget.maxChunkCount) {
        violations.push({
          type: 'maxChunkCount',
          current: analysis.chunks.length,
          budget: budget.maxChunkCount,
          severity: 'warning',
        });
      }

      // Check individual chunk sizes
      const oversizedChunks = analysis.chunks.filter(chunk => chunk.size > budget.maxChunkSize);
      oversizedChunks.forEach(chunk => {
        violations.push({
          type: 'maxChunkSize',
          current: chunk.size,
          budget: budget.maxChunkSize,
          severity: chunk.size > budget.maxChunkSize * 2 ? 'error' : 'warning',
        });
      });

      // Check gzip size
      if (analysis.totalGzipSize > budget.maxGzipSize) {
        violations.push({
          type: 'maxGzipSize',
          current: analysis.totalGzipSize,
          budget: budget.maxGzipSize,
          severity: analysis.totalGzipSize > budget.maxGzipSize * 1.5 ? 'error' : 'warning',
        });
      }

      return {
        passed: violations.filter(v => v.severity === 'error').length === 0,
        violations,
        score: Math.max(0, 100 - violations.length * 10),
      };
    };

    return { budget, checkBudget };
  },

  // Bundle size regression detection
  createRegressionDetector: (threshold: number = 0.1) => {
    const history: Array<{ timestamp: number; size: number; gzipSize: number }> = [];

    const recordMeasurement = (size: number, gzipSize: number) => {
      history.push({
        timestamp: Date.now(),
        size,
        gzipSize,
      });

      // Keep only last 50 measurements
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
    };

    const detectRegression = () => {
      if (history.length < 5) return null;

      const recent = history.slice(-3);
      const baseline = history.slice(-10, -3);

      const recentAvgSize = recent.reduce((sum, m) => sum + m.size, 0) / recent.length;
      const baselineAvgSize = baseline.reduce((sum, m) => sum + m.size, 0) / baseline.length;

      const sizeChange = (recentAvgSize - baselineAvgSize) / baselineAvgSize;

      if (sizeChange > threshold) {
        return {
          type: 'size_regression',
          change: sizeChange,
          current: recentAvgSize,
          baseline: baselineAvgSize,
          severity: sizeChange > threshold * 2 ? 'critical' : 'warning',
        };
      }

      return null;
    };

    return {
      recordMeasurement,
      detectRegression,
      getHistory: () => [...history],
    };
  },
};