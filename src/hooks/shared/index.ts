// Shared Hook Utilities - Phase 7B DRY Refactoring
// INTERNAL UTILITIES - Available for existing hooks to adopt

// Async state management
export * from './AsyncStateManager';

// Cache management
export * from './CacheManager';

// Modal state management
export * from './ModalStateManager';

// Phase 4: Advanced Modal System
export * from './ModalPerformanceManager';

// Phase 5: Hook Composition and Advanced State Management
export * from './HookCompositionManager';
export * from './AdvancedStateManager';

// Re-export for convenience
export { globalCache as sharedCache } from './CacheManager';
export { hookCompositionUtils } from './HookCompositionManager';
export { advancedStateUtils } from './AdvancedStateManager';