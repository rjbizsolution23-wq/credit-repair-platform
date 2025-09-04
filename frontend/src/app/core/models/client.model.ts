export interface Client {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  ssn?: string;
  address?: Address;
  previous_address?: Address;
  employment?: Employment;
  status: ClientStatus;
  currentStage: ClientStage;
  creditScore?: number;
  activeDisputes?: number;
  totalDisputes?: number;
  avatar?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
  preferredContactMethod?: string;
  assignedAgent?: string;
  subscriptionPlan?: string;
  monthlyFee?: number;
  nextPaymentDate?: Date;
  documents?: ClientDocument[];
  creditReports?: CreditReport[];
  disputes?: Dispute[];
  communications?: Communication[];
  goals?: CreditGoal[];
  preferences?: ClientPreferences;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface Employment {
  employer_name?: string;
  job_title?: string;
  work_phone?: string;
  monthly_income?: number;
  employment_length?: string;
}

export interface ClientDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadedAt: Date;
  size: number;
  mimeType: string;
}

export interface CreditReport {
  id: string;
  bureau: CreditBureau;
  reportDate: Date;
  score: number;
  accounts: CreditAccount[];
  inquiries: CreditInquiry[];
  publicRecords: PublicRecord[];
  personalInfo: PersonalInfo;
}

export interface CreditAccount {
  id: string;
  creditorName: string;
  accountNumber: string;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  creditLimit?: number;
  paymentHistory: PaymentHistory[];
  openDate: Date;
  lastReported: Date;
  isDisputed: boolean;
}

export interface CreditInquiry {
  id: string;
  creditorName: string;
  inquiryDate: Date;
  type: InquiryType;
  isDisputed: boolean;
}

export interface PublicRecord {
  id: string;
  type: PublicRecordType;
  description: string;
  amount?: number;
  filingDate: Date;
  status: string;
  isDisputed: boolean;
}

export interface PersonalInfo {
  name: string;
  addresses: Address[];
  phoneNumbers: string[];
  employers: Employer[];
}

export interface Employer {
  name: string;
  position?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentHistory {
  date: Date;
  status: PaymentStatus;
  amount?: number;
}

export interface Dispute {
  id: string;
  clientId: string;
  type: DisputeType;
  status: DisputeStatus;
  bureau: CreditBureau;
  accountId?: string;
  inquiryId?: string;
  publicRecordId?: string;
  reason: string;
  description: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  responseDate?: Date;
  result?: DisputeResult;
  nextAction?: string;
}

export interface Communication {
  id: string;
  type: CommunicationType;
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: Date;
  status: CommunicationStatus;
  attachments?: string[];
}

export interface CreditGoal {
  id: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  targetDate: Date;
  status: GoalStatus;
  description: string;
}

export interface ClientPreferences {
  communicationMethod: CommunicationType[];
  notificationSettings: NotificationSettings;
  reportFrequency: ReportFrequency;
  autoPayEnabled: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  disputeUpdates: boolean;
  paymentReminders: boolean;
  creditScoreChanges: boolean;
}

// Enums
export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ClientStage {
  INITIAL_REVIEW = 'initial_review',
  CREDIT_ANALYSIS = 'credit_analysis',
  DISPUTE_PHASE = 'dispute_phase',
  VERIFICATION = 'verification',
  LEGAL_ACTION = 'legal_action',
  MONITORING = 'monitoring',
  COMPLETED = 'completed'
}

export enum DocumentType {
  ID_VERIFICATION = 'id_verification',
  PROOF_OF_ADDRESS = 'proof_of_address',
  CREDIT_REPORT = 'credit_report',
  DISPUTE_LETTER = 'dispute_letter',
  RESPONSE_LETTER = 'response_letter',
  LEGAL_DOCUMENT = 'legal_document',
  OTHER = 'other'
}

export enum CreditBureau {
  EXPERIAN = 'experian',
  EQUIFAX = 'equifax',
  TRANSUNION = 'transunion'
}

export enum AccountType {
  CREDIT_CARD = 'credit_card',
  MORTGAGE = 'mortgage',
  AUTO_LOAN = 'auto_loan',
  STUDENT_LOAN = 'student_loan',
  PERSONAL_LOAN = 'personal_loan',
  LINE_OF_CREDIT = 'line_of_credit',
  OTHER = 'other'
}

export enum AccountStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PAID = 'paid',
  CHARGE_OFF = 'charge_off',
  COLLECTION = 'collection',
  BANKRUPTCY = 'bankruptcy'
}

export enum InquiryType {
  HARD = 'hard',
  SOFT = 'soft'
}

export enum PublicRecordType {
  BANKRUPTCY = 'bankruptcy',
  TAX_LIEN = 'tax_lien',
  JUDGMENT = 'judgment',
  FORECLOSURE = 'foreclosure'
}

export enum PaymentStatus {
  ON_TIME = 'on_time',
  LATE_30 = 'late_30',
  LATE_60 = 'late_60',
  LATE_90 = 'late_90',
  LATE_120 = 'late_120',
  CHARGE_OFF = 'charge_off'
}

export enum DisputeType {
  ACCOUNT_DISPUTE = 'account_dispute',
  INQUIRY_DISPUTE = 'inquiry_dispute',
  PERSONAL_INFO = 'personal_info',
  PUBLIC_RECORD = 'public_record'
}

export enum DisputeStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  ESCALATED = 'escalated'
}

export enum DisputeResult {
  DELETED = 'deleted',
  UPDATED = 'updated',
  VERIFIED = 'verified',
  PENDING = 'pending'
}

export enum CommunicationType {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
  MAIL = 'mail',
  PORTAL = 'portal'
}

export enum CommunicationStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum GoalType {
  CREDIT_SCORE = 'credit_score',
  DEBT_REDUCTION = 'debt_reduction',
  ACCOUNT_REMOVAL = 'account_removal',
  INQUIRY_REMOVAL = 'inquiry_removal'
}

export enum GoalStatus {
  ACTIVE = 'active',
  ACHIEVED = 'achieved',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export enum ReportFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}