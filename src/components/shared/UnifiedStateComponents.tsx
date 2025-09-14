// Phase 6: Unified State Display Components
// Standardized UI components for error, loading, and success states

import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Loader2, X } from 'lucide-react';
import { NotificationType, NotificationPosition } from '../../utils/shared/notificationStateManager';
import { ErrorSeverity } from '../../utils/shared/errorStateManager';
import { LoadingState } from '../../utils/shared/loadingStateManager';
import type { AppNotification } from '../../utils/shared/notificationStateManager';
import type { AppError } from '../../utils/shared/errorStateManager';

// Error Display Component
interface ErrorDisplayProps {
  error: AppError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false,
}) => {
  if (!error) return null;

  const errorData = typeof error === 'string'
    ? { message: error, severity: ErrorSeverity.ERROR }
    : error;

  const severityColors = {
    [ErrorSeverity.INFO]: 'bg-blue-50 border-blue-200 text-blue-800',
    [ErrorSeverity.WARNING]: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    [ErrorSeverity.ERROR]: 'bg-red-50 border-red-200 text-red-800',
    [ErrorSeverity.CRITICAL]: 'bg-red-100 border-red-300 text-red-900',
  };

  const severityIcons = {
    [ErrorSeverity.INFO]: Info,
    [ErrorSeverity.WARNING]: AlertTriangle,
    [ErrorSeverity.ERROR]: AlertCircle,
    [ErrorSeverity.CRITICAL]: AlertCircle,
  };

  const Icon = severityIcons[errorData.severity];
  const colorClasses = severityColors[errorData.severity];

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Icon className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-600">{errorData.message}</span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses} ${className}`}>
      <div className="flex items-start">
        <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{errorData.message}</p>
          {typeof error === 'object' && error.code && (
            <p className="text-sm opacity-75 mt-1">Code: {error.code}</p>
          )}
          {(onRetry || onDismiss) && (
            <div className="flex space-x-2 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Loading Display Component
interface LoadingDisplayProps {
  state?: LoadingState;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
  overlay?: boolean;
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({
  state = LoadingState.LOADING,
  message = 'Loading...',
  progress,
  showProgress = false,
  size = 'md',
  variant = 'spinner',
  className = '',
  overlay = false,
}) => {
  if (state !== LoadingState.LOADING) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const LoadingIcon = () => {
    switch (variant) {
      case 'spinner':
        return <Loader2 className={`animate-spin ${sizeClasses[size]}`} />;
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`bg-current rounded-full ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'}`}
                style={{
                  animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`,
                }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div className={`bg-current rounded ${sizeClasses[size]} animate-pulse opacity-75`} />
        );
      default:
        return <Loader2 className={`animate-spin ${sizeClasses[size]}`} />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <LoadingIcon />
      {message && <p className="text-sm text-gray-600">{message}</p>}
      {showProgress && typeof progress === 'number' && (
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Success Display Component
interface SuccessDisplayProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  autoHide?: boolean;
  duration?: number;
}

export const SuccessDisplay: React.FC<SuccessDisplayProps> = ({
  message,
  onDismiss,
  className = '',
  compact = false,
  autoHide = false,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timeout = setTimeout(onDismiss, duration);
      return () => clearTimeout(timeout);
    }
  }, [autoHide, onDismiss, duration]);

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-600">{message}</span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-green-400 hover:text-green-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border bg-green-50 border-green-200 text-green-800 ${className}`}>
      <div className="flex items-start">
        <CheckCircle2 className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Notification Toast Component
interface NotificationToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  position: NotificationPosition;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  position,
}) => {
  const typeColors = {
    [NotificationType.SUCCESS]: 'bg-green-500 text-white',
    [NotificationType.ERROR]: 'bg-red-500 text-white',
    [NotificationType.WARNING]: 'bg-yellow-500 text-white',
    [NotificationType.INFO]: 'bg-blue-500 text-white',
  };

  const typeIcons = {
    [NotificationType.SUCCESS]: CheckCircle2,
    [NotificationType.ERROR]: AlertCircle,
    [NotificationType.WARNING]: AlertTriangle,
    [NotificationType.INFO]: Info,
  };

  const Icon = typeIcons[notification.type];

  const isTop = position.includes('top');
  const animationClass = isTop ? 'slide-in-top' : 'slide-in-bottom';

  return (
    <div
      className={`
        ${typeColors[notification.type]}
        p-4 rounded-lg shadow-lg mb-2 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${animationClass}
      `}
    >
      <div className="flex items-start">
        <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
          )}
          {notification.action && notification.actionLabel && (
            <button
              onClick={notification.action}
              className="mt-2 text-sm underline hover:no-underline"
            >
              {notification.actionLabel}
            </button>
          )}
        </div>
        {notification.dismissible && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Notification Container
interface NotificationContainerProps {
  notifications: AppNotification[];
  position: NotificationPosition;
  onDismiss: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  position,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  const positionClasses = {
    [NotificationPosition.TOP_RIGHT]: 'top-4 right-4',
    [NotificationPosition.TOP_LEFT]: 'top-4 left-4',
    [NotificationPosition.TOP_CENTER]: 'top-4 left-1/2 transform -translate-x-1/2',
    [NotificationPosition.BOTTOM_RIGHT]: 'bottom-4 right-4',
    [NotificationPosition.BOTTOM_LEFT]: 'bottom-4 left-4',
    [NotificationPosition.BOTTOM_CENTER]: 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div className={`fixed z-50 pointer-events-none ${positionClasses[position]}`}>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onDismiss={onDismiss}
              position={position}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton components
export const SkeletonLine: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = '100%', height = '1rem', className = '' }) => (
  <div
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={{ width, height }}
  />
);

export const SkeletonAvatar: React.FC<{
  size?: string;
  className?: string;
}> = ({ size = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 rounded-full animate-pulse ${className}`}
    style={{ width: size, height: size }}
  />
);

export const SkeletonCard: React.FC<{
  className?: string;
  lines?: number;
}> = ({ className = '', lines = 3 }) => (
  <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
    <div className="space-y-3">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  </div>
);

// Empty State Component
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
  actionLabel?: string;
  action?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  action,
  className = '',
}) => (
  <div className={`text-center py-12 px-4 ${className}`}>
    {Icon && (
      <div className="mb-4 flex justify-center">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>}
    {action && actionLabel && (
      <button
        onClick={action}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);