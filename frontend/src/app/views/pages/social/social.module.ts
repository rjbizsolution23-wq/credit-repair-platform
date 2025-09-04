import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Routes
import { socialRoutes } from './social.routes';

// Components
import { SocialOverviewComponent } from './social-overview/social-overview.component';

// Services
import { SocialService } from './social.service';

// Shared Modules (if available)
// import { SharedModule } from '../../../shared/shared.module';
// import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  declarations: [
    SocialOverviewComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(socialRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
    // SharedModule,
    // ComponentsModule
  ],
  providers: [
    SocialService
  ],
  exports: [
    SocialOverviewComponent
  ]
})
export class SocialModule { }