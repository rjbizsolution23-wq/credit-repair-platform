import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reach-analytics',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FeatherIconDirective,
    NgApexchartsModule,
    FormsModule
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="card-title">Reach & Impressions Analytics</h4>
              <div class="d-flex gap-2">
                <select class="form-select" [(ngModel)]="selectedPeriod" (ngModelChange)="updateData()">
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
                <button class="btn btn-outline-primary">
                  <i data-feather="download" appFeatherIcon></i>
                  Export
                </button>
              </div>
            </div>
            
            <!-- Reach Metrics -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-primary">{{ reachData.totalReach | number }}</h3>
                  <p class="text-muted mb-0">Total Reach</p>
                  <small class="text-success">+25%</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-info">{{ reachData.impressions | number }}</h3>
                  <p class="text-muted mb-0">Impressions</p>
                  <small class="text-success">+18%</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-warning">{{ reachData.uniqueViews | number }}</h3>
                  <p class="text-muted mb-0">Unique Views</p>
                  <small class="text-success">+12%</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-success">{{ reachData.frequency }}</h3>
                  <p class="text-muted mb-0">Avg Frequency</p>
                  <small class="text-danger">-2%</small>
                </div>
              </div>
            </div>
            
            <!-- Reach Trend Chart -->
            <div class="row">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Reach & Impressions Over Time</h6>
                    <apx-chart
                      [series]="reachTrendChart.series"
                      [chart]="reachTrendChart.chart"
                      [xaxis]="reachTrendChart.xaxis"
                      [colors]="reachTrendChart.colors"
                      [stroke]="reachTrendChart.stroke"
                      [yaxis]="reachTrendChart.yaxis">
                    </apx-chart>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Reach by Platform</h6>
                    <apx-chart
                      [series]="platformReachChart.series"
                      [chart]="platformReachChart.chart"
                      [labels]="platformReachChart.labels"
                      [colors]="platformReachChart.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Geographic Reach -->
            <div class="row mt-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Top Locations by Reach</h6>
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Location</th>
                            <th>Reach</th>
                            <th>Impressions</th>
                            <th>% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let location of topLocations">
                            <td>
                              <div class="d-flex align-items-center">
                                <span class="flag-icon flag-icon-{{ location.countryCode }} me-2"></span>
                                {{ location.name }}
                              </div>
                            </td>
                            <td>{{ location.reach | number }}</td>
                            <td>{{ location.impressions | number }}</td>
                            <td>
                              <div class="progress" style="height: 6px;">
                                <div class="progress-bar" [style.width.%]="location.percentage"></div>
                              </div>
                              <small>{{ location.percentage }}%</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Audience Demographics</h6>
                    
                    <!-- Age Groups -->
                    <div class="mb-4">
                      <h6 class="text-muted mb-3">Age Groups</h6>
                      <div *ngFor="let age of ageGroups" class="d-flex justify-content-between align-items-center mb-2">
                        <span>{{ age.range }}</span>
                        <div class="d-flex align-items-center">
                          <div class="progress me-2" style="width: 100px; height: 6px;">
                            <div class="progress-bar" [style.width.%]="age.percentage"></div>
                          </div>
                          <span class="text-muted">{{ age.percentage }}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Gender Distribution -->
                    <div>
                      <h6 class="text-muted mb-3">Gender Distribution</h6>
                      <apx-chart
                        [series]="genderChart.series"
                        [chart]="genderChart.chart"
                        [labels]="genderChart.labels"
                        [colors]="genderChart.colors">
                      </apx-chart>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Device & Platform Breakdown -->
            <div class="row mt-4">
              <div class="col-md-12">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Device & Platform Breakdown</h6>
                    <div class="row">
                      <div class="col-md-6">
                        <h6 class="text-muted mb-3">Device Types</h6>
                        <div *ngFor="let device of deviceTypes" class="d-flex justify-content-between align-items-center mb-3">
                          <div class="d-flex align-items-center">
                            <i [attr.data-feather]="device.icon" appFeatherIcon class="me-2"></i>
                            <span>{{ device.name }}</span>
                          </div>
                          <div class="d-flex align-items-center">
                            <div class="progress me-2" style="width: 120px; height: 8px;">
                              <div class="progress-bar" [style.width.%]="device.percentage"></div>
                            </div>
                            <span class="text-muted">{{ device.percentage }}%</span>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <h6 class="text-muted mb-3">Platform Performance</h6>
                        <div *ngFor="let platform of platformPerformance" class="d-flex justify-content-between align-items-center mb-3">
                          <div class="d-flex align-items-center">
                            <span class="badge me-2" [ngClass]="getPlatformBadgeClass(platform.name)">{{ platform.name }}</span>
                          </div>
                          <div class="text-end">
                            <div class="fw-bold">{{ platform.reach | number }}</div>
                            <small class="text-muted">{{ platform.growth }}% growth</small>
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
      </div>
    </div>
  `,
  styles: []
})
export class ReachAnalyticsComponent implements OnInit {
  selectedPeriod: string = '30days';
  
  reachData = {
    totalReach: 45680,
    impressions: 128450,
    uniqueViews: 38920,
    frequency: 2.8
  };
  
  reachTrendChart: any = {
    series: [
      {
        name: 'Reach',
        data: [1200, 1450, 1380, 1650, 1590, 1820, 2100, 2350, 2180, 2450, 2680, 2890]
      },
      {
        name: 'Impressions',
        data: [3200, 3850, 3680, 4250, 4090, 4620, 5100, 5650, 5280, 5850, 6280, 6890]
      }
    ],
    chart: {
      height: 350,
      type: 'area',
      toolbar: { show: false }
    },
    stroke: {
      width: 2,
      curve: 'smooth'
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    yaxis: [
      {
        title: { text: 'Reach' },
        labels: { formatter: (val: number) => val.toLocaleString() }
      },
      {
        opposite: true,
        title: { text: 'Impressions' },
        labels: { formatter: (val: number) => val.toLocaleString() }
      }
    ],
    colors: ['#3F51B5', '#FF9800']
  };
  
  platformReachChart: any = {
    series: [35, 28, 22, 15],
    chart: {
      type: 'donut',
      height: 300
    },
    labels: ['Facebook', 'LinkedIn', 'Twitter', 'Instagram'],
    colors: ['#3F51B5', '#4CAF50', '#FF9800', '#E91E63']
  };
  
  genderChart: any = {
    series: [52, 48],
    chart: {
      type: 'donut',
      height: 200
    },
    labels: ['Female', 'Male'],
    colors: ['#E91E63', '#2196F3']
  };
  
  topLocations = [
    { name: 'United States', countryCode: 'us', reach: 18500, impressions: 52000, percentage: 40.5 },
    { name: 'Canada', countryCode: 'ca', reach: 8200, impressions: 23000, percentage: 18.0 },
    { name: 'United Kingdom', countryCode: 'gb', reach: 6800, impressions: 19000, percentage: 14.9 },
    { name: 'Australia', countryCode: 'au', reach: 4500, impressions: 12500, percentage: 9.9 },
    { name: 'Germany', countryCode: 'de', reach: 3200, impressions: 8900, percentage: 7.0 },
    { name: 'France', countryCode: 'fr', reach: 2800, impressions: 7800, percentage: 6.1 },
    { name: 'Other', countryCode: '', reach: 1680, impressions: 4700, percentage: 3.6 }
  ];
  
  ageGroups = [
    { range: '18-24', percentage: 15 },
    { range: '25-34', percentage: 32 },
    { range: '35-44', percentage: 28 },
    { range: '45-54', percentage: 18 },
    { range: '55-64', percentage: 5 },
    { range: '65+', percentage: 2 }
  ];
  
  deviceTypes = [
    { name: 'Mobile', icon: 'smartphone', percentage: 68 },
    { name: 'Desktop', icon: 'monitor', percentage: 25 },
    { name: 'Tablet', icon: 'tablet', percentage: 7 }
  ];
  
  platformPerformance = [
    { name: 'Facebook', reach: 16000, growth: 12 },
    { name: 'LinkedIn', reach: 12800, growth: 18 },
    { name: 'Twitter', reach: 10000, growth: 8 },
    { name: 'Instagram', reach: 6880, growth: 25 }
  ];

  ngOnInit(): void {
    this.updateData();
  }
  
  updateData(): void {
    // Update data based on selected period
    console.log('Updating data for period:', this.selectedPeriod);
  }
  
  getPlatformBadgeClass(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-primary';
      case 'twitter': return 'bg-info';
      case 'linkedin': return 'bg-success';
      case 'instagram': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }
}