import { useMemo, memo, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Moon, Sun, Activity, Dumbbell, Briefcase } from 'lucide-react';
import { SprintDashboardCell } from './SprintDashboardCell';
import { SprintProgressCell } from './SprintProgressCell';
import {
  getCellDisplayValue,
  calculateMetricWeeklyProgress,
} from '../../utils/sprintUtils';
import type { SprintMetricWithEntries, DayColumn } from '../../types/sprint';

interface SprintDashboardRowProps {
  metric: SprintMetricWithEntries;
  dayColumns: DayColumn[];
  daysElapsed: number;
  onCellClick?: (metricId: string, date: string) => void;
  onNotesClick?: (metricName: string, date: string, notes: string) => void;
}

// Icon mapping - defined outside component to avoid recreation
const METRIC_ICONS = {
  Sleep: Moon,
  'Morning Routine': Sun,
  'IP Attack': Activity,
  Gym: Dumbbell,
  'Anthropic Progress': Briefcase,
} as const;

/**
 * SprintDashboardRow - A single row in the sprint grid
 * Shows metric name + 7 day cells + progress
 * Memoized to prevent unnecessary re-renders
 */
export const SprintDashboardRow = memo(function SprintDashboardRow({
  metric,
  dayColumns,
  daysElapsed,
  onCellClick,
  onNotesClick,
}: SprintDashboardRowProps) {
  const theme = useThemeColors();

  // Calculate weekly progress (memoized)
  const progress = useMemo(
    () => calculateMetricWeeklyProgress(metric, dayColumns),
    [metric, dayColumns]
  );

  // Create entry lookup map for O(1) access (memoized)
  const entryMap = useMemo(() => {
    const map = new Map<string, typeof metric.entries[0]>();
    for (const entry of metric.entries) {
      map.set(entry.entry_date, entry);
    }
    return map;
  }, [metric.entries]);

  // Memoize cell click handler factory
  const createCellClickHandler = useCallback(
    (date: string) => {
      if (!onCellClick) return undefined;
      return () => onCellClick(metric.id, date);
    },
    [onCellClick, metric.id]
  );

  // Memoize notes click handler factory
  const createNotesClickHandler = useCallback(
    (date: string, notes: string | null) => {
      if (!onNotesClick || !notes) return undefined;
      return () => onNotesClick(metric.name, date, notes);
    },
    [onNotesClick, metric.name]
  );

  const Icon = METRIC_ICONS[metric.name as keyof typeof METRIC_ICONS] || Activity;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '180px repeat(7, 1fr) 90px',
        gap: '8px',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: `1px solid ${theme.colors.border.light}`,
      }}
    >
      {/* Metric Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingRight: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: theme.borderRadius.sm,
            backgroundColor: theme.colors.primary.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={theme.colors.primary.dark} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: theme.colors.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {metric.name}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: theme.colors.text.muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {''}
          </div>
        </div>
      </div>

      {/* Day Cells */}
      {dayColumns.map((day) => {
        const entry = entryMap.get(day.date) || null;
        const displayValue = getCellDisplayValue(
          entry,
          metric.metric_type,
          metric.daily_target,
          day.isFuture
        );

        return (
          <SprintDashboardCell
            key={day.date}
            displayValue={displayValue}
            isFuture={day.isFuture}
            isToday={day.isToday}
            onClick={day.isEditable ? createCellClickHandler(day.date) : undefined}
            onNotesClick={createNotesClickHandler(day.date, displayValue.notes)}
          />
        );
      })}

      {/* Progress Cell */}
      <SprintProgressCell
        current={progress.current}
        target={progress.target}
        daysElapsed={daysElapsed}
      />
    </div>
  );
});
