import { useEffect, useState, lazy } from 'react';
import type { Task, TaskCategory } from './types';
import { useMigratedTaskStore } from './store/migratedTaskStore';
import { useTaskActions } from './hooks/useTaskActions';
import { useResponsive } from './hooks/useResponsive';
import { ThemeProvider } from './contexts/ThemeContext';
import { useThemeColors } from './hooks/useThemeColors';
import { AuthGuard } from './components/auth/AuthGuard';
import { UserMenu } from './components/UserMenu';
import { ModernCategoryColumn } from './components/ModernCategoryColumn';
import { WeeklySummary } from './components/WeeklySummary';
import { DailyTaskTracker } from './components/DailyTaskTracker';
// Lazy load large modal components
const TaskModal = lazy(() => import('./components/TaskModal').then(module => ({ default: module.TaskModal })));
const AddTaskModal = lazy(() => import('./components/AddTaskModal').then(module => ({ default: module.AddTaskModal })));
const BulkUploadModal = lazy(() => import('./components/BulkUploadModal').then(module => ({ default: module.BulkUploadModal })));
const ActivityTrackerModal = lazy(() => import('./components/ActivityTrackerModal').then(module => ({ default: module.ActivityTrackerModal })));
const ProgressAnalyticsDashboard = lazy(() => import('./components/analytics/ProgressAnalyticsDashboard').then(module => ({ default: module.ProgressAnalyticsDashboard })));
const DailyTaskAnalyticsModal = lazy(() => import('./components/DailyTaskAnalyticsModal').then(module => ({ default: module.DailyTaskAnalyticsModal })));
import { ChevronLeft, ChevronRight, Calendar, Plus, BarChart3, Upload, Activity } from 'lucide-react';
import { getWeek, format, addWeeks } from 'date-fns';
import { Button, LoadingSpinner, ComponentLoadingSpinner, LazyModal } from './components/ui';
import { DndContext, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

function App() {
  return (
    <ThemeProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </ThemeProvider>
  );
}

function AppContent() {
  const theme = useThemeColors();
  const {
    tasks,
    loading,
    error,
    currentWeek,
    fetchTasks,
    setCurrentWeek,
    moveTaskToCategory
  } = useMigratedTaskStore();

  const { handleStatusToggle, handleDelete } = useTaskActions();
  const { isMobile, isSmallMobile } = useResponsive();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<TaskCategory>('life_admin');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showActivityTracker, setShowActivityTracker] = useState(false);
  const [showDailyTaskAnalytics, setShowDailyTaskAnalytics] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5
      },
    })
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next' ? currentWeek + 1 : currentWeek - 1;
    setCurrentWeek(newWeek);
    fetchTasks(newWeek);
  };

  const tasksByCategory = {
    life_admin: tasks.filter(t => t.category === 'life_admin').sort((a, b) => (a.order || 0) - (b.order || 0)),
    work: tasks.filter(t => t.category === 'work').sort((a, b) => (a.order || 0) - (b.order || 0)),
    weekly_recurring: tasks.filter(t => t.category === 'weekly_recurring').sort((a, b) => (a.order || 0) - (b.order || 0))
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    
    // Find the active task
    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    // Check if we're dropping over a category column or another task
    const isDroppedOnCategory = ['life_admin', 'work', 'weekly_recurring'].includes(overId);
    
    if (isDroppedOnCategory) {
      // Moving to a different category (dropped on empty category area)
      const newCategory = overId as TaskCategory;
      if (activeTask.category !== newCategory) {
        await moveTaskToCategory(activeTaskId, newCategory);
      }
    } else {
      // Dropped on another task
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;

      const activeCategory = activeTask.category;
      const overCategory = overTask.category;
      
      if (activeCategory === overCategory) {
        // Reordering within the same category
        const categoryTasks = tasksByCategory[activeCategory];
        const oldIndex = categoryTasks.findIndex(t => t.id === activeTaskId);
        const newIndex = categoryTasks.findIndex(t => t.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Create new order array
          const newTaskOrder = arrayMove(categoryTasks, oldIndex, newIndex);
          // Update the local state immediately for smooth UX
          const updatedTasks = tasks.map(task => {
            const orderIndex = newTaskOrder.findIndex(t => t.id === task.id);
            if (orderIndex !== -1) {
              return { ...task, order: orderIndex };
            }
            return task;
          });
          
          // Sort tasks by order for display
          useMigratedTaskStore.setState({ tasks: updatedTasks });
          
          // Then update in database (will work when order column exists)
          try {
            await Promise.all(
              newTaskOrder.map((task, index) => 
                useMigratedTaskStore.getState().updateTask(task.id, { 
                  order: index 
                })
              )
            );
          } catch (error) {
            // Order column may not exist yet. Tasks reordered in UI only.
          }
        }
      } else {
        // Moving between categories
        await moveTaskToCategory(activeTaskId, overCategory);
      }
    }
  };

  const currentDate = new Date();
  const weekStart = addWeeks(currentDate, currentWeek - getWeek(currentDate));

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Connection Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Please check your Supabase configuration in .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.currentTheme === 'dark' 
        ? theme.colors.background.primary 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: theme.colors.text.primary
    }}>
      {/* Daily Task Tracker */}
      <DailyTaskTracker />
      
      {/* Header */}
      <div style={{ 
        background: theme.colors.surface.glass,
        backdropFilter: theme.effects.blur,
        borderBottom: `1px solid ${theme.colors.surface.glassBorder}`,
        boxShadow: theme.effects.shadow.md,
        position: 'relative',
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '12px 16px',
          position: 'relative'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '12px' : '24px',
              minWidth: '0',
              flex: '1 1 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: isMobile ? '32px' : '40px',
                  height: isMobile ? '32px' : '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}>
                  S
                </div>
                <h1 style={{ 
                  fontSize: isMobile ? '20px' : '28px', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  SelfPM
                </h1>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? '4px' : '8px',
                flex: isMobile ? '1 1 100%' : '0 0 auto',
                order: isMobile ? 1 : 0,
                justifyContent: isMobile ? 'center' : 'flex-start',
                paddingRight: isMobile ? '20px' : '0'
              }}>
                <Button
                  variant="navigation"
                  isMobile={isMobile}
                  onClick={() => handleWeekChange('prev')}
                  icon={<ChevronLeft className={isMobile ? "w-3 h-3" : "w-5 h-5"} />}
                />
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: isMobile ? '6px 10px' : '12px 20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  minWidth: isMobile ? '120px' : '200px',
                  justifyContent: 'center'
                }}>
                  <Calendar className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#667eea' }} />
                  <span style={{ 
                    fontWeight: '600', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: isMobile ? '11px' : '14px',
                    textAlign: 'center'
                  }}>
                    {isSmallMobile 
                      ? `W${currentWeek} - ${format(weekStart, 'MMM d')}`
                      : `Week ${currentWeek} - ${format(weekStart, 'MMM d, yyyy')}`
                    }
                  </span>
                </div>
                
                <Button
                  variant="navigation"
                  isMobile={isMobile}
                  onClick={() => handleWeekChange('next')}
                  icon={<ChevronRight className={isMobile ? "w-3 h-3" : "w-5 h-5"} />}
                />
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '8px' : '16px',
              flex: '0 0 auto',
              flexWrap: 'wrap'
            }}>
              <Button
                variant="primary"
                onClick={() => setShowQuickAdd(true)}
                icon={<Plus className="w-4 h-4" />}
                style={{
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '8px 12px' : '12px 20px',
                }}
              >
                Add Task
              </Button>
              
              {/* Bulk Upload Button - Hide on mobile */}
              {!isMobile && (
                <Button
                  variant="secondary"
                  onClick={() => setShowBulkUpload(true)}
                  icon={<Upload className="w-4 h-4" />}
                  title="Bulk upload tasks from CSV"
                >
                  Bulk Upload
                </Button>
              )}
              
              {/* Activity Tracker Button - Hide on mobile */}
              {!isMobile && (
                <Button
                  variant="secondary"
                  onClick={() => setShowActivityTracker(true)}
                  icon={<Activity className="w-4 h-4" />}
                  title="View activity history"
                >
                  Activity
                </Button>
              )}
              
              {/* Analytics Button */}
              <Button
                variant="icon"
                onClick={() => setShowAnalytics(!showAnalytics)}
                icon={<BarChart3 className="w-5 h-5" />}
                title="View Analytics"
                style={{
                  marginRight: theme.spacing.sm,
                  background: showAnalytics ? 'rgba(102, 126, 234, 0.1)' : theme.colors.surface.glass,
                }}
              />
              
              {/* Daily Task Analytics Button */}
              <Button
                variant="icon"
                onClick={() => setShowDailyTaskAnalytics(true)}
                icon={<Calendar className="w-5 h-5" />}
                title="Daily Task Analytics"
                style={{ marginRight: theme.spacing.sm }}
              />
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: isMobile ? '16px 12px' : '24px' 
      }}>
        {/* Analytics Dashboard - Collapsible */}
        {showAnalytics && (
          <div style={{ marginBottom: '32px' }}>
            <ProgressAnalyticsDashboard tasks={tasks} currentWeek={currentWeek} />
          </div>
        )}

        {/* Weekly Summary */}
        <div style={{ marginBottom: '32px' }}>
          <WeeklySummary 
            tasks={tasks} 
            weekNumber={currentWeek} 
            onTaskClick={(task) => setSelectedTask(task)}
          />
        </div>

        {/* Task Columns */}
        {loading ? (
          <LoadingSpinner size="lg" text="Loading tasks..." />
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
                onTaskClick={setSelectedTask}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => {
                  setQuickAddCategory('life_admin');
                  setShowQuickAdd(true);
                }}
              />
              
              <ModernCategoryColumn
                category="work"
                tasks={tasksByCategory.work}
                onTaskClick={setSelectedTask}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => {
                  setQuickAddCategory('work');
                  setShowQuickAdd(true);
                }}
              />
              
              <ModernCategoryColumn
                category="weekly_recurring"
                tasks={tasksByCategory.weekly_recurring}
                onTaskClick={setSelectedTask}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => {
                  setQuickAddCategory('weekly_recurring');
                  setShowQuickAdd(true);
                }}
              />
            </div>
            
            <DragOverlay>
              {activeTask ? (
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
                      {activeTask.title}
                    </h3>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      {selectedTask && (() => {
        // Get the most up-to-date task from the store
        const currentTask = tasks.find(t => t.id === selectedTask.id);
        return currentTask ? (
          <LazyModal
            key={`task-modal-${currentTask.id}-${currentTask.updatedAt}`}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
            component={TaskModal}
            componentProps={{
              task: currentTask,
              isOpen: !!selectedTask,
              onClose: () => setSelectedTask(null),
            }}
            fallback={<ComponentLoadingSpinner text="Loading task details..." />}
          />
        ) : null;
      })()}

      <LazyModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        component={AddTaskModal}
        componentProps={{
          isOpen: showQuickAdd,
          initialCategory: quickAddCategory,
          onClose: () => setShowQuickAdd(false),
        }}
        fallback={<ComponentLoadingSpinner text="Loading task form..." />}
      />
      
      {/* Bulk Upload Modal */}
      <LazyModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        component={BulkUploadModal}
        componentProps={{
          isOpen: showBulkUpload,
          onClose: () => setShowBulkUpload(false),
        }}
        fallback={<ComponentLoadingSpinner text="Loading bulk upload..." />}
      />
      
      {/* Activity Tracker Modal */}
      <LazyModal
        isOpen={showActivityTracker}
        onClose={() => setShowActivityTracker(false)}
        component={ActivityTrackerModal}
        componentProps={{
          isOpen: showActivityTracker,
          onClose: () => setShowActivityTracker(false),
          currentWeek: currentWeek,
        }}
        fallback={<ComponentLoadingSpinner text="Loading activity tracker..." />}
      />
      
      {/* Daily Task Analytics Modal */}
      <LazyModal
        isOpen={showDailyTaskAnalytics}
        onClose={() => setShowDailyTaskAnalytics(false)}
        component={DailyTaskAnalyticsModal}
        componentProps={{
          isOpen: showDailyTaskAnalytics,
          onClose: () => setShowDailyTaskAnalytics(false),
        }}
        fallback={<ComponentLoadingSpinner text="Loading daily analytics..." />}
      />
    </div>
  );
}

export default App;