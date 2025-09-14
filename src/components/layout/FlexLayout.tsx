import React from 'react';

export interface FlexLayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FlexLayout: React.FC<FlexLayoutProps> = ({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap = '0',
  className,
  style
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        gap,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const FlexItem: React.FC<{
  children: React.ReactNode;
  flex?: string | number;
  grow?: number;
  shrink?: number;
  basis?: string;
  align?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  className?: string;
  style?: React.CSSProperties;
}> = ({
  children,
  flex,
  grow,
  shrink,
  basis,
  align,
  className,
  style
}) => {
  return (
    <div
      className={className}
      style={{
        flex,
        flexGrow: grow,
        flexShrink: shrink,
        flexBasis: basis,
        alignSelf: align,
        ...style
      }}
    >
      {children}
    </div>
  );
};