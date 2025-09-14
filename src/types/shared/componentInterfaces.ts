// Phase 8: Standardized Component Interfaces
// Common prop patterns and interfaces for consistent component APIs

import type { ReactNode, CSSProperties, HTMLAttributes, AriaAttributes } from 'react';

// Base component props that all components should extend
export interface BaseComponentProps extends HTMLAttributes<HTMLElement>, AriaAttributes {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  testId?: string;
  'data-testid'?: string;
}

// Size variants used across components
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants used across components
export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Common event handler types
export interface CommonEventHandlers {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
}

// Modal-related props
export interface ModalComponentProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  focusTrap?: boolean;
  initialFocus?: string; // CSS selector
  returnFocus?: boolean;
}

// Form-related props
export interface FormComponentProps extends BaseComponentProps {
  name?: string;
  value?: any;
  defaultValue?: any;
  onChange?: (value: any, event?: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string | null;
  warning?: string | null;
  touched?: boolean;
  dirty?: boolean;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

// Button component props
export interface ButtonComponentProps extends BaseComponentProps {
  variant?: ComponentVariant;
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

// Card component props
export interface CardComponentProps extends BaseComponentProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: ComponentSize | 'none';
  hoverable?: boolean;
  clickable?: boolean;
  loading?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

// List component props
export interface ListComponentProps<T = any> extends BaseComponentProps {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loading?: boolean;
  error?: string | null;
  emptyState?: ReactNode;
  loadingState?: ReactNode;
  errorState?: ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  onItemClick?: (item: T, index: number) => void;
  onItemSelect?: (item: T, index: number) => void;
  selectedItems?: T[];
  multiSelect?: boolean;
  virtualized?: boolean;
  itemHeight?: number;
}

// Table component props
export interface TableComponentProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  emptyState?: ReactNode;
  sortable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  selectable?: boolean;
  selectedRows?: T[];
  onRowSelect?: (rows: T[]) => void;
  onRowClick?: (row: T, index: number) => void;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
}

// Navigation component props
export interface NavigationComponentProps extends BaseComponentProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  variant?: 'tabs' | 'pills' | 'underline' | 'sidebar';
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export interface NavigationItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string | number;
  children?: NavigationItem[];
}

// Dropdown/Select component props
export interface SelectComponentProps<T = any> extends FormComponentProps {
  options: SelectOption<T>[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  loadingText?: string;
  noOptionsText?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  maxMenuHeight?: number;
  menuPlacement?: 'auto' | 'bottom' | 'top';
}

export interface SelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
  description?: string;
  icon?: ReactNode;
}

// Input component props
export interface InputComponentProps extends FormComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  size?: ComponentSize;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  addonBefore?: ReactNode;
  addonAfter?: ReactNode;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  step?: number;
  min?: number;
  max?: number;
  showCharacterCount?: boolean;
  allowClear?: boolean;
  onClear?: () => void;
}

// Textarea component props
export interface TextareaComponentProps extends FormComponentProps {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  autoResize?: boolean;
  resize?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

// Checkbox/Radio component props
export interface CheckboxComponentProps extends FormComponentProps {
  checked?: boolean;
  indeterminate?: boolean;
  label?: ReactNode;
  description?: string;
  size?: ComponentSize;
}

export interface RadioGroupComponentProps extends FormComponentProps {
  options: RadioOption[];
  layout?: 'horizontal' | 'vertical';
  size?: ComponentSize;
}

export interface RadioOption {
  value: any;
  label: ReactNode;
  disabled?: boolean;
  description?: string;
}

// File upload component props
export interface FileUploadComponentProps extends FormComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  dragAndDrop?: boolean;
  showPreview?: boolean;
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  uploadFunction?: (file: File) => Promise<string>; // returns URL
  onUploadProgress?: (progress: number) => void;
}

// Notification/Alert component props
export interface AlertComponentProps extends BaseComponentProps {
  variant?: ComponentVariant | 'neutral';
  size?: ComponentSize;
  title?: string;
  description?: string;
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  actions?: ReactNode;
  showIcon?: boolean;
}

// Badge/Chip component props
export interface BadgeComponentProps extends BaseComponentProps {
  variant?: ComponentVariant | 'outline' | 'ghost';
  size?: ComponentSize;
  count?: number;
  dot?: boolean;
  showZero?: boolean;
  overflowCount?: number;
}

// Avatar component props
export interface AvatarComponentProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  size?: ComponentSize | number;
  shape?: 'circle' | 'square';
  fallback?: string;
  icon?: ReactNode;
  loading?: boolean;
  onError?: () => void;
}

// Tooltip component props
export interface TooltipComponentProps extends BaseComponentProps {
  tooltipTitle: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  trigger?: 'hover' | 'focus' | 'click' | 'contextMenu';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  delay?: number;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  overlayClassName?: string;
  overlayStyle?: CSSProperties;
}

// Popover component props
export interface PopoverComponentProps extends Omit<BaseComponentProps, 'content'> {
  content: ReactNode;
  popoverTitle?: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  trigger?: 'hover' | 'focus' | 'click' | 'contextMenu';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  delay?: number;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  overlayClassName?: string;
  overlayStyle?: CSSProperties;
  header?: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  destroyOnClose?: boolean;
}

// Drawer component props
export interface DrawerComponentProps extends ModalComponentProps {
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: number | string;
  height?: number | string;
  drawerTitle?: ReactNode;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  bodyStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  mask?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  push?: boolean;
  level?: string | string[];
  handler?: ReactNode;
}

// Accordion/Collapse component props
export interface AccordionComponentProps extends BaseComponentProps {
  items: AccordionItem[];
  activeKeys?: string[];
  defaultActiveKeys?: string[];
  accordion?: boolean; // Only one panel open at a time
  ghost?: boolean;
  size?: ComponentSize;
  onAccordionChange?: (activeKeys: string[]) => void;
}

export interface AccordionItem {
  key: string;
  header: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  extra?: ReactNode;
  showArrow?: boolean;
  forceRender?: boolean;
}

// Progress component props
export interface ProgressComponentProps extends BaseComponentProps {
  percent: number;
  type?: 'line' | 'circle' | 'dashboard';
  status?: 'normal' | 'exception' | 'active' | 'success';
  strokeColor?: string | { from: string; to: string };
  strokeWidth?: number;
  trailColor?: string;
  size?: ComponentSize | number;
  showInfo?: boolean;
  format?: (percent?: number) => ReactNode;
  gapDegree?: number;
  gapPosition?: 'top' | 'bottom' | 'left' | 'right';
  steps?: number;
}

// Skeleton component props
export interface SkeletonComponentProps extends BaseComponentProps {
  loading: boolean;
  active?: boolean;
  avatar?: boolean | SkeletonAvatarProps;
  paragraph?: boolean | SkeletonParagraphProps;
  skeletonTitle?: boolean | SkeletonTitleProps;
  round?: boolean;
}

export interface SkeletonAvatarProps {
  size?: ComponentSize | number;
  shape?: 'circle' | 'square';
}

export interface SkeletonParagraphProps {
  rows?: number;
  width?: number | string | Array<number | string>;
}

export interface SkeletonTitleProps {
  width?: number | string;
}

// Calendar/DatePicker component props
export interface CalendarComponentProps extends FormComponentProps {
  format?: string;
  showTime?: boolean;
  showToday?: boolean;
  disabledDate?: (date: Date) => boolean;
  disabledTime?: (date: Date) => { disabledHours?: number[]; disabledMinutes?: number[]; disabledSeconds?: number[] };
  locale?: any;
  size?: ComponentSize;
  picker?: 'time' | 'date' | 'week' | 'month' | 'quarter' | 'year';
  mode?: 'date' | 'week' | 'month' | 'quarter' | 'year' | 'decade';
  onPanelChange?: (value: Date, mode: string) => void;
  ranges?: Record<string, [Date, Date]>;
}

// Tree component props
export interface TreeComponentProps<T = any> extends BaseComponentProps {
  data: TreeNode<T>[];
  checkable?: boolean;
  selectable?: boolean;
  multiple?: boolean;
  defaultExpandAll?: boolean;
  defaultExpandedKeys?: string[];
  defaultSelectedKeys?: string[];
  defaultCheckedKeys?: string[];
  expandedKeys?: string[];
  selectedKeys?: string[];
  checkedKeys?: string[];
  onExpand?: (expandedKeys: string[]) => void;
  onTreeSelect?: (selectedKeys: string[], info: any) => void;
  onCheck?: (checkedKeys: string[], info: any) => void;
  onRightClick?: (info: { event: React.MouseEvent; node: TreeNode<T> }) => void;
  showLine?: boolean;
  showIcon?: boolean;
  icon?: ReactNode | ((props: any) => ReactNode);
  switcherIcon?: ReactNode | ((props: any) => ReactNode);
  draggable?: boolean;
  onDragStart?: (info: any) => void;
  onDragEnter?: (info: any) => void;
  onDragOver?: (info: any) => void;
  onDragLeave?: (info: any) => void;
  onDrop?: (info: any) => void;
  allowDrop?: (info: any) => boolean;
}

export interface TreeNode<T = any> {
  key: string;
  title: ReactNode;
  value?: T;
  children?: TreeNode<T>[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  selectable?: boolean;
  checkable?: boolean;
  icon?: ReactNode;
  isLeaf?: boolean;
  loading?: boolean;
}

// Higher-order component props
export interface WithLoadingProps {
  loading?: boolean;
  loadingComponent?: ReactNode;
  loadingDelay?: number;
}

export interface WithErrorProps {
  error?: string | null;
  errorComponent?: ReactNode;
  onRetry?: () => void;
}

export interface WithPermissionProps {
  permission?: string | string[];
  fallback?: ReactNode;
  checkPermission?: (permission: string | string[]) => boolean;
}

// Component composition helpers
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

export type OmitCommonProps<T> = Omit<T, keyof BaseComponentProps>;

export type MergeProps<T, U> = Omit<T, keyof U> & U;

// Utility types for event handlers
export type ClickHandler = (event: React.MouseEvent) => void;
export type ChangeHandler<T = any> = (value: T, event?: any) => void;
export type FocusHandler = (event: React.FocusEvent) => void;
export type BlurHandler = (event: React.FocusEvent) => void;
export type KeyHandler = (event: React.KeyboardEvent) => void;

// Responsive prop patterns
export type ResponsiveValue<T> = T | {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

// Animation and transition props
export interface AnimationProps {
  animate?: boolean;
  duration?: number;
  delay?: number;
  easing?: string;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

// Accessibility helpers
export interface A11yProps extends AriaAttributes {
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
}