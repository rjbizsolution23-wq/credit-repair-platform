import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

// Routes
import { creditBuildingRoutes } from './credit-building.routes';

// Components

// Services
import { CreditBuildingService } from './credit-building.service';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(creditBuildingRoutes),
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule
  ],
  providers: [
    CreditBuildingService
  ]
})
export class CreditBuildingModule { }