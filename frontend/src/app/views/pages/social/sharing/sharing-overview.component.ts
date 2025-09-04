import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sharing-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="sharing-overview-container">
      <div class="header">
        <h1>Content Sharing Hub</h1>
        <p>Create, manage, and share your social media content across all platforms</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-share-alt"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalShares }}</h3>
            <p>Total Shares</p>
            <span class="stat-change positive">+12% this month</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-eye"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalViews }}</h3>
            <p>Total Views</p>
            <span class="stat-change positive">+8% this month</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-heart"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.totalEngagement }}</h3>
            <p>Engagement Rate</p>
            <span class="stat-change positive">+5% this month</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.activeTemplates }}</h3>
            <p>Active Templates</p>
            <span class="stat-change neutral">No change</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <div class="action-card" [routerLink]="['/social/sharing/campaigns/create']">
            <div class="action-icon">
              <i class="fas fa-bullhorn"></i>
            </div>
            <div class="action-content">
              <h3>Create Campaign</h3>
              <p>Launch a new social media campaign</p>
            </div>
            <i class="fas fa-arrow-right action-arrow"></i>
          </div>

          <div class="action-card" [routerLink]="['/social/sharing/templates/create']">
            <div class="action-icon">
              <i class="fas fa-palette"></i>
            </div>
            <div class="action-content">
              <h3>Design Template</h3>
              <p>Create a new content template</p>
            </div>
            <i class="fas fa-arrow-right action-arrow"></i>
          </div>

          <div class="action-card" (click)="schedulePost()">
            <div class="action-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="action-content">
              <h3>Schedule Post</h3>
              <p>Plan your content calendar</p>
            </div>
            <i class="fas fa-arrow-right action-arrow"></i>
          </div>

          <div class="action-card" [routerLink]="['/social/analytics']">
            <div class="action-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="action-content">
              <h3>View Analytics</h3>
              <p>Track performance metrics</p>
            </div>
            <i class="fas fa-arrow-right action-arrow"></i>
          </div>
        </div>
      </div>

      <div class="content-sections">
        <div class="section">
          <div class="section-header">
            <h2>Recent Campaigns</h2>
            <a [routerLink]="['/social/sharing/campaigns']" class="view-all">View All</a>
          </div>
          <div class="campaigns-list">
            <div class="campaign-item" *ngFor="let campaign of recentCampaigns">
              <div class="campaign-info">
                <h4>{{ campaign.name }}</h4>
                <p>{{ campaign.description }}</p>
                <div class="campaign-meta">
                  <span class="status" [class]="campaign.status">{{ campaign.status | titlecase }}</span>
                  <span class="date">{{ formatDate(campaign.createdAt) }}</span>
                </div>
              </div>
              <div class="campaign-stats">
                <div class="stat">
                  <span class="value">{{ campaign.posts }}</span>
                  <span class="label">Posts</span>
                </div>
                <div class="stat">
                  <span class="value">{{ campaign.reach }}</span>
                  <span class="label">Reach</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>Popular Templates</h2>
            <a [routerLink]="['/social/sharing/templates']" class="view-all">View All</a>
          </div>
          <div class="templates-grid">
            <div class="template-card" *ngFor="let template of popularTemplates">
              <div class="template-preview">
                <img [src]="template.thumbnail || '/assets/template-placeholder.jpg'" [alt]="template.name">
              </div>
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p>{{ template.category }}</p>
                <div class="template-stats">
                  <span><i class="fas fa-download"></i> {{ template.uses }}</span>
                  <span><i class="fas fa-star"></i> {{ template.rating }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="platform-status">
        <h2>Platform Connections</h2>
        <div class="platforms-grid">
          <div class="platform-card" *ngFor="let platform of platforms" [class]="platform.status">
            <div class="platform-icon">
              <i [class]="platform.icon"></i>
            </div>
            <div class="platform-info">
              <h4>{{ platform.name }}</h4>
              <p class="status-text">{{ platform.statusText }}</p>
              <button class="btn btn-sm" [class]="platform.status === 'connected' ? 'btn-outline-danger' : 'btn-primary'" 
                      (click)="togglePlatform(platform)">
                {{ platform.status === 'connected' ? 'Disconnect' : 'Connect' }}
              </button>
            </div>
            <div class="status-indicator" [class]="platform.status"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sharing-overview-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 32px;
    }

    .header p {
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }

    .stat-content h3 {
      margin: 0 0 5px 0;
      font-size: 28px;
      font-weight: 700;
      color: #333;
    }

    .stat-content p {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 14px;
    }

    .stat-change {
      font-size: 12px;
      font-weight: 600;
    }

    .stat-change.positive {
      color: #28a745;
    }

    .stat-change.negative {
      color: #dc3545;
    }

    .stat-change.neutral {
      color: #6c757d;
    }

    .quick-actions {
      margin-bottom: 40px;
    }

    .quick-actions h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: inherit;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      text-decoration: none;
      color: inherit;
    }

    .action-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #007bff;
      font-size: 20px;
    }

    .action-content {
      flex: 1;
    }

    .action-content h3 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 16px;
    }

    .action-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .action-arrow {
      color: #ccc;
      font-size: 16px;
    }

    .content-sections {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }

    .view-all {
      color: #007bff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .campaigns-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .campaign-item {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .campaign-info h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .campaign-info p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
    }

    .campaign-meta {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status.active {
      background: #d4edda;
      color: #155724;
    }

    .status.draft {
      background: #fff3cd;
      color: #856404;
    }

    .status.completed {
      background: #d1ecf1;
      color: #0c5460;
    }

    .date {
      color: #666;
      font-size: 12px;
    }

    .campaign-stats {
      display: flex;
      gap: 20px;
    }

    .stat {
      text-align: center;
    }

    .stat .value {
      display: block;
      font-weight: 700;
      color: #333;
    }

    .stat .label {
      font-size: 12px;
      color: #666;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .template-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .template-card:hover {
      transform: translateY(-2px);
    }

    .template-preview {
      height: 100px;
      overflow: hidden;
    }

    .template-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .template-info {
      padding: 15px;
    }

    .template-info h4 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 14px;
    }

    .template-info p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 12px;
    }

    .template-stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
    }

    .platform-status h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .platform-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 15px;
      position: relative;
    }

    .platform-icon {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .platform-card.connected .platform-icon {
      background: #d4edda;
      color: #28a745;
    }

    .platform-card.disconnected .platform-icon {
      background: #f8d7da;
      color: #dc3545;
    }

    .platform-info {
      flex: 1;
    }

    .platform-info h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .status-text {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      position: absolute;
      top: 15px;
      right: 15px;
    }

    .status-indicator.connected {
      background: #28a745;
    }

    .status-indicator.disconnected {
      background: #dc3545;
    }

    .btn {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-outline-danger {
      background: transparent;
      color: #dc3545;
      border: 1px solid #dc3545;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 11px;
    }

    @media (max-width: 768px) {
      .content-sections {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SharingOverviewComponent implements OnInit {
  stats = {
    totalShares: '2.4K',
    totalViews: '18.7K',
    totalEngagement: '4.2%',
    activeTemplates: 12
  };

  recentCampaigns: any[] = [];
  popularTemplates: any[] = [];
  platforms: any[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Mock data - replace with actual API calls
    this.recentCampaigns = [
      {
        id: 1,
        name: 'Credit Education Series',
        description: 'Educational content about credit repair',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        posts: 8,
        reach: '2.1K'
      },
      {
        id: 2,
        name: 'Financial Wellness Tips',
        description: 'Weekly tips for financial health',
        status: 'draft',
        createdAt: new Date('2024-01-20'),
        posts: 5,
        reach: '1.8K'
      },
      {
        id: 3,
        name: 'Success Stories',
        description: 'Client testimonials and case studies',
        status: 'completed',
        createdAt: new Date('2024-01-10'),
        posts: 12,
        reach: '3.2K'
      }
    ];

    this.popularTemplates = [
      {
        id: 1,
        name: 'Credit Tip Card',
        category: 'Educational',
        uses: 45,
        rating: 4.8,
        thumbnail: '/assets/template1.jpg'
      },
      {
        id: 2,
        name: 'Success Story',
        category: 'Testimonial',
        uses: 32,
        rating: 4.6,
        thumbnail: '/assets/template2.jpg'
      },
      {
        id: 3,
        name: 'Quote Post',
        category: 'Motivational',
        uses: 28,
        rating: 4.7,
        thumbnail: '/assets/template3.jpg'
      },
      {
        id: 4,
        name: 'Infographic',
        category: 'Educational',
        uses: 21,
        rating: 4.5,
        thumbnail: '/assets/template4.jpg'
      }
    ];

    this.platforms = [
      {
        id: 1,
        name: 'Facebook',
        icon: 'fab fa-facebook',
        status: 'connected',
        statusText: 'Connected and active'
      },
      {
        id: 2,
        name: 'Twitter',
        icon: 'fab fa-twitter',
        status: 'connected',
        statusText: 'Connected and active'
      },
      {
        id: 3,
        name: 'LinkedIn',
        icon: 'fab fa-linkedin',
        status: 'disconnected',
        statusText: 'Not connected'
      },
      {
        id: 4,
        name: 'Instagram',
        icon: 'fab fa-instagram',
        status: 'disconnected',
        statusText: 'Not connected'
      }
    ];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  schedulePost() {
    // Implement post scheduling logic
    console.log('Opening post scheduler');
  }

  togglePlatform(platform: any) {
    // Implement platform connection toggle
    if (platform.status === 'connected') {
      platform.status = 'disconnected';
      platform.statusText = 'Not connected';
    } else {
      platform.status = 'connected';
      platform.statusText = 'Connected and active';
    }
  }
}