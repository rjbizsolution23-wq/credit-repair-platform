import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      // TODO: Implement analytics components
      // {
      //   path: 'reports',
      //   loadComponent: () => import('./reports/reports.component').then(c => c.ReportsComponent),
      //   data: { title: 'Analytics Reports' }
      // },
      // {
      //   path: 'performance',
      //   loadComponent: () => import('./performance/performance.component').then(c => c.PerformanceComponent),
      //   data: { title: 'Performance Analytics' }
      // },
      // {
      //   path: 'trends',
      //   loadComponent: () => import('./trends/trends.component').then(c => c.TrendsComponent),
      //   data: { title: 'Trend Analysis' }
      // }
    ]
  }
];

export default ANALYTICS_ROUTES;