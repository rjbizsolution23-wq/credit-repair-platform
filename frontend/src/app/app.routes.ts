import { Routes } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Auth routes disabled - direct access to dashboard
  // { path: 'auth', loadChildren: () => import('./views/pages/auth/auth.routes').then(m => m.default)},
  {
    path: '',
    component: BaseComponent,
    // canActivateChild: [authGuard], // Authentication disabled
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./views/pages/dashboard/dashboard.routes').then(m => m.default)
      },
      // Client Management
      {
        path: 'clients',
        loadChildren: () => import('./views/pages/clients/clients.routes').then(m => m.default)
      },
      {
        path: 'disputes',
        loadChildren: () => import('./views/pages/disputes/disputes.routes').then(m => m.disputesRoutes)
      },
      {
        path: 'credit-reports',
        loadChildren: () => import('./views/pages/credit-reports/credit-reports.routes').then(m => m.default)
      },
      // Legal & Enforcement
      {
        path: 'letters',
        loadChildren: () => import('./views/pages/letters/letters.routes').then(m => m.default)
      },
      {
        path: 'enforcement',
        loadChildren: () => import('./views/pages/enforcement/enforcement.routes').then(m => m.EnforcementRoutes)
      },
      {
        path: 'bureaus',
        loadChildren: () => import('./views/pages/bureaus/bureaus.routes').then(m => m.bureausRoutes)
      },
      // AI & Analytics
      {
        path: 'ai',
        loadChildren: () => import('./views/pages/ai/ai.routes').then(m => m.AI_ROUTES)
      },
      {
        path: 'analytics',
        loadChildren: () => import('./views/pages/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES)
      },
      // Communications
      {
        path: 'messages',
        loadChildren: () => import('./views/pages/messages/messages.routes').then(m => m.messagesRoutes)
      },
      {
        path: 'social',
        loadChildren: () => import('./views/pages/social/social.routes').then(m => m.socialRoutes)
      },
      // Education & Resources
      {
        path: 'legal',
        loadChildren: () => import('./views/pages/legal/legal.routes').then(m => m.legalRoutes)
      },
      {
        path: 'credit-building',
        loadChildren: () => import('./views/pages/credit-building/credit-building.routes').then(m => m.creditBuildingRoutes)
      },
      // System Settings
      {
        path: 'settings',
        loadChildren: () => import('./views/pages/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
        canActivate: [adminGuard]
      },
      {
        path: 'compliance',
        loadChildren: () => import('./views/pages/compliance/compliance.routes').then(m => m.complianceRoutes),
        canActivate: [adminGuard]
      },
      // Account
      {
        path: 'profile',
        loadChildren: () => import('./views/pages/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'help',
        loadChildren: () => import('./views/pages/help/help.routes').then(m => m.HELP_ROUTES)
      },
      // Existing routes
      {
        path: 'apps',
        loadChildren: () => import('./views/pages/apps/apps.routes').then(m => m.default)
      },
      {
        path: 'ui-components',
        loadChildren: () => import('./views/pages/ui-components/ui-components.routes').then(m => m.default)
      },
      {
        path: 'advanced-ui',
        loadChildren: () => import('./views/pages/advanced-ui/advanced-ui.routes').then(m => m.default)
      },
      {
        path: 'forms',
        loadChildren: () => import('./views/pages/forms/forms.routes').then(m => m.default)
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/pages/charts/charts.routes').then(m => m.default)
      },
      {
        path: 'tables',
        loadChildren: () => import('./views/pages/tables/tables.routes').then(m => m.default)
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/pages/icons/icons.routes').then(m => m.default)
      },
      {
        path: 'general',
        loadChildren: () => import('./views/pages/general/general.routes').then(m => m.default)
      }
    ]
  },
  {
    path: 'error',
    loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent),
  },
  {
    path: 'error/:type',
    loadComponent: () => import('./views/pages/error/error.component').then(c => c.ErrorComponent)
  },
  // Redirect any auth URLs to dashboard
  { path: 'auth', redirectTo: 'dashboard' },
  { path: 'auth/**', redirectTo: 'dashboard' },
  { path: 'login', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
