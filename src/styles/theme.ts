// Design System - Centralized theme following DRY principles
export const theme = {
  colors: {
    primary: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      light: 'rgba(102, 126, 234, 0.1)',
      medium: 'rgba(102, 126, 234, 0.2)',
      dark: '#667eea',
    },
    surface: {
      glass: 'rgba(255, 255, 255, 0.95)',
      glassBorder: 'rgba(255, 255, 255, 0.3)',
      white: 'white',
    },
    status: {
      success: {
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        light: 'rgba(16, 185, 129, 0.1)',
        medium: 'rgba(16, 185, 129, 0.2)',
        dark: '#10b981',
      },
      info: {
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        light: 'rgba(59, 130, 246, 0.1)',
        medium: 'rgba(59, 130, 246, 0.2)',
        dark: '#3b82f6',
      },
      warning: {
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        light: 'rgba(245, 158, 11, 0.1)',
        medium: 'rgba(245, 158, 11, 0.2)',
        dark: '#f59e0b',
      },
      error: {
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        light: 'rgba(239, 68, 68, 0.1)',
        medium: 'rgba(239, 68, 68, 0.2)',
        dark: '#ef4444',
      },
      purple: {
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        light: 'rgba(139, 92, 246, 0.1)',
        medium: 'rgba(139, 92, 246, 0.2)',
        dark: '#8b5cf6',
      },
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
    },
  },
  
  effects: {
    blur: 'blur(10px)',
    shadow: {
      sm: '0 2px 16px rgba(0, 0, 0, 0.04)',
      md: '0 8px 32px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 40px rgba(0, 0, 0, 0.1)',
      xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '48px',
  },
  
  typography: {
    sizes: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '15px',
      xl: '16px',
      '2xl': '18px',
      '3xl': '20px',
      '4xl': '24px',
      '5xl': '28px',
      '6xl': '48px',
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const;

// Category-specific configurations following Single Responsibility Principle
export const categoryConfigs = {
  life_admin: {
    title: 'Life Admin',
    emoji: '🏠',
    gradient: theme.colors.status.info.gradient,
    bgGradient: `linear-gradient(135deg, ${theme.colors.status.info.light} 0%, rgba(29, 78, 216, 0.02) 100%)`,
    borderColor: theme.colors.status.info.medium,
    accentColor: theme.colors.status.info.dark,
  },
  work: {
    title: 'Work Tasks',
    emoji: '💼',
    gradient: theme.colors.status.success.gradient,
    bgGradient: `linear-gradient(135deg, ${theme.colors.status.success.light} 0%, rgba(5, 150, 105, 0.02) 100%)`,
    borderColor: theme.colors.status.success.medium,
    accentColor: theme.colors.status.success.dark,
  },
  weekly_recurring: {
    title: 'Weekly Tasks',
    emoji: '🔄',
    gradient: theme.colors.status.purple.gradient,
    bgGradient: `linear-gradient(135deg, ${theme.colors.status.purple.light} 0%, rgba(124, 58, 237, 0.02) 100%)`,
    borderColor: theme.colors.status.purple.medium,
    accentColor: theme.colors.status.purple.dark,
  },
} as const;

// Common style generators following DRY principle
export const styleUtils = {
  glassCard: (borderColor?: string) => ({
    background: theme.colors.surface.glass,
    backdropFilter: theme.effects.blur,
    borderRadius: theme.borderRadius.xl,
    border: `1px solid ${borderColor || theme.colors.surface.glassBorder}`,
    boxShadow: theme.effects.shadow.md,
  }),
  
  button: {
    primary: () => ({
      background: theme.colors.primary.gradient,
      color: 'white',
      border: 'none',
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: `0 4px 15px ${theme.colors.primary.dark}33`,
    }),
    
    secondary: () => ({
      border: `2px solid ${theme.colors.border.light}`,
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.surface.white,
      borderRadius: theme.borderRadius.md,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    
    icon: () => ({
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    }),
  },
  
  input: () => ({
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    border: `2px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    fontSize: theme.typography.sizes.base,
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: theme.colors.surface.white,
  }),
  
  gradientText: () => ({
    background: theme.colors.primary.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }),
};

// Priority-specific configurations
export const priorityConfigs = {
  low: {
    title: 'Low Priority',
    color: '#9ca3af',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
    icon: '🟢'
  },
  medium: {
    title: 'Medium Priority', 
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    icon: '🟡'
  },
  high: {
    title: 'High Priority',
    color: '#ef4444', 
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    icon: '🟠'
  },
  urgent: {
    title: 'Extreme Priority',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.2)', 
    borderColor: 'rgba(220, 38, 38, 0.5)',
    icon: '🔴'
  }
} as const;