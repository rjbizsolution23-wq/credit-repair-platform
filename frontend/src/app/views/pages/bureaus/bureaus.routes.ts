import { Routes } from '@angular/router';

export const bureausRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./bureaus-overview/bureaus-overview.component').then(m => m.BureausOverviewComponent),
    data: {
      title: 'Bureaus Overview',
      breadcrumb: 'Overview'
    }
  },
  {
    path: 'disputes',
    children: [
      {
        path: '',
        loadComponent: () => import('./disputes/disputes.component').then(m => m.DisputesComponent),
        data: {
          title: 'Bureau Disputes',
          breadcrumb: 'Disputes'
        }
      }
    ]
  },
  {
    path: 'templates',
    loadComponent: () => import('./settings/templates/templates.component').then(m => m.TemplatesComponent),
    data: {
      title: 'Dispute Templates',
      breadcrumb: 'Templates'
    }
  },
  {
    path: 'automation',
    loadComponent: () => import('./settings/automation/automation.component').then(m => m.AutomationComponent),
    data: {
      title: 'Automation Rules',
      breadcrumb: 'Automation'
    }
  }
];