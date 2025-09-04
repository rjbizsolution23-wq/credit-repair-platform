// Import enums for local use
import {
  ClientStatus,
  ClientStage,
  DocumentType,
  CreditBureau,
  AccountType,
  AccountStatus,
  InquiryType,
  PublicRecordType,
  PaymentStatus,
  DisputeType,
  DisputeStatus,
  DisputeResult,
  CommunicationType,
  CommunicationStatus,
  GoalType,
  GoalStatus,
  ReportFrequency
} from '../../../core/models/client.model';

// Re-export from core models for backward compatibility
export type {
  Client,
  Address,
  ClientDocument,
  CreditReport,
  CreditAccount,
  CreditInquiry,
  PublicRecord,
  PersonalInfo,
  Employer,
  PaymentHistory,
  Dispute,
  Communication,
  CreditGoal,
  ClientPreferences
} from '../../../core/models/client.model';

export {
  ClientStatus,
  ClientStage,
  DocumentType,
  CreditBureau,
  AccountType,
  AccountStatus,
  InquiryType,
  PublicRecordType,
  PaymentStatus,
  DisputeType,
  DisputeStatus,
  DisputeResult,
  CommunicationType,
  CommunicationStatus,
  GoalType,
  GoalStatus,
  ReportFrequency
} from '../../../core/models/client.model';

// Additional interfaces specific to the clients module
export interface ClientFilters {
  status?: string;
  stage?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedAgent?: string;
  subscriptionPlan?: string;
  page?: number;
  limit?: number;
}

export interface ClientListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newThisMonth: number;
  averageCreditScore: number;
  totalDisputes: number;
  activeDisputes: number;
  completedDisputes: number;
  monthlyRevenue: number;
}

export interface ClientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  currentStage: string;
  creditScore?: number;
  avatar?: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  isPrivate: boolean;
  tags?: string[];
}

export interface ClientTimeline {
  id: string;
  clientId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: Date;
  createdBy: string;
  metadata?: any;
}

export enum TimelineEventType {
  CLIENT_CREATED = 'client_created',
  STATUS_CHANGED = 'status_changed',
  STAGE_CHANGED = 'stage_changed',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_UPDATED = 'dispute_updated',
  PAYMENT_PROCESSED = 'payment_processed',
  COMMUNICATION_SENT = 'communication_sent',
  NOTE_ADDED = 'note_added',
  GOAL_CREATED = 'goal_created',
  GOAL_ACHIEVED = 'goal_achieved'
}

export interface ClientPayment {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description?: string;
  transactionId?: string;
  processedAt: Date;
  dueDate?: Date;
  invoiceId?: string;
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  ACH = 'ach',
  CHECK = 'check',
  CASH = 'cash'
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  nextBillingDate: Date;
  monthlyFee: number;
  features: string[];
  isActive: boolean;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface ClientGoal {
  id: string;
  clientId: string;
  type: GoalType;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  targetDate: Date;
  status: GoalStatus;
  priority: GoalPriority;
  createdAt: Date;
  updatedAt: Date;
  achievedAt?: Date;
}

export enum GoalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ClientCommunication {
  id: string;
  clientId: string;
  type: CommunicationType;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: Date;
  status: CommunicationStatus;
  attachments?: string[];
  sentBy?: string;
  readAt?: Date;
  metadata?: any;
}

export interface ClientDocumentUpload {
  file: File;
  type: DocumentType;
  description?: string;
  isPrivate?: boolean;
  tags?: string[];
}

export interface ClientImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  duplicates: number;
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ClientExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  fields: string[];
  filters?: ClientFilters;
  includeHeaders: boolean;
  dateFormat: string;
  encoding: string;
}

export interface ClientBulkAction {
  action: 'delete' | 'update_status' | 'update_stage' | 'assign_agent' | 'add_tag';
  clientIds: string[];
  data?: any;
}

export interface ClientDashboardStats {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
  averageCreditScore: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeDisputes: number;
  completedDisputes: number;
  clientsByStage: { [key: string]: number };
  clientsByStatus: { [key: string]: number };
  recentActivity: ClientTimeline[];
}