import React from 'react';
import { theme } from '../../styles/theme';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  helperText?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled = false,
  fullWidth = true,
  required = false,
  helperText,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const containerStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    marginBottom: error ? '4px' : '0',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    border: `2px solid ${error ? theme.colors.status.error.dark : theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.base,
    backgroundColor: disabled ? theme.colors.background.tertiary : theme.colors.surface.white,
    color: theme.colors.text.primary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

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
      
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        style={selectStyle}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = theme.colors.primary.dark;
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(102, 126, 234, 0.1)`;
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? theme.colors.status.error.dark : theme.colors.border.light;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {(error || helperText) && (
        <div style={errorStyle}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};