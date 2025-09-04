import { Routes } from '@angular/router';

export const disputesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./disputes-overview/disputes-overview.component').then(c => c.DisputesOverviewComponent),
    data: { title: 'Disputes Overview' }
  },
  {
    path: 'generator',
    loadComponent: () => import('./dispute-generator/dispute-generator.component').then(c => c.DisputeGeneratorComponent),
    data: { title: 'Dispute Generator' }
  },
  {
    path: 'active',
    loadComponent: () => import('./active-disputes/active-disputes.component').then(c => c.ActiveDisputesComponent),
    data: { title: 'Active Disputes' }
  },
  {
    path: 'create',
    loadComponent: () => import('./create-dispute/create-dispute.component').then(c => c.CreateDisputeComponent),
    data: { title: 'Create Dispute' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-dispute/edit-dispute.component').then(c => c.EditDisputeComponent),
    data: { title: 'Edit Dispute' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./view-dispute/view-dispute.component').then(c => c.ViewDisputeComponent),
    data: { title: 'View Dispute' }
  },
  {
    path: 'history',
    loadComponent: () => import('./dispute-history/dispute-history.component').then(c => c.DisputeHistoryComponent),
    data: { title: 'Dispute History' }
  },
  {
    path: 'templates',
    loadComponent: () => import('./dispute-templates/dispute-templates.component').then(c => c.DisputeTemplatesComponent),
    data: { title: 'Dispute Templates' }
  },
  {
    path: 'bulk-create',
    loadComponent: () => import('./bulk-create-disputes/bulk-create-disputes.component').then(c => c.BulkCreateDisputesComponent),
    data: { title: 'Bulk Dispute Creation' }
  },
  {
    path: 'analytics',
    loadComponent: () => import('./dispute-analytics/dispute-analytics.component').then(c => c.DisputeAnalyticsComponent),
    data: { title: 'Dispute Analytics' }
  },
  {
    path: 'responses',
    loadComponent: () => import('./dispute-responses/dispute-responses.component').then(c => c.DisputeResponsesComponent),
    data: { title: 'Bureau Responses' }
  },
  {
    path: 'escalations',
    loadComponent: () => import('./dispute-escalations/dispute-escalations.component').then(c => c.DisputeEscalationsComponent),
    data: { title: 'Escalated Disputes' }
  }
];