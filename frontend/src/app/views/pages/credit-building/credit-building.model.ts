// Enums
export enum StrategyType {
  SECURED_CARD = 'secured_card',
  AUTHORIZED_USER = 'authorized_user',
  CREDIT_BUILDER_LOAN = 'credit_builder_loan',
  RENT_REPORTING = 'rent_reporting',
  UTILITY_REPORTING = 'utility_reporting',
  DEBT_CONSOLIDATION = 'debt_consolidation',
  PAYMENT_HISTORY = 'payment_history',
  CREDIT_MIX = 'credit_mix',
  LENGTH_OF_HISTORY = 'length_of_history',
  CREDIT_UTILIZATION = 'credit_utilization'
}

export enum StrategyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

export enum RecommendationType {
  IMMEDIATE = 'immediate',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  MAINTENANCE = 'maintenance'
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RecommendationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed'
}

export enum GoalType {
  CREDIT_SCORE = 'credit_score',
  DEBT_REDUCTION = 'debt_reduction',
  CREDIT_UTILIZATION = 'credit_utilization',
  PAYMENT_HISTORY = 'payment_history',
  ACCOUNT_OPENING = 'account_opening',
  CREDIT_MIX = 'credit_mix'
}

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum ProgressMetric {
  CREDIT_SCORE = 'credit_score',
  PAYMENT_HISTORY = 'payment_history',
  CREDIT_UTILIZATION = 'credit_utilization',
  LENGTH_OF_HISTORY = 'length_of_history',
  CREDIT_MIX = 'credit_mix',
  NEW_CREDIT = 'new_credit',
  TOTAL_DEBT = 'total_debt',
  AVAILABLE_CREDIT = 'available_credit'
}

export enum EducationLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum ToolType {
  CALCULATOR = 'calculator',
  SIMULATOR = 'simulator',
  TRACKER = 'tracker',
  PLANNER = 'planner',
  ANALYZER = 'analyzer'
}

// Interfaces
export interface CreditBuildingStrategy {
  id: string;
  clientId: string;
  type: StrategyType;
  title: string;
  description: string;
  status: StrategyStatus;
  priority: RecommendationPriority;
  estimatedImpact: number; // Expected credit score improvement
  timeframe: number; // Days to complete
  cost: number;
  difficulty: number; // 1-5 scale
  requirements: string[];
  steps: StrategyStep[];
  progress: number; // 0-100
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  assignedTo: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: StrategyMetadata;
}

export interface StrategyStep {
  id: string;
  title: string;
  description: string;
  order: number;
  isCompleted: boolean;
  completedDate?: Date;
  dueDate?: Date;
  estimatedDuration: number; // Days
  resources: string[];
  notes?: string;
}

export interface StrategyMetadata {
  tags: string[];
  category: string;
  targetAudience: string[];
  successRate: number;
  averageImpact: number;
  riskLevel: string;
  prerequisites: string[];
}

export interface CreditRecommendation {
  id: string;
  clientId: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: number;
  timeframe: number;
  effort: number; // 1-5 scale
  cost: number;
  relatedStrategies: string[];
  actionItems: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedDate?: Date;
  dismissedReason?: string;
  metadata: RecommendationMetadata;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedDate?: Date;
  dueDate?: Date;
  assignedTo?: string;
  notes?: string;
}

export interface RecommendationMetadata {
  source: string; // AI, manual, template
  confidence: number; // 0-100
  basedOn: string[];
  alternatives: string[];
  risks: string[];
  benefits: string[];
}

export interface CreditGoal {
  id: string;
  clientId: string;
  type: GoalType;
  status: GoalStatus;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  progress: number; // 0-100
  milestones: Milestone[];
  relatedStrategies: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: GoalMetadata;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  targetDate: Date;
  isCompleted: boolean;
  completedDate?: Date;
  reward?: string;
}

export interface GoalMetadata {
  category: string;
  difficulty: number; // 1-5
  estimatedTimeframe: number; // Days
  successProbability: number; // 0-100
  dependencies: string[];
  metrics: string[];
}

export interface ProgressTracking {
  id: string;
  clientId: string;
  metric: ProgressMetric;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  recordedDate: Date;
  source: string;
  notes?: string;
  metadata: ProgressMetadata;
}

export interface ProgressMetadata {
  bureau?: string;
  reportDate?: Date;
  verificationStatus: string;
  dataQuality: number; // 0-100
  anomalies: string[];
}

export interface CreditEducationTopic {
  id: string;
  title: string;
  description: string;
  content: string;
  level: EducationLevel;
  category: string;
  tags: string[];
  estimatedReadTime: number; // Minutes
  prerequisites: string[];
  relatedTopics: string[];
  resources: EducationResource[];
  quiz?: Quiz;
  createdAt: Date;
  updatedAt: Date;
  metadata: EducationMetadata;
}

export interface EducationResource {
  id: string;
  title: string;
  type: string; // video, article, tool, calculator
  url: string;
  description: string;
  duration?: number; // Minutes
  isExternal: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // Minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: string; // multiple_choice, true_false, fill_blank
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface EducationMetadata {
  author: string;
  reviewedBy: string;
  lastReviewed: Date;
  version: string;
  popularity: number;
  rating: number;
  completionRate: number;
}

export interface CreditBuildingTool {
  id: string;
  name: string;
  type: ToolType;
  description: string;
  category: string;
  features: string[];
  inputs: ToolInput[];
  outputs: ToolOutput[];
  instructions: string;
  examples: ToolExample[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: ToolMetadata;
}

export interface ToolInput {
  id: string;
  name: string;
  type: string; // number, text, date, select
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: ValidationRule[];
}

export interface ToolOutput {
  id: string;
  name: string;
  type: string;
  label: string;
  description: string;
  format?: string;
}

export interface ToolExample {
  id: string;
  title: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
}

export interface ValidationRule {
  type: string; // min, max, pattern, custom
  value: any;
  message: string;
}

export interface ToolMetadata {
  version: string;
  author: string;
  category: string;
  tags: string[];
  usageCount: number;
  rating: number;
  lastUsed?: Date;
}

export interface CreditBuildingReport {
  id: string;
  clientId: string;
  type: string;
  title: string;
  description: string;
  generatedDate: Date;
  periodStart: Date;
  periodEnd: Date;
  data: ReportData;
  charts: ChartConfig[];
  insights: ReportInsight[];
  recommendations: string[];
  createdBy: string;
  metadata: ReportMetadata;
}

export interface ReportData {
  summary: ReportSummary;
  metrics: ReportMetric[];
  trends: TrendData[];
  comparisons: ComparisonData[];
  achievements: Achievement[];
}

export interface ReportSummary {
  totalStrategies: number;
  activeStrategies: number;
  completedStrategies: number;
  averageProgress: number;
  creditScoreChange: number;
  goalsAchieved: number;
  totalGoals: number;
}

export interface ReportMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: string; // up, down, stable
  unit: string;
}

export interface TrendData {
  metric: string;
  data: DataPoint[];
  trend: string;
  correlation?: number;
}

export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface ComparisonData {
  metric: string;
  current: number;
  benchmark: number;
  percentile: number;
  category: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  achievedDate: Date;
  category: string;
  points: number;
  badge?: string;
}

export interface ReportInsight {
  id: string;
  type: string; // positive, negative, neutral, warning
  title: string;
  description: string;
  impact: string; // high, medium, low
  actionable: boolean;
  relatedMetrics: string[];
}

export interface ChartConfig {
  id: string;
  type: string; // line, bar, pie, doughnut
  title: string;
  data: any;
  options: any;
  insights?: string[];
}

export interface ReportMetadata {
  version: string;
  template: string;
  filters: Record<string, any>;
  exportFormats: string[];
  shareSettings: ShareSettings;
}

export interface ShareSettings {
  isPublic: boolean;
  allowedUsers: string[];
  expirationDate?: Date;
  permissions: string[];
}

export interface CreditBuildingAnalytics {
  overview: AnalyticsOverview;
  strategies: StrategyAnalytics;
  recommendations: RecommendationAnalytics;
  goals: GoalAnalytics;
  progress: ProgressAnalytics;
  education: EducationAnalytics;
  tools: ToolAnalytics;
}

export interface AnalyticsOverview {
  totalClients: number;
  activeStrategies: number;
  averageCreditScoreImprovement: number;
  successRate: number;
  totalRecommendations: number;
  completedGoals: number;
  engagementRate: number;
}

export interface StrategyAnalytics {
  byType: TypeStats[];
  byStatus: StatusStats[];
  successRates: SuccessRateData[];
  averageCompletion: number;
  popularStrategies: PopularityData[];
  effectivenessRatings: EffectivenessData[];
}

export interface RecommendationAnalytics {
  byType: TypeStats[];
  byPriority: PriorityStats[];
  acceptanceRate: number;
  completionRate: number;
  averageImpact: number;
  dismissalReasons: ReasonStats[];
}

export interface GoalAnalytics {
  byType: TypeStats[];
  byStatus: StatusStats[];
  achievementRate: number;
  averageTimeToComplete: number;
  popularGoals: PopularityData[];
  progressDistribution: DistributionData[];
}

export interface ProgressAnalytics {
  byMetric: MetricStats[];
  trends: TrendAnalysis[];
  improvements: ImprovementData[];
  correlations: CorrelationData[];
}

export interface EducationAnalytics {
  byLevel: LevelStats[];
  byCategory: CategoryStats[];
  completionRates: CompletionData[];
  popularTopics: PopularityData[];
  quizPerformance: QuizPerformanceData[];
}

export interface ToolAnalytics {
  byType: TypeStats[];
  usageStats: UsageData[];
  popularTools: PopularityData[];
  effectivenessRatings: EffectivenessData[];
}

export interface TypeStats {
  type: string;
  count: number;
  percentage: number;
  trend: string;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
  trend: string;
}

export interface PriorityStats {
  priority: string;
  count: number;
  percentage: number;
  averageImpact: number;
}

export interface SuccessRateData {
  strategy: string;
  successRate: number;
  sampleSize: number;
  averageImpact: number;
}

export interface PopularityData {
  item: string;
  count: number;
  rating: number;
  trend: string;
}

export interface EffectivenessData {
  item: string;
  rating: number;
  sampleSize: number;
  impact: number;
}

export interface ReasonStats {
  reason: string;
  count: number;
  percentage: number;
}

export interface DistributionData {
  range: string;
  count: number;
  percentage: number;
}

export interface MetricStats {
  metric: string;
  averageValue: number;
  change: number;
  trend: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: string;
  strength: number;
  significance: number;
}

export interface ImprovementData {
  metric: string;
  improvement: number;
  timeframe: number;
  clients: number;
}

export interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
}

export interface LevelStats {
  level: string;
  count: number;
  completionRate: number;
  averageRating: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  popularity: number;
  engagement: number;
}

export interface CompletionData {
  item: string;
  completionRate: number;
  averageTime: number;
  dropoffPoints: string[];
}

export interface QuizPerformanceData {
  quiz: string;
  averageScore: number;
  passRate: number;
  attempts: number;
}

export interface UsageData {
  tool: string;
  usageCount: number;
  uniqueUsers: number;
  averageRating: number;
}

// Helper Functions
export function getStrategyTypeLabel(type: StrategyType): string {
  const labels: Record<StrategyType, string> = {
    [StrategyType.SECURED_CARD]: 'Secured Credit Card',
    [StrategyType.AUTHORIZED_USER]: 'Authorized User',
    [StrategyType.CREDIT_BUILDER_LOAN]: 'Credit Builder Loan',
    [StrategyType.RENT_REPORTING]: 'Rent Reporting',
    [StrategyType.UTILITY_REPORTING]: 'Utility Reporting',
    [StrategyType.DEBT_CONSOLIDATION]: 'Debt Consolidation',
    [StrategyType.PAYMENT_HISTORY]: 'Payment History',
    [StrategyType.CREDIT_MIX]: 'Credit Mix',
    [StrategyType.LENGTH_OF_HISTORY]: 'Length of History',
    [StrategyType.CREDIT_UTILIZATION]: 'Credit Utilization'
  };
  return labels[type] || type;
}

export function getStrategyStatusColor(status: StrategyStatus): string {
  const colors: Record<StrategyStatus, string> = {
    [StrategyStatus.DRAFT]: 'secondary',
    [StrategyStatus.ACTIVE]: 'primary',
    [StrategyStatus.COMPLETED]: 'success',
    [StrategyStatus.PAUSED]: 'warning',
    [StrategyStatus.CANCELLED]: 'danger'
  };
  return colors[status] || 'secondary';
}

export function getRecommendationPriorityColor(priority: RecommendationPriority): string {
  const colors: Record<RecommendationPriority, string> = {
    [RecommendationPriority.LOW]: 'info',
    [RecommendationPriority.MEDIUM]: 'warning',
    [RecommendationPriority.HIGH]: 'danger',
    [RecommendationPriority.CRITICAL]: 'dark'
  };
  return colors[priority] || 'secondary';
}

export function getGoalStatusColor(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    [GoalStatus.NOT_STARTED]: 'secondary',
    [GoalStatus.IN_PROGRESS]: 'primary',
    [GoalStatus.COMPLETED]: 'success',
    [GoalStatus.OVERDUE]: 'danger',
    [GoalStatus.CANCELLED]: 'dark'
  };
  return colors[status] || 'secondary';
}

export function calculateStrategyProgress(strategy: CreditBuildingStrategy): number {
  if (!strategy.steps || strategy.steps.length === 0) {
    return 0;
  }
  
  const completedSteps = strategy.steps.filter(step => step.isCompleted).length;
  return Math.round((completedSteps / strategy.steps.length) * 100);
}

export function calculateGoalProgress(goal: CreditGoal): number {
  if (goal.targetValue === goal.currentValue) {
    return 100;
  }
  
  const progress = ((goal.currentValue - goal.startDate.getTime()) / (goal.targetValue - goal.startDate.getTime())) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function isStrategyOverdue(strategy: CreditBuildingStrategy): boolean {
  if (!strategy.targetDate) {
    return false;
  }
  
  return new Date() > strategy.targetDate && strategy.status !== StrategyStatus.COMPLETED;
}

export function isGoalOverdue(goal: CreditGoal): boolean {
  return new Date() > goal.targetDate && goal.status !== GoalStatus.COMPLETED;
}

export function getDaysUntilDeadline(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
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

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

export function calculateSuccessRate(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

export function getImpactColor(impact: number): string {
  if (impact >= 50) {
    return 'success';
  } else if (impact >= 25) {
    return 'warning';
  } else {
    return 'danger';
  }
}

export function getDifficultyLabel(difficulty: number): string {
  const labels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
  return labels[Math.max(0, Math.min(4, difficulty - 1))] || 'Unknown';
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) {
    return 'success';
  } else if (progress >= 50) {
    return 'info';
  } else if (progress >= 25) {
    return 'warning';
  } else {
    return 'danger';
  }
}