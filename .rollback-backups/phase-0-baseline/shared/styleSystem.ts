// Shared Style System - Phase 7C DRY Refactoring
// LAYOUT-SAFE: Uses exact same values as existing components to prevent layout changes

import { theme } from '../theme';

// Size mappings - Extracted exact values from existing components
export const sizeMappings = {
  // LoadingSpinner sizes (src/components/ui/LoadingSpinner.tsx:12-17)
  spinner: {
    sm: { width: '16px', height: '16px', borderWidth: '2px' },
    md: { width: '32px', height: '32px', borderWidth: '3px' },
    lg: { width: '48px', height: '48px', borderWidth: '4px' },
    xl: { width: '64px', height: '64px', borderWidth: '5px' },
  },

  // Input sizes (src/components/ui/Input.tsx:14-18)
  input: {
    sm: { padding: '8px 12px', fontSize: theme.typography.sizes.sm },
    md: { padding: '12px 16px', fontSize: theme.typography.sizes.base },
    lg: { padding: '16px 20px', fontSize: theme.typography.sizes.lg },
  },

  // Generic size utilities for new components
  generic: {
    sm: { padding: '8px 12px', fontSize: theme.typography.sizes.sm, height: '32px' },
    md: { padding: '12px 16px', fontSize: theme.typography.sizes.base, height: '40px' },
    lg: { padding: '16px 20px', fontSize: theme.typography.sizes.lg, height: '48px' },
    xl: { padding: '20px 24px', fontSize: theme.typography.sizes.xl, height: '56px' },
  }
};

// Spacing mappings - Extracted from ActionButtonGroup.tsx:21-25
export const spacingMappings = {
  compact: theme.spacing.xs,
  normal: theme.spacing.md,
  spacious: theme.spacing.lg,
};

// Elevation mappings - Extracted from CardLayout.tsx:19-24
export const elevationMappings = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
};

// Modal size mappings - Extracted from compound/ModalLayout.tsx:14-19
export const modalSizeMappings = {
  sm: '400px',
  md: '500px',
  lg: '600px',
  xl: '800px',
};

// Utility functions for getting style values (safe to use)
export const getSize = (component: keyof typeof sizeMappings, size: string) => {
  return sizeMappings[component]?.[size as keyof typeof sizeMappings[typeof component]];
};

export const getSpacing = (spacing: keyof typeof spacingMappings) => {
  return spacingMappings[spacing];
};

export const getElevation = (elevation: keyof typeof elevationMappings) => {
  return elevationMappings[elevation];
};

export const getModalSize = (size: keyof typeof modalSizeMappings) => {
  return modalSizeMappings[size];
};

// Variant style generators (common patterns)
export const createVariantStyles = <T extends Record<string, any>>(
  baseStyles: React.CSSProperties,
  variants: T
) => (variant: keyof T): React.CSSProperties => ({
  ...baseStyles,
  ...variants[variant]
});

// Focus/hover state utilities
export const focusStyles: React.CSSProperties = {
  outline: `2px solid ${theme.colors.primary.dark}`,
  outlineOffset: '2px'
};

export const hoverStyles: React.CSSProperties = {
  transform: 'translateY(-1px)',
  transition: 'transform 0.2s ease'
};

// Container utilities
export const containerStyles = {
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,

  spaceBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  } as React.CSSProperties,

  column: {
    display: 'flex',
    flexDirection: 'column'
  } as React.CSSProperties,

  columnCentered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties
};

// Animation utilities
export const animations = {
  fadeIn: {
    animation: 'fadeIn 0.2s ease-in-out'
  } as React.CSSProperties,

  slideIn: {
    animation: 'slideIn 0.3s ease-out'
  } as React.CSSProperties,

  pulse: {
    animation: 'pulse 2s infinite'
  } as React.CSSProperties
};

// Responsive utilities
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};

// Export all utilities as a single system object
export const styleSystem = {
  sizes: sizeMappings,
  spacing: spacingMappings,
  elevations: elevationMappings,
  modalSizes: modalSizeMappings,
  getSize,
  getSpacing,
  getElevation,
  getModalSize,
  createVariantStyles,
  focus: focusStyles,
  hover: hoverStyles,
  containers: containerStyles,
  animations,
  breakpoints
};