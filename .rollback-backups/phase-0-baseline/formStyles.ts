import React from 'react';
import { theme } from './theme';

/**
 * Centralized form styling utilities following DRY principle
 * Eliminates duplication across form components
 */

// Base form styles
export const formStyles = {
  // Input styles
  label: {
    display: 'block',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.medium,
    fontSize: theme.typography.sizes.sm,
  } as React.CSSProperties,

  input: {
    width: '100%',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    border: `2px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.base,
    fontWeight: 500,
    backgroundColor: theme.colors.surface.white,
    color: theme.colors.text.primary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties,

  enhancedInput: {
    width: '100%',
    padding: '14px 16px',
    border: `2px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.sm,
    fontWeight: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: theme.colors.text.primary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(10px)',
  } as React.CSSProperties,

  textarea: {
    width: '100%',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    border: `2px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.sizes.base,
    fontWeight: 500,
    backgroundColor: theme.colors.surface.white,
    color: theme.colors.text.primary,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
    resize: 'vertical' as const,
    minHeight: '100px',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  // Button styles
  primaryButton: {
    width: '100%',
    padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    background: theme.colors.primary.gradient,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(59, 130, 246, 0.3)',
  } as React.CSSProperties,

  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
    color: theme.colors.text.secondary,
    border: `2px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
  } as React.CSSProperties,

  dangerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.colors.status.error.gradient,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  } as React.CSSProperties,

  successButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    background: theme.colors.status.success.gradient,
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    cursor: 'pointer',
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  } as React.CSSProperties,

  // Message styles
  errorMessage: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
    border: `1px solid ${theme.colors.status.error.light}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    color: theme.colors.status.error.dark,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  } as React.CSSProperties,

  successMessage: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
    border: `1px solid ${theme.colors.status.success.light}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    color: theme.colors.status.success.dark,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  } as React.CSSProperties,

  // Utility styles
  fieldContainer: {
    marginBottom: theme.spacing.lg,
    position: 'relative',
  } as React.CSSProperties,

  eyeButton: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: theme.colors.text.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  } as React.CSSProperties,

  passwordHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.muted,
    margin: `${theme.spacing.xs} 0 0 0`,
    fontStyle: 'italic',
  } as React.CSSProperties,

  // Card styles
  formCard: {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    position: 'relative',
    overflow: 'hidden',
  } as React.CSSProperties,

  // Header decoration
  headerDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
  } as React.CSSProperties,
};

// Helper functions for dynamic styles
export const getInputStyle = (hasValue: boolean, hasError?: boolean): React.CSSProperties => ({
  ...formStyles.enhancedInput,
  borderColor: hasError 
    ? theme.colors.status.error.light
    : hasValue 
      ? theme.colors.status.success.light 
      : theme.colors.border.light,
});

export const getButtonState = (isLoading: boolean, isDisabled: boolean): React.CSSProperties => ({
  opacity: isLoading || isDisabled ? 0.7 : 1,
  transform: isLoading ? 'scale(0.98)' : 'scale(1)',
  cursor: isLoading || isDisabled ? 'not-allowed' : 'pointer',
});

// Icon styles for form elements
export const formIcons = {
  errorIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: theme.colors.status.error.dark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  successIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: theme.colors.status.success.dark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,
};