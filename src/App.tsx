import { useEffect, useState } from 'react';
import type { Task, TaskCategory } from './types';
import { useTaskStore } from './store/taskStore';
import { useTaskActions } from './hooks/useTaskActions';
import { AuthGuard } from './components/auth/AuthGuard';
import { UserMenu } from './components/UserMenu';
import { ModernCategoryColumn } from './components/ModernCategoryColumn';
import { WeeklySummary } from './components/WeeklySummary';
import { TaskModal } from './components/TaskModal';
import { AddTaskModal } from './components/AddTaskModal';
import { BulkUploadModal } from './components/BulkUploadModal';
import { ActivityTrackerModal } from './components/ActivityTrackerModal';
import { ProgressAnalyticsDashboard } from './components/analytics/ProgressAnalyticsDashboard';
import { ChevronLeft, ChevronRight, Calendar, Plus, BarChart3, Upload, Activity } from 'lucide-react';
import { getWeek, format, addWeeks } from 'date-fns';
import { theme } from './styles/theme';
import { DndContext, DragOverlay, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

function App() {
  return (
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}

function AppContent() {
  const {
    tasks,
    loading,
    error,
    currentWeek,
    fetchTasks,
    setCurrentWeek,
    moveTaskToCategory
  } = useTaskStore();

  const { handleStatusToggle, handleDelete } = useTaskActions();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<TaskCategory>('life_admin');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showActivityTracker, setShowActivityTracker] = useState(false);
  
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
          useTaskStore.setState({ tasks: updatedTasks });
          
          // Then update in database (will work when order column exists)
          try {
            await Promise.all(
              newTaskOrder.map((task, index) => 
                useTaskStore.getState().updateTask(task.id, { 
                  order: index 
                })
              )
            );
          } catch (error) {
            console.log('Order column may not exist yet. Tasks reordered in UI only.');
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
    <div style={{ minHeight: '100vh', background: theme.colors.primary.gradient }}>
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
          padding: '16px 24px',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}>
                  S
                </div>
                <h1 style={{ 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  SelfPM
                </h1>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleWeekChange('prev')}
                  style={{
                    padding: '10px',
                    border: 'none',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: '#667eea',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                  minWidth: '200px',
                  justifyContent: 'center'
                }}>
                  <Calendar className="w-4 h-4" style={{ color: '#667eea' }} />
                  <span style={{ 
                    fontWeight: '600', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '14px'
                  }}>
                    Week {currentWeek} - {format(weekStart, 'MMM d, yyyy')}
                  </span>
                </div>
                
                <button
                  onClick={() => handleWeekChange('next')}
                  style={{
                    padding: '10px',
                    border: 'none',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: '#667eea',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setShowQuickAdd(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
              
              {/* Bulk Upload Button */}
              <button
                onClick={() => setShowBulkUpload(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
                title="Bulk upload tasks from CSV"
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </button>
              
              {/* Activity Tracker Button */}
              <button
                onClick={() => setShowActivityTracker(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
                title="View activity history"
              >
                <Activity className="w-4 h-4" />
                Activity
              </button>
              
              {/* Analytics Button */}
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: 'none',
                  background: showAnalytics ? 'rgba(102, 126, 234, 0.1)' : theme.colors.surface.glass,
                  backdropFilter: theme.effects.blur,
                  borderRadius: theme.borderRadius.full,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  marginRight: theme.spacing.sm
                }}
                onMouseEnter={(e) => {
                  if (!showAnalytics) {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showAnalytics) {
                    e.currentTarget.style.background = theme.colors.surface.glass;
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title="View Analytics"
              >
                <BarChart3 className="w-5 h-5" style={{ color: theme.colors.primary.dark }} />
              </button>
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(102, 126, 234, 0.3)',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '24px',
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
          <TaskModal
            key={`task-modal-${currentTask.id}-${currentTask.updatedAt}`}
            task={currentTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        ) : null;
      })()}

      {showQuickAdd && (
        <AddTaskModal
          isOpen={showQuickAdd}
          initialCategory={quickAddCategory}
          onClose={() => {
            console.log('Closing AddTask modal');
            setShowQuickAdd(false);
          }}
        />
      )}
      
      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
        />
      )}
      
      {/* Activity Tracker Modal */}
      {showActivityTracker && (
        <ActivityTrackerModal
          isOpen={showActivityTracker}
          onClose={() => setShowActivityTracker(false)}
          currentWeek={currentWeek}
        />
      )}
    </div>
  );
}

export default App;