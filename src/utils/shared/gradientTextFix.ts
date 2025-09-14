// Gradient Text Fix - React DOM Style Warning Resolution
// Provides safe gradient text styles that don't mix shorthand and longhand properties

export const gradientTextStyles = (gradient: string): React.CSSProperties => ({
  backgroundImage: gradient, // Use backgroundImage instead of background to avoid conflicts
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', // Add standardized property for future browsers
});

// Pre-defined gradient styles
export const gradientPresets = {
  primary: gradientTextStyles('linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
  success: gradientTextStyles('linear-gradient(135deg, #10b981 0%, #059669 100%)'),
  error: gradientTextStyles('linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'),
  warning: gradientTextStyles('linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'),
} as const;