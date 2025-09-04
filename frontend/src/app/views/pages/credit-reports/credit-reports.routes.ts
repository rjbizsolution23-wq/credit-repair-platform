import { Routes } from '@angular/router';

export default [
  {
    path: '',
    redirectTo: 'all-reports',
    pathMatch: 'full'
  },
  {
    path: 'all-reports',
    loadComponent: () => import('./all-reports/all-reports.component').then(c => c.AllReportsComponent),
    title: 'All Credit Reports'
  },
  {
    path: 'upload',
    loadComponent: () => import('./upload-report/upload-report.component').then(c => c.UploadReportComponent),
    title: 'Upload Credit Report'
  },
  {
    path: 'analysis/:id',
    loadComponent: () => import('./report-analysis/report-analysis.component').then(c => c.ReportAnalysisComponent),
    title: 'Credit Report Analysis'
  },
  {
    path: 'comparison/:clientId',
    loadComponent: () => import('./report-comparison/report-comparison.component').then(c => c.ReportComparisonComponent),
    title: 'Credit Report Comparison'
  },
  {
    path: 'monitoring',
    loadComponent: () => import('./credit-monitoring/credit-monitoring.component').then(c => c.CreditMonitoringComponent),
    title: 'Credit Monitoring'
  },
  {
    path: 'scores',
    loadComponent: () => import('./credit-scores/credit-scores.component').then(c => c.CreditScoresComponent),
    title: 'Credit Scores'
  },
  {
    path: 'alerts',
    loadComponent: () => import('./credit-alerts/credit-alerts.component').then(c => c.CreditAlertsComponent),
    title: 'Credit Alerts'
  }
] as Routes;