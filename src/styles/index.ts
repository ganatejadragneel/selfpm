// Unified Styling System - Phase 5 DRY Refactoring
// Single entry point for all styling utilities, tokens, and compositions

// Re-export everything from existing theme system
export { theme, styleUtils, categoryConfigs, priorityConfigs, buttonVariants } from './theme';

// New Phase 5 styling system
export { semanticTokens } from './designTokens';
export { styleCompositions, mergeStyles } from './styleCompositions';
export {
  keyframes,
  animations,
  transitions,
  motionPresets,
  createStaggerAnimation,
  respectsReducedMotion,
  injectGlobalAnimations
} from './animations';

// Enhanced style creation helpers
import { styleCompositions, mergeStyles } from './styleCompositions';
import { semanticTokens } from './designTokens';
import { motionPresets, respectsReducedMotion } from './animations';
import type { CSSProperties } from 'react';

// High-level style builders that combine multiple patterns
export const createComponentStyles = {
  // Card component variations
  card: {
    default: (interactive = false): CSSProperties =>
      respectsReducedMotion(
        mergeStyles(
          styleCompositions.card.elevated('sm'),
          interactive ? motionPresets.card.default() : undefined
        )
      ),

    interactive: (_accentColor?: string): CSSProperties =>
      respectsReducedMotion(
        mergeStyles(
          styleCompositions.card.elevated('md'),
          motionPresets.card.default()
          // Hover states for accent colors should be handled via event handlers
        )
      ),

    draggable: (isDragging: boolean, accentColor?: string): CSSProperties =>
      respectsReducedMotion(
        styleCompositions.card.draggable(isDragging, accentColor)
      ),
  },

  // Button component variations
  button: {
    primary: (size: 'sm' | 'md' | 'lg' = 'md', disabled = false): CSSProperties => {
      const sizeStyles = {
        sm: { padding: `${semanticTokens.layout.gap.sm} ${semanticTokens.layout.gap.md}`, fontSize: '14px' },
        md: { padding: `${semanticTokens.layout.gap.md} ${semanticTokens.layout.gap.xl}`, fontSize: '16px' },
        lg: { padding: `${semanticTokens.layout.gap.lg} ${semanticTokens.layout.gap['2xl']}`, fontSize: '18px' },
      };

      return respectsReducedMotion(
        mergeStyles(
          styleCompositions.button.primary(),
          sizeStyles[size],
          motionPresets.button.primary(),
          disabled ? styleCompositions.button.disabled(styleCompositions.button.primary()) : undefined
        )
      );
    },

    secondary: (size: 'sm' | 'md' | 'lg' = 'md', disabled = false): CSSProperties => {
      const sizeStyles = {
        sm: { padding: `${semanticTokens.layout.gap.sm} ${semanticTokens.layout.gap.md}`, fontSize: '14px' },
        md: { padding: `${semanticTokens.layout.gap.md} ${semanticTokens.layout.gap.xl}`, fontSize: '16px' },
        lg: { padding: `${semanticTokens.layout.gap.lg} ${semanticTokens.layout.gap['2xl']}`, fontSize: '18px' },
      };

      return respectsReducedMotion(
        mergeStyles(
          styleCompositions.button.secondary(),
          sizeStyles[size],
          motionPresets.button.secondary(),
          disabled ? styleCompositions.button.disabled(styleCompositions.button.secondary()) : undefined
        )
      );
    },

    ghost: (size: 'sm' | 'md' | 'lg' = 'md', disabled = false): CSSProperties => {
      const sizeStyles = {
        sm: { padding: `${semanticTokens.layout.gap.sm} ${semanticTokens.layout.gap.md}`, fontSize: '14px' },
        md: { padding: `${semanticTokens.layout.gap.md} ${semanticTokens.layout.gap.lg}`, fontSize: '16px' },
        lg: { padding: `${semanticTokens.layout.gap.lg} ${semanticTokens.layout.gap.xl}`, fontSize: '18px' },
      };

      return respectsReducedMotion(
        mergeStyles(
          styleCompositions.button.ghost(),
          sizeStyles[size],
          motionPresets.button.ghost(),
          disabled ? styleCompositions.button.disabled(styleCompositions.button.ghost()) : undefined
        )
      );
    },

    icon: (size: 'sm' | 'md' | 'lg' = 'md', variant: 'default' | 'primary' | 'secondary' = 'default'): CSSProperties => {
      const baseIcon = styleCompositions.button.icon(size);
      const variantStyles = {
        default: {},
        primary: { backgroundColor: semanticTokens.surface.primary, border: `1px solid ${semanticTokens.border.default}` },
        secondary: { backgroundColor: 'rgba(102, 126, 234, 0.1)', color: semanticTokens.text.primary },
      };

      return respectsReducedMotion(
        mergeStyles(
          baseIcon,
          variantStyles[variant],
          motionPresets.button.ghost()
        )
      );
    },
  },

  // Input component variations
  input: {
    default: (state: 'default' | 'focused' | 'error' | 'success' | 'disabled' = 'default'): CSSProperties => {
      const stateStyles = {
        default: {},
        focused: styleCompositions.input.focused(),
        error: styleCompositions.input.error(),
        success: styleCompositions.input.success(),
        disabled: styleCompositions.state.disabled(),
      };

      return mergeStyles(
        styleCompositions.input.base(),
        stateStyles[state]
      );
    },
  },

  // Layout component variations
  layout: {
    container: (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg'): CSSProperties =>
      styleCompositions.layout.container(size),

    flexCenter: (): CSSProperties =>
      styleCompositions.layout.flexCenter(),

    flexBetween: (): CSSProperties =>
      styleCompositions.layout.flexBetween(),

    flexColumn: (gap: keyof typeof semanticTokens.layout.gap = 'md'): CSSProperties =>
      styleCompositions.layout.flexColumn(gap),

    flexRow: (gap: keyof typeof semanticTokens.layout.gap = 'md'): CSSProperties =>
      styleCompositions.layout.flexRow(gap),

    glassMorphism: (): CSSProperties =>
      styleCompositions.layout.glassMorphism(),
  },

  // Typography component variations
  text: {
    heading: (level: 1 | 2 | 3 | 4 | 5 | 6 = 2, gradient = false): CSSProperties =>
      mergeStyles(
        styleCompositions.typography.heading(level),
        gradient ? styleCompositions.typography.gradient() : undefined
      ),

    body: (variant: 'primary' | 'secondary' | 'muted' = 'primary'): CSSProperties =>
      styleCompositions.typography.body(variant),

    caption: (): CSSProperties =>
      styleCompositions.typography.caption(),
  },
};

// Convenience hooks for React components
export const useStyleSystem = () => {
  return {
    tokens: semanticTokens,
    compositions: styleCompositions,
    components: createComponentStyles,
    animations: motionPresets,
    utils: {
      merge: mergeStyles,
      respectsMotion: respectsReducedMotion,
    },
  };
};

// CSS custom properties generator for CSS-based styling
export const generateCSSCustomProperties = (): Record<string, string> => {
  const cssVars: Record<string, string> = {};

  // Convert semantic tokens to CSS custom properties
  Object.entries(semanticTokens).forEach(([category, tokens]) => {
    if (typeof tokens === 'object') {
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          cssVars[`--${category}-${key}`] = value;
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'string') {
              cssVars[`--${category}-${key}-${subKey}`] = subValue;
            }
          });
        }
      });
    }
  });

  return cssVars;
};

// Type definitions for enhanced type safety
export type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentState = 'default' | 'hover' | 'active' | 'focused' | 'disabled' | 'loading';
export type ElevationLevel = 'none' | 'sm' | 'md' | 'lg';
export type AnimationType = 'none' | 'subtle' | 'moderate' | 'pronounced';

// Style system configuration
export const STYLE_SYSTEM_CONFIG = {
  version: '5.0.0',
  breakpoints: semanticTokens.layout.container,
  defaultTransition: semanticTokens.animation.transition.default,
  respectsReducedMotion: true,
  features: {
    semanticTokens: true,
    composedStyles: true,
    animations: true,
    responsive: true,
    accessibility: true,
  },
} as const;