/**
 * Design Tokens - Central source of truth for all design values
 * Following SOLID principles: Single source of truth for design values
 */

export const colors = {
  // Primary brand colors
  primary: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    solid: '#667eea',
    dark: '#764ba2',
    light: '#8b9dc3',
    ultraLight: 'rgba(102, 126, 234, 0.1)',
    glassLight: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  },
  
  // Status colors
  status: {
    todo: '#6b7280',
    inProgress: '#3b82f6',
    done: '#10b981',
    blocked: '#ef4444',
    warning: '#f59e0b',
  },
  
  // Priority colors
  priority: {
    critical: {
      bg: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#dc2626',
    },
    high: {
      bg: 'rgba(251, 146, 60, 0.1)',
      border: 'rgba(251, 146, 60, 0.3)',
      text: '#ea580c',
    },
    medium: {
      bg: 'rgba(250, 204, 21, 0.1)',
      border: 'rgba(250, 204, 21, 0.3)',
      text: '#ca8a04',
    },
    low: {
      bg: 'rgba(34, 197, 94, 0.1)',
      border: 'rgba(34, 197, 94, 0.3)',
      text: '#16a34a',
    },
  },
  
  // Neutral colors
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  
  // Semantic colors
  semantic: {
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  // Dark mode specific
  dark: {
    background: {
      primary: '#0f0f1a',
      secondary: '#1a1a2e',
      elevated: 'rgba(255, 255, 255, 0.05)',
    },
    surface: {
      glass: 'rgba(255, 255, 255, 0.05)',
      glassBorder: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
      muted: '#6b7280',
    },
  },
  
  // Light mode specific
  light: {
    background: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: '#f9fafb',
      elevated: 'rgba(255, 255, 255, 0.95)',
    },
    surface: {
      glass: 'rgba(255, 255, 255, 0.1)',
      glassBorder: 'rgba(255, 255, 255, 0.2)',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
  '5xl': '64px',
} as const;

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
    '5xl': '32px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  brand: '0 4px 15px rgba(102, 126, 234, 0.4)',
  brandLg: '0 8px 32px rgba(102, 126, 234, 0.3)',
  glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
} as const;

export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  slower: '500ms ease-in-out',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 50,
  overlay: 100,
  modal: 200,
  popover: 300,
  toast: 400,
  tooltip: 500,
} as const;

export const effects = {
  blur: 'blur(10px)',
  blurSm: 'blur(4px)',
  blurLg: 'blur(20px)',
  glassMorphism: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
} as const;