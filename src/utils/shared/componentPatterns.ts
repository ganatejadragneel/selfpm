// Phase 8: Component Pattern Standards and API Consistency
// Standardized patterns for creating consistent component APIs

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type {
  BaseComponentProps,
  ComponentSize,
  ComponentVariant,
  CommonEventHandlers,
  FormComponentProps,
} from '../../types/shared/componentInterfaces';

// Context pattern for compound components
export function createCompoundComponentContext<T>() {
  const Context = createContext<T | undefined>(undefined);

  const useCompoundContext = (componentName: string) => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`${componentName} must be used within its parent component`);
    }
    return context;
  };

  return { Context, useCompoundContext };
}

// Standard prop validation patterns
export const propValidators = {
  // Validate size prop
  validateSize: (size?: ComponentSize): ComponentSize => {
    const validSizes: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    return validSizes.includes(size as ComponentSize) ? size as ComponentSize : 'md';
  },

  // Validate variant prop
  validateVariant: (variant?: ComponentVariant): ComponentVariant => {
    const validVariants: ComponentVariant[] = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'];
    return validVariants.includes(variant as ComponentVariant) ? variant as ComponentVariant : 'primary';
  },

  // Validate boolean with default
  validateBoolean: (value?: boolean, defaultValue: boolean = false): boolean => {
    return typeof value === 'boolean' ? value : defaultValue;
  },

  // Validate string with allowed values
  validateString: <T extends string>(
    value: T | undefined,
    allowedValues: T[],
    defaultValue: T
  ): T => {
    return allowedValues.includes(value as T) ? value as T : defaultValue;
  },

  // Validate number within range
  validateNumberRange: (
    value?: number,
    min: number = -Infinity,
    max: number = Infinity,
    defaultValue: number = 0
  ): number => {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    return Math.max(min, Math.min(max, value));
  },

  // Validate function prop
  validateFunction: <T extends (...args: any[]) => any>(
    fn: T | undefined,
    defaultFn: T
  ): T => {
    return typeof fn === 'function' ? fn : defaultFn;
  },
};

// Standard event handler patterns
export const eventPatterns = {
  // Create standardized click handler
  createClickHandler: (
    onClick?: (event: React.MouseEvent) => void,
    options: {
      preventDefault?: boolean;
      stopPropagation?: boolean;
      disabled?: boolean;
      analytics?: {
        event: string;
        properties?: Record<string, any>;
      };
    } = {}
  ) => {
    return useCallback((event: React.MouseEvent) => {
      if (options.disabled) {
        event.preventDefault();
        return;
      }

      if (options.preventDefault) {
        event.preventDefault();
      }

      if (options.stopPropagation) {
        event.stopPropagation();
      }

      // Analytics tracking
      if (options.analytics) {
        // Track analytics event (integration point)
      }

      onClick?.(event);
    }, [onClick, options.disabled, options.preventDefault, options.stopPropagation, options.analytics]);
  },

  // Create standardized form change handler
  createChangeHandler: <T = any>(
    onChange?: (value: T, event?: any) => void,
    options: {
      validate?: (value: T) => boolean;
      transform?: (value: any) => T;
      debounce?: number;
      disabled?: boolean;
    } = {}
  ) => {
    let timeoutId: NodeJS.Timeout;

    return useCallback((value: any, event?: any) => {
      if (options.disabled) return;

      let processedValue = value;

      // Transform value
      if (options.transform) {
        processedValue = options.transform(value);
      }

      // Validate value
      if (options.validate && !options.validate(processedValue)) {
        return;
      }

      // Handle debouncing
      if (options.debounce && options.debounce > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onChange?.(processedValue, event);
        }, options.debounce);
      } else {
        onChange?.(processedValue, event);
      }
    }, [onChange, options.disabled, options.validate, options.transform, options.debounce]);
  },
};

// Standard prop merging patterns
export const propMergers = {
  // Merge base component props
  mergeBaseProps: (
    defaultProps: Partial<BaseComponentProps>,
    userProps: Partial<BaseComponentProps>
  ): BaseComponentProps => {
    return {
      className: [defaultProps.className, userProps.className].filter(Boolean).join(' '),
      style: { ...defaultProps.style, ...userProps.style },
      children: userProps.children !== undefined ? userProps.children : defaultProps.children,
      testId: userProps.testId || defaultProps.testId,
      'data-testid': userProps['data-testid'] || defaultProps['data-testid'],
      ...defaultProps,
      ...userProps,
    };
  },

  // Merge event handlers
  mergeEventHandlers: (
    defaultHandlers: Partial<CommonEventHandlers>,
    userHandlers: Partial<CommonEventHandlers>
  ): CommonEventHandlers => {
    const mergedHandlers: CommonEventHandlers = {};

    // Merge each handler type
    Object.keys({ ...defaultHandlers, ...userHandlers }).forEach(key => {
      const handlerKey = key as keyof CommonEventHandlers;
      const defaultHandler = defaultHandlers[handlerKey];
      const userHandler = userHandlers[handlerKey];

      if (defaultHandler && userHandler) {
        // Compose both handlers
        mergedHandlers[handlerKey] = ((event: any) => {
          defaultHandler(event);
          userHandler(event);
        }) as any;
      } else {
        // Use the available handler
        mergedHandlers[handlerKey] = (userHandler || defaultHandler) as any;
      }
    });

    return mergedHandlers;
  },

  // Merge form props
  mergeFormProps: (
    defaultProps: Partial<FormComponentProps>,
    userProps: Partial<FormComponentProps>
  ): FormComponentProps => {
    return {
      ...propMergers.mergeBaseProps(defaultProps, userProps),
      name: userProps.name || defaultProps.name,
      value: userProps.value !== undefined ? userProps.value : defaultProps.value,
      defaultValue: userProps.defaultValue !== undefined ? userProps.defaultValue : defaultProps.defaultValue,
      onChange: userProps.onChange || defaultProps.onChange || (() => {}),
      onBlur: userProps.onBlur || defaultProps.onBlur || (() => {}),
      onFocus: userProps.onFocus || defaultProps.onFocus || (() => {}),
      error: userProps.error !== undefined ? userProps.error : defaultProps.error,
      warning: userProps.warning !== undefined ? userProps.warning : defaultProps.warning,
      touched: userProps.touched !== undefined ? userProps.touched : defaultProps.touched,
      dirty: userProps.dirty !== undefined ? userProps.dirty : defaultProps.dirty,
      required: userProps.required !== undefined ? userProps.required : defaultProps.required,
      disabled: userProps.disabled !== undefined ? userProps.disabled : defaultProps.disabled,
      readonly: userProps.readonly !== undefined ? userProps.readonly : defaultProps.readonly,
      placeholder: userProps.placeholder || defaultProps.placeholder,
      autoComplete: userProps.autoComplete || defaultProps.autoComplete,
      autoFocus: userProps.autoFocus !== undefined ? userProps.autoFocus : defaultProps.autoFocus,
      ...defaultProps,
      ...userProps,
    };
  },
};

// Component state patterns
export const statePatterns = {
  // Create controlled/uncontrolled state pattern
  useControlledState: <T>(
    controlledValue?: T,
    defaultValue?: T,
    onChange?: (value: T) => void
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);

    const value = isControlled ? controlledValue : internalValue;

    const setValue = useCallback((newValue: T) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }, [isControlled, onChange]);

    return [value, setValue, isControlled] as const;
  },

  // Create toggle state pattern
  useToggleState: (
    initialValue: boolean = false,
    onToggle?: (value: boolean) => void
  ) => {
    const [value, setValue] = React.useState(initialValue);

    const toggle = useCallback(() => {
      const newValue = !value;
      setValue(newValue);
      onToggle?.(newValue);
    }, [value, onToggle]);

    const setTrue = useCallback(() => {
      setValue(true);
      onToggle?.(true);
    }, [onToggle]);

    const setFalse = useCallback(() => {
      setValue(false);
      onToggle?.(false);
    }, [onToggle]);

    return { value, toggle, setTrue, setFalse };
  },

  // Create loading state pattern
  useLoadingState: (
    initialLoading: boolean = false
  ) => {
    const [isLoading, setIsLoading] = React.useState(initialLoading);
    const [error, setError] = React.useState<string | null>(null);

    const startLoading = useCallback(() => {
      setIsLoading(true);
      setError(null);
    }, []);

    const stopLoading = useCallback(() => {
      setIsLoading(false);
    }, []);

    const setLoadingError = useCallback((error: string | Error) => {
      setIsLoading(false);
      setError(error instanceof Error ? error.message : error);
    }, []);

    const reset = useCallback(() => {
      setIsLoading(false);
      setError(null);
    }, []);

    return {
      isLoading,
      error,
      startLoading,
      stopLoading,
      setLoadingError,
      reset,
    };
  },

  // Create selection state pattern
  useSelectionState: <T>(
    items: T[],
    keyExtractor: (item: T, index: number) => string | number = (_, index) => index
  ) => {
    const [selectedItems, setSelectedItems] = React.useState<Set<string | number>>(new Set());

    const isSelected = useCallback((item: T) => {
      return selectedItems.has(keyExtractor(item, 0));
    }, [selectedItems, keyExtractor]);

    const select = useCallback((item: T) => {
      const key = keyExtractor(item, 0);
      setSelectedItems(prev => new Set(prev).add(key));
    }, [keyExtractor]);

    const deselect = useCallback((item: T) => {
      const key = keyExtractor(item, 0);
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, [keyExtractor]);

    const toggle = useCallback((item: T) => {
      const key = keyExtractor(item, 0);
      setSelectedItems(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    }, [keyExtractor]);

    const selectAll = useCallback(() => {
      setSelectedItems(new Set(items.map(keyExtractor)));
    }, [items, keyExtractor]);

    const deselectAll = useCallback(() => {
      setSelectedItems(new Set());
    }, []);

    const selectedItemsList = useMemo(() => {
      return items.filter((item, index) => selectedItems.has(keyExtractor(item, index)));
    }, [items, selectedItems, keyExtractor]);

    return {
      selectedItems: selectedItemsList,
      selectedKeys: Array.from(selectedItems),
      isSelected,
      select,
      deselect,
      toggle,
      selectAll,
      deselectAll,
      hasSelection: selectedItems.size > 0,
      selectionCount: selectedItems.size,
    };
  },
};

// Component composition patterns
export const compositionPatterns = {
  // Create render prop component
  createRenderProp: <TProps, TRenderProps>(
    useHook: (props: TProps) => TRenderProps
  ) => {
    return (props: TProps & {
      children?: (renderProps: TRenderProps) => React.ReactNode;
      render?: (renderProps: TRenderProps) => React.ReactNode;
    }) => {
      const { children, render, ...hookProps } = props;
      const renderProps = useHook(hookProps as TProps);

      const renderFunction = children || render;
      return renderFunction ? renderFunction(renderProps) : null;
    };
  },

  // Create compound component structure
  createCompoundComponent: <TContext, TComponents extends Record<string, React.ComponentType<any>>>(
    context: React.Context<TContext>,
    components: TComponents
  ) => {
    const CompoundComponent = components.Root as any;

    // Attach sub-components
    Object.keys(components).forEach(key => {
      if (key !== 'Root') {
        CompoundComponent[key] = components[key as keyof TComponents];
      }
    });

    // Attach context hook
    CompoundComponent.useContext = () => {
      const contextValue = useContext(context);
      if (!contextValue) {
        throw new Error(`useContext must be used within ${CompoundComponent.displayName || 'Compound Component'}`);
      }
      return contextValue;
    };

    return CompoundComponent as TComponents['Root'] & Omit<TComponents, 'Root'> & {
      useContext: () => TContext;
    };
  },

  // Create polymorphic component
  createPolymorphic: <TDefaultElement extends React.ElementType, TProps extends {}>(
    component: React.ComponentType<TProps & { as?: React.ElementType }>
  ) => {
    return component as <TElement extends React.ElementType = TDefaultElement>(
      props: TProps & { as?: TElement } & Omit<React.ComponentPropsWithoutRef<TElement>, keyof TProps>
    ) => React.ReactElement;
  },
};

// API consistency patterns
export const apiPatterns = {
  // Create consistent component API
  createComponentAPI: <TProps extends BaseComponentProps>(
    component: React.ComponentType<TProps>,
    options: {
      defaultProps?: Partial<TProps>;
      displayName?: string;
      validateProps?: (props: TProps) => TProps;
    } = {}
  ) => {
    const ComponentWithAPI = (props: TProps) => {
      // Merge with default props
      const mergedProps = options.defaultProps
        ? { ...options.defaultProps, ...props }
        : props;

      // Validate props if validator provided
      const validatedProps = options.validateProps
        ? options.validateProps(mergedProps)
        : mergedProps;

      return React.createElement(component, validatedProps);
    };

    ComponentWithAPI.displayName = options.displayName || component.displayName || component.name;

    return ComponentWithAPI;
  },

  // Create consistent event API
  createEventAPI: <TEvents extends Record<string, (...args: any[]) => any>>(
    events: TEvents,
    options: {
      analytics?: boolean;
      validation?: boolean;
      debounce?: number;
    } = {}
  ) => {
    const eventAPI = {} as TEvents;

    Object.keys(events).forEach(eventName => {
      const originalHandler = events[eventName];

      eventAPI[eventName as keyof TEvents] = ((...args: any[]) => {
        // Add analytics tracking
        if (options.analytics) {
        }

        // Add validation if needed
        if (options.validation) {
          // Validation logic here
        }

        // Handle debouncing
        if (options.debounce && options.debounce > 0) {
          const timeoutKey = `${eventName}_timeout`;
          const existingTimeout = (globalThis as any)[timeoutKey];
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          (globalThis as any)[timeoutKey] = setTimeout(() => {
            originalHandler(...args);
            delete (globalThis as any)[timeoutKey];
          }, options.debounce);
        } else {
          originalHandler(...args);
        }
      }) as TEvents[keyof TEvents];
    });

    return eventAPI;
  },

  // Create consistent data API
  createDataAPI: <TData, TOperations extends Record<string, (...args: any[]) => any>>(
    initialData: TData,
    operations: TOperations,
    options: {
      onDataChange?: (data: TData) => void;
      validation?: (data: TData) => boolean;
      persistence?: {
        key: string;
        storage?: 'localStorage' | 'sessionStorage';
      };
    } = {}
  ) => {
    const [data, setData] = React.useState<TData>(initialData);

    // Create enhanced operations
    const enhancedOperations = {} as TOperations;

    Object.keys(operations).forEach(operationName => {
      const originalOperation = operations[operationName];

      enhancedOperations[operationName as keyof TOperations] = ((...args: any[]) => {
        const result = originalOperation(data, ...args);

        // If operation returns new data, update state
        if (result && result !== data) {
          // Validate if validator provided
          if (options.validation && !options.validation(result)) {
            return data;
          }

          setData(result);

          // Trigger change callback
          options.onDataChange?.(result);

          // Handle persistence
          if (options.persistence) {
            const storage = options.persistence.storage === 'sessionStorage'
              ? sessionStorage
              : localStorage;
            storage.setItem(options.persistence.key, JSON.stringify(result));
          }
        }

        return result;
      }) as TOperations[keyof TOperations];
    });

    return {
      data,
      setData,
      ...enhancedOperations,
    };
  },
};