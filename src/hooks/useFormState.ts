import { useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';

export interface ValidationRule<T = any> {
  rule: (value: T) => boolean;
  message: string;
}

export interface FieldConfig<T = any> {
  initialValue: T;
  validators?: ValidationRule<T>[];
  required?: boolean;
}

export interface FormField<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  isDirty: boolean;
}

export interface UseFormStateReturn<T extends Record<string, any>> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isDirty: Record<keyof T, boolean>;
  isValid: boolean;
  isFormDirty: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  handleChange: <K extends keyof T>(field: K) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  validateField: <K extends keyof T>(field: K) => boolean;
  validateForm: () => boolean;
  reset: () => void;
  resetField: <K extends keyof T>(field: K) => void;
}

export function useFormState<T extends Record<string, any>>(
  config: Record<keyof T, FieldConfig>
): UseFormStateReturn<T> {
  // Extract initial values from config
  const initialValues = Object.keys(config).reduce((acc, key) => {
    acc[key as keyof T] = config[key as keyof T].initialValue;
    return acc;
  }, {} as T);

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  // Calculate derived state
  const isDirty = Object.keys(config).reduce((acc, key) => {
    const fieldKey = key as keyof T;
    acc[fieldKey] = values[fieldKey] !== config[fieldKey].initialValue;
    return acc;
  }, {} as Record<keyof T, boolean>);

  const isValid = Object.values(errors).every(error => !error);
  const isFormDirty = Object.values(isDirty).some(dirty => dirty);

  const validateField = useCallback(<K extends keyof T>(field: K): boolean => {
    const fieldConfig = config[field];
    const value = values[field];

    // Check required
    if (fieldConfig.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      setErrorsState(prev => ({ ...prev, [field]: 'This field is required' }));
      return false;
    }

    // Run custom validators
    if (fieldConfig.validators) {
      for (const validator of fieldConfig.validators) {
        if (!validator.rule(value)) {
          setErrorsState(prev => ({ ...prev, [field]: validator.message }));
          return false;
        }
      }
    }

    setErrorsState(prev => ({ ...prev, [field]: null }));
    return true;
  }, [config, values]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    // Validate on change if field was previously touched
    if (touched[field]) {
      setTimeout(() => validateField(field), 0);
    }
  }, [touched, validateField]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const handleChange = useCallback(<K extends keyof T>(field: K) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setValue(field, value as T[K]);
    };
  }, [setValue]);

  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setErrorsState(prev => ({ ...prev, [field]: error }));
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }));
    if (touchedValue) {
      validateField(field);
    }
  }, [validateField]);

  const validateForm = useCallback((): boolean => {
    const fields = Object.keys(config) as (keyof T)[];
    const results = fields.map(field => validateField(field));

    // Mark all fields as touched
    setTouchedState(fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<keyof T, boolean>));

    return results.every(result => result);
  }, [config, validateField]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrorsState({} as Record<keyof T, string | null>);
    setTouchedState({} as Record<keyof T, boolean>);
  }, [initialValues]);

  const resetField = useCallback(<K extends keyof T>(field: K) => {
    setValuesState(prev => ({ ...prev, [field]: config[field].initialValue }));
    setErrorsState(prev => ({ ...prev, [field]: null }));
    setTouchedState(prev => ({ ...prev, [field]: false }));
  }, [config]);

  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isFormDirty,
    setValue,
    setValues,
    handleChange,
    setError,
    setTouched,
    validateField,
    validateForm,
    reset,
    resetField,
  };
}