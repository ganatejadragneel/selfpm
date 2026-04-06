import { useThemeColors } from '../../../hooks/useThemeColors';
import { Timer, Plus, Minus } from 'lucide-react';
import { UI_LABELS } from '../../../constants/sprint';

interface DurationInputProps {
  durationMinutes: number | null;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  metricName?: string;
}

/**
 * Duration input component - minutes number input with quick increment buttons
 * Used for IP Attack, Gym, and Anthropic Progress metrics
 */
export const DurationInput = ({
  durationMinutes,
  onChange,
  disabled = false,
  metricName,
}: DurationInputProps) => {
  const theme = useThemeColors();

  const value = durationMinutes ?? 0;

  // Default target fallback (60 minutes)
  void metricName;
  const target = 60;

  const isMetTarget = value >= target;

  // Quick increment values
  const quickIncrements = [15, 30, 60];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= 0) {
      onChange(Math.min(newValue, 1440)); // Max 24 hours
    }
  };

  const handleIncrement = (amount: number) => {
    if (disabled) return;
    onChange(Math.min(value + amount, 1440));
  };

  const handleDecrement = (amount: number) => {
    if (disabled) return;
    onChange(Math.max(value - amount, 0));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Main Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: isMetTarget
            ? theme.colors.status.success.light
            : theme.colors.background.secondary,
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${
            isMetTarget ? theme.colors.status.success.medium : theme.colors.border.light
          }`,
        }}
      >
        <Timer
          size={20}
          color={isMetTarget ? theme.colors.status.success.dark : theme.colors.primary.dark}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              type="number"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              min={0}
              max={1440}
              style={{
                width: '80px',
                padding: '8px 12px',
                fontSize: '18px',
                fontWeight: 600,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: disabled
                  ? theme.colors.background.tertiary
                  : theme.colors.background.primary,
                color: isMetTarget
                  ? theme.colors.status.success.dark
                  : theme.colors.text.primary,
                textAlign: 'center',
                outline: 'none',
                cursor: disabled ? 'not-allowed' : 'text',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
              }}
            >
              {UI_LABELS.durationMinutes}
            </span>
          </div>

          <div
            style={{
              fontSize: '12px',
              color: theme.colors.text.muted,
              marginTop: '4px',
            }}
          >
            Target: {target}+ minutes
            {isMetTarget && (
              <span style={{ color: theme.colors.status.success.dark, marginLeft: '8px' }}>
                Target met!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Increment Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        {/* Decrement buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {quickIncrements.map((amount) => (
            <button
              key={`dec-${amount}`}
              onClick={() => handleDecrement(amount)}
              disabled={disabled || value < amount}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: theme.colors.background.tertiary,
                color: theme.colors.text.secondary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.sm,
                cursor: disabled || value < amount ? 'not-allowed' : 'pointer',
                opacity: disabled || value < amount ? 0.5 : 1,
              }}
            >
              <Minus size={12} />
              {amount}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Increment buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {quickIncrements.map((amount) => (
            <button
              key={`inc-${amount}`}
              onClick={() => handleIncrement(amount)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: theme.colors.primary.light,
                color: theme.colors.primary.dark,
                border: `1px solid ${theme.colors.primary.medium}`,
                borderRadius: theme.borderRadius.sm,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Plus size={12} />
              {amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
