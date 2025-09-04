// Common interfaces and types used across the application

// Table related interfaces
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'status' | 'actions';
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: string;
  pipe?: string;
}

export interface TableAction {
  label: string;
  icon?: string;
  action: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  disabled?: boolean;
  permission?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  actions?: TableAction[];
  bulkActions?: BulkAction[];
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  searching?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export interface TableData {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
}

// Bulk actions
export interface BulkAction {
  label: string;
  icon?: string;
  action: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  confirmMessage?: string;
  permission?: string;
}

// Filter interfaces
export interface FilterOption {
  label: string;
  value: any;
  count?: number;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
  multiple?: boolean;
}

export interface FilterConfig {
  fields: FilterField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

// Form interfaces
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  options?: { label: string; value: any }[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  hint?: string;
  icon?: string;
  rows?: number; // for textarea
  multiple?: boolean; // for file input
  accept?: string; // for file input
}

export interface FormConfig {
  fields: FormField[];
  layout?: 'vertical' | 'horizontal' | 'inline';
  submitLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  loading?: boolean;
}

// Chart interfaces
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  data: any;
  options?: any;
  height?: number;
  width?: number;
  responsive?: boolean;
  loading?: boolean;
  error?: string;
}

// Status interfaces
export interface StatusConfig {
  value: string;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  icon?: string;
  tooltip?: string;
}

// Progress interfaces
export interface ProgressConfig {
  value: number;
  max?: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  striped?: boolean;
  animated?: boolean;
  showPercentage?: boolean;
}

// Stats card interfaces
export interface StatsCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  loading?: boolean;
  clickable?: boolean;
  route?: string;
}

// Page header interfaces
export interface PageHeader {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: HeaderAction[];
  tabs?: Tab[];
  activeTab?: string;
}

export interface Breadcrumb {
  label: string;
  route?: string;
  active?: boolean;
}

export interface HeaderAction {
  label: string;
  icon?: string;
  action?: string;
  route?: string;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  permission?: string;
  dropdown?: DropdownItem[];
}

export interface DropdownItem {
  label: string;
  icon?: string;
  action?: string;
  route?: string;
  divider?: boolean;
  permission?: string;
}

// Tab interfaces
export interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
  permission?: string;
}

// Notification interfaces
export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  color?: 'primary' | 'secondary';
}

// File upload interfaces
export interface FileUploadConfig {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  dragDrop?: boolean;
  preview?: boolean;
  uploadUrl?: string;
  headers?: { [key: string]: string };
}

export interface UploadedFile {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Search interfaces
export interface SearchConfig {
  placeholder?: string;
  debounceTime?: number;
  minLength?: number;
  showClearButton?: boolean;
  suggestions?: string[];
}

// Date range picker interfaces
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRangeConfig {
  format?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  presets?: DateRangePreset[];
}

export interface DateRangePreset {
  label: string;
  range: DateRange;
}

// Empty state interfaces
export interface EmptyStateConfig {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    route?: string;
    action?: string;
    icon?: string;
  };
}

// Accordion interfaces
export interface AccordionItem {
  id: string;
  title: string;
  content?: string;
  expanded?: boolean;
  disabled?: boolean;
  icon?: string;
  badge?: string | number;
}

// Common utility types
export type SortDirection = 'asc' | 'desc';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type Size = 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

// API response interfaces
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Permission interfaces
export interface Permission {
  resource: string;
  action: string;
  conditions?: any;
}

export interface UserPermissions {
  [key: string]: boolean;
}

// Theme interfaces
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  secondaryColor?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

// Export utility functions
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
export const DEFAULT_DEBOUNCE_TIME = 300;
export const DEFAULT_NOTIFICATION_DURATION = 5000;
export const DEFAULT_FILE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/
};