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

// Re-export convenience objects
export { configUtils } from './configurationUtils';
export { taskTransforms } from './transformationUtils';
export { asyncStateUtils } from './asyncStateUtils';
export { validationUtils } from './validationUtils';
export { dataUtils } from './arrayUtils';

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
};