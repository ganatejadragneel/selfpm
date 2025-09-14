// Animation Utilities - Phase 5 DRY Refactoring
// Standardized animations, transitions, and motion patterns

import { semanticTokens } from './designTokens';
import type { CSSProperties } from 'react';

// CSS-in-JS keyframes (for styled-components or emotion)
export const keyframes = {
  fadeIn: `
    from { opacity: 0; }
    to { opacity: 1; }
  `,

  fadeOut: `
    from { opacity: 1; }
    to { opacity: 0; }
  `,

  slideInUp: `
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  slideInDown: `
    from {
      opacity: 0;
      transform: translateY(-24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  slideInLeft: `
    from {
      opacity: 0;
      transform: translateX(-24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  slideInRight: `
    from {
      opacity: 0;
      transform: translateX(24px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  scaleIn: `
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  `,

  scaleOut: `
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  `,

  bounce: `
    0%, 20%, 53%, 80%, 100% {
      animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
      transform: translate3d(0, -8px, 0);
    }
    70% {
      animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -1px, 0);
    }
  `,

  pulse: `
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  `,

  shake: `
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  `,

  spin: `
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `,

  float: `
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  `,
};

// Pre-defined animation configurations
export const animations = {
  // Entrance animations
  entrance: {
    fadeIn: (): CSSProperties => ({
      animation: `fadeIn ${semanticTokens.animation.duration.normal} ${semanticTokens.animation.easing.easeOut} forwards`,
    }),

    slideInUp: (): CSSProperties => ({
      animation: `slideInUp ${semanticTokens.animation.duration.normal} ${semanticTokens.animation.easing.easeOut} forwards`,
    }),

    slideInDown: (): CSSProperties => ({
      animation: `slideInDown ${semanticTokens.animation.duration.normal} ${semanticTokens.animation.easing.easeOut} forwards`,
    }),

    slideInLeft: (): CSSProperties => ({
      animation: `slideInLeft ${semanticTokens.animation.duration.normal} ${semanticTokens.animation.easing.easeOut} forwards`,
    }),

    slideInRight: (): CSSProperties => ({
      animation: `slideInRight ${semanticTokens.animation.duration.normal} ${semanticTokens.animation.easing.easeOut} forwards`,
    }),

    scaleIn: (): CSSProperties => ({
      animation: `scaleIn ${semanticTokens.animation.duration.fast} ${semanticTokens.animation.easing.easeOut} forwards`,
    }),
  },

  // Exit animations
  exit: {
    fadeOut: (): CSSProperties => ({
      animation: `fadeOut ${semanticTokens.animation.duration.normal} ${semanticTokens.animation.easing.easeIn} forwards`,
    }),

    scaleOut: (): CSSProperties => ({
      animation: `scaleOut ${semanticTokens.animation.duration.fast} ${semanticTokens.animation.easing.easeIn} forwards`,
    }),
  },

  // Attention/feedback animations
  attention: {
    bounce: (): CSSProperties => ({
      animation: `bounce ${semanticTokens.animation.duration.slower} ${semanticTokens.animation.easing.bounce} forwards`,
    }),

    pulse: (): CSSProperties => ({
      animation: `pulse 2s ${semanticTokens.animation.easing.easeInOut} infinite`,
    }),

    shake: (): CSSProperties => ({
      animation: `shake ${semanticTokens.animation.duration.slow} ${semanticTokens.animation.easing.easeInOut} forwards`,
    }),

    float: (): CSSProperties => ({
      animation: `float 3s ${semanticTokens.animation.easing.easeInOut} infinite`,
    }),
  },

  // Loading animations
  loading: {
    spin: (): CSSProperties => ({
      animation: `spin 1s ${semanticTokens.animation.easing.linear} infinite`,
    }),

    pulse: (): CSSProperties => ({
      animation: `pulse 1.5s ${semanticTokens.animation.easing.easeInOut} infinite`,
    }),
  },
};

// Transition utilities for interactive states
// Note: These return base styles - hover/focus states should be applied via event handlers
export const transitions = {
  // Base transitions for hover effects
  hover: {
    lift: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.transform,
    }),

    scale: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.transform,
    }),

    glow: (): CSSProperties => ({
      transition: 'box-shadow 200ms ease',
    }),

    brighten: (): CSSProperties => ({
      transition: 'filter 200ms ease',
    }),
  },

  // Base transitions for focus effects
  focus: {
    ring: (): CSSProperties => ({
      transition: 'box-shadow 200ms ease',
    }),

    outline: (): CSSProperties => ({
      transition: 'outline 200ms ease',
    }),
  },

  // Base transitions for active states
  active: {
    press: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.transform,
    }),

    sink: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.transform,
    }),
  },
};

// Motion presets for common UI patterns
// Note: These provide base transition styles - interactive states handled via event handlers
export const motionPresets = {
  // Card interactions
  card: {
    default: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.default,
    }),

    gentle: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.slow,
    }),

    pronounced: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.fast,
    }),
  },

  // Button interactions
  button: {
    primary: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.default,
    }),

    secondary: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.colors,
    }),

    ghost: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.colors,
    }),
  },

  // Modal/overlay animations
  modal: {
    backdrop: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.opacity,
    }),

    content: (): CSSProperties => ({
      transition: `${semanticTokens.animation.transition.transform}, ${semanticTokens.animation.transition.opacity}`,
    }),
  },

  // List item animations
  listItem: {
    default: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.colors,
    }),

    highlight: (): CSSProperties => ({
      transition: semanticTokens.animation.transition.colors,
    }),
  },
};

// Helper function to create stagger animations for lists
export const createStaggerAnimation = (
  itemCount: number,
  baseDelay: number = 50
): CSSProperties[] => {
  return Array.from({ length: itemCount }, (_, index) => ({
    animationDelay: `${index * baseDelay}ms`,
  }));
};

// Helper function for reduced motion preferences
// Note: In CSS-in-JS, media queries should be handled at the component level
export const respectsReducedMotion = (styles: CSSProperties): CSSProperties => ({
  ...styles,
  // Media queries in CSS-in-JS should be handled by the consuming library
});

// Global CSS injection helper (for when using CSS-in-JS libraries)
export const injectGlobalAnimations = (): string => {
  return Object.entries(keyframes)
    .map(([name, keyframe]) => `@keyframes ${name} { ${keyframe} }`)
    .join('\n');
};