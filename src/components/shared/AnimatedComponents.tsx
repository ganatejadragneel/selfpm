// Phase 9: Animated Components - Pre-built components with built-in animations
// Reusable animated components to eliminate repetitive animation code

import React, { forwardRef, useEffect, useState } from 'react';
import type { BaseComponentProps } from '../../types/shared/componentInterfaces';
import { animationHelpers, useAnimations, type AnimationSequence } from '../../utils/shared/animationHelpers';
import { responsiveHelpers, useResponsive, type ResponsiveValue } from '../../utils/shared/responsiveSystem';

// Animated Container component
interface AnimatedContainerProps extends BaseComponentProps {
  animation?: AnimationSequence;
  trigger?: boolean;
  delay?: number;
  staggerChildren?: boolean;
  staggerDelay?: number;
  customAnimation?: {
    initial: React.CSSProperties;
    animate: React.CSSProperties;
  };
}

export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(
  ({
    children,
    animation = 'fadeIn',
    trigger = true,
    delay = 0,
    staggerChildren = false,
    staggerDelay = 150,
    customAnimation,
    className = '',
    style = {},
    ...props
  }, ref) => {
    const { styles: entranceStyles } = useAnimations.useEntranceAnimation(animation, trigger, delay);
    const [childCount, setChildCount] = useState(0);
    const { startAnimation, getItemStyles } = useAnimations.useStaggeredAnimation(
      childCount,
      animation,
      staggerDelay
    );

    useEffect(() => {
      if (React.Children.count(children) !== childCount) {
        setChildCount(React.Children.count(children));
      }
    }, [children, childCount]);

    useEffect(() => {
      if (staggerChildren && trigger && childCount > 0) {
        startAnimation();
      }
    }, [staggerChildren, trigger, childCount, startAnimation]);

    const containerStyles = customAnimation
      ? animationHelpers.getAnimationSequence(animation, trigger ? 'animate' : 'initial')
      : entranceStyles;

    const renderChildren = () => {
      if (!staggerChildren) {
        return children;
      }

      return React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const itemStyles = getItemStyles(index);

        const childElement = child as React.ReactElement<any>;
        return React.cloneElement(childElement, {
          style: {
            ...(childElement.props?.style || {}),
            ...itemStyles,
          },
        });
      });
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{
          ...containerStyles,
          ...style,
        }}
        {...props}
      >
        {renderChildren()}
      </div>
    );
  }
);

AnimatedContainer.displayName = 'AnimatedContainer';

// Animated Card component
interface AnimatedCardProps extends BaseComponentProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: ResponsiveValue<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
  hoverable?: boolean;
  clickable?: boolean;
  hoverAnimation?: 'lift' | 'scale' | 'glow' | 'none';
  entranceAnimation?: AnimationSequence;
  loading?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({
    children,
    variant = 'elevated',
    padding = 'md',
    hoverable = true,
    clickable = false,
    hoverAnimation = 'lift',
    entranceAnimation = 'slideInFromBottom',
    loading = false,
    className = '',
    style = {},
    onClick,
    ...props
  }, ref) => {
    // const paddingValue = useResponsive.useResponsiveValue(padding); // Future use for responsive padding

    const { styles: entranceStyles } = useAnimations.useEntranceAnimation(entranceAnimation, !loading);

    // Base card styles
    const baseStyles: React.CSSProperties = {
      borderRadius: '12px',
      position: 'relative',
      overflow: 'hidden',
      cursor: clickable ? 'pointer' : 'default',
    };

    // Variant styles
    const variantStyles: React.CSSProperties = {
      elevated: {
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
      },
      outlined: {
        backgroundColor: 'white',
        border: '1px solid rgba(0, 0, 0, 0.12)',
      },
      filled: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      },
    }[variant];

    // Padding styles
    const paddingStyles = responsiveHelpers.createSpacing('padding', 'all', padding);

    // Hover styles
    const hoverStyles = hoverable ? {
      lift: {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      },
      scale: {
        transform: 'scale(1.02)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.12)',
      },
      glow: {
        boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      none: {},
    }[hoverAnimation] : {};

    const { styles: interactionStyles, handlers } = useAnimations.useHoverAnimation(
      {},
      hoverStyles,
      { duration: 'fast', easing: 'smooth' }
    );

    if (loading) {
      return (
        <div
          ref={ref}
          className={className}
          style={{
            ...baseStyles,
            ...variantStyles,
            ...paddingStyles,
            ...style,
            ...animationHelpers.createLoadingAnimation('pulse'),
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          }}
          {...props}
        >
          <div style={{ height: '120px', opacity: 0.3 }} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={className}
        style={{
          ...baseStyles,
          ...variantStyles,
          ...paddingStyles,
          ...entranceStyles,
          ...interactionStyles,
          ...animationHelpers.createTransition({ duration: 'fast', easing: 'smooth' }),
          ...style,
        }}
        onClick={clickable ? onClick : undefined}
        {...handlers}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Animated Button component
interface AnimatedButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  animation?: 'bounce' | 'pulse' | 'scale' | 'shake' | 'none';
  loadingAnimation?: 'spin' | 'pulse' | 'bounce';
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    animation = 'scale',
    loadingAnimation = 'spin',
    className = '',
    style = {},
    onClick,
    ...props
  }, ref) => {
    const [isClicked, setIsClicked] = useState(false);
    const sizeValue = useResponsive.useResponsiveValue(size);

    // Base button styles
    const baseStyles: React.CSSProperties = {
      border: 'none',
      borderRadius: '8px',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: '600',
      textDecoration: 'none',
      position: 'relative',
      overflow: 'hidden',
    };

    // Size styles
    const sizeStyles: React.CSSProperties = {
      xs: { padding: '6px 12px', fontSize: '12px', lineHeight: '16px' },
      sm: { padding: '8px 16px', fontSize: '14px', lineHeight: '20px' },
      md: { padding: '10px 20px', fontSize: '16px', lineHeight: '24px' },
      lg: { padding: '12px 24px', fontSize: '18px', lineHeight: '26px' },
      xl: { padding: '16px 32px', fontSize: '20px', lineHeight: '28px' },
    }[sizeValue];

    // Variant styles
    const variantStyles: React.CSSProperties = {
      primary: {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
      secondary: {
        backgroundColor: '#6b7280',
        color: 'white',
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#3b82f6',
        border: '1px solid #3b82f6',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#6b7280',
      },
    }[variant];

    // Disabled styles
    const disabledStyles: React.CSSProperties = disabled ? {
      opacity: 0.5,
      transform: 'none',
    } : {};

    // Hover styles
    const hoverStyles: React.CSSProperties = !disabled && !loading ? {
      primary: { backgroundColor: '#2563eb' },
      secondary: { backgroundColor: '#4b5563' },
      outline: { backgroundColor: '#3b82f6', color: 'white' },
      ghost: { backgroundColor: 'rgba(107, 114, 128, 0.1)' },
    }[variant] : {};

    // Click animation
    useEffect(() => {
      if (isClicked) {
        const timer = setTimeout(() => setIsClicked(false), 150);
        return () => clearTimeout(timer);
      }
    }, [isClicked]);

    // Animation styles
    const animationStyles = isClicked ? {
      bounce: { transform: 'scale(1.05)' },
      pulse: { transform: 'scale(1.02)', opacity: 0.9 },
      scale: { transform: 'scale(0.95)' },
      shake: { transform: 'translateX(2px)' },
      none: {},
    }[animation] : {};

    const { styles: interactionStyles, handlers } = useAnimations.useHoverAnimation(
      {},
      hoverStyles,
      { duration: 'fast', easing: 'smooth' }
    );

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !loading) {
        setIsClicked(true);
        onClick?.(e);
      }
    };

    const loadingIcon = loading ? (
      <div style={animationHelpers.createLoadingAnimation(loadingAnimation)}>
        ⟳
      </div>
    ) : null;

    return (
      <button
        ref={ref}
        className={className}
        style={{
          ...baseStyles,
          ...sizeStyles,
          ...variantStyles,
          ...disabledStyles,
          ...interactionStyles,
          ...animationStyles,
          ...animationHelpers.createTransition({ duration: 'fast', easing: 'smooth' }),
          ...style,
        }}
        disabled={disabled || loading}
        onClick={handleClick}
        {...handlers}
        {...props}
      >
        {loading && loadingIcon}
        {!loading && icon && iconPosition === 'left' && icon}
        {!loading && children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

// Animated Modal component
interface AnimatedModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  animation?: 'fade' | 'scale' | 'slideUp' | 'slideDown';
  size?: ResponsiveValue<'sm' | 'md' | 'lg' | 'xl' | 'full'>;
  centered?: boolean;
}

export const AnimatedModal = forwardRef<HTMLDivElement, AnimatedModalProps>(
  ({
    children,
    isOpen,
    onClose,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    animation = 'scale',
    size = 'md',
    centered = true,
    className = '',
    style = {},
    ...props
  }, ref) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const sizeValue = useResponsive.useResponsiveValue(size);

    useEffect(() => {
      if (isOpen) {
        setShouldRender(true);
      } else {
        const timer = setTimeout(() => setShouldRender(false), 250);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    useEffect(() => {
      if (closeOnEscape) {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && isOpen) {
            onClose();
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [closeOnEscape, isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = 'unset';
        };
      }
    }, [isOpen]);

    if (!shouldRender) return null;

    // Overlay styles
    const overlayStyles: React.CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: centered ? 'center' : 'flex-start',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 1000,
      opacity: isOpen ? 1 : 0,
      ...animationHelpers.createTransition({ duration: 'normal', easing: 'smooth' }),
    };

    // Modal content styles
    const contentStyles: React.CSSProperties = {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      position: 'relative',
      maxHeight: '90vh',
      overflow: 'auto',
      width: '100%',
      ...animationHelpers.createTransition({ duration: 'normal', easing: 'spring' }),
    };

    // Size styles
    const modalSizeStyles: React.CSSProperties = {
      sm: { maxWidth: '400px' },
      md: { maxWidth: '500px' },
      lg: { maxWidth: '700px' },
      xl: { maxWidth: '900px' },
      full: { maxWidth: '100%', margin: '0', borderRadius: '0' },
    }[sizeValue];

    // Animation styles
    const animationState: 'initial' | 'animate' = isOpen ? 'animate' : 'initial';

    const modalAnimationStyles = {
      fade: animationHelpers.getAnimationSequence('fadeIn', animationState),
      scale: animationHelpers.getAnimationSequence('scaleIn', animationState),
      slideUp: animationHelpers.getAnimationSequence('slideInFromBottom', animationState),
      slideDown: animationHelpers.getAnimationSequence('slideInFromTop', animationState),
    }[animation];

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div style={overlayStyles} onClick={handleOverlayClick}>
        <div
          ref={ref}
          className={className}
          style={{
            ...contentStyles,
            ...modalSizeStyles,
            ...modalAnimationStyles,
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

AnimatedModal.displayName = 'AnimatedModal';

// Animated List component
interface AnimatedListProps extends BaseComponentProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  stagger?: boolean;
  staggerDelay?: number;
  animation?: AnimationSequence;
  loading?: boolean;
  loadingCount?: number;
}

export const AnimatedList = forwardRef<HTMLUListElement, AnimatedListProps>(
  ({
    items,
    renderItem,
    stagger = true,
    staggerDelay = 100,
    animation = 'slideInFromLeft',
    loading = false,
    loadingCount = 3,
    className = '',
    style = {},
    ...props
  }, ref) => {
    const { startAnimation, getItemStyles } = useAnimations.useStaggeredAnimation(
      loading ? loadingCount : items.length,
      animation,
      staggerDelay
    );

    useEffect(() => {
      if (!loading && items.length > 0) {
        startAnimation();
      }
    }, [loading, items.length, startAnimation]);

    const renderLoadingItems = () => {
      return Array.from({ length: loadingCount }, (_, index) => (
        <li
          key={`loading-${index}`}
          style={{
            ...getItemStyles(index),
            padding: '12px 0',
          }}
        >
          <div
            style={{
              height: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              ...animationHelpers.createLoadingAnimation('pulse'),
            }}
          />
        </li>
      ));
    };

    const renderActualItems = () => {
      return items.map((item, index) => (
        <li
          key={index}
          style={stagger ? getItemStyles(index) : undefined}
        >
          {renderItem(item, index)}
        </li>
      ));
    };

    return (
      <ul
        ref={ref}
        className={className}
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {loading ? renderLoadingItems() : renderActualItems()}
      </ul>
    );
  }
);

AnimatedList.displayName = 'AnimatedList';