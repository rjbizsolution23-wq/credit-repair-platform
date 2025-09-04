import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisputeListComponent } from './dispute-list/dispute-list.component';
import { DisputeDetailComponent } from './dispute-detail/dispute-detail.component';
import { DisputeFormComponent } from './dispute-form/dispute-form.component';
import { DisputeGeneratorComponent } from './dispute-generator/dispute-generator.component';
import { DisputeTrackingComponent } from './dispute-tracking/dispute-tracking.component';

const routes: Routes = [
  {
    path: '',
    component: DisputeListComponent,
    data: {
      title: 'Disputes',
      description: 'Manage credit disputes'
    }
  },
  {
    path: 'generator',
    component: DisputeGeneratorComponent,
    data: {
      title: 'Dispute Generator',
      description: 'Generate new disputes automatically'
    }
  },
  {
    path: 'tracking',
    component: DisputeTrackingComponent,
    data: {
      title: 'Dispute Tracking',
      description: 'Track dispute progress'
    }
  },
  {
    path: 'new',
    component: DisputeFormComponent,
    data: {
      title: 'New Dispute',
      description: 'Create a new dispute',
      mode: 'create'
    }
  },
  {
    path: ':id',
    component: DisputeDetailComponent,
    data: {
      title: 'Dispute Details',
      description: 'View dispute information'
    }
  },
  {
    path: ':id/edit',
    component: DisputeFormComponent,
    data: {
      title: 'Edit Dispute',
      description: 'Edit dispute information',
      mode: 'edit'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DisputesRoutingModule { }