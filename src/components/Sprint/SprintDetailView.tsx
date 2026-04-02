import { useMemo, memo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { SprintDashboardGrid } from './SprintDashboardGrid';
import { SprintExportButton } from './SprintExportButton';
import { ArrowLeft, Target, Calendar, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { SprintWithMetrics } from '../../types/sprint';
import { calculateMetricWeeklyProgress, generateDayColumns } from '../../utils/sprintUtils';

interface SprintDetailViewProps {
  sprint: SprintWithMetrics;
  onBack: () => void;
}

/**
 * SprintDetailView - Read-only view of a completed sprint
 * Shows full grid and metrics summary
 */
export const SprintDetailView = memo(function SprintDetailView({
  sprint,
  onBack,
}: SprintDetailViewProps) {
  const theme = useThemeColors();

  // Calculate date range
  const dateRange = useMemo(() => {
    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    return `${format(start, 'MMMM d')} - ${format(end, 'MMMM d, yyyy')}`;
  }, [sprint.start_date, sprint.end_date]);

  // Calculate metrics progress
  const metricsProgress = useMemo(() => {
    const dayColumns = generateDayColumns(sprint.start_date, sprint.end_date);
    return sprint.metrics.map((metric) => {
      const progress = calculateMetricWeeklyProgress(metric, dayColumns);
      return {
        name: metric.name,
        current: progress.current,
        target: progress.target,
        met: progress.current >= progress.target,
      };
    });
  }, [sprint]);

  // Overall score
  const { metCount, score } = useMemo(() => {
    const met = metricsProgress.filter((m) => m.met).length;
    const total = metricsProgress.length;
    return {
      metCount: met,
      score: total > 0 ? Math.round((met / total) * 100) : 0,
    };
  }, [metricsProgress]);

  // Score color
  const scoreColor = useMemo(() => {
    if (score >= 80) return theme.colors.status.success.dark;
    if (score >= 60) return theme.colors.status.warning.dark;
    return theme.colors.status.error.dark;
  }, [score, theme]);

  const scoreBgColor = useMemo(() => {
    if (score >= 80) return theme.colors.status.success.light;
    if (score >= 60) return theme.colors.status.warning.light;
    return theme.colors.status.error.light;
  }, [score, theme]);

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
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Left: Title and dates */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
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
                <Target size={24} />
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
                  {sprint.name}
                </h2>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Completed
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.9,
                  marginLeft: '48px',
                }}
              >
                <Calendar size={16} />
                <span style={{ fontSize: '14px' }}>{dateRange}</span>
              </div>
            </div>

            {/* Right: Export + Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Export button */}
              <SprintExportButton sprint={sprint} variant="primary" />

              {/* Score */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: theme.borderRadius.md,
                  padding: '12px 20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '32px', fontWeight: 700 }}>{score}%</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Overall Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '20px',
        }}
      >
        {/* Left: Grid */}
        <div
          style={{
            background: theme.colors.surface.glass,
            backdropFilter: theme.effects.blur,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.surface.glassBorder}`,
            boxShadow: theme.effects.shadow.md,
            padding: '20px',
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

          {/* Grid - read-only (no click handlers) */}
          <SprintDashboardGrid sprint={sprint} />

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
          </div>
        </div>

        {/* Right: Summary */}
        <div
          style={{
            background: theme.colors.surface.glass,
            backdropFilter: theme.effects.blur,
            borderRadius: theme.borderRadius.lg,
            border: `1px solid ${theme.colors.surface.glassBorder}`,
            boxShadow: theme.effects.shadow.md,
            padding: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.colors.text.primary,
              margin: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Trophy size={18} color={scoreColor} />
            Final Results
          </h3>

          {/* Score summary */}
          <div
            style={{
              backgroundColor: scoreBgColor,
              borderRadius: theme.borderRadius.md,
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: scoreColor,
              }}
            >
              {metCount}/{metricsProgress.length}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: scoreColor,
                fontWeight: 500,
              }}
            >
              Weekly Targets Met
            </div>
          </div>

          {/* Individual metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metricsProgress.map((metric) => (
              <div
                key={metric.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.sm,
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {metric.met ? (
                    <CheckCircle size={18} color={theme.colors.status.success.dark} />
                  ) : (
                    <XCircle size={18} color={theme.colors.status.error.dark} />
                  )}
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.colors.text.primary,
                    }}
                  >
                    {metric.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: metric.met
                      ? theme.colors.status.success.dark
                      : theme.colors.status.error.dark,
                  }}
                >
                  {metric.current}/{metric.target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
