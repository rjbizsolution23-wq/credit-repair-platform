// Enums
export enum DocumentType {
  CONTRACT = 'contract',
  AGREEMENT = 'agreement',
  LETTER = 'letter',
  NOTICE = 'notice',
  TEMPLATE = 'template',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  FORM = 'form',
  CERTIFICATE = 'certificate',
  LICENSE = 'license'
}

export enum DocumentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ARCHIVED = 'archived',
  REJECTED = 'rejected'
}

export enum CaseType {
  LITIGATION = 'litigation',
  ARBITRATION = 'arbitration',
  MEDIATION = 'mediation',
  REGULATORY = 'regulatory',
  COMPLIANCE = 'compliance',
  CONTRACT_DISPUTE = 'contract_dispute',
  EMPLOYMENT = 'employment',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  CORPORATE = 'corporate',
  CONSUMER_PROTECTION = 'consumer_protection'
}

export enum CaseStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_REVIEW = 'pending_review',
  SETTLED = 'settled',
  CLOSED = 'closed',
  DISMISSED = 'dismissed',
  ON_HOLD = 'on_hold'
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum ComplianceArea {
  FCRA = 'fcra',
  FDCPA = 'fdcpa',
  TCPA = 'tcpa',
  CFPB = 'cfpb',
  STATE_REGULATIONS = 'state_regulations',
  PRIVACY = 'privacy',
  DATA_PROTECTION = 'data_protection',
  FINANCIAL_SERVICES = 'financial_services',
  CONSUMER_PROTECTION = 'consumer_protection',
  EMPLOYMENT_LAW = 'employment_law'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  NEEDS_ATTENTION = 'needs_attention',
  UNDER_INVESTIGATION = 'under_investigation'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaces
export interface LegalDocument {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  content: string;
  version: string;
  tags: string[];
  category: string;
  description?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  metadata: DocumentMetadata;
  attachments: DocumentAttachment[];
  relatedCases: string[];
  complianceAreas: ComplianceArea[];
}

export interface DocumentMetadata {
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
  digitalSignature?: string;
  encryptionStatus?: boolean;
  accessLevel: string;
  retentionPeriod?: number;
  confidentialityLevel: string;
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  description: string;
  clientId?: string;
  clientName?: string;
  opposingParty?: string;
  jurisdiction: string;
  court?: string;
  judge?: string;
  assignedAttorney: string;
  paralegal?: string;
  openedDate: Date;
  closedDate?: Date;
  nextHearing?: Date;
  statute_of_limitations?: Date;
  estimatedValue?: number;
  actualValue?: number;
  billableHours: number;
  expenses: number;
  documents: string[];
  events: CaseEvent[];
  tasks: CaseTask[];
  notes: CaseNote[];
  complianceIssues: string[];
  riskLevel: RiskLevel;
  tags: string[];
  metadata: CaseMetadata;
}

export interface CaseMetadata {
  confidentialityLevel: string;
  conflictCheck: boolean;
  insuranceCoverage?: boolean;
  retainerAmount?: number;
  billingRate?: number;
  estimatedDuration?: number;
  complexityScore?: number;
}

export interface CaseEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: Date;
  location?: string;
  attendees: string[];
  outcome?: string;
  documents: string[];
  createdBy: string;
  createdAt: Date;
}

export interface CaseTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  priority: CasePriority;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[];
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CaseNote {
  id: string;
  content: string;
  type: 'general' | 'strategy' | 'research' | 'client_communication' | 'court_filing';
  confidential: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  tags: string[];
}

export interface ComplianceItem {
  id: string;
  area: ComplianceArea;
  regulation: string;
  requirement: string;
  description: string;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  lastReviewDate: Date;
  nextReviewDate: Date;
  reviewedBy: string;
  evidence: string[];
  remediation?: ComplianceRemediation;
  relatedCases: string[];
  relatedDocuments: string[];
  tags: string[];
  metadata: ComplianceMetadata;
}

export interface ComplianceMetadata {
  regulatoryBody: string;
  effectiveDate: Date;
  lastUpdated: Date;
  penaltyRange?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  automatedCheck: boolean;
  criticalPath: boolean;
}

export interface ComplianceRemediation {
  id: string;
  description: string;
  steps: RemediationStep[];
  assignedTo: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  cost?: number;
  priority: CasePriority;
  createdAt: Date;
  completedAt?: Date;
}

export interface RemediationStep {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  evidence?: string[];
  notes?: string;
  completedAt?: Date;
}

export interface LegalAnalytics {
  caseStats: CaseStats;
  documentStats: DocumentStats;
  complianceStats: ComplianceStats;
  financialStats: FinancialStats;
  performanceMetrics: PerformanceMetrics;
  trends: LegalTrends;
}

export interface CaseStats {
  totalCases: number;
  openCases: number;
  closedCases: number;
  settledCases: number;
  dismissedCases: number;
  casesByType: TypeStats[];
  casesByPriority: PriorityStats[];
  averageCaseDuration: number;
  successRate: number;
}

export interface DocumentStats {
  totalDocuments: number;
  documentsByType: TypeStats[];
  documentsByStatus: StatusStats[];
  recentDocuments: number;
  expiringDocuments: number;
  averageApprovalTime: number;
}

export interface ComplianceStats {
  totalRequirements: number;
  compliantItems: number;
  nonCompliantItems: number;
  pendingReview: number;
  highRiskItems: number;
  complianceRate: number;
  areaBreakdown: AreaStats[];
}

export interface FinancialStats {
  totalBillableHours: number;
  totalExpenses: number;
  totalRevenue: number;
  averageHourlyRate: number;
  profitMargin: number;
  outstandingInvoices: number;
}

export interface PerformanceMetrics {
  caseResolutionTime: number;
  documentProcessingTime: number;
  complianceResponseTime: number;
  clientSatisfactionScore: number;
  teamUtilization: number;
  qualityScore: number;
}

export interface LegalTrends {
  caseVolumeTrend: MonthlyTrend[];
  complianceTrend: MonthlyTrend[];
  financialTrend: MonthlyTrend[];
  performanceTrend: MonthlyTrend[];
}

export interface TypeStats {
  type: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

export interface PriorityStats {
  priority: string;
  count: number;
  percentage: number;
}

export interface AreaStats {
  area: string;
  compliant: number;
  nonCompliant: number;
  total: number;
  complianceRate: number;
}

export interface MonthlyTrend {
  month: string;
  value: number;
  change?: number;
  changePercentage?: number;
}

// Helper functions
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels = {
    [DocumentType.CONTRACT]: 'Contract',
    [DocumentType.AGREEMENT]: 'Agreement',
    [DocumentType.LETTER]: 'Letter',
    [DocumentType.NOTICE]: 'Notice',
    [DocumentType.TEMPLATE]: 'Template',
    [DocumentType.POLICY]: 'Policy',
    [DocumentType.PROCEDURE]: 'Procedure',
    [DocumentType.FORM]: 'Form',
    [DocumentType.CERTIFICATE]: 'Certificate',
    [DocumentType.LICENSE]: 'License'
  };
  return labels[type] || type;
}

export function getDocumentStatusLabel(status: DocumentStatus): string {
  const labels = {
    [DocumentStatus.DRAFT]: 'Draft',
    [DocumentStatus.REVIEW]: 'Under Review',
    [DocumentStatus.APPROVED]: 'Approved',
    [DocumentStatus.ACTIVE]: 'Active',
    [DocumentStatus.EXPIRED]: 'Expired',
    [DocumentStatus.ARCHIVED]: 'Archived',
    [DocumentStatus.REJECTED]: 'Rejected'
  };
  return labels[status] || status;
}

export function getCaseTypeLabel(type: CaseType): string {
  const labels = {
    [CaseType.LITIGATION]: 'Litigation',
    [CaseType.ARBITRATION]: 'Arbitration',
    [CaseType.MEDIATION]: 'Mediation',
    [CaseType.REGULATORY]: 'Regulatory',
    [CaseType.COMPLIANCE]: 'Compliance',
    [CaseType.CONTRACT_DISPUTE]: 'Contract Dispute',
    [CaseType.EMPLOYMENT]: 'Employment',
    [CaseType.INTELLECTUAL_PROPERTY]: 'Intellectual Property',
    [CaseType.CORPORATE]: 'Corporate',
    [CaseType.CONSUMER_PROTECTION]: 'Consumer Protection'
  };
  return labels[type] || type;
}

export function getCaseStatusLabel(status: CaseStatus): string {
  const labels = {
    [CaseStatus.OPEN]: 'Open',
    [CaseStatus.IN_PROGRESS]: 'In Progress',
    [CaseStatus.PENDING_REVIEW]: 'Pending Review',
    [CaseStatus.SETTLED]: 'Settled',
    [CaseStatus.CLOSED]: 'Closed',
    [CaseStatus.DISMISSED]: 'Dismissed',
    [CaseStatus.ON_HOLD]: 'On Hold'
  };
  return labels[status] || status;
}

export function getComplianceAreaLabel(area: ComplianceArea): string {
  const labels = {
    [ComplianceArea.FCRA]: 'FCRA',
    [ComplianceArea.FDCPA]: 'FDCPA',
    [ComplianceArea.TCPA]: 'TCPA',
    [ComplianceArea.CFPB]: 'CFPB',
    [ComplianceArea.STATE_REGULATIONS]: 'State Regulations',
    [ComplianceArea.PRIVACY]: 'Privacy',
    [ComplianceArea.DATA_PROTECTION]: 'Data Protection',
    [ComplianceArea.FINANCIAL_SERVICES]: 'Financial Services',
    [ComplianceArea.CONSUMER_PROTECTION]: 'Consumer Protection',
    [ComplianceArea.EMPLOYMENT_LAW]: 'Employment Law'
  };
  return labels[area] || area;
}

export function getStatusColor(status: DocumentStatus | CaseStatus | ComplianceStatus): string {
  const colors = {
    // Document Status Colors
    [DocumentStatus.DRAFT]: 'secondary',
    [DocumentStatus.REVIEW]: 'warning',
    [DocumentStatus.APPROVED]: 'success',
    [DocumentStatus.ACTIVE]: 'primary',
    [DocumentStatus.EXPIRED]: 'danger',
    [DocumentStatus.ARCHIVED]: 'dark',
    [DocumentStatus.REJECTED]: 'danger',
    
    // Case Status Colors
    [CaseStatus.OPEN]: 'primary',
    [CaseStatus.IN_PROGRESS]: 'info',
    [CaseStatus.PENDING_REVIEW]: 'warning',
    [CaseStatus.SETTLED]: 'success',
    [CaseStatus.CLOSED]: 'secondary',
    [CaseStatus.DISMISSED]: 'dark',
    [CaseStatus.ON_HOLD]: 'warning',
    
    // Compliance Status Colors
    [ComplianceStatus.COMPLIANT]: 'success',
    [ComplianceStatus.NON_COMPLIANT]: 'danger',
    [ComplianceStatus.NEEDS_ATTENTION]: 'warning',
    [ComplianceStatus.UNDER_INVESTIGATION]: 'info'
  };
  return colors[status as keyof typeof colors] || 'secondary';
}

export function getPriorityColor(priority: CasePriority): string {
  const colors = {
    [CasePriority.LOW]: 'success',
    [CasePriority.MEDIUM]: 'info',
    [CasePriority.HIGH]: 'warning',
    [CasePriority.URGENT]: 'danger',
    [CasePriority.CRITICAL]: 'danger'
  };
  return colors[priority] || 'secondary';
}

export function getRiskLevelColor(riskLevel: RiskLevel): string {
  const colors = {
    [RiskLevel.LOW]: 'success',
    [RiskLevel.MEDIUM]: 'warning',
    [RiskLevel.HIGH]: 'danger',
    [RiskLevel.CRITICAL]: 'danger'
  };
  return colors[riskLevel] || 'secondary';
}

export function calculateCaseAge(openedDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - openedDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDocumentExpiring(expirationDate?: Date, daysThreshold: number = 30): boolean {
  if (!expirationDate) return false;
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays > 0;
}

export function isTaskOverdue(dueDate: Date): boolean {
  const now = new Date();
  return dueDate < now;
}

export function getDaysUntilDeadline(deadline: Date): number {
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

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function calculateSuccessRate(total: number, successful: number): number {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100);
}

export function calculateComplianceRate(compliant: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((compliant / total) * 100);
}