import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HelpRoutingModule } from './help-routing.module';
import { HelpComponent } from './help.component';
import { FaqComponent } from './faq/faq.component';
import { ContactSupportComponent } from './contact-support/contact-support.component';
import { DocumentationComponent } from './documentation/documentation.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    HelpComponent,
    FaqComponent,
    ContactSupportComponent,
    DocumentationComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    HelpRoutingModule
  ]
})
export class HelpModule { }