import React, { Suspense } from 'react';
import { ComponentLoadingSpinner } from './LoadingSpinner';

interface LazyModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  component: React.ComponentType<T>;
  componentProps: T;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

class ModalErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onClose: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; onClose: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Modal Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            maxWidth: '400px',
            margin: '16px',
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '12px' }}>
              Something went wrong
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              We encountered an error loading this modal.
            </p>
            <button
              onClick={this.props.onClose}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function LazyModal<T extends Record<string, any>>({ 
  isOpen, 
  onClose, 
  component: Component, 
  componentProps, 
  fallback,
  errorFallback 
}: LazyModalProps<T>) {
  if (!isOpen) return null;

  return (
    <ModalErrorBoundary onClose={onClose} fallback={errorFallback}>
      <Suspense fallback={fallback || <ComponentLoadingSpinner />}>
        <Component {...(componentProps as T)} />
      </Suspense>
    </ModalErrorBoundary>
  );
}

// Convenience wrapper for common modal patterns
interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export const StandardModal: React.FC<StandardModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '600px',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

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
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {title && (
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
              }}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  color: '#6b7280',
                  fontSize: '20px',
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};