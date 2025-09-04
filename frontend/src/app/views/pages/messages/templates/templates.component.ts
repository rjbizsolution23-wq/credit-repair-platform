import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { MessageTemplate } from '../messages.model';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="templates-container">
      <!-- Header -->
      <div class="templates-header">
        <div class="header-content">
          <h2>Message Templates</h2>
          <p class="text-muted">Manage and organize your message templates</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="createTemplate()">
            <i class="fas fa-plus"></i>
            New Template
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input type="text" 
                     class="form-control" 
                     placeholder="Search templates..."
                     [(ngModel)]="searchTerm"
                     (input)="filterTemplates()">
            </div>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="selectedType" (change)="filterTemplates()">
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="notification">Notification</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="selectedCategory" (change)="filterTemplates()">
              <option value="">All Categories</option>
              <option value="welcome">Welcome</option>
              <option value="follow-up">Follow-up</option>
              <option value="reminder">Reminder</option>
              <option value="notification">Notification</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="selectedStatus" (change)="filterTemplates()">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" [(ngModel)]="sortBy" (change)="sortTemplates()">
              <option value="name">Name</option>
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="usageCount">Usage Count</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Templates Grid -->
      <div class="templates-grid" *ngIf="filteredTemplates.length > 0">
        <div class="template-card" *ngFor="let template of filteredTemplates; trackBy: trackByTemplateId">
          <div class="template-header">
            <div class="template-info">
              <h5 class="template-name">{{ template.name }}</h5>
              <div class="template-meta">
                <span class="badge" [class]="'badge-' + template.type">{{ template.type }}</span>
                <span class="category">{{ template.category }}</span>
                <span class="usage-count">{{ template.usageCount }} uses</span>
              </div>
            </div>
            <div class="template-actions">
              <div class="form-check form-switch">
                <input class="form-check-input" 
                       type="checkbox" 
                       [checked]="template.isActive"
                       (change)="toggleTemplateStatus(template)">
                <label class="form-check-label">Active</label>
              </div>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        data-bs-toggle="dropdown">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" (click)="editTemplate(template)">
                    <i class="fas fa-edit"></i> Edit
                  </a></li>
                  <li><a class="dropdown-item" (click)="duplicateTemplate(template)">
                    <i class="fas fa-copy"></i> Duplicate
                  </a></li>
                  <li><a class="dropdown-item" (click)="useTemplate(template)">
                    <i class="fas fa-paper-plane"></i> Use Template
                  </a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" (click)="exportTemplate(template)">
                    <i class="fas fa-download"></i> Export
                  </a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" (click)="deleteTemplate(template)">
                    <i class="fas fa-trash"></i> Delete
                  </a></li>
                </ul>
              </div>
            </div>
          </div>

          <div class="template-content">
            <div class="template-subject" *ngIf="template.subject">
              <strong>Subject:</strong> {{ template.subject }}
            </div>
            <div class="template-preview">
              <div class="content-preview" [innerHTML]="getPreviewContent(template.content)"></div>
            </div>
          </div>

          <div class="template-footer">
            <div class="template-tags" *ngIf="template.tags?.length">
              <span class="tag" *ngFor="let tag of template.tags">{{ tag }}</span>
            </div>
            <div class="template-dates">
              <small class="text-muted">
                Created: {{ template.createdAt | date:'short' }} by {{ template.createdBy }}
              </small>
              <small class="text-muted" *ngIf="template.updatedAt !== template.createdAt">
                Updated: {{ template.updatedAt | date:'short' }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredTemplates.length === 0">
        <div class="empty-state-content">
          <i class="fas fa-file-alt empty-state-icon"></i>
          <h4>No Templates Found</h4>
          <p class="text-muted">
            {{ searchTerm || selectedType || selectedCategory ? 
               'No templates match your current filters.' : 
               'You haven\'t created any message templates yet.' }}
          </p>
          <button class="btn btn-primary" (click)="createTemplate()">
            <i class="fas fa-plus"></i>
            Create Your First Template
          </button>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div class="bulk-actions" *ngIf="selectedTemplates.length > 0">
        <div class="bulk-actions-content">
          <span class="selection-count">{{ selectedTemplates.length }} template(s) selected</span>
          <div class="bulk-buttons">
            <button class="btn btn-outline-primary" (click)="bulkActivate()">
              <i class="fas fa-check"></i> Activate
            </button>
            <button class="btn btn-outline-secondary" (click)="bulkDeactivate()">
              <i class="fas fa-times"></i> Deactivate
            </button>
            <button class="btn btn-outline-info" (click)="bulkExport()">
              <i class="fas fa-download"></i> Export
            </button>
            <button class="btn btn-outline-danger" (click)="bulkDelete()">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .templates-container {
      padding: 1.5rem;
    }

    .templates-header {
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

    .filters-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .template-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      transition: all 0.2s ease;
    }

    .template-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #2196f3;
    }

    .template-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .template-name {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .template-meta {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .badge-email {
      background: #e3f2fd;
      color: #1976d2;
    }

    .badge-sms {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .badge-notification {
      background: #e8f5e8;
      color: #388e3c;
    }

    .category {
      font-size: 0.875rem;
      color: #6c757d;
      text-transform: capitalize;
    }

    .usage-count {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .template-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .template-content {
      margin-bottom: 1rem;
    }

    .template-subject {
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .content-preview {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.25rem;
      border-left: 3px solid #2196f3;
      max-height: 100px;
      overflow: hidden;
      position: relative;
    }

    .content-preview::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 20px;
      background: linear-gradient(transparent, #f8f9fa);
    }

    .template-footer {
      border-top: 1px solid #e0e0e0;
      padding-top: 1rem;
    }

    .template-tags {
      margin-bottom: 0.75rem;
    }

    .tag {
      display: inline-block;
      background: #e0e0e0;
      color: #424242;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-right: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .template-dates {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state-icon {
      font-size: 4rem;
      color: #e0e0e0;
      margin-bottom: 1rem;
    }

    .empty-state h4 {
      margin-bottom: 0.5rem;
      color: #424242;
    }

    .bulk-actions {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    }

    .bulk-actions-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
    }

    .selection-count {
      font-weight: 500;
      color: #2196f3;
    }

    .bulk-buttons {
      display: flex;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .templates-container {
        padding: 1rem;
      }

      .templates-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .templates-grid {
        grid-template-columns: 1fr;
      }

      .template-header {
        flex-direction: column;
        gap: 1rem;
      }

      .template-actions {
        justify-content: space-between;
      }

      .bulk-actions-content {
        flex-direction: column;
        gap: 0.75rem;
      }

      .bulk-buttons {
        justify-content: center;
        flex-wrap: wrap;
      }
    }
  `]
})
export class TemplatesComponent implements OnInit, OnDestroy {
  templates: MessageTemplate[] = [];
  filteredTemplates: MessageTemplate[] = [];
  selectedTemplates: string[] = [];
  
  searchTerm = '';
  selectedType = '';
  selectedCategory = '';
  selectedStatus = '';
  sortBy = 'name';
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private messagesService: MessagesService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplates(): void {
    this.messagesService.getTemplates().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.templates = response.data || response;
        this.filterTemplates();
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  filterTemplates(): void {
    let filtered = [...this.templates];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(term) ||
        template.subject.toLowerCase().includes(term) ||
        template.content.toLowerCase().includes(term) ||
        template.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(template => template.type === this.selectedType);
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(template => template.category === this.selectedCategory);
    }

    // Status filter
    if (this.selectedStatus) {
      const isActive = this.selectedStatus === 'active';
      filtered = filtered.filter(template => template.isActive === isActive);
    }

    this.filteredTemplates = filtered;
    this.sortTemplates();
  }

  sortTemplates(): void {
    this.filteredTemplates.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'usageCount':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });
  }

  createTemplate(): void {
    this.router.navigate(['/messages/templates/new']);
  }

  editTemplate(template: MessageTemplate): void {
    this.router.navigate(['/messages/templates', template.id, 'edit']);
  }

  duplicateTemplate(template: MessageTemplate): void {
    this.messagesService.duplicateTemplate(template.id, `Copy of ${template.name}`).subscribe({
      next: () => {
        this.loadTemplates();
      }
    });
  }

  useTemplate(template: MessageTemplate): void {
    this.router.navigate(['/messages/compose'], {
      queryParams: { template: template.id }
    });
  }

  toggleTemplateStatus(template: MessageTemplate): void {
    this.messagesService.updateTemplateStatus(template.id, (!template.isActive).toString()).subscribe({
      next: () => {
        template.isActive = !template.isActive;
      }
    });
  }

  deleteTemplate(template: MessageTemplate): void {
    if (confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      this.messagesService.deleteTemplate(template.id).subscribe({
        next: () => {
          this.loadTemplates();
        }
      });
    }
  }

  exportTemplate(template: MessageTemplate): void {
    this.messagesService.exportTemplate(template.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  bulkActivate(): void {
    this.messagesService.bulkUpdateTemplateStatus(this.selectedTemplates, 'true').subscribe({
      next: () => {
        this.loadTemplates();
        this.selectedTemplates = [];
      }
    });
  }

  bulkDeactivate(): void {
    this.messagesService.bulkUpdateTemplateStatus(this.selectedTemplates, 'false').subscribe({
      next: () => {
        this.loadTemplates();
        this.selectedTemplates = [];
      }
    });
  }

  bulkExport(): void {
    this.messagesService.bulkExportTemplates(this.selectedTemplates).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'templates.zip';
        a.click();
        window.URL.revokeObjectURL(url);
        this.selectedTemplates = [];
      }
    });
  }

  bulkDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.selectedTemplates.length} template(s)?`)) {
      this.messagesService.bulkDeleteTemplates(this.selectedTemplates).subscribe({
        next: () => {
          this.loadTemplates();
          this.selectedTemplates = [];
        }
      });
    }
  }

  getPreviewContent(content: string): string {
    // Strip HTML tags and limit length for preview
    const stripped = content.replace(/<[^>]*>/g, '');
    return stripped.length > 150 ? stripped.substring(0, 150) + '...' : stripped;
  }

  trackByTemplateId(index: number, template: MessageTemplate): string {
    return template.id;
  }
}