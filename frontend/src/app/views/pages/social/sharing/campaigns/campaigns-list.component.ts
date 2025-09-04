import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="card-title">Social Media Campaigns</h4>
              <button class="btn btn-primary" (click)="createCampaign()">
                <i data-feather="plus" appFeatherIcon></i>
                Create Campaign
              </button>
            </div>
            
            <!-- Filters and Search -->
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="input-group">
                  <span class="input-group-text">
                    <i data-feather="search" appFeatherIcon></i>
                  </span>
                  <input type="text" class="form-control" placeholder="Search campaigns..."
                         [(ngModel)]="searchTerm" (input)="filterCampaigns()">
                </div>
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="statusFilter" (change)="filterCampaigns()">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="stopped">Stopped</option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="typeFilter" (change)="filterCampaigns()">
                  <option value="">All Types</option>
                  <option value="awareness">Brand Awareness</option>
                  <option value="lead-generation">Lead Generation</option>
                  <option value="engagement">Engagement</option>
                  <option value="conversion">Conversion</option>
                  <option value="retention">Customer Retention</option>
                </select>
              </div>
              <div class="col-md-2">
                <button class="btn btn-outline-secondary w-100" (click)="clearFilters()">
                  <i data-feather="x" appFeatherIcon></i>
                  Clear
                </button>
              </div>
            </div>
            
            <!-- Campaign Stats Overview -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h3 class="mb-1">{{ campaignStats.total }}</h3>
                    <p class="mb-0">Total Campaigns</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <h3 class="mb-1">{{ campaignStats.active }}</h3>
                    <p class="mb-0">Active Campaigns</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <h3 class="mb-1">{{ campaignStats.totalReach | number }}</h3>
                    <p class="mb-0">Total Reach</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-warning text-white">
                  <div class="card-body text-center">
                    <h3 class="mb-1">{{ campaignStats.totalLeads | number }}</h3>
                    <p class="mb-0">Total Leads</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Campaigns Table -->
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Platforms</th>
                    <th>Budget</th>
                    <th>Performance</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let campaign of filteredCampaigns">
                    <td>
                      <div class="d-flex align-items-center">
                        <div>
                          <div class="fw-medium">{{ campaign.name }}</div>
                          <small class="text-muted">{{ campaign.description | slice:0:50 }}{{ campaign.description.length > 50 ? '...' : '' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-light text-dark">{{ getCampaignTypeLabel(campaign.type) }}</span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(campaign.status)">
                        {{ campaign.status | titlecase }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        <span *ngFor="let platform of campaign.platforms" 
                              class="badge bg-secondary" 
                              [title]="platform | titlecase">
                          <i [attr.data-feather]="getPlatformIcon(platform)" appFeatherIcon></i>
                        </span>
                      </div>
                    </td>
                    <td>\${{ campaign.budget | number:'1.0-0' }}</td>
                    <td>
                      <div class="small">
                        <div class="d-flex justify-content-between">
                          <span>Reach:</span>
                          <span>{{ campaign.metrics.reach | number }}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span>Leads:</span>
                          <span>{{ campaign.metrics.leads | number }}</span>
                        </div>
                        <div class="progress mt-1" style="height: 4px;">
                          <div class="progress-bar bg-success" 
                               [style.width.%]="getProgressPercentage(campaign.metrics.reach, campaign.targetReach)"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="small">
                        <div>{{ campaign.startDate | date:'shortDate' }}</div>
                        <div class="text-muted">{{ campaign.endDate ? (campaign.endDate | date:'shortDate') : 'Ongoing' }}</div>
                      </div>
                    </td>
                    <td>
                      <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" 
                                [id]="'campaignActions' + campaign.id"
                                data-bs-toggle="dropdown">
                          <i data-feather="more-horizontal" appFeatherIcon></i>
                        </button>
                        <ul class="dropdown-menu" [attr.aria-labelledby]="'campaignActions' + campaign.id">
                          <li>
                            <a class="dropdown-item" (click)="viewCampaign(campaign.id)">
                              <i data-feather="eye" appFeatherIcon class="me-2"></i>
                              View Details
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" (click)="editCampaign(campaign.id)">
                              <i data-feather="edit" appFeatherIcon class="me-2"></i>
                              Edit
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" (click)="viewAnalytics(campaign.id)">
                              <i data-feather="bar-chart-2" appFeatherIcon class="me-2"></i>
                              Analytics
                            </a>
                          </li>
                          <li><hr class="dropdown-divider"></li>
                          <li *ngIf="campaign.status === 'active'">
                            <a class="dropdown-item text-warning" (click)="pauseCampaign(campaign.id)">
                              <i data-feather="pause" appFeatherIcon class="me-2"></i>
                              Pause
                            </a>
                          </li>
                          <li *ngIf="campaign.status === 'paused'">
                            <a class="dropdown-item text-success" (click)="resumeCampaign(campaign.id)">
                              <i data-feather="play" appFeatherIcon class="me-2"></i>
                              Resume
                            </a>
                          </li>
                          <li *ngIf="campaign.status !== 'completed' && campaign.status !== 'stopped'">
                            <a class="dropdown-item text-danger" (click)="stopCampaign(campaign.id)">
                              <i data-feather="stop-circle" appFeatherIcon class="me-2"></i>
                              Stop
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item text-danger" (click)="deleteCampaign(campaign.id)">
                              <i data-feather="trash-2" appFeatherIcon class="me-2"></i>
                              Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Empty State -->
              <div *ngIf="filteredCampaigns.length === 0" class="text-center py-5">
                <i data-feather="megaphone" appFeatherIcon class="text-muted" style="width: 48px; height: 48px;"></i>
                <h5 class="mt-3 text-muted">No campaigns found</h5>
                <p class="text-muted">
                  {{ campaigns.length === 0 ? 'Create your first social media campaign to get started.' : 'Try adjusting your filters to see more results.' }}
                </p>
                <button *ngIf="campaigns.length === 0" class="btn btn-primary" (click)="createCampaign()">
                  <i data-feather="plus" appFeatherIcon></i>
                  Create Your First Campaign
                </button>
              </div>
            </div>
            
            <!-- Pagination -->
            <nav *ngIf="filteredCampaigns.length > 0" class="mt-4">
              <ngb-pagination 
                [(page)]="currentPage" 
                [pageSize]="pageSize" 
                [collectionSize]="filteredCampaigns.length"
                [maxSize]="5"
                [rotate]="true"
                [boundaryLinks]="true">
              </ngb-pagination>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CampaignsListComponent implements OnInit {
  campaigns: any[] = [];
  filteredCampaigns: any[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  typeFilter: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  
  campaignStats = {
    total: 0,
    active: 0,
    totalReach: 0,
    totalLeads: 0
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }
  
  loadCampaigns(): void {
    // Mock data - in a real app, this would come from a service
    this.campaigns = [
      {
        id: '1',
        name: 'Credit Repair Awareness Campaign',
        description: 'Educational campaign focused on credit repair tips and success stories to build brand awareness and generate leads.',
        type: 'awareness',
        status: 'active',
        platforms: ['facebook', 'linkedin', 'twitter'],
        budget: 2500,
        targetReach: 50000,
        startDate: '2024-01-15',
        endDate: '2024-03-15',
        metrics: {
          reach: 42350,
          leads: 87,
          engagement: 2180
        }
      },
      {
        id: '2',
        name: 'Lead Generation Campaign',
        description: 'Targeted campaign to generate qualified leads for credit repair services.',
        type: 'lead-generation',
        status: 'active',
        platforms: ['facebook', 'instagram'],
        budget: 1800,
        targetReach: 30000,
        startDate: '2024-01-20',
        endDate: '2024-02-20',
        metrics: {
          reach: 28500,
          leads: 156,
          engagement: 1420
        }
      },
      {
        id: '3',
        name: 'Customer Success Stories',
        description: 'Showcase customer success stories to build trust and credibility.',
        type: 'engagement',
        status: 'paused',
        platforms: ['linkedin', 'youtube'],
        budget: 1200,
        targetReach: 20000,
        startDate: '2024-01-10',
        endDate: '2024-02-10',
        metrics: {
          reach: 15600,
          leads: 34,
          engagement: 890
        }
      },
      {
        id: '4',
        name: 'Holiday Promotion',
        description: 'Special holiday promotion for credit repair services.',
        type: 'conversion',
        status: 'completed',
        platforms: ['facebook', 'instagram', 'twitter'],
        budget: 3000,
        targetReach: 75000,
        startDate: '2023-12-01',
        endDate: '2023-12-31',
        metrics: {
          reach: 78200,
          leads: 245,
          engagement: 3560
        }
      },
      {
        id: '5',
        name: 'Educational Content Series',
        description: 'Weekly educational content about credit scores and financial literacy.',
        type: 'awareness',
        status: 'draft',
        platforms: ['linkedin', 'youtube'],
        budget: 800,
        targetReach: 15000,
        startDate: '2024-02-01',
        endDate: '',
        metrics: {
          reach: 0,
          leads: 0,
          engagement: 0
        }
      }
    ];
    
    this.calculateStats();
    this.filterCampaigns();
  }
  
  calculateStats(): void {
    this.campaignStats = {
      total: this.campaigns.length,
      active: this.campaigns.filter(c => c.status === 'active').length,
      totalReach: this.campaigns.reduce((sum, c) => sum + c.metrics.reach, 0),
      totalLeads: this.campaigns.reduce((sum, c) => sum + c.metrics.leads, 0)
    };
  }
  
  filterCampaigns(): void {
    this.filteredCampaigns = this.campaigns.filter(campaign => {
      const matchesSearch = !this.searchTerm || 
        campaign.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || campaign.status === this.statusFilter;
      const matchesType = !this.typeFilter || campaign.type === this.typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }
  
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.filterCampaigns();
  }
  
  getStatusBadgeClass(status: string): string {
    const classes = {
      'active': 'bg-success',
      'paused': 'bg-warning',
      'draft': 'bg-secondary',
      'completed': 'bg-primary',
      'stopped': 'bg-danger'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }
  
  getCampaignTypeLabel(type: string): string {
    const labels = {
      'awareness': 'Brand Awareness',
      'lead-generation': 'Lead Generation',
      'engagement': 'Engagement',
      'conversion': 'Conversion',
      'retention': 'Customer Retention'
    };
    return labels[type as keyof typeof labels] || type;
  }
  
  getPlatformIcon(platform: string): string {
    const icons = {
      'facebook': 'facebook',
      'twitter': 'twitter',
      'linkedin': 'linkedin',
      'instagram': 'instagram',
      'youtube': 'youtube'
    };
    return icons[platform as keyof typeof icons] || 'globe';
  }
  
  getProgressPercentage(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }
  
  createCampaign(): void {
    this.router.navigate(['/social/sharing/campaigns/create']);
  }
  
  viewCampaign(id: string): void {
    this.router.navigate(['/social/sharing/campaigns', id]);
  }
  
  editCampaign(id: string): void {
    this.router.navigate(['/social/sharing/campaigns', id, 'edit']);
  }
  
  viewAnalytics(id: string): void {
    this.router.navigate(['/social/analytics/campaigns', id]);
  }
  
  pauseCampaign(id: string): void {
    const campaign = this.campaigns.find(c => c.id === id);
    if (campaign) {
      campaign.status = 'paused';
      console.log('Pausing campaign:', id);
    }
  }
  
  resumeCampaign(id: string): void {
    const campaign = this.campaigns.find(c => c.id === id);
    if (campaign) {
      campaign.status = 'active';
      console.log('Resuming campaign:', id);
    }
  }
  
  stopCampaign(id: string): void {
    if (confirm('Are you sure you want to stop this campaign? This action cannot be undone.')) {
      const campaign = this.campaigns.find(c => c.id === id);
      if (campaign) {
        campaign.status = 'stopped';
        console.log('Stopping campaign:', id);
      }
    }
  }
  
  deleteCampaign(id: string): void {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      this.campaigns = this.campaigns.filter(c => c.id !== id);
      this.calculateStats();
      this.filterCampaigns();
      console.log('Deleting campaign:', id);
    }
  }
}