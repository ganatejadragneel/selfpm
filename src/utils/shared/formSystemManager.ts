// Phase 7: Enhanced Form System Management
// Advanced form handling with validation, submission, and integration with Phase 6 state management

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSmartLoadingState } from './loadingStateManager';
import { useOperationFeedback } from './notificationStateManager';

// Enhanced field configuration
export interface EnhancedFieldConfig<T = any> {
  initialValue: T;
  validators?: FieldValidator<T>[];
  required?: boolean;
  transform?: (value: any) => T;
  asyncValidator?: (value: T) => Promise<string | null>;
  debounceMs?: number;
  dependsOn?: string[];
  conditionalValidation?: (formValues: Record<string, any>) => boolean;
  formatting?: {
    onBlur?: (value: T) => T;
    onFocus?: (value: T) => T;
    displayFormat?: (value: T) => string;
    parseFormat?: (display: string) => T;
  };
}

// Enhanced field validator
export interface FieldValidator<T = any> {
  rule: (value: T, formValues?: Record<string, any>) => boolean | Promise<boolean>;
  message: string | ((value: T, formValues?: Record<string, any>) => string);
  when?: (formValues: Record<string, any>) => boolean; // Conditional validation
}

// Form field state with enhanced metadata
export interface EnhancedFormField<T = any> {
  value: T;
  displayValue?: string;
  error: string | null;
  warning: string | null;
  touched: boolean;
  isDirty: boolean;
  isValid: boolean;
  isValidating: boolean;
  focused: boolean;
  visited: boolean;
}

// Form submission states
export const FormSubmissionState = {
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATING: 'validating'
} as const;

export type FormSubmissionState = typeof FormSubmissionState[keyof typeof FormSubmissionState];

// Enhanced form state return type
export interface EnhancedFormReturn<T extends Record<string, any>> {
  // Field state
  values: T;
  displayValues: Record<keyof T, string>;
  errors: Record<keyof T, string | null>;
  warnings: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isDirty: Record<keyof T, boolean>;
  isValid: Record<keyof T, boolean>;
  isValidating: Record<keyof T, boolean>;
  focused: Record<keyof T, boolean>;
  visited: Record<keyof T, boolean>;

  // Form-level state
  isFormValid: boolean;
  isFormDirty: boolean;
  isFormTouched: boolean;
  isFormValidating: boolean;
  submissionState: FormSubmissionState;
  submitAttempts: number;

  // Field operations
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setWarning: <K extends keyof T>(field: K, warning: string | null) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  setFocused: <K extends keyof T>(field: K, focused?: boolean) => void;

  // Field handlers
  handleChange: <K extends keyof T>(field: K) => (e: React.ChangeEvent<any>) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
  handleFocus: <K extends keyof T>(field: K) => () => void;

  // Validation
  validateField: <K extends keyof T>(field: K) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  revalidateForm: () => Promise<boolean>;

  // Form operations
  reset: () => void;
  resetField: <K extends keyof T>(field: K) => void;
  submit: (submitFn: (values: T) => Promise<any>) => Promise<boolean>;

  // Utilities
  getFieldProps: <K extends keyof T>(field: K) => {
    value: string;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: () => void;
    onFocus: () => void;
    error: string | null;
    warning: string | null;
    touched: boolean;
    required: boolean;
  };
  canSubmit: boolean;
  isDependencyValid: (field: keyof T) => boolean;
}

// Advanced form hook with comprehensive features
export const useEnhancedForm = <T extends Record<string, any>>(
  config: Record<keyof T, EnhancedFieldConfig>,
  options: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    autoSave?: {
      enabled: boolean;
      key: string;
      debounceMs?: number;
    };
    onSubmitSuccess?: (result: any) => void;
    onSubmitError?: (error: string) => void;
  } = {}
): EnhancedFormReturn<T> => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    autoSave,
    onSubmitSuccess,
    onSubmitError
  } = options;

  // Extract initial values
  const initialValues = Object.keys(config).reduce((acc, key) => {
    acc[key as keyof T] = config[key as keyof T].initialValue;
    return acc;
  }, {} as T);

  // State management
  const [values, setValuesState] = useState<T>(initialValues);
  const [displayValues, setDisplayValues] = useState<Record<keyof T, string>>(() =>
    Object.keys(config).reduce((acc, key) => {
      const fieldConfig = config[key as keyof T];
      const value = fieldConfig.initialValue;
      acc[key as keyof T] = fieldConfig.formatting?.displayFormat?.(value) ?? String(value);
      return acc;
    }, {} as Record<keyof T, string>)
  );

  const [errors, setErrorsState] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  const [warnings, setWarningsState] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [focused, setFocusedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [visited, setVisitedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isValidating, setIsValidatingState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const [submissionState, setSubmissionState] = useState<FormSubmissionState>(FormSubmissionState.IDLE);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  // Validation timeouts for debouncing
  const validationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Integration with Phase 6 state management
  const loadingState = useSmartLoadingState();
  const feedback = useOperationFeedback();

  // Computed state
  const isDirty = Object.keys(config).reduce((acc, key) => {
    const fieldKey = key as keyof T;
    acc[fieldKey] = values[fieldKey] !== config[fieldKey].initialValue;
    return acc;
  }, {} as Record<keyof T, boolean>);

  const isValid = Object.keys(config).reduce((acc, key) => {
    const fieldKey = key as keyof T;
    acc[fieldKey] = !errors[fieldKey];
    return acc;
  }, {} as Record<keyof T, boolean>);

  const isFormValid = Object.values(isValid).every(valid => valid) && !Object.values(isValidating).some(validating => validating);
  const isFormDirty = Object.values(isDirty).some(dirty => dirty);
  const isFormTouched = Object.values(touched).some(touch => touch);
  const isFormValidating = Object.values(isValidating).some(validating => validating);
  const canSubmit = isFormValid && !isFormValidating && submissionState !== FormSubmissionState.SUBMITTING;

  // Field validation with async support
  const validateField = useCallback(async <K extends keyof T>(field: K): Promise<boolean> => {
    const fieldConfig = config[field];
    const value = values[field];

    // Clear existing timeout
    const timeoutKey = String(field);
    const existingTimeout = validationTimeouts.current.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      validationTimeouts.current.delete(timeoutKey);
    }

    // Check conditional validation
    if (fieldConfig.conditionalValidation && !fieldConfig.conditionalValidation(values)) {
      setErrorsState(prev => ({ ...prev, [field]: null }));
      return true;
    }

    // Set validating state
    setIsValidatingState(prev => ({ ...prev, [field]: true }));

    try {
      // Check required
      if (fieldConfig.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        setErrorsState(prev => ({ ...prev, [field]: 'This field is required' }));
        return false;
      }

      // Run sync validators
      if (fieldConfig.validators) {
        for (const validator of fieldConfig.validators) {
          // Check conditional validation
          if (validator.when && !validator.when(values)) {
            continue;
          }

          const isValid = await validator.rule(value, values);
          if (!isValid) {
            const message = typeof validator.message === 'function'
              ? validator.message(value, values)
              : validator.message;
            setErrorsState(prev => ({ ...prev, [field]: message }));
            return false;
          }
        }
      }

      // Run async validator
      if (fieldConfig.asyncValidator) {
        const asyncError = await fieldConfig.asyncValidator(value);
        if (asyncError) {
          setErrorsState(prev => ({ ...prev, [field]: asyncError }));
          return false;
        }
      }

      setErrorsState(prev => ({ ...prev, [field]: null }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation error';
      setErrorsState(prev => ({ ...prev, [field]: errorMessage }));
      return false;
    } finally {
      setIsValidatingState(prev => ({ ...prev, [field]: false }));
    }
  }, [config, values]);

  // Debounced validation
  const debouncedValidateField = useCallback(<K extends keyof T>(field: K) => {
    const fieldConfig = config[field];
    const debounceMs = fieldConfig.debounceMs ?? 300;

    const timeoutKey = String(field);
    const existingTimeout = validationTimeouts.current.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      validateField(field);
      validationTimeouts.current.delete(timeoutKey);
    }, debounceMs);

    validationTimeouts.current.set(timeoutKey, timeoutId);
  }, [config, validateField]);

  // Set field value with transformation and validation
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    const fieldConfig = config[field];

    // Apply transformation
    const transformedValue = fieldConfig.transform ? fieldConfig.transform(value) : value;

    // Update values
    setValuesState(prev => ({ ...prev, [field]: transformedValue }));

    // Update display value
    const displayValue = fieldConfig.formatting?.displayFormat?.(transformedValue) ?? String(transformedValue);
    setDisplayValues(prev => ({ ...prev, [field]: displayValue }));

    // Validate if configured and field was touched
    if (validateOnChange && touched[field]) {
      debouncedValidateField(field);
    }

    // Validate dependent fields
    Object.keys(config).forEach(key => {
      const fieldKey = key as keyof T;
      const dependsOn = config[fieldKey].dependsOn;
      if (dependsOn && dependsOn.includes(String(field))) {
        if (touched[fieldKey]) {
          debouncedValidateField(fieldKey);
        }
      }
    });

    // Auto-save if configured
    if (autoSave?.enabled) {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
      autoSaveTimeout.current = setTimeout(() => {
        const updatedValues = { ...values, [field]: transformedValue };
        localStorage.setItem(autoSave.key, JSON.stringify(updatedValues));
      }, autoSave.debounceMs ?? 1000);
    }
  }, [config, touched, validateOnChange, debouncedValidateField, autoSave, values]);

  // Handle input changes
  const handleChange = useCallback(<K extends keyof T>(field: K) => {
    return (e: React.ChangeEvent<any>) => {
      const { type, value, checked, files } = e.target;
      let newValue: any;

      switch (type) {
        case 'checkbox':
          newValue = checked;
          break;
        case 'file':
          newValue = files;
          break;
        case 'number':
          newValue = value === '' ? '' : Number(value);
          break;
        default:
          newValue = value;
      }

      setValue(field, newValue as T[K]);
    };
  }, [setValue]);

  // Handle field blur
  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    return () => {
      const fieldConfig = config[field];

      setFocusedState(prev => ({ ...prev, [field]: false }));
      setTouchedState(prev => ({ ...prev, [field]: true }));

      // Apply blur formatting
      if (fieldConfig.formatting?.onBlur) {
        const formattedValue = fieldConfig.formatting.onBlur(values[field]);
        setValue(field, formattedValue);
      }

      // Validate on blur if configured
      if (validateOnBlur) {
        validateField(field);
      }
    };
  }, [config, values, setValue, validateField, validateOnBlur]);

  // Handle field focus
  const handleFocus = useCallback(<K extends keyof T>(field: K) => {
    return () => {
      const fieldConfig = config[field];

      setFocusedState(prev => ({ ...prev, [field]: true }));
      setVisitedState(prev => ({ ...prev, [field]: true }));

      // Apply focus formatting
      if (fieldConfig.formatting?.onFocus) {
        const formattedValue = fieldConfig.formatting.onFocus(values[field]);
        setValue(field, formattedValue);
      }
    };
  }, [config, values, setValue]);

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    setSubmissionState(FormSubmissionState.VALIDATING);

    const fields = Object.keys(config) as (keyof T)[];
    const validationPromises = fields.map(field => validateField(field));
    const results = await Promise.all(validationPromises);

    // Mark all fields as touched
    setTouchedState(fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<keyof T, boolean>));

    const isValid = results.every(result => result);
    setSubmissionState(isValid ? FormSubmissionState.IDLE : FormSubmissionState.ERROR);

    return isValid;
  }, [config, validateField]);

  // Enhanced form submission
  const submit = useCallback(async (submitFn: (values: T) => Promise<any>): Promise<boolean> => {
    setSubmitAttempts(prev => prev + 1);
    setSubmissionState(FormSubmissionState.SUBMITTING);
    loadingState.startLoading();

    try {
      // Validate form first
      const isValid = await validateForm();
      if (!isValid) {
        feedback.validationError('Form', 'Please correct the errors and try again');
        return false;
      }

      // Submit form
      const result = await submitFn(values);

      setSubmissionState(FormSubmissionState.SUCCESS);
      loadingState.completeLoading(true);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';

      setSubmissionState(FormSubmissionState.ERROR);
      loadingState.completeLoading(false);

      feedback.operationFailed('Form submission', errorMessage);

      if (onSubmitError) {
        onSubmitError(errorMessage);
      }

      return false;
    }
  }, [values, validateForm, loadingState, feedback, onSubmitSuccess, onSubmitError]);

  // Auto-load from localStorage if configured
  useEffect(() => {
    if (autoSave?.enabled) {
      try {
        const savedData = localStorage.getItem(autoSave.key);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setValuesState(prev => ({ ...prev, ...parsedData }));
        }
      } catch (error) {
        console.warn('Failed to load auto-saved form data:', error);
      }
    }
  }, [autoSave]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      validationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, []);

  // Utility functions
  const setValues = useCallback((newValues: Partial<T>) => {
    Object.entries(newValues).forEach(([key, value]) => {
      setValue(key as keyof T, value as T[keyof T]);
    });
  }, [setValue]);

  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrorsState(prev => ({ ...prev, [field]: error }));
  }, []);

  const setWarning = useCallback(<K extends keyof T>(field: K, warning: string | null) => {
    setWarningsState(prev => ({ ...prev, [field]: warning }));
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }));
    if (touchedValue && validateOnChange) {
      validateField(field);
    }
  }, [validateField, validateOnChange]);

  const setFocused = useCallback(<K extends keyof T>(field: K, focusedValue = true) => {
    setFocusedState(prev => ({ ...prev, [field]: focusedValue }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setDisplayValues(() =>
      Object.keys(config).reduce((acc, key) => {
        const fieldConfig = config[key as keyof T];
        const value = fieldConfig.initialValue;
        acc[key as keyof T] = fieldConfig.formatting?.displayFormat?.(value) ?? String(value);
        return acc;
      }, {} as Record<keyof T, string>)
    );
    setErrorsState({} as Record<keyof T, string | null>);
    setWarningsState({} as Record<keyof T, string | null>);
    setTouchedState({} as Record<keyof T, boolean>);
    setFocusedState({} as Record<keyof T, boolean>);
    setVisitedState({} as Record<keyof T, boolean>);
    setIsValidatingState({} as Record<keyof T, boolean>);
    setSubmissionState(FormSubmissionState.IDLE);
    setSubmitAttempts(0);
    loadingState.reset();

    if (autoSave?.enabled) {
      localStorage.removeItem(autoSave.key);
    }
  }, [initialValues, config, loadingState, autoSave]);

  const resetField = useCallback(<K extends keyof T>(field: K) => {
    const fieldConfig = config[field];
    setValue(field, fieldConfig.initialValue);
    setErrorsState(prev => ({ ...prev, [field]: null }));
    setWarningsState(prev => ({ ...prev, [field]: null }));
    setTouchedState(prev => ({ ...prev, [field]: false }));
    setFocusedState(prev => ({ ...prev, [field]: false }));
    setVisitedState(prev => ({ ...prev, [field]: false }));
    setIsValidatingState(prev => ({ ...prev, [field]: false }));
  }, [config, setValue]);

  const revalidateForm = useCallback(async () => {
    return validateForm();
  }, [validateForm]);

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      value: displayValues[field] || '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      onFocus: handleFocus(field),
      error: errors[field],
      warning: warnings[field],
      touched: touched[field],
      required: config[field].required || false,
    };
  }, [displayValues, handleChange, handleBlur, handleFocus, errors, warnings, touched, config]);

  const isDependencyValid = useCallback((field: keyof T) => {
    const fieldConfig = config[field];
    if (!fieldConfig.dependsOn) return true;

    return fieldConfig.dependsOn.every(dep => isValid[dep as keyof T]);
  }, [config, isValid]);

  return {
    // Field state
    values,
    displayValues,
    errors,
    warnings,
    touched,
    isDirty,
    isValid,
    isValidating,
    focused,
    visited,

    // Form-level state
    isFormValid,
    isFormDirty,
    isFormTouched,
    isFormValidating,
    submissionState,
    submitAttempts,

    // Field operations
    setValue,
    setValues,
    setError,
    setWarning,
    setTouched,
    setFocused,

    // Field handlers
    handleChange,
    handleBlur,
    handleFocus,

    // Validation
    validateField,
    validateForm,
    revalidateForm,

    // Form operations
    reset,
    resetField,
    submit,

    // Utilities
    getFieldProps,
    canSubmit,
    isDependencyValid,
  };
};