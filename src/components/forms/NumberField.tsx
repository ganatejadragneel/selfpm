import React from 'react';
import { Input } from '../ui/Input';

interface NumberFieldProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  helperText?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  fullWidth = true,
  required = false,
  min,
  max,
  step = 1,
  suffix,
  helperText,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (inputValue === '') {
      onChange(undefined);
      return;
    }
    
    const numberValue = Number(inputValue);
    
    if (!isNaN(numberValue)) {
      // Apply min/max constraints
      let constrainedValue = numberValue;
      if (min !== undefined && constrainedValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && constrainedValue > max) {
        constrainedValue = max;
      }
      
      onChange(constrainedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue !== '' && value !== undefined) {
      // Ensure step constraint on blur
      if (step !== 1) {
        const steppedValue = Math.round(value / step) * step;
        if (steppedValue !== value) {
          onChange(steppedValue);
        }
      }
    }
  };

  const displayValue = value !== undefined ? String(value) : '';
  const displayPlaceholder = placeholder || (suffix ? `Enter value ${suffix}` : 'Enter number');

  return (
    <Input
      label={label}
      type="number"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={displayPlaceholder}
      error={error}
      disabled={disabled}
      fullWidth={fullWidth}
      required={required}
      min={min}
      max={max}
      step={step}
      helperText={helperText || (suffix ? `Value in ${suffix}` : undefined)}
      rightIcon={suffix ? (
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {suffix}
        </span>
      ) : undefined}
    />
  );
};