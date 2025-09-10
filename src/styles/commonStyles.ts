import { useThemeColors } from '../hooks/useThemeColors';

export const useCommonStyles = () => {
  const theme = useThemeColors();

  // Simplified color extraction for compatibility
  const isDark = theme.currentTheme === 'dark';
  const primaryColor = isDark ? '#667eea' : '#667eea';
  const surfaceColor = isDark ? 'rgba(28, 33, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? 'rgba(55, 65, 81, 0.4)' : 'rgba(255, 255, 255, 0.3)';
  const textPrimary = isDark ? '#f1f3f4' : '#1f2937';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const backgroundColor = isDark ? '#0d1117' : '#ffffff';

  return {
    // Card styles
    glassCard: {
      padding: '20px',
      background: surfaceColor,
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      border: `1px solid ${borderColor}`,
    },

    smallGlassCard: {
      padding: '12px',
      background: surfaceColor,
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      border: `1px solid ${borderColor}`,
    },

    // Button styles
    primaryButton: {
      padding: '8px 16px',
      background: primaryColor,
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },

    secondaryButton: {
      padding: '8px 16px',
      background: 'transparent',
      color: textPrimary,
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },

    dangerButton: {
      padding: '8px 16px',
      background: '#ef4444',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },

    // Form styles
    formGroup: {
      marginBottom: '16px',
    },

    formLabel: {
      display: 'block',
      marginBottom: '4px',
      fontSize: '14px',
      fontWeight: '500',
      color: textPrimary,
    },

    requiredIndicator: {
      color: '#ef4444',
      marginLeft: '2px',
    },

    formInput: {
      width: '100%',
      padding: '8px',
      background: backgroundColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      fontSize: '14px',
      color: textPrimary,
      transition: 'border-color 0.2s ease',
    },

    formTextarea: {
      width: '100%',
      padding: '8px',
      background: backgroundColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      fontSize: '14px',
      color: textPrimary,
      resize: 'vertical' as const,
      minHeight: '80px',
      transition: 'border-color 0.2s ease',
    },

    formSelect: {
      width: '100%',
      padding: '8px',
      background: backgroundColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      fontSize: '14px',
      color: textPrimary,
      transition: 'border-color 0.2s ease',
    },

    // Modal styles
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },

    modalContent: {
      background: backgroundColor,
      borderRadius: '12px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative' as const,
    },

    modalHeader: {
      padding: '20px',
      borderBottom: `1px solid ${borderColor}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    modalBody: {
      padding: '20px',
    },

    modalFooter: {
      padding: '20px',
      borderTop: `1px solid ${borderColor}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
    },

    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: textSecondary,
      padding: '4px',
      borderRadius: '4px',
      transition: 'color 0.2s ease',
    },

    // Status styles
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase' as const,
    },

    priorityBadge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
    },

    // Layout styles
    flexRow: {
      display: 'flex',
      flexDirection: 'row' as const,
    },

    flexColumn: {
      display: 'flex',
      flexDirection: 'column' as const,
    },

    flexCenter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    flexBetween: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    flexWrap: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
    },

    // Spacing utilities
    spacing: {
      xs: { margin: '4px' },
      sm: { margin: '8px' },
      md: { margin: '16px' },
      lg: { margin: '20px' },
    },

    marginBottom: {
      xs: { marginBottom: '4px' },
      sm: { marginBottom: '8px' },
      md: { marginBottom: '16px' },
      lg: { marginBottom: '20px' },
    },

    // Text styles
    textPrimary: {
      color: textPrimary,
    },

    textSecondary: {
      color: textSecondary,
    },

    textMuted: {
      color: textSecondary,
    },

    // Animation styles
    fadeIn: {
      animation: 'fadeIn 0.2s ease-in-out',
    },

    slideIn: {
      animation: 'slideInFromRight 0.3s ease-out',
    },
  };
};

export const getStatusColor = (_theme: any, status: string) => {
  switch (status) {
    case 'todo':
      return '#6b7280';
    case 'in_progress':
      return '#f59e0b';
    case 'done':
      return '#10b981';
    case 'blocked':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export const getPriorityColor = (_theme: any, priority: string) => {
  switch (priority) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
};