import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientListComponent } from './client-list/client-list.component';
import { ClientDetailComponent } from './client-detail/client-detail.component';
import { ClientFormComponent } from './client-form/client-form.component';

const routes: Routes = [
  {
    path: '',
    component: ClientListComponent,
    data: {
      title: 'Clients',
      description: 'Manage your clients'
    }
  },
  {
    path: 'new',
    component: ClientFormComponent,
    data: {
      title: 'New Client',
      description: 'Add a new client',
      mode: 'create'
    }
  },
  {
    path: ':id',
    component: ClientDetailComponent,
    data: {
      title: 'Client Details',
      description: 'View client information'
    }
  },
  {
    path: ':id/edit',
    component: ClientFormComponent,
    data: {
      title: 'Edit Client',
      description: 'Edit client information',
      mode: 'edit'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientsRoutingModule { }