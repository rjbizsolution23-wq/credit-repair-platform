import { Routes } from '@angular/router';

// Components
import { LegalOverviewComponent } from './legal-overview/legal-overview.component';
import { DocumentsComponent } from './documents/documents.component';
import { CasesComponent } from './cases/cases.component';
import { ComplianceComponent } from './compliance/compliance.component';

export const legalRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    component: LegalOverviewComponent,
    data: {
      title: 'Legal Overview',
      breadcrumb: 'Overview'
    }
  },
  {
    path: 'documents',
    component: DocumentsComponent,
    data: {
      title: 'Legal Documents',
      breadcrumb: 'Documents'
    }
  },
  {
    path: 'documents/create',
    component: DocumentsComponent,
    data: {
      title: 'Create Document',
      breadcrumb: 'Create Document',
      mode: 'create'
    }
  },
  {
    path: 'documents/:id',
    component: DocumentsComponent,
    data: {
      title: 'View Document',
      breadcrumb: 'View Document',
      mode: 'view'
    }
  },
  {
    path: 'documents/:id/edit',
    component: DocumentsComponent,
    data: {
      title: 'Edit Document',
      breadcrumb: 'Edit Document',
      mode: 'edit'
    }
  },
  {
    path: 'cases',
    component: CasesComponent,
    data: {
      title: 'Legal Cases',
      breadcrumb: 'Cases'
    }
  },
  {
    path: 'cases/create',
    component: CasesComponent,
    data: {
      title: 'Create Case',
      breadcrumb: 'Create Case',
      mode: 'create'
    }
  },
  {
    path: 'cases/:id',
    component: CasesComponent,
    data: {
      title: 'View Case',
      breadcrumb: 'View Case',
      mode: 'view'
    }
  },
  {
    path: 'cases/:id/edit',
    component: CasesComponent,
    data: {
      title: 'Edit Case',
      breadcrumb: 'Edit Case',
      mode: 'edit'
    }
  },
  {
    path: 'compliance',
    component: ComplianceComponent,
    data: {
      title: 'Legal Compliance',
      breadcrumb: 'Compliance'
    }
  },
  {
    path: 'compliance/audit',
    component: ComplianceComponent,
    data: {
      title: 'Compliance Audit',
      breadcrumb: 'Audit',
      mode: 'audit'
    }
  },
  {
    path: 'compliance/reports',
    component: ComplianceComponent,
    data: {
      title: 'Compliance Reports',
      breadcrumb: 'Reports',
      mode: 'reports'
    }
  }
];