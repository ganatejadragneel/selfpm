/**
 * LazyModals - Lazy-loaded modal components
 * Improves initial bundle size by code-splitting modals
 */

import React, { lazy, Suspense } from 'react';
import { Spinner } from './LoadingStates';

// Lazy load modal components
const TaskModal = lazy(() => import('./TaskModal').then(module => ({
  default: module.TaskModal
})));

const BulkUploadModal = lazy(() => import('./BulkUploadModal').then(module => ({
  default: module.BulkUploadModal
})));

const DailyTaskAnalyticsModal = lazy(() => import('./DailyTaskAnalyticsModal').then(module => ({
  default: module.DailyTaskAnalyticsModal
})));

// Modal loading fallback
function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Wrapped lazy components with Suspense
export function LazyTaskModal(props: React.ComponentProps<typeof TaskModal>) {
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <TaskModal {...props} />
    </Suspense>
  );
}

export function LazyBulkUploadModal(props: React.ComponentProps<typeof BulkUploadModal>) {
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <BulkUploadModal {...props} />
    </Suspense>
  );
}

export function LazyDailyTaskAnalyticsModal(props: React.ComponentProps<typeof DailyTaskAnalyticsModal>) {
  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <DailyTaskAnalyticsModal {...props} />
    </Suspense>
  );
}

// Preload functions for better UX
export const preloadModals = {
  taskModal: () => import('./TaskModal'),
  bulkUploadModal: () => import('./BulkUploadModal'),
  analyticsModal: () => import('./DailyTaskAnalyticsModal')
};

// Hook to preload modals on hover or focus
export function useModalPreload() {
  const handlePreload = React.useCallback((modalName: keyof typeof preloadModals) => {
    preloadModals[modalName]();
  }, []);
  
  return { preloadModal: handlePreload };
}