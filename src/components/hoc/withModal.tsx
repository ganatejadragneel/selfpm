import React, { type ComponentType, useEffect } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { X } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

// Props that wrapped components will receive
export interface WithModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Configuration for the modal HOC
export interface ModalConfig {
  title?: string;
  maxWidth?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

// HOC that wraps components with modal functionality
export function withModal<P extends WithModalProps>(
  WrappedComponent: ComponentType<P>,
  config: ModalConfig = {}
): ComponentType<P> {
  const {
    title,
    maxWidth = '600px',
    showCloseButton = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    className,
    headerComponent,
    footerComponent
  } = config;

  const WithModalComponent: React.FC<P> = (props) => {
    const { isOpen, onClose } = props;
    const theme = useThemeColors();
    const { isMobile } = useResponsive();

    // Handle escape key
    useEffect(() => {
      if (!closeOnEscape || !isOpen) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '16px' : '32px',
          overflow: 'auto'
        }}
        onClick={handleBackdropClick}
      >
        <div
          className={className}
          style={{
            background: theme.colors.surface.white,
            borderRadius: '16px',
            maxWidth,
            width: '100%',
            maxHeight: isMobile ? '90vh' : '85vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${theme.colors.border.light}`,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton || headerComponent) && (
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${theme.colors.border.light}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {title && (
                  <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.colors.text.primary
                  }}>
                    {title}
                  </h2>
                )}
                {headerComponent}
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: theme.colors.text.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
                    e.currentTarget.style.color = theme.colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme.colors.text.secondary;
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '0'
          }}>
            <WrappedComponent {...props} />
          </div>

          {/* Footer */}
          {footerComponent && (
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${theme.colors.border.light}`,
              flexShrink: 0
            }}>
              {footerComponent}
            </div>
          )}
        </div>
      </div>
    );
  };

  WithModalComponent.displayName = `withModal(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithModalComponent;
}

// Utility component for modal actions
export const ModalActions: React.FC<{
  children: React.ReactNode;
  alignment?: 'left' | 'center' | 'right';
  gap?: string;
}> = ({ children, alignment = 'right', gap = '12px' }) => {
  return (
    <div style={{
      display: 'flex',
      gap,
      justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'center' ? 'center' : 'flex-end',
      alignItems: 'center'
    }}>
      {children}
    </div>
  );
};