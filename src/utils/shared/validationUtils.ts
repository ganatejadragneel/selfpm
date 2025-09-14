// Phase 3: Validation Utilities
// Comprehensive validation functions for forms and data

// Basic validation functions
export const validators = {
  // String validations
  required: (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && value.trim().length > 0;
  },

  minLength: (min: number) => (value: string): boolean => {
    return value.length >= min;
  },

  maxLength: (max: number) => (value: string): boolean => {
    return value.length <= max;
  },

  // Email validation
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // URL validation
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // Number validations
  isNumber: (value: string): boolean => {
    return !isNaN(Number(value)) && isFinite(Number(value));
  },

  min: (min: number) => (value: number): boolean => {
    return value >= min;
  },

  max: (max: number) => (value: number): boolean => {
    return value <= max;
  },

  range: (min: number, max: number) => (value: number): boolean => {
    return value >= min && value <= max;
  },

  // Date validations
  isDate: (value: string): boolean => {
    return !isNaN(Date.parse(value));
  },

  isFutureDate: (value: string): boolean => {
    return new Date(value) > new Date();
  },

  isPastDate: (value: string): boolean => {
    return new Date(value) < new Date();
  },

  // Pattern validations
  pattern: (regex: RegExp) => (value: string): boolean => {
    return regex.test(value);
  },

  // Phone validation (basic)
  phone: (value: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
  },

  // Password strength
  strongPassword: (value: string): boolean => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(value);
  },
};

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validation rule interface
export interface ValidationRule<T = any> {
  validator: (value: T) => boolean;
  message: string;
}

// Field validation function
export const validateField = <T = any>(
  value: T,
  rules: ValidationRule<T>[]
): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Object validation function
export const validateObject = <T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, ValidationRule<any>[]>
): Record<keyof T, ValidationResult> & { isValid: boolean } => {
  const results = {} as Record<keyof T, ValidationResult>;
  let isValid = true;

  for (const key in schema) {
    const fieldResult = validateField(obj[key], schema[key]);
    results[key] = fieldResult;
    if (!fieldResult.isValid) {
      isValid = false;
    }
  }

  return { ...results, isValid };
};

// Common validation rule factories
export const rules = {
  required: (message = 'This field is required'): ValidationRule<string> => ({
    validator: validators.required,
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validator: validators.minLength(min),
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validator: validators.maxLength(max),
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
    validator: validators.email,
    message,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
    validator: validators.url,
    message,
  }),

  number: (message = 'Please enter a valid number'): ValidationRule<string> => ({
    validator: validators.isNumber,
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validator: validators.min(min),
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validator: validators.max(max),
    message: message || `Must be no more than ${max}`,
  }),

  range: (min: number, max: number, message?: string): ValidationRule<number> => ({
    validator: validators.range(min, max),
    message: message || `Must be between ${min} and ${max}`,
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule<string> => ({
    validator: validators.pattern(regex),
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule<string> => ({
    validator: validators.phone,
    message,
  }),

  strongPassword: (message = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'): ValidationRule<string> => ({
    validator: validators.strongPassword,
    message,
  }),

  custom: <T = any>(validator: (value: T) => boolean, message: string): ValidationRule<T> => ({
    validator,
    message,
  }),
};

// Task-specific validation rules
export const taskValidationRules = {
  title: [
    rules.required('Task title is required'),
    rules.minLength(1, 'Task title cannot be empty'),
    rules.maxLength(200, 'Task title must be less than 200 characters'),
  ],

  description: [
    rules.maxLength(1000, 'Description must be less than 1000 characters'),
  ],

  dueDate: [
    rules.custom(
      (value: string) => !value || validators.isDate(value),
      'Please enter a valid date'
    ),
  ],

  priority: [
    rules.custom(
      (value: string) => ['low', 'medium', 'high', 'urgent'].includes(value),
      'Please select a valid priority'
    ),
  ],

  category: [
    rules.custom(
      (value: string) => ['life_admin', 'work', 'weekly_recurring'].includes(value),
      'Please select a valid category'
    ),
  ],

  progress: [
    rules.custom(
      (value: number) => validators.range(0, 100)(value),
      'Progress must be between 0 and 100'
    ),
  ],

  estimatedDuration: [
    rules.custom(
      (value: number) => !value || validators.min(1)(value),
      'Estimated duration must be at least 1 minute'
    ),
  ],
};

// Form validation helpers
export const formValidationUtils = {
  // Get first error message from validation result
  getFirstError: (result: ValidationResult): string | null => {
    return result.errors.length > 0 ? result.errors[0] : null;
  },

  // Get all error messages as a single string
  getAllErrors: (result: ValidationResult, separator = '. '): string => {
    return result.errors.join(separator);
  },

  // Check if any field has errors
  hasErrors: <T extends Record<string, any>>(
    results: Record<keyof T, ValidationResult>
  ): boolean => {
    return Object.values(results).some((result: any) => !result.isValid);
  },

  // Get all field errors as flat array
  getAllFieldErrors: <T extends Record<string, any>>(
    results: Record<keyof T, ValidationResult>
  ): string[] => {
    return Object.values(results).reduce((acc: string[], result: any) => {
      return acc.concat(result.errors);
    }, []);
  },
};

// Export grouped validation utilities
export const validationUtils = {
  validators,
  rules,
  validateField,
  validateObject,
  taskRules: taskValidationRules,
  form: formValidationUtils,
};