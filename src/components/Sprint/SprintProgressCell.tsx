import { useMemo, memo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PROGRESS_COLORS } from '../../constants/sprint';

interface SprintProgressCellProps {
  current: number;
  target: number;
  daysElapsed: number;
}

/**
 * SprintProgressCell - Shows X/Y progress for a metric
 * Color coded: green (on track), yellow (at risk), red (behind)
 * Memoized to prevent unnecessary re-renders
 */
export const SprintProgressCell = memo(function SprintProgressCell({
  current,
  target,
  daysElapsed,
}: SprintProgressCellProps) {
  const theme = useThemeColors();

  // Memoize progress calculations
  const { statusColor, backgroundColor } = useMemo(() => {
    // Calculate expected progress at this point
    const expectedProgress = (target / 7) * daysElapsed;
    const progressRatio = expectedProgress > 0 ? current / expectedProgress : current > 0 ? 1 : 0;

    // Determine colors based on progress ratio
    if (progressRatio >= 1) {
      return {
        statusColor: PROGRESS_COLORS.onTrack,
        backgroundColor: theme.colors.status.success.light,
      };
    }
    if (progressRatio >= 0.7) {
      return {
        statusColor: PROGRESS_COLORS.atRisk,
        backgroundColor: theme.colors.status.warning.light,
      };
    }
    return {
      statusColor: PROGRESS_COLORS.behind,
      backgroundColor: theme.colors.status.error.light,
    };
  }, [current, target, daysElapsed, theme]);

  return (
    <div
      style={{
        padding: '8px 12px',
        backgroundColor,
        borderRadius: theme.borderRadius.sm,
        border: `1px solid ${statusColor}20`,
        textAlign: 'center',
        minWidth: '70px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: '2px',
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: statusColor,
          }}
        >
          {current}
        </span>
        <span
          style={{
            fontSize: '13px',
            color: theme.colors.text.muted,
          }}
        >
          /{target}
        </span>
      </div>
    </div>
  );
});
