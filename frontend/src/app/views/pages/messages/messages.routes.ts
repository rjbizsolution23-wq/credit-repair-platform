import { Routes } from '@angular/router';

export const messagesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./messages-overview.component').then(m => m.MessagesOverviewComponent),
    data: {
      title: 'Messages Overview',
      breadcrumb: 'Overview'
    }
  },
  {
    path: 'inbox',
    loadComponent: () => import('./inbox/inbox.component').then(m => m.InboxComponent),
    data: {
      title: 'Inbox',
      breadcrumb: 'Inbox'
    }
  },
  {
    path: 'sent',
    loadComponent: () => import('./sent/sent.component').then(m => m.SentComponent),
    data: {
      title: 'Sent Messages',
      breadcrumb: 'Sent'
    }
  },
  {
    path: 'drafts',
    loadComponent: () => import('./drafts/drafts.component').then(m => m.DraftsComponent),
    data: {
      title: 'Draft Messages',
      breadcrumb: 'Drafts'
    }
  },
  {
    path: 'compose',
    loadComponent: () => import('./compose/compose.component').then(m => m.ComposeComponent),
    data: {
      title: 'Compose Message',
      breadcrumb: 'Compose'
    }
  },
  {
    path: 'compose/:type',
    loadComponent: () => import('./compose/compose.component').then(m => m.ComposeComponent),
    data: {
      title: 'Compose Message',
      breadcrumb: 'Compose'
    }
  },
  {
    path: 'message/:id',
    loadComponent: () => import('./message-detail/message-detail.component').then(m => m.MessageDetailComponent),
    data: {
      title: 'Message Details',
      breadcrumb: 'Message'
    }
  },
  {
    path: 'thread/:id',
    loadComponent: () => import('./thread/thread.component').then(m => m.ThreadComponent),
    data: {
      title: 'Message Thread',
      breadcrumb: 'Thread'
    }
  },
  {
    path: 'templates',
    loadComponent: () => import('./templates/templates.component').then(m => m.TemplatesComponent),
    data: {
      title: 'Message Templates',
      breadcrumb: 'Templates'
    }
  },
  {
    path: 'templates/create',
    loadComponent: () => import('./template-form/template-form.component').then(m => m.TemplateFormComponent),
    data: {
      title: 'Create Template',
      breadcrumb: 'Create Template'
    }
  },
  {
    path: 'templates/:id/edit',
    loadComponent: () => import('./template-form/template-form.component').then(m => m.TemplateFormComponent),
    data: {
      title: 'Edit Template',
      breadcrumb: 'Edit Template'
    }
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent),
    data: {
      title: 'Notifications',
      breadcrumb: 'Notifications'
    }
  },
  {
    path: 'notifications/settings',
    loadComponent: () => import('./notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
    data: {
      title: 'Notification Settings',
      breadcrumb: 'Settings'
    }
  },
  {
    path: 'bulk',
    loadComponent: () => import('./bulk-messaging/bulk-messaging.component').then(m => m.BulkMessagingComponent),
    data: {
      title: 'Bulk Messaging',
      breadcrumb: 'Bulk Messaging'
    }
  },
  {
    path: 'campaigns',
    loadComponent: () => import('./campaigns/campaigns.component').then(m => m.CampaignsComponent),
    data: {
      title: 'Message Campaigns',
      breadcrumb: 'Campaigns'
    }
  },
  {
    path: 'campaigns/create',
    loadComponent: () => import('./campaign-form/campaign-form.component').then(m => m.CampaignFormComponent),
    data: {
      title: 'Create Campaign',
      breadcrumb: 'Create Campaign'
    }
  },
  {
    path: 'campaigns/:id',
    loadComponent: () => import('./campaign-detail/campaign-detail.component').then(m => m.CampaignDetailComponent),
    data: {
      title: 'Campaign Details',
      breadcrumb: 'Campaign'
    }
  },
  {
    path: 'campaigns/:id/edit',
    loadComponent: () => import('./campaign-form/campaign-form.component').then(m => m.CampaignFormComponent),
    data: {
      title: 'Edit Campaign',
      breadcrumb: 'Edit Campaign'
    }
  },
  {
    path: 'analytics',
    loadComponent: () => import('./analytics/message-analytics.component').then(m => m.MessageAnalyticsComponent),
    data: {
      title: 'Message Analytics',
      breadcrumb: 'Analytics'
    }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/message-settings.component').then(m => m.MessageSettingsComponent),
    data: {
      title: 'Message Settings',
      breadcrumb: 'Settings'
    }
  }
];