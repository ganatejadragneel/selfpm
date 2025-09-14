import React from 'react';
import { colors, typography, type FontSizeToken, type FontWeightToken } from './tokens';

/**
 * Text - Typography component
 * Safe implementation with explicit unions, no complex generics
 */
export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  // Typography props - simple explicit unions
  size?: FontSizeToken;
  weight?: FontWeightToken;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  
  // Element type - explicit options, not keyof JSX.IntrinsicElements
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  // Text behavior
  truncate?: boolean;
  
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  size = 'md',
  weight = 'normal',
  color = colors.gray[700],
  align = 'left',
  as: Component = 'span',
  truncate = false,
  style,
  children,
  ...props
}) => {
  const textStyle: React.CSSProperties = {
    fontSize: typography.sizes[size],
    fontWeight: typography.weights[weight],
    color,
    textAlign: align,
    ...(truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    ...style,
  };

  return (
    <Component style={textStyle} {...props}>
      {children}
    </Component>
  );
};

// Pre-configured heading components for convenience
export interface HeadingProps extends Omit<TextProps, 'as' | 'size'> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: FontSizeToken; // Allow override
}

export const Heading: React.FC<HeadingProps> = ({
  level,
  size,
  weight = 'bold',
  color = colors.gray[900],
  ...props
}) => {
  // Default sizes for each heading level
  const defaultSizes: Record<number, FontSizeToken> = {
    1: '2xl',
    2: 'xl', 
    3: 'lg',
    4: 'md',
    5: 'md',
    6: 'sm',
  };

  const headingElements: Record<number, TextProps['as']> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
    5: 'h5',
    6: 'h6',
  };

  return (
    <Text
      as={headingElements[level]}
      size={size || defaultSizes[level]}
      weight={weight}
      color={color}
      {...props}
    />
  );
};