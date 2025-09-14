// Standardized prop interfaces for consistent component APIs

// Base interfaces that many components extend
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
  loadingComponent?: React.ReactNode;
}

export interface ErrorProps {
  error?: string | null;
  onErrorRetry?: () => void;
  errorComponent?: React.ReactNode;
}

export interface DisabledProps {
  disabled?: boolean;
  disabledReason?: string;
}

// Modal component interfaces
export interface ModalBaseProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

// Form component interfaces
export interface FormFieldBaseProps extends BaseComponentProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  disabled?: boolean;
}

export interface InputProps extends FormFieldBaseProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local' | 'time';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  readOnly?: boolean;
}

export interface TextareaProps extends FormFieldBaseProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  cols?: number;
  maxLength?: number;
  minLength?: number;
  readOnly?: boolean;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps extends FormFieldBaseProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  noOptionsMessage?: string;
  maxMenuHeight?: number;
}

// Button component interfaces
export interface ButtonBaseProps extends BaseComponentProps, DisabledProps {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: string; // Specific variants defined per design system
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Card/List item interfaces
export interface CardProps extends BaseComponentProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  image?: React.ReactNode;
  avatar?: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
}

export interface ListItemProps extends BaseComponentProps {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

// Task-specific interfaces
export interface TaskComponentProps extends BaseComponentProps {
  task: import('../types').Task;
  onUpdate?: (taskId: string, updates: Partial<import('../types').Task>) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (task: import('../types').Task) => void;
  readonly?: boolean;
}

export interface TaskListProps extends BaseComponentProps {
  tasks: import('../types').Task[];
  onTaskUpdate?: (taskId: string, updates: Partial<import('../types').Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskClick?: (task: import('../types').Task) => void;
  onTaskAdd?: () => void;
  loading?: boolean;
  empty?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// Navigation interfaces
export interface NavigationItemProps extends BaseComponentProps {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: NavigationItemProps[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

// Data display interfaces
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> extends BaseComponentProps, LoadingProps {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectable?: boolean;
  pagination?: boolean | {
    pageSize?: number;
    current?: number;
    total?: number;
    onChange?: (page: number, pageSize?: number) => void;
  };
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  empty?: React.ReactNode;
}

// Feedback interfaces
export interface AlertProps extends BaseComponentProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export interface ToastProps extends AlertProps {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Layout interfaces
export interface LayoutProps extends BaseComponentProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

// Animation interfaces
export interface TransitionProps {
  in?: boolean;
  timeout?: number | { enter?: number; exit?: number };
  appear?: boolean;
  enter?: boolean;
  exit?: boolean;
  onEnter?: () => void;
  onEntering?: () => void;
  onEntered?: () => void;
  onExit?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
}

// Event handler types
export type ChangeHandler<T = any> = (value: T) => void;
export type ClickHandler = (e: React.MouseEvent) => void;
export type KeyboardHandler = (e: React.KeyboardEvent) => void;
export type FocusHandler = (e: React.FocusEvent) => void;