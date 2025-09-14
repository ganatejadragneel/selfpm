import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';

export interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number };
  gap?: string;
  minItemWidth?: string;
  maxColumns?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns,
  gap = '24px',
  minItemWidth = '300px',
  maxColumns,
  className,
  style
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getGridColumns = (): string => {
    if (typeof columns === 'number') {
      return `repeat(${columns}, 1fr)`;
    }

    if (columns && typeof columns === 'object') {
      const { sm, md, lg } = columns;
      if (isMobile && sm) return `repeat(${sm}, 1fr)`;
      if (isTablet && md) return `repeat(${md}, 1fr)`;
      if (lg) return `repeat(${lg}, 1fr)`;
    }

    // Default responsive behavior
    if (maxColumns) {
      return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
    }

    return isMobile
      ? '1fr'
      : `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`;
  };

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const GridItem: React.FC<{
  children: React.ReactNode;
  span?: number | { sm?: number; md?: number; lg?: number };
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, span, className, style }) => {
  const { isMobile, isTablet } = useResponsive();

  const getGridColumnSpan = (): number | undefined => {
    if (typeof span === 'number') {
      return span;
    }

    if (span && typeof span === 'object') {
      const { sm, md, lg } = span;
      if (isMobile && sm) return sm;
      if (isTablet && md) return md;
      if (lg) return lg;
    }

    return undefined;
  };

  const columnSpan = getGridColumnSpan();

  return (
    <div
      className={className}
      style={{
        gridColumn: columnSpan ? `span ${columnSpan}` : undefined,
        ...style
      }}
    >
      {children}
    </div>
  );
};