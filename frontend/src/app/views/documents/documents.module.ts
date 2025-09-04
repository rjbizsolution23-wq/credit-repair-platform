import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DocumentsRoutingModule } from './documents-routing.module';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentDetailComponent } from './document-detail/document-detail.component';
import { DocumentUploadComponent } from './document-upload/document-upload.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    DocumentListComponent,
    DocumentDetailComponent,
    DocumentUploadComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DocumentsRoutingModule
  ]
})
export class DocumentsModule { }