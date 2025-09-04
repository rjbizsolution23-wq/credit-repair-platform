import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'email' | 'push' | 'sms';
  category: 'system' | 'marketing' | 'security' | 'updates';
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, FeatherIconDirective],
  template: `
    <div class="notifications-container">
      <div class="page-header">
        <h1>Notification Settings</h1>
        <p>Manage your notification preferences and communication settings</p>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Notification Preferences</h5>
            </div>
            <div class="card-body">
              <!-- Global Settings -->
              <div class="row mb-4">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Default Notification Method</label>
                    <select class="form-select" [(ngModel)]="defaultMethod">
                      <option value="email">Email</option>
                      <option value="push">Push Notifications</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Notification Frequency</label>
                    <select class="form-select" [(ngModel)]="frequency">
                      <option value="immediate">Immediate</option>
                      <option value="hourly">Hourly Digest</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Notification Categories -->
              <div class="notification-categories">
                <h6 class="mb-3">Notification Categories</h6>
                
                <div class="category-section" *ngFor="let category of categories">
                  <h6 class="category-title">{{ getCategoryTitle(category) }}</h6>
                  <div class="notification-items">
                    <div class="notification-item" *ngFor="let setting of getSettingsByCategory(category)">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="notification-info">
                          <h6 class="notification-name">{{ setting.name }}</h6>
                          <p class="notification-description">{{ setting.description }}</p>
                        </div>
                        <div class="notification-controls">
                          <div class="form-check form-switch">
                            <input 
                              class="form-check-input" 
                              type="checkbox" 
                              [id]="'switch-' + setting.id"
                              [(ngModel)]="setting.enabled"
                              (change)="updateNotificationSetting(setting)">
                            <label class="form-check-label" [for]="'switch-' + setting.id">
                              {{ setting.enabled ? 'Enabled' : 'Disabled' }}
                            </label>
                          </div>
                          <div class="notification-type-selector mt-2" *ngIf="setting.enabled">
                            <select class="form-select form-select-sm" [(ngModel)]="setting.type">
                              <option value="email">Email</option>
                              <option value="push">Push</option>
                              <option value="sms">SMS</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quiet Hours -->
              <div class="quiet-hours-section mt-4">
                <h6 class="mb-3">Quiet Hours</h6>
                <div class="row">
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">Start Time</label>
                      <input type="time" class="form-control" [(ngModel)]="quietHours.start">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-group">
                      <label class="form-label">End Time</label>
                      <input type="time" class="form-control" [(ngModel)]="quietHours.end">
                    </div>
                  </div>
                </div>
                <div class="form-check mt-2">
                  <input class="form-check-input" type="checkbox" id="enableQuietHours" [(ngModel)]="quietHours.enabled">
                  <label class="form-check-label" for="enableQuietHours">
                    Enable quiet hours (no notifications during this time)
                  </label>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons mt-4">
                <button type="button" class="btn btn-primary me-2" (click)="saveSettings()">
                  <i data-feather="save" appFeatherIcon></i>
                  Save Settings
                </button>
                <button type="button" class="btn btn-outline-secondary me-2" (click)="resetToDefaults()">
                  <i data-feather="refresh-cw" appFeatherIcon></i>
                  Reset to Defaults
                </button>
                <button type="button" class="btn btn-outline-info" (click)="testNotification()">
                  <i data-feather="bell" appFeatherIcon></i>
                  Test Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notification History -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Recent Notifications</h5>
            </div>
            <div class="card-body">
              <div class="notification-history">
                <div class="notification-history-item" *ngFor="let notification of recentNotifications">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="notification-content">
                      <h6 class="notification-title">{{ notification.title }}</h6>
                      <p class="notification-message">{{ notification.message }}</p>
                      <small class="text-muted">{{ formatDate(notification.timestamp) }}</small>
                    </div>
                    <div class="notification-status">
                      <span class="badge" [ngClass]="getStatusBadgeClass(notification.status)">
                        {{ notification.status }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="recentNotifications.length === 0">
                  <p class="text-muted">No recent notifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      padding: 20px;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .page-header h1 {
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .page-header p {
      color: #6c757d;
      margin-bottom: 0;
    }

    .category-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .category-section:last-child {
      border-bottom: none;
    }

    .category-title {
      color: #495057;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-size: 0.875rem;
      letter-spacing: 0.5px;
    }

    .notification-item {
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 10px;
      background-color: #fff;
    }

    .notification-item:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .notification-name {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 5px;
      color: #2c3e50;
    }

    .notification-description {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
    }

    .notification-controls {
      min-width: 120px;
    }

    .form-check-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .notification-type-selector select {
      width: 100px;
    }

    .quiet-hours-section {
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .action-buttons {
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .notification-history-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .notification-history-item:last-child {
      border-bottom: none;
    }

    .notification-title {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 5px;
    }

    .notification-message {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 5px;
    }

    .badge.bg-success {
      background-color: #28a745 !important;
    }

    .badge.bg-warning {
      background-color: #ffc107 !important;
    }

    .badge.bg-danger {
      background-color: #dc3545 !important;
    }

    .badge.bg-info {
      background-color: #17a2b8 !important;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  defaultMethod: string = 'email';
  frequency: string = 'immediate';
  categories: string[] = ['system', 'security', 'marketing', 'updates'];
  
  quietHours = {
    enabled: false,
    start: '22:00',
    end: '08:00'
  };

  notificationSettings: NotificationSetting[] = [
    {
      id: '1',
      name: 'System Alerts',
      description: 'Important system notifications and alerts',
      enabled: true,
      type: 'email',
      category: 'system'
    },
    {
      id: '2',
      name: 'Security Notifications',
      description: 'Login attempts and security-related alerts',
      enabled: true,
      type: 'email',
      category: 'security'
    },
    {
      id: '3',
      name: 'Credit Report Updates',
      description: 'Notifications when your credit report is updated',
      enabled: true,
      type: 'push',
      category: 'updates'
    },
    {
      id: '4',
      name: 'Dispute Status Changes',
      description: 'Updates on the status of your credit disputes',
      enabled: true,
      type: 'email',
      category: 'updates'
    },
    {
      id: '5',
      name: 'Marketing Communications',
      description: 'Promotional emails and marketing content',
      enabled: false,
      type: 'email',
      category: 'marketing'
    },
    {
      id: '6',
      name: 'Weekly Reports',
      description: 'Weekly summary of your credit repair progress',
      enabled: true,
      type: 'email',
      category: 'updates'
    }
  ];

  recentNotifications: any[] = [
    {
      title: 'Credit Score Updated',
      message: 'Your credit score has been updated. Check your dashboard for details.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'delivered'
    },
    {
      title: 'Dispute Filed Successfully',
      message: 'Your dispute for Account #1234 has been filed with the credit bureau.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'delivered'
    },
    {
      title: 'Security Alert',
      message: 'New login detected from a different device.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'delivered'
    }
  ];

  ngOnInit(): void {
    this.loadSettings();
  }

  getCategoryTitle(category: string): string {
    const titles: { [key: string]: string } = {
      'system': 'System Notifications',
      'security': 'Security Alerts',
      'marketing': 'Marketing Communications',
      'updates': 'Updates & Reports'
    };
    return titles[category] || category;
  }

  getSettingsByCategory(category: string): NotificationSetting[] {
    return this.notificationSettings.filter(setting => setting.category === category);
  }

  updateNotificationSetting(setting: NotificationSetting): void {
    console.log('Updated notification setting:', setting);
    // Here you would typically save to backend
  }

  saveSettings(): void {
    console.log('Saving notification settings...');
    // Here you would save all settings to backend
    alert('Notification settings saved successfully!');
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all notification settings to defaults?')) {
      this.defaultMethod = 'email';
      this.frequency = 'immediate';
      this.quietHours = {
        enabled: false,
        start: '22:00',
        end: '08:00'
      };
      
      // Reset all notification settings
      this.notificationSettings.forEach(setting => {
        setting.enabled = setting.category !== 'marketing';
        setting.type = 'email';
      });
      
      console.log('Settings reset to defaults');
    }
  }

  testNotification(): void {
    console.log('Sending test notification...');
    alert('Test notification sent! Check your selected notification method.');
  }

  loadSettings(): void {
    // Here you would load settings from backend
    console.log('Loading notification settings...');
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'delivered': 'bg-success',
      'pending': 'bg-warning',
      'failed': 'bg-danger',
      'read': 'bg-info'
    };
    return `badge ${classes[status] || 'bg-secondary'}`;
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