import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-analytics-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    FeatherIconDirective,
    NgApexchartsModule
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">Social Analytics Overview</h4>
            <p class="text-muted mb-4">Comprehensive social media performance insights</p>
            
            <!-- Key Metrics Cards -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card border-0 bg-primary text-white">
                  <div class="card-body text-center">
                    <i data-feather="heart" appFeatherIcon class="mb-2" style="width: 24px; height: 24px;"></i>
                    <h3>{{ metrics.totalEngagement | number }}</h3>
                    <p class="mb-0">Total Engagement</p>
                    <small class="text-light">+12% from last month</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 bg-success text-white">
                  <div class="card-body text-center">
                    <i data-feather="eye" appFeatherIcon class="mb-2" style="width: 24px; height: 24px;"></i>
                    <h3>{{ metrics.totalReach | number }}</h3>
                    <p class="mb-0">Total Reach</p>
                    <small class="text-light">+8% from last month</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 bg-info text-white">
                  <div class="card-body text-center">
                    <i data-feather="users" appFeatherIcon class="mb-2" style="width: 24px; height: 24px;"></i>
                    <h3>{{ metrics.newFollowers | number }}</h3>
                    <p class="mb-0">New Followers</p>
                    <small class="text-light">+25% from last month</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 bg-warning text-white">
                  <div class="card-body text-center">
                    <i data-feather="trending-up" appFeatherIcon class="mb-2" style="width: 24px; height: 24px;"></i>
                    <h3>{{ metrics.engagementRate }}%</h3>
                    <p class="mb-0">Engagement Rate</p>
                    <small class="text-light">+3% from last month</small>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Charts Row -->
            <div class="row">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Engagement Trends</h6>
                    <apx-chart
                      [series]="engagementChart.series"
                      [chart]="engagementChart.chart"
                      [xaxis]="engagementChart.xaxis"
                      [colors]="engagementChart.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Platform Distribution</h6>
                    <apx-chart
                      [series]="platformChart.series"
                      [chart]="platformChart.chart"
                      [labels]="platformChart.labels"
                      [colors]="platformChart.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="row mt-4">
              <div class="col-md-12">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Quick Actions</h6>
                    <div class="row">
                      <div class="col-md-3">
                        <a routerLink="./engagement" class="btn btn-outline-primary w-100 mb-2">
                          <i data-feather="heart" appFeatherIcon class="me-2"></i>
                          Engagement Analytics
                        </a>
                      </div>
                      <div class="col-md-3">
                        <a routerLink="./reach" class="btn btn-outline-success w-100 mb-2">
                          <i data-feather="eye" appFeatherIcon class="me-2"></i>
                          Reach Analytics
                        </a>
                      </div>
                      <div class="col-md-3">
                        <a routerLink="./audience" class="btn btn-outline-info w-100 mb-2">
                          <i data-feather="users" appFeatherIcon class="me-2"></i>
                          Audience Analytics
                        </a>
                      </div>
                      <div class="col-md-3">
                        <a routerLink="./reports" class="btn btn-outline-warning w-100 mb-2">
                          <i data-feather="file-text" appFeatherIcon class="me-2"></i>
                          View Reports
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AnalyticsOverviewComponent implements OnInit {
  metrics = {
    totalEngagement: 45230,
    totalReach: 189650,
    newFollowers: 1250,
    engagementRate: 4.2
  };
  
  engagementChart: any = {
    series: [{
      name: 'Engagement',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 140, 160, 180]
    }],
    chart: {
      height: 350,
      type: 'line',
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    colors: ['#3F51B5']
  };
  
  platformChart: any = {
    series: [44, 35, 21],
    chart: {
      type: 'donut',
      height: 300
    },
    labels: ['Facebook', 'Twitter', 'LinkedIn'],
    colors: ['#1877F2', '#1DA1F2', '#0A66C2']
  };

  ngOnInit(): void {
    // Load analytics data
  }
}