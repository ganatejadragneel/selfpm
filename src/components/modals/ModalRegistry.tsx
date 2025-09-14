import React, { lazy } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { LazyModal, ComponentLoadingSpinner } from '../ui';
import type { Task } from '../../types';

// Lazy load modal components
const TaskModal = lazy(() => import('../TaskModal').then(module => ({ default: module.TaskModal })));
const AddTaskModal = lazy(() => import('../AddTaskModal').then(module => ({ default: module.AddTaskModal })));
const BulkUploadModal = lazy(() => import('../BulkUploadModal').then(module => ({ default: module.BulkUploadModal })));
const ActivityTrackerModal = lazy(() => import('../ActivityTrackerModal').then(module => ({ default: module.ActivityTrackerModal })));
const DailyTaskAnalyticsModal = lazy(() => import('../DailyTaskAnalyticsModal').then(module => ({ default: module.DailyTaskAnalyticsModal })));

interface ModalRegistryProps {
  tasks: Task[];
  currentWeek: number;
}

export const ModalRegistry: React.FC<ModalRegistryProps> = ({ tasks, currentWeek }) => {
  const {
    selectedTask,
    closeTaskModal,
    showAddTask,
    addTaskCategory,
    closeAddTaskModal,
    showBulkUpload,
    closeBulkUploadModal,
    showActivityTracker,
    closeActivityTrackerModal,
    showDailyAnalytics,
    closeDailyAnalyticsModal
  } = useModal();

  return (
    <>
      {/* Task Modal */}
      {selectedTask && (() => {
        const currentTask = tasks.find(t => t.id === selectedTask.id);
        return currentTask ? (
          <LazyModal
            key={`task-modal-${currentTask.id}-${currentTask.updatedAt}`}
            isOpen={!!selectedTask}
            onClose={closeTaskModal}
            component={TaskModal}
            componentProps={{
              task: currentTask,
              isOpen: !!selectedTask,
              onClose: closeTaskModal,
            }}
            fallback={<ComponentLoadingSpinner text="Loading task details..." />}
          />
        ) : null;
      })()}

      {/* Add Task Modal */}
      <LazyModal
        isOpen={showAddTask}
        onClose={closeAddTaskModal}
        component={AddTaskModal}
        componentProps={{
          isOpen: showAddTask,
          initialCategory: addTaskCategory,
          onClose: closeAddTaskModal,
        }}
        fallback={<ComponentLoadingSpinner text="Loading task form..." />}
      />

      {/* Bulk Upload Modal */}
      <LazyModal
        isOpen={showBulkUpload}
        onClose={closeBulkUploadModal}
        component={BulkUploadModal}
        componentProps={{
          isOpen: showBulkUpload,
          onClose: closeBulkUploadModal,
        }}
        fallback={<ComponentLoadingSpinner text="Loading bulk upload..." />}
      />

      {/* Activity Tracker Modal */}
      <LazyModal
        isOpen={showActivityTracker}
        onClose={closeActivityTrackerModal}
        component={ActivityTrackerModal}
        componentProps={{
          isOpen: showActivityTracker,
          onClose: closeActivityTrackerModal,
          currentWeek: currentWeek,
        }}
        fallback={<ComponentLoadingSpinner text="Loading activity tracker..." />}
      />

      {/* Daily Task Analytics Modal */}
      <LazyModal
        isOpen={showDailyAnalytics}
        onClose={closeDailyAnalyticsModal}
        component={DailyTaskAnalyticsModal}
        componentProps={{
          isOpen: showDailyAnalytics,
          onClose: closeDailyAnalyticsModal,
        }}
        fallback={<ComponentLoadingSpinner text="Loading analytics..." />}
      />
    </>
  );
};