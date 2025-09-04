export interface LetterTemplate {
  id: string;
  name: string;
  category: LetterCategory;
  type: LetterType;
  subject: string;
  content: string;
  variables: TemplateVariable[];
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  successRate: number;
  tags: string[];
  description?: string;
  legalBasis?: string;
  requiredDocuments?: string[];
  followUpDays?: number;
  priority: LetterPriority;
}

export interface GeneratedLetter {
  id: string;
  templateId: string;
  clientId: string;
  disputeId?: string;
  recipientType: RecipientType;
  recipientId: string;
  subject: string;
  content: string;
  status: LetterStatus;
  sentDate?: Date;
  deliveredDate?: Date;
  responseDate?: Date;
  responseReceived: boolean;
  responseType?: ResponseType;
  responseContent?: string;
  trackingNumber?: string;
  deliveryMethod: DeliveryMethod;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: LetterMetadata;
  attachments: LetterAttachment[];
  followUpLetters: string[];
  escalationLevel: number;
  legalDeadline?: Date;
  complianceChecked: boolean;
  automatedGeneration: boolean;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: VariableType;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: string[];
  validation?: VariableValidation;
  description?: string;
  category: VariableCategory;
}

export interface VariableValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface LetterMetadata {
  wordCount: number;
  pageCount: number;
  estimatedReadTime: number;
  legalCompliance: ComplianceStatus;
  urgencyLevel: UrgencyLevel;
  expectedResponseDays: number;
  costEstimate?: number;
  deliveryConfirmation: boolean;
  certifiedMail: boolean;
  returnReceiptRequested: boolean;
}

export interface LetterAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  isRequired: boolean;
  uploadedAt: Date;
}

export interface LetterAnalytics {
  totalLetters: number;
  sentLetters: number;
  deliveredLetters: number;
  responsesReceived: number;
  successfulOutcomes: number;
  averageResponseTime: number;
  deliveryRate: number;
  responseRate: number;
  successRate: number;
  costPerLetter: number;
  topPerformingTemplates: TemplatePerformance[];
  monthlyTrends: MonthlyLetterTrend[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  usageCount: number;
  successRate: number;
  averageResponseTime: number;
  deliveryRate: number;
}

export interface MonthlyLetterTrend {
  month: string;
  sent: number;
  delivered: number;
  responses: number;
  successful: number;
}

export interface CategoryBreakdown {
  category: LetterCategory;
  count: number;
  percentage: number;
  successRate: number;
}

export interface BulkLetterGeneration {
  id: string;
  name: string;
  templateId: string;
  clientIds: string[];
  status: BulkGenerationStatus;
  totalLetters: number;
  generatedLetters: number;
  failedLetters: number;
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
  errors: BulkGenerationError[];
  settings: BulkGenerationSettings;
}

export interface BulkGenerationError {
  clientId: string;
  clientName: string;
  error: string;
  timestamp: Date;
}

export interface BulkGenerationSettings {
  autoSend: boolean;
  deliveryMethod: DeliveryMethod;
  scheduleDate?: Date;
  batchSize: number;
  delayBetweenBatches: number;
  includeAttachments: boolean;
  customVariables: Record<string, any>;
}

export interface DeliveryTracking {
  letterId: string;
  trackingNumber: string;
  carrier: DeliveryCarrier;
  status: DeliveryStatus;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  attempts: DeliveryAttempt[];
  lastUpdated: Date;
  deliveryAddress: Address;
  signatureRequired: boolean;
  signedBy?: string;
  deliveryConfirmation?: string;
}

export interface DeliveryAttempt {
  attemptNumber: number;
  timestamp: Date;
  status: AttemptStatus;
  location?: string;
  notes?: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Enums
export enum LetterCategory {
  DISPUTE = 'dispute',
  VALIDATION = 'validation',
  GOODWILL = 'goodwill',
  CEASE_DESIST = 'cease_desist',
  METHOD_OF_VERIFICATION = 'method_of_verification',
  INTENT_TO_SUE = 'intent_to_sue',
  FOLLOW_UP = 'follow_up',
  ESCALATION = 'escalation',
  SETTLEMENT = 'settlement',
  COMPLAINT = 'complaint',
  PAYMENT_PLAN = 'payment_plan'
}

export enum LetterType {
  INITIAL = 'initial',
  FOLLOW_UP = 'follow_up',
  FINAL_NOTICE = 'final_notice',
  LEGAL_NOTICE = 'legal_notice',
  SETTLEMENT_OFFER = 'settlement_offer',
  COMPLAINT_FILING = 'complaint_filing'
}

export enum LetterPriority {
  LOW = 'low',
  NORMAL = 'normal',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum RecipientType {
  CREDIT_BUREAU = 'credit_bureau',
  CREDITOR = 'creditor',
  COLLECTION_AGENCY = 'collection_agency',
  DATA_FURNISHER = 'data_furnisher',
  ATTORNEY_GENERAL = 'attorney_general',
  CFPB = 'cfpb',
  FTC = 'ftc',
  COURT = 'court'
}

export enum LetterStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RESPONSE_RECEIVED = 'response_received',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ResponseType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  PARTIAL = 'partial',
  REQUEST_MORE_INFO = 'request_more_info',
  INVALID_REQUEST = 'invalid_request',
  NO_RESPONSE = 'no_response'
}

export enum DeliveryMethod {
  EMAIL = 'email',
  USPS_FIRST_CLASS = 'usps_first_class',
  USPS_CERTIFIED = 'usps_certified',
  USPS_PRIORITY = 'usps_priority',
  FEDEX = 'fedex',
  UPS = 'ups',
  HAND_DELIVERY = 'hand_delivery',
  FAX = 'fax'
}

export enum VariableType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  MULTILINE = 'multiline',
  BOOLEAN = 'boolean',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage'
}

export enum VariableCategory {
  CLIENT_INFO = 'client_info',
  DISPUTE_INFO = 'dispute_info',
  ACCOUNT_INFO = 'account_info',
  LEGAL_INFO = 'legal_info',
  CONTACT_INFO = 'contact_info',
  CUSTOM = 'custom'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  NEEDS_REVIEW = 'needs_review',
  PENDING_APPROVAL = 'pending_approval'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum BulkGenerationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum DeliveryCarrier {
  USPS = 'usps',
  FEDEX = 'fedex',
  UPS = 'ups',
  DHL = 'dhl'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned',
  EXCEPTION = 'exception'
}

export enum AttemptStatus {
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  RESCHEDULED = 'rescheduled',
  REFUSED = 'refused',
  ADDRESS_UNKNOWN = 'address_unknown'
}

// Helper functions
export function getLetterCategoryLabel(category: LetterCategory): string {
  const labels = {
    [LetterCategory.DISPUTE]: 'Dispute Letter',
    [LetterCategory.VALIDATION]: 'Validation Letter',
    [LetterCategory.GOODWILL]: 'Goodwill Letter',
    [LetterCategory.CEASE_DESIST]: 'Cease & Desist',
    [LetterCategory.METHOD_OF_VERIFICATION]: 'Method of Verification',
    [LetterCategory.INTENT_TO_SUE]: 'Intent to Sue',
    [LetterCategory.FOLLOW_UP]: 'Follow-up Letter',
    [LetterCategory.ESCALATION]: 'Escalation Letter',
    [LetterCategory.SETTLEMENT]: 'Settlement Letter',
    [LetterCategory.COMPLAINT]: 'Complaint Letter',
    [LetterCategory.PAYMENT_PLAN]: 'Payment Plan Letter'
  };
  return labels[category] || category;
}

export function getLetterStatusColor(status: LetterStatus): string {
  const colors = {
    [LetterStatus.DRAFT]: 'secondary',
    [LetterStatus.PENDING_REVIEW]: 'warning',
    [LetterStatus.APPROVED]: 'info',
    [LetterStatus.SCHEDULED]: 'primary',
    [LetterStatus.SENT]: 'success',
    [LetterStatus.DELIVERED]: 'success',
    [LetterStatus.FAILED]: 'danger',
    [LetterStatus.RESPONSE_RECEIVED]: 'info',
    [LetterStatus.COMPLETED]: 'success',
    [LetterStatus.CANCELLED]: 'secondary'
  };
  return colors[status] || 'secondary';
}

export function getDeliveryMethodLabel(method: DeliveryMethod): string {
  const labels = {
    [DeliveryMethod.EMAIL]: 'Email',
    [DeliveryMethod.USPS_FIRST_CLASS]: 'USPS First Class',
    [DeliveryMethod.USPS_CERTIFIED]: 'USPS Certified Mail',
    [DeliveryMethod.USPS_PRIORITY]: 'USPS Priority Mail',
    [DeliveryMethod.FEDEX]: 'FedEx',
    [DeliveryMethod.UPS]: 'UPS',
    [DeliveryMethod.HAND_DELIVERY]: 'Hand Delivery',
    [DeliveryMethod.FAX]: 'Fax'
  };
  return labels[method] || method;
}

export function calculateLetterMetrics(letters: GeneratedLetter[]): LetterAnalytics {
  const totalLetters = letters.length;
  const sentLetters = letters.filter(l => l.status === LetterStatus.SENT || l.status === LetterStatus.DELIVERED).length;
  const deliveredLetters = letters.filter(l => l.status === LetterStatus.DELIVERED).length;
  const responsesReceived = letters.filter(l => l.responseReceived).length;
  const successfulOutcomes = letters.filter(l => l.responseType === ResponseType.POSITIVE).length;
  
  const responseLetters = letters.filter(l => l.responseReceived && l.sentDate && l.responseDate);
  const averageResponseTime = responseLetters.length > 0 
    ? responseLetters.reduce((sum, l) => {
        const days = Math.floor((l.responseDate!.getTime() - l.sentDate!.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / responseLetters.length
    : 0;

  return {
    totalLetters,
    sentLetters,
    deliveredLetters,
    responsesReceived,
    successfulOutcomes,
    averageResponseTime,
    deliveryRate: sentLetters > 0 ? (deliveredLetters / sentLetters) * 100 : 0,
    responseRate: deliveredLetters > 0 ? (responsesReceived / deliveredLetters) * 100 : 0,
    successRate: responsesReceived > 0 ? (successfulOutcomes / responsesReceived) * 100 : 0,
    costPerLetter: 0, // Would be calculated based on delivery method and other factors
    topPerformingTemplates: [],
    monthlyTrends: [],
    categoryBreakdown: []
  };
}