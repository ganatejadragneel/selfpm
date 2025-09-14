// Comprehensive validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Basic validation functions
export const isRequired = (value: any, fieldName = 'Field'): ValidationResult => {
  const isEmpty = value === null || value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

  return {
    isValid: !isEmpty,
    errors: isEmpty ? [`${fieldName} is required`] : []
  };
};

export const minLength = (value: string, min: number, fieldName = 'Field'): ValidationResult => {
  const isValid = Boolean(value && value.length >= min);
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be at least ${min} characters long`]
  };
};

export const maxLength = (value: string, max: number, fieldName = 'Field'): ValidationResult => {
  const isValid = !value || value.length <= max;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} cannot exceed ${max} characters`]
  };
};

export const isNumeric = (value: string, fieldName = 'Field'): ValidationResult => {
  const isValid = !isNaN(Number(value)) && isFinite(Number(value));
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be a valid number`]
  };
};

export const isPositiveNumber = (value: string | number, fieldName = 'Field'): ValidationResult => {
  const numValue = typeof value === 'string' ? Number(value) : value;
  const isValid = !isNaN(numValue) && numValue > 0;
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} must be a positive number`]
  };
};

export const isValidUrl = (url: string, fieldName = 'URL'): ValidationResult => {
  try {
    new URL(url);
    return { isValid: true, errors: [] };
  } catch {
    return { isValid: false, errors: [`${fieldName} must be a valid URL`] };
  }
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmail = (email: string, fieldName = 'Email'): ValidationResult => {
  if (!email?.trim()) {
    return { isValid: false, errors: [`${fieldName} is required`] };
  }

  const isValid = isValidEmail(email);
  return {
    isValid,
    errors: isValid ? [] : [`Please enter a valid ${fieldName.toLowerCase()}`]
  };
};

// Password validation
export interface PasswordStrength {
  isValid: boolean;
  errors: string[];
}

export const isStrongPassword = (password: string): PasswordStrength => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  const isValid = password === confirmPassword;
  return {
    isValid,
    errors: isValid ? [] : ['Passwords do not match']
  };
};

// Username validation
export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];

  if (!username?.trim()) {
    errors.push('Username is required');
  } else if (username.length < 2) {
    errors.push('Username must be at least 2 characters long');
  } else if (username.length > 30) {
    errors.push('Username cannot exceed 30 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Task-specific validation
export const validateTaskTitle = (title: string): ValidationResult => {
  const required = isRequired(title, 'Task title');
  if (!required.isValid) return required;

  const length = maxLength(title.trim(), 200, 'Task title');
  return length;
};

export const validateTaskDescription = (description: string): ValidationResult => {
  if (!description?.trim()) return { isValid: true, errors: [] }; // Optional field

  const length = maxLength(description.trim(), 1000, 'Description');
  return length;
};

export const validateProgressGoal = (value: string): ValidationResult => {
  if (!value?.trim()) return { isValid: true, errors: [] }; // Optional field

  const numeric = isNumeric(value, 'Progress goal');
  if (!numeric.isValid) return numeric;

  const positive = isPositiveNumber(value, 'Progress goal');
  return positive;
};

// Combine multiple validation results
export const combineValidation = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(result => result.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Create validator from validation function
export const createValidator = <T>(
  validationFn: (value: T) => ValidationResult
) => {
  return {
    rule: (value: T) => validationFn(value).isValid,
    message: (value: T) => validationFn(value).errors[0] || 'Invalid value'
  };
};