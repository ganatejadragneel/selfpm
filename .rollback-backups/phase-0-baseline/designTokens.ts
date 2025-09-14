// Enhanced Design Token System - Phase 5 DRY Refactoring
// Semantic tokens that provide meaning beyond basic colors/sizes

import { theme } from './theme';

// Semantic color tokens for specific use cases
export const semanticTokens = {
  // Surface tokens - for backgrounds and containers
  surface: {
    primary: theme.colors.surface.white,
    secondary: theme.colors.background.secondary,
    tertiary: theme.colors.background.tertiary,
    elevated: theme.colors.surface.glass,
    overlay: 'rgba(0, 0, 0, 0.5)',
    card: theme.colors.surface.white,
    modal: theme.colors.surface.white,
  },

  // Border tokens - semantic border styles
  border: {
    default: theme.colors.border.light,
    focus: theme.colors.primary.dark,
    error: theme.colors.status.error.dark,
    success: theme.colors.status.success.dark,
    warning: theme.colors.status.warning.dark,
    subtle: theme.colors.border.light,
    strong: theme.colors.border.medium,
  },

  // Interactive state tokens
  interactive: {
    // Hover states
    hover: {
      lift: 'translateY(-2px)',
      scale: 'scale(1.02)',
      opacity: '0.8',
      shadow: theme.effects.shadow.md,
    },

    // Active/pressed states
    active: {
      lift: 'translateY(0px)',
      scale: 'scale(0.98)',
      opacity: '0.9',
    },

    // Focus states
    focus: {
      outline: `2px solid ${theme.colors.primary.dark}`,
      outlineOffset: '2px',
    },

    // Disabled states
    disabled: {
      opacity: '0.6',
      cursor: 'not-allowed',
      pointerEvents: 'none' as const,
    },
  },

  // Animation tokens
  animation: {
    // Transition durations
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },

    // Easing functions
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // Common transitions
    transition: {
      default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      colors: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Layout tokens
  layout: {
    // Container widths
    container: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    // Common gaps and spacing patterns
    gap: {
      none: '0px',
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
      md: theme.spacing.md,
      lg: theme.spacing.lg,
      xl: theme.spacing.xl,
      '2xl': theme.spacing['2xl'],
      '3xl': theme.spacing['3xl'],
    },

    // Z-index scale
    zIndex: {
      base: 0,
      raised: 10,
      overlay: 100,
      modal: 1000,
      popover: 1100,
      tooltip: 1200,
      toast: 1300,
    },
  },

  // Typography semantic tokens
  text: {
    // Semantic text colors
    primary: theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    muted: theme.colors.text.muted,
    inverse: 'white',
    error: theme.colors.status.error.dark,
    success: theme.colors.status.success.dark,
    warning: theme.colors.status.warning.dark,

    // Text sizes with line heights
    size: {
      xs: { fontSize: theme.typography.sizes.xs, lineHeight: '1.25' },
      sm: { fontSize: theme.typography.sizes.sm, lineHeight: '1.375' },
      base: { fontSize: theme.typography.sizes.base, lineHeight: '1.5' },
      lg: { fontSize: theme.typography.sizes.lg, lineHeight: '1.5' },
      xl: { fontSize: theme.typography.sizes.xl, lineHeight: '1.5' },
      '2xl': { fontSize: theme.typography.sizes['2xl'], lineHeight: '1.4' },
      '3xl': { fontSize: theme.typography.sizes['3xl'], lineHeight: '1.3' },
    },
  },
} as const;