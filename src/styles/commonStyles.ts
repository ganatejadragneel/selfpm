/**
 * Common Styles - Reusable style objects composed from design tokens
 * Following DRY principle: Reusable style compositions
 */

import { colors, spacing, borderRadius, shadows, typography, effects } from './designTokens';
import type { CSSProperties } from 'react';

// Button styles
export const buttonStyles = {
  base: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.lg,
    border: 'none',
    cursor: 'pointer',
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  } as CSSProperties,
  
  primary: {
    background: colors.primary.gradient,
    color: colors.neutral.white,
    boxShadow: shadows.brand,
  } as CSSProperties,
  
  secondary: {
    background: colors.primary.ultraLight,
    color: colors.primary.solid,
    border: `1px solid ${colors.primary.solid}`,
  } as CSSProperties,
  
  ghost: {
    background: 'transparent',
    color: colors.primary.solid,
  } as CSSProperties,
  
  icon: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    background: colors.primary.ultraLight,
    color: colors.primary.solid,
  } as CSSProperties,
} as const;

// Card styles
export const cardStyles = {
  base: {
    background: colors.neutral.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    boxShadow: shadows.md,
    border: '1px solid rgba(0, 0, 0, 0.05)',
  } as CSSProperties,
  
  glass: {
    background: colors.light.surface.glass,
    backdropFilter: effects.blur,
    WebkitBackdropFilter: effects.blur,
    border: `1px solid ${colors.light.surface.glassBorder}`,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  } as CSSProperties,
  
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: shadows.lg,
  } as CSSProperties,
} as const;

// Modal styles
export const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: effects.blurSm,
    WebkitBackdropFilter: effects.blurSm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: spacing.lg,
  } as CSSProperties,
  
  container: {
    background: colors.neutral.white,
    borderRadius: borderRadius['2xl'],
    boxShadow: shadows['2xl'],
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  } as CSSProperties,
  
  header: {
    padding: `${spacing.xl} ${spacing['2xl']}`,
    borderBottom: `1px solid ${colors.neutral.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as CSSProperties,
  
  body: {
    padding: spacing['2xl'],
    overflowY: 'auto' as const,
    flex: 1,
  } as CSSProperties,
  
  footer: {
    padding: `${spacing.lg} ${spacing['2xl']}`,
    borderTop: `1px solid ${colors.neutral.gray[200]}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.md,
  } as CSSProperties,
} as const;

// Form styles
export const formStyles = {
  field: {
    marginBottom: spacing.lg,
  } as CSSProperties,
  
  label: {
    display: 'block',
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral.gray[700],
  } as CSSProperties,
  
  input: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.neutral.gray[300]}`,
    fontSize: typography.fontSize.md,
    transition: 'border-color 0.2s ease',
    outline: 'none',
  } as CSSProperties,
  
  inputFocus: {
    borderColor: colors.primary.solid,
    boxShadow: `0 0 0 3px ${colors.primary.ultraLight}`,
  } as CSSProperties,
  
  textarea: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.neutral.gray[300]}`,
    fontSize: typography.fontSize.md,
    resize: 'vertical' as const,
    minHeight: '100px',
    fontFamily: typography.fontFamily.sans,
  } as CSSProperties,
  
  error: {
    color: colors.semantic.error,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  } as CSSProperties,
} as const;

// Layout styles
export const layoutStyles = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `0 ${spacing.lg}`,
  } as CSSProperties,
  
  header: {
    background: colors.light.surface.glass,
    backdropFilter: effects.blur,
    WebkitBackdropFilter: effects.blur,
    borderBottom: `1px solid ${colors.light.surface.glassBorder}`,
    boxShadow: shadows.md,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  } as CSSProperties,
  
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as CSSProperties,
  
  grid: {
    display: 'grid',
    gap: spacing.lg,
  } as CSSProperties,
} as const;

// Status styles
export const statusStyles = {
  badge: {
    base: {
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.xs,
    } as CSSProperties,
    
    todo: {
      background: `${colors.status.todo}20`,
      color: colors.status.todo,
    } as CSSProperties,
    
    inProgress: {
      background: `${colors.status.inProgress}20`,
      color: colors.status.inProgress,
    } as CSSProperties,
    
    done: {
      background: `${colors.status.done}20`,
      color: colors.status.done,
    } as CSSProperties,
    
    blocked: {
      background: `${colors.status.blocked}20`,
      color: colors.status.blocked,
    } as CSSProperties,
  },
} as const;

// Gradient text style helper
export const gradientText = {
  background: colors.primary.gradient,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
} as CSSProperties;

// Glass morphism style
export const glassMorphism = {
  background: colors.light.surface.glass,
  backdropFilter: effects.blur,
  WebkitBackdropFilter: effects.blur,
  border: `1px solid ${colors.light.surface.glassBorder}`,
} as CSSProperties;

// Hover effects
export const hoverEffects = {
  lift: {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: shadows.lg,
    },
  } as CSSProperties,
  
  scale: {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  } as CSSProperties,
  
  glow: {
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: shadows.brand,
    },
  } as CSSProperties,
} as const;

// Responsive helpers
export const responsive = {
  hideMobile: {
    '@media (max-width: 768px)': {
      display: 'none',
    },
  } as CSSProperties,
  
  hideDesktop: {
    '@media (min-width: 769px)': {
      display: 'none',
    },
  } as CSSProperties,
  
  stackMobile: {
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  } as CSSProperties,
} as const;