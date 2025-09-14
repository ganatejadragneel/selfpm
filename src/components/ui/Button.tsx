import React, { useState } from 'react';
import { buttonVariants } from '../../styles/theme';

type ButtonVariant = keyof typeof buttonVariants;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  isMobile?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  icon,
  loading = false,
  isMobile = false,
  disabled,
  onClick,
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

  return (
    <button
      style={combinedStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          {variant !== 'icon' && 'Loading...'}
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </>
      ) : (
        <>
          {icon}
          {variant !== 'icon' && children}
        </>
      )}
    </button>
  );
};