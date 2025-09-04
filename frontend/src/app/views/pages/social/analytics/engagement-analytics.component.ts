import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-engagement-analytics',
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
              <h4 class="card-title">Engagement Analytics</h4>
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
            
            <!-- Engagement Metrics -->
            <div class="row mb-4">
              <div class="col-md-2">
                <div class="text-center">
                  <h3 class="text-primary">{{ engagementData.likes | number }}</h3>
                  <p class="text-muted mb-0">Likes</p>
                  <small class="text-success">+15%</small>
                </div>
              </div>
              <div class="col-md-2">
                <div class="text-center">
                  <h3 class="text-info">{{ engagementData.comments | number }}</h3>
                  <p class="text-muted mb-0">Comments</p>
                  <small class="text-success">+8%</small>
                </div>
              </div>
              <div class="col-md-2">
                <div class="text-center">
                  <h3 class="text-warning">{{ engagementData.shares | number }}</h3>
                  <p class="text-muted mb-0">Shares</p>
                  <small class="text-success">+22%</small>
                </div>
              </div>
              <div class="col-md-2">
                <div class="text-center">
                  <h3 class="text-success">{{ engagementData.clicks | number }}</h3>
                  <p class="text-muted mb-0">Clicks</p>
                  <small class="text-success">+12%</small>
                </div>
              </div>
              <div class="col-md-2">
                <div class="text-center">
                  <h3 class="text-danger">{{ engagementData.saves | number }}</h3>
                  <p class="text-muted mb-0">Saves</p>
                  <small class="text-success">+18%</small>
                </div>
              </div>
              <div class="col-md-2">
                <div class="text-center">
                  <h3 class="text-secondary">{{ engagementData.rate }}%</h3>
                  <p class="text-muted mb-0">Engagement Rate</p>
                  <small class="text-success">+3%</small>
                </div>
              </div>
            </div>
            
            <!-- Engagement Trend Chart -->
            <div class="row">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Engagement Trends Over Time</h6>
                    <apx-chart
                      [series]="engagementTrendChart.series"
                      [chart]="engagementTrendChart.chart"
                      [xaxis]="engagementTrendChart.xaxis"
                      [colors]="engagementTrendChart.colors"
                      [stroke]="engagementTrendChart.stroke">
                    </apx-chart>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Engagement by Type</h6>
                    <apx-chart
                      [series]="engagementTypeChart.series"
                      [chart]="engagementTypeChart.chart"
                      [labels]="engagementTypeChart.labels"
                      [colors]="engagementTypeChart.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Top Performing Posts -->
            <div class="row mt-4">
              <div class="col-md-12">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Top Performing Posts</h6>
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Post Content</th>
                            <th>Platform</th>
                            <th>Likes</th>
                            <th>Comments</th>
                            <th>Shares</th>
                            <th>Engagement Rate</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let post of topPosts">
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="me-3">
                                  <div class="bg-light rounded p-2">
                                    <i data-feather="image" appFeatherIcon class="text-muted"></i>
                                  </div>
                                </div>
                                <div>
                                  <p class="mb-0">{{ post.content | slice:0:60 }}...</p>
                                  <small class="text-muted">{{ post.type }}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="badge" [ngClass]="getPlatformBadgeClass(post.platform)">
                                {{ post.platform }}
                              </span>
                            </td>
                            <td>{{ post.likes | number }}</td>
                            <td>{{ post.comments | number }}</td>
                            <td>{{ post.shares | number }}</td>
                            <td>
                              <span class="badge bg-success">{{ post.engagementRate }}%</span>
                            </td>
                            <td>{{ post.date | date:'short' }}</td>
                          </tr>
                        </tbody>
                      </table>
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
export class EngagementAnalyticsComponent implements OnInit {
  selectedPeriod: string = '30days';
  
  engagementData = {
    likes: 12450,
    comments: 3280,
    shares: 1890,
    clicks: 8750,
    saves: 2340,
    rate: 4.2
  };
  
  engagementTrendChart: any = {
    series: [
      {
        name: 'Likes',
        data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 140, 160, 180]
      },
      {
        name: 'Comments',
        data: [10, 15, 12, 18, 16, 20, 25, 30, 35, 40, 45, 50]
      },
      {
        name: 'Shares',
        data: [5, 8, 6, 12, 10, 15, 18, 22, 28, 32, 38, 42]
      }
    ],
    chart: {
      height: 350,
      type: 'line',
      toolbar: { show: false }
    },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    colors: ['#3F51B5', '#FF9800', '#4CAF50']
  };
  
  engagementTypeChart: any = {
    series: [45, 25, 15, 10, 5],
    chart: {
      type: 'donut',
      height: 300
    },
    labels: ['Likes', 'Comments', 'Shares', 'Clicks', 'Saves'],
    colors: ['#3F51B5', '#FF9800', '#4CAF50', '#F44336', '#9C27B0']
  };
  
  topPosts = [
    {
      content: 'Credit repair success story - Client improved score by 150 points in 6 months!',
      type: 'Success Story',
      platform: 'Facebook',
      likes: 1250,
      comments: 89,
      shares: 156,
      engagementRate: 8.2,
      date: new Date('2024-01-15')
    },
    {
      content: '5 Essential tips for maintaining excellent credit health and financial wellness',
      type: 'Educational',
      platform: 'LinkedIn',
      likes: 890,
      comments: 67,
      shares: 134,
      engagementRate: 7.1,
      date: new Date('2024-01-14')
    },
    {
      content: 'Understanding the credit dispute process: A step-by-step guide',
      type: 'Guide',
      platform: 'Twitter',
      likes: 650,
      comments: 45,
      shares: 89,
      engagementRate: 6.8,
      date: new Date('2024-01-13')
    },
    {
      content: 'Free credit report analysis - Limited time offer for new clients',
      type: 'Promotion',
      platform: 'Facebook',
      likes: 580,
      comments: 34,
      shares: 67,
      engagementRate: 5.9,
      date: new Date('2024-01-12')
    }
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