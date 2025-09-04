import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audience-analytics',
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
              <h4 class="card-title">Audience Analytics</h4>
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
            
            <!-- Audience Overview -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-primary">{{ audienceData.totalFollowers | number }}</h3>
                  <p class="text-muted mb-0">Total Followers</p>
                  <small class="text-success">+{{ audienceData.followerGrowth }}%</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-info">{{ audienceData.newFollowers | number }}</h3>
                  <p class="text-muted mb-0">New Followers</p>
                  <small class="text-success">+{{ audienceData.newFollowerGrowth }}%</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-warning">{{ audienceData.unfollowers | number }}</h3>
                  <p class="text-muted mb-0">Unfollowers</p>
                  <small class="text-danger">+{{ audienceData.unfollowerRate }}%</small>
                </div>
              </div>
              <div class="col-md-3">
                <div class="text-center">
                  <h3 class="text-success">{{ audienceData.engagementRate }}%</h3>
                  <p class="text-muted mb-0">Engagement Rate</p>
                  <small class="text-success">+{{ audienceData.engagementGrowth }}%</small>
                </div>
              </div>
            </div>
            
            <!-- Follower Growth Chart -->
            <div class="row">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Follower Growth Over Time</h6>
                    <apx-chart
                      [series]="followerGrowthChart.series"
                      [chart]="followerGrowthChart.chart"
                      [xaxis]="followerGrowthChart.xaxis"
                      [colors]="followerGrowthChart.colors"
                      [stroke]="followerGrowthChart.stroke">
                    </apx-chart>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Audience by Platform</h6>
                    <apx-chart
                      [series]="platformAudienceChart.series"
                      [chart]="platformAudienceChart.chart"
                      [labels]="platformAudienceChart.labels"
                      [colors]="platformAudienceChart.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Demographics -->
            <div class="row mt-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Age Demographics</h6>
                    <apx-chart
                      [series]="ageDemographicsChart.series"
                      [chart]="ageDemographicsChart.chart"
                      [xaxis]="ageDemographicsChart.xaxis"
                      [colors]="ageDemographicsChart.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Gender & Interest Distribution</h6>
                    <div class="row">
                      <div class="col-md-6">
                        <h6 class="text-muted mb-3">Gender</h6>
                        <apx-chart
                          [series]="genderChart.series"
                          [chart]="genderChart.chart"
                          [labels]="genderChart.labels"
                          [colors]="genderChart.colors">
                        </apx-chart>
                      </div>
                      <div class="col-md-6">
                        <h6 class="text-muted mb-3">Top Interests</h6>
                        <div *ngFor="let interest of topInterests" class="d-flex justify-content-between align-items-center mb-2">
                          <span>{{ interest.name }}</span>
                          <div class="d-flex align-items-center">
                            <div class="progress me-2" style="width: 80px; height: 6px;">
                              <div class="progress-bar" [style.width.%]="interest.percentage"></div>
                            </div>
                            <span class="text-muted">{{ interest.percentage }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Geographic Distribution -->
            <div class="row mt-4">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Geographic Distribution</h6>
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Country</th>
                            <th>Followers</th>
                            <th>Growth</th>
                            <th>Engagement</th>
                            <th>% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let country of topCountries">
                            <td>
                              <div class="d-flex align-items-center">
                                <span class="flag-icon flag-icon-{{ country.code }} me-2"></span>
                                {{ country.name }}
                              </div>
                            </td>
                            <td>{{ country.followers | number }}</td>
                            <td>
                              <span class="badge" [ngClass]="country.growth > 0 ? 'bg-success' : 'bg-danger'">
                                {{ country.growth > 0 ? '+' : '' }}{{ country.growth }}%
                              </span>
                            </td>
                            <td>{{ country.engagement }}%</td>
                            <td>
                              <div class="progress" style="height: 6px;">
                                <div class="progress-bar" [style.width.%]="country.percentage"></div>
                              </div>
                              <small>{{ country.percentage }}%</small>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Audience Activity</h6>
                    
                    <!-- Best Times to Post -->
                    <div class="mb-4">
                      <h6 class="text-muted mb-3">Best Times to Post</h6>
                      <div *ngFor="let time of bestTimes" class="d-flex justify-content-between align-items-center mb-2">
                        <span>{{ time.day }} {{ time.hour }}</span>
                        <div class="d-flex align-items-center">
                          <div class="progress me-2" style="width: 60px; height: 6px;">
                            <div class="progress-bar bg-success" [style.width.%]="time.activity"></div>
                          </div>
                          <span class="text-muted">{{ time.activity }}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Audience Online Hours -->
                    <div>
                      <h6 class="text-muted mb-3">Online Hours</h6>
                      <apx-chart
                        [series]="onlineHoursChart.series"
                        [chart]="onlineHoursChart.chart"
                        [xaxis]="onlineHoursChart.xaxis"
                        [colors]="onlineHoursChart.colors">
                      </apx-chart>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Audience Insights -->
            <div class="row mt-4">
              <div class="col-md-12">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Audience Insights & Recommendations</h6>
                    <div class="row">
                      <div class="col-md-4">
                        <div class="border rounded p-3 mb-3">
                          <div class="d-flex align-items-center mb-2">
                            <i data-feather="trending-up" appFeatherIcon class="text-success me-2"></i>
                            <h6 class="mb-0">Growth Opportunity</h6>
                          </div>
                          <p class="text-muted mb-0">Your audience is most active on weekdays between 2-4 PM. Consider posting more content during these hours.</p>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="border rounded p-3 mb-3">
                          <div class="d-flex align-items-center mb-2">
                            <i data-feather="users" appFeatherIcon class="text-info me-2"></i>
                            <h6 class="mb-0">Audience Profile</h6>
                          </div>
                          <p class="text-muted mb-0">Your primary audience is 25-44 years old professionals interested in financial services and credit repair.</p>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="border rounded p-3 mb-3">
                          <div class="d-flex align-items-center mb-2">
                            <i data-feather="target" appFeatherIcon class="text-warning me-2"></i>
                            <h6 class="mb-0">Content Strategy</h6>
                          </div>
                          <p class="text-muted mb-0">Educational content about credit scores performs 40% better than promotional posts with your audience.</p>
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
export class AudienceAnalyticsComponent implements OnInit {
  selectedPeriod: string = '30days';
  
  audienceData = {
    totalFollowers: 28450,
    followerGrowth: 12.5,
    newFollowers: 1280,
    newFollowerGrowth: 18.2,
    unfollowers: 156,
    unfollowerRate: 2.1,
    engagementRate: 4.8,
    engagementGrowth: 8.3
  };
  
  followerGrowthChart: any = {
    series: [
      {
        name: 'Total Followers',
        data: [25200, 25680, 26150, 26420, 26890, 27250, 27680, 28100, 28450]
      },
      {
        name: 'New Followers',
        data: [480, 470, 270, 440, 360, 430, 420, 370, 350]
      }
    ],
    chart: {
      height: 350,
      type: 'line',
      toolbar: { show: false }
    },
    stroke: {
      width: [3, 2],
      curve: 'smooth'
    },
    xaxis: {
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9']
    },
    colors: ['#3F51B5', '#4CAF50']
  };
  
  platformAudienceChart: any = {
    series: [42, 28, 18, 12],
    chart: {
      type: 'donut',
      height: 300
    },
    labels: ['Facebook', 'LinkedIn', 'Twitter', 'Instagram'],
    colors: ['#3F51B5', '#4CAF50', '#FF9800', '#E91E63']
  };
  
  ageDemographicsChart: any = {
    series: [
      {
        name: 'Followers',
        data: [8, 22, 35, 28, 15, 7]
      }
    ],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    },
    colors: ['#3F51B5']
  };
  
  genderChart: any = {
    series: [58, 42],
    chart: {
      type: 'donut',
      height: 200
    },
    labels: ['Female', 'Male'],
    colors: ['#E91E63', '#2196F3']
  };
  
  onlineHoursChart: any = {
    series: [
      {
        name: 'Active Users',
        data: [12, 8, 5, 3, 2, 4, 8, 15, 25, 35, 42, 48, 52, 58, 65, 72, 68, 55, 45, 38, 32, 28, 22, 18]
      }
    ],
    chart: {
      type: 'area',
      height: 200,
      toolbar: { show: false }
    },
    xaxis: {
      categories: Array.from({length: 24}, (_, i) => `${i}:00`)
    },
    colors: ['#4CAF50']
  };
  
  topCountries = [
    { name: 'United States', code: 'us', followers: 12080, growth: 15.2, engagement: 5.2, percentage: 42.5 },
    { name: 'Canada', code: 'ca', followers: 4260, growth: 12.8, engagement: 4.8, percentage: 15.0 },
    { name: 'United Kingdom', code: 'gb', followers: 3420, growth: 8.5, engagement: 4.2, percentage: 12.0 },
    { name: 'Australia', code: 'au', followers: 2280, growth: 18.3, engagement: 5.8, percentage: 8.0 },
    { name: 'Germany', code: 'de', followers: 1710, growth: 6.2, engagement: 3.9, percentage: 6.0 },
    { name: 'France', code: 'fr', followers: 1425, growth: 9.1, engagement: 4.1, percentage: 5.0 },
    { name: 'Other', code: '', followers: 3275, growth: 11.5, engagement: 4.5, percentage: 11.5 }
  ];
  
  topInterests = [
    { name: 'Credit Repair', percentage: 85 },
    { name: 'Personal Finance', percentage: 72 },
    { name: 'Real Estate', percentage: 58 },
    { name: 'Investment', percentage: 45 },
    { name: 'Business', percentage: 38 },
    { name: 'Education', percentage: 32 }
  ];
  
  bestTimes = [
    { day: 'Monday', hour: '2-4 PM', activity: 85 },
    { day: 'Tuesday', hour: '1-3 PM', activity: 78 },
    { day: 'Wednesday', hour: '2-4 PM', activity: 82 },
    { day: 'Thursday', hour: '3-5 PM', activity: 75 },
    { day: 'Friday', hour: '12-2 PM', activity: 68 }
  ];

  ngOnInit(): void {
    this.updateData();
  }
  
  updateData(): void {
    // Update data based on selected period
    console.log('Updating data for period:', this.selectedPeriod);
  }
}