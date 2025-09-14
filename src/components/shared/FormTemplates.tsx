// Phase 7: Form Templates and Higher-Order Components
// Pre-built form templates and utilities for common form patterns

import React from 'react';
import { useEnhancedForm, type EnhancedFieldConfig } from '../../utils/shared/formSystemManager';
import { validators } from '../../utils/shared/formValidators';
import {
  EnhancedTextInput,
  EnhancedPasswordInput,
  EnhancedTextarea,
  EnhancedSelect,
  EnhancedCheckbox,
  FormField,
  FormSubmitButton,
  type SelectOption,
} from './EnhancedFormComponents';

// Generic form builder component
interface FormBuilderProps<T extends Record<string, any>> {
  config: Record<keyof T, EnhancedFieldConfig>;
  onSubmit: (values: T) => Promise<any>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  children?: (form: ReturnType<typeof useEnhancedForm<T>>) => React.ReactNode;
}

export function FormBuilder<T extends Record<string, any>>({
  config,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  className = '',
  children,
}: FormBuilderProps<T>) {
  const form = useEnhancedForm(config, {
    validateOnChange: true,
    validateOnBlur: true,
    onSubmitSuccess: () => {
      form.reset();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.submit(onSubmit);
  };

  const renderField = (fieldName: keyof T, fieldConfig: EnhancedFieldConfig) => {
    const fieldProps = form.getFieldProps(fieldName);
    const fieldKey = String(fieldName);

    // Determine field type based on config or field name
    const getFieldType = () => {
      if (fieldKey.toLowerCase().includes('password')) return 'password';
      if (fieldKey.toLowerCase().includes('email')) return 'email';
      if (fieldKey.toLowerCase().includes('phone')) return 'tel';
      if (fieldKey.toLowerCase().includes('url') || fieldKey.toLowerCase().includes('website')) return 'url';
      if (fieldConfig.validators?.some(v => v.message?.toString().includes('email'))) return 'email';
      return 'text';
    };

    const fieldType = getFieldType();

    // Render different field types
    if (fieldType === 'password') {
      return (
        <EnhancedPasswordInput
          {...fieldProps}
          id={fieldKey}
          name={fieldKey}
          showToggle={true}
          strengthIndicator={fieldKey.includes('new') || fieldKey.includes('create')}
        />
      );
    }

    if (fieldKey.includes('description') || fieldKey.includes('comment') || fieldKey.includes('notes')) {
      return (
        <EnhancedTextarea
          {...fieldProps}
          id={fieldKey}
          name={fieldKey}
          rows={4}
          showCharacterCount={true}
          maxLength={500}
          autoResize={true}
        />
      );
    }

    return (
      <EnhancedTextInput
        {...fieldProps}
        id={fieldKey}
        name={fieldKey}
        type={fieldType}
        showCharacterCount={fieldKey.includes('title') || fieldKey.includes('name')}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {children ? (
        children(form)
      ) : (
        <>
          {Object.entries(config).map(([fieldName, fieldConfig]) => (
            <FormField
              key={fieldName}
              label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
              required={fieldConfig.required}
              error={form.errors[fieldName as keyof T]}
              warning={form.warnings[fieldName as keyof T]}
            >
              {renderField(fieldName as keyof T, fieldConfig)}
            </FormField>
          ))}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {cancelLabel}
              </button>
            )}
            <FormSubmitButton
              isSubmitting={form.submissionState === 'submitting'}
              isValid={form.canSubmit}
            >
              {submitLabel}
            </FormSubmitButton>
          </div>
        </>
      )}
    </form>
  );
}

// Pre-built form templates

// Login Form Template
interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<any>;
  onForgotPassword?: () => void;
  onCreateAccount?: () => void;
  loading?: boolean;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPassword,
  onCreateAccount,
  loading = false,
  className = '',
}) => {
  const config: Record<keyof LoginFormData, EnhancedFieldConfig> = {
    email: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.email()],
    },
    password: {
      initialValue: '',
      required: true,
      validators: [validators.required()],
    },
    rememberMe: {
      initialValue: false,
      required: false,
    },
  };

  const form = useEnhancedForm(config, {
    validateOnBlur: true,
    autoSave: {
      enabled: true,
      key: 'login-form-draft',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.submit(onSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <FormField label="Email" required error={form.errors.email}>
        <EnhancedTextInput
          {...form.getFieldProps('email')}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={loading}
        />
      </FormField>

      <FormField label="Password" required error={form.errors.password}>
        <EnhancedPasswordInput
          {...form.getFieldProps('password')}
          id="password"
          name="password"
          autoComplete="current-password"
          disabled={loading}
          showToggle={true}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <EnhancedCheckbox
          {...form.getFieldProps('rememberMe')}
          id="rememberMe"
          name="rememberMe"
          checked={form.values.rememberMe || false}
          label="Remember me"
          disabled={loading}
        />

        {onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot password?
          </button>
        )}
      </div>

      <FormSubmitButton
        isSubmitting={loading || form.submissionState === 'submitting'}
        isValid={form.canSubmit}
        className="w-full"
      >
        Sign In
      </FormSubmitButton>

      {onCreateAccount && (
        <div className="text-center">
          <button
            type="button"
            onClick={onCreateAccount}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Don't have an account? Sign up
          </button>
        </div>
      )}
    </form>
  );
};

// Registration Form Template
interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<any>;
  onSignIn?: () => void;
  loading?: boolean;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSignIn,
  loading = false,
  className = '',
}) => {
  const config: Record<keyof RegisterFormData, EnhancedFieldConfig> = {
    firstName: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.minLength(2)],
    },
    lastName: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.minLength(2)],
    },
    email: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.email()],
    },
    password: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.password()],
    },
    confirmPassword: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.confirmPassword('password')],
    },
    agreeToTerms: {
      initialValue: false,
      required: true,
      validators: [
        {
          rule: (value) => value === true,
          message: 'You must agree to the terms and conditions',
        },
      ],
    },
  };

  const form = useEnhancedForm(config, {
    validateOnChange: true,
    validateOnBlur: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.submit(onSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required error={form.errors.firstName}>
          <EnhancedTextInput
            {...form.getFieldProps('firstName')}
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            disabled={loading}
          />
        </FormField>

        <FormField label="Last Name" required error={form.errors.lastName}>
          <EnhancedTextInput
            {...form.getFieldProps('lastName')}
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField label="Email" required error={form.errors.email}>
        <EnhancedTextInput
          {...form.getFieldProps('email')}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={loading}
        />
      </FormField>

      <FormField label="Password" required error={form.errors.password}>
        <EnhancedPasswordInput
          {...form.getFieldProps('password')}
          id="password"
          name="password"
          autoComplete="new-password"
          disabled={loading}
          showToggle={true}
          strengthIndicator={true}
        />
      </FormField>

      <FormField label="Confirm Password" required error={form.errors.confirmPassword}>
        <EnhancedPasswordInput
          {...form.getFieldProps('confirmPassword')}
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          disabled={loading}
          showToggle={true}
        />
      </FormField>

      <FormField error={form.errors.agreeToTerms}>
        <EnhancedCheckbox
          {...form.getFieldProps('agreeToTerms')}
          id="agreeToTerms"
          name="agreeToTerms"
          checked={form.values.agreeToTerms}
          disabled={loading}
          label={
            <span>
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500" target="_blank">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500" target="_blank">
                Privacy Policy
              </a>
            </span>
          }
        />
      </FormField>

      <FormSubmitButton
        isSubmitting={loading || form.submissionState === 'submitting'}
        isValid={form.canSubmit}
        className="w-full"
      >
        Create Account
      </FormSubmitButton>

      {onSignIn && (
        <div className="text-center">
          <button
            type="button"
            onClick={onSignIn}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Already have an account? Sign in
          </button>
        </div>
      )}
    </form>
  );
};

// Contact Form Template
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<any>;
  categories?: SelectOption[];
  className?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'feedback', label: 'Feedback' },
  ],
  className = '',
}) => {
  const config: Record<keyof ContactFormData, EnhancedFieldConfig> = {
    name: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.minLength(2)],
    },
    email: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.email()],
    },
    subject: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.minLength(5)],
    },
    message: {
      initialValue: '',
      required: true,
      validators: [validators.required(), validators.minLength(10)],
    },
    category: {
      initialValue: categories[0]?.value || '',
      required: true,
      validators: [validators.required()],
    },
  };

  return (
    <FormBuilder
      config={config}
      onSubmit={onSubmit}
      submitLabel="Send Message"
      className={className}
    >
      {(form) => (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name" required error={form.errors.name}>
              <EnhancedTextInput
                {...form.getFieldProps('name')}
                id="name"
                name="name"
                autoComplete="name"
              />
            </FormField>

            <FormField label="Email" required error={form.errors.email}>
              <EnhancedTextInput
                {...form.getFieldProps('email')}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
              />
            </FormField>
          </div>

          <FormField label="Category" required error={form.errors.category}>
            <EnhancedSelect
              {...form.getFieldProps('category')}
              id="category"
              name="category"
              options={categories}
            />
          </FormField>

          <FormField label="Subject" required error={form.errors.subject}>
            <EnhancedTextInput
              {...form.getFieldProps('subject')}
              id="subject"
              name="subject"
              showCharacterCount={true}
              maxLength={100}
            />
          </FormField>

          <FormField label="Message" required error={form.errors.message}>
            <EnhancedTextarea
              {...form.getFieldProps('message')}
              id="message"
              name="message"
              rows={6}
              showCharacterCount={true}
              maxLength={1000}
              autoResize={true}
            />
          </FormField>

          <div className="flex justify-end pt-6 border-t">
            <FormSubmitButton
              isSubmitting={form.submissionState === 'submitting'}
              isValid={form.canSubmit}
            >
              Send Message
            </FormSubmitButton>
          </div>
        </>
      )}
    </FormBuilder>
  );
};

// Higher-Order Component for form enhancement
export function withFormEnhancements<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<any, P & React.RefAttributes<any>>((props, ref) => {
    // Add form-level enhancements here
    const { ...componentProps } = props;
    return <Component {...(componentProps as P)} ref={ref} />;
  });
}

// Form step wizard component
interface FormStepWizardProps {
  steps: Array<{
    title: string;
    component: React.ReactNode;
    isValid?: boolean;
  }>;
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  className?: string;
}

export const FormStepWizard: React.FC<FormStepWizardProps> = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  className = '',
}) => {
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = steps[currentStep]?.isValid !== false;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
                ${index < currentStep ? 'bg-green-500' : ''}
              `}
            >
              {index < currentStep ? '✓' : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {steps[currentStep]?.title}
        </h2>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {steps[currentStep]?.component}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};