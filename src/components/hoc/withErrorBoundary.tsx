/**
 * withErrorBoundary HOC - Wraps components with error boundary
 * Provides error handling and recovery for components
 */

import React from 'react';
import type { ComponentType } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    isolate?: boolean;
  } = {}
) {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        fallback={options.fallback}
        onError={options.onError}
        isolate={options.isolate}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}