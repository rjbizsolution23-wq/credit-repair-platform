import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Main Dashboard',
    isTitle: true
  },
  {
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard'
  },
  {
    label: 'Client Management',
    isTitle: true
  },
  {
    label: 'Clients',
    icon: 'users',
    subItems: [
      {
        label: 'All Clients',
        link: '/clients/all',
      },
      {
        label: 'Add New Client',
        link: '/clients/add'
      },
      {
        label: 'Client Portal',
        link: '/clients/portal'
      },
    ]
  },
  {
    label: 'Disputes',
    icon: 'file-text',
    subItems: [
      {
        label: 'Overview',
        link: '/disputes/overview',
      },
      {
        label: 'Dispute Generator',
        link: '/disputes/generator'
      },
      {
        label: 'Active Disputes',
        link: '/disputes/active',
      },
      {
        label: 'Create Dispute',
        link: '/disputes/create'
      },
      {
        label: 'Bulk Create',
        link: '/disputes/bulk-create'
      },
      {
        label: 'Analytics',
        link: '/disputes/analytics'
      },
      {
        label: 'Responses',
        link: '/disputes/responses'
      },
      {
        label: 'Escalations',
        link: '/disputes/escalations'
      },
      {
        label: 'History',
        link: '/disputes/history'
      },
      {
        label: 'Templates',
        link: '/disputes/templates'
      },
     ]
   },
   {
    label: 'Credit Reports',
    icon: 'bar-chart-2',
    link: '/credit-reports',
    badge: {
      variant: 'primary',
      text: 'New',
    }
  },
  {
    label: 'Legal & Enforcement',
    isTitle: true
  },
  {
    label: 'Letters',
    icon: 'edit-3',
    subItems: [
      {
        label: 'All Letters',
        link: '/letters/all',
      },
      {
        label: 'Create Letter',
        link: '/letters/create',
      },
      {
        label: 'Templates',
        link: '/letters/templates',
      },
      {
        label: 'Dispute Letters',
        link: '/letters/dispute',
      },
      {
        label: 'Validation Letters',
        link: '/letters/validation',
      },
      {
        label: 'Goodwill Letters',
        link: '/letters/goodwill',
      },
      {
        label: 'Cease & Desist',
        link: '/letters/cease-desist',
      },
     ]
   },
   {
    label: 'Enforcement Chain',
    icon: 'shield',
    subItems: [
      {
        label: 'Stage Management',
        link: '/enforcement/stages',
      },
      {
        label: 'Auto Progression',
        link: '/enforcement/auto',
      },
      {
        label: 'Legal Actions',
        link: '/enforcement/legal',
      },
    ]
  },
  {
    label: 'Credit Bureaus',
    icon: 'database',
    subItems: [
      {
        label: 'Overview',
        link: '/bureaus/overview',
      },
      {
        label: 'Bureau Disputes',
        link: '/bureaus/disputes',
      },
    ]
  },

  {
    label: 'AI & Analytics',
    icon: 'trending-up',
    subItems: [
      {
        label: 'AI Overview',
        link: '/ai/overview',
      },
      {
        label: 'Dispute Analysis',
        link: '/ai/dispute-analysis',
      },
      {
        label: 'Letter Generation',
        link: '/ai/letter-generation',
      },
      {
        label: 'Credit Optimization',
        link: '/ai/credit-optimization',
      },
      {
        label: 'Predictive Analytics',
        link: '/ai/predictive-analytics',
      },
      {
        label: 'Analytics Overview',
        link: '/analytics/overview',
      },
      {
        label: 'Reports',
        link: '/analytics/reports',
      },
      {
        label: 'Performance',
        link: '/analytics/performance',
      },
      {
        label: 'Trends',
        link: '/analytics/trends',
      },
      {
        label: 'Custom Reports',
        link: '/analytics/custom-reports',
      },
    ]
  },
  {
    label: 'Communications',
    isTitle: true
  },
  {
    label: 'Messaging',
    icon: 'message-circle',
    subItems: [
      {
        label: 'Client Messages',
        link: '/messages/clients',
      },
      {
        label: 'SMS & Email',
        link: '/messages/sms-email',
      },
      {
        label: 'Notifications',
        link: '/messages/notifications',
      },
    ]
  },
  {
    label: 'Social Media',
    icon: 'share-2',
    subItems: [
      {
        label: 'Content Calendar',
        link: '/social/calendar'
      },
      {
        label: 'Auto Posting',
        link: '/social/auto-posting'
      },
      {
        label: 'Engagement',
        link: '/social/engagement'
      },
    ]
  },
  {
    label: 'Education & Resources',
    isTitle: true
  },
  {
    label: 'Legal & Enforcement',
    icon: 'book-open',
    subItems: [
      {
        label: 'Overview',
        link: '/legal/overview'
      },
      {
        label: 'Legal Actions',
        link: '/legal/actions'
      },
      {
        label: 'Compliance',
        link: '/legal/compliance'
      },
      {
        label: 'Documentation',
        link: '/legal/documentation'
      },
    ]
   },
   {
     label: 'Credit Building',
    icon: 'trending-up',
    subItems: [
      {
        label: 'Tradelines',
        link: '/credit-building/tradelines'
      },
      {
        label: 'Business Credit',
        link: '/credit-building/business'
      },
      {
        label: 'Secured Cards',
        link: '/credit-building/secured-cards'
      },
    ]
  },
  {
    label: 'System Settings',
    isTitle: true
  },
  {
    label: 'Configuration',
    icon: 'settings',
    subItems: [
      {
        label: 'System Settings',
        link: '/settings/system',
      },
      {
        label: 'User Management',
        link: '/settings/users',
      },
      {
        label: 'API Keys',
        link: '/settings/api-keys',
      },
      {
        label: 'Backup & Restore',
        link: '/settings/backup',
      },
    ]
  },
  {
    label: 'Compliance',
    icon: 'shield-check',
    subItems: [
      {
        label: 'Audit Logs',
        link: '/compliance/audit-logs',
      },
      {
        label: 'Data Privacy',
        link: '/compliance/privacy',
      },
      {
        label: 'Security Reports',
        link: '/compliance/security',
      },
    ]
  },
  {
    label: 'Account',
    isTitle: true
  },
  {
    label: 'Profile',
    icon: 'user',
    link: '/profile',
  },
  {
    label: 'Authentication',
    icon: 'unlock',
    subItems: [
      {
        label: 'Login',
        link: '/auth/login',
      },
      {
        label: 'Register',
        link: '/auth/register',
      },
    ]
  },
  {
    label: 'Help & Support',
    icon: 'help-circle',
    subItems: [
      {
        label: 'Documentation',
        link: '/help/docs',
      },
      {
        label: 'Training Videos',
        link: '/help/videos',
      },
      {
        label: 'Contact Support',
        link: '/help/contact',
      },
      {
        label: 'FAQ',
        link: '/help/faq',
      },
    ]
  },
];
