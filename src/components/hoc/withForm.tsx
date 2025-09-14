import React, { type ComponentType } from 'react';
import { useFormState, type UseFormStateReturn, type FieldConfig } from '../../hooks/useFormState';
import { useThemeColors } from '../../hooks/useThemeColors';

// Props that the wrapped component will receive
export interface WithFormProps<T extends Record<string, any>> {
  form: UseFormStateReturn<T>;
  onSubmit: (values: T) => void | Promise<void>;
  formId?: string;
}

// Configuration for the form HOC
export interface FormConfig<T extends Record<string, any>> {
  schema: Record<keyof T, FieldConfig>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
  submitButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  formClassName?: string;
  loadingText?: string;
}

// HOC that provides form state management and validation
export function withForm<T extends Record<string, any>, P extends WithFormProps<T>>(
  WrappedComponent: ComponentType<P>,
  config: FormConfig<T>
): ComponentType<Omit<P, keyof WithFormProps<T>> & { onSubmit: (values: T) => void | Promise<void> }> {
  const {
    schema,
    validateOnChange = true,
    resetOnSubmit = false,
    submitButtonText = 'Submit',
    showSubmitButton = true,
    showResetButton = false,
    formClassName,
    loadingText = 'Submitting...'
  } = config;

  const WithFormComponent: React.FC<Omit<P, keyof WithFormProps<T>> & { onSubmit: (values: T) => void | Promise<void> }> = (props) => {
    const { onSubmit, ...restProps } = props;
    const form = useFormState<T>(schema);
    const theme = useThemeColors();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Configure validation triggers
    React.useEffect(() => {
      if (validateOnChange) {
        // Validation is already handled in useFormState on setValue
      }
    }, [validateOnChange]);

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!form.validateForm()) {
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmit(form.values);

        if (resetOnSubmit) {
          form.reset();
        }
      } catch (error) {
        console.error('Form submission error:', error);
        // You could add error handling here
      } finally {
        setIsSubmitting(false);
      }
    };

    const formProps: WithFormProps<T> = {
      form,
      onSubmit: (_values: T) => handleSubmit(),
      formId: `form-${WrappedComponent.displayName || WrappedComponent.name}`
    };

    return (
      <form
        className={formClassName}
        onSubmit={handleSubmit}
        style={{
          width: '100%'
        }}
      >
        <WrappedComponent
          {...restProps as P}
          {...formProps}
        />

        {/* Form Actions */}
        {(showSubmitButton || showResetButton) && (
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.colors.border.light}`
          }}>
            {showResetButton && (
              <button
                type="button"
                onClick={form.reset}
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Reset
              </button>
            )}

            {showSubmitButton && (
              <button
                type="submit"
                disabled={!form.isValid || isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (!form.isValid || isSubmitting) ? '#e5e7eb' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!form.isValid || isSubmitting) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmitting ? loadingText : submitButtonText}
              </button>
            )}
          </div>
        )}
      </form>
    );
  };

  WithFormComponent.displayName = `withForm(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithFormComponent;
}

// Utility components for common form patterns
export const FormField: React.FC<{
  label?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ label, error, required, children, className }) => {
  const theme = useThemeColors();

  return (
    <div className={className} style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: theme.colors.text.primary,
          marginBottom: '6px'
        }}>
          {label}
          {required && (
            <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}

      {children}

      {error && (
        <div style={{
          fontSize: '12px',
          color: '#ef4444',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export const FormSection: React.FC<{
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => {
  const theme = useThemeColors();

  return (
    <div className={className} style={{ marginBottom: '32px' }}>
      {title && (
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: description ? '4px' : '16px'
        }}>
          {title}
        </h3>
      )}

      {description && (
        <p style={{
          fontSize: '14px',
          color: theme.colors.text.secondary,
          marginBottom: '16px',
          lineHeight: '1.5'
        }}>
          {description}
        </p>
      )}

      {children}
    </div>
  );
};