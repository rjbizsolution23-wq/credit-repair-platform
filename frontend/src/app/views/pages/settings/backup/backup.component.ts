import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'running' | 'failed' | 'scheduled';
  size: string;
  createdAt: Date;
  location: string;
}

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, FeatherIconDirective],
  template: `
    <div class="backup-container">
      <div class="page-header">
        <h1>Backup & Restore</h1>
        <p>Manage your data backups and restore operations</p>
      </div>

      <div class="backup-actions">
        <div class="action-card">
          <div class="card-icon">
            <i data-feather="download-cloud"></i>
          </div>
          <h3>Create Backup</h3>
          <p>Create a new backup of your data</p>
          <button class="btn-primary" (click)="createBackup()">
            <i data-feather="plus"></i> New Backup
          </button>
        </div>

        <div class="action-card">
          <div class="card-icon">
            <i data-feather="upload-cloud"></i>
          </div>
          <h3>Restore Data</h3>
          <p>Restore data from a previous backup</p>
          <button class="btn-outline" (click)="showRestoreModal()">
            <i data-feather="refresh-cw"></i> Restore
          </button>
        </div>

        <div class="action-card">
          <div class="card-icon">
            <i data-feather="settings"></i>
          </div>
          <h3>Auto Backup</h3>
          <p>Configure automatic backup schedule</p>
          <button class="btn-outline" (click)="configureAutoBackup()">
            <i data-feather="clock"></i> Configure
          </button>
        </div>
      </div>

      <div class="backup-history">
        <div class="section-header">
          <h2>Backup History</h2>
          <div class="filters">
            <select class="form-select" [(ngModel)]="filterType">
              <option value="all">All Types</option>
              <option value="full">Full Backup</option>
              <option value="incremental">Incremental</option>
              <option value="differential">Differential</option>
            </select>
            <select class="form-select" [(ngModel)]="filterStatus">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        <div class="backup-list">
          <div class="backup-item" *ngFor="let backup of filteredBackups">
            <div class="backup-info">
              <div class="backup-name">
                <h4>{{ backup.name }}</h4>
                <span class="backup-type">{{ backup.type | titlecase }}</span>
              </div>
              <div class="backup-meta">
                <span class="backup-size">{{ backup.size }}</span>
                <span class="backup-date">{{ formatDate(backup.createdAt) }}</span>
                <span class="backup-location">{{ backup.location }}</span>
              </div>
            </div>
            <div class="backup-status">
              <span class="status-badge" [class]="'status-' + backup.status">
                {{ backup.status | titlecase }}
              </span>
            </div>
            <div class="backup-actions">
              <button class="btn-icon" (click)="downloadBackup(backup)" 
                      [disabled]="backup.status !== 'completed'">
                <i data-feather="download"></i>
              </button>
              <button class="btn-icon" (click)="restoreFromBackup(backup)"
                      [disabled]="backup.status !== 'completed'">
                <i data-feather="refresh-cw"></i>
              </button>
              <button class="btn-icon danger" (click)="deleteBackup(backup)">
                <i data-feather="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backup-container {
      padding: 24px;
      max-width: 1200px;
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

    .backup-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }

    .action-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      transition: all 0.2s ease;
    }

    .action-card:hover {
      border-color: #1976d2;
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.1);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      background: #f3f4f6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .card-icon i {
      color: #1976d2;
      width: 24px;
      height: 24px;
    }

    .action-card h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 8px;
    }

    .action-card p {
      color: #666;
      margin-bottom: 20px;
    }

    .backup-history {
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

    .filters {
      display: flex;
      gap: 12px;
    }

    .form-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    }

    .backup-list {
      max-height: 600px;
      overflow-y: auto;
    }

    .backup-item {
      display: flex;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s ease;
    }

    .backup-item:hover {
      background-color: #f9fafb;
    }

    .backup-item:last-child {
      border-bottom: none;
    }

    .backup-info {
      flex: 1;
    }

    .backup-name {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .backup-name h4 {
      font-size: 16px;
      font-weight: 500;
      color: #1a1a1a;
    }

    .backup-type {
      background: #e5f3ff;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .backup-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #666;
    }

    .backup-status {
      margin: 0 24px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-completed {
      background: #dcfce7;
      color: #166534;
    }

    .status-running {
      background: #fef3c7;
      color: #92400e;
    }

    .status-failed {
      background: #fee2e2;
      color: #dc2626;
    }

    .status-scheduled {
      background: #e0e7ff;
      color: #3730a3;
    }

    .backup-actions {
      display: flex;
      gap: 8px;
    }

    .btn-primary {
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s ease;
    }

    .btn-primary:hover {
      background: #1565c0;
    }

    .btn-outline {
      background: transparent;
      color: #1976d2;
      border: 1px solid #1976d2;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
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

    .btn-icon.danger:hover {
      border-color: #dc2626;
      color: #dc2626;
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon i {
      width: 16px;
      height: 16px;
    }
  `]
})
export class BackupComponent implements OnInit {
  filterType = 'all';
  filterStatus = 'all';

  backups: BackupJob[] = [
    {
      id: '1',
      name: 'Daily Full Backup',
      type: 'full',
      status: 'completed',
      size: '2.4 GB',
      createdAt: new Date('2024-01-15T10:30:00'),
      location: 'AWS S3 - us-east-1'
    },
    {
      id: '2',
      name: 'Incremental Backup',
      type: 'incremental',
      status: 'running',
      size: '156 MB',
      createdAt: new Date('2024-01-15T14:15:00'),
      location: 'Local Storage'
    },
    {
      id: '3',
      name: 'Weekly Full Backup',
      type: 'full',
      status: 'failed',
      size: '0 MB',
      createdAt: new Date('2024-01-14T02:00:00'),
      location: 'Google Cloud Storage'
    },
    {
      id: '4',
      name: 'Differential Backup',
      type: 'differential',
      status: 'scheduled',
      size: '0 MB',
      createdAt: new Date('2024-01-16T00:00:00'),
      location: 'Azure Blob Storage'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  get filteredBackups(): BackupJob[] {
    return this.backups.filter(backup => {
      const typeMatch = this.filterType === 'all' || backup.type === this.filterType;
      const statusMatch = this.filterStatus === 'all' || backup.status === this.filterStatus;
      return typeMatch && statusMatch;
    });
  }

  createBackup(): void {
    console.log('Creating new backup...');
    // Implement backup creation logic
  }

  showRestoreModal(): void {
    console.log('Showing restore modal...');
    // Implement restore modal logic
  }

  configureAutoBackup(): void {
    console.log('Configuring auto backup...');
    // Implement auto backup configuration
  }

  downloadBackup(backup: BackupJob): void {
    console.log('Downloading backup:', backup.name);
    // Implement backup download logic
  }

  restoreFromBackup(backup: BackupJob): void {
    console.log('Restoring from backup:', backup.name);
    // Implement restore logic
  }

  deleteBackup(backup: BackupJob): void {
    if (confirm(`Are you sure you want to delete the backup "${backup.name}"?`)) {
      this.backups = this.backups.filter(b => b.id !== backup.id);
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}