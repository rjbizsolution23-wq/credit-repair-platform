export interface Dispute {
  id: string;
  clientId: string;
  clientName?: string;
  type: DisputeType;
  status: DisputeStatus;
  bureau: CreditBureau;
  creditorName: string;
  originalCreditor?: string;
  accountNumber: string;
  amount: number;
  reason: string;
  description?: string;
  priority: DisputePriority;
  submittedAt?: Date;
  dueDate?: Date;
  responseDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  documents?: DisputeDocument[];
  responses?: DisputeResponse[];
  timeline?: DisputeTimelineEntry[];
  notes?: DisputeNote[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DisputeDocument {
  id: string;
  disputeId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
  category: DocumentCategory;
}

export interface DisputeResponse {
  id: string;
  disputeId: string;
  bureau: CreditBureau;
  responseType: ResponseType;
  responseDate: Date;
  responseText?: string;
  outcome: DisputeOutcome;
  documents?: DisputeDocument[];
  nextAction?: string;
  followUpDate?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface DisputeTimelineEntry {
  id: string;
  disputeId: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: Date;
  metadata?: Record<string, any>;
}

export interface DisputeNote {
  id: string;
  disputeId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface DisputeTemplate {
  id: string;
  name: string;
  description?: string;
  type: DisputeType;
  bureau?: CreditBureau;
  category: string;
  content: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: VariableType;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: string[];
  validation?: string;
}

export interface DisputeFilter {
  search?: string;
  status?: DisputeStatus[];
  type?: DisputeType[];
  bureau?: CreditBureau[];
  priority?: DisputePriority[];
  clientId?: string;
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  tags?: string[];
  page?: number;
  limit?: number;
  sort?: string;
}

export interface DisputeStats {
  total: number;
  byStatus: Record<DisputeStatus, number>;
  byType: Record<DisputeType, number>;
  byBureau: Record<CreditBureau, number>;
  byPriority: Record<DisputePriority, number>;
  avgResolutionTime: number;
  successRate: number;
  overdueCount: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export interface BulkDisputeOperation {
  disputeIds: string[];
  operation: BulkOperation;
  data?: any;
}

export interface DisputeExportOptions {
  format: ExportFormat;
  filters?: DisputeFilter;
  fields?: string[];
  includeDocuments?: boolean;
  includeResponses?: boolean;
  includeTimeline?: boolean;
}

// Enums
export enum DisputeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  PENDING_RESPONSE = 'pending_response',
  UNDER_REVIEW = 'under_review',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled'
}

export enum DisputeType {
  ACCOUNT_DISPUTE = 'account_dispute',
  INQUIRY_DISPUTE = 'inquiry_dispute',
  PERSONAL_INFO = 'personal_info',
  PUBLIC_RECORD = 'public_record',
  MIXED_FILE = 'mixed_file',
  IDENTITY_THEFT = 'identity_theft',
  FRAUD_ALERT = 'fraud_alert',
  CREDIT_FREEZE = 'credit_freeze'
}

export enum CreditBureau {
  EXPERIAN = 'experian',
  EQUIFAX = 'equifax',
  TRANSUNION = 'transunion',
  INNOVIS = 'innovis',
  CHEXSYSTEMS = 'chexsystems',
  LexisNexis = 'lexisnexis'
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DocumentCategory {
  DISPUTE_LETTER = 'dispute_letter',
  SUPPORTING_DOCUMENT = 'supporting_document',
  BUREAU_RESPONSE = 'bureau_response',
  CREDITOR_RESPONSE = 'creditor_response',
  LEGAL_DOCUMENT = 'legal_document',
  IDENTIFICATION = 'identification',
  PROOF_OF_ADDRESS = 'proof_of_address',
  OTHER = 'other'
}

export enum ResponseType {
  VERIFICATION = 'verification',
  DELETION = 'deletion',
  CORRECTION = 'correction',
  INVESTIGATION = 'investigation',
  FRIVOLOUS = 'frivolous',
  NO_RESPONSE = 'no_response'
}

export enum DisputeOutcome {
  DELETED = 'deleted',
  UPDATED = 'updated',
  VERIFIED = 'verified',
  PARTIAL_DELETION = 'partial_deletion',
  PENDING = 'pending',
  REJECTED = 'rejected'
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  BOOLEAN = 'boolean',
  EMAIL = 'email',
  PHONE = 'phone',
  CURRENCY = 'currency'
}

export enum BulkOperation {
  UPDATE_STATUS = 'update_status',
  UPDATE_PRIORITY = 'update_priority',
  ASSIGN_USER = 'assign_user',
  ADD_TAGS = 'add_tags',
  REMOVE_TAGS = 'remove_tags',
  DELETE = 'delete',
  EXPORT = 'export'
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json'
}

// Helper functions
export function getDisputeStatusLabel(status: DisputeStatus): string {
  const labels: Record<DisputeStatus, string> = {
    [DisputeStatus.DRAFT]: 'Draft',
    [DisputeStatus.SUBMITTED]: 'Submitted',
    [DisputeStatus.IN_PROGRESS]: 'In Progress',
    [DisputeStatus.PENDING_RESPONSE]: 'Pending Response',
    [DisputeStatus.UNDER_REVIEW]: 'Under Review',
    [DisputeStatus.COMPLETED]: 'Completed',
    [DisputeStatus.REJECTED]: 'Rejected',
    [DisputeStatus.ESCALATED]: 'Escalated',
    [DisputeStatus.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
}

export function getDisputeTypeLabel(type: DisputeType): string {
  const labels: Record<DisputeType, string> = {
    [DisputeType.ACCOUNT_DISPUTE]: 'Account Dispute',
    [DisputeType.INQUIRY_DISPUTE]: 'Inquiry Dispute',
    [DisputeType.PERSONAL_INFO]: 'Personal Information',
    [DisputeType.PUBLIC_RECORD]: 'Public Record',
    [DisputeType.MIXED_FILE]: 'Mixed File',
    [DisputeType.IDENTITY_THEFT]: 'Identity Theft',
    [DisputeType.FRAUD_ALERT]: 'Fraud Alert',
    [DisputeType.CREDIT_FREEZE]: 'Credit Freeze'
  };
  return labels[type] || type;
}

export function getCreditBureauLabel(bureau: CreditBureau): string {
  const labels: Record<CreditBureau, string> = {
    [CreditBureau.EXPERIAN]: 'Experian',
    [CreditBureau.EQUIFAX]: 'Equifax',
    [CreditBureau.TRANSUNION]: 'TransUnion',
    [CreditBureau.INNOVIS]: 'Innovis',
    [CreditBureau.CHEXSYSTEMS]: 'ChexSystems',
    [CreditBureau.LexisNexis]: 'LexisNexis'
  };
  return labels[bureau] || bureau;
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

export function isDisputeOverdue(dispute: Dispute): boolean {
  if (!dispute.dueDate) return false;
  return new Date(dispute.dueDate) < new Date();
}

export function getDisputeAge(dispute: Dispute): number {
  const now = new Date();
  const created = new Date(dispute.createdAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export function canEditDispute(dispute: Dispute, userRole: string): boolean {
  if (userRole === 'admin' || userRole === 'super_admin') return true;
  return [DisputeStatus.DRAFT, DisputeStatus.SUBMITTED].includes(dispute.status);
}

export function canDeleteDispute(dispute: Dispute, userRole: string): boolean {
  if (userRole === 'admin' || userRole === 'super_admin') return true;
  return dispute.status === DisputeStatus.DRAFT;
}