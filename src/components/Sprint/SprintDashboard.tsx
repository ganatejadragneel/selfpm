import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSprint } from '../../hooks/useSprint';
import { SprintEntryPanel } from './SprintEntryPanel';
import { SprintDashboardGrid } from './SprintDashboardGrid';
import { SprintNotesPopup } from './SprintNotesPopup';
import { SprintHistoryPanel } from './SprintHistoryPanel';
import { SprintExportButton } from './SprintExportButton';
import { SprintCompleteButton } from './SprintCompleteButton';
import { StartNewSprintScreen } from './StartNewSprintScreen';
import { ManageMetricsPanel } from './ManageMetricsPanel';
import { LoadingSpinner } from '../ui';
import { Zap, Calendar, AlertCircle, History, Clock } from 'lucide-react';
import { format, parseISO, isAfter, startOfToday, isToday } from 'date-fns';
import type { EntryData, SprintSuggestion, MetricType, DailyTarget, MetricComponents, WeeklyTarget } from '../../types/sprint';
import { getCurrentSprintDates } from '../../constants/sprint';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuthStore } from '../../store/supabaseAuthStore';

// State type for notes popup
interface NotesPopupState {
  metricName: string;
  date: string;
  notes: string;
}

/**
 * SprintDashboard - Main sprint tracking interface
 *
 * Phase 5: Full dashboard with grid view
 * - Shows StartNewSprintScreen when no active sprint
 * - Displays sprint header with dates and progress overview
 * - SprintEntryPanel for entering daily data
 * - SprintDashboardGrid for viewing the week
 * - ManageMetricsPanel for metric CRUD
 */
export const SprintDashboard = () => {
  const theme = useThemeColors();
  const navigate = useNavigate();
  const {
    loading,
    error,
    activeSprint,
    sprintProgress,
    saveEntry,
    completeSprint,
    refreshActiveSprint,
    createSprint,
    cloneSprintMetrics,
    deleteSprint,
    addMetric,
    updateMetric,
    deleteMetric,
    updateMetricType,
    reorderMetrics,
    fetchCompletedSprintCount,
    fetchSuggestions,
    reopenSprint,
  } = useSprint();

  const [saving, setSaving] = useState(false);
  const [notesPopup, setNotesPopup] = useState<NotesPopupState | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics'>('overview');
  const [triggerAddMetric, setTriggerAddMetric] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [suggestions, setSuggestions] = useState<SprintSuggestion[]>([]);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  const [lastCompletedEndDate, setLastCompletedEndDate] = useState<string | null>(null);

  // Fetch suggestions once on mount
  useEffect(() => {
    fetchSuggestions().then(setSuggestions);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch completed count + last sprint ID when no active sprint
  useEffect(() => {
    if (activeSprint || loading) return;
    fetchCompletedSprintCount().then(count => {
      setCompletedCount(count);
      if (count > 0) {
        const userId = useSupabaseAuthStore.getState().user?.id;
        if (!userId) return;
        supabase
          .from('sprints')
          .select('id, end_date')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('end_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) {
              setLastCompletedId(data.id);
              setLastCompletedEndDate((data as { id: string; end_date?: string }).end_date ?? null);
            }
          });
      }
    });
  }, [activeSprint, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Start Fresh
  const handleStartFresh = async () => {
    const { startDate, endDate } = getCurrentSprintDates();
    setCreatingLoading(true);
    try {
      await createSprint(startDate, endDate);
      await refreshActiveSprint();
    } finally {
      setCreatingLoading(false);
    }
  };

  // Handle Clone Last Sprint
  const handleCloneLast = async () => {
    if (!lastCompletedId) return;
    const { startDate, endDate } = getCurrentSprintDates();
    setCreatingLoading(true);
    try {
      const newId = await createSprint(startDate, endDate);
      try {
        await cloneSprintMetrics(lastCompletedId, newId);
      } catch (e) {
        await deleteSprint(newId);
        throw e;
      }
      await refreshActiveSprint();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Clone failed');
    } finally {
      setCreatingLoading(false);
    }
  };

  // Reopen last sprint — only valid if today is still within its week
  const canReopenLast = !!(lastCompletedId && lastCompletedEndDate &&
    !isAfter(startOfToday(), parseISO(lastCompletedEndDate)));

  const handleReopenLast = async () => {
    if (!lastCompletedId) return;
    setCreatingLoading(true);
    try {
      await reopenSprint(lastCompletedId);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reopen failed');
    } finally {
      setCreatingLoading(false);
    }
  };

  // Handle saving an entry
  const handleSaveEntry = useCallback(
    async (metricId: string, entryDate: string, data: EntryData) => {
      setSaving(true);
      try {
        console.log('Saving entry:', { metricId, entryDate, data });
        await saveEntry(metricId, entryDate, data);
        console.log('Entry saved successfully');
        // Refresh to get updated data
        await refreshActiveSprint();
      } catch (err) {
        console.error('Failed to save entry:', err);
        // Re-throw so the card knows it failed
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [saveEntry, refreshActiveSprint]
  );

  // Handle cell click in grid (for future: open entry modal)
  const handleCellClick = useCallback((metricId: string, date: string) => {
    // Future: could open a quick-edit modal
    console.log('Cell clicked:', metricId, date);
  }, []);

  // Handle notes icon click - opens full notes popup
  const handleNotesClick = useCallback(
    (metricName: string, date: string, notes: string) => {
      setNotesPopup({ metricName, date, notes });
    },
    []
  );

  // Handle closing notes popup
  const handleCloseNotesPopup = useCallback(() => {
    setNotesPopup(null);
  }, []);

  // Handle history navigation
  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const handleBackFromHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  // Handle adding a metric
  const handleAddMetric = async (data: Parameters<typeof addMetric>[1]) => {
    if (!activeSprint) return;
    await addMetric(activeSprint.id, data);
  };

  // Handle editing a metric
  const handleEditMetric = async (metricId: string, data: {
    typeChanged: boolean;
    metric_type: MetricType;
    daily_target: DailyTarget;
    components: MetricComponents;
    name: string;
    weekly_target: WeeklyTarget;
    display_order: number;
  }) => {
    const { typeChanged, metric_type, daily_target, components, name, weekly_target } = data;
    if (typeChanged) {
      await updateMetricType(metricId, metric_type, daily_target, components);
      await updateMetric(metricId, { name, weekly_target });
    } else {
      await updateMetric(metricId, { name, metric_type, daily_target, components, weekly_target });
    }
  };

  // Show loading state
  if (loading && !activeSprint) {
    return (
      <div
        style={{
          background: theme.colors.surface.glass,
          backdropFilter: theme.effects.blur,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.surface.glassBorder}`,
          boxShadow: theme.effects.shadow.md,
          padding: '48px',
          textAlign: 'center',
        }}
      >
        <LoadingSpinner size="lg" text="Loading Sprint Focus..." />
      </div>
    );
  }

  // Show error state only for real load failures (not transient network errors after actions)
  const isHardLoadError = error && !activeSprint && !loading &&
    !error.includes('Failed to fetch') && !error.includes('NetworkError') && !error.includes('network');
  if (isHardLoadError) {
    return (
      <div
        style={{
          background: theme.colors.surface.glass,
          backdropFilter: theme.effects.blur,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.status.error.medium}`,
          boxShadow: theme.effects.shadow.md,
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <AlertCircle
          size={48}
          color={theme.colors.status.error.dark}
          style={{ marginBottom: '16px' }}
        />
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: theme.colors.status.error.dark,
            marginBottom: '8px',
          }}
        >
          Failed to Load Sprint
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  // No active sprint - show start screen
  if (!loading && !activeSprint) {
    return (
      <StartNewSprintScreen
        onStartFresh={handleStartFresh}
        onCloneLast={handleCloneLast}
        onReopenLast={handleReopenLast}
        canReopenLast={canReopenLast}
        completedSprintCount={completedCount}
        loading={creatingLoading}
      />
    );
  }

  // Show history view if requested
  if (showHistory) {
    return <SprintHistoryPanel onBack={handleBackFromHistory} />;
  }

  // At this point activeSprint is guaranteed non-null
  const metricCount = activeSprint!.metrics.length;
  const subtitle = `${metricCount} metric${metricCount !== 1 ? 's' : ''}`;

  // Format dates for display
  const startDate = parseISO(activeSprint!.start_date);
  const endDate = parseISO(activeSprint!.end_date);
  const dateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  // Sprint is expired if today is strictly after end_date
  const isExpired = isAfter(startOfToday(), endDate);
  const isLastDay = isToday(endDate); // Sunday — last day of sprint

  const handleCompleteAndStartNew = async () => {
    try {
      await completeSprint(activeSprint!.id);
    } catch {
      // ignore — completeSprint already has a direct-update fallback
    }
    navigate('/sprints');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Expired sprint banner */}
      {isExpired && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', flexWrap: 'wrap',
          background: theme.currentTheme === 'dark' ? 'rgba(99,102,241,0.18)' : '#4f46e5',
          border: theme.currentTheme === 'dark' ? '1px solid rgba(99,102,241,0.4)' : 'none',
          borderRadius: theme.borderRadius.md,
          padding: '14px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Clock size={18} color={theme.currentTheme === 'dark' ? '#a5b4fc' : 'rgba(255,255,255,0.85)'} />
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.currentTheme === 'dark' ? '#c7d2fe' : '#fff' }}>
              This sprint has ended ({format(endDate, 'MMM d, yyyy')})
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: theme.currentTheme === 'dark' ? '#a5b4fc' : 'rgba(255,255,255,0.8)' }}>
              Complete it to start a new one.
            </span>
          </div>
          <button
            onClick={handleCompleteAndStartNew}
            style={{
              padding: '8px 18px', borderRadius: theme.borderRadius.sm,
              background: theme.currentTheme === 'dark' ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.2)',
              color: theme.currentTheme === 'dark' ? '#c7d2fe' : '#fff',
              border: theme.currentTheme === 'dark' ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.4)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Complete &amp; Start New Sprint
          </button>
        </div>
      )}

      {/* Header Card */}
      <div
        style={{
          background: theme.colors.surface.glass,
          backdropFilter: theme.effects.blur,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.surface.glassBorder}`,
          boxShadow: theme.effects.shadow.md,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundImage: theme.colors.primary.gradient,
            padding: '14px 20px',
            color: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {/* Title and dates */}
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
              >
                <Zap size={18} />
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Sprint Focus</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9 }}>
                <Calendar size={13} />
                <span style={{ fontSize: '13px' }}>{dateRange}</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {subtitle}
                </span>
              </div>
            </div>

            {/* Right side: Progress + History button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* History button */}
              <button
                onClick={handleShowHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                <History size={14} />
                History
              </button>

              {/* Progress summary */}
              {sprintProgress && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: theme.borderRadius.md,
                    padding: '6px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.1 }}>{sprintProgress.overallScore}%</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>On Track</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Left: Entry Panel */}
        <SprintEntryPanel sprint={activeSprint!} onSaveEntry={handleSaveEntry} saving={saving} onGoToManageMetrics={() => { setActiveTab('metrics'); setTriggerAddMetric(true); }} />

        {/* Right: Tabbed panel — Weekly Overview | Manage Metrics */}
        <div
          style={{
            background: theme.colors.surface.glass,
            backdropFilter: theme.effects.blur,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.surface.glassBorder}`,
            boxShadow: theme.effects.shadow.md,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Tab bar */}
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '12px 16px 0',
            borderBottom: `1px solid ${theme.colors.border.light}`,
          }}>
            {(['overview', 'metrics'] as const).map(tab => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px 8px 0 0',
                    border: `1px solid ${active ? theme.colors.border.light : 'transparent'}`,
                    borderBottom: active ? `1px solid ${theme.colors.surface.glass}` : 'none',
                    background: active ? theme.colors.surface.glass : 'transparent',
                    color: active ? theme.colors.text.primary : theme.colors.text.muted,
                    fontSize: '13px',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    marginBottom: active ? '-1px' : '0',
                    fontFamily: 'inherit',
                  }}
                >
                  {tab === 'overview' ? 'Weekly Overview' : 'Manage Metrics'}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px', overflow: 'auto' }}>
            {activeTab === 'overview' ? (
              <>
                <SprintDashboardGrid
                  sprint={activeSprint!}
                  onCellClick={handleCellClick}
                  onNotesClick={handleNotesClick}
                />

                {/* Legend */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: theme.colors.text.muted }}>
                  {[
                    { color: theme.colors.status.success.light, border: theme.colors.status.success.medium, label: 'Target met' },
                    { color: theme.colors.status.warning.light, border: theme.colors.status.warning.medium, label: 'Target not met' },
                    { color: theme.colors.background.tertiary, border: theme.colors.border.light, label: 'No entry' },
                  ].map(({ color, border, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: color, border: `1px solid ${border}` }} />
                      {label}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: `2px solid ${theme.colors.primary.dark}` }} />
                    Today
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${theme.colors.border.light}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <SprintExportButton sprint={activeSprint!} />
                  {(isLastDay || isExpired) && (
                    <button
                      onClick={handleCompleteAndStartNew}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: theme.borderRadius.md,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', fontSize: '14px', fontWeight: 500,
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      Start Next Sprint
                    </button>
                  )}
                  <SprintCompleteButton sprintId={activeSprint!.id} />
                </div>
              </>
            ) : (
              <ManageMetricsPanel
                sprintId={activeSprint!.id}
                metrics={activeSprint!.metrics}
                suggestions={suggestions}
                onAdd={handleAddMetric}
                onEdit={handleEditMetric}
                onDelete={deleteMetric}
                onReorder={reorderMetrics}
                triggerAddOpen={triggerAddMetric}
                onAddOpenHandled={() => setTriggerAddMetric(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Notes Popup */}
      {notesPopup && (
        <SprintNotesPopup
          notes={notesPopup.notes}
          metricName={notesPopup.metricName}
          entryDate={notesPopup.date}
          onClose={handleCloseNotesPopup}
        />
      )}
    </div>
  );
};
