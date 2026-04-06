import { useMemo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { SprintDashboardRow } from './SprintDashboardRow';
import { generateDayColumns, getTodayDateString } from '../../utils/sprintUtils';
import { UI_LABELS } from '../../constants/sprint';
import type { SprintWithMetrics } from '../../types/sprint';

interface SprintDashboardGridProps {
  sprint: SprintWithMetrics;
  onCellClick?: (metricId: string, date: string) => void;
  onNotesClick?: (metricName: string, date: string, notes: string) => void;
}

/**
 * SprintDashboardGrid - 7-day grid showing all metrics
 * Header row + 5 metric rows with progress column
 */
export const SprintDashboardGrid = ({ sprint, onCellClick, onNotesClick }: SprintDashboardGridProps) => {
  const theme = useThemeColors();

  // Generate day columns
  const dayColumns = useMemo(
    () => generateDayColumns(sprint.start_date, sprint.end_date),
    [sprint.start_date, sprint.end_date]
  );

  // Calculate days elapsed
  const daysElapsed = useMemo(() => {
    const today = getTodayDateString();
    let count = 0;
    for (const day of dayColumns) {
      if (day.date <= today) count++;
    }
    return count;
  }, [dayColumns]);

  // Sort metrics by display order
  const sortedMetrics = useMemo(
    () => [...sprint.metrics].sort((a, b) => a.display_order - b.display_order),
    [sprint.metrics]
  );

  if (sprint.metrics.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
        No metrics to display.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.surface.white,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border.light}`,
        overflow: 'hidden',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px repeat(7, 1fr) 90px',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: theme.colors.background.secondary,
          borderBottom: `1px solid ${theme.colors.border.light}`,
        }}
      >
        {/* Empty cell for metric column */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Metric
        </div>

        {/* Day headers */}
        {dayColumns.map((day) => (
          <div
            key={day.date}
            style={{
              textAlign: 'center',
              padding: '4px',
              borderRadius: theme.borderRadius.sm,
              backgroundColor: day.isToday ? theme.colors.primary.light : 'transparent',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: day.isToday ? theme.colors.primary.dark : theme.colors.text.muted,
                textTransform: 'uppercase',
              }}
            >
              {day.dayName}
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: day.isToday ? 700 : 500,
                color: day.isToday ? theme.colors.primary.dark : theme.colors.text.primary,
              }}
            >
              {day.dayNumber}
            </div>
          </div>
        ))}

        {/* Progress header */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        >
          {UI_LABELS.progressColumn}
        </div>
      </div>

      {/* Metric Rows */}
      <div style={{ padding: '8px 16px' }}>
        {sortedMetrics.map((metric) => (
          <SprintDashboardRow
            key={metric.id}
            metric={metric}
            dayColumns={dayColumns}
            daysElapsed={daysElapsed}
            onCellClick={onCellClick}
            onNotesClick={onNotesClick}
          />
        ))}
      </div>
    </div>
  );
};
