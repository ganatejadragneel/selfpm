// Shared Utilities - Phase 3 Enhancement
// PURE FUNCTIONS - Available for components to adopt

// Icon mappings and utilities
export * from './iconMappings';

// Configuration utilities
export * from './configurationUtils';

// Data transformation utilities
export * from './transformationUtils';

// Phase 3 Additions: Enhanced utility libraries
export * from './asyncStateUtils';
export * from './validationUtils';
export * from './arrayUtils';

// Phase 6: Error & Loading State Unification
export * from './errorStateManager';
export * from './loadingStateManager';
export * from './notificationStateManager';

// Phase 7: Form System Enhancement
export * from './formSystemManager';
export * from './formValidators';

// Phase 8: Component Interface Optimization
export * from './componentPropFactories';
export * from './componentPatterns';

// Phase 9: Animation & Responsive System Maturation
export * from './animationConstants';
export * from './animationHelpers';
export * from './responsiveSystem';

// Phase 10: Performance & Bundle Optimization
export * from './performanceMonitoring';
export * from './lazyLoadingUtils';
export * from './bundleOptimization';

// Re-export convenience objects
export { configUtils } from './configurationUtils';
export { taskTransforms } from './transformationUtils';
export { asyncStateUtils } from './asyncStateUtils';
export { validationUtils } from './validationUtils';
export { dataUtils } from './arrayUtils';
export { errorUtils } from './errorStateManager';
export { loadingUtils } from './loadingStateManager';
export { notificationStyles } from './notificationStateManager';
export { validators } from './formValidators';
export { propUtils, propFactories, eventUtils, a11yUtils } from './componentPropFactories';
export { propValidators, eventPatterns, propMergers, statePatterns, compositionPatterns, apiPatterns } from './componentPatterns';
export { animationHelpers, useAnimations, animationUtils } from './animationHelpers';
export { responsiveHelpers, useResponsive, responsiveUtils } from './responsiveSystem';
export { performanceMonitor, usePerformanceMonitoring, performanceUtils } from './performanceMonitoring';
export { codeSplittingUtils, imageLazyLoadingUtils, contentLazyLoadingUtils, preloadingUtils } from './lazyLoadingUtils';
export { bundleOptimizationUtils, dynamicImportUtils, resourceOptimizationUtils, performanceBudgetUtils } from './bundleOptimization';

// Import utilities for grouped export
import {
  getStatusIcon,
  getCategoryIcon,
  getPriorityIcon,
  getActivityIcon,
  getIconWithSize
} from './iconMappings';
import { configUtils } from './configurationUtils';
import { taskTransforms } from './transformationUtils';
import { asyncStateUtils } from './asyncStateUtils';
import { validationUtils } from './validationUtils';
import { dataUtils } from './arrayUtils';
import { errorUtils } from './errorStateManager';
import { loadingUtils } from './loadingStateManager';
import { notificationStyles } from './notificationStateManager';
import { validators } from './formValidators';
import { propUtils, propFactories, eventUtils, a11yUtils } from './componentPropFactories';
import { propValidators, eventPatterns, propMergers, statePatterns, compositionPatterns, apiPatterns } from './componentPatterns';
import { animationHelpers, useAnimations, animationUtils } from './animationHelpers';
import { responsiveHelpers, useResponsive, responsiveUtils } from './responsiveSystem';
import { performanceMonitor, usePerformanceMonitoring, performanceUtils } from './performanceMonitoring';
import { codeSplittingUtils, imageLazyLoadingUtils, contentLazyLoadingUtils, preloadingUtils } from './lazyLoadingUtils';
import { bundleOptimizationUtils, dynamicImportUtils, resourceOptimizationUtils, performanceBudgetUtils } from './bundleOptimization';

// Export as grouped utilities for easy access
export const sharedUtils = {
  icons: {
    getStatusIcon,
    getCategoryIcon,
    getPriorityIcon,
    getActivityIcon,
    getIconWithSize
  },
  config: configUtils,
  tasks: taskTransforms,
  async: asyncStateUtils,
  validation: validationUtils,
  data: dataUtils,
  errors: errorUtils,
  loading: loadingUtils,
  notifications: notificationStyles,
  forms: validators,
  components: {
    props: propUtils,
    factories: propFactories,
    events: eventUtils,
    a11y: a11yUtils,
    validators: propValidators,
    patterns: {
      events: eventPatterns,
      mergers: propMergers,
      state: statePatterns,
      composition: compositionPatterns,
      api: apiPatterns,
    },
  },
  animations: {
    helpers: animationHelpers,
    hooks: useAnimations,
    utils: animationUtils,
  },
  responsive: {
    helpers: responsiveHelpers,
    hooks: useResponsive,
    utils: responsiveUtils,
  },
  performance: {
    monitor: performanceMonitor,
    hooks: usePerformanceMonitoring,
    utils: performanceUtils,
  },
  lazyLoading: {
    codeSplitting: codeSplittingUtils,
    images: imageLazyLoadingUtils,
    content: contentLazyLoadingUtils,
    preloading: preloadingUtils,
  },
  bundleOptimization: {
    analysis: bundleOptimizationUtils,
    imports: dynamicImportUtils,
    resources: resourceOptimizationUtils,
    budgets: performanceBudgetUtils,
  },
};