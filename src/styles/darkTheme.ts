// Dark Theme - Full dark mode transformation with deep colors
export const darkTheme = {
  colors: {
    primary: {
      gradient: 'linear-gradient(135deg, #4c7ce0 0%, #6b5b95 100%)', // Muted blue-purple for dark mode
      light: 'rgba(76, 124, 224, 0.08)',
      medium: 'rgba(76, 124, 224, 0.15)',
      dark: '#4c7ce0',
    },
    surface: {
      glass: 'rgba(28, 33, 39, 0.95)', // Very dark grey glass
      glassBorder: 'rgba(55, 65, 81, 0.4)', // Dark grey border
      white: '#1c2127', // Dark grey for all cards/surfaces
    },
    background: {
      primary: '#0d1117', // Very dark blue-black background
      secondary: '#161b22', // Slightly lighter dark
      tertiary: '#21262d', // Even lighter for elevation
    },
    status: {
      success: {
        gradient: 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
        light: 'rgba(46, 160, 67, 0.08)',
        medium: 'rgba(46, 160, 67, 0.15)',
        dark: '#2ea043',
      },
      info: {
        gradient: 'linear-gradient(135deg, #388bfd 0%, #1f6feb 100%)',
        light: 'rgba(56, 139, 253, 0.08)',
        medium: 'rgba(56, 139, 253, 0.15)',
        dark: '#388bfd',
      },
      warning: {
        gradient: 'linear-gradient(135deg, #e3b341 0%, #bb8009 100%)',
        light: 'rgba(227, 179, 65, 0.08)',
        medium: 'rgba(227, 179, 65, 0.15)',
        dark: '#e3b341',
      },
      error: {
        gradient: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
        light: 'rgba(248, 81, 73, 0.08)',
        medium: 'rgba(248, 81, 73, 0.15)',
        dark: '#f85149',
      },
      purple: {
        gradient: 'linear-gradient(135deg, #a371f7 0%, #8957e5 100%)',
        light: 'rgba(163, 113, 247, 0.08)',
        medium: 'rgba(163, 113, 247, 0.15)',
        dark: '#a371f7',
      },
    },
    text: {
      primary: '#e6edf3', // Light grey-white for primary text
      secondary: '#8b949e', // Medium grey for secondary
      muted: '#6e7681', // Darker grey for muted
    },
    border: {
      light: 'rgba(48, 54, 61, 0.6)', // Dark border
      medium: 'rgba(55, 65, 81, 0.8)', // Slightly lighter border
    },
  },
  
  effects: {
    blur: 'blur(16px)',
    shadow: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.24)',
      md: '0 4px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.12)',
      lg: '0 10px 20px rgba(0, 0, 0, 0.25), 0 6px 6px rgba(0, 0, 0, 0.22)',
      xl: '0 15px 35px rgba(0, 0, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2)',
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

// Dark mode category configurations
export const darkCategoryConfigs = {
  life_admin: {
    title: 'Life Admin',
    emoji: '🏠',
    gradient: 'linear-gradient(135deg, #1f6feb 0%, #0969da 100%)',
    bgGradient: 'linear-gradient(135deg, rgba(31, 111, 235, 0.05) 0%, rgba(9, 105, 218, 0.02) 100%)',
    borderColor: 'rgba(31, 111, 235, 0.2)',
    accentColor: '#388bfd',
  },
  work: {
    title: 'Work Tasks',
    emoji: '💼',
    gradient: 'linear-gradient(135deg, #238636 0%, #196c2e 100%)',
    bgGradient: 'linear-gradient(135deg, rgba(35, 134, 54, 0.05) 0%, rgba(25, 108, 46, 0.02) 100%)',
    borderColor: 'rgba(35, 134, 54, 0.2)',
    accentColor: '#2ea043',
  },
  weekly_recurring: {
    title: 'Weekly Tasks',
    emoji: '🔄',
    gradient: 'linear-gradient(135deg, #8957e5 0%, #6639ba 100%)',
    bgGradient: 'linear-gradient(135deg, rgba(137, 87, 229, 0.05) 0%, rgba(102, 57, 186, 0.02) 100%)',
    borderColor: 'rgba(137, 87, 229, 0.2)',
    accentColor: '#a371f7',
  },
} as const;

// Dark mode priority configurations
export const darkPriorityConfigs = {
  low: {
    title: 'Low Priority',
    color: '#6e7681',
    bgColor: 'rgba(110, 118, 129, 0.08)',
    borderColor: 'rgba(110, 118, 129, 0.2)',
    icon: '🟢'
  },
  medium: {
    title: 'Medium Priority',
    color: '#e3b341',
    bgColor: 'rgba(227, 179, 65, 0.08)',
    borderColor: 'rgba(227, 179, 65, 0.2)',
    icon: '🟡'
  },
  high: {
    title: 'High Priority',
    color: '#f85149',
    bgColor: 'rgba(248, 81, 73, 0.08)',
    borderColor: 'rgba(248, 81, 73, 0.2)',
    icon: '🟠'
  },
  urgent: {
    title: 'Extreme Priority',
    color: '#da3633',
    bgColor: 'rgba(218, 54, 51, 0.12)',
    borderColor: 'rgba(218, 54, 51, 0.3)',
    icon: '🔴'
  }
} as const;