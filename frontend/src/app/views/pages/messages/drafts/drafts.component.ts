import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessagesService } from '../messages.service';
import { Message } from '../messages.model';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="drafts-messages">
      <div class="page-header">
        <h2>Draft Messages</h2>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="/messages/compose">
            <i class="fas fa-plus"></i> New Draft
          </button>
          <button class="btn btn-secondary" (click)="refreshDrafts()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div class="drafts-filters">
        <div class="filter-group">
          <label for="typeFilter">Type:</label>
          <select id="typeFilter" class="form-control" [(ngModel)]="typeFilter" (change)="applyFilters()">
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="notification">Notification</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="sortBy">Sort by:</label>
          <select id="sortBy" class="form-control" [(ngModel)]="sortBy" (change)="applyFilters()">
            <option value="lastModified">Last Modified</option>
            <option value="created">Date Created</option>
            <option value="subject">Subject</option>
          </select>
        </div>
        <div class="filter-group">
          <input type="text" class="form-control" placeholder="Search drafts..." [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
      </div>

      <div class="drafts-toolbar" *ngIf="selectedDrafts.length > 0">
        <span class="selection-count">{{ selectedDrafts.length }} selected</span>
        <button class="btn btn-sm btn-primary" (click)="sendDrafts()">Send Selected</button>
        <button class="btn btn-sm btn-secondary" (click)="duplicateDrafts()">Duplicate</button>
        <button class="btn btn-sm btn-danger" (click)="deleteDrafts()">Delete</button>
      </div>

      <div class="drafts-list" *ngIf="!loading && filteredDrafts.length > 0">
        <div class="draft-item" 
             *ngFor="let draft of filteredDrafts" 
             [class.selected]="isSelected(draft.id)"
             (click)="editDraft(draft.id)">
          <div class="draft-checkbox">
            <input type="checkbox" 
                   [checked]="isSelected(draft.id)"
                   (click)="$event.stopPropagation()"
                   (change)="toggleSelection(draft.id)">
          </div>
          <div class="draft-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="draft-content">
            <div class="draft-header">
              <span class="draft-subject">{{ draft.subject || 'No Subject' }}</span>
              <span class="draft-type" [class]="'type-' + draft.type">{{ draft.type }}</span>
              <span class="updated-date">{{ (draft.updatedAt || draft.createdAt) | date:'short' }}</span>
            </div>
            <div class="draft-recipient" *ngIf="draft.recipientName">
              To: {{ draft.recipientName }}
            </div>
            <div class="draft-preview">{{ draft.preview || 'Empty draft' }}</div>
            <div class="draft-meta">
              <span class="created-date">Created: {{ draft.createdAt | date:'short' }}</span>
              <span class="word-count" *ngIf="draft.content">{{ getWordCount(draft.content) }} words</span>
            </div>
          </div>
          <div class="draft-actions">
            <button class="btn-icon" (click)="editDraft(draft.id); $event.stopPropagation()" 
                    title="Edit draft">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" (click)="sendDraft(draft.id); $event.stopPropagation()" 
                    title="Send draft">
              <i class="fas fa-paper-plane"></i>
            </button>
            <button class="btn-icon" (click)="duplicateDraft(draft.id); $event.stopPropagation()" 
                    title="Duplicate draft">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn-icon" (click)="deleteDraft(draft.id); $event.stopPropagation()"
                    title="Delete draft">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && filteredDrafts.length === 0">
        <i class="fas fa-file-alt fa-3x"></i>
        <h3>No drafts</h3>
        <p>You don't have any draft messages or no drafts match your current filters.</p>
        <button class="btn btn-primary" routerLink="/messages/compose">Create Your First Draft</button>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading drafts...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button class="btn btn-sm" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">
          Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button class="btn btn-sm" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">
          Next
        </button>
      </div>

      <!-- Auto-save notification -->
      <div class="auto-save-notification" *ngIf="showAutoSaveNotification">
        <i class="fas fa-check-circle"></i>
        Draft auto-saved
      </div>
    </div>
  `,
  styles: [`
    .drafts-messages {
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .page-header h2 {
      margin: 0;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .drafts-filters {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .filter-group label {
      font-weight: 600;
      font-size: 12px;
      color: #666;
    }

    .drafts-toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #e3f2fd;
      border-radius: 4px;
      margin-bottom: 15px;
    }

    .selection-count {
      font-weight: 600;
      color: #1976d2;
    }

    .drafts-list {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .draft-item {
      display: flex;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .draft-item:hover {
      background: #f8f9fa;
    }

    .draft-item.selected {
      background: #e3f2fd;
    }

    .draft-checkbox {
      margin-right: 15px;
    }

    .draft-icon {
      margin-right: 15px;
      color: #666;
      font-size: 18px;
    }

    .draft-content {
      flex: 1;
    }

    .draft-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }

    .draft-subject {
      font-weight: 600;
      color: #333;
    }

    .draft-type {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .type-email {
      background: #e3f2fd;
      color: #1976d2;
    }

    .type-sms {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .type-notification {
      background: #fff3e0;
      color: #f57c00;
    }

    .draft-date {
      color: #666;
      font-size: 12px;
      margin-left: auto;
    }

    .draft-recipient {
      color: #666;
      font-size: 14px;
      margin-bottom: 3px;
    }

    .draft-preview {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
      font-style: italic;
    }

    .draft-meta {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #999;
    }

    .auto-save {
      color: #28a745;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .draft-actions {
      display: flex;
      gap: 5px;
      margin-left: 15px;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 5px;
      border-radius: 4px;
      cursor: pointer;
      color: #666;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f0f0f0;
      color: #333;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state i {
      color: #ddd;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
    }

    .empty-state p {
      margin-bottom: 20px;
    }

    .loading, .error {
      text-align: center;
      padding: 40px;
    }

    .error {
      color: #dc3545;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-top: 20px;
    }

    .page-info {
      color: #666;
      font-size: 14px;
    }

    .auto-save-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-control {
      padding: 6px 10px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
    }
  `]
})
export class DraftsComponent implements OnInit {
  drafts: Message[] = [];
  filteredDrafts: Message[] = [];
  selectedDrafts: string[] = [];
  loading = false;
  error: string | null = null;
  showAutoSaveNotification = false;
  
  // Filters
  typeFilter = '';
  sortBy = 'lastModified';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadDrafts();
  }

  loadDrafts(): void {
    this.loading = true;
    this.error = null;

    this.messagesService.getDrafts(this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        this.drafts = response.messages;
        this.totalPages = response.totalPages;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load drafts';
        this.loading = false;
        console.error('Drafts error:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.drafts];

    if (this.typeFilter) {
      filtered = filtered.filter(draft => draft.type === this.typeFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(draft => 
        (draft.subject || '').toLowerCase().includes(term) ||
        (draft.recipientName || '').toLowerCase().includes(term) ||
        (draft.preview || '').toLowerCase().includes(term)
      );
    }

    // Sort drafts
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'lastModified':
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'subject':
          return (a.subject || '').localeCompare(b.subject || '');
        default:
          return 0;
      }
    });

    this.filteredDrafts = filtered;
  }

  editDraft(draftId: string): void {
    // Navigate to compose with draft ID
    window.location.href = `/messages/compose?draft=${draftId}`;
  }

  toggleSelection(draftId: string): void {
    const index = this.selectedDrafts.indexOf(draftId);
    if (index > -1) {
      this.selectedDrafts.splice(index, 1);
    } else {
      this.selectedDrafts.push(draftId);
    }
  }

  isSelected(draftId: string): boolean {
    return this.selectedDrafts.includes(draftId);
  }

  sendDrafts(): void {
    if (confirm('Are you sure you want to send the selected drafts?')) {
      this.messagesService.sendDrafts(this.selectedDrafts).subscribe({
        next: () => {
          this.drafts = this.drafts.filter(draft => !this.selectedDrafts.includes(draft.id));
          this.selectedDrafts = [];
          this.applyFilters();
        },
        error: (error: any) => console.error('Send drafts error:', error)
      });
    }
  }

  sendDraft(draftId: string): void {
    if (confirm('Are you sure you want to send this draft?')) {
      this.messagesService.sendDrafts([draftId]).subscribe({
        next: () => {
          this.drafts = this.drafts.filter(draft => draft.id !== draftId);
          this.applyFilters();
        },
        error: (error: any) => console.error('Send draft error:', error)
      });
    }
  }

  duplicateDrafts(): void {
    this.messagesService.duplicateDrafts(this.selectedDrafts).subscribe({
      next: () => {
        this.selectedDrafts = [];
        this.loadDrafts(); // Reload to show duplicated drafts
      },
      error: (error: any) => console.error('Duplicate drafts error:', error)
    });
  }

  duplicateDraft(draftId: string): void {
    this.messagesService.duplicateDrafts([draftId]).subscribe({
      next: () => {
        this.loadDrafts(); // Reload to show duplicated draft
      },
      error: (error: any) => console.error('Duplicate draft error:', error)
    });
  }

  deleteDrafts(): void {
    if (confirm('Are you sure you want to delete the selected drafts?')) {
      this.messagesService.deleteDrafts(this.selectedDrafts).subscribe({
        next: () => {
          this.drafts = this.drafts.filter(draft => !this.selectedDrafts.includes(draft.id));
          this.selectedDrafts = [];
          this.applyFilters();
        },
        error: (error: any) => console.error('Delete drafts error:', error)
      });
    }
  }

  deleteDraft(draftId: string): void {
    if (confirm('Are you sure you want to delete this draft?')) {
      this.messagesService.deleteDrafts([draftId]).subscribe({
        next: () => {
          this.drafts = this.drafts.filter(draft => draft.id !== draftId);
          this.applyFilters();
        },
        error: (error: any) => console.error('Delete draft error:', error)
      });
    }
  }

  refreshDrafts(): void {
    this.loadDrafts();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadDrafts();
  }

  formatDate(date: string): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  }

  showAutoSave(): void {
    this.showAutoSaveNotification = true;
    setTimeout(() => {
      this.showAutoSaveNotification = false;
    }, 3000);
  }

  getWordCount(content: string): number {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}