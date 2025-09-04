import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { CampaignStatus, CampaignType, MessageCampaign } from '../messages.model';

type Campaign = MessageCampaign & {
  startDate?: Date;
  endDate?: Date;
  totalRecipients?: number;
  messagesSent?: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  revenue?: number;
  cost?: number;
  roi?: number;
  tags?: string[];
  emailSubject?: string;
  emailContent?: string;
  smsContent?: string;
  lastModified?: Date;
  budget?: number;
  spent?: number;
  subject?: string;
};

interface CampaignMetrics {
  totalSent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  complained: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  complaintRate: number;
}

interface CampaignActivity {
  id: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  recipient: string;
  timestamp: Date;
  details?: string;
}

interface TimeSeriesData {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
}

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="campaign-detail-container" *ngIf="campaign">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="d-flex align-items-center mb-2">
            <button class="btn btn-outline-secondary me-3" (click)="goBack()">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div>
              <h2>{{ campaign.name }}</h2>
              <div class="d-flex align-items-center gap-2">
                <span class="badge" [ngClass]="getStatusBadgeClass(campaign.status)">
                  {{ campaign.status | titlecase }}
                </span>
                <span class="badge bg-secondary">
                  <i class="fas" [ngClass]="getTypeIcon(campaign.type)"></i>
                  {{ campaign.type | titlecase }}
                </span>
                <span class="text-muted">•</span>
                <small class="text-muted">Created {{ campaign.createdAt | date:'medium' }}</small>
              </div>
            </div>
          </div>
          <p class="text-muted mb-0">{{ campaign.description }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary" (click)="exportReport()">
            <i class="fas fa-download"></i>
            Export Report
          </button>
          <button class="btn btn-outline-primary" 
                  [routerLink]="['/messages/campaigns', campaign.id, 'edit']"
                  *ngIf="campaign.status === 'draft'">
            <i class="fas fa-edit"></i>
            Edit
          </button>
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" 
                    type="button" 
                    id="campaignActions"
                    data-bs-toggle="dropdown">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <ul class="dropdown-menu" aria-labelledby="campaignActions">
              <li><a class="dropdown-item" href="#" (click)="duplicateCampaign()">
                <i class="fas fa-copy"></i> Duplicate
              </a></li>
              <li><a class="dropdown-item" href="#" (click)="pauseCampaign()" 
                     *ngIf="campaign.status === 'active'">
                <i class="fas fa-pause"></i> Pause
              </a></li>
              <li><a class="dropdown-item" href="#" (click)="resumeCampaign()" 
                     *ngIf="campaign.status === 'paused'">
                <i class="fas fa-play"></i> Resume
              </a></li>
              <li><a class="dropdown-item" href="#" (click)="archiveCampaign()" 
                     *ngIf="campaign.status === 'completed'">
                <i class="fas fa-archive"></i> Archive
              </a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" (click)="deleteCampaign()">
                <i class="fas fa-trash"></i> Delete
              </a></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Metrics Overview -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="metric-card">
            <div class="metric-icon bg-primary">
              <i class="fas fa-paper-plane"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.totalSent | number }}</div>
              <div class="metric-label">Messages Sent</div>
              <div class="metric-change text-success" *ngIf="campaign.status === 'active'">
                <i class="fas fa-arrow-up"></i> +{{ (campaign.messagesSent || 0) - (metrics?.totalSent || 0) | number }} today
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="metric-card">
            <div class="metric-icon bg-success">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.deliveryRate }}%</div>
              <div class="metric-label">Delivery Rate</div>
              <div class="metric-subtext">{{ metrics.delivered | number }} delivered</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="metric-card">
            <div class="metric-icon bg-info">
              <i class="fas fa-envelope-open"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.openRate }}%</div>
              <div class="metric-label">Open Rate</div>
              <div class="metric-subtext">{{ metrics.opened | number }} opens</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="metric-card">
            <div class="metric-icon bg-warning">
              <i class="fas fa-mouse-pointer"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ metrics.clickRate }}%</div>
              <div class="metric-label">Click Rate</div>
              <div class="metric-subtext">{{ metrics.clicked | number }} clicks</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="card mb-4" *ngIf="campaign.status === 'active'">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">Campaign Progress</h6>
            <span class="text-muted">{{ campaign.messagesSent | number }} / {{ campaign.totalRecipients | number }}</span>
          </div>
          <div class="progress" style="height: 8px;">
            <div class="progress-bar" 
                 [style.width.%]="(campaign.messagesSent && campaign.totalRecipients) ? (campaign.messagesSent / campaign.totalRecipients) * 100 : 0">
            </div>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <small class="text-muted">Started {{ campaign.startDate | date:'short' }}</small>
            <small class="text-muted" *ngIf="campaign.endDate">
              Ends {{ campaign.endDate | date:'short' }}
            </small>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Main Content -->
        <div class="col-lg-8">
          <!-- Performance Chart -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-chart-line"></i>
                Performance Over Time
              </h5>
            </div>
            <div class="card-body">
              <div class="chart-container">
                <!-- Chart placeholder - would integrate with actual charting library -->
                <div class="chart-placeholder">
                  <div class="chart-legend">
                    <div class="legend-item">
                      <span class="legend-color bg-primary"></span>
                      <span>Sent</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color bg-success"></span>
                      <span>Delivered</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color bg-info"></span>
                      <span>Opened</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-color bg-warning"></span>
                      <span>Clicked</span>
                    </div>
                  </div>
                  <div class="chart-area">
                    <p class="text-center text-muted">Chart visualization would be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Metrics -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-analytics"></i>
                Detailed Metrics
              </h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="metric-group">
                    <h6>Delivery Metrics</h6>
                    <div class="metric-row">
                      <span>Total Sent</span>
                      <span class="fw-bold">{{ metrics.totalSent | number }}</span>
                    </div>
                    <div class="metric-row">
                      <span>Delivered</span>
                      <span class="fw-bold text-success">{{ metrics.delivered | number }}</span>
                    </div>
                    <div class="metric-row">
                      <span>Bounced</span>
                      <span class="fw-bold text-danger">{{ metrics.bounced | number }}</span>
                    </div>
                    <div class="metric-row">
                      <span>Delivery Rate</span>
                      <span class="fw-bold">{{ metrics.deliveryRate }}%</span>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="metric-group">
                    <h6>Engagement Metrics</h6>
                    <div class="metric-row">
                      <span>Opened</span>
                      <span class="fw-bold text-info">{{ metrics.opened | number }}</span>
                    </div>
                    <div class="metric-row">
                      <span>Clicked</span>
                      <span class="fw-bold text-warning">{{ metrics.clicked | number }}</span>
                    </div>
                    <div class="metric-row">
                      <span>Converted</span>
                      <span class="fw-bold text-success">{{ metrics.converted | number }}</span>
                    </div>
                    <div class="metric-row">
                      <span>Unsubscribed</span>
                      <span class="fw-bold text-danger">{{ metrics.unsubscribed | number }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-history"></i>
                Recent Activity
              </h5>
            </div>
            <div class="card-body">
              <div class="activity-list">
                <div class="activity-item" *ngFor="let activity of recentActivity">
                  <div class="activity-icon" [ngClass]="getActivityIconClass(activity.type)">
                    <i class="fas" [ngClass]="getActivityIcon(activity.type)"></i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-text">
                      <strong>{{ activity.recipient }}</strong>
                      {{ getActivityText(activity.type) }}
                    </div>
                    <div class="activity-time">
                      {{ activity.timestamp | date:'short' }}
                    </div>
                    <div class="activity-details" *ngIf="activity.details">
                      {{ activity.details }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-center mt-3" *ngIf="recentActivity.length === 0">
                <p class="text-muted">No recent activity</p>
              </div>
              
              <div class="text-center mt-3" *ngIf="recentActivity.length > 0">
                <button class="btn btn-outline-primary" (click)="loadMoreActivity()">
                  Load More Activity
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Campaign Info -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-info-circle"></i>
                Campaign Information
              </h5>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="info-label">Type</span>
                <span class="info-value">
                  <i class="fas" [ngClass]="getTypeIcon(campaign.type)"></i>
                  {{ campaign.type | titlecase }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value">
                  <span class="badge" [ngClass]="getStatusBadgeClass(campaign.status)">
                    {{ campaign.status | titlecase }}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Start Date</span>
                <span class="info-value">{{ campaign.startDate | date:'medium' }}</span>
              </div>
              <div class="info-row" *ngIf="campaign.endDate">
                <span class="info-label">End Date</span>
                <span class="info-value">{{ campaign.endDate | date:'medium' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Recipients</span>
                <span class="info-value">{{ campaign.totalRecipients | number }}</span>
              </div>
              <div class="info-row" *ngIf="campaign.budget">
                <span class="info-label">Budget</span>
                <span class="info-value">\${{ campaign.budget | number:'1.2-2' }}</span>
              </div>
              <div class="info-row" *ngIf="campaign.cost">
                <span class="info-label">Cost</span>
                <span class="info-value">\${{ campaign.cost | number:'1.2-2' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Created By</span>
                <span class="info-value">{{ campaign.createdBy }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Last Modified</span>
                <span class="info-value">{{ campaign.lastModified ? (campaign.lastModified | date:'medium') : 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="card mb-4" *ngIf="campaign.tags && campaign.tags.length > 0">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-tags"></i>
                Tags
              </h5>
            </div>
            <div class="card-body">
              <div class="tags-list">
                <span class="tag" *ngFor="let tag of campaign.tags">{{ tag }}</span>
              </div>
            </div>
          </div>

          <!-- Message Content -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="fas fa-envelope"></i>
                Message Content
              </h5>
            </div>
            <div class="card-body">
              <div *ngIf="campaign.type === CampaignType.PROMOTIONAL || campaign.type === CampaignType.EDUCATIONAL">
                <h6>Email Subject</h6>
                <p class="content-preview">{{ campaign.subject || campaign.emailSubject }}</p>
                
                <h6>Email Content</h6>
                <div class="content-preview" [innerHTML]="campaign.emailContent"></div>
              </div>
              
              <div *ngIf="campaign.type === CampaignType.TRANSACTIONAL || campaign.type === CampaignType.REMINDER" 
                     [class.mt-3]="campaign.type === CampaignType.TRANSACTIONAL">
                <h6>SMS Content</h6>
                <p class="content-preview">{{ campaign.smsContent }}</p>
              </div>
              
              <div class="mt-3">
                <button class="btn btn-outline-primary btn-sm w-100" (click)="previewMessage()">
                  <i class="fas fa-eye"></i>
                  Preview Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="text-center py-5" *ngIf="!campaign">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading campaign details...</p>
    </div>
  `,
  styles: [`
    .campaign-detail-container {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .metric-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1px solid #e9ecef;
      height: 100%;
    }

    .metric-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      color: white;
    }

    .metric-content {
      flex-grow: 1;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.25rem;
    }

    .metric-label {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .metric-subtext {
      font-size: 0.75rem;
      color: #6c757d;
    }

    .metric-change {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .chart-container {
      height: 300px;
    }

    .chart-placeholder {
      height: 100%;
      border: 2px dashed #e9ecef;
      border-radius: 0.375rem;
      display: flex;
      flex-direction: column;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .chart-area {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-group {
      background-color: #f8f9fa;
      padding: 1rem;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
    }

    .metric-group h6 {
      margin-bottom: 0.75rem;
      color: #495057;
      font-weight: 600;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .metric-row:last-child {
      border-bottom: none;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      padding: 1rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
      color: white;
      font-size: 0.875rem;
    }

    .activity-content {
      flex-grow: 1;
    }

    .activity-text {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.75rem;
      color: #6c757d;
    }

    .activity-details {
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 500;
      color: #6c757d;
    }

    .info-value {
      text-align: right;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .content-preview {
      background-color: #f8f9fa;
      padding: 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1rem;
      max-height: 150px;
      overflow-y: auto;
    }

    .badge {
      font-size: 0.75rem;
    }

    .badge i {
      margin-right: 0.25rem;
    }

    @media (max-width: 768px) {
      .campaign-detail-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-actions {
        justify-content: center;
        flex-wrap: wrap;
      }

      .metric-card {
        margin-bottom: 1rem;
      }

      .chart-legend {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    }
  `]
})
export class CampaignDetailComponent implements OnInit, OnDestroy {
  campaign?: Campaign;
  metrics: CampaignMetrics = {
    totalSent: 0,
    delivered: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    unsubscribed: 0,
    complained: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
    unsubscribeRate: 0,
    complaintRate: 0
  };
  recentActivity: CampaignActivity[] = [];
  timeSeriesData: TimeSeriesData[] = [];
  
  // Expose enums for template use
  CampaignType = CampaignType;
  CampaignStatus = CampaignStatus;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messagesService: MessagesService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadCampaign(params['id']);
        this.loadMetrics(params['id']);
        this.loadActivity(params['id']);
        this.loadTimeSeriesData(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCampaign(id: string): void {
    this.messagesService.getCampaign(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.router.navigate(['/messages/campaigns']);
      }
    });
  }

  loadMetrics(campaignId: string): void {
    this.messagesService.getCampaignMetrics(campaignId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (metrics: any) => {
        this.metrics = metrics;
      },
      error: (error: any) => {
        console.error('Error loading campaign metrics:', error);
      }
    });
  }

  loadActivity(campaignId: string): void {
    this.messagesService.getCampaignActivity(campaignId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (activity: any) => {
        this.recentActivity = activity;
      },
      error: (error: any) => {
        console.error('Error loading campaign activity:', error);
      }
    });
  }

  loadTimeSeriesData(campaignId: string): void {
    this.messagesService.getCampaignTimeSeriesData(campaignId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data: any) => {
        this.timeSeriesData = data;
      },
      error: (error: any) => {
        console.error('Error loading time series data:', error);
      }
    });
  }

  loadMoreActivity(): void {
    if (this.campaign) {
      this.messagesService.getCampaignActivity(this.campaign.id, this.recentActivity.length).pipe(takeUntil(this.destroy$)).subscribe({
        next: (activity: any) => {
          this.recentActivity = [...this.recentActivity, ...activity];
        },
        error: (error: any) => {
          console.error('Error loading more activity:', error);
        }
      });
    }
  }

  duplicateCampaign(): void {
    if (this.campaign) {
      const duplicateData = {
        name: `${this.campaign.name} (Copy)`,
        status: CampaignStatus.DRAFT,
        type: CampaignType.PROMOTIONAL,
        description: this.campaign.description,
        targetAudience: {
          criteria: [],
          includeGroups: [],
          excludeGroups: []
        }
      };
      
      this.messagesService.createCampaign(duplicateData).subscribe({
        next: (newCampaign) => {
          this.router.navigate(['/messages/campaigns', newCampaign.id, 'edit']);
        },
        error: (error) => {
          console.error('Error duplicating campaign:', error);
        }
      });
    }
  }

  pauseCampaign(): void {
    if (this.campaign && confirm('Are you sure you want to pause this campaign?')) {
      this.messagesService.updateCampaignStatus(this.campaign.id, 'paused').subscribe({
        next: () => {
          if (this.campaign) {
            this.campaign.status = CampaignStatus.PAUSED;
          }
        },
        error: (error) => {
          console.error('Error pausing campaign:', error);
        }
      });
    }
  }

  resumeCampaign(): void {
    if (this.campaign) {
      this.messagesService.updateCampaignStatus(this.campaign.id, 'active').subscribe({
        next: () => {
          if (this.campaign) {
            this.campaign.status = CampaignStatus.ACTIVE;
          }
        },
        error: (error) => {
          console.error('Error resuming campaign:', error);
        }
      });
    }
  }

  archiveCampaign(): void {
    if (this.campaign && confirm('Are you sure you want to archive this campaign?')) {
      this.messagesService.updateCampaignStatus(this.campaign.id, 'archived').subscribe({
        next: () => {
          this.router.navigate(['/messages/campaigns']);
        },
        error: (error) => {
          console.error('Error archiving campaign:', error);
        }
      });
    }
  }

  deleteCampaign(): void {
    if (this.campaign && confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      this.messagesService.deleteCampaign(this.campaign.id).subscribe({
        next: () => {
          this.router.navigate(['/messages/campaigns']);
        },
        error: (error) => {
          console.error('Error deleting campaign:', error);
        }
      });
    }
  }

  exportReport(): void {
    if (this.campaign) {
      this.messagesService.exportCampaigns().subscribe({
        next: (data: any) => {
          // Handle export download
          console.log('Campaign report exported successfully');
        },
        error: (error: any) => {
          console.error('Error exporting campaign report:', error);
        }
      });
    }
  }

  previewMessage(): void {
    // Open message preview modal
    console.log('Preview message');
  }

  goBack(): void {
    this.router.navigate(['/messages/campaigns']);
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'draft': 'bg-secondary',
      'active': 'bg-success',
      'paused': 'bg-warning',
      'completed': 'bg-info',
      'archived': 'bg-dark'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  getTypeIcon(type: string): string {
    const icons = {
      'email': 'fa-envelope',
      'sms': 'fa-sms',
      'mixed': 'fa-layer-group'
    };
    return icons[type as keyof typeof icons] || 'fa-envelope';
  }

  getActivityIconClass(type: string): string {
    const classes = {
      'sent': 'bg-primary',
      'delivered': 'bg-success',
      'opened': 'bg-info',
      'clicked': 'bg-warning',
      'bounced': 'bg-danger',
      'unsubscribed': 'bg-secondary'
    };
    return classes[type as keyof typeof classes] || 'bg-secondary';
  }

  getActivityIcon(type: string): string {
    const icons = {
      'sent': 'fa-paper-plane',
      'delivered': 'fa-check',
      'opened': 'fa-envelope-open',
      'clicked': 'fa-mouse-pointer',
      'bounced': 'fa-exclamation-triangle',
      'unsubscribed': 'fa-user-minus'
    };
    return icons[type as keyof typeof icons] || 'fa-circle';
  }

  getActivityText(type: string): string {
    const texts = {
      'sent': 'was sent a message',
      'delivered': 'received the message',
      'opened': 'opened the message',
      'clicked': 'clicked a link',
      'bounced': 'message bounced',
      'unsubscribed': 'unsubscribed'
    };
    return texts[type as keyof typeof texts] || 'had activity';
  }
}