// Phase 9: Animation Helper Functions and CSS-in-JS Utilities
// Utility functions for creating consistent animations across the application

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ANIMATION_DURATIONS,
  EASING_CURVES,
  ANIMATION_DELAYS,
  ANIMATION_PROPERTIES,
  TIMING_FUNCTIONS,
  ANIMATION_SEQUENCES,
  TRANSFORM_VALUES,
  OPACITY_VALUES,
  type AnimationConfig,
  type AnimationState,
  type AnimationDuration,
  type EasingCurve,
  type AnimationDelay,
  type TimingFunction,
  type AnimationSequence,
} from './animationConstants';

// Re-export types for use in other files
export type { AnimationConfig, AnimationSequence, AnimationState, AnimationDuration, EasingCurve, AnimationDelay, TimingFunction };

// CSS-in-JS animation creators
export const animationHelpers = {
  // Create transition CSS properties
  createTransition: (config: Partial<AnimationConfig> = {}): React.CSSProperties => {
    const duration = typeof config.duration === 'string'
      ? ANIMATION_DURATIONS[config.duration as AnimationDuration]
      : config.duration ?? ANIMATION_DURATIONS.normal;

    const easing = typeof config.easing === 'string'
      ? EASING_CURVES[config.easing as EasingCurve] ?? EASING_CURVES.ease
      : config.easing ?? EASING_CURVES.ease;

    const delay = typeof config.delay === 'string'
      ? ANIMATION_DELAYS[config.delay as AnimationDelay]
      : config.delay ?? ANIMATION_DELAYS.none;

    const properties = config.properties ?? ANIMATION_PROPERTIES.all;

    return {
      transition: `${properties} ${duration}ms ${easing}${delay > 0 ? ` ${delay}ms` : ''}`,
    };
  },

  // Create transform CSS properties
  createTransform: (transforms: {
    scale?: number;
    translateX?: number | string;
    translateY?: number | string;
    translateZ?: number | string;
    rotate?: number | string;
    rotateX?: number | string;
    rotateY?: number | string;
    rotateZ?: number | string;
    skewX?: number | string;
    skewY?: number | string;
  }): React.CSSProperties => {
    const transformParts: string[] = [];

    if (transforms.scale !== undefined) {
      transformParts.push(`scale(${transforms.scale})`);
    }

    if (transforms.translateX !== undefined) {
      const value = typeof transforms.translateX === 'number' ? `${transforms.translateX}px` : transforms.translateX;
      transformParts.push(`translateX(${value})`);
    }

    if (transforms.translateY !== undefined) {
      const value = typeof transforms.translateY === 'number' ? `${transforms.translateY}px` : transforms.translateY;
      transformParts.push(`translateY(${value})`);
    }

    if (transforms.translateZ !== undefined) {
      const value = typeof transforms.translateZ === 'number' ? `${transforms.translateZ}px` : transforms.translateZ;
      transformParts.push(`translateZ(${value})`);
    }

    if (transforms.rotate !== undefined) {
      const value = typeof transforms.rotate === 'number' ? `${transforms.rotate}deg` : transforms.rotate;
      transformParts.push(`rotate(${value})`);
    }

    if (transforms.rotateX !== undefined) {
      const value = typeof transforms.rotateX === 'number' ? `${transforms.rotateX}deg` : transforms.rotateX;
      transformParts.push(`rotateX(${value})`);
    }

    if (transforms.rotateY !== undefined) {
      const value = typeof transforms.rotateY === 'number' ? `${transforms.rotateY}deg` : transforms.rotateY;
      transformParts.push(`rotateY(${value})`);
    }

    if (transforms.rotateZ !== undefined) {
      const value = typeof transforms.rotateZ === 'number' ? `${transforms.rotateZ}deg` : transforms.rotateZ;
      transformParts.push(`rotateZ(${value})`);
    }

    if (transforms.skewX !== undefined) {
      const value = typeof transforms.skewX === 'number' ? `${transforms.skewX}deg` : transforms.skewX;
      transformParts.push(`skewX(${value})`);
    }

    if (transforms.skewY !== undefined) {
      const value = typeof transforms.skewY === 'number' ? `${transforms.skewY}deg` : transforms.skewY;
      transformParts.push(`skewY(${value})`);
    }

    return {
      transform: transformParts.join(' ') || 'none',
    };
  },

  // Create keyframe animations for CSS-in-JS
  createKeyframes: (name: string, frames: Record<string, React.CSSProperties>): string => {
    const keyframeRules = Object.entries(frames)
      .map(([key, styles]) => {
        const styleString = Object.entries(styles)
          .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
          .join('; ');
        return `${key} { ${styleString} }`;
      })
      .join(' ');

    return `@keyframes ${name} { ${keyframeRules} }`;
  },

  // Create animation CSS properties
  createAnimation: (
    name: string,
    duration: number | AnimationDuration = 'normal',
    easing: string | EasingCurve = 'ease',
    delay: number | AnimationDelay = 'none',
    iterationCount: number | 'infinite' = 1,
    direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse' = 'normal',
    fillMode: 'none' | 'forwards' | 'backwards' | 'both' = 'none'
  ): React.CSSProperties => {
    const durationMs = typeof duration === 'string' ? ANIMATION_DURATIONS[duration] : duration;
    const easingValue = typeof easing === 'string' ? (EASING_CURVES as any)[easing] : easing;
    const delayMs = typeof delay === 'string' ? ANIMATION_DELAYS[delay] : delay;

    return {
      animationName: name,
      animationDuration: `${durationMs}ms`,
      animationTimingFunction: easingValue,
      animationDelay: `${delayMs}ms`,
      animationIterationCount: iterationCount,
      animationDirection: direction,
      animationFillMode: fillMode,
    };
  },

  // Get predefined animation sequence styles
  getAnimationSequence: (sequenceName: AnimationSequence, phase: 'initial' | 'animate'): React.CSSProperties => {
    const sequence = ANIMATION_SEQUENCES[sequenceName];
    const styles = sequence[phase];
    const transition = animationHelpers.createTransition(sequence.timing);

    return {
      ...styles,
      ...transition,
    };
  },

  // Create hover state animations
  createHoverAnimation: (
    normalState: React.CSSProperties,
    hoverState: React.CSSProperties,
    config: Partial<AnimationConfig> = {}
  ) => ({
    normal: {
      ...normalState,
      ...animationHelpers.createTransition(config),
    },
    hover: {
      ...normalState,
      ...hoverState,
      ...animationHelpers.createTransition(config),
    },
  }),

  // Create focus state animations
  createFocusAnimation: (
    normalState: React.CSSProperties,
    focusState: React.CSSProperties,
    config: Partial<AnimationConfig> = {}
  ) => ({
    normal: {
      ...normalState,
      ...animationHelpers.createTransition(config),
    },
    focus: {
      ...normalState,
      ...focusState,
      ...animationHelpers.createTransition(config),
    },
  }),

  // Create loading animation styles
  createLoadingAnimation: (type: 'pulse' | 'spin' | 'bounce' = 'pulse'): React.CSSProperties => {
    switch (type) {
      case 'pulse':
        return {
          animation: `pulse ${ANIMATION_DURATIONS.slower}ms ${EASING_CURVES.easeInOut} infinite alternate`,
        };
      case 'spin':
        return {
          animation: `spin ${ANIMATION_DURATIONS.slower}ms ${EASING_CURVES.linear} infinite`,
        };
      case 'bounce':
        return {
          animation: `bounce ${ANIMATION_DURATIONS.normal}ms ${EASING_CURVES.bounce} infinite`,
        };
      default:
        return {};
    }
  },
};

// React hooks for animations
export const useAnimations = {
  // Hook for managing animation states
  useAnimationState: (initialState: 'initial' | 'animate' = 'initial') => {
    const [animationState, setAnimationState] = useState<'initial' | 'animate'>(initialState);
    const [isAnimating, setIsAnimating] = useState(false);

    const animate = useCallback(() => {
      setIsAnimating(true);
      setAnimationState('animate');
    }, []);

    const reset = useCallback(() => {
      setIsAnimating(false);
      setAnimationState('initial');
    }, []);

    const toggle = useCallback(() => {
      if (animationState === 'initial') {
        animate();
      } else {
        reset();
      }
    }, [animationState, animate, reset]);

    return {
      animationState,
      isAnimating,
      animate,
      reset,
      toggle,
      setAnimationState,
    };
  },

  // Hook for entrance animations
  useEntranceAnimation: (
    sequenceName: AnimationSequence,
    trigger: boolean = true,
    delay: number = 0
  ) => {
    const [hasEntered, setHasEntered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
      if (trigger && !hasEntered) {
        if (delay > 0) {
          timeoutRef.current = setTimeout(() => {
            setHasEntered(true);
          }, delay);
        } else {
          setHasEntered(true);
        }
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [trigger, hasEntered, delay]);

    const styles = animationHelpers.getAnimationSequence(
      sequenceName,
      hasEntered ? 'animate' : 'initial'
    );

    return {
      styles,
      hasEntered,
      reset: () => setHasEntered(false),
    };
  },

  // Hook for hover animations
  useHoverAnimation: (
    normalState: React.CSSProperties,
    hoverState: React.CSSProperties,
    config: Partial<AnimationConfig> = {}
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    const animations = animationHelpers.createHoverAnimation(normalState, hoverState, config);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    return {
      styles: isHovered ? animations.hover : animations.normal,
      isHovered,
      handlers: {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      },
    };
  },

  // Hook for focus animations
  useFocusAnimation: (
    normalState: React.CSSProperties,
    focusState: React.CSSProperties,
    config: Partial<AnimationConfig> = {}
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const animations = animationHelpers.createFocusAnimation(normalState, focusState, config);

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    return {
      styles: isFocused ? animations.focus : animations.normal,
      isFocused,
      handlers: {
        onFocus: handleFocus,
        onBlur: handleBlur,
      },
    };
  },

  // Hook for staggered animations
  useStaggeredAnimation: (
    itemCount: number,
    sequenceName: AnimationSequence,
    staggerDelay: number = ANIMATION_DELAYS.stagger
  ) => {
    const [animatedItems, setAnimatedItems] = useState<boolean[]>(new Array(itemCount).fill(false));

    const startAnimation = useCallback(() => {
      for (let i = 0; i < itemCount; i++) {
        setTimeout(() => {
          setAnimatedItems(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * staggerDelay);
      }
    }, [itemCount, staggerDelay]);

    const resetAnimation = useCallback(() => {
      setAnimatedItems(new Array(itemCount).fill(false));
    }, [itemCount]);

    const getItemStyles = (index: number): React.CSSProperties => {
      return animationHelpers.getAnimationSequence(
        sequenceName,
        animatedItems[index] ? 'animate' : 'initial'
      );
    };

    return {
      animatedItems,
      startAnimation,
      resetAnimation,
      getItemStyles,
      isComplete: animatedItems.every(item => item),
    };
  },

  // Hook for scroll-triggered animations
  useScrollAnimation: (
    sequenceName: AnimationSequence,
    threshold: number = 0.1,
    rootMargin: string = '0px'
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold, rootMargin }
      );

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [threshold, rootMargin]);

    const styles = animationHelpers.getAnimationSequence(
      sequenceName,
      isVisible ? 'animate' : 'initial'
    );

    return {
      ref: elementRef,
      styles,
      isVisible,
    };
  },
};

// Utility functions for animation timing
export const animationUtils = {
  // Convert timing function name to values
  getTimingValues: (name: TimingFunction) => TIMING_FUNCTIONS[name],

  // Calculate total animation duration including delay
  getTotalDuration: (config: AnimationConfig): number => {
    const duration = typeof config.duration === 'string'
      ? ANIMATION_DURATIONS[config.duration]
      : config.duration;
    const delay = typeof config.delay === 'string'
      ? ANIMATION_DELAYS[config.delay]
      : config.delay;
    return duration + delay;
  },

  // Create staggered timing for multiple elements
  createStaggeredTiming: (
    baseConfig: AnimationConfig,
    index: number,
    staggerDelay: number = ANIMATION_DELAYS.stagger
  ): AnimationConfig => ({
    ...baseConfig,
    delay: (typeof baseConfig.delay === 'string'
      ? ANIMATION_DELAYS[baseConfig.delay]
      : baseConfig.delay) + (index * staggerDelay),
  }),

  // Validate animation configuration
  validateConfig: (config: Partial<AnimationConfig>): AnimationConfig => ({
    duration: config.duration ?? 'normal',
    easing: config.easing ?? 'ease',
    delay: config.delay ?? 'none',
    properties: config.properties ?? 'all',
  }),

  // Create reduced motion alternatives
  createReducedMotionConfig: (config: AnimationConfig): AnimationConfig => ({
    ...config,
    duration: ANIMATION_DURATIONS.fast,
    easing: EASING_CURVES.linear,
    delay: ANIMATION_DELAYS.none,
  }),

  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  },
};

// Export all animation-related utilities
export {
  ANIMATION_DURATIONS,
  EASING_CURVES,
  ANIMATION_DELAYS,
  ANIMATION_PROPERTIES,
  TIMING_FUNCTIONS,
  ANIMATION_SEQUENCES,
  TRANSFORM_VALUES,
  OPACITY_VALUES,
};