import { useEffect, useState, lazy } from 'react';
import type { Task, TaskCategory } from './types';
import { useMigratedTaskStore } from './store/migratedTaskStore';
import { useTaskActions } from './hooks/useTaskActions';
import { useToggle } from './hooks/useToggle';
import { useResponsive } from './hooks/useResponsive';
import { ThemeProvider } from './contexts/ThemeContext';
import { ModalProvider, useModal } from './contexts/ModalContext';
import { useThemeColors } from './hooks/useThemeColors';
import { AuthGuard } from './components/auth/AuthGuard';
import { UserMenu } from './components/UserMenu';
import { ModernCategoryColumn } from './components/ModernCategoryColumn';
import { WeeklySummary } from './components/WeeklySummary';
import { DailyTaskTracker } from './components/DailyTaskTracker';
import { ModalRegistry } from './components/modals/ModalRegistry';
// Lazy load analytics dashboard
const ProgressAnalyticsDashboard = lazy(() => import('./components/analytics/ProgressAnalyticsDashboard').then(module => ({ default: module.ProgressAnalyticsDashboard })));
import { ChevronLeft, ChevronRight, Calendar, Plus, BarChart3, Upload, Activity } from 'lucide-react';
import { getWeek, format, addWeeks } from 'date-fns';
import { Button, LoadingSpinner } from './components/ui';
import { DndContext, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

function App() {
  return (
    <ThemeProvider>
      <ModalProvider>
        <AuthGuard>
          <AppContent />
        </AuthGuard>
      </ModalProvider>
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
  const {
    openTaskModal,
    openAddTaskModal,
    openBulkUploadModal,
    openActivityTrackerModal,
    openDailyAnalyticsModal,
  } = useModal();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const showAnalytics = useToggle(false);
  
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
          } catch {
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
      backgroundImage: theme.currentTheme === 'dark'
        ? 'none'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundColor: theme.currentTheme === 'dark'
        ? theme.colors.background.primary
        : 'transparent',
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
                  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  backgroundImage: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  minWidth: isMobile ? '120px' : '200px',
                  justifyContent: 'center'
                }}>
                  <Calendar className={isMobile ? "w-3 h-3" : "w-4 h-4"} style={{ color: '#667eea' }} />
                  <span style={{
                    fontWeight: '600',
                    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                onClick={() => openAddTaskModal('life_admin')}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Task
              </Button>
              
              {/* Bulk Upload Button - Hide on mobile */}
              {!isMobile && (
                <Button
                  variant="primary"
                  onClick={() => openBulkUploadModal()}
                  icon={<Upload className="w-4 h-4" />}
                  title="Bulk upload tasks from CSV"
                >
                  Bulk Upload
                </Button>
              )}
              
              {/* Activity Tracker Button - Hide on mobile */}
              {!isMobile && (
                <Button
                  variant="primary"
                  onClick={() => openActivityTrackerModal()}
                  icon={<Activity className="w-4 h-4" />}
                  title="View activity history"
                >
                  Activity
                </Button>
              )}
              
              {/* Analytics Button */}
              <Button
                variant="primary"
                onClick={showAnalytics.toggle}
                icon={<BarChart3 className="w-4 h-4" />}
                title="View Analytics"
              >
              </Button>

              {/* Daily Task Analytics Button */}
              <Button
                variant="primary"
                onClick={() => openDailyAnalyticsModal()}
                icon={<Calendar className="w-4 h-4" />}
                title="Daily Task Analytics"
              >
              </Button>
              
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
        {showAnalytics.value && (
          <div style={{ marginBottom: '32px' }}>
            <ProgressAnalyticsDashboard tasks={tasks} currentWeek={currentWeek} />
          </div>
        )}

        {/* Weekly Summary */}
        <div style={{ marginBottom: '32px' }}>
          <WeeklySummary 
            tasks={tasks} 
            weekNumber={currentWeek} 
            onTaskClick={(task) => openTaskModal(task)}
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
                onTaskClick={openTaskModal}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => openAddTaskModal('life_admin')}
              />
              
              <ModernCategoryColumn
                category="work"
                tasks={tasksByCategory.work}
                onTaskClick={openTaskModal}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => openAddTaskModal('work')}
              />
              
              <ModernCategoryColumn
                category="weekly_recurring"
                tasks={tasksByCategory.weekly_recurring}
                onTaskClick={openTaskModal}
                onTaskStatusToggle={handleStatusToggle}
                onDeleteTask={(task) => handleDelete(task.id)}
                onAddTask={() => openAddTaskModal('weekly_recurring')}
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
      <ModalRegistry tasks={tasks} currentWeek={currentWeek} />
    </div>
  );
}

export default App;
export { AppContent };
