import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnalyticsComponent } from './analytics.component';
import { ReportsComponent } from './reports/reports.component';
import { MetricsComponent } from './metrics/metrics.component';

const routes: Routes = [
  {
    path: '',
    component: AnalyticsComponent,
    data: {
      title: 'Analytics',
      description: 'View analytics and reports'
    }
  },
  {
    path: 'reports',
    component: ReportsComponent,
    data: {
      title: 'Reports',
      description: 'Generate and view reports'
    }
  },
  {
    path: 'metrics',
    component: MetricsComponent,
    data: {
      title: 'Metrics',
      description: 'View key performance metrics'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnalyticsRoutingModule { }