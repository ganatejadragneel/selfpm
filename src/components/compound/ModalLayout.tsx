import React from 'react';
import { Button } from '../ui/Button';
import { theme } from '../../styles/theme';

interface ModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

const sizeMap = {
  sm: '400px',
  md: '500px',
  lg: '600px',
  xl: '800px',
};

export const ModalLayout: React.FC<ModalLayoutProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface.white,
    borderRadius: theme.borderRadius.lg,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: sizeMap[size],
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    padding: `${theme.spacing.xl} ${theme.spacing.xl} ${theme.spacing.lg} ${theme.spacing.xl}`,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
    borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  };

  const contentStyle: React.CSSProperties = {
    padding: theme.spacing.xl,
    overflow: 'auto',
    flex: 1,
  };

  const actionsStyle: React.CSSProperties = {
    padding: `${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.xl} ${theme.spacing.xl}`,
    borderTop: `1px solid ${theme.colors.border.light}`,
    display: 'flex',
    gap: theme.spacing.md,
    justifyContent: 'flex-end',
  };

  return (
    <div 
      style={overlayStyle}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div>
            <h2 style={{
              fontSize: theme.typography.sizes.xl,
              fontWeight: theme.typography.weights.bold,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              marginBottom: subtitle ? theme.spacing.xs : 0,
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{
                fontSize: theme.typography.sizes.sm,
                color: theme.colors.text.muted,
                margin: 0,
              }}>
                {subtitle}
              </p>
            )}
          </div>
          
          <Button
            variant="icon"
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderRadius: theme.borderRadius.md,
              color: '#667eea',
            }}
          >
            ×
          </Button>
        </div>

        <div style={contentStyle}>
          {children}
        </div>

        {actions && (
          <div style={actionsStyle}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};