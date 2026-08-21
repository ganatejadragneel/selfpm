import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { SprintDashboard } from './components/Sprint';
import { PrivacyPledge } from './components/PrivacyPledge';
import { PrivacyPledgeModal, hasAcceptedPrivacyPledge } from './components/PrivacyPledgeModal';
import { ChevronLeft, ChevronRight, Calendar, Plus, Shield } from 'lucide-react';
import { QuickNotesPage, QuickNoteFAB } from './components/QuickNotes';
import { FocusDashboard } from './components/Focus';
import { PagesPage } from './components/Pages';
import { ReportsPage } from './components/Reports';
import { AppShell, type ShellTab } from './components/AppShell';
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
  const { isMobile } = useResponsive();
  const {
    openTaskModal,
    openAddTaskModal,
    openDailyAnalyticsModal,
  } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab: ShellTab = location.pathname.startsWith('/pages')
    ? 'pages'
    : location.pathname.startsWith('/cpo-reports')
      ? 'cpo-reports'
      : 'dashboard';

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const showPrivacyPledge = useToggle(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(() => !hasAcceptedPrivacyPledge());

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

    const activeTask = tasks.find(t => t.id === activeTaskId);
    if (!activeTask) return;

    const isDroppedOnCategory = ['life_admin', 'work', 'weekly_recurring'].includes(overId);

    if (isDroppedOnCategory) {
      const newCategory = overId as TaskCategory;
      if (activeTask.category !== newCategory) {
        await moveTaskToCategory(activeTaskId, newCategory);
      }
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;

      const activeCategory = activeTask.category;
      const overCategory = overTask.category;

      if (activeCategory === overCategory) {
        const categoryTasks = tasksByCategory[activeCategory];
        const oldIndex = categoryTasks.findIndex(t => t.id === activeTaskId);
        const newIndex = categoryTasks.findIndex(t => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newTaskOrder = arrayMove(categoryTasks, oldIndex, newIndex);
          const updatedTasks = tasks.map(task => {
            const orderIndex = newTaskOrder.findIndex(t => t.id === task.id);
            if (orderIndex !== -1) {
              return { ...task, order: orderIndex };
            }
            return task;
          });

          useMigratedTaskStore.setState({ tasks: updatedTasks });

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
        await moveTaskToCategory(activeTaskId, overCategory);
      }
    }
  };

  const currentDate = new Date();
  const weekStart = addWeeks(currentDate, currentWeek - getWeek(currentDate));

  const pageWrap: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: isMobile ? '16px 12px' : '24px',
  };

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

  // The legacy task board (week overview) — now on its own /tasks route.
  const tasksBoard = (
    <div style={pageWrap}>
      {/* board toolbar: week nav + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="navigation"
            isMobile={isMobile}
            onClick={() => handleWeekChange('prev')}
            icon={<ChevronLeft className={isMobile ? 'w-3 h-3' : 'w-5 h-5'} />}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: isMobile ? '6px 10px' : '10px 18px',
            backgroundImage: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.2)',
            minWidth: isMobile ? '120px' : '200px', justifyContent: 'center'
          }}>
            <Calendar className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} style={{ color: '#667eea' }} />
            <span style={{
              fontWeight: '600',
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              fontSize: isMobile ? '11px' : '14px', textAlign: 'center'
            }}>
              {`Week ${currentWeek} - ${format(weekStart, 'MMM d, yyyy')}`}
            </span>
          </div>
          <Button
            variant="navigation"
            isMobile={isMobile}
            onClick={() => handleWeekChange('next')}
            icon={<ChevronRight className={isMobile ? 'w-3 h-3' : 'w-5 h-5'} />}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => openAddTaskModal('life_admin')} icon={<Plus className="w-4 h-4" />}>
            Add Task
          </Button>
          {!isMobile && (
            <Button variant="primary" onClick={showPrivacyPledge.toggle} icon={<Shield className="w-4 h-4" />} title="Privacy Pledge">
              Privacy Pledge
            </Button>
          )}
          <Button variant="primary" onClick={() => openDailyAnalyticsModal()} icon={<Calendar className="w-4 h-4" />} title="Daily Task Analytics" />
        </div>
      </div>

      {showPrivacyPledge.value && (
        <div style={{ marginBottom: '32px' }}>
          <PrivacyPledge onClose={showPrivacyPledge.toggle} />
        </div>
      )}

      {!showPrivacyPledge.value && (
        <div style={{ marginBottom: '32px' }}>
          <WeeklySummary tasks={tasks} weekNumber={currentWeek} onTaskClick={(task) => openTaskModal(task)} />
        </div>
      )}

      {!showPrivacyPledge.value && (loading ? (
        <LoadingSpinner size="lg" text="Loading tasks..." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: isMobile ? '16px' : '24px',
            minHeight: 'calc(100vh - 400px)'
          }}>
            <ModernCategoryColumn category="life_admin" tasks={tasksByCategory.life_admin} onTaskClick={openTaskModal} onTaskStatusToggle={handleStatusToggle} onDeleteTask={(task) => handleDelete(task.id)} onAddTask={() => openAddTaskModal('life_admin')} />
            <ModernCategoryColumn category="work" tasks={tasksByCategory.work} onTaskClick={openTaskModal} onTaskStatusToggle={handleStatusToggle} onDeleteTask={(task) => handleDelete(task.id)} onAddTask={() => openAddTaskModal('work')} />
            <ModernCategoryColumn category="weekly_recurring" tasks={tasksByCategory.weekly_recurring} onTaskClick={openTaskModal} onTaskStatusToggle={handleStatusToggle} onDeleteTask={(task) => handleDelete(task.id)} onAddTask={() => openAddTaskModal('weekly_recurring')} />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div style={{ opacity: 0.8, transform: 'rotate(5deg)', pointerEvents: 'none' }}>
                <div style={{
                  padding: theme.spacing.lg, background: theme.colors.surface.glass,
                  borderRadius: theme.borderRadius.lg, border: '2px solid rgba(102, 126, 234, 0.5)',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)', backdropFilter: theme.effects.blur
                }}>
                  <h3 style={{ fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.semibold, color: theme.colors.text.primary, margin: 0 }}>
                    {activeTask.title}
                  </h3>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: theme.currentTheme === 'dark' ? 'none' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      // Dark: transparent, so the body's aurora is the canvas for every route.
      // An opaque root here would flatten it back to black.
      backgroundColor: 'transparent',
      color: theme.colors.text.primary
    }}>
      {/* ORE logging bar */}
      <DailyTaskTracker />

      {/* Persistent app shell — nav tabs + capture cluster */}
      <AppShell
        activeTab={activeTab}
        onTabChange={(tab) => navigate(`/${tab}`)}
        onCapture={(kind) => navigate(kind === 'page' ? '/pages' : kind === 'note' ? '/allNotes' : '/tasks')}
        onPrivacyPledge={() => setShowPrivacyModal(true)}
        onOreReport={() => openDailyAnalyticsModal()}
        rightSlot={<UserMenu />}
      />

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<div style={pageWrap}><FocusDashboard /></div>} />
        <Route path="/pages" element={<div style={pageWrap}><PagesPage /></div>} />
        <Route path="/cpo-reports" element={<div style={pageWrap}><ReportsPage /></div>} />
        <Route path="/tasks" element={tasksBoard} />
        <Route path="/allNotes" element={<QuickNotesPage />} />
        <Route path="/sprints" element={<div style={pageWrap}><SprintDashboard /></div>} />
        <Route path="/focus" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Privacy Pledge First-Login Modal */}
      <PrivacyPledgeModal isOpen={showPrivacyModal} onAccept={() => setShowPrivacyModal(false)} />

      {/* Modals */}
      <ModalRegistry tasks={tasks} currentWeek={currentWeek} />

      {/* Persistent Quick Notes FAB */}
      <QuickNoteFAB />
    </div>
  );
}

export default App;
export { AppContent };
