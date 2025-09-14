// Phase 8: Higher-Order Components and Component Wrappers
// Standardized HOCs and wrapper components for consistent behavior across the application

import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import type {
  BaseComponentProps,
  WithLoadingProps,
  WithErrorProps,
  WithPermissionProps,
  AnimationProps,
  ComponentSize,
} from '../../types/shared/componentInterfaces';
import { LoadingDisplay, ErrorDisplay, SkeletonCard } from './UnifiedStateComponents';
import { propUtils, a11yUtils } from '../../utils/shared/componentPropFactories';

// HOC for adding loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & WithLoadingProps>((props, ref) => {
    const {
      loading,
      loadingComponent,
      loadingDelay = 200,
      ...componentProps
    } = props;

    const [showLoading, setShowLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
      if (loading) {
        timeoutRef.current = setTimeout(() => {
          setShowLoading(true);
        }, loadingDelay);
      } else {
        setShowLoading(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [loading, loadingDelay]);

    if (showLoading) {
      return loadingComponent || <LoadingDisplay message="Loading..." />;
    }

    return <Component {...(componentProps as P)} ref={ref} />;
  });
}

// HOC for adding error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & WithErrorProps>((props, ref) => {
    const { error, errorComponent, onRetry, ...componentProps } = props;

    if (error) {
      return (
        errorComponent || (
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            className="p-4"
          />
        )
      );
    }

    return <Component {...(componentProps as P)} ref={ref} />;
  });
}

// HOC for permission-based rendering
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & WithPermissionProps>((props, ref) => {
    const {
      permission,
      fallback,
      checkPermission = () => true, // Default to allow all
      ...componentProps
    } = props;

    if (permission && !checkPermission(permission)) {
      return fallback || null;
    }

    return <Component {...(componentProps as P)} ref={ref} />;
  });
}

// HOC for adding animations
export function withAnimation<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & AnimationProps>((props, ref) => {
    const {
      animate = true,
      duration = 200,
      delay = 0,
      easing = 'ease-out',
      onAnimationStart,
      onAnimationEnd,
      ...componentProps
    } = props;

    const [isAnimating, setIsAnimating] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!animate || !elementRef.current) return;

      const element = elementRef.current;
      setIsAnimating(true);

      const animationStyles = {
        transition: `all ${duration}ms ${easing}`,
        transitionDelay: `${delay}ms`,
      };

      Object.assign(element.style, animationStyles);

      if (onAnimationStart) {
        onAnimationStart();
      }

      const timeoutId = setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      }, duration + delay);

      return () => clearTimeout(timeoutId);
    }, [animate, duration, delay, easing, onAnimationStart, onAnimationEnd]);

    return (
      <Component
        {...(componentProps as P)}
        ref={(node: HTMLElement) => {
          elementRef.current = node;
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        data-animating={isAnimating}
      />
    );
  });
}

// HOC for focus management
export function withFocusManagement<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & {
    autoFocus?: boolean;
    restoreFocus?: boolean;
    trapFocus?: boolean;
  }>((props, ref) => {
    const { autoFocus, restoreFocus, trapFocus, ...componentProps } = props;
    const elementRef = useRef<HTMLElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (!elementRef.current) return;

      // Store previous active element for restoration
      if (restoreFocus) {
        previousActiveElement.current = document.activeElement as HTMLElement;
      }

      // Auto focus
      if (autoFocus) {
        elementRef.current.focus();
      }

      // Trap focus
      let focusTrapCleanup: (() => void) | undefined;
      if (trapFocus) {
        const { trapFocus: trapFocusUtil } = a11yUtils.createFocusManagement();
        focusTrapCleanup = trapFocusUtil(elementRef.current);
      }

      return () => {
        focusTrapCleanup?.();

        // Restore focus
        if (restoreFocus && previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }, [autoFocus, restoreFocus, trapFocus]);

    return (
      <Component
        {...(componentProps as P)}
        ref={(node: HTMLElement) => {
          elementRef.current = node;
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
      />
    );
  });
}

// HOC for click outside detection
export function withClickOutside<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & {
    onClickOutside?: (event: MouseEvent) => void;
    disabled?: boolean;
  }>((props, ref) => {
    const { onClickOutside, disabled, ...componentProps } = props;
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!onClickOutside || disabled) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (elementRef.current && !elementRef.current.contains(event.target as Node)) {
          onClickOutside(event);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClickOutside, disabled]);

    return (
      <Component
        {...(componentProps as P)}
        ref={(node: HTMLElement) => {
          elementRef.current = node;
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
      />
    );
  });
}

// HOC for keyboard navigation
export function withKeyboardNavigation<P extends object>(
  Component: React.ComponentType<P>
) {
  return forwardRef<any, P & {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
    onTab?: (shift: boolean) => void;
    disabled?: boolean;
  }>((props, ref) => {
    const { onEnter, onEscape, onArrowKeys, onTab, disabled, ...componentProps } = props;

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'ArrowUp':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('up');
          }
          break;
        case 'ArrowDown':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('down');
          }
          break;
        case 'ArrowLeft':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('left');
          }
          break;
        case 'ArrowRight':
          if (onArrowKeys) {
            event.preventDefault();
            onArrowKeys('right');
          }
          break;
        case 'Tab':
          if (onTab) {
            onTab(event.shiftKey);
          }
          break;
      }
    }, [onEnter, onEscape, onArrowKeys, onTab, disabled]);

    return (
      <Component
        {...(componentProps as P)}
        onKeyDown={handleKeyDown}
        ref={ref}
      />
    );
  });
}

// Wrapper component for consistent spacing
interface SpacingWrapperProps extends BaseComponentProps {
  spacing?: ComponentSize;
  direction?: 'row' | 'column';
  wrap?: boolean;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export const SpacingWrapper: React.FC<SpacingWrapperProps> = ({
  children,
  spacing = 'md',
  direction = 'column',
  wrap = false,
  align = 'stretch',
  justify = 'start',
  className = '',
  ...props
}) => {
  const spacingClasses = {
    xs: direction === 'row' ? 'space-x-1' : 'space-y-1',
    sm: direction === 'row' ? 'space-x-2' : 'space-y-2',
    md: direction === 'row' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'row' ? 'space-x-6' : 'space-y-6',
    xl: direction === 'row' ? 'space-x-8' : 'space-y-8',
  };

  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const classes = propUtils.mergeClassNames(
    'flex',
    directionClasses[direction],
    spacingClasses[spacing],
    alignClasses[align],
    justifyClasses[justify],
    wrap && 'flex-wrap',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Wrapper component for consistent containers
interface ContainerWrapperProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  padding?: ComponentSize;
}

export const ContainerWrapper: React.FC<ContainerWrapperProps> = ({
  children,
  size = 'lg',
  centered = true,
  padding = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-none',
  };

  const paddingClasses = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const classes = propUtils.mergeClassNames(
    sizeClasses[size],
    paddingClasses[padding],
    centered && 'mx-auto',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Wrapper component for consistent cards
interface CardWrapperProps extends BaseComponentProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: ComponentSize;
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
}

export const CardWrapper: React.FC<CardWrapperProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  hoverable = false,
  clickable = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) => {
  const variantClasses = {
    elevated: 'bg-white shadow-md border border-gray-200 rounded-lg',
    outlined: 'bg-white border border-gray-300 rounded-lg',
    filled: 'bg-gray-50 border border-gray-200 rounded-lg',
  };

  const paddingClasses = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const interactiveClasses = propUtils.mergeClassNames(
    hoverable && 'transition-shadow duration-200 hover:shadow-lg',
    clickable && 'cursor-pointer transition-transform duration-200 hover:scale-[1.02]'
  );

  const classes = propUtils.mergeClassNames(
    variantClasses[variant],
    paddingClasses[padding],
    interactiveClasses,
    className
  );

  if (loading) {
    return <SkeletonCard className={classes} />;
  }

  return (
    <div
      className={classes}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

// Wrapper for responsive behavior
interface ResponsiveWrapperProps extends BaseComponentProps {
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  hideBelow?: boolean;
  hideAbove?: boolean;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  breakpoint = 'md',
  hideBelow = false,
  hideAbove = false,
  className = '',
  ...props
}) => {
  const breakpointClasses = {
    sm: hideBelow ? 'hidden sm:block' : hideAbove ? 'block sm:hidden' : '',
    md: hideBelow ? 'hidden md:block' : hideAbove ? 'block md:hidden' : '',
    lg: hideBelow ? 'hidden lg:block' : hideAbove ? 'block lg:hidden' : '',
    xl: hideBelow ? 'hidden xl:block' : hideAbove ? 'block xl:hidden' : '',
  };

  const classes = propUtils.mergeClassNames(
    breakpointClasses[breakpoint],
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Compose multiple HOCs together
export function compose<P extends object>(
  ...hocs: Array<(component: React.ComponentType<any>) => React.ComponentType<any>>
) {
  return (Component: React.ComponentType<P>) => {
    return hocs.reduce((acc, hoc) => hoc(acc), Component);
  };
}

// Create a wrapper with all common behaviors
export const withAllEnhancements = compose(
  withErrorBoundary,
  withLoading,
  withAnimation,
  withFocusManagement,
  withClickOutside,
  withKeyboardNavigation
);

// Utility to create consistent component APIs
export function createStandardComponent<P extends BaseComponentProps>(
  Component: React.ComponentType<P>,
  defaultProps?: Partial<P>
) {
  const StandardComponent = forwardRef<HTMLElement, P>((props, ref) => {
    const mergedProps = { ...defaultProps, ...props } as P;
    return <Component {...mergedProps} ref={ref} />;
  });

  StandardComponent.displayName = `Standard${Component.displayName || Component.name || 'Component'}`;

  return StandardComponent;
}