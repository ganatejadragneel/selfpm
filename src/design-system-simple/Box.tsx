import React from 'react';
import { spacing, borderRadius, type SpacingToken, type BorderRadiusToken } from './tokens';

/**
 * Box - Universal layout primitive
 * Safe implementation with explicit unions, no complex generics
 */
export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  // Spacing props - using simple union types
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pr?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mr?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  
  // Visual props
  bg?: string;
  borderRadius?: BorderRadiusToken;
  
  // Layout props - simple strings, not complex types
  display?: 'block' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'none';
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  
  // Position props
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
  
  // Content
  children?: React.ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  // Spacing props
  p, px, py, pt, pr, pb, pl,
  m, mx, my, mt, mr, mb, ml,
  
  // Visual props
  bg,
  borderRadius: radius,
  
  // Layout props
  display,
  width,
  height,
  maxWidth,
  maxHeight,
  
  // Position props
  position,
  top,
  right,
  bottom,
  left,
  zIndex,
  
  // HTML props
  style,
  children,
  ...props
}) => {
  const boxStyle: React.CSSProperties = {
    // Display
    ...(display && { display }),
    
    // Dimensions
    ...(width && { width }),
    ...(height && { height }),
    ...(maxWidth && { maxWidth }),
    ...(maxHeight && { maxHeight }),
    
    // Position
    ...(position && { position }),
    ...(top && { top }),
    ...(right && { right }),
    ...(bottom && { bottom }),
    ...(left && { left }),
    ...(zIndex !== undefined && { zIndex }),
    
    // Padding - using token lookup
    ...(p && { padding: spacing[p] }),
    ...(px && { paddingLeft: spacing[px], paddingRight: spacing[px] }),
    ...(py && { paddingTop: spacing[py], paddingBottom: spacing[py] }),
    ...(pt && { paddingTop: spacing[pt] }),
    ...(pr && { paddingRight: spacing[pr] }),
    ...(pb && { paddingBottom: spacing[pb] }),
    ...(pl && { paddingLeft: spacing[pl] }),
    
    // Margin - using token lookup
    ...(m && { margin: spacing[m] }),
    ...(mx && { marginLeft: spacing[mx], marginRight: spacing[mx] }),
    ...(my && { marginTop: spacing[my], marginBottom: spacing[my] }),
    ...(mt && { marginTop: spacing[mt] }),
    ...(mr && { marginRight: spacing[mr] }),
    ...(mb && { marginBottom: spacing[mb] }),
    ...(ml && { marginLeft: spacing[ml] }),
    
    // Visual
    ...(bg && { backgroundColor: bg }),
    ...(radius && { borderRadius: borderRadius[radius] }),
    
    // Override with custom styles
    ...style,
  };

  return (
    <div style={boxStyle} {...props}>
      {children}
    </div>
  );
};