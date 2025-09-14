import React from 'react';
import { theme } from '../../styles/theme';

export interface ButtonGroupOption {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

export interface ButtonGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ButtonGroupOption[];
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  columns?: number;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  fullWidth = true,
  required = false,
  columns = 3,
}) => {
  const containerStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    marginBottom: error ? '4px' : '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  };

  const groupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: theme.spacing.md,
  };

  const getButtonStyle = (option: ButtonGroupOption, isSelected: boolean): React.CSSProperties => ({
    padding: `${theme.spacing.lg} ${theme.spacing.md}`,
    border: isSelected ? '2px solid #667eea' : '2px solid #e5e7eb',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    cursor: disabled || option.disabled ? 'not-allowed' : 'pointer',
    backgroundColor: isSelected && option.color ? option.color : 'white',
    color: theme.colors.text.primary,
    transition: 'all 0.2s ease',
    outline: 'none',
    opacity: disabled || option.disabled ? 0.6 : 1,
  });

  const errorStyle: React.CSSProperties = {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.status.error.dark,
  };

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: theme.colors.status.error.dark, marginLeft: '2px' }}>*</span>}
        </label>
      )}
      
      <div style={groupStyle}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              style={getButtonStyle(option, isSelected)}
              onMouseEnter={(e) => {
                if (!isSelected && !isDisabled) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isDisabled) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}
    </div>
  );
};