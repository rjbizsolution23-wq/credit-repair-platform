// Enums
export enum ComplianceArea {
  FCRA = 'fcra',
  FDCPA = 'fdcpa',
  TCPA = 'tcpa',
  CFPB = 'cfpb',
  STATE_REGULATIONS = 'state_regulations',
  PRIVACY = 'privacy',
  DATA_SECURITY = 'data_security',
  FINANCIAL = 'financial'
}

export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  REGULATORY = 'regulatory',
  SELF_ASSESSMENT = 'self_assessment'
}

export enum AuditStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

export enum PolicyType {
  PROCEDURE = 'procedure',
  GUIDELINE = 'guideline',
  STANDARD = 'standard',
  REGULATION = 'regulation'
}

export enum PolicyStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

export enum ViolationType {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
  REGULATORY = 'regulatory'
}

export enum ViolationStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TrainingType {
  ONBOARDING = 'onboarding',
  ANNUAL = 'annual',
  SPECIALIZED = 'specialized',
  REFRESHER = 'refresher',
  MANDATORY = 'mandatory'
}

export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  OVERDUE = 'overdue'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ReportType {
  AUDIT_SUMMARY = 'audit_summary',
  VIOLATION_REPORT = 'violation_report',
  TRAINING_REPORT = 'training_report',
  COMPLIANCE_SCORECARD = 'compliance_scorecard',
  REGULATORY_FILING = 'regulatory_filing'
}

// Interfaces
export interface ComplianceAudit {
  id: string;
  title: string;
  description: string;
  type: AuditType;
  status: AuditStatus;
  complianceAreas: ComplianceArea[];
  auditor: string;
  auditTeam: string[];
  startDate: Date;
  endDate: Date;
  plannedDate?: Date;
  actualDate?: Date;
  scope: string;
  objectives: string[];
  findings: AuditFinding[];
  recommendations: AuditRecommendation[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  metadata: AuditMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  evidence: string[];
  impact: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  dueDate?: Date;
  resolvedDate?: Date;
  resolution?: string;
}

export interface AuditRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  implementation: string;
  timeline: string;
  resources: string[];
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  cost?: number;
}

export interface AuditMetadata {
  version: string;
  tags: string[];
  attachments: string[];
  references: string[];
  notes: string;
  customFields: Record<string, any>;
  updatedAt: Date;
  updatedBy: string;
}

export interface CompliancePolicy {
  id: string;
  title: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  complianceAreas: ComplianceArea[];
  version: string;
  content: string;
  summary: string;
  effectiveDate: Date;
  expirationDate?: Date;
  reviewDate: Date;
  approvedBy: string;
  approvedDate?: Date;
  owner: string;
  stakeholders: string[];
  relatedPolicies: string[];
  procedures: PolicyProcedure[];
  controls: PolicyControl[];
  metadata: PolicyMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface PolicyProcedure {
  id: string;
  title: string;
  description: string;
  steps: string[];
  roles: string[];
  frequency: string;
  documentation: string[];
}

export interface PolicyControl {
  id: string;
  title: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  frequency: string;
  owner: string;
  evidence: string[];
  effectiveness: 'effective' | 'partially_effective' | 'ineffective';
}

export interface PolicyMetadata {
  category: string;
  tags: string[];
  attachments: string[];
  references: string[];
  changeLog: PolicyChange[];
  customFields: Record<string, any>;
  updatedAt: Date;
  updatedBy: string;
}

export interface PolicyChange {
  version: string;
  date: Date;
  author: string;
  description: string;
  changes: string[];
}

export interface ComplianceViolation {
  id: string;
  title: string;
  description: string;
  type: ViolationType;
  status: ViolationStatus;
  complianceArea: ComplianceArea;
  policy?: string;
  regulation?: string;
  discoveredDate: Date;
  reportedDate: Date;
  reportedBy: string;
  assignedTo?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  rootCause?: string;
  evidence: string[];
  investigation: ViolationInvestigation;
  remediation: ViolationRemediation;
  riskAssessment: RiskAssessment;
  metadata: ViolationMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ViolationInvestigation {
  startDate?: Date;
  endDate?: Date;
  investigator?: string;
  findings: string[];
  interviews: string[];
  documents: string[];
  timeline: InvestigationEvent[];
  conclusion?: string;
}

export interface InvestigationEvent {
  date: Date;
  event: string;
  details: string;
  evidence?: string[];
}

export interface ViolationRemediation {
  plan?: string;
  actions: RemediationAction[];
  timeline?: string;
  cost?: number;
  responsible?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  completionDate?: Date;
  effectiveness?: 'effective' | 'partially_effective' | 'ineffective';
}

export interface RemediationAction {
  id: string;
  description: string;
  responsible: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: Date;
  notes?: string;
}

export interface RiskAssessment {
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategies: string[];
  residualRisk?: number;
}

export interface ViolationMetadata {
  category: string;
  tags: string[];
  attachments: string[];
  references: string[];
  notifications: string[];
  customFields: Record<string, any>;
  updatedAt: Date;
  updatedBy: string;
}

export interface ComplianceTraining {
  id: string;
  title: string;
  description: string;
  type: TrainingType;
  status: TrainingStatus;
  complianceAreas: ComplianceArea[];
  content: TrainingContent;
  duration: number; // in minutes
  passingScore: number;
  validityPeriod: number; // in days
  mandatory: boolean;
  targetAudience: string[];
  prerequisites: string[];
  instructor?: string;
  schedule: TrainingSchedule;
  assessments: TrainingAssessment[];
  resources: TrainingResource[];
  metadata: TrainingMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface TrainingContent {
  modules: TrainingModule[];
  materials: string[];
  videos: string[];
  documents: string[];
  presentations: string[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  quiz?: TrainingQuiz;
}

export interface TrainingQuiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  attempts: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface TrainingSchedule {
  startDate?: Date;
  endDate?: Date;
  sessions: TrainingSession[];
  deadlines: TrainingDeadline[];
}

export interface TrainingSession {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location?: string;
  virtualLink?: string;
  capacity?: number;
  enrolled: number;
}

export interface TrainingDeadline {
  audience: string;
  dueDate: Date;
  reminderDates: Date[];
}

export interface TrainingAssessment {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'practical' | 'certification';
  passingScore: number;
  attempts: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}

export interface TrainingResource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'presentation';
  url: string;
  description?: string;
}

export interface TrainingMetadata {
  category: string;
  tags: string[];
  attachments: string[];
  references: string[];
  version: string;
  customFields: Record<string, any>;
  updatedAt: Date;
  updatedBy: string;
}

export interface TrainingRecord {
  id: string;
  trainingId: string;
  userId: string;
  status: TrainingStatus;
  enrollmentDate: Date;
  startDate?: Date;
  completionDate?: Date;
  dueDate: Date;
  score?: number;
  attempts: number;
  progress: number;
  timeSpent: number; // in minutes
  certificateId?: string;
  notes?: string;
  assessmentResults: AssessmentResult[];
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  passed: boolean;
  completedDate: Date;
  timeSpent: number;
  answers: QuestionAnswer[];
}

export interface QuestionAnswer {
  questionId: string;
  answer: string | string[];
  correct: boolean;
  points: number;
}

export interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  type: string;
  complianceArea: ComplianceArea;
  source: string;
  triggeredDate: Date;
  acknowledgedDate?: Date;
  resolvedDate?: Date;
  assignedTo?: string;
  escalationLevel: number;
  actions: AlertAction[];
  metadata: AlertMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertAction {
  id: string;
  description: string;
  responsible: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: Date;
  notes?: string;
}

export interface AlertMetadata {
  category: string;
  tags: string[];
  references: string[];
  notifications: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  createdBy: string;
}

export interface ComplianceReport {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  complianceAreas: ComplianceArea[];
  period: ReportPeriod;
  generatedDate: Date;
  generatedBy: string;
  status: 'draft' | 'final' | 'submitted' | 'approved';
  data: ReportData;
  summary: ReportSummary;
  recommendations: string[];
  attachments: string[];
  recipients: string[];
  metadata: ReportMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportPeriod {
  startDate: Date;
  endDate: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export interface ReportData {
  metrics: ReportMetric[];
  charts: ChartData[];
  tables: TableData[];
  trends: TrendData[];
}

export interface ReportMetric {
  name: string;
  value: number | string;
  unit?: string;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  status: 'good' | 'warning' | 'critical';
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title: string;
  data: any;
  options?: any;
}

export interface TableData {
  title: string;
  headers: string[];
  rows: any[][];
  summary?: any;
}

export interface TrendData {
  metric: string;
  periods: string[];
  values: number[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface ReportSummary {
  overallScore: number;
  complianceRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFindings: string[];
  improvements: string[];
  concerns: string[];
}

export interface ReportMetadata {
  version: string;
  template: string;
  tags: string[];
  confidentiality: 'public' | 'internal' | 'confidential' | 'restricted';
  customFields: Record<string, any>;
}

// Analytics Interfaces
export interface ComplianceAnalytics {
  overview: AnalyticsOverview;
  audits: AuditAnalytics;
  policies: PolicyAnalytics;
  violations: ViolationAnalytics;
  training: TrainingAnalytics;
  alerts: AlertAnalytics;
  trends: ComplianceTrends;
}

export interface AnalyticsOverview {
  totalAudits: number;
  completedAudits: number;
  totalPolicies: number;
  activePolicies: number;
  totalViolations: number;
  resolvedViolations: number;
  totalTrainings: number;
  completedTrainings: number;
  activeAlerts: number;
  complianceScore: number;
  riskLevel: string;
  lastUpdated: Date;
}

export interface AuditAnalytics {
  byType: TypeStats[];
  byStatus: StatusStats[];
  byArea: AreaStats[];
  byRisk: RiskStats[];
  completionRate: number;
  averageScore: number;
  trends: MonthlyTrend[];
}

export interface PolicyAnalytics {
  byType: TypeStats[];
  byStatus: StatusStats[];
  byArea: AreaStats[];
  expiringPolicies: number;
  reviewsDue: number;
  adoptionRate: number;
  trends: MonthlyTrend[];
}

export interface ViolationAnalytics {
  byType: TypeStats[];
  byStatus: StatusStats[];
  byArea: AreaStats[];
  bySeverity: SeverityStats[];
  resolutionRate: number;
  averageResolutionTime: number;
  trends: MonthlyTrend[];
}

export interface TrainingAnalytics {
  byType: TypeStats[];
  byStatus: StatusStats[];
  byArea: AreaStats[];
  completionRate: number;
  averageScore: number;
  overdueLearners: number;
  trends: MonthlyTrend[];
}

export interface AlertAnalytics {
  bySeverity: SeverityStats[];
  byStatus: StatusStats[];
  byArea: AreaStats[];
  responseTime: number;
  resolutionRate: number;
  escalationRate: number;
  trends: MonthlyTrend[];
}

export interface ComplianceTrends {
  complianceScore: MonthlyTrend[];
  auditResults: MonthlyTrend[];
  violationCounts: MonthlyTrend[];
  trainingCompletion: MonthlyTrend[];
  alertVolume: MonthlyTrend[];
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

export interface AreaStats {
  area: string;
  count: number;
  percentage: number;
}

export interface RiskStats {
  level: string;
  count: number;
  percentage: number;
}

export interface SeverityStats {
  severity: string;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  value: number;
  change?: number;
}

// Helper Functions
export function getComplianceAreaLabel(area: ComplianceArea): string {
  const labels = {
    [ComplianceArea.FCRA]: 'Fair Credit Reporting Act',
    [ComplianceArea.FDCPA]: 'Fair Debt Collection Practices Act',
    [ComplianceArea.TCPA]: 'Telephone Consumer Protection Act',
    [ComplianceArea.CFPB]: 'Consumer Financial Protection Bureau',
    [ComplianceArea.STATE_REGULATIONS]: 'State Regulations',
    [ComplianceArea.PRIVACY]: 'Privacy Compliance',
    [ComplianceArea.DATA_SECURITY]: 'Data Security',
    [ComplianceArea.FINANCIAL]: 'Financial Compliance'
  };
  return labels[area] || area;
}

export function getAuditStatusColor(status: AuditStatus): string {
  const colors = {
    [AuditStatus.PLANNED]: 'secondary',
    [AuditStatus.IN_PROGRESS]: 'primary',
    [AuditStatus.COMPLETED]: 'success',
    [AuditStatus.CANCELLED]: 'danger',
    [AuditStatus.ON_HOLD]: 'warning'
  };
  return colors[status] || 'secondary';
}

export function getPolicyStatusColor(status: PolicyStatus): string {
  const colors = {
    [PolicyStatus.DRAFT]: 'secondary',
    [PolicyStatus.UNDER_REVIEW]: 'warning',
    [PolicyStatus.APPROVED]: 'info',
    [PolicyStatus.ACTIVE]: 'success',
    [PolicyStatus.ARCHIVED]: 'dark',
    [PolicyStatus.EXPIRED]: 'danger'
  };
  return colors[status] || 'secondary';
}

export function getViolationSeverityColor(severity: string): string {
  const colors: { [key: string]: string } = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger',
    'critical': 'dark'
  };
  return colors[severity] || 'secondary';
}

export function getTrainingStatusColor(status: TrainingStatus): string {
  const colors = {
    [TrainingStatus.NOT_STARTED]: 'secondary',
    [TrainingStatus.IN_PROGRESS]: 'primary',
    [TrainingStatus.COMPLETED]: 'success',
    [TrainingStatus.EXPIRED]: 'warning',
    [TrainingStatus.OVERDUE]: 'danger'
  };
  return colors[status] || 'secondary';
}

export function getAlertSeverityColor(severity: AlertSeverity): string {
  const colors = {
    [AlertSeverity.LOW]: 'success',
    [AlertSeverity.MEDIUM]: 'warning',
    [AlertSeverity.HIGH]: 'danger',
    [AlertSeverity.CRITICAL]: 'dark'
  };
  return colors[severity] || 'secondary';
}

export function calculateComplianceScore(audits: ComplianceAudit[]): number {
  if (audits.length === 0) return 0;
  const totalScore = audits.reduce((sum, audit) => sum + (audit.score || 0), 0);
  return Math.round(totalScore / audits.length);
}

export function calculateRiskLevel(violations: ComplianceViolation[]): string {
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const highCount = violations.filter(v => v.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 2) return 'high';
  if (highCount > 0 || violations.length > 5) return 'medium';
  return 'low';
}

export function isOverdue(dueDate: Date): boolean {
  return new Date() > new Date(dueDate);
}

export function getDaysUntilDue(dueDate: Date): number {
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

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'info';
  if (progress >= 40) return 'warning';
  return 'danger';
}