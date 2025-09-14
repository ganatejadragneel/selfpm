import React, { useState } from 'react';
import { DndContext, pointerWithin, DragOverlay } from '@dnd-kit/core';

// Custom hooks - extracting ALL business logic
import { 
  useTaskOperations,
  useModalOperations, 
  useTasksFetch,
  useDragAndDrop
} from './hooks';
import { theme } from './styles/theme';

// UI Components - only rendering logic
import { Button, LoadingSpinner, ComponentLoadingSpinner } from './components/ui';
import { LazyModal } from './components/ui/LazyModal';
import { ModernCategoryColumn } from './components/ModernCategoryColumn';
import { WeeklySummary } from './components/WeeklySummary';

// Lazy imports for modals
const AddTaskModal = React.lazy(() => import('./components/AddTaskModal').then(m => ({ default: m.AddTaskModal })));
const TaskModal = React.lazy(() => import('./components/TaskModal').then(m => ({ default: m.TaskModal })));
const BulkUploadModal = React.lazy(() => import('./components/BulkUploadModal').then(m => ({ default: m.BulkUploadModal })));
const ActivityTrackerModal = React.lazy(() => import('./components/ActivityTrackerModal').then(m => ({ default: m.ActivityTrackerModal })));
const DailyTaskAnalyticsModal = React.lazy(() => import('./components/DailyTaskAnalyticsModal').then(m => ({ default: m.DailyTaskAnalyticsModal })));
const ProgressAnalyticsDashboard = React.lazy(() => import('./components/analytics/ProgressAnalyticsDashboard').then(m => ({ default: m.ProgressAnalyticsDashboard })));

// Custom hook for app-level logic
const useAppLogic = () => {
  // UI State
  const [isMobile] = useState(window.innerWidth <= 768);
  const [currentWeek] = useState(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Data fetching with caching
  const { tasks, loading: dataLoading, error: dataError } = useTasksFetch();
  
  // Business operations
  const { 
    loading: operationLoading, 
    error: operationError, 
    toggleTaskStatus, 
    moveTaskToCategory, 
    deleteTask 
  } = useTaskOperations();

  // Modal management
  const modalOps = useModalOperations();

  // Drag and drop logic
  const dragProps = useDragAndDrop({
    tasks,
    onTaskMove: moveTaskToCategory,
    onError: (error) => console.error('Drag error:', error)
  });

  // Derived state
  const tasksByCategory = React.useMemo(() => {
    return {
      life_admin: tasks.filter(t => t.category === 'life_admin'),
      work: tasks.filter(t => t.category === 'work'),
      weekly_recurring: tasks.filter(t => t.category === 'weekly_recurring')
    };
  }, [tasks]);

  const loading = dataLoading || operationLoading;
  const error = dataError || operationError;

  // Event handlers
  const handleStatusToggle = React.useCallback(async (task: any) => {
    try {
      await toggleTaskStatus(task);
    } catch (error) {
      console.error('Failed to toggle task status:', error);
    }
  }, [toggleTaskStatus]);

  const handleDelete = React.useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [deleteTask]);

  return {
    // State
    isMobile,
    currentWeek,
    showAnalytics,
    setShowAnalytics,
    loading,
    error,
    tasks,
    tasksByCategory,
    
    // Operations
    modalOps,
    dragProps,
    
    // Handlers
    handleStatusToggle,
    handleDelete,
  };
};

function App() {
  const {
    isMobile,
    currentWeek,
    showAnalytics,
    setShowAnalytics,
    loading,
    error,
    tasks,
    tasksByCategory,
    modalOps,
    dragProps,
    handleStatusToggle,
    handleDelete,
  } = useAppLogic();

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: theme.colors.status.error.dark
      }}>
        Error loading application: {error}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h1 style={{
            fontSize: theme.typography.sizes.xl,
            fontWeight: theme.typography.weights.bold,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            SelfPM
          </h1>

          <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
            <Button
              variant="secondary"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </Button>
            
            <Button
              variant="secondary"
              onClick={modalOps.openBulkUploadModal}
            >
              Bulk Upload
            </Button>
            
            <Button
              variant="secondary"
              onClick={modalOps.openActivityTrackerModal}
            >
              Activity Tracker
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: isMobile ? '16px 12px' : '24px' 
      }}>
        {/* Analytics Dashboard - Collapsible */}
        {showAnalytics && (
          <div style={{ marginBottom: '32px' }}>
            <React.Suspense fallback={<ComponentLoadingSpinner text="Loading analytics..." />}>
              <ProgressAnalyticsDashboard tasks={tasks} currentWeek={currentWeek} />
            </React.Suspense>
          </div>
        )}

        {/* Weekly Summary */}
        <div style={{ marginBottom: '32px' }}>
          <WeeklySummary 
            tasks={tasks} 
            weekNumber={currentWeek} 
            onTaskClick={modalOps.openTaskModal}
          />
        </div>

        {/* Task Columns */}
        {loading ? (
          <LoadingSpinner size="lg" text="Loading tasks..." />
        ) : (
          <DndContext 
            sensors={dragProps.sensors}
            collisionDetection={pointerWithin}
            onDragStart={dragProps.handleDragStart}
            onDragEnd={dragProps.handleDragEnd}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile 
                ? '1fr' 
                : 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: isMobile ? '16px' : '24px',
              minHeight: 'calc(100vh - 400px)'
            }}>
              <ModernCategoryColumn
                category="life_admin"
                tasks={tasksByCategory.life_admin}
                onTaskClick={modalOps.openTaskModal}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => modalOps.openAddTaskModal('life_admin')}
              />
              
              <ModernCategoryColumn
                category="work"
                tasks={tasksByCategory.work}
                onTaskClick={modalOps.openTaskModal}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => modalOps.openAddTaskModal('work')}
              />
              
              <ModernCategoryColumn
                category="weekly_recurring"
                tasks={tasksByCategory.weekly_recurring}
                onTaskClick={modalOps.openTaskModal}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => modalOps.openAddTaskModal('weekly_recurring')}
              />
            </div>
            
            <DragOverlay>
              {dragProps.activeTask ? (
                <div style={{
                  opacity: 0.8,
                  transform: 'rotate(5deg)',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    padding: theme.spacing.lg,
                    background: theme.colors.surface.glass,
                    borderRadius: theme.borderRadius.lg,
                    border: '2px solid rgba(102, 126, 234, 0.5)',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    backdropFilter: theme.effects.blur
                  }}>
                    <h3 style={{
                      fontSize: theme.typography.sizes.lg,
                      fontWeight: theme.typography.weights.semibold,
                      color: theme.colors.text.primary,
                      margin: 0
                    }}>
                      {dragProps.activeTask.title}
                    </h3>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals - Clean modal management through custom hook */}
      {modalOps.selectedTask && (() => {
        const currentTask = tasks.find(t => t.id === modalOps.selectedTask?.id);
        return currentTask ? (
          <LazyModal
            key={`task-modal-${currentTask.id}-${currentTask.updatedAt}`}
            isOpen={!!modalOps.selectedTask}
            onClose={modalOps.closeTaskModal}
            component={TaskModal}
            componentProps={{
              task: currentTask,
              isOpen: !!modalOps.selectedTask,
              onClose: modalOps.closeTaskModal,
            }}
            fallback={<ComponentLoadingSpinner text="Loading task details..." />}
          />
        ) : null;
      })()}

      <LazyModal
        isOpen={modalOps.showAddTask}
        onClose={modalOps.closeAddTaskModal}
        component={AddTaskModal}
        componentProps={{
          isOpen: modalOps.showAddTask,
          initialCategory: modalOps.addTaskCategory,
          onClose: modalOps.closeAddTaskModal,
        }}
        fallback={<ComponentLoadingSpinner text="Loading task form..." />}
      />
      
      <LazyModal
        isOpen={modalOps.showBulkUpload}
        onClose={modalOps.closeBulkUploadModal}
        component={BulkUploadModal}
        componentProps={{
          isOpen: modalOps.showBulkUpload,
          onClose: modalOps.closeBulkUploadModal,
        }}
        fallback={<ComponentLoadingSpinner text="Loading bulk upload..." />}
      />
      
      <LazyModal
        isOpen={modalOps.showActivityTracker}
        onClose={modalOps.closeActivityTrackerModal}
        component={ActivityTrackerModal}
        componentProps={{
          isOpen: modalOps.showActivityTracker,
          onClose: modalOps.closeActivityTrackerModal,
          currentWeek: currentWeek,
        }}
        fallback={<ComponentLoadingSpinner text="Loading activity tracker..." />}
      />
      
      <LazyModal
        isOpen={modalOps.showDailyAnalytics}
        onClose={modalOps.closeDailyAnalyticsModal}
        component={DailyTaskAnalyticsModal}
        componentProps={{
          isOpen: modalOps.showDailyAnalytics,
          onClose: modalOps.closeDailyAnalyticsModal,
        }}
        fallback={<ComponentLoadingSpinner text="Loading daily analytics..." />}
      />
    </div>
  );
}

export default App;