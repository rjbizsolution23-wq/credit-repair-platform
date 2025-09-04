import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

interface AuditLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, FeatherIconDirective],
  template: `
    <div class="audit-logs-container">
      <div class="page-header">
        <h1>Audit Logs</h1>
        <p>Monitor and track all system activities and user actions</p>
      </div>

      <div class="filters-section">
        <div class="filters-card">
          <div class="filter-group">
            <label>Date Range</label>
            <div class="date-inputs">
              <input type="date" class="form-control" [(ngModel)]="startDate">
              <span>to</span>
              <input type="date" class="form-control" [(ngModel)]="endDate">
            </div>
          </div>

          <div class="filter-group">
            <label>User</label>
            <select class="form-select" [(ngModel)]="filterUser">
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="user">Regular Users</option>
              <option value="system">System</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Action</label>
            <select class="form-select" [(ngModel)]="filterAction">
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Status</label>
            <select class="form-select" [(ngModel)]="filterStatus">
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>

          <div class="filter-actions">
            <button class="btn-primary" (click)="applyFilters()">
              <i data-feather="filter"></i> Apply Filters
            </button>
            <button class="btn-outline" (click)="clearFilters()">
              <i data-feather="x"></i> Clear
            </button>
            <button class="btn-outline" (click)="exportLogs()">
              <i data-feather="download"></i> Export
            </button>
          </div>
        </div>
      </div>

      <div class="logs-section">
        <div class="section-header">
          <h2>Activity Log ({{ filteredLogs.length }} entries)</h2>
          <div class="refresh-controls">
            <label class="auto-refresh">
              <input type="checkbox" [(ngModel)]="autoRefresh" (change)="toggleAutoRefresh()">
              Auto-refresh
            </label>
            <button class="btn-icon" (click)="refreshLogs()">
              <i data-feather="refresh-cw"></i>
            </button>
          </div>
        </div>

        <div class="logs-table">
          <div class="table-header">
            <div class="col-timestamp">Timestamp</div>
            <div class="col-user">User</div>
            <div class="col-action">Action</div>
            <div class="col-resource">Resource</div>
            <div class="col-status">Status</div>
            <div class="col-details">Details</div>
          </div>

          <div class="table-body">
            <div class="log-row" *ngFor="let log of paginatedLogs" [class]="'status-' + log.status">
              <div class="col-timestamp">
                <div class="timestamp-main">{{ formatDate(log.timestamp) }}</div>
                <div class="timestamp-sub">{{ formatTime(log.timestamp) }}</div>
              </div>
              <div class="col-user">
                <div class="user-info">
                  <span class="user-name">{{ log.user }}</span>
                  <span class="user-ip">{{ log.ipAddress }}</span>
                </div>
              </div>
              <div class="col-action">
                <span class="action-badge">{{ log.action }}</span>
              </div>
              <div class="col-resource">
                {{ log.resource }}
              </div>
              <div class="col-status">
                <span class="status-badge" [class]="'status-' + log.status">
                  <i [attr.data-feather]="getStatusIcon(log.status)"></i>
                  {{ log.status | titlecase }}
                </span>
              </div>
              <div class="col-details">
                <span class="details-text" [title]="log.details">{{ log.details }}</span>
                <button class="btn-icon-small" (click)="viewLogDetails(log)">
                  <i data-feather="eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <button class="btn-page" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">
            <i data-feather="chevron-left"></i>
          </button>
          
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button class="btn-page" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">
            <i data-feather="chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-logs-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .page-header p {
      color: #666;
      font-size: 16px;
    }

    .filters-section {
      margin-bottom: 32px;
    }

    .filters-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group label {
      font-weight: 500;
      color: #374151;
      font-size: 14px;
    }

    .date-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-inputs span {
      color: #666;
      font-size: 14px;
    }

    .form-control, .form-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .logs-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
    }

    .section-header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .refresh-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .auto-refresh {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
      cursor: pointer;
    }

    .logs-table {
      overflow-x: auto;
    }

    .table-header {
      display: grid;
      grid-template-columns: 180px 200px 120px 200px 120px 1fr;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      font-size: 14px;
      color: #374151;
    }

    .table-header > div {
      padding: 16px 12px;
    }

    .table-body {
      max-height: 600px;
      overflow-y: auto;
    }

    .log-row {
      display: grid;
      grid-template-columns: 180px 200px 120px 200px 120px 1fr;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s ease;
    }

    .log-row:hover {
      background-color: #f9fafb;
    }

    .log-row.status-failed {
      border-left: 3px solid #dc2626;
    }

    .log-row.status-warning {
      border-left: 3px solid #f59e0b;
    }

    .log-row.status-success {
      border-left: 3px solid #10b981;
    }

    .log-row > div {
      padding: 16px 12px;
      display: flex;
      align-items: center;
    }

    .col-timestamp {
      flex-direction: column;
      align-items: flex-start !important;
    }

    .timestamp-main {
      font-weight: 500;
      color: #1a1a1a;
      font-size: 14px;
    }

    .timestamp-sub {
      color: #666;
      font-size: 12px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .user-name {
      font-weight: 500;
      color: #1a1a1a;
      font-size: 14px;
    }

    .user-ip {
      color: #666;
      font-size: 12px;
    }

    .action-badge {
      background: #e5f3ff;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.status-success {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.status-failed {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-badge.status-warning {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge i {
      width: 12px;
      height: 12px;
    }

    .col-details {
      justify-content: space-between;
    }

    .details-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
      color: #666;
    }

    .pagination {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    }

    .btn-page {
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-page:hover:not(:disabled) {
      border-color: #1976d2;
      color: #1976d2;
    }

    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }

    .btn-primary {
      background: #1976d2;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s ease;
      font-size: 14px;
    }

    .btn-primary:hover {
      background: #1565c0;
    }

    .btn-outline {
      background: transparent;
      color: #1976d2;
      border: 1px solid #1976d2;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn-outline:hover {
      background: #1976d2;
      color: white;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      border-color: #1976d2;
      color: #1976d2;
    }

    .btn-icon-small {
      width: 24px;
      height: 24px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-icon-small:hover {
      border-color: #1976d2;
      color: #1976d2;
    }

    .btn-icon i, .btn-icon-small i {
      width: 16px;
      height: 16px;
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  filterUser = 'all';
  filterAction = 'all';
  filterStatus = 'all';
  autoRefresh = false;
  currentPage = 1;
  itemsPerPage = 20;
  private refreshInterval: any;

  auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      user: 'admin@example.com',
      action: 'login',
      resource: 'Authentication System',
      details: 'Successful login from dashboard',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T10:25:00'),
      user: 'user@example.com',
      action: 'create',
      resource: 'Credit Report',
      details: 'Created new credit report for client ID: 12345',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success'
    },
    {
      id: '3',
      timestamp: new Date('2024-01-15T10:20:00'),
      user: 'system',
      action: 'update',
      resource: 'Database',
      details: 'Automated backup completed successfully',
      ipAddress: '127.0.0.1',
      userAgent: 'System Process',
      status: 'success'
    },
    {
      id: '4',
      timestamp: new Date('2024-01-15T10:15:00'),
      user: 'user2@example.com',
      action: 'delete',
      resource: 'Document',
      details: 'Failed to delete document - insufficient permissions',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'failed'
    },
    {
      id: '5',
      timestamp: new Date('2024-01-15T10:10:00'),
      user: 'admin@example.com',
      action: 'view',
      resource: 'User Management',
      details: 'Accessed user management panel',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success'
    },
    {
      id: '6',
      timestamp: new Date('2024-01-15T10:05:00'),
      user: 'user3@example.com',
      action: 'login',
      resource: 'Authentication System',
      details: 'Multiple failed login attempts detected',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'warning'
    }
  ];

  constructor() {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.startDate = lastWeek.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  get filteredLogs(): AuditLog[] {
    return this.auditLogs.filter(log => {
      const userMatch = this.filterUser === 'all' || 
        (this.filterUser === 'admin' && log.user.includes('admin')) ||
        (this.filterUser === 'user' && !log.user.includes('admin') && log.user !== 'system') ||
        (this.filterUser === 'system' && log.user === 'system');
      
      const actionMatch = this.filterAction === 'all' || log.action === this.filterAction;
      const statusMatch = this.filterStatus === 'all' || log.status === this.filterStatus;
      
      const startDateMatch = !this.startDate || log.timestamp >= new Date(this.startDate);
      const endDateMatch = !this.endDate || log.timestamp <= new Date(this.endDate + 'T23:59:59');
      
      return userMatch && actionMatch && statusMatch && startDateMatch && endDateMatch;
    });
  }

  get paginatedLogs(): AuditLog[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredLogs.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLogs.length / this.itemsPerPage);
  }

  applyFilters(): void {
    this.currentPage = 1;
    console.log('Applying filters...');
  }

  clearFilters(): void {
    this.filterUser = 'all';
    this.filterAction = 'all';
    this.filterStatus = 'all';
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.startDate = lastWeek.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    this.currentPage = 1;
  }

  exportLogs(): void {
    console.log('Exporting logs...');
    // Implement export functionality
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.refreshLogs();
      }, 30000); // Refresh every 30 seconds
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  }

  refreshLogs(): void {
    console.log('Refreshing logs...');
    // Implement refresh functionality
  }

  viewLogDetails(log: AuditLog): void {
    console.log('Viewing log details:', log);
    // Implement log details modal
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return 'check-circle';
      case 'failed': return 'x-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }
}