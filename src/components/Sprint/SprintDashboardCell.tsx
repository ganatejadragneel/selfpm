import { useMemo, memo, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { MessageSquare } from 'lucide-react';
import { CELL_COLORS } from '../../constants/sprint';
import type { CellDisplayValue } from '../../types/sprint';

interface SprintDashboardCellProps {
  displayValue: CellDisplayValue;
  isFuture?: boolean;
  isToday?: boolean;
  onClick?: () => void;
  onNotesClick?: () => void;
}

/**
 * SprintDashboardCell - Individual cell in the sprint grid
 * Shows value with color coding based on target met/not met
 * Hover shows notes tooltip, click on notes icon opens full popup
 * Memoized to prevent unnecessary re-renders
 */
export const SprintDashboardCell = memo(function SprintDashboardCell({
  displayValue,
  isFuture = false,
  isToday = false,
  onClick,
  onNotesClick,
}: SprintDashboardCellProps) {
  const theme = useThemeColors();

  // Memoize color calculations
  const { backgroundColor, textColor, borderColor } = useMemo(() => {
    // Future cells
    if (isFuture) {
      return {
        backgroundColor: CELL_COLORS.future,
        textColor: theme.colors.text.muted,
        borderColor: theme.colors.border.light,
      };
    }

    // No entry
    if (!displayValue.hasEntry) {
      return {
        backgroundColor: theme.colors.background.tertiary,
        textColor: theme.colors.text.muted,
        borderColor: isToday ? theme.colors.primary.dark : theme.colors.border.light,
      };
    }

    // Target met
    if (displayValue.metTarget === true) {
      return {
        backgroundColor: theme.colors.status.success.light,
        textColor: theme.colors.status.success.dark,
        borderColor: isToday ? theme.colors.primary.dark : theme.colors.status.success.medium,
      };
    }

    // Target not met
    if (displayValue.metTarget === false) {
      return {
        backgroundColor: theme.colors.status.warning.light,
        textColor: theme.colors.status.warning.dark,
        borderColor: isToday ? theme.colors.primary.dark : theme.colors.status.warning.medium,
      };
    }

    // Default
    return {
      backgroundColor: theme.colors.background.secondary,
      textColor: theme.colors.text.primary,
      borderColor: isToday ? theme.colors.primary.dark : theme.colors.border.light,
    };
  }, [isFuture, isToday, displayValue.hasEntry, displayValue.metTarget, theme]);

  // Handle notes icon click
  const handleNotesClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent cell onClick from firing
      onNotesClick?.();
    },
    [onNotesClick]
  );

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '8px 4px',
        backgroundColor,
        borderRadius: theme.borderRadius.sm,
        border: `${isToday ? '2px' : '1px'} solid ${borderColor}`,
        textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: displayValue.hasEntry ? 600 : 400,
          color: textColor,
        }}
      >
        {displayValue.displayText}
      </span>

      {/* Notes indicator - clickable to open modal */}
      {displayValue.hasNotes && (
        <div
          onClick={handleNotesClick}
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '2px',
          }}
        >
          <MessageSquare
            size={10}
            color={theme.colors.primary.dark}
            fill={theme.colors.primary.light}
          />
        </div>
      )}
    </div>
  );
});
