// Dispute Models and Enums

export enum DisputeType {
  ACCOUNT_DISPUTE = 'account_dispute',
  INQUIRY_DISPUTE = 'inquiry_dispute',
  PERSONAL_INFO = 'personal_info',
  PUBLIC_RECORD = 'public_record',
  MIXED_FILE = 'mixed_file'
}

export enum DisputeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  PENDING_RESPONSE = 'pending_response',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated'
}

export enum CreditBureau {
  EXPERIAN = 'experian',
  EQUIFAX = 'equifax',
  TRANSUNION = 'transunion'
}

export enum DisputeReason {
  NOT_MINE = 'not_mine',
  INCORRECT_BALANCE = 'incorrect_balance',
  INCORRECT_PAYMENT_HISTORY = 'incorrect_payment_history',
  ACCOUNT_CLOSED = 'account_closed',
  PAID_IN_FULL = 'paid_in_full',
  SETTLED = 'settled',
  INCORRECT_DATES = 'incorrect_dates',
  DUPLICATE = 'duplicate',
  IDENTITY_THEFT = 'identity_theft',
  UNAUTHORIZED = 'unauthorized',
  INCORRECT_PERSONAL_INFO = 'incorrect_personal_info'
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DeliveryMethod {
  ONLINE = 'online',
  MAIL = 'mail',
  CERTIFIED_MAIL = 'certified_mail',
  EMAIL = 'email'
}

export interface Dispute {
  id: string;
  client_id: string;
  client_name: string;
  type: DisputeType;
  status: DisputeStatus;
  bureau: CreditBureau;
  reason: DisputeReason;
  priority: DisputePriority;
  description: string;
  account_number?: string;
  creditor_name?: string;
  dispute_items: DisputeItem[];
  template_id?: string;
  letter_content: string;
  delivery_method: DeliveryMethod;
  tracking_number?: string;
  created_date: Date;
  submitted_date?: Date;
  due_date: Date;
  response_date?: Date;
  resolution_date?: Date;
  notes: string;
  attachments: DisputeAttachment[];
  created_by: string;
  updated_by: string;
  updated_date: Date;
}

export interface DisputeItem {
  id: string;
  account_name: string;
  account_number: string;
  balance: number;
  status: string;
  dispute_reason: DisputeReason;
  description: string;
  selected: boolean;
}

export interface DisputeTemplate {
  id: string;
  name: string;
  type: DisputeType;
  bureau: CreditBureau;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  is_active: boolean;
  created_date: Date;
  updated_date: Date;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  default_value?: string;
  placeholder?: string;
  options?: string[];
}

export interface DisputeLetter {
  id: string;
  dispute_id: string;
  template_id: string;
  subject: string;
  content: string;
  recipient_name: string;
  recipient_address: string;
  delivery_method: DeliveryMethod;
  tracking_number?: string;
  sent_date?: Date;
  delivery_date?: Date;
  status: 'draft' | 'sent' | 'delivered' | 'failed';
  created_date: Date;
}

export interface DisputeAttachment {
  id: string;
  dispute_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description?: string;
  uploaded_date: Date;
}

export interface DisputeResponse {
  id: string;
  dispute_id: string;
  bureau: CreditBureau;
  response_type: 'verification' | 'deletion' | 'update' | 'rejection';
  response_content: string;
  received_date: Date;
  processed_date?: Date;
  attachments: DisputeAttachment[];
  notes: string;
}

export interface DisputeStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  success_rate: number;
  by_bureau: Record<CreditBureau, number>;
  by_type: Record<DisputeType, number>;
  by_status: Record<DisputeStatus, number>;
}

export interface DisputeChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// Helper Functions
export function getDisputeTypeLabel(type: DisputeType): string {
  const labels: Record<DisputeType, string> = {
    [DisputeType.ACCOUNT_DISPUTE]: 'Account Dispute',
    [DisputeType.INQUIRY_DISPUTE]: 'Inquiry Dispute',
    [DisputeType.PERSONAL_INFO]: 'Personal Information',
    [DisputeType.PUBLIC_RECORD]: 'Public Record',
    [DisputeType.MIXED_FILE]: 'Mixed File'
  };
  return labels[type] || type;
}

export function getDisputeStatusLabel(status: DisputeStatus): string {
  const labels: Record<DisputeStatus, string> = {
    [DisputeStatus.DRAFT]: 'Draft',
    [DisputeStatus.SUBMITTED]: 'Submitted',
    [DisputeStatus.IN_PROGRESS]: 'In Progress',
    [DisputeStatus.PENDING_RESPONSE]: 'Pending Response',
    [DisputeStatus.UNDER_REVIEW]: 'Under Review',
    [DisputeStatus.RESOLVED]: 'Resolved',
    [DisputeStatus.REJECTED]: 'Rejected',
    [DisputeStatus.ESCALATED]: 'Escalated'
  };
  return labels[status] || status;
}

export function getCreditBureauLabel(bureau: CreditBureau): string {
  const labels: Record<CreditBureau, string> = {
    [CreditBureau.EXPERIAN]: 'Experian',
    [CreditBureau.EQUIFAX]: 'Equifax',
    [CreditBureau.TRANSUNION]: 'TransUnion'
  };
  return labels[bureau] || bureau;
}

export function getDisputeReasonLabel(reason: DisputeReason): string {
  const labels: Record<DisputeReason, string> = {
    [DisputeReason.NOT_MINE]: 'Not My Account',
    [DisputeReason.INCORRECT_BALANCE]: 'Incorrect Balance',
    [DisputeReason.INCORRECT_PAYMENT_HISTORY]: 'Incorrect Payment History',
    [DisputeReason.ACCOUNT_CLOSED]: 'Account Closed',
    [DisputeReason.PAID_IN_FULL]: 'Paid in Full',
    [DisputeReason.SETTLED]: 'Settled',
    [DisputeReason.INCORRECT_DATES]: 'Incorrect Dates',
    [DisputeReason.DUPLICATE]: 'Duplicate',
    [DisputeReason.IDENTITY_THEFT]: 'Identity Theft',
    [DisputeReason.UNAUTHORIZED]: 'Unauthorized',
    [DisputeReason.INCORRECT_PERSONAL_INFO]: 'Incorrect Personal Information'
  };
  return labels[reason] || reason;
}

export function getDisputePriorityLabel(priority: DisputePriority): string {
  const labels: Record<DisputePriority, string> = {
    [DisputePriority.LOW]: 'Low',
    [DisputePriority.MEDIUM]: 'Medium',
    [DisputePriority.HIGH]: 'High',
    [DisputePriority.URGENT]: 'Urgent'
  };
  return labels[priority] || priority;
}

// Color Helper Functions
export function getDisputeStatusColor(status: DisputeStatus): string {
  const colors: Record<DisputeStatus, string> = {
    [DisputeStatus.DRAFT]: 'secondary',
    [DisputeStatus.SUBMITTED]: 'info',
    [DisputeStatus.IN_PROGRESS]: 'warning',
    [DisputeStatus.PENDING_RESPONSE]: 'primary',
    [DisputeStatus.UNDER_REVIEW]: 'warning',
    [DisputeStatus.RESOLVED]: 'success',
    [DisputeStatus.REJECTED]: 'danger',
    [DisputeStatus.ESCALATED]: 'danger'
  };
  return colors[status] || 'secondary';
}

export function getDisputeTypeColor(type: DisputeType): string {
  const colors: Record<DisputeType, string> = {
    [DisputeType.ACCOUNT_DISPUTE]: 'primary',
    [DisputeType.INQUIRY_DISPUTE]: 'info',
    [DisputeType.PERSONAL_INFO]: 'warning',
    [DisputeType.PUBLIC_RECORD]: 'danger',
    [DisputeType.MIXED_FILE]: 'secondary'
  };
  return colors[type] || 'secondary';
}

export function getCreditBureauColor(bureau: CreditBureau): string {
  const colors: Record<CreditBureau, string> = {
    [CreditBureau.EXPERIAN]: 'success',
    [CreditBureau.EQUIFAX]: 'warning',
    [CreditBureau.TRANSUNION]: 'info'
  };
  return colors[bureau] || 'secondary';
}

export function getDisputeReasonColor(reason: DisputeReason): string {
  const colors: Record<DisputeReason, string> = {
    [DisputeReason.NOT_MINE]: 'danger',
    [DisputeReason.INCORRECT_BALANCE]: 'warning',
    [DisputeReason.INCORRECT_PAYMENT_HISTORY]: 'warning',
    [DisputeReason.ACCOUNT_CLOSED]: 'info',
    [DisputeReason.PAID_IN_FULL]: 'success',
    [DisputeReason.SETTLED]: 'success',
    [DisputeReason.INCORRECT_DATES]: 'warning',
    [DisputeReason.DUPLICATE]: 'danger',
    [DisputeReason.IDENTITY_THEFT]: 'danger',
    [DisputeReason.UNAUTHORIZED]: 'danger',
    [DisputeReason.INCORRECT_PERSONAL_INFO]: 'warning'
  };
  return colors[reason] || 'secondary';
}

export function getDisputePriorityColor(priority: DisputePriority): string {
  const colors: Record<DisputePriority, string> = {
    [DisputePriority.LOW]: 'success',
    [DisputePriority.MEDIUM]: 'warning',
    [DisputePriority.HIGH]: 'danger',
    [DisputePriority.URGENT]: 'danger'
  };
  return colors[priority] || 'secondary';
}

// Utility Functions
export function calculateDisputeAge(createdDate: Date): number {
  const today = new Date();
  const created = new Date(createdDate);
  const diffTime = today.getTime() - created.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDisputeOverdue(dueDate: Date): boolean {
  const today = new Date();
  const due = new Date(dueDate);
  return due < today;
}

export function getDaysUntilDeadline(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export interface DisputeHistoryEntry {
  id: string;
  action: string;
  description: string;
  createdAt: Date;
  userName?: string;
  userId?: string;
  disputeId?: string;
  disputeReferenceNumber?: string;
  clientName?: string;
  disputeStatus?: DisputeStatus;
  disputePriority?: DisputePriority;
  changes?: {
    field: string;
    oldValue?: string;
    newValue?: string;
  }[];
  additionalData?: Record<string, any>;
  metadata?: any;
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}