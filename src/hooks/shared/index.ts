// Shared Hook Utilities - Phase 7B DRY Refactoring
// INTERNAL UTILITIES - Available for existing hooks to adopt

// Async state management
export * from './AsyncStateManager';

// Cache management
export * from './CacheManager';

// Modal state management
export * from './ModalStateManager';

// Re-export for convenience
export { globalCache as sharedCache } from './CacheManager';