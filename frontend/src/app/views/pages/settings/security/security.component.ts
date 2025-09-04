import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'authentication' | 'privacy' | 'access' | 'monitoring';
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  loginTime: Date;
  lastActivity: Date;
  isCurrentSession: boolean;
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, FeatherIconDirective],
  template: `
    <div class="security-container">
      <div class="page-header">
        <h1>Security Settings</h1>
        <p>Manage your account security and privacy settings</p>
      </div>

      <!-- Password Security -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Password & Authentication</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="security-item">
                    <h6>Change Password</h6>
                    <p class="text-muted">Last changed: {{ lastPasswordChange | date:'medium' }}</p>
                    <button type="button" class="btn btn-outline-primary btn-sm" (click)="changePassword()">
                      <i data-feather="key" appFeatherIcon></i>
                      Change Password
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="security-item">
                    <h6>Two-Factor Authentication</h6>
                    <p class="text-muted">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</p>
                    <button 
                      type="button" 
                      class="btn btn-sm"
                      [ngClass]="twoFactorEnabled ? 'btn-outline-danger' : 'btn-outline-success'"
                      (click)="toggleTwoFactor()">
                      <i [attr.data-feather]="twoFactorEnabled ? 'shield-off' : 'shield'" appFeatherIcon></i>
                      {{ twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Security Preferences</h5>
            </div>
            <div class="card-body">
              <div class="security-settings">
                <div class="setting-category" *ngFor="let category of categories">
                  <h6 class="category-title">{{ getCategoryTitle(category) }}</h6>
                  <div class="setting-items">
                    <div class="setting-item" *ngFor="let setting of getSettingsByCategory(category)">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="setting-info">
                          <h6 class="setting-name">{{ setting.name }}</h6>
                          <p class="setting-description">{{ setting.description }}</p>
                        </div>
                        <div class="setting-control">
                          <div class="form-check form-switch">
                            <input 
                              class="form-check-input" 
                              type="checkbox" 
                              [id]="'security-' + setting.id"
                              [(ngModel)]="setting.enabled"
                              (change)="updateSecuritySetting(setting)">
                            <label class="form-check-label" [for]="'security-' + setting.id">
                              {{ setting.enabled ? 'Enabled' : 'Disabled' }}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Sessions -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Active Sessions</h5>
              <button type="button" class="btn btn-outline-danger btn-sm" (click)="terminateAllSessions()">
                <i data-feather="log-out" appFeatherIcon></i>
                Terminate All Other Sessions
              </button>
            </div>
            <div class="card-body">
              <div class="session-list">
                <div class="session-item" *ngFor="let session of activeSessions">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="session-info">
                      <h6 class="session-device">
                        {{ session.device }}
                        <span class="badge bg-success ms-2" *ngIf="session.isCurrentSession">Current</span>
                      </h6>
                      <p class="session-details">
                        <i data-feather="map-pin" appFeatherIcon class="me-1"></i>
                        {{ session.location }}
                        <br>
                        <i data-feather="globe" appFeatherIcon class="me-1"></i>
                        {{ session.ipAddress }}
                        <br>
                        <i data-feather="clock" appFeatherIcon class="me-1"></i>
                        Login: {{ formatDate(session.loginTime) }}
                        <br>
                        <i data-feather="activity" appFeatherIcon class="me-1"></i>
                        Last activity: {{ formatDate(session.lastActivity) }}
                      </p>
                    </div>
                    <div class="session-actions" *ngIf="!session.isCurrentSession">
                      <button 
                        type="button" 
                        class="btn btn-outline-danger btn-sm"
                        (click)="terminateSession(session)">
                        <i data-feather="x" appFeatherIcon></i>
                        Terminate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Log -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Security Activity Log</h5>
            </div>
            <div class="card-body">
              <div class="security-log">
                <div class="log-item" *ngFor="let logEntry of securityLog">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="log-info">
                      <h6 class="log-action">{{ logEntry.action }}</h6>
                      <p class="log-details">
                        {{ logEntry.details }}
                        <br>
                        <small class="text-muted">{{ formatDate(logEntry.timestamp) }}</small>
                      </p>
                    </div>
                    <div class="log-status">
                      <span class="badge" [ngClass]="getLogStatusClass(logEntry.status)">
                        {{ logEntry.status }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="securityLog.length === 0">
                  <p class="text-muted">No security activity recorded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Export -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Data & Privacy</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="privacy-item">
                    <h6>Export Your Data</h6>
                    <p class="text-muted">Download a copy of all your data</p>
                    <button type="button" class="btn btn-outline-info btn-sm" (click)="exportData()">
                      <i data-feather="download" appFeatherIcon></i>
                      Request Data Export
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="privacy-item">
                    <h6>Delete Account</h6>
                    <p class="text-muted">Permanently delete your account and all data</p>
                    <button type="button" class="btn btn-outline-danger btn-sm" (click)="deleteAccount()">
                      <i data-feather="trash-2" appFeatherIcon></i>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .security-container {
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

    .security-item {
      padding: 20px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      background-color: #fff;
    }

    .security-item h6 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .security-item p {
      margin-bottom: 15px;
    }

    .setting-category {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .setting-category:last-child {
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

    .setting-item {
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 10px;
      background-color: #fff;
    }

    .setting-item:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .setting-name {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 5px;
      color: #2c3e50;
    }

    .setting-description {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
    }

    .session-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .session-item:last-child {
      border-bottom: none;
    }

    .session-device {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .session-details {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
      line-height: 1.6;
    }

    .log-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .log-item:last-child {
      border-bottom: none;
    }

    .log-action {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 5px;
      color: #2c3e50;
    }

    .log-details {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
    }

    .privacy-item {
      padding: 20px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      background-color: #fff;
    }

    .privacy-item h6 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .privacy-item p {
      margin-bottom: 15px;
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

    .form-check-label {
      font-size: 0.875rem;
      font-weight: 500;
    }
  `]
})
export class SecurityComponent implements OnInit {
  lastPasswordChange: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  twoFactorEnabled: boolean = false;
  categories: string[] = ['authentication', 'privacy', 'access', 'monitoring'];

  securitySettings: SecuritySetting[] = [
    {
      id: '1',
      name: 'Login Notifications',
      description: 'Get notified when someone logs into your account',
      enabled: true,
      type: 'authentication'
    },
    {
      id: '2',
      name: 'Failed Login Alerts',
      description: 'Alert when there are failed login attempts',
      enabled: true,
      type: 'authentication'
    },
    {
      id: '3',
      name: 'Session Timeout',
      description: 'Automatically log out after period of inactivity',
      enabled: true,
      type: 'authentication'
    },
    {
      id: '4',
      name: 'Data Sharing',
      description: 'Allow sharing of anonymized data for service improvement',
      enabled: false,
      type: 'privacy'
    },
    {
      id: '5',
      name: 'Marketing Communications',
      description: 'Receive marketing emails and promotional content',
      enabled: false,
      type: 'privacy'
    },
    {
      id: '6',
      name: 'API Access',
      description: 'Allow third-party applications to access your data',
      enabled: false,
      type: 'access'
    },
    {
      id: '7',
      name: 'Activity Monitoring',
      description: 'Monitor and log all account activity',
      enabled: true,
      type: 'monitoring'
    }
  ];

  activeSessions: LoginSession[] = [
    {
      id: '1',
      device: 'Chrome on Windows 11',
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      loginTime: new Date(),
      lastActivity: new Date(),
      isCurrentSession: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, NY',
      ipAddress: '192.168.1.101',
      loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      isCurrentSession: false
    }
  ];

  securityLog: any[] = [
    {
      action: 'Password Changed',
      details: 'Password was successfully changed from Chrome on Windows',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'success'
    },
    {
      action: 'Login Attempt',
      details: 'Successful login from Safari on iPhone',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'success'
    },
    {
      action: 'Failed Login',
      details: 'Failed login attempt from unknown device',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'warning'
    }
  ];

  ngOnInit(): void {
    this.loadSecuritySettings();
  }

  getCategoryTitle(category: string): string {
    const titles: { [key: string]: string } = {
      'authentication': 'Authentication & Login',
      'privacy': 'Privacy Settings',
      'access': 'Access Control',
      'monitoring': 'Activity Monitoring'
    };
    return titles[category] || category;
  }

  getSettingsByCategory(category: string): SecuritySetting[] {
    return this.securitySettings.filter(setting => setting.type === category);
  }

  updateSecuritySetting(setting: SecuritySetting): void {
    console.log('Updated security setting:', setting);
    // Here you would typically save to backend
  }

  changePassword(): void {
    console.log('Opening change password dialog...');
    // Here you would open a password change modal/dialog
    alert('Password change functionality would be implemented here');
  }

  toggleTwoFactor(): void {
    if (this.twoFactorEnabled) {
      if (confirm('Are you sure you want to disable two-factor authentication?')) {
        this.twoFactorEnabled = false;
        console.log('2FA disabled');
      }
    } else {
      console.log('Setting up 2FA...');
      // Here you would open 2FA setup process
      alert('Two-factor authentication setup would be implemented here');
      this.twoFactorEnabled = true;
    }
  }

  terminateSession(session: LoginSession): void {
    if (confirm(`Are you sure you want to terminate the session on ${session.device}?`)) {
      this.activeSessions = this.activeSessions.filter(s => s.id !== session.id);
      console.log('Session terminated:', session);
    }
  }

  terminateAllSessions(): void {
    if (confirm('Are you sure you want to terminate all other sessions? You will remain logged in on this device.')) {
      this.activeSessions = this.activeSessions.filter(s => s.isCurrentSession);
      console.log('All other sessions terminated');
    }
  }

  exportData(): void {
    console.log('Requesting data export...');
    alert('Data export request submitted. You will receive an email when your data is ready for download.');
  }

  deleteAccount(): void {
    const confirmation = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmation === 'DELETE') {
      console.log('Account deletion requested');
      alert('Account deletion request submitted. You will receive a confirmation email.');
    } else if (confirmation !== null) {
      alert('Account deletion cancelled. Please type "DELETE" exactly to confirm.');
    }
  }

  loadSecuritySettings(): void {
    // Here you would load settings from backend
    console.log('Loading security settings...');
  }

  getLogStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'success': 'bg-success',
      'warning': 'bg-warning',
      'error': 'bg-danger',
      'info': 'bg-info'
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