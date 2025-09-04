import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessagesService } from './messages.service';
import {
  Message,
  MessageThread,
  Notification,
  MessageCampaign,
  MessageAnalytics,
  MessageType,
  MessageStatus,
  MessagePriority,
  NotificationStatus,
  CampaignStatus,
  getMessageTypeLabel,
  getMessageStatusLabel,
  getMessagePriorityLabel,
  getMessageStatusColor,
  getMessagePriorityColor,
  getTimeAgo
} from './messages.model';

interface OverviewStats {
  totalMessages: number;
  unreadMessages: number;
  sentToday: number;
  deliveryRate: number;
  responseRate: number;
  activeCampaigns: number;
  pendingNotifications: number;
  averageResponseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'notification' | 'campaign';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  priority?: string;
  icon: string;
  color: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  count?: number;
}

@Component({
  selector: 'app-messages-overview',
  templateUrl: './messages-overview.component.html',
  styleUrls: ['./messages-overview.component.scss']
})
export class MessagesOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading and error states
  loading = true;
  error: string | null = null;

  // Data
  stats: OverviewStats = {
    totalMessages: 0,
    unreadMessages: 0,
    sentToday: 0,
    deliveryRate: 0,
    responseRate: 0,
    activeCampaigns: 0,
    pendingNotifications: 0,
    averageResponseTime: 0
  };

  recentMessages: Message[] = [];
  recentNotifications: Notification[] = [];
  activeThreads: MessageThread[] = [];
  activeCampaigns: MessageCampaign[] = [];
  recentActivity: RecentActivity[] = [];
  analytics: MessageAnalytics | null = null;

  // Chart data
  messagesByTypeData: any[] = [];
  messagesByStatusData: any[] = [];
  messageTrendsData: any[] = [];
  deliveryRateData: any[] = [];

  // Quick actions
  quickActions: QuickAction[] = [
    {
      id: 'compose',
      title: 'Compose Message',
      description: 'Send a new message to clients',
      icon: 'edit',
      color: 'primary',
      route: '/messages/compose'
    },
    {
      id: 'inbox',
      title: 'View Inbox',
      description: 'Check received messages',
      icon: 'inbox',
      color: 'info',
      route: '/messages/inbox'
    },
    {
      id: 'campaigns',
      title: 'Create Campaign',
      description: 'Start a new message campaign',
      icon: 'campaign',
      color: 'success',
      route: '/messages/campaigns/create'
    },
    {
      id: 'templates',
      title: 'Manage Templates',
      description: 'Create and edit message templates',
      icon: 'template',
      color: 'warning',
      route: '/messages/templates'
    },
    {
      id: 'bulk',
      title: 'Bulk Messaging',
      description: 'Send messages to multiple recipients',
      icon: 'group',
      color: 'secondary',
      route: '/messages/bulk'
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Analyze message performance',
      icon: 'analytics',
      color: 'accent',
      route: '/messages/analytics'
    }
  ];

  constructor(
    private messagesService: MessagesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    forkJoin({
      messages: this.messagesService.getMessages({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
      notifications: this.messagesService.getNotifications({ limit: 5, filter: { status: [NotificationStatus.UNREAD] } }),
      threads: this.messagesService.getThreads({ limit: 5, sortBy: 'lastActivity', sortOrder: 'desc' }),
      campaigns: this.messagesService.getCampaigns({ limit: 5, filter: { status: [CampaignStatus.ACTIVE, CampaignStatus.SCHEDULED] } }),
      analytics: this.messagesService.getAnalytics({ period: '30d' }),
      unreadCount: this.messagesService.getUnreadCount()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (data) => {
        this.recentMessages = data.messages.data;
        this.recentNotifications = data.notifications.data;
        this.activeThreads = data.threads.data;
        this.activeCampaigns = data.campaigns.data;
        this.analytics = data.analytics;
        
        this.calculateStats(data);
        this.generateRecentActivity();
        this.prepareChartData();
        this.updateQuickActionCounts();
      },
      error: (error) => {
        console.error('Error loading overview data:', error);
        this.error = 'Failed to load overview data. Please try again.';
      }
    });
  }

  private calculateStats(data: any): void {
    const analytics = data.analytics;
    
    this.stats = {
      totalMessages: analytics?.overview?.totalMessages || 0,
      unreadMessages: data.unreadCount || 0,
      sentToday: analytics?.overview?.sentToday || 0,
      deliveryRate: analytics?.overview?.deliveryRate || 0,
      responseRate: analytics?.overview?.responseRate || 0,
      activeCampaigns: analytics?.overview?.activeCampaigns || 0,
      pendingNotifications: data.notifications.data.length || 0,
      averageResponseTime: analytics?.performance?.averageResponseTime || 0
    };
  }

  private generateRecentActivity(): void {
    const activities: RecentActivity[] = [];

    // Add recent messages
    this.recentMessages.slice(0, 3).forEach(message => {
      activities.push({
        id: message.id,
        type: 'message',
        title: `Message ${getMessageStatusLabel(message.status)}`,
        description: `${message.subject} - ${message.recipientName}`,
        timestamp: message.createdAt,
        status: getMessageStatusLabel(message.status),
        priority: getMessagePriorityLabel(message.priority),
        icon: this.getMessageIcon(message.type),
        color: getMessageStatusColor(message.status)
      });
    });

    // Add recent notifications
    this.recentNotifications.slice(0, 2).forEach(notification => {
      activities.push({
        id: notification.id,
        type: 'notification',
        title: 'New Notification',
        description: notification.title,
        timestamp: notification.createdAt,
        icon: 'notifications',
        color: notification.isRead ? 'gray' : 'blue'
      });
    });

    // Add campaign activities
    this.activeCampaigns.slice(0, 2).forEach(campaign => {
      activities.push({
        id: campaign.id,
        type: 'campaign',
        title: `Campaign ${campaign.status}`,
        description: campaign.name,
        timestamp: campaign.updatedAt,
        status: campaign.status,
        icon: 'campaign',
        color: this.getCampaignColor(campaign.status)
      });
    });

    // Sort by timestamp and take the most recent
    this.recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }

  private prepareChartData(): void {
    if (!this.analytics) return;

    // Messages by type
    this.messagesByTypeData = this.analytics.messageStats.byType.map(stat => ({
      name: getMessageTypeLabel(stat.type as MessageType),
      value: stat.count,
      percentage: stat.percentage
    }));

    // Messages by status
    this.messagesByStatusData = this.analytics.messageStats.byStatus.map(stat => ({
      name: getMessageStatusLabel(stat.status as MessageStatus),
      value: stat.count,
      percentage: stat.percentage,
      color: getMessageStatusColor(stat.status as MessageStatus)
    }));

    // Message trends (last 7 days)
    this.messageTrendsData = this.analytics.trends.volumeTrend.slice(-7).map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' }),
      messages: trend.value,
      change: trend.change || 0
    }));

    // Delivery rate trends
    this.deliveryRateData = this.analytics.trends.deliveryTrend.slice(-7).map(trend => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' }),
      rate: trend.value,
      change: trend.change || 0
    }));
  }

  private updateQuickActionCounts(): void {
    this.quickActions.forEach(action => {
      switch (action.id) {
        case 'inbox':
          action.count = this.stats.unreadMessages;
          break;
        case 'campaigns':
          action.count = this.stats.activeCampaigns;
          break;
        case 'templates':
          action.count = this.analytics?.templateStats?.usage?.length || 0;
          break;
      }
    });
  }

  private setupRealTimeUpdates(): void {
    // Subscribe to real-time message updates
    this.messagesService.newMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.recentMessages.unshift(message);
        this.recentMessages = this.recentMessages.slice(0, 10);
        this.stats.totalMessages++;
        this.generateRecentActivity();
      });

    // Subscribe to real-time notification updates
    this.messagesService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.recentNotifications.unshift(notification);
        this.recentNotifications = this.recentNotifications.slice(0, 5);
        this.stats.pendingNotifications++;
        this.generateRecentActivity();
      });

    // Subscribe to unread count updates
    this.messagesService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.stats.unreadMessages = count;
        this.updateQuickActionCounts();
      });
  }

  // Event Handlers
  onRefresh(): void {
    this.loadData();
  }

  onQuickAction(action: QuickAction): void {
    this.router.navigate([action.route]);
  }

  onViewMessage(message: Message): void {
    if (message.threadId) {
      this.router.navigate(['/messages/thread', message.threadId]);
    } else {
      this.router.navigate(['/messages/message', message.id]);
    }
  }

  onViewNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.messagesService.markNotificationAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
    
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  onViewThread(thread: MessageThread): void {
    this.router.navigate(['/messages/thread', thread.id]);
  }

  onViewCampaign(campaign: MessageCampaign): void {
    this.router.navigate(['/messages/campaigns', campaign.id]);
  }

  onViewAllMessages(): void {
    this.router.navigate(['/messages/inbox']);
  }

  onViewAllNotifications(): void {
    this.router.navigate(['/messages/notifications']);
  }

  onViewAllCampaigns(): void {
    this.router.navigate(['/messages/campaigns']);
  }

  onMarkAllNotificationsRead(): void {
    this.messagesService.markAllNotificationsAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.recentNotifications = this.recentNotifications.map(n => ({ ...n, isRead: true }));
        this.stats.pendingNotifications = 0;
      });
  }

  // Utility Methods
  getTimeAgo(date: Date): string {
    return getTimeAgo(date);
  }

  getMessageIcon(type: MessageType): string {
    const icons = {
      [MessageType.EMAIL]: 'email',
      [MessageType.SMS]: 'sms',
      [MessageType.PUSH]: 'notifications',
      [MessageType.IN_APP]: 'message',
      [MessageType.SYSTEM]: 'settings'
    };
    return icons[type] || 'message';
  }

  getCampaignColor(status: CampaignStatus): string {
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

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatPercentage(num: number): string {
    return `${Math.round(num)}%`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  }

  getStatColor(value: number, threshold: number, reverse: boolean = false): string {
    const isGood = reverse ? value < threshold : value > threshold;
    return isGood ? 'success' : 'warning';
  }

  getStatIcon(statType: string): string {
    const icons: { [key: string]: string } = {
      totalMessages: 'message',
      unreadMessages: 'mark_email_unread',
      sentToday: 'send',
      deliveryRate: 'check_circle',
      responseRate: 'reply',
      activeCampaigns: 'campaign',
      pendingNotifications: 'notifications',
      averageResponseTime: 'schedule'
    };
    return icons[statType] || 'info';
  }

  getMessagePriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'High Priority',
      'medium': 'Medium Priority',
      'low': 'Low Priority',
      'urgent': 'Urgent',
      'normal': 'Normal'
    };
    return labels[priority] || priority;
  }

  getMessagePriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'urgent': 'priority-urgent',
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low',
      'normal': 'priority-normal'
    };
    return colors[priority] || 'priority-normal';
  }

  getMessageStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'sent': 'Sent',
      'delivered': 'Delivered',
      'read': 'Read',
      'failed': 'Failed',
      'pending': 'Pending',
      'draft': 'Draft',
      'scheduled': 'Scheduled'
    };
    return labels[status] || status;
  }

  getMessageStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'sent': 'status-sent',
      'delivered': 'status-delivered',
      'read': 'status-read',
      'failed': 'status-failed',
      'pending': 'status-pending',
      'draft': 'status-draft',
      'scheduled': 'status-scheduled'
    };
    return colors[status] || 'status-default';
  }
}