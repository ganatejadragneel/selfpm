// Form validation schemas using centralized validation functions
import {
  validateTaskTitle,
  validateTaskDescription,
  validateProgressGoal,
  validateEmail,
  validateUsername,
  validatePasswordMatch,
  isStrongPassword
} from './validation';
import type { FieldConfig } from '../hooks/useFormState';
import type { TaskCategory, TaskPriority } from '../types';

// Pre-defined schemas for common forms
export interface AddTaskFormData {
  category: TaskCategory;
  title: string;
  description: string;
  dueDate: string;
  progressTotal: string;
  priority: TaskPriority;
  recurrenceWeeks: number;
  estimatedDuration: number | undefined;
}

export const addTaskSchema: Record<keyof AddTaskFormData, FieldConfig> = {
  category: {
    initialValue: 'life_admin' as TaskCategory,
    required: true
  },
  title: {
    initialValue: '',
    required: true,
    validators: [
      {
        rule: (value: string) => validateTaskTitle(value).isValid,
        message: 'Title is required and must be under 200 characters'
      }
    ]
  },
  description: {
    initialValue: '',
    required: false,
    validators: [
      {
        rule: (value: string) => validateTaskDescription(value).isValid,
        message: 'Description must be under 1000 characters'
      }
    ]
  },
  dueDate: {
    initialValue: '',
    required: false
  },
  progressTotal: {
    initialValue: '',
    required: false,
    validators: [
      {
        rule: (value: string) => validateProgressGoal(value).isValid,
        message: 'Progress goal must be a positive number'
      }
    ]
  },
  priority: {
    initialValue: 'medium' as TaskPriority,
    required: true
  },
  recurrenceWeeks: {
    initialValue: 1,
    required: true
  },
  estimatedDuration: {
    initialValue: 5,
    required: false
  }
};

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const registerSchema: Record<keyof RegisterFormData, FieldConfig> = {
  username: {
    initialValue: '',
    required: true,
    validators: [
      {
        rule: (value: string) => validateUsername(value).isValid,
        message: 'Username must be 2-30 characters, letters, numbers, underscore, hyphen only'
      }
    ]
  },
  email: {
    initialValue: '',
    required: true,
    validators: [
      {
        rule: (value: string) => validateEmail(value).isValid,
        message: 'Please enter a valid email address'
      }
    ]
  },
  password: {
    initialValue: '',
    required: true,
    validators: [
      {
        rule: (value: string) => isStrongPassword(value).isValid,
        message: 'Password must be at least 6 characters with uppercase, lowercase, and number'
      }
    ]
  },
  confirmPassword: {
    initialValue: '',
    required: true,
    validators: [
      {
        rule: (value: string, allValues?: RegisterFormData) =>
          allValues ? validatePasswordMatch(allValues.password, value).isValid : true,
        message: 'Passwords do not match'
      }
    ]
  }
};

export interface LoginFormData {
  email: string;
  password: string;
}

export const loginSchema: Record<keyof LoginFormData, FieldConfig> = {
  email: {
    initialValue: '',
    required: true,
    validators: [
      {
        rule: (value: string) => validateEmail(value).isValid,
        message: 'Please enter a valid email address'
      }
    ]
  },
  password: {
    initialValue: '',
    required: true
  }
};