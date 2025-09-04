import { DisputeStatus } from './dispute.model';

export interface CreditReport {
  id: string;
  clientId: string;
  bureau: CreditBureau;
  reportDate: Date;
  reportType: ReportType;
  score: number;
  scoreRange: string;
  scoreFactors: ScoreFactor[];
  personalInfo: PersonalInfo;
  accounts: CreditAccount[];
  inquiries: CreditInquiry[];
  publicRecords: PublicRecord[];
  collections: Collection[];
  alerts: CreditAlert[];
  summary: ReportSummary;
  rawData?: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: ReportStatus;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalInfo {
  names: PersonName[];
  addresses: ReportAddress[];
  ssn: string;
  dateOfBirth: Date;
  employers: Employer[];
  phoneNumbers: string[];
}

export interface PersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  isPrimary: boolean;
}

export interface ReportAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;
  reportedDate?: Date;
}

export interface Employer {
  name: string;
  address?: string;
  position?: string;
  dateReported?: Date;
}

export interface CreditAccount {
  id: string;
  accountNumber: string;
  creditorName: string;
  accountType: AccountType;
  accountStatus: AccountStatus;
  balance: number;
  creditLimit?: number;
  highBalance?: number;
  monthlyPayment?: number;
  dateOpened: Date;
  dateClosed?: Date;
  lastActivity?: Date;
  paymentHistory: PaymentHistory[];
  remarks?: string;
  disputeStatus?: DisputeStatus;
  isNegative: boolean;
  ageInMonths: number;
}

export interface PaymentHistory {
  month: string;
  year: number;
  status: PaymentStatus;
  amount?: number;
}

export interface CreditInquiry {
  id: string;
  creditorName: string;
  inquiryDate: Date;
  inquiryType: InquiryType;
  purpose?: string;
  isDisputed?: boolean;
}

export interface PublicRecord {
  id: string;
  type: PublicRecordType;
  status: string;
  amount?: number;
  dateReported: Date;
  courtName?: string;
  caseNumber?: string;
  attorney?: string;
  isDisputed?: boolean;
}

export interface Collection {
  id: string;
  creditorName: string;
  originalCreditor?: string;
  amount: number;
  dateReported: Date;
  status: CollectionStatus;
  accountNumber?: string;
  isDisputed?: boolean;
}

export interface CreditAlert {
  id: string;
  type: AlertType;
  message: string;
  severity: AlertSeverity;
  dateCreated: Date;
  isRead: boolean;
  relatedAccountId?: string;
}

export interface ScoreFactor {
  factor: string;
  impact: ScoreImpact;
  description: string;
}

export interface ReportSummary {
  totalAccounts: number;
  openAccounts: number;
  closedAccounts: number;
  negativeAccounts: number;
  totalInquiries: number;
  hardInquiries: number;
  softInquiries: number;
  publicRecords: number;
  collections: number;
  totalDebt: number;
  availableCredit: number;
  creditUtilization: number;
  averageAccountAge: number;
  oldestAccount: Date;
  newestAccount: Date;
}

export interface CreditScoreHistory {
  id: string;
  clientId: string;
  bureau: CreditBureau;
  score: number;
  date: Date;
  change: number;
  factors: string[];
}

export interface CreditMonitoring {
  id: string;
  clientId: string;
  isActive: boolean;
  frequency: MonitoringFrequency;
  alertTypes: AlertType[];
  lastCheck: Date;
  nextCheck: Date;
  settings: MonitoringSettings;
}

export interface MonitoringSettings {
  emailAlerts: boolean;
  smsAlerts: boolean;
  scoreChangeThreshold: number;
  newAccountAlerts: boolean;
  inquiryAlerts: boolean;
  addressChangeAlerts: boolean;
}

export interface ReportComparison {
  clientId: string;
  reports: CreditReport[];
  changes: ReportChange[];
  scoreChanges: ScoreChange[];
  newAccounts: CreditAccount[];
  removedAccounts: CreditAccount[];
  updatedAccounts: AccountChange[];
}

export interface ReportChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: ChangeType;
  impact: ChangeImpact;
}

export interface ScoreChange {
  bureau: CreditBureau;
  oldScore: number;
  newScore: number;
  change: number;
  factors: string[];
}

export interface AccountChange {
  accountId: string;
  changes: ReportChange[];
  impact: ChangeImpact;
}

// Enums
export enum CreditBureau {
  EXPERIAN = 'experian',
  EQUIFAX = 'equifax',
  TRANSUNION = 'transunion'
}

export enum ReportType {
  FULL = 'full',
  MONITORING = 'monitoring',
  DISPUTE = 'dispute',
  EDUCATIONAL = 'educational'
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  ARCHIVED = 'archived'
}

export enum AccountType {
  CREDIT_CARD = 'credit_card',
  MORTGAGE = 'mortgage',
  AUTO_LOAN = 'auto_loan',
  STUDENT_LOAN = 'student_loan',
  PERSONAL_LOAN = 'personal_loan',
  LINE_OF_CREDIT = 'line_of_credit',
  RETAIL = 'retail',
  OTHER = 'other'
}

export enum AccountStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PAID = 'paid',
  CHARGE_OFF = 'charge_off',
  COLLECTION = 'collection',
  SETTLED = 'settled'
}

export enum PaymentStatus {
  CURRENT = 'current',
  LATE_30 = 'late_30',
  LATE_60 = 'late_60',
  LATE_90 = 'late_90',
  LATE_120 = 'late_120',
  CHARGE_OFF = 'charge_off',
  COLLECTION = 'collection',
  NO_DATA = 'no_data'
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

export enum CollectionStatus {
  OPEN = 'open',
  PAID = 'paid',
  SETTLED = 'settled',
  DISPUTED = 'disputed'
}

export enum AlertType {
  SCORE_CHANGE = 'score_change',
  NEW_ACCOUNT = 'new_account',
  NEW_INQUIRY = 'new_inquiry',
  ADDRESS_CHANGE = 'address_change',
  IDENTITY_ALERT = 'identity_alert',
  FRAUD_ALERT = 'fraud_alert'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ScoreImpact {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

export enum MonitoringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  UPDATED = 'updated'
}

export enum ChangeImpact {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

// Helper functions
export function getScoreRange(score: number): string {
  if (score >= 800) return 'Excellent (800-850)';
  if (score >= 740) return 'Very Good (740-799)';
  if (score >= 670) return 'Good (670-739)';
  if (score >= 580) return 'Fair (580-669)';
  return 'Poor (300-579)';
}

export function getScoreColor(score: number): string {
  if (score >= 740) return 'success';
  if (score >= 670) return 'info';
  if (score >= 580) return 'warning';
  return 'danger';
}

export function calculateCreditUtilization(accounts: CreditAccount[]): number {
  const creditCards = accounts.filter(acc => acc.accountType === AccountType.CREDIT_CARD && acc.accountStatus === AccountStatus.OPEN);
  const totalBalance = creditCards.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLimit = creditCards.reduce((sum, acc) => sum + (acc.creditLimit || 0), 0);
  return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
}

export function getAccountAgeInMonths(dateOpened: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dateOpened.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
}

export function isNegativeAccount(account: CreditAccount): boolean {
  return account.accountStatus === AccountStatus.CHARGE_OFF ||
         account.accountStatus === AccountStatus.COLLECTION ||
         account.paymentHistory.some(ph => ph.status !== PaymentStatus.CURRENT && ph.status !== PaymentStatus.NO_DATA);
}