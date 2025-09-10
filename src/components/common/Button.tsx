import React from 'react';
import { useCommonStyles } from '../../styles/commonStyles';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...buttonProps
}) => {
  const styles = useCommonStyles();

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'danger':
        return styles.dangerButton;
      default:
        return styles.primaryButton;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '12px' };
      case 'lg':
        return { padding: '12px 24px', fontSize: '16px' };
      default:
        return {};
    }
  };

  const buttonStyle = {
    ...getVariantStyle(),
    ...getSizeStyle(),
    ...(disabled || loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
    ...style,
  };

  return (
    <button
      {...buttonProps}
      disabled={disabled || loading}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.opacity = '1';
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⟳</span> {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};