// Shared Utilities - Phase 7D DRY Refactoring
// PURE FUNCTIONS - Available for components to adopt

// Icon mappings and utilities
export * from './iconMappings';

// Configuration utilities
export * from './configurationUtils';

// Data transformation utilities
export * from './transformationUtils';

// Re-export convenience objects
export { configUtils } from './configurationUtils';
export { taskTransforms } from './transformationUtils';

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
  tasks: taskTransforms
};