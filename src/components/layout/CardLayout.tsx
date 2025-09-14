import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useResponsive } from '../../hooks/useResponsive';

export interface CardLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: string;
  borderRadius?: string;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const elevationStyles = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
};

export const CardLayout: React.FC<CardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  footer,
  padding = '20px',
  borderRadius = '12px',
  elevation = 'sm',
  className,
  onClick,
  hoverable = false
}) => {
  const theme = useThemeColors();
  const { isMobile } = useResponsive();
  const [isHovered, setIsHovered] = React.useState(false);

  const isClickable = !!onClick;
  const shouldShowHover = hoverable || isClickable;

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface.white,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius,
    boxShadow: elevationStyles[elevation],
    transition: 'all 0.2s ease',
    cursor: isClickable ? 'pointer' : 'default',
    transform: shouldShowHover && isHovered ? 'translateY(-2px)' : 'none',
    ...(shouldShowHover && isHovered
      ? { boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.15)' }
      : {})
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => shouldShowHover && setIsHovered(true)}
      onMouseLeave={() => shouldShowHover && setIsHovered(false)}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div style={{
          padding: padding,
          paddingBottom: children ? '16px' : padding,
          borderBottom: children ? `1px solid ${theme.colors.border.light}` : 'none',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{
            flex: 1,
            minWidth: 0 // Allow text truncation
          }}>
            {title && (
              <h3 style={{
                margin: 0,
                marginBottom: subtitle ? '4px' : 0,
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                lineHeight: '1.3'
              }}>
                {title}
              </h3>
            )}

            {subtitle && (
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.4'
              }}>
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {children && (
        <div style={{
          padding: (title || subtitle || actions) ? `0 ${padding} ${padding}` : padding
        }}>
          {children}
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div style={{
          padding: padding,
          paddingTop: '16px',
          borderTop: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.background.secondary,
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius
        }}>
          {footer}
        </div>
      )}
    </div>
  );
};