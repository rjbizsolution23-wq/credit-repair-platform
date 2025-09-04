import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { MessagesOverviewComponent } from './messages-overview.component';

// Services
import { MessagesService } from './messages.service';

// Routes
import { messagesRoutes } from './messages.routes';

@NgModule({
  declarations: [
    MessagesOverviewComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(messagesRoutes),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    MessagesService
  ],
  exports: [
    MessagesOverviewComponent
  ]
})
export class MessagesModule { }