// Enums
export enum ViolationType {
  FCRA = 'fcra',
  FDCPA = 'fdcpa',
  TCPA = 'tcpa',
  CFPB = 'cfpb',
  STATE_LAW = 'state_law',
  COMPANY_POLICY = 'company_policy',
  DATA_PRIVACY = 'data_privacy',
  CONSUMER_RIGHTS = 'consumer_rights'
}

export enum ViolationSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ViolationStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated'
}

export enum ActionType {
  WARNING = 'warning',
  FINE = 'fine',
  SUSPENSION = 'suspension',
  INVESTIGATION = 'investigation',
  CORRECTIVE_ACTION = 'corrective_action',
  LEGAL_ACTION = 'legal_action',
  TRAINING = 'training',
  POLICY_UPDATE = 'policy_update'
}

export enum ActionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
  ON_HOLD = 'on_hold'
}

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNDER_REVIEW = 'under_review',
  PENDING = 'pending'
}

export enum RegulationType {
  FEDERAL = 'federal',
  STATE = 'state',
  LOCAL = 'local',
  INDUSTRY = 'industry',
  INTERNAL = 'internal'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum AlertType {
  VIOLATION_DETECTED = 'violation_detected',
  COMPLIANCE_DEADLINE = 'compliance_deadline',
  REGULATION_UPDATE = 'regulation_update',
  ACTION_OVERDUE = 'action_overdue',
  AUDIT_REQUIRED = 'audit_required'
}

// Interfaces
export interface Violation {
  id: string;
  title: string;
  description: string;
  type: ViolationType;
  severity: ViolationSeverity;
  status: ViolationStatus;
  reportedBy: string;
  reportedDate: Date;
  clientId?: string;
  clientName?: string;
  affectedParties: string[];
  regulationId?: string;
  regulationName?: string;
  evidence: ViolationEvidence[];
  actions: EnforcementAction[];
  resolution?: ViolationResolution;
  tags: string[];
  metadata: ViolationMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
}

export interface ViolationEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'recording' | 'testimony' | 'other';
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface ViolationResolution {
  id: string;
  summary: string;
  details: string;
  resolvedBy: string;
  resolvedAt: Date;
  corrective_actions: string[];
  preventive_measures: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  satisfactionRating?: number;
  clientNotified: boolean;
  clientNotifiedAt?: Date;
}

export interface ViolationMetadata {
  source: string;
  category: string;
  subcategory?: string;
  jurisdiction: string;
  potentialFine?: number;
  estimatedImpact: string;
  riskLevel: number;
  publicDisclosure: boolean;
  mediaAttention: boolean;
  regulatoryInquiry: boolean;
}

export interface EnforcementAction {
  id: string;
  violationId?: string;
  title: string;
  description: string;
  type: ActionType;
  status: ActionStatus;
  priority: AlertPriority;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate: Date;
  completedAt?: Date;
  estimatedCost?: number;
  actualCost?: number;
  estimatedHours?: number;
  actualHours?: number;
  requirements: ActionRequirement[];
  progress: ActionProgress[];
  attachments: ActionAttachment[];
  dependencies: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ActionRequirement {
  id: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  evidence?: string;
  notes?: string;
}

export interface ActionProgress {
  id: string;
  date: Date;
  description: string;
  percentage: number;
  updatedBy: string;
  notes?: string;
  attachments?: string[];
}

export interface ActionAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ActionComment {
  id: string;
  actionId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceItem {
  id: string;
  regulationId: string;
  regulationName: string;
  requirement: string;
  description: string;
  status: ComplianceStatus;
  lastAuditDate?: Date;
  nextAuditDate: Date;
  assignedTo: string;
  evidence: ComplianceEvidence[];
  findings: ComplianceFinding[];
  riskLevel: number;
  businessImpact: string;
  remediation?: ComplianceRemediation;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceEvidence {
  id: string;
  type: string;
  title: string;
  description?: string;
  fileUrl?: string;
  providedBy: string;
  providedAt: Date;
  verified: boolean;
  expiryDate?: Date;
}

export interface ComplianceFinding {
  id: string;
  auditDate: Date;
  auditor: string;
  finding: string;
  severity: ViolationSeverity;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ComplianceRemediation {
  id: string;
  plan: string;
  actions: string[];
  timeline: Date;
  assignedTo: string;
  cost?: number;
  status: ActionStatus;
  completedAt?: Date;
}

export interface Regulation {
  id: string;
  name: string;
  shortName: string;
  description: string;
  type: RegulationType;
  jurisdiction: string;
  effectiveDate: Date;
  lastUpdated: Date;
  version: string;
  status: 'active' | 'pending' | 'superseded' | 'repealed';
  requirements: RegulationRequirement[];
  penalties: RegulationPenalty[];
  resources: RegulationResource[];
  relatedRegulations: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegulationRequirement {
  id: string;
  section: string;
  title: string;
  description: string;
  mandatory: boolean;
  applicability: string;
  deadline?: Date;
  frequency?: string;
  evidence_required: string[];
}

export interface RegulationPenalty {
  id: string;
  violation_type: string;
  description: string;
  min_penalty?: number;
  max_penalty?: number;
  calculation_method: string;
  additional_consequences: string[];
}

export interface RegulationResource {
  id: string;
  type: 'guidance' | 'form' | 'template' | 'faq' | 'training';
  title: string;
  description?: string;
  url: string;
  lastUpdated: Date;
}

export interface EnforcementAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'violation' | 'action' | 'compliance' | 'regulation';
  assignedTo?: string;
  dueDate?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  tags: string[];
  createdAt: Date;
  createdBy: string;
}

export interface EnforcementAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  violations: {
    total: number;
    byType: Record<ViolationType, number>;
    bySeverity: Record<ViolationSeverity, number>;
    byStatus: Record<ViolationStatus, number>;
    trends: AnalyticsTrend[];
  };
  actions: {
    total: number;
    byType: Record<ActionType, number>;
    byStatus: Record<ActionStatus, number>;
    completionRate: number;
    averageResolutionTime: number;
    trends: AnalyticsTrend[];
  };
  compliance: {
    overallScore: number;
    byRegulation: Record<string, number>;
    riskDistribution: Record<string, number>;
    auditResults: AuditResult[];
  };
  costs: {
    totalFines: number;
    totalRemediation: number;
    byCategory: Record<string, number>;
    trends: AnalyticsTrend[];
  };
}

export interface AnalyticsTrend {
  date: Date;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface AuditResult {
  date: Date;
  auditor: string;
  scope: string;
  score: number;
  findings: number;
  recommendations: number;
}

// Helper Functions
export function getViolationTypeLabel(type: ViolationType): string {
  const labels = {
    [ViolationType.FCRA]: 'FCRA Violation',
    [ViolationType.FDCPA]: 'FDCPA Violation',
    [ViolationType.TCPA]: 'TCPA Violation',
    [ViolationType.CFPB]: 'CFPB Violation',
    [ViolationType.STATE_LAW]: 'State Law Violation',
    [ViolationType.COMPANY_POLICY]: 'Company Policy Violation',
    [ViolationType.DATA_PRIVACY]: 'Data Privacy Violation',
    [ViolationType.CONSUMER_RIGHTS]: 'Consumer Rights Violation'
  };
  return labels[type] || type;
}

export function getViolationStatusLabel(status: ViolationStatus): string {
  const labels = {
    [ViolationStatus.REPORTED]: 'Reported',
    [ViolationStatus.INVESTIGATING]: 'Investigating',
    [ViolationStatus.CONFIRMED]: 'Confirmed',
    [ViolationStatus.RESOLVED]: 'Resolved',
    [ViolationStatus.DISMISSED]: 'Dismissed',
    [ViolationStatus.ESCALATED]: 'Escalated'
  };
  return labels[status] || status;
}

export function getViolationSeverityLabel(severity: ViolationSeverity): string {
  const labels = {
    [ViolationSeverity.LOW]: 'Low',
    [ViolationSeverity.MEDIUM]: 'Medium',
    [ViolationSeverity.HIGH]: 'High',
    [ViolationSeverity.CRITICAL]: 'Critical'
  };
  return labels[severity] || severity;
}

export function getViolationSeverityColor(severity: ViolationSeverity): string {
  const colors = {
    [ViolationSeverity.LOW]: 'success',
    [ViolationSeverity.MEDIUM]: 'warning',
    [ViolationSeverity.HIGH]: 'danger',
    [ViolationSeverity.CRITICAL]: 'dark'
  };
  return colors[severity] || 'secondary';
}

export function getViolationStatusColor(status: ViolationStatus): string {
  const colors = {
    [ViolationStatus.REPORTED]: 'info',
    [ViolationStatus.INVESTIGATING]: 'warning',
    [ViolationStatus.CONFIRMED]: 'danger',
    [ViolationStatus.RESOLVED]: 'success',
    [ViolationStatus.DISMISSED]: 'secondary',
    [ViolationStatus.ESCALATED]: 'dark'
  };
  return colors[status] || 'secondary';
}

export function getActionStatusLabel(status: ActionStatus): string {
  const labels = {
    [ActionStatus.PLANNED]: 'Planned',
    [ActionStatus.IN_PROGRESS]: 'In Progress',
    [ActionStatus.COMPLETED]: 'Completed',
    [ActionStatus.CANCELLED]: 'Cancelled',
    [ActionStatus.OVERDUE]: 'Overdue',
    [ActionStatus.ON_HOLD]: 'On Hold'
  };
  return labels[status] || status;
}

export function getActionTypeLabel(type: ActionType): string {
  const labels = {
    [ActionType.WARNING]: 'Warning',
    [ActionType.FINE]: 'Fine',
    [ActionType.SUSPENSION]: 'Suspension',
    [ActionType.INVESTIGATION]: 'Investigation',
    [ActionType.CORRECTIVE_ACTION]: 'Corrective Action',
    [ActionType.LEGAL_ACTION]: 'Legal Action',
    [ActionType.TRAINING]: 'Training',
    [ActionType.POLICY_UPDATE]: 'Policy Update'
  };
  return labels[type] || type;
}

export function getActionStatusColor(status: ActionStatus): string {
  const colors = {
    [ActionStatus.PLANNED]: 'info',
    [ActionStatus.IN_PROGRESS]: 'warning',
    [ActionStatus.COMPLETED]: 'success',
    [ActionStatus.CANCELLED]: 'secondary',
    [ActionStatus.OVERDUE]: 'danger',
    [ActionStatus.ON_HOLD]: 'warning'
  };
  return colors[status] || 'secondary';
}

export function getComplianceStatusColor(status: ComplianceStatus): string {
  const colors = {
    [ComplianceStatus.COMPLIANT]: 'success',
    [ComplianceStatus.NON_COMPLIANT]: 'danger',
    [ComplianceStatus.PARTIALLY_COMPLIANT]: 'warning',
    [ComplianceStatus.UNDER_REVIEW]: 'info',
    [ComplianceStatus.PENDING]: 'secondary'
  };
  return colors[status] || 'secondary';
}

export function getAlertPriorityColor(priority: AlertPriority): string {
  const colors = {
    [AlertPriority.LOW]: 'success',
    [AlertPriority.MEDIUM]: 'warning',
    [AlertPriority.HIGH]: 'danger',
    [AlertPriority.URGENT]: 'dark'
  };
  return colors[priority] || 'secondary';
}

export function calculateComplianceScore(items: ComplianceItem[]): number {
  if (items.length === 0) return 0;
  
  const compliantItems = items.filter(item => item.status === ComplianceStatus.COMPLIANT).length;
  return Math.round((compliantItems / items.length) * 100);
}

export function calculateRiskLevel(violations: Violation[]): number {
  if (violations.length === 0) return 0;
  
  const weights = {
    [ViolationSeverity.LOW]: 1,
    [ViolationSeverity.MEDIUM]: 2,
    [ViolationSeverity.HIGH]: 3,
    [ViolationSeverity.CRITICAL]: 4
  };
  
  const totalWeight = violations.reduce((sum, violation) => {
    return sum + weights[violation.severity];
  }, 0);
  
  return Math.min(Math.round((totalWeight / violations.length) * 25), 100);
}

export function getOverdueActions(actions: EnforcementAction[]): EnforcementAction[] {
  const now = new Date();
  return actions.filter(action => 
    action.status !== ActionStatus.COMPLETED && 
    action.status !== ActionStatus.CANCELLED &&
    action.dueDate < now
  );
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