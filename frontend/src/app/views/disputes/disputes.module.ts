import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DisputesRoutingModule } from './disputes-routing.module';
import { DisputeListComponent } from './dispute-list/dispute-list.component';
import { DisputeDetailComponent } from './dispute-detail/dispute-detail.component';
import { DisputeFormComponent } from './dispute-form/dispute-form.component';
import { DisputeGeneratorComponent } from './dispute-generator/dispute-generator.component';
import { DisputeTrackingComponent } from './dispute-tracking/dispute-tracking.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    DisputeListComponent,
    DisputeDetailComponent,
    DisputeFormComponent,
    DisputeGeneratorComponent,
    DisputeTrackingComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DisputesRoutingModule
  ]
})
export class DisputesModule { }