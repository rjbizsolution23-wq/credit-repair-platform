import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { Notification } from '../messages.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="notifications-container">
      <!-- Header -->
      <div class="notifications-header">
        <div class="header-content">
          <h2>Notifications</h2>
          <p class="text-muted">Manage your system notifications and alerts</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary" (click)="markAllAsRead()" [disabled]="!hasUnreadNotifications">
            <i class="fas fa-check-double"></i>
            Mark All Read
          </button>
          <button class="btn btn-outline-danger" (click)="clearAllNotifications()" [disabled]="notifications.length === 0">
            <i class="fas fa-trash"></i>
            Clear All
          </button>
          <button class="btn btn-primary" routerLink="/messages/notifications/settings">
            <i class="fas fa-cog"></i>
            Settings
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="notifications-filters">
        <div class="filter-tabs">
          <button class="filter-tab" 
                  [class.active]="activeFilter === 'all'"
                  (click)="setFilter('all')">
            All ({{ notifications.length }})
          </button>
          <button class="filter-tab" 
                  [class.active]="activeFilter === 'unread'"
                  (click)="setFilter('unread')">
            Unread ({{ getUnreadCount() }})
          </button>
          <button class="filter-tab" 
                  [class.active]="activeFilter === 'starred'"
                  (click)="setFilter('starred')">
            Starred ({{ getStarredCount() }})
          </button>
        </div>

        <div class="filter-controls">
          <select class="form-select" [(ngModel)]="selectedCategory" (change)="applyFilters()">
            <option value="">All Categories</option>
            <option value="system">System</option>
            <option value="account">Account</option>
            <option value="payment">Payment</option>
            <option value="dispute">Dispute</option>
            <option value="reminder">Reminder</option>
            <option value="marketing">Marketing</option>
          </select>

          <select class="form-select" [(ngModel)]="selectedPriority" (change)="applyFilters()">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div class="search-box">
            <input type="text" 
                   class="form-control" 
                   placeholder="Search notifications..."
                   [(ngModel)]="searchTerm"
                   (input)="applyFilters()">
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list" *ngIf="filteredNotifications.length > 0; else noNotifications">
        <div class="notification-item" 
             *ngFor="let notification of paginatedNotifications; trackBy: trackByNotificationId"
             [class.unread]="!notification.isRead"
             [class.starred]="notification.isStarred"
             [attr.data-priority]="notification.priority">
          
          <!-- Priority Indicator -->
          <div class="priority-indicator" [attr.data-priority]="notification.priority"></div>

          <!-- Notification Content -->
          <div class="notification-content" (click)="toggleRead(notification)">
            <div class="notification-header">
              <div class="notification-meta">
                <span class="notification-type" [attr.data-type]="notification.type">
                  <i class="fas" [ngClass]="getTypeIcon(notification.type)"></i>
                  {{ notification.category | titlecase }}
                </span>
                <span class="notification-time">{{ getRelativeTime(notification.createdAt) }}</span>
              </div>
              <div class="notification-actions">
                <button class="action-btn" 
                        (click)="toggleStar(notification); $event.stopPropagation()"
                        [class.active]="notification.isStarred">
                  <i class="fas fa-star"></i>
                </button>
                <button class="action-btn" 
                        (click)="deleteNotification(notification.id); $event.stopPropagation()">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="notification-body">
              <h5 class="notification-title">{{ notification.title }}</h5>
              <p class="notification-message">{{ notification.message }}</p>
              
              <div class="notification-footer" *ngIf="notification.actionUrl || notification.sender">
                <div class="notification-sender" *ngIf="notification.sender">
                  <i class="fas fa-user"></i>
                  {{ notification.sender }}
                </div>
                <button class="btn btn-sm btn-primary" 
                        *ngIf="notification.actionUrl"
                        (click)="handleAction(notification); $event.stopPropagation()">
                  {{ notification.actionText || 'View Details' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Notifications -->
      <ng-template #noNotifications>
        <div class="no-notifications">
          <div class="no-notifications-icon">
            <i class="fas fa-bell-slash"></i>
          </div>
          <h4>No notifications found</h4>
          <p class="text-muted">
            {{ getNoNotificationsMessage() }}
          </p>
        </div>
      </ng-template>

      <!-- Pagination -->
      <div class="notifications-pagination" *ngIf="totalPages > 1">
        <nav aria-label="Notifications pagination">
          <ul class="pagination justify-content-center">
            <li class="page-item" [class.disabled]="currentPage === 1">
              <button class="page-link" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
                <i class="fas fa-chevron-left"></i>
              </button>
            </li>
            
            <li class="page-item" 
                *ngFor="let page of getPageNumbers()" 
                [class.active]="page === currentPage">
              <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
            </li>
            
            <li class="page-item" [class.disabled]="currentPage === totalPages">
              <button class="page-link" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
                <i class="fas fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 1.5rem;
    }

    .notifications-header {
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

    .notifications-filters {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .filter-tab {
      background: none;
      border: 1px solid #dee2e6;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-tab:hover {
      background: #e9ecef;
    }

    .filter-tab.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .filter-controls .form-select {
      width: auto;
      min-width: 150px;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 300px;
    }

    .search-icon {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .notification-item {
      display: flex;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      overflow: hidden;
      transition: all 0.2s;
      cursor: pointer;
    }

    .notification-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .notification-item.unread {
      border-left: 4px solid #007bff;
      background: #f8f9ff;
    }

    .notification-item.starred {
      border-left: 4px solid #ffc107;
    }

    .priority-indicator {
      width: 4px;
      background: #e0e0e0;
    }

    .priority-indicator[data-priority="urgent"] {
      background: #dc3545;
    }

    .priority-indicator[data-priority="high"] {
      background: #fd7e14;
    }

    .priority-indicator[data-priority="medium"] {
      background: #ffc107;
    }

    .priority-indicator[data-priority="low"] {
      background: #28a745;
    }

    .notification-content {
      flex: 1;
      padding: 1rem;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .notification-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .notification-type[data-type="info"] {
      color: #0dcaf0;
    }

    .notification-type[data-type="success"] {
      color: #198754;
    }

    .notification-type[data-type="warning"] {
      color: #fd7e14;
    }

    .notification-type[data-type="error"] {
      color: #dc3545;
    }

    .notification-time {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .notification-actions {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      background: none;
      border: none;
      padding: 0.25rem;
      border-radius: 0.25rem;
      cursor: pointer;
      color: #6c757d;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f8f9fa;
      color: #495057;
    }

    .action-btn.active {
      color: #ffc107;
    }

    .notification-title {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .notification-message {
      margin: 0 0 0.75rem 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .notification-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notification-sender {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .no-notifications {
      text-align: center;
      padding: 3rem 1rem;
    }

    .no-notifications-icon {
      font-size: 3rem;
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .no-notifications h4 {
      margin-bottom: 0.5rem;
      color: #6c757d;
    }

    .notifications-pagination {
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .notifications-container {
        padding: 1rem;
      }

      .notifications-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-actions {
        justify-content: center;
        flex-wrap: wrap;
      }

      .filter-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-controls .form-select {
        min-width: auto;
      }

      .search-box {
        max-width: none;
      }

      .notification-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .notification-meta {
        justify-content: space-between;
      }

      .notification-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  paginatedNotifications: Notification[] = [];
  
  activeFilter = 'all';
  selectedCategory = '';
  selectedPriority = '';
  searchTerm = '';
  
  currentPage = 1;
  pageSize = 20;
  itemsPerPage = 10;
  totalPages = 1;
  
  hasUnreadNotifications = false;

  private destroy$ = new Subject<void>();

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.messagesService.getNotifications({ page: this.currentPage, pageSize: this.pageSize }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.notifications = response.data || [];
        this.updateUnreadStatus();
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.notifications];

    // Apply active filter
    switch (this.activeFilter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'starred':
        filtered = filtered.filter(n => n.isStarred);
        break;
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(n => n.category === this.selectedCategory);
    }

    // Apply priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(n => n.priority === this.selectedPriority);
    }

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term) ||
        (n.sender && n.sender.toLowerCase().includes(term))
      );
    }

    this.filteredNotifications = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedNotifications = this.filteredNotifications.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  toggleRead(notification: Notification): void {
    notification.isRead = !notification.isRead;
    notification.readAt = notification.isRead ? new Date() : undefined;
    
    this.messagesService.markNotificationAsRead(notification.id).subscribe({
      next: () => {
        this.updateUnreadStatus();
      },
      error: (error: any) => {
        console.error('Error updating notification:', error);
        // Revert the change
        notification.isRead = !notification.isRead;
        notification.readAt = notification.isRead ? new Date() : undefined;
      }
    });
  }

  toggleStar(notification: Notification): void {
    notification.isStarred = !notification.isStarred;
    
    this.messagesService.archiveNotification(notification.id).subscribe({
      error: (error: any) => {
        console.error('Error updating notification:', error);
        // Revert the change
        notification.isStarred = !notification.isStarred;
      }
    });
  }

  deleteNotification(id: string): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.messagesService.deleteNotification(id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
          this.updateUnreadStatus();
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Error deleting notification:', error);
        }
      });
    }
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    
    if (unreadNotifications.length > 0) {
      this.messagesService.markAllNotificationsAsRead().subscribe({
        next: () => {
          unreadNotifications.forEach(n => {
            n.isRead = true;
            n.readAt = new Date();
          });
          this.updateUnreadStatus();
        },
        error: (error: any) => {
          console.error('Error marking all as read:', error);
        }
      });
    }
  }

  clearAllNotifications(): void {
    if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      this.messagesService.markAllNotificationsAsRead().subscribe({
        next: () => {
          this.notifications = [];
          this.applyFilters();
        },
        error: (error: any) => {
          console.error('Error clearing notifications:', error);
        }
      });
    }
  }

  handleAction(notification: Notification): void {
    if (notification.actionUrl) {
      // Navigate to the action URL or handle the action
      window.open(notification.actionUrl, '_blank');
    }
  }

  updateUnreadStatus(): void {
    this.hasUnreadNotifications = this.notifications.some(n => !n.isRead);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getStarredCount(): number {
    return this.notifications.filter(n => n.isStarred).length;
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'info':
        return 'fa-info-circle';
      case 'success':
        return 'fa-check-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'error':
        return 'fa-times-circle';
      default:
        return 'fa-bell';
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(date).toLocaleDateString();
  }

  getNoNotificationsMessage(): string {
    switch (this.activeFilter) {
      case 'unread':
        return 'All notifications have been read.';
      case 'starred':
        return 'No starred notifications found.';
      default:
        return 'You have no notifications at this time.';
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}