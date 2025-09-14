// Style Compositions - Phase 5 DRY Refactoring
// Reusable style combinations that eliminate duplication

import { theme } from './theme';
import { semanticTokens } from './designTokens';
import type { CSSProperties } from 'react';

// Common style combinations used across components
export const styleCompositions = {
  // Card-based components
  card: {
    base: (): CSSProperties => ({
      backgroundColor: semanticTokens.surface.card,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${semanticTokens.border.default}`,
      transition: semanticTokens.animation.transition.default,
      overflow: 'hidden',
    }),

    elevated: (elevation: 'sm' | 'md' | 'lg' = 'sm'): CSSProperties => ({
      ...styleCompositions.card.base(),
      boxShadow: theme.effects.shadow[elevation],
    }),

    interactive: (): CSSProperties => ({
      ...styleCompositions.card.base(),
      cursor: 'pointer',
      // Hover states should be handled via event handlers in React
    }),

    draggable: (isDragging: boolean, accentColor?: string): CSSProperties => ({
      ...styleCompositions.card.base(),
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.8 : 1,
      transform: isDragging ? 'rotate(2deg)' : 'none',
      zIndex: isDragging ? semanticTokens.layout.zIndex.raised : 'auto',
      transition: isDragging ? 'none' : semanticTokens.animation.transition.default,
      border: isDragging && accentColor
        ? `2px solid ${accentColor}`
        : `1px solid ${semanticTokens.border.default}`,
      boxShadow: isDragging && accentColor
        ? `0 8px 32px ${accentColor}44`
        : theme.effects.shadow.sm,
    }),
  },

  // Button styles
  button: {
    base: (): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.sizes.base,
      fontWeight: theme.typography.weights.semibold,
      cursor: 'pointer',
      transition: semanticTokens.animation.transition.default,
      border: 'none',
      textDecoration: 'none',
      userSelect: 'none' as const,
    }),

    primary: (): CSSProperties => ({
      ...styleCompositions.button.base(),
      background: theme.colors.primary.gradient,
      color: 'white',
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      boxShadow: `0 4px 15px ${theme.colors.primary.dark}33`,
    }),

    secondary: (): CSSProperties => ({
      ...styleCompositions.button.base(),
      backgroundColor: 'transparent',
      color: theme.colors.primary.dark,
      border: `2px solid ${theme.colors.primary.dark}`,
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    }),

    ghost: (): CSSProperties => ({
      ...styleCompositions.button.base(),
      backgroundColor: 'transparent',
      color: semanticTokens.text.secondary,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    }),

    icon: (size: 'sm' | 'md' | 'lg' = 'md'): CSSProperties => {
      const sizes = { sm: '32px', md: '40px', lg: '48px' };
      return {
        ...styleCompositions.button.base(),
        width: sizes[size],
        height: sizes[size],
        padding: 0,
        borderRadius: '50%',
        backgroundColor: 'transparent',
      };
    },

    // Interactive states (hover/active handled via event handlers)
    withHover: (baseStyles: CSSProperties): CSSProperties => ({
      ...baseStyles,
      // Hover states should be handled via onMouseEnter/onMouseLeave
    }),

    withActive: (baseStyles: CSSProperties): CSSProperties => ({
      ...baseStyles,
      // Active states should be handled via onMouseDown/onMouseUp
    }),

    disabled: (baseStyles: CSSProperties): CSSProperties => ({
      ...baseStyles,
      ...semanticTokens.interactive.disabled,
      backgroundColor: theme.colors.background.tertiary,
      color: semanticTokens.text.muted,
    }),
  },

  // Input/Form styles
  input: {
    base: (): CSSProperties => ({
      width: '100%',
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      borderRadius: theme.borderRadius.md,
      border: `2px solid ${semanticTokens.border.default}`,
      fontSize: theme.typography.sizes.base,
      backgroundColor: semanticTokens.surface.primary,
      color: semanticTokens.text.primary,
      transition: semanticTokens.animation.transition.colors,
      outline: 'none',
    }),

    focused: (): CSSProperties => ({
      borderColor: semanticTokens.border.focus,
      boxShadow: `0 0 0 3px ${theme.colors.primary.light}`,
    }),

    error: (): CSSProperties => ({
      borderColor: semanticTokens.border.error,
      boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`,
    }),

    success: (): CSSProperties => ({
      borderColor: semanticTokens.border.success,
      boxShadow: `0 0 0 3px rgba(16, 185, 129, 0.1)`,
    }),
  },

  // Layout patterns
  layout: {
    flexCenter: (): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),

    flexBetween: (): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),

    flexColumn: (gap?: keyof typeof semanticTokens.layout.gap): CSSProperties => ({
      display: 'flex',
      flexDirection: 'column',
      ...(gap && { gap: semanticTokens.layout.gap[gap] }),
    }),

    flexRow: (gap?: keyof typeof semanticTokens.layout.gap): CSSProperties => ({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      ...(gap && { gap: semanticTokens.layout.gap[gap] }),
    }),

    container: (size: keyof typeof semanticTokens.layout.container = 'lg'): CSSProperties => ({
      width: '100%',
      maxWidth: semanticTokens.layout.container[size],
      margin: '0 auto',
      padding: `0 ${theme.spacing.lg}`,
    }),

    glassMorphism: (): CSSProperties => ({
      backgroundColor: semanticTokens.surface.elevated,
      backdropFilter: theme.effects.blur,
      border: `1px solid ${theme.colors.surface.glassBorder}`,
      borderRadius: theme.borderRadius.xl,
    }),
  },

  // Animation patterns
  animation: {
    fadeIn: (): CSSProperties => ({
      opacity: 1,
      transition: semanticTokens.animation.transition.opacity,
    }),

    slideUp: (): CSSProperties => ({
      transform: 'translateY(0)',
      transition: semanticTokens.animation.transition.transform,
    }),

    scaleIn: (): CSSProperties => ({
      transform: 'scale(1)',
      transition: semanticTokens.animation.transition.transform,
    }),

    bounce: (): CSSProperties => ({
      animation: 'bounce 0.5s ease-in-out',
    }),
  },

  // State-based styles
  state: {
    loading: (): CSSProperties => ({
      opacity: 0.7,
      pointerEvents: 'none',
      cursor: 'not-allowed',
    }),

    disabled: (): CSSProperties => ({
      ...semanticTokens.interactive.disabled,
    }),

    selected: (accentColor: string): CSSProperties => ({
      backgroundColor: `${accentColor}08`,
      borderColor: `${accentColor}44`,
      boxShadow: `0 0 0 1px ${accentColor}22`,
    }),

    error: (): CSSProperties => ({
      borderColor: semanticTokens.border.error,
      backgroundColor: `${theme.colors.status.error.light}08`,
    }),

    success: (): CSSProperties => ({
      borderColor: semanticTokens.border.success,
      backgroundColor: `${theme.colors.status.success.light}08`,
    }),
  },

  // Typography patterns
  typography: {
    heading: (level: 1 | 2 | 3 | 4 | 5 | 6 = 2): CSSProperties => {
      const sizes = {
        1: semanticTokens.text.size['3xl'],
        2: semanticTokens.text.size['2xl'],
        3: semanticTokens.text.size.xl,
        4: semanticTokens.text.size.lg,
        5: semanticTokens.text.size.base,
        6: semanticTokens.text.size.sm,
      };
      return {
        ...sizes[level],
        fontWeight: theme.typography.weights.bold,
        color: semanticTokens.text.primary,
        margin: 0,
      };
    },

    body: (variant: 'primary' | 'secondary' | 'muted' = 'primary'): CSSProperties => ({
      ...semanticTokens.text.size.base,
      color: semanticTokens.text[variant],
      margin: 0,
    }),

    caption: (): CSSProperties => ({
      ...semanticTokens.text.size.sm,
      color: semanticTokens.text.muted,
      margin: 0,
    }),

    gradient: (): CSSProperties => ({
      background: theme.colors.primary.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }),
  },
} as const;

// Helper function to merge styles safely
export const mergeStyles = (...styles: (CSSProperties | undefined)[]): CSSProperties => {
  return styles.reduce<CSSProperties>((acc, style) => {
    if (style) {
      return { ...acc, ...style };
    }
    return acc;
  }, {});
};

// Note: Responsive styles should be handled by CSS-in-JS libraries or media query hooks
// This functionality is not included in this version to avoid TypeScript conflicts