import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreditReportListComponent } from './credit-report-list/credit-report-list.component';
import { CreditReportDetailComponent } from './credit-report-detail/credit-report-detail.component';
import { CreditReportUploadComponent } from './credit-report-upload/credit-report-upload.component';
import { CreditReportAnalysisComponent } from './credit-report-analysis/credit-report-analysis.component';

const routes: Routes = [
  {
    path: '',
    component: CreditReportListComponent,
    data: {
      title: 'Credit Reports',
      description: 'Manage credit reports'
    }
  },
  {
    path: 'upload',
    component: CreditReportUploadComponent,
    data: {
      title: 'Upload Credit Report',
      description: 'Upload a new credit report'
    }
  },
  {
    path: 'analysis',
    component: CreditReportAnalysisComponent,
    data: {
      title: 'Credit Report Analysis',
      description: 'Analyze credit reports'
    }
  },
  {
    path: ':id',
    component: CreditReportDetailComponent,
    data: {
      title: 'Credit Report Details',
      description: 'View credit report details'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreditReportsRoutingModule { }