import React from 'react';
import { colors, borderRadius, shadows } from './tokens';

/**
 * Enhanced Button - Based on existing working button pattern
 * Safe implementation with explicit unions, extends proven patterns
 */
export interface DSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Visual variants - explicit options
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  
  // States
  loading?: boolean;
  fullWidth?: boolean;
  
  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  children: React.ReactNode;
}

export const DSButton: React.FC<DSButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  children,
  ...props
}) => {
  const getSizeStyles = (): React.CSSProperties => {
    const sizeMap = {
      sm: { padding: '8px 16px', fontSize: '14px', minHeight: '32px' },
      md: { padding: '12px 24px', fontSize: '16px', minHeight: '40px' },
      lg: { padding: '16px 32px', fontSize: '18px', minHeight: '48px' },
    };
    return sizeMap[size];
  };

  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      border: '2px solid transparent',
      borderRadius: borderRadius.md,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: 600,
      outline: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: leftIcon || rightIcon ? '8px' : '0',
      opacity: disabled || loading ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: colors.primary[500],
          color: 'white',
          boxShadow: shadows.md,
        };

      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: colors.gray[100],
          color: colors.gray[700],
          borderColor: colors.gray[300],
        };

      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.primary[600],
          borderColor: colors.primary[500],
        };

      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: colors.gray[600],
        };

      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: colors.error[500],
          color: 'white',
          boxShadow: shadows.md,
        };

      case 'success':
        return {
          ...baseStyles,
          backgroundColor: colors.success[500],
          color: 'white',
          boxShadow: shadows.md,
        };

      default:
        return baseStyles;
    }
  };

  const buttonStyle: React.CSSProperties = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  // Handle hover effects manually (since CSS-in-JS doesn't support :hover directly)
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const element = e.currentTarget;
    switch (variant) {
      case 'primary':
        element.style.backgroundColor = colors.primary[600];
        break;
      case 'secondary':
        element.style.backgroundColor = colors.gray[200];
        break;
      case 'outline':
        element.style.backgroundColor = colors.primary[50];
        break;
      case 'ghost':
        element.style.backgroundColor = colors.gray[100];
        break;
      case 'danger':
        element.style.backgroundColor = colors.error[600];
        break;
      case 'success':
        element.style.backgroundColor = colors.success[600];
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    const element = e.currentTarget;
    switch (variant) {
      case 'primary':
        element.style.backgroundColor = colors.primary[500];
        break;
      case 'secondary':
        element.style.backgroundColor = colors.gray[100];
        break;
      case 'outline':
        element.style.backgroundColor = 'transparent';
        break;
      case 'ghost':
        element.style.backgroundColor = 'transparent';
        break;
      case 'danger':
        element.style.backgroundColor = colors.error[500];
        break;
      case 'success':
        element.style.backgroundColor = colors.success[500];
        break;
    }
  };

  return (
    <button
      style={buttonStyle}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && <span>{leftIcon}</span>}
      {!loading && <span>{children}</span>}
      {!loading && rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};

// Simple loading spinner
const LoadingSpinner: React.FC = () => (
  <span
    style={{
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'spin 1s linear infinite',
    }}
  />
);