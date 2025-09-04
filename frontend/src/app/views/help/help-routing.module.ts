import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpComponent } from './help.component';
import { FaqComponent } from './faq/faq.component';
import { ContactSupportComponent } from './contact-support/contact-support.component';
import { DocumentationComponent } from './documentation/documentation.component';

const routes: Routes = [
  {
    path: '',
    component: HelpComponent,
    data: {
      title: 'Help Center',
      description: 'Get help and support'
    }
  },
  {
    path: 'faq',
    component: FaqComponent,
    data: {
      title: 'FAQ',
      description: 'Frequently asked questions'
    }
  },
  {
    path: 'contact',
    component: ContactSupportComponent,
    data: {
      title: 'Contact Support',
      description: 'Contact our support team'
    }
  },
  {
    path: 'documentation',
    component: DocumentationComponent,
    data: {
      title: 'Documentation',
      description: 'User documentation and guides'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HelpRoutingModule { }