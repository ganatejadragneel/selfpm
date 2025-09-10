import { useEffect } from 'react';
import { useMigratedTaskStore } from './store/migratedTaskStore';
import { useTaskActions } from './hooks/useTaskActions';
import { useModalState } from './hooks/useModalState';
import { ThemeProvider } from './contexts/ThemeContext';
import { useThemeColors } from './hooks/useThemeColors';
import { AuthGuard } from './components/auth/AuthGuard';
import { WeeklySummary } from './components/WeeklySummary';
import { DailyTaskTracker } from './components/DailyTaskTracker';
import { WeekNavigationHeader } from './components/layout/WeekNavigationHeader';
import { TaskBoard } from './components/layout/TaskBoard';
import { ModalManager } from './components/layout/ModalManager';

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
  } = useMigratedTaskStore();

  const { handleStatusToggle, handleDelete } = useTaskActions();
  const { modalState, actions } = useModalState();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next' ? currentWeek + 1 : currentWeek - 1;
    setCurrentWeek(newWeek);
    fetchTasks(newWeek);
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
      <WeekNavigationHeader
        currentWeek={currentWeek}
        onWeekChange={handleWeekChange}
        onShowQuickAdd={actions.openQuickAdd}
        onShowBulkUpload={actions.openBulkUpload}
        onShowActivityTracker={actions.openActivityTracker}
        onShowDailyTaskAnalytics={actions.openDailyTaskAnalytics}
      />

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto'
      }}>
        <div style={{ 
          marginBottom: '24px',
          background: theme.colors.surface.glass,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.surface.glassBorder}`,
          overflow: 'hidden'
        }}>
          <WeeklySummary tasks={tasks} weekNumber={currentWeek} />
        </div>
        
        <TaskBoard
          tasks={tasks}
          onTaskSelect={actions.openTask}
          onStatusToggle={(taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (task) handleStatusToggle(task);
          }}
          onTaskDelete={handleDelete}
        />
        
        {loading && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
              Loading...
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      <ModalManager
        modalState={modalState}
        tasks={tasks}
        currentWeek={currentWeek}
        onCloseTask={actions.closeTask}
        onCloseQuickAdd={actions.closeQuickAdd}
        onCloseBulkUpload={actions.closeBulkUpload}
        onCloseActivityTracker={actions.closeActivityTracker}
        onCloseDailyTaskAnalytics={actions.closeDailyTaskAnalytics}
      />
    </div>
  );
}

export default App;