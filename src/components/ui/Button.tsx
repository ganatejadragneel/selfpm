import React, { useState } from 'react';
import { buttonVariants } from '../../styles/theme';
import type { ButtonBaseProps } from '../../types/components';

type ButtonVariant = keyof typeof buttonVariants;

interface ButtonProps extends ButtonBaseProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isMobile?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  loadingText,
  isMobile = false,
  size = 'md',
  fullWidth = false,
  disabled,
  onClick,
  className,
  style,
  'data-testid': dataTestId,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // Use mobile variant if specified and isMobile is true
  const effectiveVariant = (isMobile && variant === 'navigation') ? 'navigationMobile' : variant;
  const variantStyles = buttonVariants[effectiveVariant];
  
  const combinedStyles: React.CSSProperties = {
    ...variantStyles.base,
    ...(isHovered && !disabled && !loading ? variantStyles.hover : {}),
    ...(isActive && !disabled && !loading ? variantStyles.active : {}),
    ...(disabled || loading ? {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    } : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...style
  };

  const handleMouseEnter = () => {
    if (!disabled && !loading) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsActive(false);
  };

  const handleMouseDown = () => {
    if (!disabled && !loading) {
      setIsActive(true);
    }
  };

  const handleMouseUp = () => {
    setIsActive(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          {variant !== 'icon' && (loadingText || 'Loading...')}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </>
      );
    }

    if (variant === 'icon') {
      return icon;
    }

    return (
      <>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </>
    );
  };

  return (
    <button
      className={className}
      style={combinedStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      disabled={disabled || loading}
      data-testid={dataTestId}
      {...props}
    >
      {renderContent()}
    </button>
  );
};