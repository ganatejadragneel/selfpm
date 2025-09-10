/**
 * Style Utilities - Helper functions for dynamic style generation
 * Following DRY principle: Reusable style computation functions
 */

import { colors, spacing, breakpoints } from './designTokens';
import type { CSSProperties } from 'react';

/**
 * Combines multiple style objects, handling undefined values
 */
export function combineStyles(...styles: (CSSProperties | undefined)[]): CSSProperties {
  return styles.reduce<CSSProperties>((acc, style) => {
    if (!style) return acc;
    return { ...acc, ...style };
  }, {});
}

/**
 * Creates responsive style based on breakpoint
 */
export function responsiveStyle(
  mobile: CSSProperties,
  tablet?: CSSProperties,
  desktop?: CSSProperties
): CSSProperties {
  const base = mobile;
  const tabletStyles = tablet ? { [`@media (min-width: ${breakpoints.md})`]: tablet } : {};
  const desktopStyles = desktop ? { [`@media (min-width: ${breakpoints.lg})`]: desktop } : {};
  
  return {
    ...base,
    ...tabletStyles,
    ...desktopStyles,
  } as CSSProperties;
}

/**
 * Generates status-based color scheme
 */
export function getStatusColors(status: 'todo' | 'in_progress' | 'done' | 'blocked') {
  const statusColorMap = {
    todo: colors.status.todo,
    in_progress: colors.status.inProgress,
    done: colors.status.done,
    blocked: colors.status.blocked,
  };
  
  const color = statusColorMap[status];
  
  return {
    color,
    backgroundColor: `${color}20`,
    borderColor: `${color}40`,
  };
}

/**
 * Generates priority-based styles
 */
export function getPriorityStyles(priority: 'critical' | 'high' | 'medium' | 'low') {
  const config = colors.priority[priority];
  
  return {
    backgroundColor: config.bg,
    borderLeft: `4px solid ${config.border}`,
    color: config.text,
  } as CSSProperties;
}

/**
 * Creates conditional styles based on a condition
 */
export function conditionalStyle(
  condition: boolean,
  trueStyle: CSSProperties,
  falseStyle?: CSSProperties
): CSSProperties {
  return condition ? trueStyle : (falseStyle || {});
}

/**
 * Generates spacing values for padding/margin
 */
export function getSpacing(
  top?: keyof typeof spacing,
  right?: keyof typeof spacing,
  bottom?: keyof typeof spacing,
  left?: keyof typeof spacing
): string {
  const values = [
    top ? spacing[top] : '0',
    right ? spacing[right] : '0',
    bottom ? spacing[bottom] : '0',
    left ? spacing[left] : '0',
  ];
  
  // Optimize output
  if (values[0] === values[2] && values[1] === values[3]) {
    if (values[0] === values[1]) {
      return values[0]; // All same
    }
    return `${values[0]} ${values[1]}`; // Top/bottom same, left/right same
  }
  
  return values.join(' ');
}

/**
 * Creates hover effect styles
 */
export function createHoverEffect(
  baseStyle: CSSProperties,
  hoverStyle: CSSProperties
): CSSProperties {
  return {
    ...baseStyle,
    transition: 'all 0.2s ease',
    '&:hover': hoverStyle,
  } as CSSProperties;
}

/**
 * Generates theme-aware styles
 */
export function getThemedStyles(theme: 'light' | 'dark') {
  const themeColors = theme === 'dark' ? colors.dark : colors.light;
  
  return {
    background: themeColors.background,
    surface: themeColors.surface,
    text: themeColors.text,
  };
}

/**
 * Creates gradient background
 */
export function createGradient(
  startColor: string,
  endColor: string,
  angle: number = 135
): string {
  return `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
}

/**
 * Generates box shadow with optional color
 */
export function createShadow(
  x: number = 0,
  y: number = 4,
  blur: number = 6,
  spread: number = 0,
  color: string = 'rgba(0, 0, 0, 0.1)'
): string {
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

/**
 * Creates animated transition
 */
export function createTransition(
  properties: string[] = ['all'],
  duration: number = 200,
  easing: string = 'ease-in-out'
): string {
  return properties.map(prop => `${prop} ${duration}ms ${easing}`).join(', ');
}

/**
 * Converts hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

/**
 * Creates responsive font size
 */
export function responsiveFontSize(
  mobile: string,
  tablet?: string,
  desktop?: string
): CSSProperties {
  return responsiveStyle(
    { fontSize: mobile },
    tablet ? { fontSize: tablet } : undefined,
    desktop ? { fontSize: desktop } : undefined
  );
}

/**
 * Generates truncate text styles
 */
export function truncateText(lines: number = 1): CSSProperties {
  if (lines === 1) {
    return {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
  }
  
  return {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
  } as CSSProperties;
}

/**
 * Creates aspect ratio container
 */
export function aspectRatio(ratio: string): CSSProperties {
  const [width, height] = ratio.split(':').map(Number);
  const paddingTop = (height / width) * 100;
  
  return {
    position: 'relative',
    paddingTop: `${paddingTop}%`,
  };
}

/**
 * Generates grid layout
 */
export function gridLayout(
  columns: number,
  gap?: keyof typeof spacing
): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: gap ? spacing[gap] : spacing.md,
  };
}

/**
 * Creates flex container with common patterns
 */
export function flexContainer(
  direction: 'row' | 'column' = 'row',
  justify?: CSSProperties['justifyContent'],
  align?: CSSProperties['alignItems'],
  gap?: keyof typeof spacing
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    gap: gap ? spacing[gap] : undefined,
  };
}