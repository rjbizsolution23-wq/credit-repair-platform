import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row" *ngIf="template">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="card-title mb-1">{{ template.name }}</h4>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" [ngClass]="getStatusBadgeClass(template.status)">
                    {{ template.status | titlecase }}
                  </span>
                  <span class="badge bg-light text-dark">{{ getCategoryLabel(template.category) }}</span>
                  <small class="text-muted">Created {{ template.createdAt | date:'medium' }}</small>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-primary" (click)="useTemplate()">
                  <i data-feather="send" appFeatherIcon></i>
                  Use Template
                </button>
                <button class="btn btn-outline-secondary" (click)="editTemplate()">
                  <i data-feather="edit" appFeatherIcon></i>
                  Edit
                </button>
                <div class="dropdown">
                  <button class="btn btn-outline-secondary dropdown-toggle" 
                          type="button" 
                          data-bs-toggle="dropdown">
                    <i data-feather="more-horizontal" appFeatherIcon></i>
                  </button>
                  <ul class="dropdown-menu">
                    <li>
                      <a class="dropdown-item" (click)="duplicateTemplate()">
                        <i data-feather="copy" appFeatherIcon class="me-2"></i>
                        Duplicate
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item" (click)="exportTemplate()">
                        <i data-feather="download" appFeatherIcon class="me-2"></i>
                        Export
                      </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li *ngIf="template.status === 'active'">
                      <a class="dropdown-item text-warning" (click)="archiveTemplate()">
                        <i data-feather="archive" appFeatherIcon class="me-2"></i>
                        Archive
                      </a>
                    </li>
                    <li *ngIf="template.status === 'archived'">
                      <a class="dropdown-item text-success" (click)="activateTemplate()">
                        <i data-feather="check-circle" appFeatherIcon class="me-2"></i>
                        Activate
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item text-danger" (click)="deleteTemplate()">
                        <i data-feather="trash-2" appFeatherIcon class="me-2"></i>
                        Delete
                      </a>
                    </li>
                  </ul>
                </div>
                <button class="btn btn-outline-secondary" (click)="goBack()">
                  <i data-feather="arrow-left" appFeatherIcon></i>
                  Back
                </button>
              </div>
            </div>
            
            <div class="row">
              <!-- Template Content -->
              <div class="col-md-8">
                <!-- Basic Information -->
                <div class="card mb-4">
                  <div class="card-header">
                    <h5 class="mb-0">Template Information</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label fw-medium">Category</label>
                          <p class="mb-0">{{ getCategoryLabel(template.category) }}</p>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label fw-medium">Type</label>
                          <p class="mb-0">
                            <i [attr.data-feather]="getTypeIcon(template.type)" appFeatherIcon class="me-1"></i>
                            {{ getTypeLabel(template.type) }}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div class="mb-3" *ngIf="template.description">
                      <label class="form-label fw-medium">Description</label>
                      <p class="mb-0">{{ template.description }}</p>
                    </div>
                    
                    <div class="row">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label fw-medium">Target Platforms</label>
                          <div class="d-flex flex-wrap gap-1">
                            <span *ngFor="let platform of template.platforms" 
                                  class="badge bg-primary">
                              <i [attr.data-feather]="getPlatformIcon(platform)" appFeatherIcon class="me-1"></i>
                              {{ getPlatformLabel(platform) }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6" *ngIf="template.tags">
                        <div class="mb-3">
                          <label class="form-label fw-medium">Tags</label>
                          <div class="d-flex flex-wrap gap-1">
                            <span *ngFor="let tag of getTagsArray(template.tags)" 
                                  class="badge bg-light text-dark">
                              {{ tag }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Content Preview -->
                <div class="card mb-4">
                  <div class="card-header">
                    <h5 class="mb-0">Content Preview</h5>
                  </div>
                  <div class="card-body">
                    <div class="border rounded p-3 mb-3" style="background-color: #f8f9fa;">
                      <div *ngIf="template.title" class="fw-bold mb-2">
                        {{ template.title }}
                      </div>
                      <div class="mb-2" style="white-space: pre-wrap;">{{ template.content }}</div>
                      <div *ngIf="template.hashtags" class="text-primary small mb-2">
                        {{ template.hashtags }}
                      </div>
                      <div *ngIf="template.callToAction" class="text-muted small">
                        {{ template.callToAction }}
                      </div>
                    </div>
                    
                    <div *ngIf="template.imageUrl" class="mb-3">
                      <label class="form-label fw-medium">Default Image</label>
                      <div class="border rounded p-2">
                        <img [src]="template.imageUrl" 
                             [alt]="template.name"
                             class="img-fluid rounded"
                             style="max-height: 200px;"
                             (error)="onImageError($event)">
                      </div>
                    </div>
                    
                    <div *ngIf="template.designNotes" class="mb-3">
                      <label class="form-label fw-medium">Design Notes</label>
                      <p class="mb-0 text-muted">{{ template.designNotes }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Usage Statistics -->
                <div class="card mb-4">
                  <div class="card-header">
                    <h5 class="mb-0">Usage Statistics</h5>
                  </div>
                  <div class="card-body">
                    <div class="row text-center">
                      <div class="col-md-3">
                        <div class="border rounded p-3">
                          <h4 class="text-primary mb-1">{{ template.stats.timesUsed }}</h4>
                          <small class="text-muted">Times Used</small>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="border rounded p-3">
                          <h4 class="text-success mb-1">{{ template.stats.totalReach | number }}</h4>
                          <small class="text-muted">Total Reach</small>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="border rounded p-3">
                          <h4 class="text-info mb-1">{{ template.stats.avgEngagement }}%</h4>
                          <small class="text-muted">Avg Engagement</small>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="border rounded p-3">
                          <h4 class="text-warning mb-1">{{ template.stats.lastUsed | date:'shortDate' }}</h4>
                          <small class="text-muted">Last Used</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Recent Usage -->
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0">Recent Usage</h5>
                  </div>
                  <div class="card-body">
                    <div *ngIf="template.recentUsage && template.recentUsage.length > 0; else noUsage">
                      <div class="table-responsive">
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Platform</th>
                              <th>Campaign</th>
                              <th>Performance</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr *ngFor="let usage of template.recentUsage">
                              <td>{{ usage.date | date:'shortDate' }}</td>
                              <td>
                                <span class="badge bg-secondary">
                                  <i [attr.data-feather]="getPlatformIcon(usage.platform)" appFeatherIcon class="me-1"></i>
                                  {{ getPlatformLabel(usage.platform) }}
                                </span>
                              </td>
                              <td>{{ usage.campaign }}</td>
                              <td>
                                <small class="text-muted">
                                  {{ usage.reach | number }} reach, {{ usage.engagement }}% engagement
                                </small>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <ng-template #noUsage>
                      <div class="text-center py-4">
                        <i data-feather="activity" appFeatherIcon class="text-muted mb-2" style="width: 48px; height: 48px;"></i>
                        <p class="text-muted mb-0">This template hasn't been used yet</p>
                      </div>
                    </ng-template>
                  </div>
                </div>
              </div>
              
              <!-- Sidebar -->
              <div class="col-md-4">
                <!-- Quick Actions -->
                <div class="card mb-4">
                  <div class="card-header">
                    <h5 class="mb-0">Quick Actions</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-grid gap-2">
                      <button class="btn btn-primary" (click)="useTemplate()">
                        <i data-feather="send" appFeatherIcon class="me-2"></i>
                        Create Post from Template
                      </button>
                      <button class="btn btn-outline-primary" (click)="schedulePost()">
                        <i data-feather="calendar" appFeatherIcon class="me-2"></i>
                        Schedule Post
                      </button>
                      <button class="btn btn-outline-secondary" (click)="addToCampaign()">
                        <i data-feather="plus-circle" appFeatherIcon class="me-2"></i>
                        Add to Campaign
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Template Variables -->
                <div class="card mb-4" *ngIf="getTemplateVariables().length > 0">
                  <div class="card-header">
                    <h5 class="mb-0">Template Variables</h5>
                  </div>
                  <div class="card-body">
                    <p class="small text-muted mb-2">This template uses the following variables:</p>
                    <div class="d-flex flex-wrap gap-1">
                      <span *ngFor="let variable of getTemplateVariables()" 
                            class="badge bg-light text-dark">
                        {{ variable }}
                      </span>
                    </div>
                    <small class="text-muted mt-2 d-block">
                      These will be replaced with actual values when using the template
                    </small>
                  </div>
                </div>
                
                <!-- Related Templates -->
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0">Related Templates</h5>
                  </div>
                  <div class="card-body">
                    <div *ngIf="relatedTemplates.length > 0; else noRelated">
                      <div *ngFor="let related of relatedTemplates" 
                           class="border rounded p-2 mb-2 cursor-pointer"
                           (click)="viewTemplate(related.id)">
                        <div class="fw-medium small">{{ related.name }}</div>
                        <div class="text-muted small">{{ related.category }}</div>
                      </div>
                    </div>
                    <ng-template #noRelated>
                      <p class="text-muted small mb-0">No related templates found</p>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div *ngIf="!template" class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Loading template details...</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
    }
    
    .cursor-pointer:hover {
      background-color: #f8f9fa;
    }
    
    .badge {
      font-size: 0.75em;
    }
  `]
})
export class TemplateDetailComponent implements OnInit {
  template: any = null;
  relatedTemplates: any[] = [];
  templateId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.templateId = params['id'];
      this.loadTemplate();
      this.loadRelatedTemplates();
    });
  }
  
  loadTemplate(): void {
    // Mock data - in a real app, this would come from a service
    this.template = {
      id: this.templateId,
      name: 'Credit Repair Success Story Template',
      category: 'testimonial',
      description: 'Template for sharing customer success stories and building trust with potential clients.',
      title: 'Amazing Credit Transformation!',
      content: `🎉 Congratulations to {customer_name} for improving their credit score by {score_improvement} points in just {timeframe}!

From {old_score} to {new_score} - this is what dedication and the right guidance can achieve.

Ready to start your own credit repair journey? {company_name} is here to help you every step of the way.

{call_to_action}`,
      hashtags: '#creditrepair #creditscore #financialfreedom #success #testimonial',
      callToAction: 'Contact us today for a free credit consultation!',
      tags: 'success story, testimonial, credit improvement, customer story',
      type: 'image',
      imageUrl: 'https://via.placeholder.com/600x400/007bff/ffffff?text=Success+Story',
      designNotes: 'Use bright, positive colors. Include before/after credit score graphics if possible.',
      platforms: ['facebook', 'linkedin', 'twitter'],
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z',
      stats: {
        timesUsed: 24,
        totalReach: 15420,
        avgEngagement: 4.2,
        lastUsed: '2024-01-25T09:15:00Z'
      },
      recentUsage: [
        {
          date: '2024-01-25T09:15:00Z',
          platform: 'facebook',
          campaign: 'January Success Stories',
          reach: 2340,
          engagement: 5.1
        },
        {
          date: '2024-01-22T14:30:00Z',
          platform: 'linkedin',
          campaign: 'Professional Network Outreach',
          reach: 1890,
          engagement: 3.8
        },
        {
          date: '2024-01-20T11:45:00Z',
          platform: 'twitter',
          campaign: 'Daily Inspiration',
          reach: 1250,
          engagement: 4.5
        }
      ]
    };
  }
  
  loadRelatedTemplates(): void {
    // Mock related templates
    this.relatedTemplates = [
      {
        id: '2',
        name: 'Credit Tips Educational Post',
        category: 'educational'
      },
      {
        id: '3',
        name: 'Service Promotion Template',
        category: 'promotional'
      },
      {
        id: '4',
        name: 'Customer Review Template',
        category: 'testimonial'
      }
    ];
  }
  
  getStatusBadgeClass(status: string): string {
    const classes = {
      'active': 'bg-success',
      'draft': 'bg-secondary',
      'archived': 'bg-warning'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }
  
  getCategoryLabel(category: string): string {
    const labels = {
      'promotional': 'Promotional',
      'educational': 'Educational',
      'announcement': 'Announcement',
      'testimonial': 'Testimonial',
      'seasonal': 'Seasonal',
      'engagement': 'Engagement',
      'other': 'Other'
    };
    return labels[category as keyof typeof labels] || category;
  }
  
  getTypeLabel(type: string): string {
    const labels = {
      'text': 'Text Only',
      'image': 'With Image',
      'video': 'With Video'
    };
    return labels[type as keyof typeof labels] || type;
  }
  
  getTypeIcon(type: string): string {
    const icons = {
      'text': 'type',
      'image': 'image',
      'video': 'video'
    };
    return icons[type as keyof typeof icons] || 'file-text';
  }
  
  getPlatformLabel(platform: string): string {
    const labels = {
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'instagram': 'Instagram',
      'youtube': 'YouTube'
    };
    return labels[platform as keyof typeof labels] || platform;
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
  
  getTagsArray(tags: string): string[] {
    return tags ? tags.split(',').map(tag => tag.trim()) : [];
  }
  
  getTemplateVariables(): string[] {
    const content = this.template?.content || '';
    const matches = content.match(/{[^}]+}/g);
    return matches ? [...new Set(matches as string[])] : [];
  }
  
  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/600x400/6c757d/ffffff?text=Image+Not+Found';
  }
  
  useTemplate(): void {
    this.router.navigate(['/social/posting/create'], { 
      queryParams: { templateId: this.templateId } 
    });
  }
  
  editTemplate(): void {
    this.router.navigate(['/social/sharing/templates', this.templateId, 'edit']);
  }
  
  schedulePost(): void {
    this.router.navigate(['/social/posting/schedule'], { 
      queryParams: { templateId: this.templateId } 
    });
  }
  
  addToCampaign(): void {
    // Open modal or navigate to campaign selection
    console.log('Adding template to campaign');
    alert('Add to campaign functionality would open here');
  }
  
  duplicateTemplate(): void {
    console.log('Duplicating template:', this.templateId);
    alert('Template duplicated successfully!');
  }
  
  exportTemplate(): void {
    const templateData = JSON.stringify(this.template, null, 2);
    const blob = new Blob([templateData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${this.template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  archiveTemplate(): void {
    if (confirm('Are you sure you want to archive this template?')) {
      this.template.status = 'archived';
      console.log('Archiving template:', this.templateId);
      alert('Template archived successfully!');
    }
  }
  
  activateTemplate(): void {
    this.template.status = 'active';
    console.log('Activating template:', this.templateId);
    alert('Template activated successfully!');
  }
  
  deleteTemplate(): void {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      console.log('Deleting template:', this.templateId);
      alert('Template deleted successfully!');
      this.router.navigate(['/social/sharing/templates']);
    }
  }
  
  viewTemplate(id: string): void {
    this.router.navigate(['/social/sharing/templates', id]);
  }
  
  goBack(): void {
    this.router.navigate(['/social/sharing/templates']);
  }
}