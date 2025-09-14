// Phase 7: Enhanced Form Components
// Standardized form components with advanced features and consistent styling

import React from 'react';
import { AlertCircle, Eye, EyeOff, Check, X, Info, Upload } from 'lucide-react';

// Base input props
interface BaseInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<any>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string | null;
  warning?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  autoComplete?: string;
  'aria-describedby'?: string;
}

// Enhanced text input
interface EnhancedTextInputProps extends BaseInputProps {
  type?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';
  maxLength?: number;
  pattern?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  spellCheck?: boolean;
  showCharacterCount?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const EnhancedTextInput: React.FC<EnhancedTextInputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  touched,
  required,
  disabled,
  className = '',
  placeholder,
  autoComplete,
  maxLength,
  pattern,
  autoCapitalize,
  spellCheck,
  showCharacterCount = false,
  prefix,
  suffix,
  'aria-describedby': ariaDescribedBy,
}) => {
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  const remainingChars = maxLength ? maxLength - value.length : null;

  const baseClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    ${hasError ? 'border-red-500 bg-red-50/30' : ''}
    ${hasWarning ? 'border-yellow-500 bg-yellow-50/30' : ''}
    ${!hasError && !hasWarning ? 'border-gray-300 bg-white hover:border-gray-400' : ''}
  `;

  const wrapperClasses = `relative ${prefix || suffix ? 'flex items-center' : ''}`;

  const input = (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      maxLength={maxLength}
      pattern={pattern}
      autoCapitalize={autoCapitalize}
      spellCheck={spellCheck}
      aria-describedby={ariaDescribedBy}
      aria-invalid={hasError ? 'true' : 'false'}
      className={`${baseClasses} ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''} ${className}`}
    />
  );

  return (
    <div className="space-y-1">
      <div className={wrapperClasses}>
        {prefix && (
          <div className="absolute left-3 z-10 text-gray-500">
            {prefix}
          </div>
        )}
        {input}
        {suffix && (
          <div className="absolute right-3 z-10 text-gray-500">
            {suffix}
          </div>
        )}
      </div>

      {/* Character count */}
      {showCharacterCount && maxLength && (
        <div className={`text-xs text-right ${
          remainingChars !== null && remainingChars < 10 ? 'text-red-500' : 'text-gray-500'
        }`}>
          {value.length}/{maxLength}
        </div>
      )}

      {/* Error/Warning messages */}
      {hasError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced password input
interface EnhancedPasswordInputProps extends Omit<BaseInputProps, 'type'> {
  showToggle?: boolean;
  strengthIndicator?: boolean;
  autoComplete?: 'current-password' | 'new-password';
}

export const EnhancedPasswordInput: React.FC<EnhancedPasswordInputProps> = ({
  showToggle = true,
  strengthIndicator = false,
  autoComplete = 'current-password',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const calculateStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    return score;
  };

  const strength = strengthIndicator ? calculateStrength(props.value) : 0;
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="space-y-2">
      <EnhancedTextInput
        {...props}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        suffix={
          showToggle ? (
            <button
              type="button"
              onClick={toggleVisibility}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : undefined
        }
      />

      {/* Password strength indicator */}
      {strengthIndicator && props.value && (
        <div className="space-y-1">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < strength ? strengthColors[Math.min(strength - 1, 4)] : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className={`text-xs ${
            strength <= 2 ? 'text-red-600' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            Strength: {strengthLabels[Math.min(strength, 4)]}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced textarea
interface EnhancedTextareaProps extends BaseInputProps {
  rows?: number;
  resize?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoResize?: boolean;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  touched,
  required,
  disabled,
  className = '',
  placeholder,
  rows = 4,
  resize = true,
  maxLength,
  showCharacterCount = false,
  autoResize = false,
  'aria-describedby': ariaDescribedBy,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;
  const remainingChars = maxLength ? maxLength - value.length : null;

  // Auto-resize functionality
  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, rows * 24)}px`;
    }
  }, [value, autoResize, rows]);

  const baseClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    ${hasError ? 'border-red-500 bg-red-50/30' : ''}
    ${hasWarning ? 'border-yellow-500 bg-yellow-50/30' : ''}
    ${!hasError && !hasWarning ? 'border-gray-300 bg-white hover:border-gray-400' : ''}
    ${resize ? 'resize-y' : 'resize-none'}
  `;

  return (
    <div className="space-y-1">
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={autoResize ? 1 : rows}
        maxLength={maxLength}
        aria-describedby={ariaDescribedBy}
        aria-invalid={hasError ? 'true' : 'false'}
        className={`${baseClasses} ${className}`}
      />

      {/* Character count */}
      {showCharacterCount && maxLength && (
        <div className={`text-xs text-right ${
          remainingChars !== null && remainingChars < 10 ? 'text-red-500' : 'text-gray-500'
        }`}>
          {value.length}/{maxLength}
        </div>
      )}

      {/* Error/Warning messages */}
      {hasError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced select
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

interface EnhancedSelectProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  touched,
  required,
  disabled,
  className = '',
  options,
  allowEmpty = false,
  emptyLabel = '-- Select an option --',
  'aria-describedby': ariaDescribedBy,
}) => {
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;

  // Group options if they have groups
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];

    options.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  const baseClasses = `
    w-full px-3 py-2 border rounded-lg transition-all duration-200 appearance-none bg-white
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
    ${hasError ? 'border-red-500 bg-red-50/30' : ''}
    ${hasWarning ? 'border-yellow-500 bg-yellow-50/30' : ''}
    ${!hasError && !hasWarning ? 'border-gray-300 hover:border-gray-400' : ''}
  `;

  return (
    <div className="space-y-1">
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          required={required}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          aria-invalid={hasError ? 'true' : 'false'}
          className={`${baseClasses} ${className} pr-8`}
        >
          {allowEmpty && (
            <option value="">{emptyLabel}</option>
          )}

          {/* Ungrouped options */}
          {groupedOptions.ungrouped.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}

          {/* Grouped options */}
          {Object.entries(groupedOptions.groups).map(([groupName, groupOptions]) => (
            <optgroup key={groupName} label={groupName}>
              {groupOptions.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Error/Warning messages */}
      {hasError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced checkbox
interface EnhancedCheckboxProps {
  id?: string;
  name?: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string | null;
  warning?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: React.ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedCheckbox: React.FC<EnhancedCheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  touched,
  required,
  disabled,
  className = '',
  label,
  description,
  size = 'md',
}) => {
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const baseClasses = `
    rounded border transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError ? 'border-red-500' : ''}
    ${hasWarning ? 'border-yellow-500' : ''}
    ${!hasError && !hasWarning ? 'border-gray-300' : ''}
    ${checked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white'}
  `;

  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-3">
        <div className="flex items-center">
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            required={required}
            disabled={disabled}
            aria-invalid={hasError ? 'true' : 'false'}
            className={`${baseClasses} ${sizeClasses[size]} ${className}`}
          />
          {checked && (
            <Check className={`absolute ${sizeClasses[size]} text-white pointer-events-none`} strokeWidth={3} />
          )}
        </div>

        {label && (
          <div className="flex-1">
            <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
              {label}
            </label>
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Error/Warning messages */}
      {hasError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced radio group
export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface EnhancedRadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string | null;
  warning?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options: RadioOption[];
  layout?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedRadioGroup: React.FC<EnhancedRadioGroupProps> = ({
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  touched,
  required,
  disabled,
  className = '',
  options,
  layout = 'vertical',
  size = 'md',
}) => {
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerClasses = layout === 'horizontal' ? 'flex flex-wrap gap-6' : 'space-y-3';

  return (
    <div className="space-y-2">
      <div className={`${containerClasses} ${className}`}>
        {options.map((option, index) => (
          <div key={option.value} className="flex items-start space-x-3">
            <div className="flex items-center">
              <input
                id={`${name}-${index}`}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                onFocus={onFocus}
                required={required}
                disabled={disabled || option.disabled}
                aria-invalid={hasError ? 'true' : 'false'}
                className={`${sizeClasses[size]} border-gray-300 text-blue-500 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>

            <div className="flex-1">
              <label htmlFor={`${name}-${index}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-gray-600 mt-1">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error/Warning messages */}
      {hasError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

// Enhanced file input
interface EnhancedFileInputProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  dragAndDrop?: boolean;
  preview?: boolean;
  files?: FileList | null;
}

export const EnhancedFileInput: React.FC<EnhancedFileInputProps> = ({
  id,
  name,
  onChange,
  onBlur,
  onFocus,
  error,
  warning,
  touched,
  required,
  disabled,
  className = '',
  accept,
  multiple = false,
  maxSize,
  dragAndDrop = true,
  preview = false,
  files,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const hasError = touched && error;
  const hasWarning = touched && warning && !error;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || !dragAndDrop) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      // Create a synthetic event
      const syntheticEvent = {
        target: { files: droppedFiles }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const dropzoneClasses = `
    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
    ${isDragOver ? 'border-blue-500 bg-blue-50' : ''}
    ${hasError ? 'border-red-500 bg-red-50' : ''}
    ${hasWarning ? 'border-yellow-500 bg-yellow-50' : ''}
    ${!hasError && !hasWarning && !isDragOver ? 'border-gray-300 hover:border-gray-400' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={id}
        name={name}
        type="file"
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={hasError ? 'true' : 'false'}
        className="hidden"
      />

      {/* Dropzone */}
      <div
        className={`${dropzoneClasses} ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-1">
          {dragAndDrop ? 'Drop files here or click to browse' : 'Click to browse files'}
        </p>
        {(accept || maxSize) && (
          <p className="text-xs text-gray-500">
            {accept && `Accepted: ${accept}`}
            {accept && maxSize && ' • '}
            {maxSize && `Max size: ${maxSize}MB`}
          </p>
        )}
      </div>

      {/* File preview */}
      {preview && files && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
          <div className="space-y-2">
            {Array.from(files).map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-500">({formatFileSize(file.size)})</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Remove file logic would go here
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error/Warning messages */}
      {hasError && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hasWarning && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

// Form field wrapper component
interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string | null;
  warning?: string | null;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  warning,
  helpText,
  className = '',
  children,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {helpText && !error && !warning && (
        <p className="text-xs text-gray-600">{helpText}</p>
      )}
    </div>
  );
};

// Form submit button with enhanced states
interface FormSubmitButtonProps {
  children: React.ReactNode;
  isSubmitting?: boolean;
  isValid?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'submit' | 'button';
  onClick?: () => void;
  disabled?: boolean;
  loadingText?: string;
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  children,
  isSubmitting = false,
  isValid = true,
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'submit',
  onClick,
  disabled = false,
  loadingText = 'Submitting...',
}) => {
  const isDisabled = disabled || isSubmitting || !isValid;

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseClasses = `
    inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {isSubmitting && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {isSubmitting ? loadingText : children}
    </button>
  );
};