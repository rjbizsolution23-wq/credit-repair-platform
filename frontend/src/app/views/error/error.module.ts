import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ErrorRoutingModule } from './error-routing.module';
import { NotFoundComponent } from './not-found/not-found.component';
import { ServerErrorComponent } from './server-error/server-error.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

@NgModule({
  declarations: [
    NotFoundComponent,
    ServerErrorComponent,
    UnauthorizedComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ErrorRoutingModule
  ]
})
export class ErrorModule { }