/**
 * useStyles Hook - Composable styles with theme awareness
 * Following SOLID principles: Single responsibility for style composition
 */

import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { colors, spacing, typography, shadows, borderRadius, effects } from '../styles/designTokens';
import { combineStyles, conditionalStyle } from '../styles/styleUtils';
import type { CSSProperties } from 'react';

interface StyleOptions {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  active?: boolean;
}

/**
 * Main hook for composing styles with theme awareness
 */
export function useStyles() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const themedColors = useMemo(() => {
    return isDark ? colors.dark : colors.light;
  }, [isDark]);
  
  /**
   * Get button styles based on variant and options
   */
  const getButtonStyles = (options: StyleOptions = {}): CSSProperties => {
    const { variant = 'primary', size = 'md', fullWidth, disabled } = options;
    
    const baseStyles: CSSProperties = {
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: typography.fontWeight.semibold,
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : 'auto',
    };
    
    const sizeStyles = {
      sm: {
        padding: `${spacing.xs} ${spacing.md}`,
        fontSize: typography.fontSize.sm,
        borderRadius: borderRadius.md,
      },
      md: {
        padding: `${spacing.sm} ${spacing.lg}`,
        fontSize: typography.fontSize.md,
        borderRadius: borderRadius.lg,
      },
      lg: {
        padding: `${spacing.md} ${spacing.xl}`,
        fontSize: typography.fontSize.lg,
        borderRadius: borderRadius.xl,
      },
    };
    
    const variantStyles = {
      primary: {
        background: colors.primary.gradient,
        color: colors.neutral.white,
        boxShadow: shadows.brand,
      },
      secondary: {
        background: isDark ? colors.dark.surface.glass : colors.primary.ultraLight,
        color: colors.primary.solid,
        border: `1px solid ${colors.primary.solid}`,
      },
      ghost: {
        background: 'transparent',
        color: isDark ? themedColors.text.primary : colors.primary.solid,
      },
      danger: {
        background: colors.semantic.error,
        color: colors.neutral.white,
      },
    };
    
    return combineStyles(
      baseStyles,
      sizeStyles[size],
      variantStyles[variant]
    );
  };
  
  /**
   * Get card styles with theme awareness
   */
  const getCardStyles = (elevated: boolean = false): CSSProperties => {
    return {
      background: isDark ? colors.dark.surface.glass : colors.neutral.white,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      boxShadow: elevated ? shadows.lg : shadows.md,
      border: `1px solid ${isDark ? colors.dark.surface.glassBorder : 'rgba(0, 0, 0, 0.05)'}`,
      ...(isDark && {
        backdropFilter: effects.blur,
        WebkitBackdropFilter: effects.blur,
      }),
    };
  };
  
  /**
   * Get modal overlay styles
   */
  const getModalOverlayStyles = (): CSSProperties => {
    return {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: effects.blurSm,
      WebkitBackdropFilter: effects.blurSm,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: spacing.lg,
    };
  };
  
  /**
   * Get modal container styles
   */
  const getModalContainerStyles = (): CSSProperties => {
    return {
      background: isDark ? colors.dark.background.secondary : colors.neutral.white,
      borderRadius: borderRadius['2xl'],
      boxShadow: shadows['2xl'],
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...(isDark && {
        border: `1px solid ${colors.dark.surface.glassBorder}`,
      }),
    };
  };
  
  /**
   * Get input styles with theme awareness
   */
  const getInputStyles = (error?: boolean): CSSProperties => {
    return {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      border: `1px solid ${error ? colors.semantic.error : isDark ? colors.dark.surface.glassBorder : colors.neutral.gray[300]}`,
      fontSize: typography.fontSize.md,
      transition: 'border-color 0.2s ease',
      outline: 'none',
      background: isDark ? colors.dark.surface.glass : colors.neutral.white,
      color: themedColors.text.primary,
    };
  };
  
  /**
   * Get status badge styles
   */
  const getStatusBadgeStyles = (status: 'todo' | 'in_progress' | 'done' | 'blocked'): CSSProperties => {
    const statusColorMap = {
      todo: colors.status.todo,
      in_progress: colors.status.inProgress,
      done: colors.status.done,
      blocked: colors.status.blocked,
    };
    
    const color = statusColorMap[status];
    
    return {
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: `${color}20`,
      color: color,
    };
  };
  
  /**
   * Get header styles
   */
  const getHeaderStyles = (): CSSProperties => {
    return {
      background: isDark ? colors.dark.surface.glass : colors.light.surface.glass,
      backdropFilter: effects.blur,
      WebkitBackdropFilter: effects.blur,
      borderBottom: `1px solid ${isDark ? colors.dark.surface.glassBorder : colors.light.surface.glassBorder}`,
      boxShadow: shadows.md,
      position: 'relative',
      zIndex: 100,
    };
  };
  
  /**
   * Get gradient text styles
   */
  const getGradientTextStyles = (): CSSProperties => {
    return {
      background: colors.primary.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    };
  };
  
  /**
   * Get glass morphism styles
   */
  const getGlassStyles = (): CSSProperties => {
    return {
      background: themedColors.surface.glass,
      backdropFilter: effects.blur,
      WebkitBackdropFilter: effects.blur,
      border: `1px solid ${themedColors.surface.glassBorder}`,
    };
  };
  
  /**
   * Compose multiple styles with conditions
   */
  const compose = (...styles: (CSSProperties | undefined | false)[]): CSSProperties => {
    return combineStyles(...styles.filter(Boolean) as CSSProperties[]);
  };
  
  return {
    // Theme info
    theme,
    isDark,
    colors: themedColors,
    
    // Style generators
    getButtonStyles,
    getCardStyles,
    getModalOverlayStyles,
    getModalContainerStyles,
    getInputStyles,
    getStatusBadgeStyles,
    getHeaderStyles,
    getGradientTextStyles,
    getGlassStyles,
    
    // Utility
    compose,
    conditionalStyle,
    
    // Direct access to tokens
    spacing,
    typography,
    shadows,
    borderRadius,
    effects,
  };
}

/**
 * Hook for responsive styles
 */
export function useResponsiveStyles() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const getResponsiveValue = <T,>(mobile: T, tablet?: T, desktop?: T): T => {
    if (isDesktop && desktop !== undefined) return desktop;
    if (isTablet && tablet !== undefined) return tablet;
    return mobile;
  };
  
  const getResponsiveStyles = (
    mobile: CSSProperties,
    tablet?: CSSProperties,
    desktop?: CSSProperties
  ): CSSProperties => {
    if (isDesktop && desktop) return { ...mobile, ...tablet, ...desktop };
    if (isTablet && tablet) return { ...mobile, ...tablet };
    return mobile;
  };
  
  return {
    getResponsiveValue,
    getResponsiveStyles,
    isMobile,
    isTablet,
    isDesktop,
  };
}

// Helper hook import (assuming it exists)
import { useResponsive } from './useResponsive';