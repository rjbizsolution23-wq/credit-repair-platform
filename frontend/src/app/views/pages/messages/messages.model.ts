// Enums
export enum MessageType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  SYSTEM = 'system'
}

export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationType {
  ACCOUNT_UPDATE = 'account_update',
  DISPUTE_STATUS = 'dispute_status',
  PAYMENT_REMINDER = 'payment_reminder',
  CREDIT_ALERT = 'credit_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  MARKETING = 'marketing',
  SECURITY = 'security'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum CampaignType {
  PROMOTIONAL = 'promotional',
  EDUCATIONAL = 'educational',
  TRANSACTIONAL = 'transactional',
  REMINDER = 'reminder',
  SURVEY = 'survey'
}

export enum TemplateCategory {
  WELCOME = 'welcome',
  DISPUTE = 'dispute',
  PAYMENT = 'payment',
  CREDIT_REPORT = 'credit_report',
  GENERAL = 'general',
  MARKETING = 'marketing'
}

export enum DeliveryMethod {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  TRIGGERED = 'triggered',
  BULK = 'bulk'
}

// Core Interfaces
export interface MessageRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'to' | 'cc' | 'bcc';
}

export interface Message {
  id: string;
  type: MessageType;
  status: MessageStatus;
  priority: MessagePriority;
  subject: string;
  content: string;
  htmlContent?: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipients?: MessageRecipient[];
  threadId?: string;
  parentMessageId?: string;
  deliveryStatus?: string;
  preview?: string;
  templateId?: string;
  campaignId?: string;
  attachments: MessageAttachment[];
  metadata: MessageMetadata;
  flagged?: boolean;
  isStarred?: boolean;
  isFlagged?: boolean;
  isRead?: boolean;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  timestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface MessageMetadata {
  tags: string[];
  category?: string;
  clientId?: string;
  disputeId?: string;
  caseId?: string;
  trackingId?: string;
  deliveryAttempts: number;
  lastDeliveryAttempt?: Date;
  errorMessage?: string;
  readReceipt: boolean;
  deliveryReceipt: boolean;
  autoReply: boolean;
  encrypted: boolean;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: ThreadParticipant[];
  messages: Message[];
  messageCount: number;
  unreadCount: number;
  lastMessage: Message;
  lastActivity: Date;
  isArchived: boolean;
  isMuted: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadParticipant {
  id: string;
  name: string;
  email?: string;
  role: string;
  status?: string;
  avatar?: string;
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  type: MessageType;
  subject: string;
  content: string;
  htmlContent?: string;
  variables: TemplateVariable[];
  tags: string[];
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: any;
  userId: string;
  isRead: boolean;
  isArchived: boolean;
  isStarred?: boolean;
  category?: string;
  sender?: string;
  priority: MessagePriority;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  enableEmailNotifications: boolean;
  smsNotifications: boolean;
  enableSmsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  preferences: NotificationPreference[];
  quietHours: QuietHours;
  frequency: 'immediate' | 'daily' | 'weekly';
  updatedAt: Date;
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  channels: MessageType[];
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export interface MessageCampaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  templateId: string;
  targetAudience: AudienceFilter;
  deliveryMethod: DeliveryMethod;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  statistics: CampaignStatistics;
  settings: CampaignSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AudienceFilter {
  criteria: FilterCriteria[];
  excludeCriteria?: FilterCriteria[];
  estimatedCount?: number;
}

export interface FilterCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface CampaignStatistics {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickCount: number;
  unsubscribeCount: number;
  bounceCount: number;
  failureCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
}

export interface CampaignSettings {
  sendRate?: number; // messages per minute
  retryAttempts: number;
  retryDelay: number; // minutes
  trackOpens: boolean;
  trackClicks: boolean;
  allowUnsubscribe: boolean;
  respectQuietHours: boolean;
}

export interface BulkMessage {
  id: string;
  name: string;
  templateId: string;
  recipients: BulkRecipient[];
  status: CampaignStatus;
  progress: BulkProgress;
  settings: BulkSettings;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkRecipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  variables?: Record<string, any>;
  status: MessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export interface BulkProgress {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  percentage: number;
}

export interface BulkSettings {
  batchSize: number;
  delayBetweenBatches: number; // seconds
  maxRetries: number;
  stopOnFailureRate?: number; // percentage
}

// Analytics Interfaces
export interface MessageAnalytics {
  overview: AnalyticsOverview;
  messageStats: MessageStats;
  campaignStats: CampaignStats;
  templateStats: TemplateStats;
  notificationStats: NotificationStats;
  trends: MessageTrends;
  performance: PerformanceMetrics;
}

export interface AnalyticsOverview {
  totalMessages: number;
  sentToday: number;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
  activeCampaigns: number;
  totalTemplates: number;
  unreadNotifications: number;
}

export interface MessageStats {
  byType: TypeStats[];
  byStatus: StatusStats[];
  byPriority: PriorityStats[];
  byChannel: ChannelStats[];
  hourlyDistribution: HourlyStats[];
  dailyVolume: DailyStats[];
}

export interface CampaignStats {
  byType: TypeStats[];
  byStatus: StatusStats[];
  performance: CampaignPerformance[];
  topPerforming: TopCampaign[];
}

export interface TemplateStats {
  byCategory: CategoryStats[];
  usage: TemplateUsage[];
  performance: TemplatePerformance[];
  mostUsed: PopularTemplate[];
}

export interface NotificationStats {
  byType: TypeStats[];
  byStatus: StatusStats[];
  readRate: number;
  averageReadTime: number;
}

export interface MessageTrends {
  volumeTrend: TrendData[];
  deliveryTrend: TrendData[];
  engagementTrend: TrendData[];
  responseTrend: TrendData[];
}

export interface PerformanceMetrics {
  averageDeliveryTime: number;
  averageResponseTime: number;
  peakHours: string[];
  bestPerformingChannels: string[];
  deliverySuccess: SuccessRate;
  engagementRates: EngagementRate[];
}

// Supporting Types
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

export interface ChannelStats {
  channel: string;
  sent: number;
  delivered: number;
  read: number;
  deliveryRate: number;
  readRate: number;
}

export interface HourlyStats {
  hour: number;
  count: number;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface TopCampaign {
  id: string;
  name: string;
  type: CampaignType;
  performance: number;
  recipients: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  usage: number;
}

export interface TemplateUsage {
  templateId: string;
  name: string;
  usageCount: number;
  lastUsed: Date;
}

export interface TemplatePerformance {
  templateId: string;
  name: string;
  deliveryRate: number;
  openRate: number;
  responseRate: number;
}

export interface PopularTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  usageCount: number;
  performance: number;
}

export interface TrendData {
  date: string;
  value: number;
  change?: number;
}

export interface SuccessRate {
  rate: number;
  total: number;
  successful: number;
  failed: number;
}

export interface EngagementRate {
  channel: string;
  rate: number;
  interactions: number;
}

// Filter and Search Interfaces
export interface MessageFilter {
  type?: MessageType[];
  status?: MessageStatus[];
  priority?: MessagePriority[];
  dateRange?: DateRange;
  senderId?: string;
  recipientId?: string;
  threadId?: string;
  campaignId?: string;
  tags?: string[];
  hasAttachments?: boolean;
  isRead?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface MessageSearchParams {
  query?: string;
  filter?: MessageFilter;
  sortBy?: 'createdAt' | 'sentAt' | 'readAt' | 'priority' | 'subject';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Settings Interface
export interface MessageSettings {
  enableNotifications: boolean;
  emailNotifications: boolean;
  enableEmailNotifications: boolean;
  smsNotifications: boolean;
  enableSmsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  autoReply: boolean;
  enableAutoReply: boolean;
  autoReplyMessage: string;
  readReceipts: boolean;
  deliveryReceipts: boolean;
  encryptMessages: boolean;
  enableOnlineStatus: boolean;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  retentionDays: number;
  retentionPeriod: number;
  maxAttachmentSize: number;
  allowedFileTypes: string[];
  signatureEnabled: boolean;
  signature: string;
  defaultPriority: MessagePriority;
  defaultFont: string;
  defaultFontSize: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

// Helper Functions
export function getMessageTypeLabel(type: MessageType): string {
  const labels = {
    [MessageType.EMAIL]: 'Email',
    [MessageType.SMS]: 'SMS',
    [MessageType.PUSH]: 'Push Notification',
    [MessageType.IN_APP]: 'In-App Message',
    [MessageType.SYSTEM]: 'System Message'
  };
  return labels[type] || type;
}

export function getMessageStatusLabel(status: MessageStatus): string {
  const labels = {
    [MessageStatus.DRAFT]: 'Draft',
    [MessageStatus.SENT]: 'Sent',
    [MessageStatus.DELIVERED]: 'Delivered',
    [MessageStatus.READ]: 'Read',
    [MessageStatus.FAILED]: 'Failed',
    [MessageStatus.SCHEDULED]: 'Scheduled'
  };
  return labels[status] || status;
}

export function getMessagePriorityLabel(priority: MessagePriority): string {
  const labels = {
    [MessagePriority.LOW]: 'Low',
    [MessagePriority.NORMAL]: 'Normal',
    [MessagePriority.HIGH]: 'High',
    [MessagePriority.URGENT]: 'Urgent'
  };
  return labels[priority] || priority;
}

export function getNotificationTypeLabel(type: NotificationType): string {
  const labels = {
    [NotificationType.ACCOUNT_UPDATE]: 'Account Update',
    [NotificationType.DISPUTE_STATUS]: 'Dispute Status',
    [NotificationType.PAYMENT_REMINDER]: 'Payment Reminder',
    [NotificationType.CREDIT_ALERT]: 'Credit Alert',
    [NotificationType.SYSTEM_MAINTENANCE]: 'System Maintenance',
    [NotificationType.MARKETING]: 'Marketing',
    [NotificationType.SECURITY]: 'Security'
  };
  return labels[type] || type;
}

export function getCampaignStatusLabel(status: CampaignStatus): string {
  const labels = {
    [CampaignStatus.DRAFT]: 'Draft',
    [CampaignStatus.SCHEDULED]: 'Scheduled',
    [CampaignStatus.ACTIVE]: 'Active',
    [CampaignStatus.PAUSED]: 'Paused',
    [CampaignStatus.COMPLETED]: 'Completed',
    [CampaignStatus.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
}

export function getMessageStatusColor(status: MessageStatus): string {
  const colors = {
    [MessageStatus.DRAFT]: 'gray',
    [MessageStatus.SENT]: 'blue',
    [MessageStatus.DELIVERED]: 'green',
    [MessageStatus.READ]: 'purple',
    [MessageStatus.FAILED]: 'red',
    [MessageStatus.SCHEDULED]: 'orange'
  };
  return colors[status] || 'gray';
}

export function getMessagePriorityColor(priority: MessagePriority): string {
  const colors = {
    [MessagePriority.LOW]: 'gray',
    [MessagePriority.NORMAL]: 'blue',
    [MessagePriority.HIGH]: 'orange',
    [MessagePriority.URGENT]: 'red'
  };
  return colors[priority] || 'gray';
}

export function getCampaignStatusColor(status: CampaignStatus): string {
  const colors = {
    [CampaignStatus.DRAFT]: 'gray',
    [CampaignStatus.SCHEDULED]: 'blue',
    [CampaignStatus.ACTIVE]: 'green',
    [CampaignStatus.PAUSED]: 'orange',
    [CampaignStatus.COMPLETED]: 'purple',
    [CampaignStatus.CANCELLED]: 'red'
  };
  return colors[status] || 'gray';
}

export function formatMessageSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculateDeliveryRate(sent: number, delivered: number): number {
  return sent > 0 ? Math.round((delivered / sent) * 100) : 0;
}

export function calculateOpenRate(delivered: number, opened: number): number {
  return delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
}

export function calculateClickRate(opened: number, clicked: number): number {
  return opened > 0 ? Math.round((clicked / opened) * 100) : 0;
}

export function isMessageOverdue(message: Message): boolean {
  if (!message.scheduledAt) return false;
  return new Date() > message.scheduledAt && message.status === MessageStatus.SCHEDULED;
}

export function getTimeUntilScheduled(scheduledAt: Date): string {
  const now = new Date();
  const diff = scheduledAt.getTime() - now.getTime();
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}