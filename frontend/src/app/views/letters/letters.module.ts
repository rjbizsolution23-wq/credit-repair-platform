import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LettersRoutingModule } from './letters-routing.module';
import { LetterListComponent } from './letter-list/letter-list.component';
import { LetterDetailComponent } from './letter-detail/letter-detail.component';
import { LetterFormComponent } from './letter-form/letter-form.component';
import { LetterTemplatesComponent } from './letter-templates/letter-templates.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    LetterListComponent,
    LetterDetailComponent,
    LetterFormComponent,
    LetterTemplatesComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    LettersRoutingModule
  ]
})
export class LettersModule { }