import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessagesService } from '../messages.service';
import { Message } from '../messages.model';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="inbox">
      <div class="page-header">
        <h2>Inbox</h2>
        <div class="header-actions">
          <button class="btn btn-primary" routerLink="/messages/compose">
            <i class="fas fa-plus"></i> Compose
          </button>
          <button class="btn btn-secondary" (click)="refreshMessages()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <div class="inbox-filters">
        <div class="filter-group">
          <label for="statusFilter">Status:</label>
          <select id="statusFilter" class="form-control" [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
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
          <input type="text" class="form-control" placeholder="Search messages..." [(ngModel)]="searchTerm" (input)="applyFilters()">
        </div>
      </div>

      <div class="inbox-toolbar" *ngIf="selectedMessages.length > 0">
        <span class="selection-count">{{ selectedMessages.length }} selected</span>
        <button class="btn btn-sm btn-secondary" (click)="markAsRead()">Mark as Read</button>
        <button class="btn btn-sm btn-secondary" (click)="markAsUnread()">Mark as Unread</button>
        <button class="btn btn-sm btn-warning" (click)="flagMessages()">Flag</button>
        <button class="btn btn-sm btn-danger" (click)="deleteMessages()">Delete</button>
      </div>

      <div class="messages-list" *ngIf="!loading && filteredMessages.length > 0">
        <div class="message-item" 
             *ngFor="let message of filteredMessages" 
             [class.unread]="!message.isRead"
             [class.selected]="isSelected(message.id)"
             (click)="selectMessage(message)">
          <div class="message-checkbox">
            <input type="checkbox" 
                   [checked]="isSelected(message.id)"
                   (click)="$event.stopPropagation()"
                   (change)="toggleSelection(message.id)">
          </div>
          <div class="message-avatar">
            <div class="avatar-circle">{{ getInitials(message.senderName) }}</div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">{{ message.senderName }}</span>
              <span class="message-type" [class]="'type-' + message.type">{{ message.type }}</span>
              <span class="message-date">{{ formatDate(message.createdAt) }}</span>
            </div>
            <div class="message-subject">{{ message.subject }}</div>
            <div class="message-preview">{{ message.preview }}</div>
          </div>
          <div class="message-actions">
            <button class="btn-icon" (click)="toggleFlag(message.id); $event.stopPropagation()" 
                    [class.flagged]="message.isFlagged">
              <i class="fas fa-flag"></i>
            </button>
            <button class="btn-icon" (click)="deleteMessage(message.id); $event.stopPropagation()">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && filteredMessages.length === 0">
        <i class="fas fa-inbox fa-3x"></i>
        <h3>No messages found</h3>
        <p>Your inbox is empty or no messages match your current filters.</p>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading messages...</p>
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
    </div>
  `,
  styles: [`
    .inbox {
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

    .inbox-filters {
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

    .inbox-toolbar {
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

    .messages-list {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .message-item {
      display: flex;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .message-item:hover {
      background: #f8f9fa;
    }

    .message-item.unread {
      background: #fff3cd;
      font-weight: 600;
    }

    .message-item.selected {
      background: #e3f2fd;
    }

    .message-checkbox {
      margin-right: 15px;
    }

    .message-avatar {
      margin-right: 15px;
    }

    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .message-content {
      flex: 1;
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }

    .sender-name {
      font-weight: 600;
      color: #333;
    }

    .message-type {
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

    .message-date {
      color: #666;
      font-size: 12px;
      margin-left: auto;
    }

    .message-subject {
      font-weight: 600;
      color: #333;
      margin-bottom: 3px;
    }

    .message-preview {
      color: #666;
      font-size: 14px;
    }

    .message-actions {
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

    .btn-icon.flagged {
      color: #ffc107;
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

    .btn-warning {
      background: #ffc107;
      color: #212529;
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
export class InboxComponent implements OnInit {
  messages: Message[] = [];
  filteredMessages: Message[] = [];
  selectedMessages: string[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters
  statusFilter = '';
  typeFilter = '';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.error = null;

    this.messagesService.getMessages({ page: this.currentPage, limit: this.pageSize }).subscribe({
      next: (response: any) => {
        this.messages = response.messages;
        this.totalPages = response.totalPages;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load messages';
        this.loading = false;
        console.error('Inbox error:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.messages];

    if (this.statusFilter) {
      filtered = filtered.filter(msg => {
        switch (this.statusFilter) {
          case 'unread': return !msg.isRead;
          case 'read': return msg.isRead;
          case 'flagged': return msg.isFlagged;
          default: return true;
        }
      });
    }

    if (this.typeFilter) {
      filtered = filtered.filter(msg => msg.type === this.typeFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(term) ||
        msg.senderName.toLowerCase().includes(term) ||
        (msg.preview || '').toLowerCase().includes(term)
      );
    }

    this.filteredMessages = filtered;
  }

  selectMessage(message: Message): void {
    // Navigate to message detail
    window.location.href = `/messages/message/${message.id}`;
  }

  toggleSelection(messageId: string): void {
    const index = this.selectedMessages.indexOf(messageId);
    if (index > -1) {
      this.selectedMessages.splice(index, 1);
    } else {
      this.selectedMessages.push(messageId);
    }
  }

  isSelected(messageId: string): boolean {
    return this.selectedMessages.includes(messageId);
  }

  markAsRead(): void {
    // Mark each selected message as read individually
    this.selectedMessages.forEach(messageId => {
      this.messagesService.markAsRead(messageId).subscribe({
        next: () => {
          this.messages.forEach(msg => {
            if (msg.id === messageId) {
              msg.isRead = true;
            }
          });
        },
        error: (error: any) => {
          console.error('Error marking message as read:', error);
        }
      });
    });
    this.selectedMessages = [];
    this.applyFilters();
  }

  markAsUnread(): void {
    // Mark each selected message as unread individually
    this.selectedMessages.forEach(messageId => {
      this.messagesService.markAsUnread(messageId).subscribe({
        next: () => {
          this.messages.forEach(msg => {
            if (msg.id === messageId) {
              msg.isRead = false;
            }
          });
        },
        error: (error: any) => {
          console.error('Error marking message as unread:', error);
        }
      });
    });
    this.selectedMessages = [];
    this.applyFilters();
  }

  flagMessages(): void {
    // Flag each selected message individually since there's no bulk flag method
    this.selectedMessages.forEach(messageId => {
      this.messagesService.flagMessage(messageId).subscribe({
        next: () => {
          const message = this.messages.find(msg => msg.id === messageId);
          if (message) {
            message.isFlagged = true;
          }
        },
        error: (error: any) => console.error('Flag message error:', error)
      });
    });
    this.selectedMessages = [];
    this.applyFilters();
  }

  deleteMessages(): void {
    if (confirm('Are you sure you want to delete the selected messages?')) {
      this.messagesService.deleteMessages(this.selectedMessages).subscribe({
        next: () => {
          this.messages = this.messages.filter(msg => !this.selectedMessages.includes(msg.id));
          this.selectedMessages = [];
          this.applyFilters();
        },
        error: (error) => console.error('Delete messages error:', error)
      });
    }
  }

  toggleFlag(messageId: string): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      // Since there's no toggleFlag method, we'll use flagMessage and handle toggle manually
      this.messagesService.flagMessage(messageId).subscribe({
        next: () => {
          message.isFlagged = !message.isFlagged;
        },
        error: (error: any) => console.error('Toggle flag error:', error)
      });
    }
  }

  deleteMessage(messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.messagesService.deleteMessages([messageId]).subscribe({
        next: () => {
          this.messages = this.messages.filter(msg => msg.id !== messageId);
          this.applyFilters();
        },
        error: (error) => console.error('Delete message error:', error)
      });
    }
  }

  refreshMessages(): void {
    this.loadMessages();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadMessages();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  formatDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }
}