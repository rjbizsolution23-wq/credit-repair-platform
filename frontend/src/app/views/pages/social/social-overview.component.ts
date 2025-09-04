import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface SocialStats {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  totalImpressions: number;
  engagementRate: number;
  followerGrowth: number;
}

interface PlatformStats {
  platform: string;
  posts: number;
  engagement: number;
  reach: number;
  followers: number;
  icon: string;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'share';
  platform: string;
  content: string;
  timestamp: Date;
  engagement: number;
}

@Component({
  selector: 'app-social-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="social-overview">
      <!-- Header -->
      <div class="overview-header">
        <div class="header-content">
          <h1>Social Media Overview</h1>
          <p>Monitor your social media performance across all platforms</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="refreshData()">
            <i class="fas fa-sync-alt" [class.spinning]="isLoading"></i>
            Refresh
          </button>
          <button class="btn btn-primary" routerLink="/social/posts/create">
            <i class="fas fa-plus"></i>
            Create Post
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading social media data...</p>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading" class="overview-content">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalPosts | number }}</h3>
              <p>Total Posts</p>
              <span class="stat-change positive">+12% this month</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-heart"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalEngagement | number }}</h3>
              <p>Total Engagement</p>
              <span class="stat-change positive">+8% this month</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.totalReach | number }}</h3>
              <p>Total Reach</p>
              <span class="stat-change positive">+15% this month</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <h3>{{ stats.engagementRate | number:'1.1-1' }}%</h3>
              <p>Engagement Rate</p>
              <span class="stat-change positive">+2.3% this month</span>
            </div>
          </div>
        </div>

        <!-- Platform Performance -->
        <div class="section">
          <div class="section-header">
            <h2>Platform Performance</h2>
            <div class="section-actions">
              <select class="form-select" [(ngModel)]="selectedPeriod" (change)="onPeriodChange()">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          <div class="platforms-grid">
            <div *ngFor="let platform of platformStats" class="platform-card" [style.border-left-color]="platform.color">
              <div class="platform-header">
                <div class="platform-info">
                  <i [class]="platform.icon" [style.color]="platform.color"></i>
                  <h3>{{ platform.platform }}</h3>
                </div>
                <button class="btn btn-sm btn-outline" [routerLink]="['/social/accounts']" [queryParams]="{platform: platform.platform.toLowerCase()}">
                  View Details
                </button>
              </div>
              <div class="platform-stats">
                <div class="platform-stat">
                  <span class="stat-label">Posts</span>
                  <span class="stat-value">{{ platform.posts }}</span>
                </div>
                <div class="platform-stat">
                  <span class="stat-label">Engagement</span>
                  <span class="stat-value">{{ platform.engagement | number }}</span>
                </div>
                <div class="platform-stat">
                  <span class="stat-label">Reach</span>
                  <span class="stat-value">{{ platform.reach | number }}</span>
                </div>
                <div class="platform-stat">
                  <span class="stat-label">Followers</span>
                  <span class="stat-value">{{ platform.followers | number }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section">
          <div class="section-header">
            <h2>Recent Activity</h2>
            <button class="btn btn-outline" routerLink="/social/posts">
              View All Posts
            </button>
          </div>

          <div class="activity-list">
            <div *ngFor="let activity of recentActivity" class="activity-item">
              <div class="activity-icon">
                <i [class]="getActivityIcon(activity.type)"></i>
              </div>
              <div class="activity-content">
                <div class="activity-header">
                  <span class="activity-type">{{ getActivityTypeLabel(activity.type) }}</span>
                  <span class="activity-platform">{{ activity.platform }}</span>
                  <span class="activity-time">{{ getTimeAgo(activity.timestamp) }}</span>
                </div>
                <p class="activity-text">{{ activity.content }}</p>
                <div class="activity-stats">
                  <span class="engagement-count">
                    <i class="fas fa-heart"></i>
                    {{ activity.engagement }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section">
          <div class="section-header">
            <h2>Quick Actions</h2>
          </div>

          <div class="quick-actions">
            <button class="action-card" routerLink="/social/posts/create">
              <i class="fas fa-plus"></i>
              <span>Create New Post</span>
            </button>
            <button class="action-card" routerLink="/social/accounts">
              <i class="fas fa-link"></i>
              <span>Connect Account</span>
            </button>
            <button class="action-card" routerLink="/social/sharing/templates">
              <i class="fas fa-template"></i>
              <span>Browse Templates</span>
            </button>
            <button class="action-card" routerLink="/social/analytics">
              <i class="fas fa-chart-bar"></i>
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .social-overview {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2rem;
      font-weight: 600;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-outline {
      background: white;
      color: #007bff;
      border: 1px solid #007bff;
    }

    .btn-outline:hover {
      background: #007bff;
      color: white;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .loading-spinner {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #007bff;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      background: #f8f9fa;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: #007bff;
    }

    .stat-content h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #333;
    }

    .stat-content p {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.875rem;
    }

    .stat-change {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .stat-change.positive {
      background: #d4edda;
      color: #155724;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .form-select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      color: #333;
    }

    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .platform-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #007bff;
    }

    .platform-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .platform-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .platform-info i {
      font-size: 1.5rem;
    }

    .platform-info h3 {
      margin: 0;
      color: #333;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .platform-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .platform-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .activity-list {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: #f8f9fa;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007bff;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .activity-type {
      font-weight: 600;
      color: #333;
    }

    .activity-platform {
      color: #007bff;
      font-weight: 500;
    }

    .activity-time {
      color: #666;
      margin-left: auto;
    }

    .activity-text {
      margin: 0 0 0.5rem 0;
      color: #333;
      line-height: 1.4;
    }

    .activity-stats {
      display: flex;
      gap: 1rem;
    }

    .engagement-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: #666;
    }

    .engagement-count i {
      color: #e74c3c;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #333;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .action-card i {
      font-size: 2rem;
      color: #007bff;
    }

    .action-card span {
      font-weight: 500;
      text-align: center;
    }

    @media (max-width: 768px) {
      .social-overview {
        padding: 1rem;
      }

      .overview-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .header-actions {
        justify-content: stretch;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .platforms-grid {
        grid-template-columns: 1fr;
      }

      .platform-stats {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class SocialOverviewComponent implements OnInit {
  stats: SocialStats = {
    totalPosts: 0,
    totalEngagement: 0,
    totalReach: 0,
    totalImpressions: 0,
    engagementRate: 0,
    followerGrowth: 0
  };

  platformStats: PlatformStats[] = [];
  recentActivity: RecentActivity[] = [];
  isLoading: boolean = true;
  selectedPeriod: string = '30d';

  ngOnInit(): void {
    this.loadOverviewData();
  }

  loadOverviewData(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.stats = {
        totalPosts: 156,
        totalEngagement: 12450,
        totalReach: 89300,
        totalImpressions: 156780,
        engagementRate: 4.2,
        followerGrowth: 8.5
      };

      this.platformStats = [
        {
          platform: 'Facebook',
          posts: 45,
          engagement: 3200,
          reach: 25000,
          followers: 8500,
          icon: 'fab fa-facebook',
          color: '#1877f2'
        },
        {
          platform: 'Instagram',
          posts: 62,
          engagement: 5800,
          reach: 35000,
          followers: 12300,
          icon: 'fab fa-instagram',
          color: '#e4405f'
        },
        {
          platform: 'Twitter',
          posts: 38,
          engagement: 2100,
          reach: 18000,
          followers: 5600,
          icon: 'fab fa-twitter',
          color: '#1da1f2'
        },
        {
          platform: 'LinkedIn',
          posts: 11,
          engagement: 1350,
          reach: 11300,
          followers: 3200,
          icon: 'fab fa-linkedin',
          color: '#0077b5'
        }
      ];

      this.recentActivity = [
        {
          id: '1',
          type: 'post',
          platform: 'Instagram',
          content: 'New credit repair success story shared with before/after credit scores',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          engagement: 245
        },
        {
          id: '2',
          type: 'comment',
          platform: 'Facebook',
          content: 'Responded to customer inquiry about credit monitoring services',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          engagement: 12
        },
        {
          id: '3',
          type: 'post',
          platform: 'LinkedIn',
          content: 'Published article: "5 Common Credit Report Errors and How to Fix Them"',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          engagement: 89
        },
        {
          id: '4',
          type: 'share',
          platform: 'Twitter',
          content: 'Shared industry news about new credit scoring changes',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          engagement: 34
        }
      ];

      this.isLoading = false;
    }, 1500);
  }

  refreshData(): void {
    this.loadOverviewData();
  }

  onPeriodChange(): void {
    this.loadOverviewData();
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'post': return 'fas fa-file-alt';
      case 'comment': return 'fas fa-comment';
      case 'like': return 'fas fa-heart';
      case 'share': return 'fas fa-share';
      default: return 'fas fa-circle';
    }
  }

  getActivityTypeLabel(type: string): string {
    switch (type) {
      case 'post': return 'Posted';
      case 'comment': return 'Commented';
      case 'like': return 'Liked';
      case 'share': return 'Shared';
      default: return 'Activity';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  }
}