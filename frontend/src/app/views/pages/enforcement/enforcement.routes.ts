import { Routes } from '@angular/router';

export const EnforcementRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    loadComponent: () => import('./enforcement-overview/enforcement-overview.component').then(m => m.EnforcementOverviewComponent),
    data: {
      title: 'Enforcement Overview',
      breadcrumb: 'Overview'
    }
  },
  {
    path: 'violations',
    loadComponent: () => import('./violations/violations.component').then(m => m.ViolationsComponent),
    data: {
      title: 'Violations',
      breadcrumb: 'Violations'
    }
  },
  // {
  //   path: 'violations/create',
  //   loadComponent: () => import('./create-violation/create-violation.component').then(m => m.CreateViolationComponent),
  //   data: {
  //     title: 'Report Violation',
  //     breadcrumb: 'Report Violation'
  //   }
  // },
  // {
  //   path: 'violations/:id',
  //   loadComponent: () => import('./view-violation/view-violation.component').then(m => m.ViewViolationComponent),
  //   data: {
  //     title: 'Violation Details',
  //     breadcrumb: 'Violation Details'
  //   }
  // },
  // {
  //   path: 'violations/:id/edit',
  //   loadComponent: () => import('./edit-violation/edit-violation.component').then(m => m.EditViolationComponent),
  //   data: {
  //     title: 'Edit Violation',
  //     breadcrumb: 'Edit Violation'
  //   }
  // },
  {
    path: 'actions',
    loadComponent: () => import('./enforcement-actions/enforcement-actions.component').then(m => m.EnforcementActionsComponent),
    data: {
      title: 'Enforcement Actions',
      breadcrumb: 'Actions'
    }
  },
  {
    path: 'actions/create',
    loadComponent: () => import('./create-action/create-action.component').then(m => m.CreateActionComponent),
    data: {
      title: 'Create Action',
      breadcrumb: 'Create Action'
    }
  },
  {
    path: 'actions/:id',
    loadComponent: () => import('./view-action/view-action.component').then(m => m.ViewActionComponent),
    data: {
      title: 'Action Details',
      breadcrumb: 'Action Details'
    }
  }
  // TODO: Uncomment these routes when components are created
  // {
  //   path: 'compliance',
  //   loadComponent: () => import('./compliance-tracking/compliance-tracking.component').then(m => m.ComplianceTrackingComponent),
  //   data: {
  //     title: 'Compliance Tracking',
  //     breadcrumb: 'Compliance'
  //   }
  // },
  // {
  //   path: 'compliance/audit',
  //   loadComponent: () => import('./compliance-audit/compliance-audit.component').then(m => m.ComplianceAuditComponent),
  //   data: {
  //     title: 'Compliance Audit',
  //     breadcrumb: 'Audit'
  //   }
  // },
  // {
  //   path: 'regulations',
  //   loadComponent: () => import('./regulations/regulations.component').then(m => m.RegulationsComponent),
  //   data: {
  //     title: 'Regulations',
  //     breadcrumb: 'Regulations'
  //   }
  // },
  // {
  //   path: 'regulations/:id',
  //   loadComponent: () => import('./view-regulation/view-regulation.component').then(m => m.ViewRegulationComponent),
  //   data: {
  //     title: 'Regulation Details',
  //     breadcrumb: 'Regulation Details'
  //   }
  // },
  // {
  //   path: 'reporting',
  //   loadComponent: () => import('./enforcement-reporting/enforcement-reporting.component').then(m => m.EnforcementReportingComponent),
  //   data: {
  //     title: 'Enforcement Reporting',
  //     breadcrumb: 'Reporting'
  //   }
  // },
  // {
  //   path: 'alerts',
  //   loadComponent: () => import('./enforcement-alerts/enforcement-alerts.component').then(m => m.EnforcementAlertsComponent),
  //   data: {
  //     title: 'Enforcement Alerts',
  //     breadcrumb: 'Alerts'
  //   }
  // },
  // {
  //   path: 'analytics',
  //   loadComponent: () => import('./enforcement-analytics/enforcement-analytics.component').then(m => m.EnforcementAnalyticsComponent),
  //   data: {
  //     title: 'Enforcement Analytics',
  //     breadcrumb: 'Analytics'
  //   }
  // }
];