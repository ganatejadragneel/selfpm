import React from 'react';
import { useCommonStyles } from '../../styles/commonStyles';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  children,
  className = ''
}) => {
  const styles = useCommonStyles();

  return (
    <div style={styles.formGroup} className={className}>
      <label style={styles.formLabel}>
        {label}
        {required && <span style={styles.requiredIndicator}>*</span>}
      </label>
      {children}
      {error && (
        <div style={{ 
          color: styles.textSecondary.color, 
          fontSize: '12px', 
          marginTop: '4px' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required = false,
  error,
  ...inputProps
}) => {
  const styles = useCommonStyles();

  return (
    <FormField label={label} required={required} error={error}>
      <input
        {...inputProps}
        style={{
          ...styles.formInput,
          ...(error ? { borderColor: '#ef4444' } : {}),
        }}
      />
    </FormField>
  );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  required = false,
  error,
  ...textareaProps
}) => {
  const styles = useCommonStyles();

  return (
    <FormField label={label} required={required} error={error}>
      <textarea
        {...textareaProps}
        style={{
          ...styles.formTextarea,
          ...(error ? { borderColor: '#ef4444' } : {}),
        }}
      />
    </FormField>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  required = false,
  error,
  options,
  ...selectProps
}) => {
  const styles = useCommonStyles();

  return (
    <FormField label={label} required={required} error={error}>
      <select
        {...selectProps}
        style={{
          ...styles.formSelect,
          ...(error ? { borderColor: '#ef4444' } : {}),
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};