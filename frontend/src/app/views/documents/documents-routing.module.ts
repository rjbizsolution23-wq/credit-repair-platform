import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentDetailComponent } from './document-detail/document-detail.component';
import { DocumentUploadComponent } from './document-upload/document-upload.component';

const routes: Routes = [
  {
    path: '',
    component: DocumentListComponent,
    data: {
      title: 'Documents',
      description: 'Manage your documents'
    }
  },
  {
    path: 'upload',
    component: DocumentUploadComponent,
    data: {
      title: 'Upload Document',
      description: 'Upload a new document'
    }
  },
  {
    path: ':id',
    component: DocumentDetailComponent,
    data: {
      title: 'Document Details',
      description: 'View document details'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentsRoutingModule { }