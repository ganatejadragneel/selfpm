// Phase 9: Responsive Design System Enhancement
// Advanced responsive utilities for consistent breakpoint management and responsive behavior

import { useEffect, useState, useMemo } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Breakpoint names type
export type BreakpointName = keyof typeof BREAKPOINTS;
export type BreakpointValue = typeof BREAKPOINTS[BreakpointName];

// Container max-widths for each breakpoint
export const CONTAINER_SIZES = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Grid system configuration
export const GRID_SYSTEM = {
  columns: 12,
  gutter: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 48,
  },
  margins: {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    '2xl': 80,
  },
} as const;

// Spacing scales for responsive design
export const RESPONSIVE_SPACING = {
  xs: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
  },
  sm: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },
  md: {
    none: 0,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
  },
  lg: {
    none: 0,
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    '2xl': 64,
  },
  xl: {
    none: 0,
    xs: 12,
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64,
    '2xl': 80,
  },
  '2xl': {
    none: 0,
    xs: 16,
    sm: 24,
    md: 40,
    lg: 56,
    xl: 80,
    '2xl': 96,
  },
} as const;

// Typography scales for responsive design
export const RESPONSIVE_TYPOGRAPHY = {
  xs: {
    h1: { fontSize: '24px', lineHeight: '32px', fontWeight: '700' },
    h2: { fontSize: '20px', lineHeight: '28px', fontWeight: '600' },
    h3: { fontSize: '18px', lineHeight: '24px', fontWeight: '600' },
    h4: { fontSize: '16px', lineHeight: '22px', fontWeight: '600' },
    h5: { fontSize: '14px', lineHeight: '20px', fontWeight: '600' },
    h6: { fontSize: '12px', lineHeight: '16px', fontWeight: '600' },
    body: { fontSize: '14px', lineHeight: '20px', fontWeight: '400' },
    caption: { fontSize: '12px', lineHeight: '16px', fontWeight: '400' },
    small: { fontSize: '10px', lineHeight: '14px', fontWeight: '400' },
  },
  sm: {
    h1: { fontSize: '28px', lineHeight: '36px', fontWeight: '700' },
    h2: { fontSize: '22px', lineHeight: '30px', fontWeight: '600' },
    h3: { fontSize: '20px', lineHeight: '26px', fontWeight: '600' },
    h4: { fontSize: '18px', lineHeight: '24px', fontWeight: '600' },
    h5: { fontSize: '16px', lineHeight: '22px', fontWeight: '600' },
    h6: { fontSize: '14px', lineHeight: '18px', fontWeight: '600' },
    body: { fontSize: '15px', lineHeight: '22px', fontWeight: '400' },
    caption: { fontSize: '13px', lineHeight: '18px', fontWeight: '400' },
    small: { fontSize: '11px', lineHeight: '15px', fontWeight: '400' },
  },
  md: {
    h1: { fontSize: '32px', lineHeight: '40px', fontWeight: '700' },
    h2: { fontSize: '26px', lineHeight: '34px', fontWeight: '600' },
    h3: { fontSize: '22px', lineHeight: '28px', fontWeight: '600' },
    h4: { fontSize: '20px', lineHeight: '26px', fontWeight: '600' },
    h5: { fontSize: '18px', lineHeight: '24px', fontWeight: '600' },
    h6: { fontSize: '16px', lineHeight: '20px', fontWeight: '600' },
    body: { fontSize: '16px', lineHeight: '24px', fontWeight: '400' },
    caption: { fontSize: '14px', lineHeight: '20px', fontWeight: '400' },
    small: { fontSize: '12px', lineHeight: '16px', fontWeight: '400' },
  },
  lg: {
    h1: { fontSize: '36px', lineHeight: '44px', fontWeight: '700' },
    h2: { fontSize: '30px', lineHeight: '38px', fontWeight: '600' },
    h3: { fontSize: '24px', lineHeight: '32px', fontWeight: '600' },
    h4: { fontSize: '22px', lineHeight: '28px', fontWeight: '600' },
    h5: { fontSize: '20px', lineHeight: '26px', fontWeight: '600' },
    h6: { fontSize: '18px', lineHeight: '24px', fontWeight: '600' },
    body: { fontSize: '16px', lineHeight: '26px', fontWeight: '400' },
    caption: { fontSize: '15px', lineHeight: '22px', fontWeight: '400' },
    small: { fontSize: '13px', lineHeight: '18px', fontWeight: '400' },
  },
  xl: {
    h1: { fontSize: '40px', lineHeight: '48px', fontWeight: '700' },
    h2: { fontSize: '32px', lineHeight: '40px', fontWeight: '600' },
    h3: { fontSize: '26px', lineHeight: '34px', fontWeight: '600' },
    h4: { fontSize: '24px', lineHeight: '30px', fontWeight: '600' },
    h5: { fontSize: '22px', lineHeight: '28px', fontWeight: '600' },
    h6: { fontSize: '20px', lineHeight: '26px', fontWeight: '600' },
    body: { fontSize: '18px', lineHeight: '28px', fontWeight: '400' },
    caption: { fontSize: '16px', lineHeight: '24px', fontWeight: '400' },
    small: { fontSize: '14px', lineHeight: '20px', fontWeight: '400' },
  },
  '2xl': {
    h1: { fontSize: '48px', lineHeight: '56px', fontWeight: '700' },
    h2: { fontSize: '38px', lineHeight: '46px', fontWeight: '600' },
    h3: { fontSize: '30px', lineHeight: '38px', fontWeight: '600' },
    h4: { fontSize: '26px', lineHeight: '34px', fontWeight: '600' },
    h5: { fontSize: '24px', lineHeight: '30px', fontWeight: '600' },
    h6: { fontSize: '22px', lineHeight: '28px', fontWeight: '600' },
    body: { fontSize: '20px', lineHeight: '30px', fontWeight: '400' },
    caption: { fontSize: '18px', lineHeight: '26px', fontWeight: '400' },
    small: { fontSize: '16px', lineHeight: '22px', fontWeight: '400' },
  },
} as const;

// Responsive value type for flexible configuration
export type ResponsiveValue<T> = T | Partial<Record<BreakpointName, T>>;

// CSS-in-JS responsive utilities
export const responsiveHelpers = {
  // Create media queries for breakpoints
  mediaQuery: (breakpoint: BreakpointName, type: 'min' | 'max' = 'min'): string => {
    const value = BREAKPOINTS[breakpoint];
    if (type === 'min') {
      return `@media (min-width: ${value}px)`;
    } else {
      return `@media (max-width: ${value - 1}px)`;
    }
  },

  // Create responsive CSS properties
  createResponsiveStyle: <T>(
    property: string,
    values: ResponsiveValue<T>,
    transform?: (value: T) => string | number
  ): Record<string, any> => {
    if (typeof values !== 'object' || values === null) {
      return { [property]: transform ? transform(values as T) : values };
    }

    const styles: Record<string, any> = {};
    const breakpointEntries = Object.entries(values as Record<BreakpointName, T>);

    // Sort breakpoints by size
    breakpointEntries.sort(([a], [b]) => BREAKPOINTS[a as BreakpointName] - BREAKPOINTS[b as BreakpointName]);

    breakpointEntries.forEach(([breakpoint, value]) => {
      if (breakpoint === 'xs') {
        // Base styles without media query
        styles[property] = transform ? transform(value) : value;
      } else {
        // Styles within media queries
        const mediaQuery = responsiveHelpers.mediaQuery(breakpoint as BreakpointName);
        if (!styles[mediaQuery]) {
          styles[mediaQuery] = {};
        }
        styles[mediaQuery][property] = transform ? transform(value) : value;
      }
    });

    return styles;
  },

  // Create container styles
  createContainer: (maxWidth?: BreakpointName | 'none'): Record<string, any> => {
    if (maxWidth === 'none') {
      return {
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: `${RESPONSIVE_SPACING.xs.md}px`,
        paddingRight: `${RESPONSIVE_SPACING.xs.md}px`,
      };
    }

    const styles: Record<string, any> = {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: `${RESPONSIVE_SPACING.xs.md}px`,
      paddingRight: `${RESPONSIVE_SPACING.xs.md}px`,
    };

    // Add responsive padding and max-width
    Object.entries(BREAKPOINTS).forEach(([breakpoint, value]) => {
      if (value === 0) return;

      const bp = breakpoint as BreakpointName;
      const mediaQuery = responsiveHelpers.mediaQuery(bp);

      if (!styles[mediaQuery]) {
        styles[mediaQuery] = {};
      }

      styles[mediaQuery].paddingLeft = `${RESPONSIVE_SPACING[bp].lg}px`;
      styles[mediaQuery].paddingRight = `${RESPONSIVE_SPACING[bp].lg}px`;

      if (maxWidth && BREAKPOINTS[bp] <= BREAKPOINTS[maxWidth]) {
        styles[mediaQuery].maxWidth = CONTAINER_SIZES[bp];
      }
    });

    return styles;
  },

  // Create grid column styles
  createGridColumn: (
    spans: ResponsiveValue<number>,
    totalColumns: number = GRID_SYSTEM.columns
  ): Record<string, any> => {
    return responsiveHelpers.createResponsiveStyle(
      'width',
      spans,
      (span) => `${(span / totalColumns) * 100}%`
    );
  },

  // Create responsive spacing
  createSpacing: (
    type: 'margin' | 'padding',
    direction: 'top' | 'right' | 'bottom' | 'left' | 'horizontal' | 'vertical' | 'all',
    values: ResponsiveValue<keyof typeof RESPONSIVE_SPACING.xs>
  ): Record<string, any> => {
    const properties: string[] = [];

    switch (direction) {
      case 'top':
        properties.push(`${type}Top`);
        break;
      case 'right':
        properties.push(`${type}Right`);
        break;
      case 'bottom':
        properties.push(`${type}Bottom`);
        break;
      case 'left':
        properties.push(`${type}Left`);
        break;
      case 'horizontal':
        properties.push(`${type}Left`, `${type}Right`);
        break;
      case 'vertical':
        properties.push(`${type}Top`, `${type}Bottom`);
        break;
      case 'all':
        properties.push(type);
        break;
    }

    const styles: Record<string, any> = {};

    properties.forEach(property => {
      const responsiveStyles = responsiveHelpers.createResponsiveStyle(
        property,
        values,
        (value) => {
          if (typeof values !== 'object' || values === null) {
            return `${RESPONSIVE_SPACING.xs[value]}px`;
          }

          // For responsive values, we need to determine the breakpoint
          const breakpoint = Object.keys(values)[0] as BreakpointName;
          return `${RESPONSIVE_SPACING[breakpoint][value]}px`;
        }
      );

      Object.assign(styles, responsiveStyles);
    });

    return styles;
  },

  // Create responsive typography
  createTypography: (
    variant: keyof typeof RESPONSIVE_TYPOGRAPHY.xs,
    customStyles?: ResponsiveValue<Partial<React.CSSProperties>>
  ): Record<string, any> => {
    const styles: Record<string, any> = {};

    // Base typography styles
    const baseStyles = RESPONSIVE_TYPOGRAPHY.xs[variant];
    Object.assign(styles, baseStyles);

    // Add responsive typography
    Object.entries(BREAKPOINTS).forEach(([breakpoint, value]) => {
      if (value === 0) return;

      const bp = breakpoint as BreakpointName;
      const mediaQuery = responsiveHelpers.mediaQuery(bp);

      if (!styles[mediaQuery]) {
        styles[mediaQuery] = {};
      }

      Object.assign(styles[mediaQuery], RESPONSIVE_TYPOGRAPHY[bp][variant]);
    });

    // Apply custom styles if provided
    if (customStyles) {
      const customResponsiveStyles = responsiveHelpers.createResponsiveStyle(
        'custom',
        customStyles
      );

      Object.keys(customResponsiveStyles).forEach(key => {
        if (key === 'custom') {
          Object.assign(styles, customResponsiveStyles.custom);
        } else {
          if (!styles[key]) {
            styles[key] = {};
          }
          Object.assign(styles[key], customResponsiveStyles[key].custom || customResponsiveStyles[key]);
        }
      });
    }

    return styles;
  },
};

// React hooks for responsive behavior
export const useResponsive = {
  // Hook for current breakpoint detection
  useCurrentBreakpoint: (): BreakpointName => {
    const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointName>('xs');

    useEffect(() => {
      const updateBreakpoint = () => {
        const width = window.innerWidth;
        let newBreakpoint: BreakpointName = 'xs';

        Object.entries(BREAKPOINTS).forEach(([name, value]) => {
          if (width >= value) {
            newBreakpoint = name as BreakpointName;
          }
        });

        setCurrentBreakpoint(newBreakpoint);
      };

      updateBreakpoint();
      window.addEventListener('resize', updateBreakpoint);

      return () => {
        window.removeEventListener('resize', updateBreakpoint);
      };
    }, []);

    return currentBreakpoint;
  },

  // Hook for media query matching
  useMediaQuery: (query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined') return;

      const mediaQuery = window.matchMedia(query);
      setMatches(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
      mediaQuery.addListener(handler);

      return () => mediaQuery.removeListener(handler);
    }, [query]);

    return matches;
  },

  // Hook for breakpoint-based values
  useResponsiveValue: <T>(values: ResponsiveValue<T>): T => {
    const currentBreakpoint = useResponsive.useCurrentBreakpoint();

    return useMemo(() => {
      if (typeof values !== 'object' || values === null) {
        return values as T;
      }

      const responsiveValues = values as Partial<Record<BreakpointName, T>>;

      // Find the appropriate value for the current breakpoint
      const breakpointOrder: BreakpointName[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
      const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

      for (let i = currentIndex; i < breakpointOrder.length; i++) {
        const breakpoint = breakpointOrder[i];
        if (responsiveValues[breakpoint] !== undefined) {
          return responsiveValues[breakpoint]!;
        }
      }

      // Fallback to first available value
      const availableValues = Object.values(responsiveValues);
      return availableValues[0] || (null as T);
    }, [values, currentBreakpoint]);
  },

  // Hook for container queries (future-proof)
  useContainerQuery: (containerRef: React.RefObject<HTMLElement>, query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;

      // For now, we'll use ResizeObserver as a fallback
      // This will be replaced with container queries when widely supported
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const width = entry.contentRect.width;
          // Simple width-based matching (can be extended)
          if (query.includes('min-width')) {
            const match = query.match(/min-width:\s*(\d+)px/);
            if (match) {
              const minWidth = parseInt(match[1], 10);
              setMatches(width >= minWidth);
            }
          } else if (query.includes('max-width')) {
            const match = query.match(/max-width:\s*(\d+)px/);
            if (match) {
              const maxWidth = parseInt(match[1], 10);
              setMatches(width <= maxWidth);
            }
          }
        }
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, [containerRef, query]);

    return matches;
  },
};

// Utility functions for responsive calculations
export const responsiveUtils = {
  // Get breakpoint value
  getBreakpointValue: (breakpoint: BreakpointName): number => BREAKPOINTS[breakpoint],

  // Check if breakpoint is active
  isBreakpointActive: (breakpoint: BreakpointName, windowWidth: number): boolean => {
    return windowWidth >= BREAKPOINTS[breakpoint];
  },

  // Get responsive value for specific breakpoint
  getValueForBreakpoint: <T>(values: ResponsiveValue<T>, targetBreakpoint: BreakpointName): T => {
    if (typeof values !== 'object' || values === null) {
      return values as T;
    }

    const responsiveValues = values as Partial<Record<BreakpointName, T>>;

    // Find the appropriate value for the target breakpoint
    const breakpointOrder: BreakpointName[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const targetIndex = breakpointOrder.indexOf(targetBreakpoint);

    for (let i = targetIndex; i >= 0; i--) {
      const breakpoint = breakpointOrder[i];
      if (responsiveValues[breakpoint] !== undefined) {
        return responsiveValues[breakpoint]!;
      }
    }

    // Fallback to first available value
    const availableValues = Object.values(responsiveValues);
    return availableValues[0] || (null as T);
  },

  // Calculate responsive scale factor
  getScaleFactor: (baseBreakpoint: BreakpointName, currentBreakpoint: BreakpointName): number => {
    const baseWidth = BREAKPOINTS[baseBreakpoint];
    const currentWidth = BREAKPOINTS[currentBreakpoint];
    return currentWidth / baseWidth;
  },

  // Generate responsive class names (for CSS frameworks)
  generateResponsiveClasses: (
    baseClass: string,
    values: ResponsiveValue<string>
  ): string => {
    if (typeof values !== 'object' || values === null) {
      return `${baseClass}-${values}`;
    }

    const responsiveValues = values as Partial<Record<BreakpointName, string>>;
    const classes: string[] = [];

    Object.entries(responsiveValues).forEach(([breakpoint, value]) => {
      if (breakpoint === 'xs') {
        classes.push(`${baseClass}-${value}`);
      } else {
        classes.push(`${breakpoint}:${baseClass}-${value}`);
      }
    });

    return classes.join(' ');
  },
};