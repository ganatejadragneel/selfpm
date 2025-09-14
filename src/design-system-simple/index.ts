/**
 * Simple Design System - Entry Point
 * Safe component system with zero TypeScript errors
 */

// Core building blocks
export { Box } from './Box';
export type { BoxProps } from './Box';

// Typography
export { Text, Heading } from './Text';
export type { TextProps, HeadingProps } from './Text';

// Interactive components
export { DSButton } from './Button';
export type { DSButtonProps } from './Button';

// Data display
export { Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

// Design tokens
export * from './tokens';