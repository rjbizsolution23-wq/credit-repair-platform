import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Routes
import { complianceRoutes } from './compliance.routes';

// Components
import { ComplianceOverviewComponent } from './compliance-overview.component';

// Services
import { ComplianceService } from './compliance.service';

@NgModule({
  declarations: [
    ComplianceOverviewComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(complianceRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    ComplianceService
  ]
})
export class ComplianceModule { }