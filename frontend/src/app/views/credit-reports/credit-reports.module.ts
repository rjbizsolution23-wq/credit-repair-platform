import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CreditReportsRoutingModule } from './credit-reports-routing.module';
import { CreditReportListComponent } from './credit-report-list/credit-report-list.component';
import { CreditReportDetailComponent } from './credit-report-detail/credit-report-detail.component';
import { CreditReportUploadComponent } from './credit-report-upload/credit-report-upload.component';
import { CreditReportAnalysisComponent } from './credit-report-analysis/credit-report-analysis.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    CreditReportListComponent,
    CreditReportDetailComponent,
    CreditReportUploadComponent,
    CreditReportAnalysisComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    CreditReportsRoutingModule
  ]
})
export class CreditReportsModule { }