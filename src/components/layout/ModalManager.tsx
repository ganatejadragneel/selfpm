import React, { lazy, Suspense } from 'react';
import type { Task, TaskCategory } from '../../types';
import { useCommonStyles } from '../../styles/commonStyles';

// Lazy load modal components
const TaskModal = lazy(() => import('../TaskModal').then(module => ({ default: module.TaskModal })));
const AddTaskModal = lazy(() => import('../AddTaskModal').then(module => ({ default: module.AddTaskModal })));
const BulkUploadModal = lazy(() => import('../BulkUploadModal').then(module => ({ default: module.BulkUploadModal })));
const ActivityTrackerModal = lazy(() => import('../ActivityTrackerModal').then(module => ({ default: module.ActivityTrackerModal })));
const ProgressAnalyticsDashboard = lazy(() => import('../analytics/ProgressAnalyticsDashboard').then(module => ({ default: module.ProgressAnalyticsDashboard })));
const DailyTaskAnalyticsModal = lazy(() => import('../DailyTaskAnalyticsModal').then(module => ({ default: module.DailyTaskAnalyticsModal })));

interface ModalState {
  selectedTask: Task | null;
  showQuickAdd: boolean;
  quickAddCategory: TaskCategory;
  showAnalytics: boolean;
  showBulkUpload: boolean;
  showActivityTracker: boolean;
  showDailyTaskAnalytics: boolean;
}

interface ModalManagerProps {
  modalState: ModalState;
  tasks: Task[];
  currentWeek: number;
  onCloseTask: () => void;
  onCloseQuickAdd: () => void;
  onCloseAnalytics: () => void;
  onCloseBulkUpload: () => void;
  onCloseActivityTracker: () => void;
  onCloseDailyTaskAnalytics: () => void;
}

const LoadingSpinner: React.FC = () => {
  const styles = useCommonStyles();
  
  return (
    <div style={{
      ...styles.flexCenter,
      padding: '40px',
      color: styles.textSecondary.color
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(102, 126, 234, 0.2)',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export const ModalManager: React.FC<ModalManagerProps> = ({
  modalState,
  tasks,
  currentWeek,
  onCloseTask,
  onCloseQuickAdd,
  onCloseAnalytics,
  onCloseBulkUpload,
  onCloseActivityTracker,
  onCloseDailyTaskAnalytics,
}) => {
  return (
    <>
      {modalState.selectedTask && (
        <Suspense fallback={<LoadingSpinner />}>
          <TaskModal
            isOpen={!!modalState.selectedTask}
            onClose={onCloseTask}
            task={modalState.selectedTask}
          />
        </Suspense>
      )}

      {modalState.showQuickAdd && (
        <Suspense fallback={<LoadingSpinner />}>
          <AddTaskModal
            isOpen={modalState.showQuickAdd}
            onClose={onCloseQuickAdd}
            initialCategory={modalState.quickAddCategory}
          />
        </Suspense>
      )}

      {modalState.showAnalytics && (
        <Suspense fallback={<LoadingSpinner />}>
          {/* ProgressAnalyticsDashboard doesn't have isOpen/onClose props, need to wrap in modal */}
          <div style={{
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} onClick={onCloseAnalytics}>
            <div onClick={(e) => e.stopPropagation()}>
              <ProgressAnalyticsDashboard
                tasks={tasks}
                currentWeek={currentWeek}
              />
            </div>
          </div>
        </Suspense>
      )}

      {modalState.showBulkUpload && (
        <Suspense fallback={<LoadingSpinner />}>
          <BulkUploadModal
            isOpen={modalState.showBulkUpload}
            onClose={onCloseBulkUpload}
          />
        </Suspense>
      )}

      {modalState.showActivityTracker && (
        <Suspense fallback={<LoadingSpinner />}>
          <ActivityTrackerModal
            isOpen={modalState.showActivityTracker}
            onClose={onCloseActivityTracker}
            currentWeek={currentWeek}
          />
        </Suspense>
      )}

      {modalState.showDailyTaskAnalytics && (
        <Suspense fallback={<LoadingSpinner />}>
          <DailyTaskAnalyticsModal
            isOpen={modalState.showDailyTaskAnalytics}
            onClose={onCloseDailyTaskAnalytics}
          />
        </Suspense>
      )}
    </>
  );
};