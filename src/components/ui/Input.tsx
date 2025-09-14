import React, { useState, forwardRef } from 'react';
import { theme, styleUtils } from '../../styles/theme';
import type { InputProps as BaseInputProps, TextareaProps as BaseTextareaProps } from '../../types/components';

interface LocalInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange' | 'autoComplete' | 'required' | 'placeholder' | 'onBlur' | 'onFocus' | 'type'> {
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeMap = {
  sm: { padding: '8px 12px', fontSize: theme.typography.sizes.sm },
  md: { padding: '12px 16px', fontSize: theme.typography.sizes.base },
  lg: { padding: '16px 20px', fontSize: theme.typography.sizes.lg },
};

export const Input = forwardRef<HTMLInputElement, LocalInputProps>(({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  fullWidth = true,
  className = '',
  style,
  disabled,
  required,
  placeholder,
  value,
  onChange,
  onBlur: onBlurProp,
  onFocus: onFocusProp,
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const { padding, fontSize } = sizeMap[size];
  
  const getVariantStyles = () => {
    const baseStyles = {
      ...styleUtils.input(),
      padding,
      fontSize,
      width: fullWidth ? '100%' : 'auto',
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.background.secondary,
          border: 'none',
          borderBottom: `2px solid ${isFocused ? theme.colors.primary.dark : theme.colors.border.light}`,
          borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          border: `2px solid ${
            error ? theme.colors.status.error.dark :
            success ? theme.colors.status.success.dark :
            isFocused ? theme.colors.primary.dark :
            theme.colors.border.light
          }`,
        };
      default:
        return {
          ...baseStyles,
          borderColor: 
            error ? theme.colors.status.error.dark :
            success ? theme.colors.status.success.dark :
            isFocused ? theme.colors.primary.dark :
            theme.colors.border.light,
        };
    }
  };

  const inputStyles: React.CSSProperties = {
    ...getVariantStyles(),
    ...(disabled && {
      opacity: 0.6,
      cursor: 'not-allowed',
      backgroundColor: theme.colors.background.tertiary,
    }),
    ...(leftIcon && { paddingLeft: '44px' }),
    ...(rightIcon && { paddingRight: '44px' }),
    ...style,
  };

  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    marginBottom: (error || success || helperText) ? '4px' : '0',
  };

  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.colors.text.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: theme.spacing.sm,
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.medium,
          color: theme.colors.text.primary,
        }}>
          {label}
        </label>
      )}
      
      <div style={containerStyles}>
        {leftIcon && (
          <div style={{ ...iconStyles, left: '14px' }}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          style={inputStyles}
          className={className}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            onFocusProp?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlurProp?.(e);
          }}
          data-testid={dataTestId}
          {...props}
        />
        
        {rightIcon && (
          <div style={{ ...iconStyles, right: '14px' }}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div style={{
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.sizes.xs,
          color: 
            error ? theme.colors.status.error.dark :
            success ? theme.colors.status.success.dark :
            theme.colors.text.muted,
        }}>
          {error || success || helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea variant
interface LocalTextareaProps extends BaseTextareaProps, Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'required' | 'placeholder' | 'onBlur' | 'onFocus' | 'rows' | 'cols' | 'maxLength' | 'minLength' | 'readOnly'> {
  success?: string;
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  minRows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, LocalTextareaProps>(({
  label,
  error,
  success,
  helperText,
  variant = 'default',
  fullWidth = true,
  minRows = 3,
  className = '',
  style,
  disabled,
  required,
  placeholder,
  value,
  onChange,
  onBlur: onBlurProp,
  onFocus: onFocusProp,
  rows,
  cols,
  maxLength,
  minLength,
  readOnly,
  resize,
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const getVariantStyles = () => {
    const baseStyles = {
      ...styleUtils.input(),
      resize: 'vertical' as const,
      minHeight: `${minRows * 1.5}em`,
      width: fullWidth ? '100%' : 'auto',
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.background.secondary,
          border: 'none',
          borderBottom: `2px solid ${isFocused ? theme.colors.primary.dark : theme.colors.border.light}`,
          borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          border: `2px solid ${
            error ? theme.colors.status.error.dark :
            success ? theme.colors.status.success.dark :
            isFocused ? theme.colors.primary.dark :
            theme.colors.border.light
          }`,
        };
      default:
        return {
          ...baseStyles,
          borderColor: 
            error ? theme.colors.status.error.dark :
            success ? theme.colors.status.success.dark :
            isFocused ? theme.colors.primary.dark :
            theme.colors.border.light,
        };
    }
  };

  const textareaStyles: React.CSSProperties = {
    ...getVariantStyles(),
    ...(disabled && {
      opacity: 0.6,
      cursor: 'not-allowed',
      backgroundColor: theme.colors.background.tertiary,
    }),
    ...(resize && { resize }),
    ...style,
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: theme.spacing.sm,
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.medium,
          color: theme.colors.text.primary,
        }}>
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        style={textareaStyles}
        className={className}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows || minRows}
        cols={cols}
        maxLength={maxLength}
        minLength={minLength}
        readOnly={readOnly}
        onFocus={(e) => {
          setIsFocused(true);
          onFocusProp?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlurProp?.(e);
        }}
        data-testid={dataTestId}
        {...props}
      />
      
      {(error || success || helperText) && (
        <div style={{
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.sizes.xs,
          color: 
            error ? theme.colors.status.error.dark :
            success ? theme.colors.status.success.dark :
            theme.colors.text.muted,
        }}>
          {error || success || helperText}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';