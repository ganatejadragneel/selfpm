// Shared Interface Library - Phase 7A DRY Refactoring
// ADDITIVE ONLY - Does not replace existing interfaces, provides optional base types
// NOTE: BaseModalProps already exists in ./index.ts

// Base Form Field Props - Common props across form inputs
export interface BaseFormFieldProps {
  label?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  helperText?: string;
}

// Base Size/Variant Props - Common across UI components
export interface BaseSizeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface BaseVariantProps<T extends string = string> {
  variant?: T;
}

// Base Layout Props - Common structural props
export interface BaseLayoutProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Base Loading Props - Common async state props
export interface BaseLoadingProps {
  loading?: boolean;
  loadingText?: string;
}

// Base Container Props - Common container patterns
export interface BaseContainerProps extends BaseLayoutProps {
  maxWidth?: string;
  padding?: string;
  backgroundColor?: string;
}

// Base Button Props - Common button properties
export interface BaseButtonProps extends BaseSizeProps {
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// Base Card Props - Common card layout props
export interface BaseCardProps extends BaseLayoutProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

// Composition helpers for commonly combined interfaces
// Note: BaseModalProps is imported from the main index when this file is imported
export type WithModal<T = {}> = T & { isOpen: boolean; onClose: () => void };
export type WithFormField<T = {}> = T & BaseFormFieldProps;
export type WithSize<T = {}> = T & BaseSizeProps;
export type WithVariant<T = {}, V extends string = string> = T & BaseVariantProps<V>;
export type WithLayout<T = {}> = T & BaseLayoutProps;
export type WithLoading<T = {}> = T & BaseLoadingProps;

// Component-specific variant types (optional, components can define their own)
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type InputVariant = 'default' | 'filled' | 'outlined';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

// Common option types for select/choice components
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  color?: string;
  icon?: React.ComponentType;
}

// Common callback patterns
export interface BaseCallbacks<T = any> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | string) => void;
  onChange?: (value: T) => void;
}

// Export composition utilities for type-safe combinations
export type FormFieldWithSize<T = {}> = T & BaseFormFieldProps & BaseSizeProps;
export type ModalWithSize<T = {}> = T & { isOpen: boolean; onClose: () => void } & BaseSizeProps;
export type ButtonWithVariant<T = {}> = T & BaseButtonProps & BaseVariantProps<ButtonVariant>;