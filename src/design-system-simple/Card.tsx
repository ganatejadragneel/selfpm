import React from 'react';
import { Box, type BoxProps } from './Box';
import { colors, shadows } from './tokens';

/**
 * Card - Data display component using Box as foundation
 * Safe implementation building on proven Box component
 */
export interface CardProps extends Omit<BoxProps, 'children'> {
  variant?: 'elevated' | 'outlined' | 'subtle';
  interactive?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  interactive = false,
  loading = false,
  style,
  children,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transition: 'all 0.2s ease',
      cursor: interactive ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          boxShadow: shadows.lg,
          border: `1px solid ${colors.gray[200]}`,
        };
      
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'white',
          border: `2px solid ${colors.gray[200]}`,
        };
      
      case 'subtle':
        return {
          ...baseStyles,
          backgroundColor: colors.gray[50],
          border: `1px solid ${colors.gray[100]}`,
        };
      
      default:
        return baseStyles;
    }
  };

  const cardStyles: React.CSSProperties = {
    ...getVariantStyles(),
    ...(loading && {
      pointerEvents: 'none',
      opacity: 0.6,
    }),
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || loading) return;
    
    const element = e.currentTarget;
    switch (variant) {
      case 'elevated':
        element.style.transform = 'translateY(-2px)';
        element.style.boxShadow = shadows.xl;
        break;
      case 'outlined':
        element.style.borderColor = colors.primary[300];
        break;
      case 'subtle':
        element.style.backgroundColor = colors.gray[100];
        break;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || loading) return;
    
    const element = e.currentTarget;
    switch (variant) {
      case 'elevated':
        element.style.transform = 'translateY(0)';
        element.style.boxShadow = shadows.lg;
        break;
      case 'outlined':
        element.style.borderColor = colors.gray[200];
        break;
      case 'subtle':
        element.style.backgroundColor = colors.gray[50];
        break;
    }
  };

  return (
    <Box
      borderRadius="lg"
      style={cardStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading && <CardLoadingOverlay />}
      {children}
    </Box>
  );
};

// Card sub-components
export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  children,
}) => {
  return (
    <Box p="lg" pb={children ? "md" : "lg"}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {title && (
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: colors.gray[900],
              margin: '0 0 4px 0',
            }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{
              fontSize: '0.875rem',
              color: colors.gray[600],
              margin: 0,
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children && (
        <div style={{ marginTop: '16px' }}>
          {children}
        </div>
      )}
    </Box>
  );
};

export interface CardBodyProps extends BoxProps {
  children: React.ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ 
  children, 
  p = "lg", 
  ...props 
}) => (
  <Box p={p} {...props}>
    {children}
  </Box>
);

export interface CardFooterProps extends BoxProps {
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  children, 
  p = "lg", 
  pt = "md",
  ...props 
}) => (
  <Box 
    p={p} 
    pt={pt}
    style={{ borderTop: `1px solid ${colors.gray[200]}` }}
    {...props}
  >
    {children}
  </Box>
);

// Loading overlay component
const CardLoadingOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      backdropFilter: 'blur(2px)',
    }}
  >
    <div
      style={{
        width: '24px',
        height: '24px',
        border: `3px solid ${colors.gray[200]}`,
        borderTop: `3px solid ${colors.primary[500]}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  </div>
);