// Phase 8: Component Prop Factories and Standardization Utilities
// Helper functions for creating consistent component props and event handlers

import React from 'react';
import type {
  BaseComponentProps,
  CommonEventHandlers,
  ModalComponentProps,
  FormComponentProps,
  ButtonComponentProps,
  CardComponentProps,
  ComponentSize,
  ComponentVariant,
  ClickHandler,
  ChangeHandler,
  FocusHandler,
  BlurHandler,
} from '../../types/shared/componentInterfaces';

// Prop factory utilities for creating consistent component props
export const propFactories = {
  // Base component props with sensible defaults
  base: (overrides: Partial<BaseComponentProps> = {}): BaseComponentProps => ({
    className: '',
    style: {},
    testId: undefined,
    'data-testid': undefined,
    ...overrides,
  }),

  // Common event handlers with no-op defaults
  eventHandlers: (overrides: Partial<CommonEventHandlers> = {}): CommonEventHandlers => ({
    onClick: () => {},
    onDoubleClick: () => {},
    onFocus: () => {},
    onBlur: () => {},
    onKeyDown: () => {},
    onKeyUp: () => {},
    onMouseEnter: () => {},
    onMouseLeave: () => {},
    ...overrides,
  }),

  // Modal component props
  modal: (overrides: Partial<ModalComponentProps> = {}): ModalComponentProps => ({
    ...propFactories.base(overrides),
    isOpen: false,
    onClose: () => {},
    onOpen: undefined,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    preventScroll: true,
    focusTrap: true,
    initialFocus: undefined,
    returnFocus: true,
    ...overrides,
  }),

  // Form component props
  form: (overrides: Partial<FormComponentProps> = {}): FormComponentProps => ({
    ...propFactories.base(overrides),
    name: undefined,
    value: undefined,
    defaultValue: undefined,
    onChange: () => {},
    onBlur: () => {},
    onFocus: () => {},
    error: null,
    warning: null,
    touched: false,
    dirty: false,
    required: false,
    disabled: false,
    readonly: false,
    placeholder: undefined,
    autoComplete: undefined,
    autoFocus: false,
    ...overrides,
  }),

  // Button component props
  button: (overrides: Partial<ButtonComponentProps> = {}): ButtonComponentProps => ({
    ...propFactories.base(overrides),
    ...propFactories.eventHandlers(overrides),
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    loadingText: 'Loading...',
    type: 'button',
    fullWidth: false,
    icon: undefined,
    iconPosition: 'left',
    ...overrides,
  }),

  // Card component props
  card: (overrides: Partial<CardComponentProps> = {}): CardComponentProps => ({
    ...propFactories.base(overrides),
    ...propFactories.eventHandlers(overrides),
    variant: 'elevated',
    padding: 'md',
    hoverable: false,
    clickable: false,
    loading: false,
    header: undefined,
    footer: undefined,
    actions: undefined,
    ...overrides,
  }),
};

// Event handler utilities for creating consistent event handlers
export const eventHandlerUtils = {
  // Create a click handler with common patterns
  createClickHandler: (
    handler: ClickHandler,
    options: {
      preventDefault?: boolean;
      stopPropagation?: boolean;
      disabled?: boolean;
      loading?: boolean;
      debounce?: number;
    } = {}
  ): ClickHandler => {
    let lastCall = 0;

    return (event) => {
      if (options.disabled || options.loading) {
        event.preventDefault();
        return;
      }

      if (options.preventDefault) {
        event.preventDefault();
      }

      if (options.stopPropagation) {
        event.stopPropagation();
      }

      // Debouncing
      if (options.debounce) {
        const now = Date.now();
        if (now - lastCall < options.debounce) {
          return;
        }
        lastCall = now;
      }

      handler(event);
    };
  },

  // Create a change handler with validation and formatting
  createChangeHandler: <T = any>(
    handler: ChangeHandler<T>,
    options: {
      validate?: (value: T) => boolean;
      format?: (value: any) => T;
      debounce?: number;
      disabled?: boolean;
    } = {}
  ): ChangeHandler<T> => {
    let timeoutId: NodeJS.Timeout;

    return (value, event) => {
      if (options.disabled) return;

      let formattedValue = value;

      // Apply formatting
      if (options.format) {
        formattedValue = options.format(value);
      }

      // Apply validation
      if (options.validate && !options.validate(formattedValue)) {
        return;
      }

      // Apply debouncing
      if (options.debounce) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handler(formattedValue, event);
        }, options.debounce);
      } else {
        handler(formattedValue, event);
      }
    };
  },

  // Create focus/blur handlers with common patterns
  createFocusHandlers: (
    onFocus?: FocusHandler,
    onBlur?: BlurHandler,
    options: {
      onFocusIn?: () => void;
      onFocusOut?: () => void;
      validateOnBlur?: boolean;
      clearErrorOnFocus?: boolean;
    } = {}
  ) => ({
    onFocus: (event: React.FocusEvent) => {
      if (options.clearErrorOnFocus) {
        // This would integrate with form state to clear errors
      }

      if (options.onFocusIn) {
        options.onFocusIn();
      }

      if (onFocus) {
        onFocus(event);
      }
    },

    onBlur: (event: React.FocusEvent) => {
      if (options.validateOnBlur) {
        // This would integrate with form validation
      }

      if (options.onFocusOut) {
        options.onFocusOut();
      }

      if (onBlur) {
        onBlur(event);
      }
    },
  }),

  // Create keyboard event handlers
  createKeyHandlers: (handlers: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onTab?: () => void;
    onSpace?: () => void;
    disabled?: boolean;
  }) => ({
    onKeyDown: (event: React.KeyboardEvent) => {
      if (handlers.disabled) return;

      switch (event.key) {
        case 'Enter':
          if (handlers.onEnter) {
            event.preventDefault();
            handlers.onEnter();
          }
          break;
        case 'Escape':
          if (handlers.onEscape) {
            event.preventDefault();
            handlers.onEscape();
          }
          break;
        case 'ArrowUp':
          if (handlers.onArrowUp) {
            event.preventDefault();
            handlers.onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (handlers.onArrowDown) {
            event.preventDefault();
            handlers.onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (handlers.onArrowLeft) {
            event.preventDefault();
            handlers.onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (handlers.onArrowRight) {
            event.preventDefault();
            handlers.onArrowRight();
          }
          break;
        case 'Tab':
          if (handlers.onTab) {
            handlers.onTab();
          }
          break;
        case ' ':
          if (handlers.onSpace) {
            event.preventDefault();
            handlers.onSpace();
          }
          break;
      }
    },
  }),
};

// Prop merging utilities
export const propUtils = {
  // Merge class names intelligently
  mergeClassNames: (...classNames: (string | undefined | null | false)[]): string => {
    return classNames.filter(Boolean).join(' ');
  },

  // Merge styles with precedence
  mergeStyles: (...styles: (React.CSSProperties | undefined)[]): React.CSSProperties => {
    return Object.assign({}, ...styles.filter(Boolean));
  },

  // Merge event handlers (compose them)
  mergeEventHandlers: <T extends (...args: any[]) => void>(
    ...handlers: (T | undefined)[]
  ): T => {
    const validHandlers = handlers.filter(Boolean) as T[];

    return ((...args: any[]) => {
      validHandlers.forEach(handler => handler(...args));
    }) as T;
  },

  // Extract data attributes
  extractDataAttributes: (props: Record<string, any>): Record<string, any> => {
    const dataAttributes: Record<string, any> = {};
    Object.keys(props).forEach(key => {
      if (key.startsWith('data-') || key.startsWith('aria-')) {
        dataAttributes[key] = props[key];
      }
    });
    return dataAttributes;
  },

  // Create responsive props
  createResponsiveProps: <T>(
    value: T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T },
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'
  ): T | undefined => {
    if (!value) return undefined;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const responsiveValue = value as { xs?: T; sm?: T; md?: T; lg?: T; xl?: T };

      // Return the value for the current breakpoint or fall back to smaller ones
      return responsiveValue[breakpoint] ||
             responsiveValue.md ||
             responsiveValue.sm ||
             responsiveValue.xs;
    }

    return value as T;
  },
};

// Component size utilities
export const sizeUtils = {
  // Get size-based dimensions
  getSizeDimensions: (size: ComponentSize): {
    padding: string;
    fontSize: string;
    height: string;
    borderRadius: string;
  } => {
    const sizeMap = {
      xs: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        height: '1.5rem',
        borderRadius: '0.25rem',
      },
      sm: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        height: '2rem',
        borderRadius: '0.375rem',
      },
      md: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        height: '2.5rem',
        borderRadius: '0.5rem',
      },
      lg: {
        padding: '0.625rem 1.25rem',
        fontSize: '1.125rem',
        height: '3rem',
        borderRadius: '0.5rem',
      },
      xl: {
        padding: '0.75rem 1.5rem',
        fontSize: '1.25rem',
        height: '3.5rem',
        borderRadius: '0.75rem',
      },
    };

    return sizeMap[size];
  },

  // Get icon size based on component size
  getIconSize: (size: ComponentSize): number => {
    const iconSizeMap = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    };

    return iconSizeMap[size];
  },
};

// Variant utilities
export const variantUtils = {
  // Get variant-based colors
  getVariantColors: (variant: ComponentVariant): {
    primary: string;
    secondary: string;
    background: string;
    border: string;
    text: string;
    hover: {
      primary: string;
      background: string;
      border: string;
    };
    active: {
      primary: string;
      background: string;
      border: string;
    };
    focus: {
      ring: string;
    };
  } => {
    const colorMaps = {
      primary: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        background: '#3b82f6',
        border: '#3b82f6',
        text: '#ffffff',
        hover: {
          primary: '#2563eb',
          background: '#2563eb',
          border: '#2563eb',
        },
        active: {
          primary: '#1e40af',
          background: '#1e40af',
          border: '#1e40af',
        },
        focus: {
          ring: '#3b82f6',
        },
      },
      secondary: {
        primary: '#6b7280',
        secondary: '#4b5563',
        background: '#f9fafb',
        border: '#e5e7eb',
        text: '#374151',
        hover: {
          primary: '#4b5563',
          background: '#f3f4f6',
          border: '#d1d5db',
        },
        active: {
          primary: '#374151',
          background: '#e5e7eb',
          border: '#9ca3af',
        },
        focus: {
          ring: '#6b7280',
        },
      },
      success: {
        primary: '#10b981',
        secondary: '#047857',
        background: '#10b981',
        border: '#10b981',
        text: '#ffffff',
        hover: {
          primary: '#059669',
          background: '#059669',
          border: '#059669',
        },
        active: {
          primary: '#047857',
          background: '#047857',
          border: '#047857',
        },
        focus: {
          ring: '#10b981',
        },
      },
      warning: {
        primary: '#f59e0b',
        secondary: '#d97706',
        background: '#f59e0b',
        border: '#f59e0b',
        text: '#ffffff',
        hover: {
          primary: '#e59e0b',
          background: '#e59e0b',
          border: '#e59e0b',
        },
        active: {
          primary: '#d97706',
          background: '#d97706',
          border: '#d97706',
        },
        focus: {
          ring: '#f59e0b',
        },
      },
      error: {
        primary: '#ef4444',
        secondary: '#dc2626',
        background: '#ef4444',
        border: '#ef4444',
        text: '#ffffff',
        hover: {
          primary: '#dc2626',
          background: '#dc2626',
          border: '#dc2626',
        },
        active: {
          primary: '#b91c1c',
          background: '#b91c1c',
          border: '#b91c1c',
        },
        focus: {
          ring: '#ef4444',
        },
      },
      info: {
        primary: '#06b6d4',
        secondary: '#0891b2',
        background: '#06b6d4',
        border: '#06b6d4',
        text: '#ffffff',
        hover: {
          primary: '#0891b2',
          background: '#0891b2',
          border: '#0891b2',
        },
        active: {
          primary: '#0e7490',
          background: '#0e7490',
          border: '#0e7490',
        },
        focus: {
          ring: '#06b6d4',
        },
      },
      neutral: {
        primary: '#6b7280',
        secondary: '#4b5563',
        background: '#ffffff',
        border: '#e5e7eb',
        text: '#374151',
        hover: {
          primary: '#4b5563',
          background: '#f9fafb',
          border: '#d1d5db',
        },
        active: {
          primary: '#374151',
          background: '#f3f4f6',
          border: '#9ca3af',
        },
        focus: {
          ring: '#6b7280',
        },
      },
    };

    return colorMaps[variant];
  },

  // Generate CSS classes for variants
  getVariantClasses: (
    variant: ComponentVariant,
    size: ComponentSize = 'md',
    disabled: boolean = false
  ): string => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs rounded',
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-md',
      lg: 'px-5 py-2.5 text-base rounded-lg',
      xl: 'px-6 py-3 text-lg rounded-lg',
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
      error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500',
      neutral: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return propUtils.mergeClassNames(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      disabledClasses
    );
  },
};

// Accessibility utilities
export const a11yUtils = {
  // Generate ARIA attributes for common patterns
  generateAriaAttributes: (options: {
    label?: string;
    labelledBy?: string;
    describedBy?: string;
    expanded?: boolean;
    controls?: string;
    hasPopup?: boolean | string;
    pressed?: boolean;
    selected?: boolean;
    checked?: boolean;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
    live?: 'polite' | 'assertive' | 'off';
  } = {}) => {
    const attributes: Record<string, any> = {};

    if (options.label) attributes['aria-label'] = options.label;
    if (options.labelledBy) attributes['aria-labelledby'] = options.labelledBy;
    if (options.describedBy) attributes['aria-describedby'] = options.describedBy;
    if (typeof options.expanded === 'boolean') attributes['aria-expanded'] = options.expanded;
    if (options.controls) attributes['aria-controls'] = options.controls;
    if (options.hasPopup) attributes['aria-haspopup'] = options.hasPopup;
    if (typeof options.pressed === 'boolean') attributes['aria-pressed'] = options.pressed;
    if (typeof options.selected === 'boolean') attributes['aria-selected'] = options.selected;
    if (typeof options.checked === 'boolean') attributes['aria-checked'] = options.checked;
    if (typeof options.disabled === 'boolean') attributes['aria-disabled'] = options.disabled;
    if (typeof options.required === 'boolean') attributes['aria-required'] = options.required;
    if (typeof options.invalid === 'boolean') attributes['aria-invalid'] = options.invalid;
    if (options.live) attributes['aria-live'] = options.live;

    return attributes;
  },

  // Generate role attributes
  generateRoleAttributes: (role: string, additionalAttributes: Record<string, any> = {}) => ({
    role,
    ...additionalAttributes,
  }),

  // Create focus management utilities
  createFocusManagement: () => {
    const trapFocus = (container: HTMLElement) => {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);
      firstElement?.focus();

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    };

    const restoreFocus = (previousElement: HTMLElement | null) => {
      if (previousElement && typeof previousElement.focus === 'function') {
        previousElement.focus();
      }
    };

    return { trapFocus, restoreFocus };
  },
};

// Event utilities (alias for propFactories.eventHandlers)
export const eventUtils = propFactories.eventHandlers;

// Component composition utilities
export const compositionUtils = {
  // Create compound component pattern helpers
  createCompoundComponent: <T extends Record<string, React.ComponentType<any>>>(
    components: T
  ) => {
    const CompoundComponent = components.Root as any;

    Object.keys(components).forEach(key => {
      if (key !== 'Root') {
        CompoundComponent[key] = components[key as keyof T];
      }
    });

    return CompoundComponent as T['Root'] & Omit<T, 'Root'>;
  },

  // Create polymorphic component utilities
  createPolymorphicComponent: <P extends Record<string, any>>(
    defaultElement: React.ElementType = 'div'
  ) => {
    return function PolymorphicComponent(
      props: P & { as?: React.ElementType }
    ) {
      const { as: Element = defaultElement, ...rest } = props;
      return React.createElement(Element, rest);
    };
  },

  // Create render prop utilities
  createRenderProp: <T>(
    render: (props: T) => React.ReactNode
  ) => ({
    children,
    render: renderProp,
    ...props
  }: {
    children?: (props: T) => React.ReactNode;
    render?: (props: T) => React.ReactNode;
  } & T) => {
    const renderFunction = children || renderProp || render;
    return renderFunction(props as T);
  },
};