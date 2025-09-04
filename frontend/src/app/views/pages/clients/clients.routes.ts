import { Routes } from '@angular/router';

export default [
  {
    path: '',
    redirectTo: 'all',
    pathMatch: 'full'
  },
  {
    path: 'all',
    loadComponent: () => import('./all-clients/all-clients.component').then(c => c.AllClientsComponent),
    data: { title: 'All Clients' }
  },
  {
    path: 'add',
    loadComponent: () => import('./add-client/add-client.component').then(c => c.AddClientComponent),
    data: { title: 'Add Client' }
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-client/edit-client.component').then(c => c.EditClientComponent),
    data: { title: 'Edit Client' }
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./view-client/view-client.component').then(c => c.ViewClientComponent),
    data: { title: 'View Client' }
  },
  {
    path: 'portal',
    loadComponent: () => import('./client-portal/client-portal.component').then(c => c.ClientPortalComponent),
    data: { title: 'Client Portal' }
  },
  {
    path: 'import',
    loadComponent: () => import('./import-clients/import-clients.component').then(c => c.ImportClientsComponent),
    data: { title: 'Import Clients' }
  },
  {
    path: 'export',
    loadComponent: () => import('./export-clients/export-clients.component').then(c => c.ExportClientsComponent),
    data: { title: 'Export Clients' }
  }
] as Routes;