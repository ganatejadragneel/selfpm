import { memo, useMemo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Calendar, ChevronRight, Trophy, Target } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { SprintWithMetrics } from '../../types/sprint';
import { calculateMetricWeeklyProgress, generateDayColumns } from '../../utils/sprintUtils';

interface SprintCardProps {
  sprint: SprintWithMetrics;
  onClick: () => void;
}

/**
 * SprintCard - Summary card for a completed sprint
 * Shows date range, overall score, and metric breakdown
 */
export const SprintCard = memo(function SprintCard({ sprint, onClick }: SprintCardProps) {
  const theme = useThemeColors();

  // Calculate metrics that met weekly target
  const { metCount, totalMetrics, score } = useMemo(() => {
    const dayColumns = generateDayColumns(sprint.start_date, sprint.end_date);
    let met = 0;
    const total = sprint.metrics.length;

    for (const metric of sprint.metrics) {
      const progress = calculateMetricWeeklyProgress(metric, dayColumns);
      if (progress.current >= progress.target) {
        met++;
      }
    }

    return {
      metCount: met,
      totalMetrics: total,
      score: total > 0 ? Math.round((met / total) * 100) : 0,
    };
  }, [sprint]);

  // Format dates
  const dateRange = useMemo(() => {
    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }, [sprint.start_date, sprint.end_date]);

  // Determine score color
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
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.surface.white,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.border.light}`,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary.medium;
        e.currentTarget.style.boxShadow = theme.effects.shadow.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.colors.border.light;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Left: Sprint info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <Target size={18} color={theme.colors.primary.dark} />
          <span
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: theme.colors.text.primary,
            }}
          >
            {sprint.name}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: theme.colors.text.muted,
            fontSize: '13px',
          }}
        >
          <Calendar size={14} />
          <span>{dateRange}</span>
        </div>

        {/* Metric breakdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            fontSize: '13px',
            color: theme.colors.text.secondary,
          }}
        >
          <Trophy size={14} color={scoreColor} />
          <span>
            {metCount}/{totalMetrics} metrics achieved
          </span>
        </div>
      </div>

      {/* Right: Score badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: scoreBgColor,
            color: scoreColor,
            padding: '8px 14px',
            borderRadius: theme.borderRadius.md,
            fontWeight: 700,
            fontSize: '18px',
            minWidth: '60px',
            textAlign: 'center',
          }}
        >
          {score}%
        </div>
        <ChevronRight size={20} color={theme.colors.text.muted} />
      </div>
    </div>
  );
});
