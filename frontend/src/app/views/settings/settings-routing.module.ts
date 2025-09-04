import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { GeneralSettingsComponent } from './general/general-settings.component';
import { SecuritySettingsComponent } from './security/security-settings.component';
import { NotificationSettingsComponent } from './notifications/notification-settings.component';
import { BillingSettingsComponent } from './billing/billing-settings.component';

const routes: Routes = [
  {
    path: '',
    component: SettingsComponent,
    data: {
      title: 'Settings',
      description: 'Manage your account settings'
    }
  },
  {
    path: 'general',
    component: GeneralSettingsComponent,
    data: {
      title: 'General Settings',
      description: 'General account settings'
    }
  },
  {
    path: 'security',
    component: SecuritySettingsComponent,
    data: {
      title: 'Security Settings',
      description: 'Security and privacy settings'
    }
  },
  {
    path: 'notifications',
    component: NotificationSettingsComponent,
    data: {
      title: 'Notification Settings',
      description: 'Manage your notifications'
    }
  },
  {
    path: 'billing',
    component: BillingSettingsComponent,
    data: {
      title: 'Billing Settings',
      description: 'Manage billing and subscription'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }