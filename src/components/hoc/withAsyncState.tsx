import React, { type ComponentType } from 'react';
import { useAsyncState, type UseAsyncStateReturn } from '../../hooks/useAsyncState';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorHandler } from '../../utils/errorHandling';

// Props that the wrapped component will receive
export interface WithAsyncStateProps<T> {
  asyncState: UseAsyncStateReturn<T>;
}

// Props for the HOC configuration
export interface AsyncStateConfig<T> {
  initialData?: T | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: string, retry?: () => void) => React.ReactNode;
  showLoadingSpinner?: boolean;
  showErrorBoundary?: boolean;
}

// Default error component
const DefaultErrorComponent: React.FC<{
  error: string;
  retry?: () => void
}> = ({ error, retry }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center'
  }}>
    <div style={{
      fontSize: '48px',
      marginBottom: '16px'
    }}>
      ❌
    </div>
    <h3 style={{
      color: '#ef4444',
      marginBottom: '12px',
      fontSize: '18px',
      fontWeight: '600'
    }}>
      Something went wrong
    </h3>
    <p style={{
      color: '#6b7280',
      marginBottom: '16px',
      maxWidth: '400px'
    }}>
      {error}
    </p>
    {retry && (
      <button
        onClick={retry}
        style={{
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        Try Again
      </button>
    )}
  </div>
);

// HOC that provides async state management
export function withAsyncState<T, P extends WithAsyncStateProps<T>>(
  WrappedComponent: ComponentType<P>,
  config: AsyncStateConfig<T> = {}
): ComponentType<Omit<P, keyof WithAsyncStateProps<T>>> {
  const {
    initialData = null,
    loadingComponent,
    errorComponent = DefaultErrorComponent,
    showLoadingSpinner = true,
    showErrorBoundary = true
  } = config;

  const WithAsyncStateComponent: React.FC<Omit<P, keyof WithAsyncStateProps<T>>> = (props) => {
    const asyncState = useAsyncState<T>(initialData);

    // Show loading state
    if (asyncState.loading && showLoadingSpinner) {
      return (
        <div>
          {loadingComponent || <LoadingSpinner size="md" text="Loading..." />}
        </div>
      );
    }

    // Show error state
    if (asyncState.error && showErrorBoundary) {
      const retryFunction = () => {
        asyncState.setError(null);
        asyncState.setLoading(false);
      };

      return (
        <div>
          {React.createElement(errorComponent as React.FC<{ error: string; retry?: () => void }>, {
            error: asyncState.error,
            retry: retryFunction
          })}
        </div>
      );
    }

    // Render the wrapped component with async state props
    return (
      <WrappedComponent
        {...props as P}
        asyncState={asyncState}
      />
    );
  };

  WithAsyncStateComponent.displayName = `withAsyncState(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAsyncStateComponent;
}

// Utility hook for components that use this HOC
export const useAsyncOperation = <T,>(asyncState: UseAsyncStateReturn<T>) => {
  const executeWithErrorHandling = async <R = T>(
    operation: () => Promise<R>,
    errorContext?: string
  ): Promise<R | null> => {
    try {
      asyncState.setLoading(true);
      asyncState.setError(null);

      const result = await operation();

      asyncState.setData(result as unknown as T);
      return result;
    } catch (error) {
      const appError = ErrorHandler.fromUnknown(error, errorContext);
      asyncState.setError(ErrorHandler.format(appError));
      return null;
    } finally {
      asyncState.setLoading(false);
    }
  };

  return {
    executeWithErrorHandling,
    isLoading: asyncState.loading,
    hasError: !!asyncState.error,
    error: asyncState.error,
    data: asyncState.data,
    clearError: () => asyncState.setError(null),
    setData: asyncState.setData
  };
};