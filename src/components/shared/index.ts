// Shared Components - Phase 6: Unified State Management
// Standardized UI components for consistent user experience

// Phase 6: Unified State Display Components
export * from './UnifiedStateComponents';

// Phase 7: Enhanced Form System
export * from './EnhancedFormComponents';
export * from './FormTemplates';

// Re-export individual components for convenience

// Phase 6 Components
export {
  ErrorDisplay,
  LoadingDisplay,
  SuccessDisplay,
  NotificationToast,
  NotificationContainer,
  SkeletonLine,
  SkeletonAvatar,
  SkeletonCard,
  EmptyState,
} from './UnifiedStateComponents';

// Phase 7 Components
export {
  EnhancedTextInput,
  EnhancedPasswordInput,
  EnhancedTextarea,
  EnhancedSelect,
  EnhancedCheckbox,
  EnhancedRadioGroup,
  EnhancedFileInput,
  FormField,
  FormSubmitButton,
} from './EnhancedFormComponents';

export {
  FormBuilder,
  LoginForm,
  RegisterForm,
  ContactForm,
  FormStepWizard,
  withFormEnhancements,
} from './FormTemplates';