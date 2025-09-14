// Phase 6: Unified Success & Notification State Management
// Standardize success states, notifications, and user feedback patterns

import { useState, useCallback, useRef, useEffect } from 'react';

// Notification types
export const NotificationType = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

// Notification interface
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: number;
  duration?: number; // milliseconds, null for persistent
  actionLabel?: string;
  action?: () => void;
  dismissible?: boolean;
  icon?: string;
}

// Notification position
export const NotificationPosition = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
} as const;

export type NotificationPosition = typeof NotificationPosition[keyof typeof NotificationPosition];

// Global notification system
export const useNotificationState = (options: {
  maxNotifications?: number;
  defaultDuration?: number;
  position?: NotificationPosition;
} = {}) => {
  const {
    maxNotifications = 5,
    defaultDuration = 5000,
    position = NotificationPosition.TOP_RIGHT
  } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    options?: {
      message?: string;
      duration?: number | null;
      actionLabel?: string;
      action?: () => void;
      dismissible?: boolean;
      icon?: string;
    }
  ) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duration = options?.duration ?? defaultDuration;

    const notification: AppNotification = {
      id,
      type,
      title,
      message: options?.message,
      timestamp: Date.now(),
      duration: duration,
      actionLabel: options?.actionLabel,
      action: options?.action,
      dismissible: options?.dismissible !== false,
      icon: options?.icon,
    };

    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Keep only max notifications
      if (newNotifications.length > maxNotifications) {
        newNotifications.splice(maxNotifications);
      }
      return newNotifications;
    });

    // Auto-dismiss notification
    if (duration && duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
        timeoutRefs.current.delete(id);
      }, duration);

      timeoutRefs.current.set(id, timeoutId);
    }

    return notification;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));

    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(notificationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(notificationId);
    }
  }, []);

  const clearAllNotifications = useCallback((type?: NotificationType) => {
    if (type) {
      setNotifications(prev => prev.filter(notification => notification.type !== type));
    } else {
      setNotifications([]);
      // Clear all timeouts
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    }
  }, []);

  // Convenience methods for different notification types
  const success = useCallback((title: string, options?: Parameters<typeof addNotification>[2]) => {
    return addNotification(NotificationType.SUCCESS, title, options);
  }, [addNotification]);

  const error = useCallback((title: string, options?: Parameters<typeof addNotification>[2]) => {
    return addNotification(NotificationType.ERROR, title, {
      duration: null, // Error notifications persist until dismissed
      ...options,
    });
  }, [addNotification]);

  const warning = useCallback((title: string, options?: Parameters<typeof addNotification>[2]) => {
    return addNotification(NotificationType.WARNING, title, {
      duration: 8000, // Longer duration for warnings
      ...options,
    });
  }, [addNotification]);

  const info = useCallback((title: string, options?: Parameters<typeof addNotification>[2]) => {
    return addNotification(NotificationType.INFO, title, options);
  }, [addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    notifications,
    position,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };
};

// Success state patterns
export const useSuccessState = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    setSuccessMessage(message);
    setIsSuccess(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
        setIsSuccess(false);
      }, duration);
    }
  }, []);

  const hideSuccess = useCallback(() => {
    setSuccessMessage(null);
    setIsSuccess(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    successMessage,
    isSuccess,
    showSuccess,
    hideSuccess,
  };
};

// Toast notification patterns for common operations
export const useOperationFeedback = () => {
  const notifications = useNotificationState();

  const operationFeedback = {
    // CRUD operations
    created: (resource: string) => {
      notifications.success(`${resource} created successfully`);
    },

    updated: (resource: string) => {
      notifications.success(`${resource} updated successfully`);
    },

    deleted: (resource: string) => {
      notifications.success(`${resource} deleted successfully`);
    },

    saved: (resource?: string) => {
      notifications.success(`${resource || 'Changes'} saved successfully`);
    },

    // File operations
    uploaded: (filename?: string) => {
      notifications.success(`${filename || 'File'} uploaded successfully`);
    },

    downloaded: (filename?: string) => {
      notifications.success(`${filename || 'File'} downloaded successfully`);
    },

    // Authentication
    signedIn: () => {
      notifications.success('Signed in successfully');
    },

    signedOut: () => {
      notifications.info('Signed out successfully');
    },

    passwordChanged: () => {
      notifications.success('Password changed successfully');
    },

    // Validation and errors
    validationError: (field: string, message: string) => {
      notifications.error(`${field}: ${message}`, { duration: 5000 });
    },

    networkError: () => {
      notifications.error('Network error occurred', {
        message: 'Please check your connection and try again',
        actionLabel: 'Retry',
        action: () => window.location.reload(),
      });
    },

    permissionDenied: (resource?: string) => {
      notifications.error('Permission denied', {
        message: resource ? `You don't have permission to access ${resource}` : undefined,
      });
    },

    // Generic patterns
    operationFailed: (operation: string, error?: string) => {
      notifications.error(`${operation} failed`, {
        message: error,
        duration: 8000,
      });
    },

    operationSucceeded: (operation: string) => {
      notifications.success(`${operation} completed successfully`);
    },

    // Copy/paste operations
    copiedToClipboard: (content?: string) => {
      notifications.success(`${content || 'Content'} copied to clipboard`, { duration: 2000 });
    },

    // Bulk operations
    bulkOperation: (operation: string, count: number, total: number) => {
      if (count === total) {
        notifications.success(`${operation} completed for all ${total} items`);
      } else if (count > 0) {
        notifications.warning(`${operation} completed for ${count} of ${total} items`);
      } else {
        notifications.error(`${operation} failed for all items`);
      }
    },
  };

  return {
    ...notifications,
    ...operationFeedback,
  };
};

// Unified feedback system combining loading, error, and success states
export const useUnifiedFeedback = () => {
  const notifications = useNotificationState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWithFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: string) => void;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();

      if (options.successMessage) {
        notifications.success(options.successMessage);
      }

      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);

      notifications.error(options.errorMessage || 'Operation failed', {
        message: errorMessage,
      });

      if (options.onError) {
        options.onError(errorMessage);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    ...notifications,
    isLoading,
    error,
    executeWithFeedback,
    clearError,
    reset,
  };
};

// Notification styling utilities
export const notificationStyles = {
  // Base notification container
  container: (position: NotificationPosition): React.CSSProperties => {
    const positions = {
      [NotificationPosition.TOP_RIGHT]: { top: '1rem', right: '1rem' },
      [NotificationPosition.TOP_LEFT]: { top: '1rem', left: '1rem' },
      [NotificationPosition.TOP_CENTER]: { top: '1rem', left: '50%', transform: 'translateX(-50%)' },
      [NotificationPosition.BOTTOM_RIGHT]: { bottom: '1rem', right: '1rem' },
      [NotificationPosition.BOTTOM_LEFT]: { bottom: '1rem', left: '1rem' },
      [NotificationPosition.BOTTOM_CENTER]: { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' },
    };

    return {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none',
      ...positions[position],
    };
  },

  // Individual notification
  notification: (type: NotificationType): React.CSSProperties => {
    const colors = {
      [NotificationType.SUCCESS]: {
        backgroundColor: '#10B981',
        color: 'white',
      },
      [NotificationType.ERROR]: {
        backgroundColor: '#EF4444',
        color: 'white',
      },
      [NotificationType.WARNING]: {
        backgroundColor: '#F59E0B',
        color: 'white',
      },
      [NotificationType.INFO]: {
        backgroundColor: '#3B82F6',
        color: 'white',
      },
    };

    return {
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      marginBottom: '0.5rem',
      pointerEvents: 'auto',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      transition: 'all 0.3s ease',
      ...colors[type],
    };
  },
};