// Shared Async State Management - Phase 7B DRY Refactoring
// INTERNAL UTILITY - Does not change existing hook APIs

import React from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Universal async operation wrapper
export const createAsyncOperation = <T>(
  initialData: T | null = null
) => {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  });

  const execute = async (asyncFn: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Operation failed';
      setState(prev => ({ ...prev, loading: false, error }));
      return null;
    }
  };

  const setData = (data: T | null) => {
    setState(prev => ({ ...prev, data }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const reset = () => {
    setState({ data: initialData, loading: false, error: null });
  };

  return {
    ...state,
    execute,
    setData,
    setError,
    reset
  };
};

// Standardized error handling for async operations
export const handleAsyncError = (error: unknown, defaultMessage = 'Operation failed'): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return defaultMessage;
};

// Common async operation patterns
export const createAsyncCRUD = <T>(baseOperation: (action: string, ...args: any[]) => Promise<T>) => ({
  create: (...args: any[]) => baseOperation('create', ...args),
  read: (...args: any[]) => baseOperation('read', ...args),
  update: (...args: any[]) => baseOperation('update', ...args),
  delete: (...args: any[]) => baseOperation('delete', ...args),
});