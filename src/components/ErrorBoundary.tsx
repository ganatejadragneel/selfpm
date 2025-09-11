/**
 * ErrorBoundary - Catches and handles React component errors
 * Provides fallback UI and error reporting
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Report to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo);
    
    // Update error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Auto-reset after multiple errors (circuit breaker pattern)
    if (this.state.errorCount >= 3) {
      this.scheduleReset(5000);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    // Reset on prop changes if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
    
    // Reset when resetKeys change
    if (resetKeys && this.previousResetKeys.length > 0) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
    
    this.previousResetKeys = resetKeys || [];
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorCount: 0
    });
  };

  scheduleReset = (delay: number): void => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, delay);
  };

  reportError = (error: Error, errorInfo: ErrorInfo): void => {
    // Integration point for error tracking services
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // For now, just log to console
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    console.error('Error Report:', errorReport);
    
    // Could also send to a backend endpoint
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Isolated error boundary shows minimal UI
      if (isolate) {
        return (
          <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Component Error</span>
            </div>
            <button
              onClick={this.resetErrorBoundary}
              className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        );
      }

      // Full error boundary UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="mt-4 text-xl font-semibold text-center text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              
              <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
                An unexpected error occurred. The error has been logged and we'll look into it.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <summary className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {error.message}
                    {errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={this.resetErrorBoundary}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Specialized error boundary for async operations
export function AsyncErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={fallback || <AsyncErrorFallback />}
      resetOnPropsChange
      isolate
    >
      {children}
    </ErrorBoundary>
  );
}

function AsyncErrorFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Failed to load content
        </p>
      </div>
    </div>
  );
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  return { captureError, resetError };
}