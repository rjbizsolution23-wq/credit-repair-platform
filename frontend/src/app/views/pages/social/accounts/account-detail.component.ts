import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface SocialAccount {
  id: string;
  name: string;
  platform: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  followers: number;
  following: number;
  posts: number;
  lastSync: Date;
  autoPost: boolean;
  profileImage?: string;
  description?: string;
  connectionDate: Date;
}

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="account-detail-container" *ngIf="account">
      <div class="header">
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back to Accounts
        </button>
        <div class="account-header">
          <div class="account-avatar">
            <img [src]="account.profileImage || '/assets/default-avatar.png'" [alt]="account.name">
            <div class="platform-badge">
              <i [class]="getPlatformIcon(account.platform)"></i>
            </div>
          </div>
          <div class="account-info">
            <h1>{{ account.name }}</h1>
            <p class="username">{{ account.username }}</p>
            <div class="status-badge" [class]="'status-' + account.status">
              <i [class]="getStatusIcon(account.status)"></i>
              {{ account.status | titlecase }}
            </div>
          </div>
          <div class="account-actions">
            <button class="btn-primary" (click)="editAccount()">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-secondary" (click)="syncAccount()" [disabled]="isSyncing">
              <i class="fas fa-sync" [class.fa-spin]="isSyncing"></i>
              {{ isSyncing ? 'Syncing...' : 'Sync' }}
            </button>
            <button class="btn-danger" (click)="disconnectAccount()">
              <i class="fas fa-unlink"></i> Disconnect
            </button>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="stats-section">
          <h3>Account Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ formatNumber(account.followers) }}</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatNumber(account.following) }}</div>
              <div class="stat-label">Following</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ formatNumber(account.posts) }}</div>
              <div class="stat-label">Posts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ getEngagementRate() }}%</div>
              <div class="stat-label">Engagement</div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3>Account Settings</h3>
          <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
            <div class="form-group">
              <label>
                <input type="checkbox" formControlName="autoPost">
                Enable automatic posting
              </label>
              <small>Automatically post content to this account</small>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" formControlName="notifications">
                Enable notifications
              </label>
              <small>Receive notifications for this account</small>
            </div>

            <div class="form-group">
              <label for="postFrequency">Post Frequency</label>
              <select id="postFrequency" formControlName="postFrequency">
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                formControlName="description"
                placeholder="Add a description for this account"
                rows="3"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="settingsForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </form>
        </div>

        <div class="activity-section">
          <h3>Recent Activity</h3>
          <div class="activity-list">
            <div *ngFor="let activity of recentActivity" class="activity-item">
              <div class="activity-icon">
                <i [class]="activity.icon"></i>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-description">{{ activity.description }}</div>
                <div class="activity-time">{{ formatDate(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="connection-info">
          <h3>Connection Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Platform:</label>
              <span>{{ account.platform | titlecase }}</span>
            </div>
            <div class="info-item">
              <label>Connected:</label>
              <span>{{ formatDate(account.connectionDate) }}</span>
            </div>
            <div class="info-item">
              <label>Last Sync:</label>
              <span>{{ formatDate(account.lastSync) }}</span>
            </div>
            <div class="info-item">
              <label>Account ID:</label>
              <span class="account-id">{{ account.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-container" *ngIf="!account">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading account details...</p>
      </div>
    </div>
  `,
  styles: [`
    .account-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    .btn-back {
      background: none;
      border: none;
      color: #007bff;
      font-size: 1rem;
      cursor: pointer;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-back:hover {
      text-decoration: underline;
    }

    .account-header {
      display: flex;
      align-items: center;
      gap: 2rem;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .account-avatar {
      position: relative;
    }

    .account-avatar img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
    }

    .platform-badge {
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }

    .account-info {
      flex: 1;
    }

    .account-info h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .username {
      color: #666;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .status-connected {
      background-color: #d4edda;
      color: #155724;
    }

    .status-disconnected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-error {
      background-color: #fff3cd;
      color: #856404;
    }

    .account-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-primary:hover { background-color: #0056b3; }
    .btn-secondary:hover { background-color: #545b62; }
    .btn-danger:hover { background-color: #c82333; }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .stats-section,
    .settings-section,
    .activity-section,
    .connection-info {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stats-section h3,
    .settings-section h3,
    .activity-section h3,
    .connection-info h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-card {
      text-align: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #007bff;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .form-group small {
      display: block;
      color: #666;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .activity-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid #eee;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: #f8f9fa;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007bff;
    }

    .activity-title {
      font-weight: 500;
      color: #333;
    }

    .activity-description {
      color: #666;
      font-size: 0.9rem;
      margin: 0.25rem 0;
    }

    .activity-time {
      color: #999;
      font-size: 0.8rem;
    }

    .info-grid {
      display: grid;
      gap: 1rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item label {
      font-weight: 500;
      color: #333;
    }

    .account-id {
      font-family: monospace;
      background: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-spinner {
      text-align: center;
      color: #666;
    }

    .loading-spinner i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .account-header {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .account-actions {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `]
})
export class AccountDetailComponent implements OnInit {
  account: SocialAccount | null = null;
  settingsForm: FormGroup;
  isSyncing: boolean = false;
  isSaving: boolean = false;
  recentActivity: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.fb.group({
      autoPost: [false],
      notifications: [true],
      postFrequency: ['daily'],
      description: ['']
    });
  }

  ngOnInit(): void {
    const accountId = this.route.snapshot.paramMap.get('id');
    if (accountId) {
      this.loadAccount(accountId);
      this.loadRecentActivity(accountId);
    }
  }

  loadAccount(id: string): void {
    // Simulate API call
    setTimeout(() => {
      this.account = {
        id: id,
        name: 'My Business Account',
        platform: 'facebook',
        username: '@mybusiness',
        status: 'connected',
        followers: 15420,
        following: 892,
        posts: 234,
        lastSync: new Date(),
        autoPost: true,
        profileImage: '/assets/default-avatar.png',
        description: 'Official business account for social media marketing',
        connectionDate: new Date('2024-01-15')
      };

      // Update form with account settings
      this.settingsForm.patchValue({
        autoPost: this.account.autoPost,
        notifications: true,
        postFrequency: 'daily',
        description: this.account.description
      });
    }, 1000);
  }

  loadRecentActivity(accountId: string): void {
    // Simulate API call
    this.recentActivity = [
      {
        icon: 'fas fa-share',
        title: 'Post Published',
        description: 'New blog post shared successfully',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        icon: 'fas fa-sync',
        title: 'Account Synced',
        description: 'Profile information updated',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        icon: 'fas fa-heart',
        title: 'Engagement Update',
        description: '25 new likes and 8 comments',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000)
      }
    ];
  }

  getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      facebook: 'fab fa-facebook',
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      linkedin: 'fab fa-linkedin',
      youtube: 'fab fa-youtube',
      tiktok: 'fab fa-tiktok'
    };
    return icons[platform] || 'fas fa-globe';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      connected: 'fas fa-check-circle',
      disconnected: 'fas fa-times-circle',
      error: 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

  getEngagementRate(): string {
    // Calculate mock engagement rate
    return '4.2';
  }

  editAccount(): void {
    this.router.navigate(['/social/accounts', this.account?.id, 'settings']);
  }

  syncAccount(): void {
    this.isSyncing = true;
    // Simulate sync operation
    setTimeout(() => {
      this.isSyncing = false;
      if (this.account) {
        this.account.lastSync = new Date();
      }
    }, 2000);
  }

  disconnectAccount(): void {
    if (confirm('Are you sure you want to disconnect this account?')) {
      console.log('Disconnecting account:', this.account?.id);
      this.router.navigate(['/social/accounts']);
    }
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.isSaving = true;
      const settings = this.settingsForm.value;
      
      // Simulate API call
      setTimeout(() => {
        console.log('Saving settings:', settings);
        this.isSaving = false;
        
        // Update account with new settings
        if (this.account) {
          this.account.autoPost = settings.autoPost;
          this.account.description = settings.description;
        }
      }, 1000);
    }
  }

  goBack(): void {
    this.router.navigate(['/social/accounts']);
  }
}