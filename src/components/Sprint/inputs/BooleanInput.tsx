import { useThemeColors } from '../../../hooks/useThemeColors';
import { CheckCircle2, Circle } from 'lucide-react';
import { UI_LABELS } from '../../../constants/sprint';

interface BooleanInputProps {
  completed: boolean | null;
  onChange: (completed: boolean) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Boolean input component - checkbox style toggle
 * Used for Morning Routine metric
 */
export const BooleanInput = ({
  completed,
  onChange,
  disabled = false,
  label = UI_LABELS.routineCompleted,
}: BooleanInputProps) => {
  const theme = useThemeColors();

  const isChecked = completed === true;

  const handleClick = () => {
    if (disabled) return;
    onChange(!isChecked);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: isChecked
          ? theme.colors.status.success.light
          : theme.colors.background.secondary,
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${
          isChecked ? theme.colors.status.success.medium : theme.colors.border.light
        }`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {isChecked ? (
        <CheckCircle2 size={24} color={theme.colors.status.success.dark} />
      ) : (
        <Circle size={24} color={theme.colors.text.muted} />
      )}
      <div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: isChecked ? theme.colors.status.success.dark : theme.colors.text.primary,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: theme.colors.text.muted,
            marginTop: '2px',
          }}
        >
          {isChecked ? 'Great job!' : 'Tap to mark as completed'}
        </div>
      </div>
    </div>
  );
};
