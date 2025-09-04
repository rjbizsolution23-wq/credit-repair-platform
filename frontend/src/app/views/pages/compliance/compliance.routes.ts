import { Routes } from '@angular/router';

export const complianceRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./compliance-overview.component').then(m => m.ComplianceOverviewComponent),
    data: {
      title: 'Compliance Overview',
      breadcrumb: 'Overview'
    }
  },
  {
    path: 'audits',
    children: [
      // TODO: Implement audits-list component
      // {
      //   path: '',
      //   loadComponent: () => import('./audits/audits-list.component').then(m => m.AuditsListComponent),
      //   data: {
      //     title: 'Compliance Audits',
      //     breadcrumb: 'Audits'
      //   }
      // },
      // TODO: Implement audit-create component
      // {
      //   path: 'create',
      //   loadComponent: () => import('./audits/audit-create.component').then(m => m.AuditCreateComponent),
      //   data: {
      //     title: 'Create Audit',
      //     breadcrumb: 'Create'
      //   }
      // },
      // TODO: Implement audit-detail component
      // {
      //   path: ':id',
      //   loadComponent: () => import('./audits/audit-detail.component').then(m => m.AuditDetailComponent),
      //   data: {
      //     title: 'Audit Details',
      //     breadcrumb: 'Details'
      //   }
      // },
      // TODO: Implement audit-edit component
      // {
      //   path: ':id/edit',
      //   loadComponent: () => import('./audits/audit-edit.component').then(m => m.AuditEditComponent),
      //   data: {
      //     title: 'Edit Audit',
      //     breadcrumb: 'Edit'
      //   }
      // }
    ]
  },
  {
    path: 'policies',
    children: [
      // TODO: Implement policies-list component
      // {
      //   path: '',
      //   loadComponent: () => import('./policies/policies-list.component').then(m => m.PoliciesListComponent),
      //   data: {
      //     title: 'Compliance Policies',
      //     breadcrumb: 'Policies'
      //   }
      // },
      // TODO: Implement policies components
      // {
      //   path: 'create',
      //   loadComponent: () => import('./policies/policy-create.component').then(m => m.PolicyCreateComponent),
      //   data: {
      //     title: 'Create Policy',
      //     breadcrumb: 'Create'
      //   }
      // },
      // {
      //   path: ':id',
      //   loadComponent: () => import('./policies/policy-detail.component').then(m => m.PolicyDetailComponent),
      //   data: {
      //     title: 'Policy Details',
      //     breadcrumb: 'Details'
      //   }
      // },
      // {
      //   path: ':id/edit',
      //   loadComponent: () => import('./policies/policy-edit.component').then(m => m.PolicyEditComponent),
      //   data: {
      //     title: 'Edit Policy',
      //     breadcrumb: 'Edit'
      //   }
      // }
    ]
  },
  {
    path: 'violations',
    children: [
      // TODO: Implement violations list component
      // {
      //   path: '',
      //   loadComponent: () => import('./violations/violations-list.component').then(m => m.ViolationsListComponent),
      //   data: {
      //     title: 'Compliance Violations',
      //     breadcrumb: 'Violations'
      //   }
      // },
      // TODO: Implement violations components
      // {
      //   path: 'create',
      //   loadComponent: () => import('./violations/violation-create.component').then(m => m.ViolationCreateComponent),
      //   data: {
      //     title: 'Report Violation',
      //     breadcrumb: 'Create'
      //   }
      // },
      // {
      //   path: ':id',
      //   loadComponent: () => import('./violations/violation-detail.component').then(m => m.ViolationDetailComponent),
      //   data: {
      //     title: 'Violation Details',
      //     breadcrumb: 'Details'
      //   }
      // },
      // {
      //   path: ':id/edit',
      //   loadComponent: () => import('./violations/violation-edit.component').then(m => m.ViolationEditComponent),
      //   data: {
      //     title: 'Edit Violation',
      //     breadcrumb: 'Edit'
      //   }
      // }
    ]
  },
  {
    path: 'training',
    children: [
      // TODO: Implement all training components
      // {
      //   path: '',
      //   loadComponent: () => import('./training/training-list.component').then(m => m.TrainingListComponent),
      //   data: {
      //     title: 'Compliance Training',
      //     breadcrumb: 'Training'
      //   }
      // },
      // {
      //   path: 'create',
      //   loadComponent: () => import('./training/training-create.component').then(m => m.TrainingCreateComponent),
      //   data: {
      //     title: 'Create Training',
      //     breadcrumb: 'Create'
      //   }
      // },
      // {
      //   path: ':id',
      //   loadComponent: () => import('./training/training-detail.component').then(m => m.TrainingDetailComponent),
      //   data: {
      //     title: 'Training Details',
      //     breadcrumb: 'Details'
      //   }
      // },
      // TODO: Implement training components
      // {
      //   path: ':id/edit',
      //   loadComponent: () => import('./training/training-edit.component').then(m => m.TrainingEditComponent),
      //   data: {
      //     title: 'Edit Training',
      //     breadcrumb: 'Edit'
      //   }
      // },
      // {
      //   path: ':id/take',
      //   loadComponent: () => import('./training/training-take.component').then(m => m.TrainingTakeComponent),
      //   data: {
      //     title: 'Take Training',
      //     breadcrumb: 'Take'
      //   }
      // }
    ]
  },
  {
    path: 'reports',
    children: [
      // TODO: Implement report components
      // {
      //   path: '',
      //   loadComponent: () => import('./reports/reports-list.component').then(m => m.ReportsListComponent),
      //   data: {
      //     title: 'Compliance Reports',
      //     breadcrumb: 'Reports'
      //   }
      // },
      // {
      //   path: 'generate',
      //   loadComponent: () => import('./reports/report-generate.component').then(m => m.ReportGenerateComponent),
      //   data: {
      //     title: 'Generate Report',
      //     breadcrumb: 'Generate'
      //   }
      // },
      // TODO: Implement report view component
      // {
      //   path: ':id',
      //   loadComponent: () => import('./reports/report-view.component').then(m => m.ReportViewComponent),
      //   data: {
      //     title: 'View Report',
      //     breadcrumb: 'View'
      //   }
      // }
    ]
  },
  {
    path: 'monitoring',
    children: [
      // TODO: Implement monitoring dashboard component
      // {
      //   path: '',
      //   loadComponent: () => import('./monitoring/monitoring-dashboard.component').then(m => m.MonitoringDashboardComponent),
      //   data: {
      //     title: 'Compliance Monitoring',
      //     breadcrumb: 'Monitoring'
      //   }
      // },
      // TODO: Implement monitoring components
      // {
      //   path: 'alerts',
      //   loadComponent: () => import('./monitoring/alerts-list.component').then(m => m.AlertsListComponent),
      //   data: {
      //     title: 'Compliance Alerts',
      //     breadcrumb: 'Alerts'
      //   }
      // },
      // {
      //   path: 'metrics',
      //   loadComponent: () => import('./monitoring/metrics-dashboard.component').then(m => m.MetricsDashboardComponent),
      //   data: {
      //     title: 'Compliance Metrics',
      //     breadcrumb: 'Metrics'
      //   }
      // }
    ]
  }
];