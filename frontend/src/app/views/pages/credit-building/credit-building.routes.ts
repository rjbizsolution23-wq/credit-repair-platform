import { Routes } from '@angular/router';
import { CreditBuildingOverviewComponent } from './credit-building-overview/credit-building-overview.component';
import { StrategiesComponent } from './strategies/strategies.component';
import { RecommendationsComponent } from './recommendations/recommendations.component';
import { ProgressTrackingComponent } from './progress-tracking/progress-tracking.component';
import { CreditEducationComponent } from './credit-education/credit-education.component';
import { GoalsComponent } from './goals/goals.component';
import { ToolsComponent } from './tools/tools.component';
import { ReportsComponent } from './reports/reports.component';

export const creditBuildingRoutes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    component: CreditBuildingOverviewComponent,
    data: {
      title: 'Credit Building Overview',
      breadcrumb: 'Overview'
    }
  },
  {
    path: 'strategies',
    component: StrategiesComponent,
    data: {
      title: 'Credit Building Strategies',
      breadcrumb: 'Strategies'
    }
  },
  {
    path: 'strategies/create',
    component: StrategiesComponent,
    data: {
      title: 'Create Strategy',
      breadcrumb: 'Create Strategy',
      mode: 'create'
    }
  },
  {
    path: 'strategies/:id',
    component: StrategiesComponent,
    data: {
      title: 'View Strategy',
      breadcrumb: 'View Strategy',
      mode: 'view'
    }
  },
  {
    path: 'strategies/:id/edit',
    component: StrategiesComponent,
    data: {
      title: 'Edit Strategy',
      breadcrumb: 'Edit Strategy',
      mode: 'edit'
    }
  },
  {
    path: 'recommendations',
    component: RecommendationsComponent,
    data: {
      title: 'Credit Recommendations',
      breadcrumb: 'Recommendations'
    }
  },
  {
    path: 'recommendations/:id',
    component: RecommendationsComponent,
    data: {
      title: 'View Recommendation',
      breadcrumb: 'View Recommendation',
      mode: 'view'
    }
  },
  {
    path: 'progress',
    component: ProgressTrackingComponent,
    data: {
      title: 'Progress Tracking',
      breadcrumb: 'Progress'
    }
  },
  {
    path: 'progress/:clientId',
    component: ProgressTrackingComponent,
    data: {
      title: 'Client Progress',
      breadcrumb: 'Client Progress',
      mode: 'client'
    }
  },
  {
    path: 'education',
    component: CreditEducationComponent,
    data: {
      title: 'Credit Education',
      breadcrumb: 'Education'
    }
  },
  {
    path: 'education/:topicId',
    component: CreditEducationComponent,
    data: {
      title: 'Education Topic',
      breadcrumb: 'Topic',
      mode: 'topic'
    }
  },
  {
    path: 'goals',
    component: GoalsComponent,
    data: {
      title: 'Credit Goals',
      breadcrumb: 'Goals'
    }
  },
  {
    path: 'goals/create',
    component: GoalsComponent,
    data: {
      title: 'Create Goal',
      breadcrumb: 'Create Goal',
      mode: 'create'
    }
  },
  {
    path: 'goals/:id',
    component: GoalsComponent,
    data: {
      title: 'View Goal',
      breadcrumb: 'View Goal',
      mode: 'view'
    }
  },
  {
    path: 'goals/:id/edit',
    component: GoalsComponent,
    data: {
      title: 'Edit Goal',
      breadcrumb: 'Edit Goal',
      mode: 'edit'
    }
  },
  {
    path: 'tools',
    component: ToolsComponent,
    data: {
      title: 'Credit Building Tools',
      breadcrumb: 'Tools'
    }
  },
  {
    path: 'tools/:toolId',
    component: ToolsComponent,
    data: {
      title: 'Credit Tool',
      breadcrumb: 'Tool',
      mode: 'tool'
    }
  },
  {
    path: 'reports',
    component: ReportsComponent,
    data: {
      title: 'Credit Building Reports',
      breadcrumb: 'Reports'
    }
  },
  {
    path: 'reports/:reportId',
    component: ReportsComponent,
    data: {
      title: 'View Report',
      breadcrumb: 'View Report',
      mode: 'view'
    }
  }
];