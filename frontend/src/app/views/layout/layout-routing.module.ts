import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule),
        data: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard',
          preload: true,
          priority: 'high'
        }
      },
      {
        path: 'clients',
        loadChildren: () => import('../clients/clients.module').then(m => m.ClientsModule),
        data: {
          title: 'Clients',
          breadcrumb: 'Clients',
          roles: ['admin', 'manager'],
          preload: true,
          priority: 'high'
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'credit-reports',
        loadChildren: () => import('../credit-reports/credit-reports.module').then(m => m.CreditReportsModule),
        data: {
          title: 'Credit Reports',
          breadcrumb: 'Credit Reports',
          preload: true,
          priority: 'medium'
        }
      },
      {
        path: 'disputes',
        loadChildren: () => import('../disputes/disputes.module').then(m => m.DisputesModule),
        data: {
          title: 'Disputes',
          breadcrumb: 'Disputes',
          preload: true,
          priority: 'high'
        }
      },
      {
        path: 'letters',
        loadChildren: () => import('../letters/letters.module').then(m => m.LettersModule),
        data: {
          title: 'Letters',
          breadcrumb: 'Letters',
          preload: true,
          priority: 'medium'
        }
      },
      {
        path: 'tasks',
        loadChildren: () => import('../tasks/tasks.module').then(m => m.TasksModule),
        data: {
          title: 'Tasks',
          breadcrumb: 'Tasks',
          preload: true,
          priority: 'medium'
        }
      },
      {
        path: 'calendar',
        loadChildren: () => import('../calendar/calendar.module').then(m => m.CalendarModule),
        data: {
          title: 'Calendar',
          breadcrumb: 'Calendar'
        }
      },
      {
        path: 'documents',
        loadChildren: () => import('../documents/documents.module').then(m => m.DocumentsModule),
        data: {
          title: 'Documents',
          breadcrumb: 'Documents'
        }
      },
      {
        path: 'analytics',
        loadChildren: () => import('../analytics/analytics.module').then(m => m.AnalyticsModule),
        data: {
          title: 'Analytics',
          breadcrumb: 'Analytics',
          roles: ['admin', 'manager']
        },
        canActivate: [RoleGuard]
      },
      {
        path: 'settings',
        loadChildren: () => import('../settings/settings.module').then(m => m.SettingsModule),
        data: {
          title: 'Settings',
          breadcrumb: 'Settings'
        }
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/profile.module').then(m => m.ProfileModule),
        data: {
          title: 'Profile',
          breadcrumb: 'Profile'
        }
      },
      {
        path: 'help',
        loadChildren: () => import('../help/help.module').then(m => m.HelpModule),
        data: {
          title: 'Help',
          breadcrumb: 'Help'
        }
      },
      // Redirect empty path to dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }