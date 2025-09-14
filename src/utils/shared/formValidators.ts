// Phase 7: Comprehensive Form Validation Library
// Reusable validators for consistent form validation across the application

import type { FieldValidator } from './formSystemManager';

// Common validation patterns
export const ValidationPatterns = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  decimal: /^\d*\.?\d+$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ipAddress: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
} as const;

// Basic validation functions
export const ValidationFunctions = {
  // String validators
  minLength: (min: number) => (value: string) => !value || value.length >= min,
  maxLength: (max: number) => (value: string) => !value || value.length <= max,
  exactLength: (length: number) => (value: string) => !value || value.length === length,
  matches: (pattern: RegExp) => (value: string) => !value || pattern.test(value),
  contains: (substring: string) => (value: string) => !value || value.includes(substring),
  startsWith: (prefix: string) => (value: string) => !value || value.startsWith(prefix),
  endsWith: (suffix: string) => (value: string) => !value || value.endsWith(suffix),

  // Number validators
  min: (min: number) => (value: number) => value == null || value >= min,
  max: (max: number) => (value: number) => value == null || value <= max,
  between: (min: number, max: number) => (value: number) => value == null || (value >= min && value <= max),
  positive: (value: number) => value == null || value > 0,
  negative: (value: number) => value == null || value < 0,
  integer: (value: number) => value == null || Number.isInteger(value),
  multipleOf: (factor: number) => (value: number) => value == null || value % factor === 0,

  // Date validators
  minDate: (min: Date) => (value: Date) => !value || value >= min,
  maxDate: (max: Date) => (value: Date) => !value || value <= max,
  dateRange: (min: Date, max: Date) => (value: Date) => !value || (value >= min && value <= max),
  futureDate: (value: Date) => !value || value > new Date(),
  pastDate: (value: Date) => !value || value < new Date(),
  isWeekday: (value: Date) => !value || (value.getDay() > 0 && value.getDay() < 6),
  isWeekend: (value: Date) => !value || (value.getDay() === 0 || value.getDay() === 6),

  // Array validators
  minItems: (min: number) => (value: any[]) => !value || value.length >= min,
  maxItems: (max: number) => (value: any[]) => !value || value.length <= max,
  uniqueItems: (value: any[]) => !value || new Set(value).size === value.length,
  containsItem: (item: any) => (value: any[]) => !value || value.includes(item),

  // File validators
  maxFileSize: (maxBytes: number) => (value: FileList | File) => {
    if (!value) return true;
    const files = value instanceof FileList ? Array.from(value) : [value];
    return files.every(file => file.size <= maxBytes);
  },
  allowedFileTypes: (types: string[]) => (value: FileList | File) => {
    if (!value) return true;
    const files = value instanceof FileList ? Array.from(value) : [value];
    return files.every(file => types.includes(file.type));
  },
  maxFiles: (max: number) => (value: FileList) => !value || value.length <= max,

  // Custom validators
  oneOf: (allowedValues: any[]) => (value: any) => value == null || allowedValues.includes(value),
  custom: (fn: (value: any) => boolean) => fn,
};

// Pre-built field validators
export const FieldValidators = {
  // Required validator
  required: <T = any>(): FieldValidator<T> => ({
    rule: (value) => {
      if (value == null || value === '' || value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      return true;
    },
    message: 'This field is required'
  }),

  // Email validator
  email: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.email.test(value),
    message: 'Please enter a valid email address'
  }),

  // URL validator
  url: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.url.test(value),
    message: 'Please enter a valid URL'
  }),

  // Phone validator
  phone: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.phone.test(value),
    message: 'Please enter a valid phone number'
  }),

  // Password validators
  password: (options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
  } = {}): FieldValidator<string> => {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSymbols = true
    } = options;

    return {
      rule: (value) => {
        if (!value) return true;

        if (value.length < minLength) return false;
        if (requireUppercase && !/[A-Z]/.test(value)) return false;
        if (requireLowercase && !/[a-z]/.test(value)) return false;
        if (requireNumbers && !/\d/.test(value)) return false;
        if (requireSymbols && !/[@$!%*?&]/.test(value)) return false;

        return true;
      },
      message: `Password must be at least ${minLength} characters long${
        requireUppercase ? ', contain uppercase letters' : ''
      }${
        requireLowercase ? ', contain lowercase letters' : ''
      }${
        requireNumbers ? ', contain numbers' : ''
      }${
        requireSymbols ? ', contain symbols (@$!%*?&)' : ''
      }`
    };
  },

  // Confirm password validator
  confirmPassword: (passwordField: string): FieldValidator<string> => ({
    rule: (value, formValues) => {
      if (!value) return true;
      return value === formValues?.[passwordField];
    },
    message: 'Passwords do not match'
  }),

  // String length validators
  minLength: (min: number): FieldValidator<string> => ({
    rule: (value) => ValidationFunctions.minLength(min)(value || ''),
    message: `Must be at least ${min} characters long`
  }),

  maxLength: (max: number): FieldValidator<string> => ({
    rule: (value) => ValidationFunctions.maxLength(max)(value || ''),
    message: `Must be no more than ${max} characters long`
  }),

  lengthRange: (min: number, max: number): FieldValidator<string> => ({
    rule: (value) => {
      const len = (value || '').length;
      return len === 0 || (len >= min && len <= max);
    },
    message: `Must be between ${min} and ${max} characters long`
  }),

  // Number validators
  minValue: (min: number): FieldValidator<number> => ({
    rule: (value) => ValidationFunctions.min(min)(value),
    message: `Must be at least ${min}`
  }),

  maxValue: (max: number): FieldValidator<number> => ({
    rule: (value) => ValidationFunctions.max(max)(value),
    message: `Must be no more than ${max}`
  }),

  numberRange: (min: number, max: number): FieldValidator<number> => ({
    rule: (value) => ValidationFunctions.between(min, max)(value),
    message: `Must be between ${min} and ${max}`
  }),

  positiveNumber: (): FieldValidator<number> => ({
    rule: ValidationFunctions.positive,
    message: 'Must be a positive number'
  }),

  integer: (): FieldValidator<number> => ({
    rule: ValidationFunctions.integer,
    message: 'Must be a whole number'
  }),

  // Date validators
  minDate: (min: Date): FieldValidator<Date> => ({
    rule: ValidationFunctions.minDate(min),
    message: `Date must be after ${min.toLocaleDateString()}`
  }),

  maxDate: (max: Date): FieldValidator<Date> => ({
    rule: ValidationFunctions.maxDate(max),
    message: `Date must be before ${max.toLocaleDateString()}`
  }),

  futureDate: (): FieldValidator<Date> => ({
    rule: ValidationFunctions.futureDate,
    message: 'Date must be in the future'
  }),

  pastDate: (): FieldValidator<Date> => ({
    rule: ValidationFunctions.pastDate,
    message: 'Date must be in the past'
  }),

  // File validators
  maxFileSize: (maxMB: number): FieldValidator<FileList | File> => ({
    rule: ValidationFunctions.maxFileSize(maxMB * 1024 * 1024),
    message: `File size must be less than ${maxMB}MB`
  }),

  allowedFileTypes: (types: string[]): FieldValidator<FileList | File> => ({
    rule: ValidationFunctions.allowedFileTypes(types),
    message: `Only ${types.join(', ')} files are allowed`
  }),

  maxFiles: (max: number): FieldValidator<FileList> => ({
    rule: ValidationFunctions.maxFiles(max),
    message: `Maximum ${max} files allowed`
  }),

  // Pattern validators
  alphanumeric: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.alphanumeric.test(value),
    message: 'Only letters and numbers are allowed'
  }),

  numeric: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.numeric.test(value),
    message: 'Only numbers are allowed'
  }),

  slug: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.slug.test(value),
    message: 'Must be a valid slug (lowercase letters, numbers, and hyphens only)'
  }),

  hexColor: (): FieldValidator<string> => ({
    rule: (value) => !value || ValidationPatterns.hexColor.test(value),
    message: 'Must be a valid hex color code (e.g., #FF0000)'
  }),

  // Array validators
  minItems: (min: number): FieldValidator<any[]> => ({
    rule: ValidationFunctions.minItems(min),
    message: `Must select at least ${min} item${min === 1 ? '' : 's'}`
  }),

  maxItems: (max: number): FieldValidator<any[]> => ({
    rule: ValidationFunctions.maxItems(max),
    message: `Can select at most ${max} item${max === 1 ? '' : 's'}`
  }),

  uniqueItems: (): FieldValidator<any[]> => ({
    rule: ValidationFunctions.uniqueItems,
    message: 'All items must be unique'
  }),

  // Custom validators
  oneOf: (allowedValues: any[], label?: string): FieldValidator<any> => ({
    rule: ValidationFunctions.oneOf(allowedValues),
    message: `Must be one of: ${label || allowedValues.join(', ')}`
  }),

  custom: (fn: (value: any, formValues?: any) => boolean, message: string): FieldValidator<any> => ({
    rule: fn,
    message
  }),

  // Conditional validators
  when: (
    condition: (formValues: any) => boolean,
    validator: FieldValidator<any>
  ): FieldValidator<any> => ({
    rule: (value, formValues) => {
      if (!condition(formValues || {})) return true;
      return validator.rule(value, formValues);
    },
    message: validator.message,
    when: condition
  }),
};

// Async validators for remote validation
export const AsyncValidators = {
  // Check if email is already registered
  uniqueEmail: (checkFn: (email: string) => Promise<boolean>): FieldValidator<string> => ({
    rule: async (value) => {
      if (!value || !ValidationPatterns.email.test(value)) return true;
      return await checkFn(value);
    },
    message: 'This email is already registered'
  }),

  // Check if username is available
  uniqueUsername: (checkFn: (username: string) => Promise<boolean>): FieldValidator<string> => ({
    rule: async (value) => {
      if (!value) return true;
      return await checkFn(value);
    },
    message: 'This username is already taken'
  }),

  // Check if slug is available
  uniqueSlug: (checkFn: (slug: string) => Promise<boolean>): FieldValidator<string> => ({
    rule: async (value) => {
      if (!value) return true;
      return await checkFn(value);
    },
    message: 'This slug is already in use'
  }),

  // Custom async validator
  customAsync: (
    fn: (value: any) => Promise<boolean>,
    message: string
  ): FieldValidator<any> => ({
    rule: fn,
    message
  }),
};

// Common validation schemas
export const CommonSchemas = {
  email: {
    initialValue: '',
    required: true,
    validators: [
      FieldValidators.required(),
      FieldValidators.email()
    ]
  },

  password: {
    initialValue: '',
    required: true,
    validators: [
      FieldValidators.required(),
      FieldValidators.password()
    ]
  },

  confirmPassword: (passwordField: string) => ({
    initialValue: '',
    required: true,
    validators: [
      FieldValidators.required(),
      FieldValidators.confirmPassword(passwordField)
    ]
  }),

  name: {
    initialValue: '',
    required: true,
    validators: [
      FieldValidators.required(),
      FieldValidators.minLength(2),
      FieldValidators.maxLength(50)
    ]
  },

  phoneNumber: {
    initialValue: '',
    required: false,
    validators: [
      FieldValidators.phone()
    ]
  },

  url: {
    initialValue: '',
    required: false,
    validators: [
      FieldValidators.url()
    ]
  },

  age: {
    initialValue: '',
    required: false,
    validators: [
      FieldValidators.positiveNumber(),
      FieldValidators.numberRange(1, 150)
    ]
  },

  date: {
    initialValue: '',
    required: false,
    validators: []
  },

  futureDate: {
    initialValue: '',
    required: false,
    validators: [
      FieldValidators.futureDate()
    ]
  },
};

// Form validation utilities
export const validationUtils = {
  // Combine multiple validators
  combineValidators: <T>(...validators: FieldValidator<T>[]): FieldValidator<T>[] => {
    return validators;
  },

  // Create conditional validator
  when: <T>(
    condition: (formValues: any) => boolean,
    validators: FieldValidator<T>[]
  ): FieldValidator<T>[] => {
    return validators.map(validator => FieldValidators.when(condition, validator));
  },

  // Validate single value
  validateValue: async <T>(
    value: T,
    validators: FieldValidator<T>[],
    formValues?: any
  ): Promise<string | null> => {
    for (const validator of validators) {
      if (validator.when && !validator.when(formValues || {})) {
        continue;
      }

      const isValid = await validator.rule(value, formValues);
      if (!isValid) {
        return typeof validator.message === 'function'
          ? validator.message(value, formValues)
          : validator.message;
      }
    }
    return null;
  },

  // Create validator from pattern
  fromPattern: (pattern: RegExp, message: string): FieldValidator<string> => ({
    rule: (value) => !value || pattern.test(value),
    message
  }),

  // Create validator from function
  fromFunction: <T>(
    fn: (value: T, formValues?: any) => boolean | Promise<boolean>,
    message: string | ((value: T, formValues?: any) => string)
  ): FieldValidator<T> => ({
    rule: fn,
    message
  }),
};

// Export all validators as a single object for convenience
export const validators = {
  ...FieldValidators,
  async: AsyncValidators,
  schemas: CommonSchemas,
  utils: validationUtils,
  patterns: ValidationPatterns,
  functions: ValidationFunctions,
};