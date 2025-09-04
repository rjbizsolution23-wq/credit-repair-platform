import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="profile-overview">
      <div class="profile-header">
        <div class="profile-avatar">
          <img src="assets/images/default-avatar.png" alt="Profile Avatar" class="avatar-image">
          <button class="change-avatar-btn">Change Photo</button>
        </div>
        <div class="profile-info">
          <h2>John Doe</h2>
          <p class="email">john.doe&#64;example.com</p>
          <p class="member-since">Member since January 2024</p>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-card">
          <h3>Credit Score</h3>
          <div class="score">720</div>
          <span class="score-change positive">+15 this month</span>
        </div>
        <div class="stat-card">
          <h3>Active Disputes</h3>
          <div class="count">3</div>
          <span class="status">In Progress</span>
        </div>
        <div class="stat-card">
          <h3>Completed Repairs</h3>
          <div class="count">12</div>
          <span class="status">Successful</span>
        </div>
      </div>

      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
          <button class="action-btn primary" routerLink="/profile/edit">
            <i class="icon-edit"></i>
            Edit Profile
          </button>
          <button class="action-btn" routerLink="/profile/security">
            <i class="icon-security"></i>
            Security Settings
          </button>
          <button class="action-btn" routerLink="/profile/preferences">
            <i class="icon-preferences"></i>
            Preferences
          </button>
        </div>
      </div>

      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon">
              <i class="icon-dispute"></i>
            </div>
            <div class="activity-content">
              <p><strong>New dispute filed</strong></p>
              <p class="activity-description">Dispute for incorrect payment history on Experian report</p>
              <span class="activity-time">2 hours ago</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-icon">
              <i class="icon-success"></i>
            </div>
            <div class="activity-content">
              <p><strong>Dispute resolved</strong></p>
              <p class="activity-description">Late payment removed from TransUnion report</p>
              <span class="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-overview {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 32px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .profile-avatar {
      text-align: center;
    }

    .avatar-image {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #e5e7eb;
    }

    .change-avatar-btn {
      margin-top: 12px;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .profile-info h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #1f2937;
    }

    .email {
      color: #6b7280;
      margin: 4px 0;
    }

    .member-since {
      color: #9ca3af;
      font-size: 14px;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .stat-card h3 {
      margin: 0 0 16px 0;
      color: #6b7280;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .score {
      font-size: 48px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 8px;
    }

    .count {
      font-size: 36px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 8px;
    }

    .score-change.positive {
      color: #059669;
      font-size: 14px;
    }

    .status {
      color: #6b7280;
      font-size: 14px;
    }

    .quick-actions {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 32px;
    }

    .quick-actions h3 {
      margin: 0 0 20px 0;
      color: #1f2937;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      color: #374151;
      font-weight: 500;
      transition: all 0.2s;
    }

    .action-btn.primary {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .action-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    .action-btn.primary:hover {
      background: #2563eb;
    }

    .recent-activity {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .recent-activity h3 {
      margin: 0 0 20px 0;
      color: #1f2937;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-content p {
      margin: 0 0 4px 0;
    }

    .activity-description {
      color: #6b7280;
      font-size: 14px;
    }

    .activity-time {
      color: #9ca3af;
      font-size: 12px;
    }
  `]
})
export class ProfileOverviewComponent {
  constructor() {}
}