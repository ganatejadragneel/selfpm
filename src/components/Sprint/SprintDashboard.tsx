import { useState, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSprint } from '../../hooks/useSprint';
import { SprintEntryPanel } from './SprintEntryPanel';
import { SprintDashboardGrid } from './SprintDashboardGrid';
import { SprintNotesPopup } from './SprintNotesPopup';
import { SprintHistoryPanel } from './SprintHistoryPanel';
import { SprintExportButton } from './SprintExportButton';
import { SprintCompleteButton } from './SprintCompleteButton';
import { LoadingSpinner } from '../ui';
import { Target, Calendar, AlertCircle, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { EntryData } from '../../types/sprint';

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
 * - Auto-creates sprint on mount for authenticated users
 * - Displays sprint header with dates and progress overview
 * - SprintEntryPanel for entering daily data
 * - SprintDashboardGrid for viewing the week
 */
export const SprintDashboard = () => {
  const theme = useThemeColors();
  const {
    loading,
    error,
    activeSprint,
    sprintProgress,
    saveEntry,
    refreshActiveSprint,
  } = useSprint();

  const [saving, setSaving] = useState(false);
  const [notesPopup, setNotesPopup] = useState<NotesPopupState | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  // Show error state
  if (error && !activeSprint) {
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

  // No sprint yet (shouldn't happen with auto-creation, but handle gracefully)
  if (!activeSprint) {
    return (
      <div
        style={{
          background: theme.colors.surface.glass,
          backdropFilter: theme.effects.blur,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.surface.glassBorder}`,
          boxShadow: theme.effects.shadow.md,
          padding: '32px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: theme.colors.text.secondary }}>Initializing sprint...</p>
      </div>
    );
  }

  // Show history view if requested
  if (showHistory) {
    return <SprintHistoryPanel onBack={handleBackFromHistory} />;
  }

  // Format dates for display
  const startDate = parseISO(activeSprint.start_date);
  const endDate = parseISO(activeSprint.end_date);
  const dateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
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
            padding: '24px',
            color: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Title and dates */}
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}
              >
                <Target size={28} />
                <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Sprint Focus</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
                <Calendar size={16} />
                <span style={{ fontSize: '14px' }}>{dateRange}</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {activeSprint.name}
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
                  gap: '6px',
                  padding: '10px 16px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '14px',
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
                <History size={18} />
                History
              </button>

              {/* Progress summary */}
              {sprintProgress && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: theme.borderRadius.md,
                    padding: '12px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '32px', fontWeight: 700 }}>{sprintProgress.overallScore}%</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>On Track</div>
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
          minHeight: '500px',
        }}
      >
        {/* Left: Entry Panel */}
        <SprintEntryPanel sprint={activeSprint} onSaveEntry={handleSaveEntry} saving={saving} />

        {/* Right: Dashboard Grid */}
        <div
          style={{
            background: theme.colors.surface.glass,
            backdropFilter: theme.effects.blur,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.surface.glassBorder}`,
            boxShadow: theme.effects.shadow.md,
            padding: '20px',
            overflow: 'auto',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.colors.text.primary,
              margin: 0,
              marginBottom: '16px',
            }}
          >
            Weekly Overview
          </h3>

          {/* Grid Component */}
          <SprintDashboardGrid
            sprint={activeSprint}
            onCellClick={handleCellClick}
            onNotesClick={handleNotesClick}
          />

          {/* Legend */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: theme.colors.text.muted,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: theme.colors.status.success.light,
                  border: `1px solid ${theme.colors.status.success.medium}`,
                }}
              />
              Target met
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: theme.colors.status.warning.light,
                  border: `1px solid ${theme.colors.status.warning.medium}`,
                }}
              />
              Target not met
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              />
              No entry
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  border: `2px solid ${theme.colors.primary.dark}`,
                }}
              />
              Today
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.colors.border.light}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: theme.colors.text.muted,
              }}
            >
              Sprint Actions
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <SprintExportButton sprint={activeSprint} />
              <SprintCompleteButton sprintId={activeSprint.id} />
            </div>
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
