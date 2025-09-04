// Enums
export enum CreditBureau {
  EXPERIAN = 'experian',
  EQUIFAX = 'equifax',
  TRANSUNION = 'transunion'
}

export enum DisputeType {
  INACCURATE_INFORMATION = 'inaccurate_information',
  IDENTITY_THEFT = 'identity_theft',
  MIXED_FILES = 'mixed_files',
  OUTDATED_INFORMATION = 'outdated_information',
  DUPLICATE_ACCOUNTS = 'duplicate_accounts',
  UNAUTHORIZED_INQUIRY = 'unauthorized_inquiry',
  INCORRECT_STATUS = 'incorrect_status',
  INCORRECT_BALANCE = 'incorrect_balance',
  INCORRECT_PAYMENT_HISTORY = 'incorrect_payment_history',
  ACCOUNT_NOT_MINE = 'account_not_mine'
}

export enum DisputeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  UNDER_INVESTIGATION = 'under_investigation',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled'
}

export enum DisputeMethod {
  ONLINE = 'online',
  MAIL = 'mail',
  PHONE = 'phone',
  FAX = 'fax'
}

export enum CommunicationType {
  DISPUTE_LETTER = 'dispute_letter',
  FOLLOW_UP = 'follow_up',
  ESCALATION = 'escalation',
  INQUIRY = 'inquiry',
  COMPLAINT = 'complaint',
  VERIFICATION_REQUEST = 'verification_request'
}

export enum CommunicationStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  RESPONSE_RECEIVED = 'response_received',
  FAILED = 'failed'
}

export enum ResponseType {
  INVESTIGATION_RESULTS = 'investigation_results',
  UPDATED_REPORT = 'updated_report',
  VERIFICATION_LETTER = 'verification_letter',
  REJECTION_NOTICE = 'rejection_notice',
  ACKNOWLEDGMENT = 'acknowledgment'
}

export enum ResponseStatus {
  PENDING_REVIEW = 'pending_review',
  REVIEWED = 'reviewed',
  PROCESSED = 'processed',
  REQUIRES_ACTION = 'requires_action'
}

export enum ContactType {
  DISPUTE_DEPARTMENT = 'dispute_department',
  CUSTOMER_SERVICE = 'customer_service',
  FRAUD_DEPARTMENT = 'fraud_department',
  LEGAL_DEPARTMENT = 'legal_department',
  EXECUTIVE_OFFICE = 'executive_office'
}

// Interfaces
export interface BureauDispute {
  id: string;
  clientId: string;
  bureau: CreditBureau;
  type: DisputeType;
  status: DisputeStatus;
  method: DisputeMethod;
  title: string;
  description: string;
  disputedItems: DisputedItem[];
  supportingDocuments: Document[];
  submittedAt?: string;
  expectedResponseDate?: string;
  actualResponseDate?: string;
  resolution?: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  metadata: DisputeMetadata;
}

export interface DisputedItem {
  id: string;
  accountNumber?: string;
  creditorName: string;
  itemType: string; // account, inquiry, personal_info, etc.
  currentValue: string;
  disputedValue: string;
  reason: string;
  status: string;
  resolution?: string;
}

export interface DisputeMetadata {
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  estimatedImpact: number; // credit score impact
  followUpRequired: boolean;
  escalationLevel: number;
  automatedFlags: string[];
}

export interface BureauCommunication {
  id: string;
  clientId: string;
  disputeId?: string;
  bureau: CreditBureau;
  type: CommunicationType;
  status: CommunicationStatus;
  subject: string;
  content: string;
  method: DisputeMethod;
  sentAt?: string;
  deliveredAt?: string;
  responseExpectedBy?: string;
  attachments: Document[];
  trackingNumber?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BureauResponse {
  id: string;
  communicationId: string;
  disputeId?: string;
  bureau: CreditBureau;
  type: ResponseType;
  status: ResponseStatus;
  receivedAt: string;
  processedAt?: string;
  content: string;
  attachments: Document[];
  changes: CreditReportChange[];
  actionRequired: boolean;
  nextSteps: string[];
  reviewedBy?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditReportChange {
  itemId: string;
  itemType: string;
  field: string;
  oldValue: string;
  newValue: string;
  changeType: 'added' | 'updated' | 'removed';
  impactScore: number;
}

export interface BureauContact {
  id: string;
  bureau: CreditBureau;
  type: ContactType;
  name: string;
  title: string;
  department: string;
  email?: string;
  phone?: string;
  fax?: string;
  address: Address;
  notes: string;
  isActive: boolean;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DisputeTracking {
  id: string;
  disputeId: string;
  status: DisputeStatus;
  timestamp: string;
  description: string;
  performedBy: string;
  notes?: string;
  attachments: Document[];
}

export interface BureauAnalytics {
  totalDisputes: number;
  activeDisputes: number;
  resolvedDisputes: number;
  successRate: number;
  averageResolutionTime: number;
  disputesByBureau: BureauStats[];
  disputesByType: TypeStats[];
  monthlyTrends: MonthlyTrend[];
  topReasons: ReasonStats[];
}

export interface BureauStats {
  bureau: CreditBureau;
  total: number;
  resolved: number;
  pending: number;
  successRate: number;
  averageTime: number;
}

export interface TypeStats {
  type: DisputeType;
  count: number;
  successRate: number;
  averageTime: number;
}

export interface MonthlyTrend {
  month: string;
  submitted: number;
  resolved: number;
  successRate: number;
}

export interface ReasonStats {
  reason: string;
  count: number;
  percentage: number;
}

export interface DisputeTemplate {
  id: string;
  name: string;
  type: DisputeType;
  bureau?: CreditBureau;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: string[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  type: 'dispute_created' | 'response_received' | 'deadline_approaching' | 'status_changed';
  parameters: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface AutomationAction {
  type: 'send_email' | 'create_task' | 'update_status' | 'send_notification';
  parameters: Record<string, any>;
}

// Helper Functions
export function getCreditBureauLabel(bureau: CreditBureau): string {
  const labels = {
    [CreditBureau.EXPERIAN]: 'Experian',
    [CreditBureau.EQUIFAX]: 'Equifax',
    [CreditBureau.TRANSUNION]: 'TransUnion'
  };
  return labels[bureau] || bureau;
}

export function getCreditBureauColor(bureau: CreditBureau): string {
  const colors = {
    [CreditBureau.EXPERIAN]: 'primary',
    [CreditBureau.EQUIFAX]: 'success',
    [CreditBureau.TRANSUNION]: 'info'
  };
  return colors[bureau] || 'secondary';
}

export function getDisputeTypeLabel(type: DisputeType): string {
  const labels = {
    [DisputeType.INACCURATE_INFORMATION]: 'Inaccurate Information',
    [DisputeType.IDENTITY_THEFT]: 'Identity Theft',
    [DisputeType.MIXED_FILES]: 'Mixed Files',
    [DisputeType.OUTDATED_INFORMATION]: 'Outdated Information',
    [DisputeType.DUPLICATE_ACCOUNTS]: 'Duplicate Accounts',
    [DisputeType.UNAUTHORIZED_INQUIRY]: 'Unauthorized Inquiry',
    [DisputeType.INCORRECT_STATUS]: 'Incorrect Status',
    [DisputeType.INCORRECT_BALANCE]: 'Incorrect Balance',
    [DisputeType.INCORRECT_PAYMENT_HISTORY]: 'Incorrect Payment History',
    [DisputeType.ACCOUNT_NOT_MINE]: 'Account Not Mine'
  };
  return labels[type] || type;
}

export function getDisputeStatusLabel(status: DisputeStatus): string {
  const labels = {
    [DisputeStatus.DRAFT]: 'Draft',
    [DisputeStatus.SUBMITTED]: 'Submitted',
    [DisputeStatus.IN_PROGRESS]: 'In Progress',
    [DisputeStatus.UNDER_INVESTIGATION]: 'Under Investigation',
    [DisputeStatus.RESOLVED]: 'Resolved',
    [DisputeStatus.REJECTED]: 'Rejected',
    [DisputeStatus.ESCALATED]: 'Escalated',
    [DisputeStatus.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
}

export function getDisputeStatusColor(status: DisputeStatus): string {
  const colors = {
    [DisputeStatus.DRAFT]: 'secondary',
    [DisputeStatus.SUBMITTED]: 'info',
    [DisputeStatus.IN_PROGRESS]: 'warning',
    [DisputeStatus.UNDER_INVESTIGATION]: 'warning',
    [DisputeStatus.RESOLVED]: 'success',
    [DisputeStatus.REJECTED]: 'danger',
    [DisputeStatus.ESCALATED]: 'danger',
    [DisputeStatus.CANCELLED]: 'dark'
  };
  return colors[status] || 'secondary';
}

export function getDisputeMethodLabel(method: DisputeMethod): string {
  const labels = {
    [DisputeMethod.ONLINE]: 'Online',
    [DisputeMethod.MAIL]: 'Mail',
    [DisputeMethod.PHONE]: 'Phone',
    [DisputeMethod.FAX]: 'Fax'
  };
  return labels[method] || method;
}

export function getCommunicationTypeLabel(type: CommunicationType): string {
  const labels = {
    [CommunicationType.DISPUTE_LETTER]: 'Dispute Letter',
    [CommunicationType.FOLLOW_UP]: 'Follow Up',
    [CommunicationType.ESCALATION]: 'Escalation',
    [CommunicationType.INQUIRY]: 'Inquiry',
    [CommunicationType.COMPLAINT]: 'Complaint',
    [CommunicationType.VERIFICATION_REQUEST]: 'Verification Request'
  };
  return labels[type] || type;
}

export function getCommunicationStatusLabel(status: CommunicationStatus): string {
  const labels = {
    [CommunicationStatus.DRAFT]: 'Draft',
    [CommunicationStatus.SENT]: 'Sent',
    [CommunicationStatus.DELIVERED]: 'Delivered',
    [CommunicationStatus.RESPONSE_RECEIVED]: 'Response Received',
    [CommunicationStatus.FAILED]: 'Failed'
  };
  return labels[status] || status;
}

export function getCommunicationStatusColor(status: CommunicationStatus): string {
  const colors = {
    [CommunicationStatus.DRAFT]: 'secondary',
    [CommunicationStatus.SENT]: 'info',
    [CommunicationStatus.DELIVERED]: 'success',
    [CommunicationStatus.RESPONSE_RECEIVED]: 'primary',
    [CommunicationStatus.FAILED]: 'danger'
  };
  return colors[status] || 'secondary';
}

export function getResponseTypeLabel(type: ResponseType): string {
  const labels = {
    [ResponseType.INVESTIGATION_RESULTS]: 'Investigation Results',
    [ResponseType.UPDATED_REPORT]: 'Updated Report',
    [ResponseType.VERIFICATION_LETTER]: 'Verification Letter',
    [ResponseType.REJECTION_NOTICE]: 'Rejection Notice',
    [ResponseType.ACKNOWLEDGMENT]: 'Acknowledgment'
  };
  return labels[type] || type;
}

export function getContactTypeLabel(type: ContactType): string {
  const labels = {
    [ContactType.DISPUTE_DEPARTMENT]: 'Dispute Department',
    [ContactType.CUSTOMER_SERVICE]: 'Customer Service',
    [ContactType.FRAUD_DEPARTMENT]: 'Fraud Department',
    [ContactType.LEGAL_DEPARTMENT]: 'Legal Department',
    [ContactType.EXECUTIVE_OFFICE]: 'Executive Office'
  };
  return labels[type] || type;
}

// Utility Functions
export function calculateDisputeAge(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDisputeOverdue(dispute: BureauDispute): boolean {
  if (!dispute.expectedResponseDate) {
    return false;
  }
  
  const expectedDate = new Date(dispute.expectedResponseDate);
  const now = new Date();
  return expectedDate < now && dispute.status !== DisputeStatus.RESOLVED;
}

export function getDaysUntilDeadline(expectedDate: string): number {
  const deadline = new Date(expectedDate);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}

export function calculateSuccessRate(resolved: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((resolved / total) * 100);
}

export function getDisputePriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'secondary';
  }
}