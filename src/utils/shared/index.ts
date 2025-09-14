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
};