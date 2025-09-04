import { Routes } from '@angular/router';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./profile-overview/profile-overview.component').then(c => c.ProfileOverviewComponent),
        data: { title: 'Profile Overview' }
      },
      {
        path: 'edit',
        loadComponent: () => import('./edit-profile/edit-profile.component').then(c => c.EditProfileComponent),
        data: { title: 'Edit Profile' }
      },
      {
        path: 'security',
        loadComponent: () => import('./profile-security/profile-security.component').then(c => c.ProfileSecurityComponent),
        data: { title: 'Security Settings' }
      },
      {
        path: 'preferences',
        loadComponent: () => import('./preferences/preferences.component').then(c => c.PreferencesComponent),
        data: { title: 'Preferences' }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notification-settings/notification-settings.component').then(c => c.NotificationSettingsComponent),
        data: { title: 'Notification Settings' }
      },
      {
        path: 'billing',
        loadComponent: () => import('./billing/billing.component').then(c => c.BillingComponent),
        data: { title: 'Billing & Subscription' }
      },
      {
        path: 'activity',
        loadComponent: () => import('./activity-log/activity-log.component').then(c => c.ActivityLogComponent),
        data: { title: 'Activity Log' }
      },
      {
        path: 'api-keys',
        loadComponent: () => import('./api-keys/api-keys.component').then(c => c.ApiKeysComponent),
        data: { title: 'API Keys' }
      }
    ]
  }
];

export default PROFILE_ROUTES;