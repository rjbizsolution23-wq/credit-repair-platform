import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

// Routes
import { bureausRoutes } from './bureaus.routes';

// Services
import { BureausService } from './bureaus.service';

// Components
import { BureausOverviewComponent } from './bureaus-overview/bureaus-overview.component';
import { DisputesComponent } from './disputes/disputes.component';

@NgModule({
  declarations: [
    BureausOverviewComponent,
    DisputesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    RouterModule.forChild(bureausRoutes)
  ],
  providers: [
    BureausService
  ]
})
export class BureausModule { }