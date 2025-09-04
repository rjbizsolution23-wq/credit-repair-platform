import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FeatherIconDirective,
    NgApexchartsModule
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 class="card-title">Social Analytics Report Details</h4>
              <div>
                <button class="btn btn-outline-primary btn-sm me-2">
                  <i data-feather="download" appFeatherIcon></i>
                  Download
                </button>
                <button class="btn btn-outline-secondary btn-sm">
                  <i data-feather="share-2" appFeatherIcon></i>
                  Share
                </button>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-3">
                <div class="card border-0 bg-light">
                  <div class="card-body text-center">
                    <h3 class="text-primary">{{ reportData.totalEngagement | number }}</h3>
                    <p class="text-muted mb-0">Total Engagement</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 bg-light">
                  <div class="card-body text-center">
                    <h3 class="text-success">{{ reportData.totalReach | number }}</h3>
                    <p class="text-muted mb-0">Total Reach</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 bg-light">
                  <div class="card-body text-center">
                    <h3 class="text-info">{{ reportData.totalImpressions | number }}</h3>
                    <p class="text-muted mb-0">Total Impressions</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 bg-light">
                  <div class="card-body text-center">
                    <h3 class="text-warning">{{ reportData.engagementRate }}%</h3>
                    <p class="text-muted mb-0">Engagement Rate</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Engagement Over Time</h6>
                    <apx-chart
                      [series]="engagementChartOptions.series"
                      [chart]="engagementChartOptions.chart"
                      [xaxis]="engagementChartOptions.xaxis"
                      [colors]="engagementChartOptions.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Platform Distribution</h6>
                    <apx-chart
                      [series]="platformChartOptions.series"
                      [chart]="platformChartOptions.chart"
                      [labels]="platformChartOptions.labels"
                      [colors]="platformChartOptions.colors">
                    </apx-chart>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-md-12">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Top Performing Posts</h6>
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Post</th>
                            <th>Platform</th>
                            <th>Engagement</th>
                            <th>Reach</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let post of reportData.topPosts">
                            <td>{{ post.content | slice:0:50 }}...</td>
                            <td>
                              <span class="badge" [ngClass]="getPlatformBadgeClass(post.platform)">
                                {{ post.platform }}
                              </span>
                            </td>
                            <td>{{ post.engagement | number }}</td>
                            <td>{{ post.reach | number }}</td>
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
export class ReportDetailComponent implements OnInit {
  reportId: string = '';
  
  reportData = {
    totalEngagement: 15420,
    totalReach: 89650,
    totalImpressions: 125300,
    engagementRate: 3.2,
    topPosts: [
      {
        content: 'Credit repair success story - Client improved score by 150 points!',
        platform: 'Facebook',
        engagement: 1250,
        reach: 8900,
        date: new Date('2024-01-15')
      },
      {
        content: 'Tips for maintaining good credit health',
        platform: 'Twitter',
        engagement: 890,
        reach: 5600,
        date: new Date('2024-01-14')
      },
      {
        content: 'Understanding credit report disputes',
        platform: 'LinkedIn',
        engagement: 650,
        reach: 4200,
        date: new Date('2024-01-13')
      }
    ]
  };
  
  engagementChartOptions: any = {
    series: [{
      name: 'Engagement',
      data: [30, 40, 35, 50, 49, 60, 70, 91, 125]
    }],
    chart: {
      height: 350,
      type: 'line',
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9']
    },
    colors: ['#3F51B5']
  };
  
  platformChartOptions: any = {
    series: [44, 55, 13],
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Facebook', 'Twitter', 'LinkedIn'],
    colors: ['#1877F2', '#1DA1F2', '#0A66C2']
  };

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id') || '';
    // Load report data based on ID
  }
  
  getPlatformBadgeClass(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'facebook': return 'bg-primary';
      case 'twitter': return 'bg-info';
      case 'linkedin': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
}