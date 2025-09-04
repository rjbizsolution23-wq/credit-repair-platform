import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FeatherIconDirective,
    FormsModule
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 class="card-title mb-1">Social Media Templates</h4>
                <p class="text-muted mb-0">Create and manage reusable content templates</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" (click)="importTemplate()">
                  <i data-feather="upload" appFeatherIcon class="me-2"></i>
                  Import
                </button>
                <button class="btn btn-primary" (click)="createTemplate()">
                  <i data-feather="plus" appFeatherIcon class="me-2"></i>
                  Create Template
                </button>
              </div>
            </div>
            
            <!-- Filters and Search -->
            <div class="row mb-4">
              <div class="col-md-4">
                <div class="input-group">
                  <span class="input-group-text">
                    <i data-feather="search" appFeatherIcon></i>
                  </span>
                  <input type="text" 
                         class="form-control" 
                         placeholder="Search templates..."
                         [(ngModel)]="searchTerm"
                         (input)="filterTemplates()">
                </div>
              </div>
              <div class="col-md-2">
                <select class="form-select" 
                        [(ngModel)]="selectedCategory"
                        (change)="filterTemplates()">
                  <option value="">All Categories</option>
                  <option value="promotional">Promotional</option>
                  <option value="educational">Educational</option>
                  <option value="announcement">Announcement</option>
                  <option value="testimonial">Testimonial</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="engagement">Engagement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="col-md-2">
                <select class="form-select" 
                        [(ngModel)]="selectedStatus"
                        (change)="filterTemplates()">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div class="col-md-2">
                <select class="form-select" 
                        [(ngModel)]="selectedType"
                        (change)="filterTemplates()">
                  <option value="">All Types</option>
                  <option value="text">Text Only</option>
                  <option value="image">With Image</option>
                  <option value="video">With Video</option>
                </select>
              </div>
              <div class="col-md-2">
                <div class="btn-group w-100" role="group">
                  <input type="radio" 
                         class="btn-check" 
                         name="viewMode" 
                         id="gridView" 
                         value="grid"
                         [(ngModel)]="viewMode">
                  <label class="btn btn-outline-secondary" for="gridView">
                    <i data-feather="grid" appFeatherIcon></i>
                  </label>
                  
                  <input type="radio" 
                         class="btn-check" 
                         name="viewMode" 
                         id="listView" 
                         value="list"
                         [(ngModel)]="viewMode">
                  <label class="btn btn-outline-secondary" for="listView">
                    <i data-feather="list" appFeatherIcon></i>
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ getTemplateCount('total') }}</h4>
                    <small>Total Templates</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ getTemplateCount('active') }}</h4>
                    <small>Active Templates</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-warning text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ getTemplateCount('draft') }}</h4>
                    <small>Draft Templates</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <h4 class="mb-1">{{ getMostUsedCategory() }}</h4>
                    <small>Most Used Category</small>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Templates Grid View -->
            <div *ngIf="viewMode === 'grid'" class="row">
              <div class="col-md-4 mb-4" *ngFor="let template of filteredTemplates">
                <div class="card h-100 template-card" (click)="viewTemplate(template.id)">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge" [ngClass]="getStatusBadgeClass(template.status)">
                        {{ template.status | titlecase }}
                      </span>
                      <span class="badge bg-light text-dark">{{ getCategoryLabel(template.category) }}</span>
                    </div>
                    <div class="dropdown" (click)="$event.stopPropagation()">
                      <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                              type="button" 
                              data-bs-toggle="dropdown">
                        <i data-feather="more-horizontal" appFeatherIcon></i>
                      </button>
                      <ul class="dropdown-menu">
                        <li>
                          <a class="dropdown-item" (click)="useTemplate(template.id)">
                            <i data-feather="send" appFeatherIcon class="me-2"></i>
                            Use Template
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item" (click)="editTemplate(template.id)">
                            <i data-feather="edit" appFeatherIcon class="me-2"></i>
                            Edit
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item" (click)="duplicateTemplate(template.id)">
                            <i data-feather="copy" appFeatherIcon class="me-2"></i>
                            Duplicate
                          </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li *ngIf="template.status === 'active'">
                          <a class="dropdown-item text-warning" (click)="archiveTemplate(template.id)">
                            <i data-feather="archive" appFeatherIcon class="me-2"></i>
                            Archive
                          </a>
                        </li>
                        <li *ngIf="template.status === 'archived'">
                          <a class="dropdown-item text-success" (click)="activateTemplate(template.id)">
                            <i data-feather="check-circle" appFeatherIcon class="me-2"></i>
                            Activate
                          </a>
                        </li>
                        <li>
                          <a class="dropdown-item text-danger" (click)="deleteTemplate(template.id)">
                            <i data-feather="trash-2" appFeatherIcon class="me-2"></i>
                            Delete
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div class="card-body">
                    <h5 class="card-title mb-2">{{ template.name }}</h5>
                    <p class="card-text text-muted small mb-3">{{ template.description }}</p>
                    
                    <div class="mb-3">
                      <div class="text-truncate small" style="max-height: 60px; overflow: hidden;">
                        {{ template.content }}
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="d-flex gap-1">
                        <span *ngFor="let platform of template.platforms" 
                              class="badge bg-secondary small">
                          <i [attr.data-feather]="getPlatformIcon(platform)" appFeatherIcon class="me-1"></i>
                          {{ getPlatformLabel(platform) }}
                        </span>
                      </div>
                      <div class="text-end">
                        <i [attr.data-feather]="getTypeIcon(template.type)" appFeatherIcon class="text-muted"></i>
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-between text-muted small">
                      <span>Used {{ template.stats.timesUsed }} times</span>
                      <span>{{ template.updatedAt | date:'shortDate' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Templates List View -->
            <div *ngIf="viewMode === 'list'" class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Platforms</th>
                    <th>Status</th>
                    <th>Usage</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let template of filteredTemplates" 
                      class="cursor-pointer"
                      (click)="viewTemplate(template.id)">
                    <td>
                      <div>
                        <div class="fw-medium">{{ template.name }}</div>
                        <div class="text-muted small">{{ template.description }}</div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-light text-dark">{{ getCategoryLabel(template.category) }}</span>
                    </td>
                    <td>
                      <i [attr.data-feather]="getTypeIcon(template.type)" appFeatherIcon class="me-1"></i>
                      {{ getTypeLabel(template.type) }}
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        <span *ngFor="let platform of template.platforms" 
                              class="badge bg-secondary small">
                          {{ getPlatformLabel(platform) }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(template.status)">
                        {{ template.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ template.stats.timesUsed }} times</td>
                    <td>{{ template.updatedAt | date:'shortDate' }}</td>
                    <td (click)="$event.stopPropagation()">
                      <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown">
                          <i data-feather="more-horizontal" appFeatherIcon></i>
                        </button>
                        <ul class="dropdown-menu">
                          <li>
                            <a class="dropdown-item" (click)="useTemplate(template.id)">
                              <i data-feather="send" appFeatherIcon class="me-2"></i>
                              Use Template
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" (click)="editTemplate(template.id)">
                              <i data-feather="edit" appFeatherIcon class="me-2"></i>
                              Edit
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" (click)="duplicateTemplate(template.id)">
                              <i data-feather="copy" appFeatherIcon class="me-2"></i>
                              Duplicate
                            </a>
                          </li>
                          <li><hr class="dropdown-divider"></li>
                          <li>
                            <a class="dropdown-item text-danger" (click)="deleteTemplate(template.id)">
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
            </div>
            
            <!-- Empty State -->
            <div *ngIf="filteredTemplates.length === 0" class="text-center py-5">
              <i data-feather="file-text" appFeatherIcon class="text-muted mb-3" style="width: 64px; height: 64px;"></i>
              <h5 class="text-muted">No templates found</h5>
              <p class="text-muted mb-4">
                <span *ngIf="searchTerm || selectedCategory || selectedStatus || selectedType">
                  Try adjusting your filters or search terms.
                </span>
                <span *ngIf="!searchTerm && !selectedCategory && !selectedStatus && !selectedType">
                  Create your first template to get started with consistent social media content.
                </span>
              </p>
              <button class="btn btn-primary" (click)="createTemplate()">
                <i data-feather="plus" appFeatherIcon class="me-2"></i>
                Create Your First Template
              </button>
            </div>
            
            <!-- Pagination -->
            <div *ngIf="filteredTemplates.length > 0" class="d-flex justify-content-between align-items-center mt-4">
              <div class="text-muted">
                Showing {{ filteredTemplates.length }} of {{ templates.length }} templates
              </div>
              <nav *ngIf="totalPages > 1">
                <ngb-pagination 
                  [(page)]="currentPage"
                  [pageSize]="pageSize"
                  [collectionSize]="filteredTemplates.length"
                  [maxSize]="5"
                  [rotate]="true"
                  [boundaryLinks]="true">
                </ngb-pagination>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .template-card {
      cursor: pointer;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }
    
    .template-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .cursor-pointer {
      cursor: pointer;
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    .table th {
      border-top: none;
      font-weight: 600;
    }
  `]
})
export class TemplatesListComponent implements OnInit {
  templates: any[] = [];
  filteredTemplates: any[] = [];
  
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';
  selectedType: string = '';
  viewMode: string = 'grid';
  
  currentPage: number = 1;
  pageSize: number = 12;
  totalPages: number = 1;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadTemplates();
  }
  
  loadTemplates(): void {
    // Mock data - in a real app, this would come from a service
    this.templates = [
      {
        id: '1',
        name: 'Credit Repair Success Story',
        category: 'testimonial',
        description: 'Template for sharing customer success stories and building trust.',
        content: '🎉 Congratulations to {customer_name} for improving their credit score by {score_improvement} points!',
        type: 'image',
        platforms: ['facebook', 'linkedin', 'twitter'],
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
        stats: { timesUsed: 24, totalReach: 15420, avgEngagement: 4.2 }
      },
      {
        id: '2',
        name: 'Credit Tips Educational Post',
        category: 'educational',
        description: 'Educational content about credit improvement tips and strategies.',
        content: '💡 Credit Tip of the Day: {tip_content}. Remember, small steps lead to big improvements!',
        type: 'text',
        platforms: ['facebook', 'twitter'],
        status: 'active',
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-18T11:30:00Z',
        stats: { timesUsed: 18, totalReach: 8950, avgEngagement: 3.8 }
      },
      {
        id: '3',
        name: 'Service Promotion Template',
        category: 'promotional',
        description: 'Promote credit repair services with compelling call-to-action.',
        content: '🚀 Ready to transform your credit score? Our expert team has helped thousands achieve their financial goals.',
        type: 'image',
        platforms: ['facebook', 'linkedin', 'instagram'],
        status: 'active',
        createdAt: '2024-01-05T16:20:00Z',
        updatedAt: '2024-01-22T13:15:00Z',
        stats: { timesUsed: 31, totalReach: 22340, avgEngagement: 5.1 }
      },
      {
        id: '4',
        name: 'Holiday Greetings',
        category: 'seasonal',
        description: 'Seasonal greetings template for holidays and special occasions.',
        content: '🎄 Wishing you and your family a wonderful {holiday_name}! May the new year bring financial prosperity.',
        type: 'image',
        platforms: ['facebook', 'linkedin', 'twitter', 'instagram'],
        status: 'archived',
        createdAt: '2023-12-01T12:00:00Z',
        updatedAt: '2024-01-02T10:00:00Z',
        stats: { timesUsed: 12, totalReach: 6780, avgEngagement: 6.2 }
      },
      {
        id: '5',
        name: 'FAQ Response Template',
        category: 'engagement',
        description: 'Template for responding to frequently asked questions.',
        content: '❓ Great question! {question_answer}. Feel free to reach out if you have more questions!',
        type: 'text',
        platforms: ['facebook', 'twitter'],
        status: 'draft',
        createdAt: '2024-01-25T14:30:00Z',
        updatedAt: '2024-01-25T14:30:00Z',
        stats: { timesUsed: 0, totalReach: 0, avgEngagement: 0 }
      },
      {
        id: '6',
        name: 'Company Announcement',
        category: 'announcement',
        description: 'Template for important company announcements and updates.',
        content: '📢 Important Update: {announcement_content}. We appreciate your continued trust in our services.',
        type: 'text',
        platforms: ['facebook', 'linkedin', 'twitter'],
        status: 'active',
        createdAt: '2024-01-12T11:45:00Z',
        updatedAt: '2024-01-19T15:20:00Z',
        stats: { timesUsed: 8, totalReach: 4560, avgEngagement: 2.9 }
      }
    ];
    
    this.filterTemplates();
  }
  
  filterTemplates(): void {
    this.filteredTemplates = this.templates.filter(template => {
      const matchesSearch = !this.searchTerm || 
        template.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || template.category === this.selectedCategory;
      const matchesStatus = !this.selectedStatus || template.status === this.selectedStatus;
      const matchesType = !this.selectedType || template.type === this.selectedType;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesType;
    });
    
    this.totalPages = Math.ceil(this.filteredTemplates.length / this.pageSize);
  }
  
  getTemplateCount(type: string): number {
    switch (type) {
      case 'total':
        return this.templates.length;
      case 'active':
        return this.templates.filter(t => t.status === 'active').length;
      case 'draft':
        return this.templates.filter(t => t.status === 'draft').length;
      case 'archived':
        return this.templates.filter(t => t.status === 'archived').length;
      default:
        return 0;
    }
  }
  
  getMostUsedCategory(): string {
    const categoryCount: { [key: string]: number } = {};
    this.templates.forEach(template => {
      categoryCount[template.category] = (categoryCount[template.category] || 0) + template.stats.timesUsed;
    });
    
    const mostUsed = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'promotional'
    );
    
    return this.getCategoryLabel(mostUsed);
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
  
  createTemplate(): void {
    this.router.navigate(['/social/sharing/templates/create']);
  }
  
  viewTemplate(id: string): void {
    this.router.navigate(['/social/sharing/templates', id]);
  }
  
  editTemplate(id: string): void {
    this.router.navigate(['/social/sharing/templates', id, 'edit']);
  }
  
  useTemplate(id: string): void {
    this.router.navigate(['/social/posting/create'], { 
      queryParams: { templateId: id } 
    });
  }
  
  duplicateTemplate(id: string): void {
    console.log('Duplicating template:', id);
    alert('Template duplicated successfully!');
    // In a real app, this would create a copy of the template
  }
  
  archiveTemplate(id: string): void {
    if (confirm('Are you sure you want to archive this template?')) {
      const template = this.templates.find(t => t.id === id);
      if (template) {
        template.status = 'archived';
        this.filterTemplates();
      }
      console.log('Archiving template:', id);
    }
  }
  
  activateTemplate(id: string): void {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.status = 'active';
      this.filterTemplates();
    }
    console.log('Activating template:', id);
  }
  
  deleteTemplate(id: string): void {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      this.templates = this.templates.filter(t => t.id !== id);
      this.filterTemplates();
      console.log('Deleting template:', id);
    }
  }
  
  importTemplate(): void {
    // In a real app, this would open a file picker
    console.log('Import template functionality');
    alert('Import template functionality would open here');
  }
}