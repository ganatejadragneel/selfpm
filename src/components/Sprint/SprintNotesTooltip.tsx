import { memo } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SprintNotesTooltipProps {
  notes: string;
  maxLength?: number;
}

/**
 * SprintNotesTooltip - Lightweight hover preview for notes
 * Shows truncated notes with "..." if too long
 */
export const SprintNotesTooltip = memo(function SprintNotesTooltip({
  notes,
  maxLength = 100,
}: SprintNotesTooltipProps) {
  const theme = useThemeColors();

  // Truncate notes if too long
  const displayText =
    notes.length > maxLength ? `${notes.substring(0, maxLength).trim()}...` : notes;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: theme.colors.text.primary,
        color: 'white',
        padding: '8px 12px',
        borderRadius: theme.borderRadius.sm,
        fontSize: '12px',
        lineHeight: 1.4,
        maxWidth: '220px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: theme.effects.shadow.md,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {displayText}
      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid ${theme.colors.text.primary}`,
        }}
      />
    </div>
  );
});
