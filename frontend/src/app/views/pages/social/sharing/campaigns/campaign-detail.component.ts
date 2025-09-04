import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="card-title mb-1">{{ campaign.name }}</h4>
                <span class="badge" [ngClass]="getStatusBadgeClass(campaign.status)">
                  {{ campaign.status | titlecase }}
                </span>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary btn-sm" (click)="editCampaign()">
                  <i data-feather="edit" appFeatherIcon></i>
                  Edit
                </button>
                <button class="btn btn-outline-secondary btn-sm" (click)="goBack()">
                  <i data-feather="arrow-left" appFeatherIcon></i>
                  Back
                </button>
              </div>
            </div>
            
            <!-- Campaign Overview -->
            <div class="row">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Campaign Overview</h6>
                    
                    <div class="row mb-3">
                      <div class="col-md-6">
                        <strong>Campaign Type:</strong>
                        <p class="mb-0">{{ campaign.type | titlecase }}</p>
                      </div>
                      <div class="col-md-6">
                        <strong>Budget:</strong>
                        <p class="mb-0">\${{ campaign.budget | number:'1.2-2' }}</p>
                      </div>
                    </div>
                    
                    <div class="row mb-3">
                      <div class="col-md-6">
                        <strong>Start Date:</strong>
                        <p class="mb-0">{{ campaign.startDate | date:'mediumDate' }}</p>
                      </div>
                      <div class="col-md-6">
                        <strong>End Date:</strong>
                        <p class="mb-0">{{ campaign.endDate ? (campaign.endDate | date:'mediumDate') : 'Ongoing' }}</p>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Description:</strong>
                      <p class="mb-0">{{ campaign.description || 'No description provided' }}</p>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Target Platforms:</strong>
                      <div class="d-flex gap-2 mt-1">
                        <span *ngFor="let platform of campaign.platforms" 
                              class="badge bg-light text-dark">
                          <i [attr.data-feather]="getPlatformIcon(platform)" appFeatherIcon class="me-1"></i>
                          {{ platform | titlecase }}
                        </span>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Content Themes:</strong>
                      <div class="d-flex gap-2 mt-1 flex-wrap">
                        <span *ngFor="let theme of campaign.themes" 
                              class="badge bg-secondary">
                          {{ getThemeLabel(theme) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Performance Metrics -->
                <div class="card mt-4">
                  <div class="card-body">
                    <h6 class="card-title">Performance Metrics</h6>
                    
                    <div class="row">
                      <div class="col-md-3">
                        <div class="text-center">
                          <h4 class="text-primary mb-1">{{ metrics.reach | number }}</h4>
                          <p class="text-muted small mb-0">Total Reach</p>
                          <small class="text-success">
                            <i data-feather="trending-up" appFeatherIcon></i>
                            +{{ metrics.reachGrowth }}%
                          </small>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="text-center">
                          <h4 class="text-info mb-1">{{ metrics.engagement | number }}</h4>
                          <p class="text-muted small mb-0">Engagements</p>
                          <small class="text-success">
                            <i data-feather="trending-up" appFeatherIcon></i>
                            +{{ metrics.engagementGrowth }}%
                          </small>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="text-center">
                          <h4 class="text-warning mb-1">{{ metrics.leads | number }}</h4>
                          <p class="text-muted small mb-0">Leads Generated</p>
                          <small class="text-success">
                            <i data-feather="trending-up" appFeatherIcon></i>
                            +{{ metrics.leadsGrowth }}%
                          </small>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="text-center">
                          <h4 class="text-success mb-1">{{ metrics.conversions | number }}</h4>
                          <p class="text-muted small mb-0">Conversions</p>
                          <small class="text-success">
                            <i data-feather="trending-up" appFeatherIcon></i>
                            +{{ metrics.conversionGrowth }}%
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <hr>
                    
                    <div class="row">
                      <div class="col-md-6">
                        <div class="d-flex justify-content-between">
                          <span>Engagement Rate:</span>
                          <strong>{{ metrics.engagementRate }}%</strong>
                        </div>
                        <div class="progress mt-1" style="height: 6px;">
                          <div class="progress-bar bg-info" 
                               [style.width.%]="metrics.engagementRate"></div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="d-flex justify-content-between">
                          <span>Conversion Rate:</span>
                          <strong>{{ metrics.conversionRate }}%</strong>
                        </div>
                        <div class="progress mt-1" style="height: 6px;">
                          <div class="progress-bar bg-success" 
                               [style.width.%]="metrics.conversionRate"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Recent Posts -->
                <div class="card mt-4">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="card-title mb-0">Recent Posts</h6>
                      <button class="btn btn-outline-primary btn-sm" (click)="viewAllPosts()">
                        View All Posts
                      </button>
                    </div>
                    
                    <div class="table-responsive">
                      <table class="table table-hover">
                        <thead>
                          <tr>
                            <th>Content</th>
                            <th>Platform</th>
                            <th>Posted</th>
                            <th>Engagement</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let post of recentPosts">
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="me-2">
                                  <i [attr.data-feather]="getContentIcon(post.type)" appFeatherIcon></i>
                                </div>
                                <div>
                                  <div class="fw-medium">{{ post.title }}</div>
                                  <small class="text-muted">{{ post.preview }}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="badge bg-light text-dark">
                                <i [attr.data-feather]="getPlatformIcon(post.platform)" appFeatherIcon class="me-1"></i>
                                {{ post.platform | titlecase }}
                              </span>
                            </td>
                            <td>{{ post.postedAt | date:'short' }}</td>
                            <td>
                              <div class="small">
                                <div>{{ post.likes }} likes</div>
                                <div>{{ post.comments }} comments</div>
                              </div>
                            </td>
                            <td>
                              <span class="badge" [ngClass]="getPostStatusBadgeClass(post.status)">
                                {{ post.status | titlecase }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Campaign Settings & Target Audience -->
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">Target Audience</h6>
                    
                    <div class="mb-3">
                      <strong>Age Range:</strong>
                      <p class="mb-0">{{ campaign.ageMin }} - {{ campaign.ageMax }} years</p>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Gender:</strong>
                      <p class="mb-0">{{ campaign.gender | titlecase }}</p>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Location:</strong>
                      <p class="mb-0">{{ campaign.location || 'Not specified' }}</p>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Interests:</strong>
                      <p class="mb-0">{{ campaign.interests || 'Not specified' }}</p>
                    </div>
                  </div>
                </div>
                
                <div class="card mt-4">
                  <div class="card-body">
                    <h6 class="card-title">Campaign Goals</h6>
                    
                    <div class="mb-3">
                      <strong>Primary Goal:</strong>
                      <p class="mb-0">{{ getGoalLabel(campaign.primaryGoal) }}</p>
                    </div>
                    
                    <div class="mb-3">
                      <strong>Target Metrics:</strong>
                      <div class="small">
                        <div class="d-flex justify-content-between">
                          <span>Reach:</span>
                          <span>{{ campaign.targetReach | number }}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span>Engagement:</span>
                          <span>{{ campaign.targetEngagement | number }}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                          <span>Leads:</span>
                          <span>{{ campaign.targetLeads | number }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="card mt-4">
                  <div class="card-body">
                    <h6 class="card-title">Content Settings</h6>
                    
                    <div class="mb-3">
                      <strong>Posting Frequency:</strong>
                      <p class="mb-0">{{ getFrequencyLabel(campaign.postingFrequency) }}</p>
                    </div>
                    
                    <div class="mb-3" *ngIf="campaign.contentNotes">
                      <strong>Content Notes:</strong>
                      <p class="mb-0 small">{{ campaign.contentNotes }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="card mt-4">
                  <div class="card-body">
                    <h6 class="card-title">Quick Actions</h6>
                    
                    <div class="d-grid gap-2">
                      <button class="btn btn-outline-primary btn-sm" (click)="createPost()">
                        <i data-feather="plus" appFeatherIcon></i>
                        Create New Post
                      </button>
                      <button class="btn btn-outline-info btn-sm" (click)="viewAnalytics()">
                        <i data-feather="bar-chart-2" appFeatherIcon></i>
                        View Analytics
                      </button>
                      <button class="btn btn-outline-warning btn-sm" (click)="pauseCampaign()" 
                              *ngIf="campaign.status === 'active'">
                        <i data-feather="pause" appFeatherIcon></i>
                        Pause Campaign
                      </button>
                      <button class="btn btn-outline-success btn-sm" (click)="resumeCampaign()" 
                              *ngIf="campaign.status === 'paused'">
                        <i data-feather="play" appFeatherIcon></i>
                        Resume Campaign
                      </button>
                      <button class="btn btn-outline-danger btn-sm" (click)="stopCampaign()" 
                              *ngIf="campaign.status !== 'completed'">
                        <i data-feather="stop-circle" appFeatherIcon></i>
                        Stop Campaign
                      </button>
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
export class CampaignDetailComponent implements OnInit {
  campaignId: string = '';
  
  campaign = {
    id: '1',
    name: 'Credit Repair Awareness Campaign',
    description: 'Educational campaign focused on credit repair tips and success stories to build brand awareness and generate leads.',
    type: 'awareness',
    status: 'active',
    budget: 2500.00,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    platforms: ['facebook', 'linkedin', 'twitter'],
    themes: ['educational', 'success-stories', 'tips'],
    ageMin: 25,
    ageMax: 55,
    gender: 'all',
    location: 'United States',
    interests: 'Credit repair, personal finance, real estate',
    primaryGoal: 'brand-awareness',
    targetReach: 50000,
    targetEngagement: 2500,
    targetLeads: 100,
    postingFrequency: 'weekly',
    contentNotes: 'Focus on educational content with clear call-to-actions'
  };
  
  metrics = {
    reach: 42350,
    reachGrowth: 15.2,
    engagement: 2180,
    engagementGrowth: 8.7,
    leads: 87,
    leadsGrowth: 12.3,
    conversions: 23,
    conversionGrowth: 18.5,
    engagementRate: 5.2,
    conversionRate: 2.1
  };
  
  recentPosts = [
    {
      id: '1',
      title: '5 Quick Credit Score Boosting Tips',
      preview: 'Learn how to improve your credit score in just 30 days...',
      type: 'educational',
      platform: 'facebook',
      postedAt: '2024-01-20T10:00:00Z',
      likes: 156,
      comments: 23,
      status: 'published'
    },
    {
      id: '2',
      title: 'Success Story: From 520 to 750 Credit Score',
      preview: 'Meet Sarah, who transformed her credit in 6 months...',
      type: 'success-story',
      platform: 'linkedin',
      postedAt: '2024-01-18T14:30:00Z',
      likes: 89,
      comments: 12,
      status: 'published'
    },
    {
      id: '3',
      title: 'Understanding Credit Utilization',
      preview: 'What is credit utilization and how does it affect...',
      type: 'educational',
      platform: 'twitter',
      postedAt: '2024-01-16T09:15:00Z',
      likes: 67,
      comments: 8,
      status: 'published'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    // In a real app, you would load campaign data based on the ID
    this.loadCampaignData();
  }
  
  loadCampaignData(): void {
    // Simulate loading campaign data
    // In a real app, this would be a service call
    console.log('Loading campaign data for ID:', this.campaignId);
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
  
  getPostStatusBadgeClass(status: string): string {
    const classes = {
      'published': 'bg-success',
      'scheduled': 'bg-info',
      'draft': 'bg-secondary',
      'failed': 'bg-danger'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
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
  
  getContentIcon(type: string): string {
    const icons = {
      'educational': 'book-open',
      'success-story': 'award',
      'promotional': 'megaphone',
      'news': 'newspaper'
    };
    return icons[type as keyof typeof icons] || 'file-text';
  }
  
  getThemeLabel(theme: string): string {
    const labels = {
      'educational': 'Educational Content',
      'success-stories': 'Success Stories',
      'tips': 'Credit Tips',
      'industry-news': 'Industry News',
      'promotional': 'Promotional',
      'behind-scenes': 'Behind the Scenes'
    };
    return labels[theme as keyof typeof labels] || theme;
  }
  
  getGoalLabel(goal: string): string {
    const labels = {
      'brand-awareness': 'Increase Brand Awareness',
      'lead-generation': 'Generate Leads',
      'website-traffic': 'Drive Website Traffic',
      'engagement': 'Boost Engagement',
      'conversions': 'Increase Conversions'
    };
    return labels[goal as keyof typeof labels] || goal;
  }
  
  getFrequencyLabel(frequency: string): string {
    const labels = {
      'daily': 'Daily',
      'every-other-day': 'Every Other Day',
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-weekly',
      'monthly': 'Monthly'
    };
    return labels[frequency as keyof typeof labels] || frequency;
  }
  
  editCampaign(): void {
    this.router.navigate(['/social/sharing/campaigns', this.campaignId, 'edit']);
  }
  
  createPost(): void {
    this.router.navigate(['/social/content/posts/create'], {
      queryParams: { campaignId: this.campaignId }
    });
  }
  
  viewAnalytics(): void {
    this.router.navigate(['/social/analytics/campaigns', this.campaignId]);
  }
  
  viewAllPosts(): void {
    this.router.navigate(['/social/content/posts'], {
      queryParams: { campaignId: this.campaignId }
    });
  }
  
  pauseCampaign(): void {
    console.log('Pausing campaign:', this.campaignId);
    this.campaign.status = 'paused';
  }
  
  resumeCampaign(): void {
    console.log('Resuming campaign:', this.campaignId);
    this.campaign.status = 'active';
  }
  
  stopCampaign(): void {
    if (confirm('Are you sure you want to stop this campaign? This action cannot be undone.')) {
      console.log('Stopping campaign:', this.campaignId);
      this.campaign.status = 'stopped';
    }
  }
  
  goBack(): void {
    this.router.navigate(['/social/sharing/campaigns']);
  }
}