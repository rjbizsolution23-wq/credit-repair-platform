import { Routes } from '@angular/router';

export const socialRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./social-overview.component').then(m => m.SocialOverviewComponent),
    data: {
      title: 'Social Overview',
      description: 'Social media integration and community features dashboard'
    }
  },
  {
    path: 'posts',
    children: [
      {
        path: '',
        loadComponent: () => import('./posts/posts-list.component').then(m => m.PostsListComponent),
        data: {
          title: 'Posts',
          description: 'Manage social media posts and content'
        }
      },
      {
        path: 'create',
        loadComponent: () => import('./posts/post-create.component').then(m => m.PostCreateComponent),
        data: {
          title: 'Create Post',
          description: 'Create new social media post'
        }
      },
      {
        path: ':id',
        loadComponent: () => import('./posts/post-detail.component').then(m => m.PostDetailComponent),
        data: {
          title: 'Post Details',
          description: 'View and manage post details'
        }
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./posts/post-edit.component').then(m => m.PostEditComponent),
        data: {
          title: 'Edit Post',
          description: 'Edit social media post'
        }
      }
    ]
  },
  {
    path: 'accounts',
    children: [
      {
        path: '',
        loadComponent: () => import('./accounts/accounts-list.component').then(m => m.AccountsListComponent),
        data: {
          title: 'Social Accounts',
          description: 'Manage connected social media accounts'
        }
      },
      {
        path: 'connect',
        loadComponent: () => import('./accounts/account-connect.component').then(m => m.AccountConnectComponent),
        data: {
          title: 'Connect Account',
          description: 'Connect new social media account'
        }
      },
      {
        path: ':id',
        loadComponent: () => import('./accounts/account-detail.component').then(m => m.AccountDetailComponent),
        data: {
          title: 'Account Details',
          description: 'View and manage account details'
        }
      },
      {
        path: ':id/settings',
        loadComponent: () => import('./accounts/account-settings.component').then(m => m.AccountSettingsComponent),
        data: {
          title: 'Account Settings',
          description: 'Configure account settings'
        }
      }
    ]
  },
  {
    path: 'community',
    children: [
      {
        path: '',
        loadComponent: () => import('./community/community-overview.component').then(m => m.CommunityOverviewComponent),
        data: {
          title: 'Community',
          description: 'Community features and engagement'
        }
      },
      {
        path: 'forums',
        children: [
          {
            path: '',
            loadComponent: () => import('./community/forums/forums-list.component').then(m => m.ForumsListComponent),
            data: {
              title: 'Forums',
              description: 'Community discussion forums'
            }
          },
          {
            path: 'create',
            loadComponent: () => import('./community/forums/forum-create.component').then(m => m.ForumCreateComponent),
            data: {
              title: 'Create Forum',
              description: 'Create new discussion forum'
            }
          },
          {
            path: ':id',
            loadComponent: () => import('./community/forums/forum-detail.component').then(m => m.ForumDetailComponent),
            data: {
              title: 'Forum Details',
              description: 'View forum discussions'
            }
          }
        ]
      },
      {
        path: 'groups',
        children: [
          {
            path: '',
            loadComponent: () => import('./community/groups/groups-list.component').then(m => m.GroupsListComponent),
            data: {
              title: 'Groups',
              description: 'Community groups and memberships'
            }
          },
          {
            path: 'create',
            loadComponent: () => import('./community/groups/group-create.component').then(m => m.GroupCreateComponent),
            data: {
              title: 'Create Group',
              description: 'Create new community group'
            }
          },
          {
            path: ':id',
            loadComponent: () => import('./community/groups/group-detail.component').then(m => m.GroupDetailComponent),
            data: {
              title: 'Group Details',
              description: 'View and manage group'
            }
          }
        ]
      },
      {
        path: 'events',
        children: [
          {
            path: '',
            loadComponent: () => import('./community/events/events-list.component').then(m => m.EventsListComponent),
            data: {
              title: 'Events',
              description: 'Community events and activities'
            }
          },
          {
            path: 'create',
            loadComponent: () => import('./community/events/event-create.component').then(m => m.EventCreateComponent),
            data: {
              title: 'Create Event',
              description: 'Create new community event'
            }
          },
          {
            path: ':id',
            loadComponent: () => import('./community/events/event-detail.component').then(m => m.EventDetailComponent),
            data: {
              title: 'Event Details',
              description: 'View and manage event'
            }
          }
        ]
      }
    ]
  },
  {
    path: 'sharing',
    children: [
      {
        path: '',
        loadComponent: () => import('./sharing/sharing-overview.component').then(m => m.SharingOverviewComponent),
        data: {
          title: 'Content Sharing',
          description: 'Share content across social platforms'
        }
      },
      {
        path: 'templates',
        children: [
          {
            path: '',
            loadComponent: () => import('./sharing/templates/templates-list.component').then(m => m.TemplatesListComponent),
            data: {
              title: 'Sharing Templates',
              description: 'Manage content sharing templates'
            }
          },
          {
            path: 'create',
            loadComponent: () => import('./sharing/templates/template-create.component').then(m => m.TemplateCreateComponent),
            data: {
              title: 'Create Template',
              description: 'Create new sharing template'
            }
          },
          {
            path: ':id',
            loadComponent: () => import('./sharing/templates/template-detail.component').then(m => m.TemplateDetailComponent),
            data: {
              title: 'Template Details',
              description: 'View and edit template'
            }
          }
        ]
      },
      {
        path: 'campaigns',
        children: [
          {
            path: '',
            loadComponent: () => import('./sharing/campaigns/campaigns-list.component').then(m => m.CampaignsListComponent),
            data: {
              title: 'Sharing Campaigns',
              description: 'Manage social media campaigns'
            }
          },
          {
            path: 'create',
            loadComponent: () => import('./sharing/campaigns/campaign-create.component').then(m => m.CampaignCreateComponent),
            data: {
              title: 'Create Campaign',
              description: 'Create new sharing campaign'
            }
          },
          {
            path: ':id',
            loadComponent: () => import('./sharing/campaigns/campaign-detail.component').then(m => m.CampaignDetailComponent),
            data: {
              title: 'Campaign Details',
              description: 'View and manage campaign'
            }
          }
        ]
      }
    ]
  },
  {
    path: 'analytics',
    children: [
      {
        path: '',
        loadComponent: () => import('./analytics/analytics-overview.component').then(m => m.AnalyticsOverviewComponent),
        data: {
          title: 'Social Analytics',
          description: 'Social media performance analytics'
        }
      },
      {
        path: 'engagement',
        loadComponent: () => import('./analytics/engagement-analytics.component').then(m => m.EngagementAnalyticsComponent),
        data: {
          title: 'Engagement Analytics',
          description: 'Analyze social media engagement'
        }
      },
      {
        path: 'reach',
        loadComponent: () => import('./analytics/reach-analytics.component').then(m => m.ReachAnalyticsComponent),
        data: {
          title: 'Reach Analytics',
          description: 'Analyze content reach and impressions'
        }
      },
      {
        path: 'audience',
        loadComponent: () => import('./analytics/audience-analytics.component').then(m => m.AudienceAnalyticsComponent),
        data: {
          title: 'Audience Analytics',
          description: 'Analyze audience demographics and behavior'
        }
      },
      {
        path: 'reports',
        children: [
          {
            path: '',
            loadComponent: () => import('./analytics/reports/reports-list.component').then(m => m.ReportsListComponent),
            data: {
              title: 'Analytics Reports',
              description: 'View and generate analytics reports'
            }
          },
          {
            path: 'generate',
            loadComponent: () => import('./analytics/reports/report-generate.component').then(m => m.ReportGenerateComponent),
            data: {
              title: 'Generate Report',
              description: 'Generate new analytics report'
            }
          },
          {
            path: ':id',
            loadComponent: () => import('./analytics/reports/report-detail.component').then(m => m.ReportDetailComponent),
            data: {
              title: 'Report Details',
              description: 'View detailed analytics report'
            }
          }
        ]
      }
    ]
  },
  {
    path: 'settings',
    children: [
      {
        path: '',
        loadComponent: () => import('./settings/social-settings.component').then(m => m.SocialSettingsComponent),
        data: {
          title: 'Social Settings',
          description: 'Configure social media settings'
        }
      },
      {
        path: 'privacy',
        loadComponent: () => import('./settings/privacy-settings.component').then(m => m.PrivacySettingsComponent),
        data: {
          title: 'Privacy Settings',
          description: 'Configure privacy and security settings'
        }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
        data: {
          title: 'Notification Settings',
          description: 'Configure social media notifications'
        }
      },
      {
        path: 'integrations',
        loadComponent: () => import('./settings/integration-settings.component').then(m => m.IntegrationSettingsComponent),
        data: {
          title: 'Integration Settings',
          description: 'Configure third-party integrations'
        }
      }
    ]
  }
];