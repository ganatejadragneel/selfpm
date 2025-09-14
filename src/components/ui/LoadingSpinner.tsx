import React from 'react';
import { theme } from '../../styles/theme';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { width: '16px', height: '16px', borderWidth: '2px' },
  md: { width: '32px', height: '32px', borderWidth: '3px' },
  lg: { width: '48px', height: '48px', borderWidth: '4px' },
  xl: { width: '64px', height: '64px', borderWidth: '5px' },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = theme.colors.primary.dark,
  text,
  fullScreen = false,
  className = '',
}) => {
  const { width, height, borderWidth } = sizeMap[size];
  
  const spinnerStyle: React.CSSProperties = {
    width,
    height,
    border: `${borderWidth} solid ${color}33`,
    borderTop: `${borderWidth} solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const containerStyle: React.CSSProperties = fullScreen ? {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: theme.effects.blur,
    zIndex: 9999,
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing['2xl'],
  };

  return (
    <>
      <div style={containerStyle} className={className}>
        <div style={spinnerStyle} />
        {text && (
          <p style={{
            margin: 0,
            color: theme.colors.text.secondary,
            fontSize: theme.typography.sizes.base,
            fontWeight: theme.typography.weights.medium,
          }}>
            {text}
          </p>
        )}
      </div>
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
};

// Preset configurations for common use cases
export const AppLoadingSpinner = () => (
  <LoadingSpinner 
    size="lg" 
    text="Loading..." 
    fullScreen={true}
  />
);

export const ComponentLoadingSpinner = ({ text }: { text?: string }) => (
  <LoadingSpinner 
    size="md" 
    text={text || "Loading component..."}
  />
);

export const InlineLoadingSpinner = () => (
  <LoadingSpinner size="sm" />
);