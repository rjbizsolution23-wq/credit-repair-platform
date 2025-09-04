import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { CampaignType, CampaignStatus, MessageCampaign } from '../messages.model';

// Use MessageCampaign from messages.model.ts instead of local interface
type Campaign = MessageCampaign & {
  // Add any additional properties needed for the UI
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  budget?: number;
  spent?: number;
  lastModified?: Date;
  tags?: string[];
  messagesSent?: number;
  totalRecipients?: number;
  startDate?: Date;
  endDate?: Date;
};

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRecipients: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgConversionRate: number;
  totalSpent: number;
  roi: number;
}

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="campaigns-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2>Marketing Campaigns</h2>
          <p class="text-muted">Manage and track your marketing campaigns</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary" (click)="exportCampaigns()">
            <i class="fas fa-download"></i>
            Export
          </button>
          <button class="btn btn-primary" routerLink="/messages/campaigns/new">
            <i class="fas fa-plus"></i>
            New Campaign
          </button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalCampaigns }}</div>
              <div class="stat-label">Total Campaigns</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="fas fa-play"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.activeCampaigns }}</div>
              <div class="stat-label">Active Campaigns</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalRecipients | number }}</div>
              <div class="stat-label">Total Recipients</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.avgOpenRate }}%</div>
              <div class="stat-label">Avg Open Rate</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <input type="text" 
                     class="form-control" 
                     placeholder="Search campaigns..."
                     [(ngModel)]="searchTerm"
                     (input)="filterCampaigns()">
            </div>
            <div class="col-md-2">
              <select class="form-select" 
                      [(ngModel)]="selectedType"
                      (change)="filterCampaigns()">
                <option value="">All Types</option>
                <option [value]="CampaignType.PROMOTIONAL">Promotional</option>
                 <option [value]="CampaignType.EDUCATIONAL">Educational</option>
                 <option [value]="CampaignType.TRANSACTIONAL">Transactional</option>
                 <option [value]="CampaignType.REMINDER">Reminder</option>
                 <option [value]="CampaignType.SURVEY">Survey</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" 
                      [(ngModel)]="selectedStatus"
                      (change)="filterCampaigns()">
                <option value="">All Status</option>
                <option [value]="CampaignStatus.DRAFT">Draft</option>
                      <option [value]="CampaignStatus.ACTIVE">Active</option>
                      <option [value]="CampaignStatus.PAUSED">Paused</option>
                      <option [value]="CampaignStatus.COMPLETED">Completed</option>
                      <option [value]="CampaignStatus.CANCELLED">Cancelled</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-select" 
                      [(ngModel)]="sortBy"
                      (change)="sortCampaigns()">
                <option value="createdAt">Created Date</option>
                <option value="name">Name</option>
                <option value="startDate">Start Date</option>
                <option value="openRate">Open Rate</option>
                <option value="clickRate">Click Rate</option>
              </select>
            </div>
            <div class="col-md-2">
              <div class="btn-group w-100" role="group">
                <button class="btn btn-outline-secondary" 
                        [class.active]="viewMode === 'grid'"
                        (click)="viewMode = 'grid'">
                  <i class="fas fa-th"></i>
                </button>
                <button class="btn btn-outline-secondary" 
                        [class.active]="viewMode === 'list'"
                        (click)="viewMode = 'list'">
                  <i class="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Campaigns Grid View -->
      <div class="campaigns-grid" *ngIf="viewMode === 'grid'">
        <div class="row">
          <div class="col-lg-4 col-md-6 mb-4" *ngFor="let campaign of filteredCampaigns">
            <div class="campaign-card">
              <div class="campaign-header">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 class="campaign-title">{{ campaign.name }}</h5>
                    <span class="badge" [ngClass]="getStatusBadgeClass(campaign.status)">
                      {{ campaign.status | titlecase }}
                    </span>
                    <span class="badge bg-secondary ms-2">
                      <i class="fas" [ngClass]="getTypeIcon(campaign.type)"></i>
                      {{ campaign.type | titlecase }}
                    </span>
                  </div>
                  <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                            type="button" 
                            [id]="'campaignActions' + campaign.id"
                            data-bs-toggle="dropdown">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu" [attr.aria-labelledby]="'campaignActions' + campaign.id">
                      <li><a class="dropdown-item" [routerLink]="['/messages/campaigns', campaign.id]">
                        <i class="fas fa-eye"></i> View Details
                      </a></li>
                      <li><a class="dropdown-item" [routerLink]="['/messages/campaigns', campaign.id, 'edit']" 
                             *ngIf="campaign.status === 'draft'">
                        <i class="fas fa-edit"></i> Edit
                      </a></li>
                      <li><a class="dropdown-item" href="#" (click)="duplicateCampaign(campaign)">
                        <i class="fas fa-copy"></i> Duplicate
                      </a></li>
                      <li><a class="dropdown-item" href="#" (click)="pauseCampaign(campaign)" 
                             *ngIf="campaign.status === CampaignStatus.ACTIVE">
                        <i class="fas fa-pause"></i> Pause
                      </a></li>
                      <li><a class="dropdown-item" href="#" (click)="resumeCampaign(campaign)" 
                             *ngIf="campaign.status === 'paused'">
                        <i class="fas fa-play"></i> Resume
                      </a></li>
                      <li><a class="dropdown-item" href="#" (click)="archiveCampaign(campaign)" 
                             *ngIf="campaign.status === 'completed'">
                        <i class="fas fa-archive"></i> Archive
                      </a></li>
                      <li><hr class="dropdown-divider"></li>
                      <li><a class="dropdown-item text-danger" href="#" (click)="deleteCampaign(campaign)">
                        <i class="fas fa-trash"></i> Delete
                      </a></li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="campaign-content">
                <p class="campaign-description">{{ campaign.description }}</p>
                
                <div class="campaign-dates">
                  <small class="text-muted">
                    <i class="fas fa-calendar-start"></i>
                    Start: {{ campaign.startDate | date:'short' }}
                  </small>
                  <small class="text-muted" *ngIf="campaign.endDate">
                    <i class="fas fa-calendar-end"></i>
                    End: {{ campaign.endDate | date:'short' }}
                  </small>
                </div>
                
                <div class="campaign-metrics">
                  <div class="metric">
                    <div class="metric-value">{{ campaign.totalRecipients | number }}</div>
                    <div class="metric-label">Recipients</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">{{ campaign.openRate }}%</div>
                    <div class="metric-label">Open Rate</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">{{ campaign.clickRate }}%</div>
                    <div class="metric-label">Click Rate</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">{{ campaign.conversionRate }}%</div>
                    <div class="metric-label">Conversion</div>
                  </div>
                </div>
                
                <div class="campaign-progress" *ngIf="campaign.status === CampaignStatus.ACTIVE">
                  <div class="progress">
                    <div class="progress-bar" 
                         [style.width.%]="(campaign.messagesSent && campaign.totalRecipients) ? (campaign.messagesSent / campaign.totalRecipients) * 100 : 0">
                    </div>
                  </div>
                  <small class="text-muted">
                    {{ campaign.messagesSent | number }} / {{ campaign.totalRecipients | number }} sent
                  </small>
                </div>
                
                <div class="campaign-tags" *ngIf="campaign.tags && campaign.tags.length > 0">
                  <span class="tag" *ngFor="let tag of campaign.tags">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Campaigns List View -->
      <div class="campaigns-list" *ngIf="viewMode === 'list'">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Type</th>
                <th>Status</th>
                <th>Recipients</th>
                <th>Open Rate</th>
                <th>Click Rate</th>
                <th>Conversion</th>
                <th>Start Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let campaign of filteredCampaigns">
                <td>
                  <div>
                    <h6 class="mb-1">{{ campaign.name }}</h6>
                    <small class="text-muted">{{ campaign.description | slice:0:50 }}...</small>
                  </div>
                </td>
                <td>
                  <span class="badge bg-secondary">
                    <i class="fas" [ngClass]="getTypeIcon(campaign.type)"></i>
                    {{ campaign.type | titlecase }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(campaign.status)">
                    {{ campaign.status | titlecase }}
                  </span>
                </td>
                <td>{{ campaign.totalRecipients | number }}</td>
                <td>
                  <div class="d-flex align-items-center">
                    <span>{{ campaign.openRate }}%</span>
                    <div class="progress ms-2" style="width: 60px; height: 4px;">
                      <div class="progress-bar bg-info" [style.width.%]="campaign.openRate"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <span>{{ campaign.clickRate }}%</span>
                    <div class="progress ms-2" style="width: 60px; height: 4px;">
                      <div class="progress-bar bg-warning" [style.width.%]="campaign.clickRate"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="d-flex align-items-center">
                    <span>{{ campaign.conversionRate }}%</span>
                    <div class="progress ms-2" style="width: 60px; height: 4px;">
                      <div class="progress-bar bg-success" [style.width.%]="campaign.conversionRate"></div>
                    </div>
                  </div>
                </td>
                <td>{{ campaign.startDate | date:'short' }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" [routerLink]="['/messages/campaigns', campaign.id]">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-secondary" 
                            [routerLink]="['/messages/campaigns', campaign.id, 'edit']"
                            *ngIf="campaign.status === 'draft'">
                      <i class="fas fa-edit"></i>
                    </button>
                    <div class="dropdown">
                      <button class="btn btn-outline-secondary dropdown-toggle" 
                              type="button" 
                              [id]="'listActions' + campaign.id"
                              data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <ul class="dropdown-menu" [attr.aria-labelledby]="'listActions' + campaign.id">
                        <li><a class="dropdown-item" href="#" (click)="duplicateCampaign(campaign)">
                          <i class="fas fa-copy"></i> Duplicate
                        </a></li>
                        <li><a class="dropdown-item" href="#" (click)="pauseCampaign(campaign)" 
                               *ngIf="campaign.status === CampaignStatus.ACTIVE">
                          <i class="fas fa-pause"></i> Pause
                        </a></li>
                        <li><a class="dropdown-item" href="#" (click)="resumeCampaign(campaign)" 
                               *ngIf="campaign.status === 'paused'">
                          <i class="fas fa-play"></i> Resume
                        </a></li>
                        <li><a class="dropdown-item text-danger" href="#" (click)="deleteCampaign(campaign)">
                          <i class="fas fa-trash"></i> Delete
                        </a></li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state text-center py-5" *ngIf="filteredCampaigns.length === 0">
        <i class="fas fa-bullhorn fa-3x text-muted mb-3"></i>
        <h4>No campaigns found</h4>
        <p class="text-muted">Create your first marketing campaign to get started</p>
        <button class="btn btn-primary" routerLink="/messages/campaigns/new">
          <i class="fas fa-plus"></i>
          Create Campaign
        </button>
      </div>

      <!-- Pagination -->
      <nav *ngIf="filteredCampaigns.length > 0" class="mt-4">
        <ul class="pagination justify-content-center">
          <li class="page-item" [class.disabled]="currentPage === 1">
            <a class="page-link" href="#" (click)="changePage(currentPage - 1)">Previous</a>
          </li>
          <li class="page-item" 
              *ngFor="let page of getPageNumbers()" 
              [class.active]="page === currentPage">
            <a class="page-link" href="#" (click)="changePage(page)">{{ page }}</a>
          </li>
          <li class="page-item" [class.disabled]="currentPage === totalPages">
            <a class="page-link" href="#" (click)="changePage(currentPage + 1)">Next</a>
          </li>
        </ul>
      </nav>
    </div>
  `,
  styles: [`
    .campaigns-container {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1px solid #e9ecef;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1rem;
      color: white;
    }

    .stat-content {
      flex-grow: 1;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .campaign-card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border: 1px solid #e9ecef;
      transition: transform 0.2s, box-shadow 0.2s;
      height: 100%;
    }

    .campaign-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .campaign-header {
      padding: 1.25rem 1.25rem 0;
    }

    .campaign-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #495057;
    }

    .campaign-content {
      padding: 1.25rem;
    }

    .campaign-description {
      color: #6c757d;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .campaign-dates {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .campaign-dates small {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .campaign-metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .metric {
      text-align: center;
      padding: 0.75rem;
      background-color: #f8f9fa;
      border-radius: 0.25rem;
    }

    .metric-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #495057;
    }

    .metric-label {
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }

    .campaign-progress {
      margin-bottom: 1rem;
    }

    .campaign-progress .progress {
      height: 6px;
      margin-bottom: 0.5rem;
    }

    .campaign-tags {
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

    .btn-group.active .btn {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }

    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
    }

    .empty-state {
      background-color: #f8f9fa;
      border-radius: 0.5rem;
      margin: 2rem 0;
    }

    .badge {
      font-size: 0.75rem;
    }

    .badge i {
      margin-right: 0.25rem;
    }

    @media (max-width: 768px) {
      .campaigns-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-actions {
        justify-content: center;
      }

      .campaign-metrics {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }

      .metric {
        padding: 0.5rem;
      }

      .table-responsive {
        font-size: 0.875rem;
      }
    }
  `]
})
export class CampaignsComponent implements OnInit, OnDestroy {
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  sortBy = 'createdAt';
  viewMode: 'grid' | 'list' = 'grid';
  
  // Make enums available in template
  CampaignType = CampaignType;
  CampaignStatus = CampaignStatus;
  
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;
  
  stats: CampaignStats = {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRecipients: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    avgConversionRate: 0,
    totalSpent: 0,
    roi: 0
  };
  
  private destroy$ = new Subject<void>();

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCampaigns(): void {
    this.messagesService.getCampaigns().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.campaigns = Array.isArray(response) ? response : response.data || [];
        this.filterCampaigns();
        this.loadStats();
      },
      error: (error: any) => {
        console.error('Error loading campaigns:', error);
      }
    });
  }

  loadStats(): void {
    // Calculate stats from campaigns data
    const totalRecipients = this.campaigns.reduce((sum, c) => sum + (c.totalRecipients || 0), 0);
    const openRates = this.campaigns.filter(c => c.openRate !== undefined).map(c => c.openRate || 0);
    const clickRates = this.campaigns.filter(c => c.clickRate !== undefined).map(c => c.clickRate || 0);
    const conversionRates = this.campaigns.filter(c => c.conversionRate !== undefined).map(c => c.conversionRate || 0);
    
    this.stats = {
      totalCampaigns: this.campaigns.length,
      activeCampaigns: this.campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length,
      totalRecipients: totalRecipients,
      avgOpenRate: openRates.length > 0 ? Math.round(openRates.reduce((sum, rate) => sum + rate, 0) / openRates.length) : 0,
      avgClickRate: clickRates.length > 0 ? Math.round(clickRates.reduce((sum, rate) => sum + rate, 0) / clickRates.length) : 0,
      avgConversionRate: conversionRates.length > 0 ? Math.round(conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length) : 0,
      totalSpent: this.campaigns.reduce((sum, c) => sum + (c.spent || 0), 0),
      roi: 0 // Calculate based on business logic
    };
  }

  filterCampaigns(): void {
    let filtered = this.campaigns.filter(campaign => {
      const matchesSearch = !this.searchTerm || 
        campaign.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesType = !this.selectedType || campaign.type === this.selectedType;
      const matchesStatus = !this.selectedStatus || campaign.status === this.selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    this.sortCampaigns(filtered);
    this.updatePagination(filtered);
  }

  sortCampaigns(campaigns: Campaign[] = this.filteredCampaigns): void {
    campaigns.sort((a, b) => {
      const aValue = a[this.sortBy as keyof Campaign];
      const bValue = b[this.sortBy as keyof Campaign];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return bValue - aValue; // Descending order for numbers
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return bValue.getTime() - aValue.getTime(); // Descending order for dates
      }
      
      return 0;
    });
  }

  updatePagination(campaigns: Campaign[]): void {
    this.totalPages = Math.ceil(campaigns.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredCampaigns = campaigns.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.filterCampaigns();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  duplicateCampaign(campaign: Campaign): void {
    const duplicateData: Partial<MessageCampaign> = {
      name: `${campaign.name} (Copy)`,
      description: campaign.description,
      type: campaign.type,
      status: CampaignStatus.DRAFT,
      templateId: campaign.templateId,
      targetAudience: campaign.targetAudience,
      deliveryMethod: campaign.deliveryMethod,
      settings: campaign.settings,
      createdBy: campaign.createdBy
    };
    
    this.messagesService.createCampaign(duplicateData).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error: any) => {
          console.error('Error duplicating campaign:', error);
        }
    });
  }

  pauseCampaign(campaign: Campaign): void {
    if (confirm('Are you sure you want to pause this campaign?')) {
      this.messagesService.updateCampaignStatus(campaign.id, CampaignStatus.PAUSED).subscribe({
        next: () => {
          this.loadCampaigns();
        },
        error: (error: any) => {
          console.error('Error pausing campaign:', error);
        }
      });
    }
  }

  resumeCampaign(campaign: Campaign): void {
    this.messagesService.updateCampaignStatus(campaign.id, CampaignStatus.ACTIVE).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error: any) => {
          console.error('Error resuming campaign:', error);
        }
    });
  }

  archiveCampaign(campaign: Campaign): void {
    if (confirm('Are you sure you want to archive this campaign?')) {
      this.messagesService.updateCampaignStatus(campaign.id, CampaignStatus.CANCELLED).subscribe({
        next: () => {
          this.loadCampaigns();
        },
        error: (error: any) => {
        console.error('Error archiving campaign:', error);
      }
      });
    }
  }

  deleteCampaign(campaign: Campaign): void {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      this.messagesService.deleteCampaign(campaign.id).subscribe({
        next: () => {
          this.loadCampaigns();
        },
        error: (error: any) => {
          console.error('Error deleting campaign:', error);
        }
      });
    }
  }

  exportCampaigns(): void {
    this.messagesService.exportCampaigns().subscribe({
      next: (data: any) => {
        // Handle export download
        console.log('Campaigns exported successfully');
      },
      error: (error: any) => {
        console.error('Error exporting campaigns:', error);
      }
    });
  }

  getStatusBadgeClass(status: CampaignStatus): string {
    const classes: { [key in CampaignStatus]: string } = {
      [CampaignStatus.DRAFT]: 'bg-secondary',
      [CampaignStatus.ACTIVE]: 'bg-success',
      [CampaignStatus.PAUSED]: 'bg-warning',
      [CampaignStatus.COMPLETED]: 'bg-info',
      [CampaignStatus.SCHEDULED]: 'bg-primary',
      [CampaignStatus.CANCELLED]: 'bg-dark'
    };
    return classes[status] || 'bg-secondary';
  }

  getTypeIcon(type: CampaignType): string {
    const icons: { [key in CampaignType]: string } = {
       [CampaignType.PROMOTIONAL]: 'fa-bullhorn',
       [CampaignType.EDUCATIONAL]: 'fa-graduation-cap',
       [CampaignType.TRANSACTIONAL]: 'fa-receipt',
       [CampaignType.REMINDER]: 'fa-clock',
       [CampaignType.SURVEY]: 'fa-poll'
     };
    return icons[type] || 'fa-envelope';
  }
}