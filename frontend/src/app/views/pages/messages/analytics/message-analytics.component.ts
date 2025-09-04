import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../messages.service';
import { MessageAnalytics } from '../messages.model';

@Component({
  selector: 'app-message-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-analytics">
      <div class="page-header">
        <h2>Message Analytics</h2>
        <p>Track and analyze your messaging performance</p>
      </div>

      <div class="analytics-filters">
        <div class="row">
          <div class="col-md-3">
            <label for="dateRange">Date Range</label>
            <select id="dateRange" class="form-control" [(ngModel)]="selectedDateRange" (change)="loadAnalytics()">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="messageType">Message Type</label>
            <select id="messageType" class="form-control" [(ngModel)]="selectedMessageType" (change)="loadAnalytics()">
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="notification">Notification</option>
            </select>
          </div>
        </div>
      </div>

      <div class="analytics-cards" *ngIf="analytics">
        <div class="row">
          <div class="col-md-3">
            <div class="analytics-card">
              <h4>Total Messages</h4>
              <div class="metric">{{ analytics.overview?.totalMessages | number }}</div>
              <div class="change positive">
                +12.5%
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="analytics-card">
              <h4>Sent Today</h4>
              <div class="metric">{{ analytics.overview?.sentToday | number }}</div>
              <div class="change positive">
                +8.2%
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="analytics-card">
              <h4>Delivery Rate</h4>
              <div class="metric">{{ analytics.overview?.deliveryRate | number:'1.1-1' }}%</div>
              <div class="change positive">
                +1.8%
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="analytics-card">
              <h4>Response Rate</h4>
              <div class="metric">{{ analytics.overview?.responseRate | number:'1.1-1' }}%</div>
              <div class="change positive">
                +2.3%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="analytics-charts" *ngIf="analytics">
        <div class="row">
          <div class="col-md-6">
            <div class="chart-card">
              <h4>Message Volume Over Time</h4>
              <div class="chart-placeholder">
                <p>Chart visualization would be implemented here</p>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="chart-card">
              <h4>Message Types Distribution</h4>
              <div class="chart-placeholder">
                <p>Pie chart visualization would be implemented here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading analytics...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .message-analytics {
      padding: 20px;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .page-header h2 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .page-header p {
      margin: 0;
      color: #666;
    }

    .analytics-filters {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .analytics-filters label {
      font-weight: 600;
      margin-bottom: 5px;
      display: block;
    }

    .analytics-cards {
      margin-bottom: 30px;
    }

    .analytics-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }

    .analytics-card h4 {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
      font-weight: 600;
    }

    .metric {
      font-size: 32px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }

    .change {
      font-size: 14px;
      font-weight: 600;
    }

    .change.positive {
      color: #28a745;
    }

    .change.negative {
      color: #dc3545;
    }

    .chart-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      height: 300px;
    }

    .chart-card h4 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .chart-placeholder {
      height: 200px;
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .chart-placeholder p {
      color: #6c757d;
      margin: 0;
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
    }

    .error {
      color: #dc3545;
    }

    .row {
      display: flex;
      margin: 0 -15px;
    }

    .col-md-3, .col-md-6 {
      padding: 0 15px;
      margin-bottom: 20px;
    }

    .col-md-3 {
      flex: 0 0 25%;
    }

    .col-md-6 {
      flex: 0 0 50%;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
    }
  `]
})
export class MessageAnalyticsComponent implements OnInit {
  analytics: MessageAnalytics | null = null;
  loading = false;
  error: string | null = null;
  selectedDateRange = '30';
  selectedMessageType = '';

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;

    const params = {
      dateRange: this.selectedDateRange,
      messageType: this.selectedMessageType || undefined
    };

    this.messagesService.getAnalytics(params).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load analytics data';
        this.loading = false;
        console.error('Analytics error:', error);
      }
    });
  }
}