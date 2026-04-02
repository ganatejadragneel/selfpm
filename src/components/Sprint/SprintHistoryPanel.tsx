import { useEffect, useState, useCallback, memo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSprint } from '../../hooks/useSprint';
import { SprintCard } from './SprintCard';
import { SprintDetailView } from './SprintDetailView';
import { LoadingSpinner } from '../ui';
import { History, ArrowLeft, AlertCircle, Calendar } from 'lucide-react';
import type { SprintWithMetrics, Sprint } from '../../types/sprint';

interface SprintHistoryPanelProps {
  onBack: () => void;
}

/**
 * SprintHistoryPanel - Shows list of completed sprints
 * Allows drilling down into individual sprint details
 */
export const SprintHistoryPanel = memo(function SprintHistoryPanel({
  onBack,
}: SprintHistoryPanelProps) {
  const theme = useThemeColors();
  const { fetchCompletedSprints, fetchSprintById, loading, error } = useSprint();

  const [completedSprints, setCompletedSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<SprintWithMetrics | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch completed sprints on mount
  useEffect(() => {
    if (initialized) return;

    const loadSprints = async () => {
      try {
        const sprints = await fetchCompletedSprints();
        setCompletedSprints(sprints);
        setInitialized(true);
      } catch {
        // Error handled by hook
      }
    };

    loadSprints();
  }, [fetchCompletedSprints, initialized]);

  // Handle card click - load full sprint details
  const handleSprintClick = useCallback(
    async (sprintId: string) => {
      setLoadingDetail(true);
      try {
        const sprint = await fetchSprintById(sprintId);
        setSelectedSprint(sprint);
      } catch {
        // Error handled by hook
      } finally {
        setLoadingDetail(false);
      }
    },
    [fetchSprintById]
  );

  // Handle back from detail view
  const handleBackFromDetail = useCallback(() => {
    setSelectedSprint(null);
  }, []);

  // If viewing a specific sprint, show detail view
  if (selectedSprint) {
    return (
      <SprintDetailView sprint={selectedSprint} onBack={handleBackFromDetail} />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header */}
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
            padding: '20px 24px',
            color: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={onBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <History size={24} />
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                Sprint History
              </h2>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: theme.borderRadius.md,
                padding: '8px 14px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {completedSprints.length} completed
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          background: theme.colors.surface.glass,
          backdropFilter: theme.effects.blur,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.surface.glassBorder}`,
          boxShadow: theme.effects.shadow.md,
          padding: '20px',
          minHeight: '400px',
        }}
      >
        {/* Loading state */}
        {(loading || loadingDetail) && !initialized && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <LoadingSpinner size="lg" text="Loading sprint history..." />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: theme.colors.status.error.dark,
            }}
          >
            <AlertCircle size={40} style={{ marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {initialized && completedSprints.length === 0 && !error && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: theme.colors.text.muted,
            }}
          >
            <Calendar
              size={48}
              color={theme.colors.text.muted}
              style={{ marginBottom: '16px', opacity: 0.5 }}
            />
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: theme.colors.text.secondary,
                margin: '0 0 8px 0',
              }}
            >
              No completed sprints yet
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Complete your first sprint to see it here
            </p>
          </div>
        )}

        {/* Sprint list */}
        {initialized && completedSprints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedSprints.map((sprint) => (
              <SprintCardWrapper
                key={sprint.id}
                sprint={sprint}
                onClick={() => handleSprintClick(sprint.id)}
                fetchSprintById={fetchSprintById}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Wrapper to load full sprint data for card display
interface SprintCardWrapperProps {
  sprint: Sprint;
  onClick: () => void;
  fetchSprintById: (id: string) => Promise<SprintWithMetrics | null>;
}

const SprintCardWrapper = memo(function SprintCardWrapper({
  sprint,
  onClick,
  fetchSprintById,
}: SprintCardWrapperProps) {
  const [fullSprint, setFullSprint] = useState<SprintWithMetrics | null>(null);

  useEffect(() => {
    const loadFull = async () => {
      const full = await fetchSprintById(sprint.id);
      setFullSprint(full);
    };
    loadFull();
  }, [sprint.id, fetchSprintById]);

  if (!fullSprint) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#888',
        }}
      >
        Loading {sprint.name}...
      </div>
    );
  }

  return <SprintCard sprint={fullSprint} onClick={onClick} />;
});
