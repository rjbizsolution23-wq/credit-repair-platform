import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full'
      },
      {
        path: 'general',
        loadComponent: () => import('./general-settings/general-settings.component').then(c => c.GeneralSettingsComponent),
        data: { title: 'General Settings' }
      },
      {
        path: 'users',
        loadComponent: () => import('./user-management/user-management.component').then(c => c.UserManagementComponent),
        data: { title: 'User Management' }
      },
      {
        path: 'permissions',
        loadComponent: () => import('./permissions/permissions.component').then(c => c.PermissionsComponent),
        data: { title: 'Permissions' }
      },
      {
        path: 'integrations',
        loadComponent: () => import('./integrations/integrations.component').then(c => c.IntegrationsComponent),
        data: { title: 'Integrations' }
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component').then(c => c.NotificationsComponent),
        data: { title: 'Notification Settings' }
      },
      {
        path: 'security',
        loadComponent: () => import('./security/security.component').then(c => c.SecurityComponent),
        data: { title: 'Security Settings' }
      },
      {
        path: 'backup',
        loadComponent: () => import('./backup/backup.component').then(c => c.BackupComponent),
        data: { title: 'Backup & Restore' }
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./audit-logs/audit-logs.component').then(c => c.AuditLogsComponent),
        data: { title: 'Audit Logs' }
      },
      {
        path: 'staff',
        loadComponent: () => import('./staff-management/staff-management.component').then(c => c.StaffManagementComponent),
        data: { title: 'Staff Management' }
      }
    ]
  }
];

export default SETTINGS_ROUTES;