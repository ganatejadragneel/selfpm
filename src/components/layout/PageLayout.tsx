import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useResponsive } from '../../hooks/useResponsive';

export interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  padding?: string;
  backgroundColor?: string;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  maxWidth = '1280px',
  padding,
  backgroundColor,
  className
}) => {
  const theme = useThemeColors();
  const { isMobile } = useResponsive();

  const defaultPadding = isMobile ? '16px 12px' : '24px';

  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        backgroundColor: backgroundColor || theme.colors.background.primary,
        color: theme.colors.text.primary,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      {header && (
        <header style={{
          flexShrink: 0,
          borderBottom: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.surface.white
        }}>
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        {sidebar && !isMobile && (
          <aside style={{
            width: '280px',
            flexShrink: 0,
            borderRight: `1px solid ${theme.colors.border.light}`,
            backgroundColor: theme.colors.background.secondary,
            overflow: 'auto'
          }}>
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflow: 'auto'
        }}>
          <div style={{
            maxWidth,
            margin: '0 auto',
            padding: padding || defaultPadding,
            minHeight: '100%'
          }}>
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer style={{
          flexShrink: 0,
          borderTop: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.surface.white,
          padding: '16px 24px',
          textAlign: 'center'
        }}>
          {footer}
        </footer>
      )}
    </div>
  );
};