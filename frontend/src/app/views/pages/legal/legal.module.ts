import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

// Routes
import { legalRoutes } from './legal.routes';

// Components
import { LegalOverviewComponent } from './legal-overview/legal-overview.component';
import { DocumentsComponent } from './documents/documents.component';
import { CasesComponent } from './cases/cases.component';
import { ComplianceComponent } from './compliance/compliance.component';

// Services
import { LegalService } from './legal.service';

@NgModule({
  declarations: [
    LegalOverviewComponent,
    DocumentsComponent,
    CasesComponent,
    ComplianceComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(legalRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule
  ],
  providers: [
    LegalService
  ]
})
export class LegalModule { }