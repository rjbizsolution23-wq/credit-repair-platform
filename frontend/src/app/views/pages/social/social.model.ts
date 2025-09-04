// Social Module Data Models

// Enums
export enum SocialPlatform {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  PINTEREST = 'pinterest',
  SNAPCHAT = 'snapchat'
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
  POLL = 'poll',
  STORY = 'story',
  REEL = 'reel'
}

export enum AccountStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  PENDING = 'pending',
  EXPIRED = 'expired'
}

export enum CommunityRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  OWNER = 'owner'
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum EngagementType {
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  CLICK = 'click',
  VIEW = 'view',
  FOLLOW = 'follow',
  UNFOLLOW = 'unfollow'
}

export enum ContentCategory {
  EDUCATION = 'education',
  TIPS = 'tips',
  NEWS = 'news',
  PROMOTION = 'promotion',
  COMMUNITY = 'community',
  TESTIMONIAL = 'testimonial',
  BEHIND_SCENES = 'behind_scenes',
  ANNOUNCEMENT = 'announcement'
}

// Social Post Interfaces
export interface SocialPost {
  id: string;
  title: string;
  content: string;
  type: PostType;
  status: PostStatus;
  category: ContentCategory;
  platforms: SocialPlatform[];
  scheduledAt?: Date;
  publishedAt?: Date;
  media: MediaAttachment[];
  hashtags: string[];
  mentions: string[];
  location?: Location;
  engagement: PostEngagement;
  analytics: PostAnalytics;
  settings: PostSettings;
  metadata: PostMetadata;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for videos
  altText?: string;
  caption?: string;
}

export interface Location {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  placeId?: string;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  views: number;
  saves: number;
  reactions: {
    [key: string]: number;
  };
}

export interface PostAnalytics {
  reach: number;
  impressions: number;
  engagementRate: number;
  clickThroughRate: number;
  topCountries: CountryStats[];
  topCities: CityStats[];
  ageGroups: AgeGroupStats[];
  genderStats: GenderStats;
  deviceStats: DeviceStats[];
  timeStats: TimeStats[];
}

export interface PostSettings {
  allowComments: boolean;
  allowSharing: boolean;
  allowDownload: boolean;
  audienceRestriction?: 'public' | 'followers' | 'custom';
  customAudience?: string[];
  autoDelete?: {
    enabled: boolean;
    deleteAfter: number; // days
  };
}

export interface PostMetadata {
  source?: string;
  campaign?: string;
  tags: string[];
  notes?: string;
  version: number;
  lastModifiedBy: string;
}

// Social Account Interfaces
export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  status: AccountStatus;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  permissions: AccountPermission[];
  settings: AccountSettings;
  analytics: AccountAnalytics;
  lastSyncAt?: Date;
  connectedAt: Date;
  expiresAt?: Date;
  metadata: AccountMetadata;
}

export interface AccountPermission {
  action: string;
  granted: boolean;
  scope?: string;
}

export interface AccountSettings {
  autoPost: boolean;
  defaultHashtags: string[];
  defaultMentions: string[];
  postingSchedule: PostingSchedule;
  contentFilters: ContentFilter[];
  notifications: AccountNotificationSettings;
}

export interface PostingSchedule {
  timezone: string;
  optimalTimes: {
    [key: string]: string[]; // day of week -> times
  };
  blackoutPeriods: BlackoutPeriod[];
}

export interface BlackoutPeriod {
  start: Date;
  end: Date;
  reason?: string;
}

export interface ContentFilter {
  type: 'keyword' | 'hashtag' | 'mention';
  value: string;
  action: 'block' | 'flag' | 'approve';
}

export interface AccountNotificationSettings {
  newFollowers: boolean;
  mentions: boolean;
  comments: boolean;
  messages: boolean;
  analytics: boolean;
}

export interface AccountAnalytics {
  followerGrowth: GrowthStats[];
  engagementRate: number;
  averageLikes: number;
  averageComments: number;
  bestPostingTimes: TimeSlot[];
  topHashtags: HashtagStats[];
  audienceDemographics: AudienceDemographics;
  competitorComparison: CompetitorStats[];
}

export interface AccountMetadata {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  lastError?: string;
  syncErrors: SyncError[];
  apiLimits: ApiLimits;
}

// Community Interfaces
export interface CommunityForum {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  memberCount: number;
  postCount: number;
  moderators: ForumModerator[];
  rules: ForumRule[];
  topics: ForumTopic[];
  settings: ForumSettings;
  analytics: ForumAnalytics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ForumModerator {
  userId: string;
  username: string;
  role: CommunityRole;
  permissions: string[];
  assignedAt: Date;
}

export interface ForumRule {
  id: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  viewCount: number;
  lastReplyAt?: Date;
  lastReplyBy?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumSettings {
  allowGuestViewing: boolean;
  requireApproval: boolean;
  allowAttachments: boolean;
  maxAttachmentSize: number;
  allowedFileTypes: string[];
  autoLockAfterDays?: number;
  notificationSettings: ForumNotificationSettings;
}

export interface ForumNotificationSettings {
  newPosts: boolean;
  newReplies: boolean;
  mentions: boolean;
  moderatorActions: boolean;
}

export interface ForumAnalytics {
  activeUsers: number;
  newTopicsToday: number;
  repliesPerTopic: number;
  averageResponseTime: number;
  topContributors: ContributorStats[];
  popularTopics: TopicStats[];
  engagementTrends: EngagementTrend[];
}

// Community Group Interfaces
export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'secret';
  category: string;
  memberCount: number;
  maxMembers?: number;
  coverImage?: string;
  admins: GroupAdmin[];
  members: GroupMember[];
  events: GroupEvent[];
  posts: GroupPost[];
  rules: GroupRule[];
  settings: GroupSettings;
  analytics: GroupAnalytics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface GroupAdmin {
  userId: string;
  username: string;
  role: CommunityRole;
  permissions: string[];
  joinedAt: Date;
}

export interface GroupMember {
  userId: string;
  username: string;
  role: CommunityRole;
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt?: Date;
  contributionScore: number;
}

export interface GroupEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: Location;
  isVirtual: boolean;
  meetingLink?: string;
  maxAttendees?: number;
  attendees: EventAttendee[];
  status: EventStatus;
  createdBy: string;
  createdAt: Date;
}

export interface EventAttendee {
  userId: string;
  username: string;
  status: 'going' | 'maybe' | 'not_going';
  registeredAt: Date;
}

export interface GroupPost {
  id: string;
  content: string;
  author: string;
  media: MediaAttachment[];
  likes: number;
  comments: GroupComment[];
  isAnnouncement: boolean;
  isPinned: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupComment {
  id: string;
  content: string;
  author: string;
  parentId?: string;
  likes: number;
  replies: GroupComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupRule {
  id: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  consequences: string[];
}

export interface GroupSettings {
  requireApproval: boolean;
  allowMemberPosts: boolean;
  allowMemberEvents: boolean;
  allowFileSharing: boolean;
  moderateComments: boolean;
  notificationSettings: GroupNotificationSettings;
}

export interface GroupNotificationSettings {
  newMembers: boolean;
  newPosts: boolean;
  newEvents: boolean;
  adminActions: boolean;
}

export interface GroupAnalytics {
  memberGrowth: GrowthStats[];
  postEngagement: EngagementStats;
  eventAttendance: AttendanceStats[];
  topContributors: ContributorStats[];
  activityTrends: ActivityTrend[];
}

// Sharing and Campaign Interfaces
export interface SharingTemplate {
  id: string;
  name: string;
  description: string;
  category: ContentCategory;
  platforms: SocialPlatform[];
  content: TemplateContent;
  variables: TemplateVariable[];
  settings: TemplateSettings;
  usage: TemplateUsage;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateContent {
  title?: string;
  text: string;
  hashtags: string[];
  mentions: string[];
  media: MediaAttachment[];
  callToAction?: CallToAction;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'url' | 'image';
  defaultValue?: any;
  placeholder?: string;
  isRequired: boolean;
  description?: string;
}

export interface TemplateSettings {
  allowCustomization: boolean;
  requireApproval: boolean;
  autoSchedule: boolean;
  optimalTiming: boolean;
}

export interface TemplateUsage {
  timesUsed: number;
  lastUsedAt?: Date;
  successRate: number;
  averageEngagement: number;
}

export interface CallToAction {
  text: string;
  url: string;
  type: 'button' | 'link' | 'swipe_up';
}

export interface SharingCampaign {
  id: string;
  name: string;
  description: string;
  type: 'awareness' | 'engagement' | 'conversion' | 'retention';
  status: CampaignStatus;
  startDate: Date;
  endDate?: Date;
  budget?: CampaignBudget;
  targeting: CampaignTargeting;
  content: CampaignContent[];
  schedule: CampaignSchedule;
  analytics: CampaignAnalytics;
  settings: CampaignSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CampaignBudget {
  total: number;
  spent: number;
  currency: string;
  dailyLimit?: number;
  platformAllocation: {
    [platform: string]: number;
  };
}

export interface CampaignTargeting {
  demographics: {
    ageRange?: [number, number];
    genders?: string[];
    locations?: string[];
    languages?: string[];
  };
  interests: string[];
  behaviors: string[];
  customAudiences: string[];
  lookalikeSources: string[];
}

export interface CampaignContent {
  id: string;
  templateId?: string;
  platform: SocialPlatform;
  content: TemplateContent;
  scheduledAt?: Date;
  publishedAt?: Date;
  status: PostStatus;
  performance: ContentPerformance;
}

export interface CampaignSchedule {
  timezone: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  interval?: number;
  specificTimes: Date[];
  endCondition: {
    type: 'date' | 'posts' | 'budget';
    value: any;
  };
}

export interface CampaignAnalytics {
  reach: number;
  impressions: number;
  engagement: number;
  clicks: number;
  conversions: number;
  cost: number;
  roi: number;
  platformBreakdown: PlatformStats[];
  contentPerformance: ContentPerformance[];
  audienceInsights: AudienceInsights;
}

export interface CampaignSettings {
  autoOptimize: boolean;
  pauseOnBudgetLimit: boolean;
  notifyOnMilestones: boolean;
  allowComments: boolean;
  moderateComments: boolean;
}

// Analytics Interfaces
export interface SocialAnalytics {
  overview: AnalyticsOverview;
  engagement: EngagementAnalytics;
  reach: ReachAnalytics;
  audience: AudienceAnalytics;
  content: ContentAnalytics;
  competitor: CompetitorAnalytics;
  trends: TrendAnalytics;
  reports: AnalyticsReport[];
}

export interface AnalyticsOverview {
  totalFollowers: number;
  followerGrowth: number;
  totalPosts: number;
  averageEngagement: number;
  topPerformingPost: string;
  reachGrowth: number;
  engagementRate: number;
  bestPerformingPlatform: SocialPlatform;
}

export interface EngagementAnalytics {
  totalEngagements: number;
  engagementRate: number;
  engagementGrowth: number;
  engagementByType: EngagementTypeStats[];
  engagementByPlatform: PlatformEngagementStats[];
  engagementTrends: EngagementTrend[];
  topEngagingContent: ContentEngagementStats[];
}

export interface ReachAnalytics {
  totalReach: number;
  reachGrowth: number;
  impressions: number;
  impressionGrowth: number;
  reachByPlatform: PlatformReachStats[];
  reachTrends: ReachTrend[];
  organicVsPaid: {
    organic: number;
    paid: number;
  };
}

export interface AudienceAnalytics {
  totalAudience: number;
  audienceGrowth: number;
  demographics: AudienceDemographics;
  interests: InterestStats[];
  behaviors: BehaviorStats[];
  deviceUsage: DeviceStats[];
  locationStats: LocationStats[];
  activityTimes: ActivityTimeStats[];
}

export interface ContentAnalytics {
  totalContent: number;
  contentByType: ContentTypeStats[];
  contentByCategory: ContentCategoryStats[];
  topPerformingContent: ContentPerformanceStats[];
  contentTrends: ContentTrend[];
  hashtagPerformance: HashtagStats[];
}

export interface CompetitorAnalytics {
  competitors: CompetitorProfile[];
  marketShare: MarketShareStats[];
  benchmarks: BenchmarkStats;
  opportunities: OpportunityInsight[];
}

export interface TrendAnalytics {
  trendingTopics: TrendingTopic[];
  hashtagTrends: HashtagTrend[];
  seasonalTrends: SeasonalTrend[];
  predictiveInsights: PredictiveInsight[];
}

// Supporting Analytics Types
export interface GrowthStats {
  date: Date;
  value: number;
  change: number;
  changePercent: number;
}

export interface EngagementStats {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  total: number;
  rate: number;
}

export interface TimeSlot {
  day: string;
  hour: number;
  engagement: number;
  reach: number;
}

export interface HashtagStats {
  hashtag: string;
  usage: number;
  engagement: number;
  reach: number;
  trending: boolean;
}

export interface AudienceDemographics {
  ageGroups: AgeGroupStats[];
  genders: GenderStats;
  locations: LocationStats[];
  languages: LanguageStats[];
}

export interface AgeGroupStats {
  range: string;
  percentage: number;
  count: number;
}

export interface GenderStats {
  male: number;
  female: number;
  other: number;
  unknown: number;
}

export interface LocationStats {
  country: string;
  city?: string;
  percentage: number;
  count: number;
}

export interface LanguageStats {
  language: string;
  percentage: number;
  count: number;
}

export interface DeviceStats {
  device: string;
  percentage: number;
  count: number;
}

export interface TimeStats {
  hour: number;
  engagement: number;
  reach: number;
}

export interface CountryStats {
  country: string;
  percentage: number;
  count: number;
}

export interface CityStats {
  city: string;
  country: string;
  percentage: number;
  count: number;
}

export interface ContributorStats {
  userId: string;
  username: string;
  contributions: number;
  score: number;
}

export interface TopicStats {
  topicId: string;
  title: string;
  views: number;
  replies: number;
  engagement: number;
}

export interface EngagementTrend {
  date: Date;
  engagement: number;
  reach: number;
  impressions: number;
}

export interface AttendanceStats {
  eventId: string;
  eventTitle: string;
  attendees: number;
  capacity: number;
  attendanceRate: number;
}

export interface ActivityTrend {
  date: Date;
  posts: number;
  comments: number;
  likes: number;
  members: number;
}

export interface ContentPerformance {
  contentId: string;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  cost?: number;
}

export interface PlatformStats {
  platform: SocialPlatform;
  reach: number;
  engagement: number;
  cost?: number;
  roi?: number;
}

export interface AudienceInsights {
  demographics: AudienceDemographics;
  interests: InterestStats[];
  behaviors: BehaviorStats[];
  overlap: AudienceOverlap[];
}

export interface InterestStats {
  interest: string;
  affinity: number;
  size: number;
}

export interface BehaviorStats {
  behavior: string;
  percentage: number;
  index: number;
}

export interface AudienceOverlap {
  platform: SocialPlatform;
  overlap: number;
  unique: number;
}

export interface EngagementTypeStats {
  type: EngagementType;
  count: number;
  percentage: number;
}

export interface PlatformEngagementStats {
  platform: SocialPlatform;
  engagement: number;
  rate: number;
  growth: number;
}

export interface PlatformReachStats {
  platform: SocialPlatform;
  reach: number;
  impressions: number;
  growth: number;
}

export interface ReachTrend {
  date: Date;
  reach: number;
  impressions: number;
  organic: number;
  paid: number;
}

export interface ContentEngagementStats {
  contentId: string;
  title: string;
  engagement: number;
  rate: number;
  platform: SocialPlatform;
}

export interface ActivityTimeStats {
  hour: number;
  day: string;
  activity: number;
  percentage: number;
}

export interface ContentTypeStats {
  type: PostType;
  count: number;
  engagement: number;
  reach: number;
}

export interface ContentCategoryStats {
  category: ContentCategory;
  count: number;
  engagement: number;
  reach: number;
}

export interface ContentPerformanceStats {
  contentId: string;
  title: string;
  type: PostType;
  engagement: number;
  reach: number;
  platform: SocialPlatform;
}

export interface ContentTrend {
  date: Date;
  posts: number;
  engagement: number;
  reach: number;
  topType: PostType;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  platform: SocialPlatform;
  followers: number;
  engagement: number;
  postFrequency: number;
}

export interface MarketShareStats {
  competitor: string;
  share: number;
  growth: number;
}

export interface BenchmarkStats {
  followers: {
    average: number;
    percentile: number;
  };
  engagement: {
    average: number;
    percentile: number;
  };
  postFrequency: {
    average: number;
    percentile: number;
  };
}

export interface OpportunityInsight {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface TrendingTopic {
  topic: string;
  volume: number;
  growth: number;
  sentiment: number;
  relevance: number;
}

export interface HashtagTrend {
  hashtag: string;
  volume: number;
  growth: number;
  platforms: SocialPlatform[];
}

export interface SeasonalTrend {
  period: string;
  metric: string;
  value: number;
  change: number;
}

export interface PredictiveInsight {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'overview' | 'engagement' | 'reach' | 'audience' | 'content' | 'competitor';
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  insights: string[];
  recommendations: string[];
  createdAt: Date;
  createdBy: string;
}

// Filter and Search Interfaces
export interface SocialFilter {
  platforms?: SocialPlatform[];
  status?: PostStatus[];
  type?: PostType[];
  category?: ContentCategory[];
  dateRange?: DateRange;
  engagement?: {
    min?: number;
    max?: number;
  };
  hashtags?: string[];
  mentions?: string[];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SocialSearchParams {
  query?: string;
  filters?: SocialFilter;
  sortBy?: string;
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

// Error and Sync Interfaces
export interface SyncError {
  timestamp: Date;
  error: string;
  code?: string;
  platform?: SocialPlatform;
  action?: string;
}

export interface ApiLimits {
  requests: {
    limit: number;
    remaining: number;
    resetAt: Date;
  };
  posts: {
    limit: number;
    remaining: number;
    resetAt: Date;
  };
}

// Helper Functions
export function getSocialPlatformLabel(platform: SocialPlatform): string {
  const labels = {
    [SocialPlatform.FACEBOOK]: 'Facebook',
    [SocialPlatform.TWITTER]: 'Twitter',
    [SocialPlatform.INSTAGRAM]: 'Instagram',
    [SocialPlatform.LINKEDIN]: 'LinkedIn',
    [SocialPlatform.YOUTUBE]: 'YouTube',
    [SocialPlatform.TIKTOK]: 'TikTok',
    [SocialPlatform.PINTEREST]: 'Pinterest',
    [SocialPlatform.SNAPCHAT]: 'Snapchat'
  };
  return labels[platform] || platform;
}

export function getSocialPlatformColor(platform: SocialPlatform): string {
  const colors = {
    [SocialPlatform.FACEBOOK]: '#1877F2',
    [SocialPlatform.TWITTER]: '#1DA1F2',
    [SocialPlatform.INSTAGRAM]: '#E4405F',
    [SocialPlatform.LINKEDIN]: '#0A66C2',
    [SocialPlatform.YOUTUBE]: '#FF0000',
    [SocialPlatform.TIKTOK]: '#000000',
    [SocialPlatform.PINTEREST]: '#BD081C',
    [SocialPlatform.SNAPCHAT]: '#FFFC00'
  };
  return colors[platform] || '#6B7280';
}

export function getPostStatusLabel(status: PostStatus): string {
  const labels = {
    [PostStatus.DRAFT]: 'Draft',
    [PostStatus.SCHEDULED]: 'Scheduled',
    [PostStatus.PUBLISHED]: 'Published',
    [PostStatus.FAILED]: 'Failed',
    [PostStatus.ARCHIVED]: 'Archived'
  };
  return labels[status] || status;
}

export function getPostStatusColor(status: PostStatus): string {
  const colors = {
    [PostStatus.DRAFT]: 'warning',
    [PostStatus.SCHEDULED]: 'info',
    [PostStatus.PUBLISHED]: 'success',
    [PostStatus.FAILED]: 'error',
    [PostStatus.ARCHIVED]: 'secondary'
  };
  return colors[status] || 'secondary';
}

export function getPostTypeLabel(type: PostType): string {
  const labels = {
    [PostType.TEXT]: 'Text',
    [PostType.IMAGE]: 'Image',
    [PostType.VIDEO]: 'Video',
    [PostType.LINK]: 'Link',
    [PostType.POLL]: 'Poll',
    [PostType.STORY]: 'Story',
    [PostType.REEL]: 'Reel'
  };
  return labels[type] || type;
}

export function getAccountStatusLabel(status: AccountStatus): string {
  const labels = {
    [AccountStatus.CONNECTED]: 'Connected',
    [AccountStatus.DISCONNECTED]: 'Disconnected',
    [AccountStatus.ERROR]: 'Error',
    [AccountStatus.PENDING]: 'Pending',
    [AccountStatus.EXPIRED]: 'Expired'
  };
  return labels[status] || status;
}

export function getAccountStatusColor(status: AccountStatus): string {
  const colors = {
    [AccountStatus.CONNECTED]: 'success',
    [AccountStatus.DISCONNECTED]: 'secondary',
    [AccountStatus.ERROR]: 'error',
    [AccountStatus.PENDING]: 'warning',
    [AccountStatus.EXPIRED]: 'error'
  };
  return colors[status] || 'secondary';
}

export function getCampaignStatusLabel(status: CampaignStatus): string {
  const labels = {
    [CampaignStatus.DRAFT]: 'Draft',
    [CampaignStatus.ACTIVE]: 'Active',
    [CampaignStatus.PAUSED]: 'Paused',
    [CampaignStatus.COMPLETED]: 'Completed',
    [CampaignStatus.CANCELLED]: 'Cancelled'
  };
  return labels[status] || status;
}

export function getCampaignStatusColor(status: CampaignStatus): string {
  const colors = {
    [CampaignStatus.DRAFT]: 'warning',
    [CampaignStatus.ACTIVE]: 'success',
    [CampaignStatus.PAUSED]: 'info',
    [CampaignStatus.COMPLETED]: 'secondary',
    [CampaignStatus.CANCELLED]: 'error'
  };
  return colors[status] || 'secondary';
}

export function getContentCategoryLabel(category: ContentCategory): string {
  const labels = {
    [ContentCategory.EDUCATION]: 'Education',
    [ContentCategory.TIPS]: 'Tips',
    [ContentCategory.NEWS]: 'News',
    [ContentCategory.PROMOTION]: 'Promotion',
    [ContentCategory.COMMUNITY]: 'Community',
    [ContentCategory.TESTIMONIAL]: 'Testimonial',
    [ContentCategory.BEHIND_SCENES]: 'Behind the Scenes',
    [ContentCategory.ANNOUNCEMENT]: 'Announcement'
  };
  return labels[category] || category;
}

export function formatEngagementRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function calculateEngagementRate(engagement: number, reach: number): number {
  return reach > 0 ? engagement / reach : 0;
}

export function calculateGrowthRate(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

export function getOptimalPostingTime(analytics: AccountAnalytics): string {
  const bestTime = analytics.bestPostingTimes[0];
  return bestTime ? `${bestTime.day} at ${bestTime.hour}:00` : 'No data available';
}

export function isAccountExpiringSoon(account: SocialAccount, days: number = 7): boolean {
  if (!account.expiresAt) return false;
  const daysUntilExpiry = Math.ceil((account.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= days && daysUntilExpiry > 0;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}