import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';

// Routes
import { disputesRoutes } from './disputes.routes';

// Components
import { DisputesOverviewComponent } from './disputes-overview/disputes-overview.component';
import { DisputeGeneratorComponent } from './dispute-generator/dispute-generator.component';

// Services
import { DisputesService } from './disputes.service';

// Shared Modules
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [
    DisputesOverviewComponent,
    DisputeGeneratorComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(disputesRoutes),
    SharedModule,
    NgChartsModule
  ],
  providers: [
    DisputesService
  ]
})
export class DisputesModule { }