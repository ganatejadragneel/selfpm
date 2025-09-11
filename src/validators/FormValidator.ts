/**
 * FormValidator - Validation logic for form inputs
 * Following SOLID principles: Single responsibility for form validation
 */

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export class FormValidator {
  private rules: Map<string, ValidationRule[]> = new Map();
  private errors: Record<string, string> = {};
  private touched: Record<string, boolean> = {};
  private values: Record<string, any> = {};

  /**
   * Add validation rule for a field
   */
  addRule(field: string, rule: ValidationRule): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
    return this;
  }

  /**
   * Add multiple rules for a field
   */
  addRules(field: string, rules: ValidationRule[]): this {
    rules.forEach(rule => this.addRule(field, rule));
    return this;
  }

  /**
   * Validate a single field
   */
  validateField(field: string, value: any): string | null {
    const fieldRules = this.rules.get(field);
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }

    return null;
  }

  /**
   * Validate all fields
   */
  validateAll(values: Record<string, unknown>): FormValidationResult {
    this.values = values;
    this.errors = {};
    
    for (const [field] of this.rules) {
      const value = values[field];
      const error = this.validateField(field, value);
      if (error) {
        this.errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors,
      touched: this.touched,
    };
  }

  /**
   * Mark field as touched
   */
  touchField(field: string): void {
    this.touched[field] = true;
  }

  /**
   * Mark all fields as touched
   */
  touchAll(): void {
    for (const field of this.rules.keys()) {
      this.touched[field] = true;
    }
  }

  /**
   * Reset validation state
   */
  reset(): void {
    this.errors = {};
    this.touched = {};
    this.values = {};
  }

  /**
   * Get current validation state
   */
  getState(): FormValidationResult {
    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors,
      touched: this.touched,
    };
  }

  /**
   * Check if field has error and is touched
   */
  shouldShowError(field: string): boolean {
    return !!this.errors[field] && !!this.touched[field];
  }

  // Static validation rules factory methods

  static required(message = 'This field is required'): ValidationRule {
    return {
      validate: (value) => {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return value !== null && value !== undefined;
      },
      message,
    };
  }

  static minLength(min: number, message?: string): ValidationRule {
    return {
      validate: (value) => {
        if (typeof value !== 'string') return false;
        return value.trim().length >= min;
      },
      message: message || `Must be at least ${min} characters`,
    };
  }

  static maxLength(max: number, message?: string): ValidationRule {
    return {
      validate: (value) => {
        if (typeof value !== 'string') return true;
        return value.length <= max;
      },
      message: message || `Must not exceed ${max} characters`,
    };
  }

  static pattern(regex: RegExp, message = 'Invalid format'): ValidationRule {
    return {
      validate: (value) => {
        if (!value) return true; // Skip if empty (use required rule for that)
        return regex.test(String(value));
      },
      message,
    };
  }

  static email(message = 'Invalid email address'): ValidationRule {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return FormValidator.pattern(emailRegex, message);
  }

  static number(message = 'Must be a valid number'): ValidationRule {
    return {
      validate: (value) => {
        if (value === '' || value === null || value === undefined) return true;
        return !isNaN(Number(value));
      },
      message,
    };
  }

  static min(min: number, message?: string): ValidationRule {
    return {
      validate: (value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = Number(value);
        return !isNaN(num) && num >= min;
      },
      message: message || `Must be at least ${min}`,
    };
  }

  static max(max: number, message?: string): ValidationRule {
    return {
      validate: (value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = Number(value);
        return !isNaN(num) && num <= max;
      },
      message: message || `Must not exceed ${max}`,
    };
  }

  static range(min: number, max: number, message?: string): ValidationRule {
    return {
      validate: (value) => {
        if (value === '' || value === null || value === undefined) return true;
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
      },
      message: message || `Must be between ${min} and ${max}`,
    };
  }

  static date(message = 'Invalid date'): ValidationRule {
    return {
      validate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime());
      },
      message,
    };
  }

  static futureDate(message = 'Date must be in the future'): ValidationRule {
    return {
      validate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime()) && date > new Date();
      },
      message,
    };
  }

  static pastDate(message = 'Date must be in the past'): ValidationRule {
    return {
      validate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime()) && date < new Date();
      },
      message,
    };
  }

  static custom(
    validate: (value: any) => boolean,
    message: string
  ): ValidationRule {
    return { validate, message };
  }

  static oneOf(values: any[], message?: string): ValidationRule {
    return {
      validate: (value) => values.includes(value),
      message: message || `Must be one of: ${values.join(', ')}`,
    };
  }

  static url(message = 'Invalid URL'): ValidationRule {
    return {
      validate: (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message,
    };
  }

  static phoneNumber(message = 'Invalid phone number'): ValidationRule {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return {
      validate: (value) => {
        if (!value) return true;
        const cleaned = String(value).replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15 && phoneRegex.test(value);
      },
      message,
    };
  }

  static strongPassword(message?: string): ValidationRule {
    return {
      validate: (value) => {
        if (!value) return true;
        const password = String(value);
        
        // At least 8 characters
        if (password.length < 8) return false;
        
        // Contains uppercase
        if (!/[A-Z]/.test(password)) return false;
        
        // Contains lowercase
        if (!/[a-z]/.test(password)) return false;
        
        // Contains number
        if (!/\d/.test(password)) return false;
        
        // Contains special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
        
        return true;
      },
      message: message || 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
    };
  }

  static match(fieldName: string, message?: string): ValidationRule {
    return {
      validate: function(this: FormValidator, value) {
        return value === this.values[fieldName];
      },
      message: message || `Must match ${fieldName}`,
    };
  }

  static conditionalRequired(
    condition: (values: Record<string, any>) => boolean,
    message = 'This field is required'
  ): ValidationRule {
    return {
      validate: function(this: FormValidator, value) {
        if (condition(this.values)) {
          return !!value && (typeof value !== 'string' || value.trim().length > 0);
        }
        return true;
      },
      message,
    };
  }

  /**
   * Create a validator for task forms
   */
  static createTaskFormValidator(): FormValidator {
    const validator = new FormValidator();
    
    validator
      .addRule('title', FormValidator.required())
      .addRule('title', FormValidator.minLength(1))
      .addRule('title', FormValidator.maxLength(200))
      .addRule('category', FormValidator.required())
      .addRule('category', FormValidator.oneOf([
        'life_admin',
        'work',
        'weekly_recurring',
      ]))
      .addRule('priority', FormValidator.oneOf(['urgent', 'high', 'medium', 'low']))
      .addRule('estimatedDuration', FormValidator.number())
      .addRule('estimatedDuration', FormValidator.min(1))
      .addRule('estimatedDuration', FormValidator.max(480))
      .addRule('progressCurrent', FormValidator.number())
      .addRule('progressCurrent', FormValidator.min(0))
      .addRule('progressTotal', FormValidator.number())
      .addRule('progressTotal', FormValidator.min(0));
    
    return validator;
  }

  /**
   * Create a validator for login forms
   */
  static createLoginFormValidator(): FormValidator {
    const validator = new FormValidator();
    
    validator
      .addRule('email', FormValidator.required())
      .addRule('email', FormValidator.email())
      .addRule('password', FormValidator.required())
      .addRule('password', FormValidator.minLength(6));
    
    return validator;
  }

  /**
   * Create a validator for signup forms
   */
  static createSignupFormValidator(): FormValidator {
    const validator = new FormValidator();
    
    validator
      .addRule('email', FormValidator.required())
      .addRule('email', FormValidator.email())
      .addRule('password', FormValidator.required())
      .addRule('password', FormValidator.strongPassword())
      .addRule('confirmPassword', FormValidator.required())
      .addRule('confirmPassword', FormValidator.match('password', 'Passwords must match'))
      .addRule('username', FormValidator.required())
      .addRule('username', FormValidator.minLength(3))
      .addRule('username', FormValidator.maxLength(20))
      .addRule('username', FormValidator.pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'));
    
    return validator;
  }
}