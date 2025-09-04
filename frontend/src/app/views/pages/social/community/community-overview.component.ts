import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-community-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="mb-1">Community Overview</h2>
              <p class="text-muted mb-0">Manage your community engagement and activities</p>
            </div>
            <div>
              <button class="btn btn-primary" routerLink="/social/community/groups/create">
                <i class="fas fa-plus me-2"></i>Create Group
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row mb-4">
        <div class="col-xl-3 col-md-6">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-primary">
                  <i class="fas fa-users"></i>
                </div>
                <div class="ms-3">
                  <h3 class="mb-0">{{ stats.totalMembers }}</h3>
                  <p class="text-muted mb-0">Total Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-success">
                  <i class="fas fa-comments"></i>
                </div>
                <div class="ms-3">
                  <h3 class="mb-0">{{ stats.activeDiscussions }}</h3>
                  <p class="text-muted mb-0">Active Discussions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-info">
                  <i class="fas fa-calendar"></i>
                </div>
                <div class="ms-3">
                  <h3 class="mb-0">{{ stats.upcomingEvents }}</h3>
                  <p class="text-muted mb-0">Upcoming Events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="card stats-card">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stats-icon bg-warning">
                  <i class="fas fa-layer-group"></i>
                </div>
                <div class="ms-3">
                  <h3 class="mb-0">{{ stats.totalGroups }}</h3>
                  <p class="text-muted mb-0">Total Groups</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Quick Actions</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 mb-3">
                  <a routerLink="/social/community/forums" class="quick-action-card">
                    <div class="text-center p-3">
                      <i class="fas fa-comments fa-2x text-primary mb-2"></i>
                      <h6>Forums</h6>
                      <p class="text-muted small mb-0">Manage discussion forums</p>
                    </div>
                  </a>
                </div>
                <div class="col-md-3 mb-3">
                  <a routerLink="/social/community/groups" class="quick-action-card">
                    <div class="text-center p-3">
                      <i class="fas fa-users fa-2x text-success mb-2"></i>
                      <h6>Groups</h6>
                      <p class="text-muted small mb-0">Manage community groups</p>
                    </div>
                  </a>
                </div>
                <div class="col-md-3 mb-3">
                  <a routerLink="/social/community/events" class="quick-action-card">
                    <div class="text-center p-3">
                      <i class="fas fa-calendar fa-2x text-info mb-2"></i>
                      <h6>Events</h6>
                      <p class="text-muted small mb-0">Organize community events</p>
                    </div>
                  </a>
                </div>
                <div class="col-md-3 mb-3">
                  <a routerLink="/social/analytics" class="quick-action-card">
                    <div class="text-center p-3">
                      <i class="fas fa-chart-bar fa-2x text-warning mb-2"></i>
                      <h6>Analytics</h6>
                      <p class="text-muted small mb-0">View engagement metrics</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="row">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Recent Activity</h5>
              <a routerLink="/social/community/forums" class="btn btn-sm btn-outline-primary">View All</a>
            </div>
            <div class="card-body">
              <div class="activity-list">
                <div *ngFor="let activity of recentActivities" class="activity-item">
                  <div class="d-flex align-items-start">
                    <div class="activity-icon">
                      <i [class]="activity.icon"></i>
                    </div>
                    <div class="ms-3 flex-grow-1">
                      <h6 class="mb-1">{{ activity.title }}</h6>
                      <p class="text-muted mb-1">{{ activity.description }}</p>
                      <small class="text-muted">{{ activity.timestamp }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Top Contributors</h5>
            </div>
            <div class="card-body">
              <div class="contributor-list">
                <div *ngFor="let contributor of topContributors" class="contributor-item">
                  <div class="d-flex align-items-center mb-3">
                    <div class="avatar">
                      <img [src]="contributor.avatar" [alt]="contributor.name" class="rounded-circle">
                    </div>
                    <div class="ms-3 flex-grow-1">
                      <h6 class="mb-0">{{ contributor.name }}</h6>
                      <small class="text-muted">{{ contributor.contributions }} contributions</small>
                    </div>
                    <div class="badge bg-primary">{{ contributor.rank }}</div>
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
    .stats-card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      transition: transform 0.2s ease-in-out;
    }
    
    .stats-card:hover {
      transform: translateY(-2px);
    }
    
    .stats-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    
    .quick-action-card {
      display: block;
      text-decoration: none;
      color: inherit;
      border: 1px solid #e9ecef;
      border-radius: 0.375rem;
      transition: all 0.2s ease-in-out;
    }
    
    .quick-action-card:hover {
      color: inherit;
      text-decoration: none;
      border-color: #007bff;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 123, 255, 0.25);
      transform: translateY(-2px);
    }
    
    .activity-item {
      padding: 1rem 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .activity-item:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
    }
    
    .contributor-item .avatar img {
      width: 40px;
      height: 40px;
      object-fit: cover;
    }
    
    .card {
      border: none;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
  `]
})
export class CommunityOverviewComponent implements OnInit {
  stats = {
    totalMembers: 1247,
    activeDiscussions: 23,
    upcomingEvents: 5,
    totalGroups: 12
  };

  recentActivities = [
    {
      icon: 'fas fa-comment text-primary',
      title: 'New discussion started',
      description: 'John Doe started a new discussion in Credit Repair Tips',
      timestamp: '2 hours ago'
    },
    {
      icon: 'fas fa-users text-success',
      title: 'New member joined',
      description: 'Sarah Johnson joined the Credit Building group',
      timestamp: '4 hours ago'
    },
    {
      icon: 'fas fa-calendar text-info',
      title: 'Event created',
      description: 'Monthly Credit Workshop scheduled for next week',
      timestamp: '6 hours ago'
    },
    {
      icon: 'fas fa-star text-warning',
      title: 'Post featured',
      description: 'Mike Wilson\'s post was featured in the community',
      timestamp: '1 day ago'
    }
  ];

  topContributors = [
    {
      name: 'John Doe',
      avatar: 'https://via.placeholder.com/40x40/007bff/ffffff?text=JD',
      contributions: 45,
      rank: '#1'
    },
    {
      name: 'Sarah Johnson',
      avatar: 'https://via.placeholder.com/40x40/28a745/ffffff?text=SJ',
      contributions: 38,
      rank: '#2'
    },
    {
      name: 'Mike Wilson',
      avatar: 'https://via.placeholder.com/40x40/17a2b8/ffffff?text=MW',
      contributions: 32,
      rank: '#3'
    },
    {
      name: 'Emily Davis',
      avatar: 'https://via.placeholder.com/40x40/ffc107/ffffff?text=ED',
      contributions: 28,
      rank: '#4'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.loadCommunityData();
  }

  loadCommunityData(): void {
    // Simulate loading community data
    console.log('Loading community overview data...');
  }
}