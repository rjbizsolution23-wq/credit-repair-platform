import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LetterListComponent } from './letter-list/letter-list.component';
import { LetterDetailComponent } from './letter-detail/letter-detail.component';
import { LetterFormComponent } from './letter-form/letter-form.component';
import { LetterTemplatesComponent } from './letter-templates/letter-templates.component';

const routes: Routes = [
  {
    path: '',
    component: LetterListComponent,
    data: {
      title: 'Letters',
      description: 'Manage dispute letters'
    }
  },
  {
    path: 'templates',
    component: LetterTemplatesComponent,
    data: {
      title: 'Letter Templates',
      description: 'Manage letter templates'
    }
  },
  {
    path: 'new',
    component: LetterFormComponent,
    data: {
      title: 'New Letter',
      description: 'Create a new letter',
      mode: 'create'
    }
  },
  {
    path: ':id',
    component: LetterDetailComponent,
    data: {
      title: 'Letter Details',
      description: 'View letter details'
    }
  },
  {
    path: ':id/edit',
    component: LetterFormComponent,
    data: {
      title: 'Edit Letter',
      description: 'Edit letter',
      mode: 'edit'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LettersRoutingModule { }