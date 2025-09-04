import { Routes } from '@angular/router';

export const HELP_ROUTES: Routes = [
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
        loadComponent: () => import('./help-overview/help-overview.component').then(c => c.HelpOverviewComponent),
        data: { title: 'Help Center' }
      },
      {
        path: 'documentation',
        loadComponent: () => import('./documentation/documentation.component').then(c => c.DocumentationComponent),
        data: { title: 'Documentation' }
      },
      {
        path: 'tutorials',
        loadComponent: () => import('./tutorials/tutorials.component').then(c => c.TutorialsComponent),
        data: { title: 'Tutorials' }
      },
      {
        path: 'faq',
        loadComponent: () => import('./faq/faq.component').then(c => c.FaqComponent),
        data: { title: 'Frequently Asked Questions' }
      },
      {
        path: 'contact-support',
        loadComponent: () => import('./contact-support/contact-support.component').then(c => c.ContactSupportComponent),
        data: { title: 'Contact Support' }
      },
      {
        path: 'video-guides',
        loadComponent: () => import('./video-guides/video-guides.component').then(c => c.VideoGuidesComponent),
        data: { title: 'Video Guides' }
      },
      {
        path: 'release-notes',
        loadComponent: () => import('./release-notes/release-notes.component').then(c => c.ReleaseNotesComponent),
        data: { title: 'Release Notes' }
      },
      {
        path: 'system-status',
        loadComponent: () => import('./system-status/system-status.component').then(c => c.SystemStatusComponent),
        data: { title: 'System Status' }
      }
    ]
  }
];

export default HELP_ROUTES;