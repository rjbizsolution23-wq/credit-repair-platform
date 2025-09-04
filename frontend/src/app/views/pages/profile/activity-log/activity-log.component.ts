import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="activity-log-container">
      <div class="card">
        <div class="card-header">
          <h3>Activity Log</h3>
          <p>View your recent account activity and security events</p>
        </div>
        <div class="card-body">
          <div class="filters-section">
            <div class="filter-group">
              <label for="dateRange">Date Range</label>
              <select id="dateRange" class="form-control">
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 3 months</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="activityType">Activity Type</label>
              <select id="activityType" class="form-control">
                <option value="all">All Activities</option>
                <option value="login">Login Events</option>
                <option value="security">Security Events</option>
                <option value="profile">Profile Changes</option>
                <option value="api">API Usage</option>
              </select>
            </div>
            <button type="button" class="btn btn-primary">Apply Filters</button>
          </div>
          
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon login">
                <i class="icon">🔐</i>
              </div>
              <div class="activity-details">
                <h5>Successful Login</h5>
                <p>You logged in from Chrome on Windows</p>
                <div class="activity-meta">
                  <span class="timestamp">2 hours ago</span>
                  <span class="location">New York, NY</span>
                  <span class="ip">192.168.1.100</span>
                </div>
              </div>
              <div class="activity-status success">
                <span>Success</span>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-icon profile">
                <i class="icon">👤</i>
              </div>
              <div class="activity-details">
                <h5>Profile Updated</h5>
                <p>You updated your profile information</p>
                <div class="activity-meta">
                  <span class="timestamp">1 day ago</span>
                  <span class="location">New York, NY</span>
                  <span class="ip">192.168.1.100</span>
                </div>
              </div>
              <div class="activity-status info">
                <span>Info</span>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-icon security">
                <i class="icon">🛡️</i>
              </div>
              <div class="activity-details">
                <h5>Password Changed</h5>
                <p>You changed your account password</p>
                <div class="activity-meta">
                  <span class="timestamp">3 days ago</span>
                  <span class="location">New York, NY</span>
                  <span class="ip">192.168.1.100</span>
                </div>
              </div>
              <div class="activity-status warning">
                <span>Security</span>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-icon api">
                <i class="icon">🔌</i>
              </div>
              <div class="activity-details">
                <h5>API Key Generated</h5>
                <p>You generated a new API key for production</p>
                <div class="activity-meta">
                  <span class="timestamp">1 week ago</span>
                  <span class="location">New York, NY</span>
                  <span class="ip">192.168.1.100</span>
                </div>
              </div>
              <div class="activity-status info">
                <span>Info</span>
              </div>
            </div>
            
            <div class="activity-item">
              <div class="activity-icon login">
                <i class="icon">❌</i>
              </div>
              <div class="activity-details">
                <h5>Failed Login Attempt</h5>
                <p>Failed login attempt from unknown device</p>
                <div class="activity-meta">
                  <span class="timestamp">2 weeks ago</span>
                  <span class="location">Unknown</span>
                  <span class="ip">203.0.113.1</span>
                </div>
              </div>
              <div class="activity-status error">
                <span>Failed</span>
              </div>
            </div>
          </div>
          
          <div class="pagination">
            <button class="btn btn-outline">Previous</button>
            <span class="page-info">Page 1 of 5</span>
            <button class="btn btn-outline">Next</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activity-log-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .card-header {
      background: #f8f9fa;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .card-header h3 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.5rem;
    }
    
    .card-header p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .card-body {
      padding: 20px;
    }
    
    .filters-section {
      display: flex;
      gap: 20px;
      align-items: end;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      min-width: 150px;
    }
    
    .filter-group label {
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }
    
    .form-control {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
    
    .activity-list {
      margin-bottom: 30px;
    }
    
    .activity-item {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 15px;
      background: #fafafa;
      transition: background-color 0.3s ease;
    }
    
    .activity-item:hover {
      background: #f0f0f0;
    }
    
    .activity-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-size: 1.2rem;
    }
    
    .activity-icon.login {
      background: #e3f2fd;
    }
    
    .activity-icon.profile {
      background: #f3e5f5;
    }
    
    .activity-icon.security {
      background: #fff3e0;
    }
    
    .activity-icon.api {
      background: #e8f5e8;
    }
    
    .activity-details {
      flex: 1;
    }
    
    .activity-details h5 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.1rem;
    }
    
    .activity-details p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .activity-meta {
      display: flex;
      gap: 15px;
      font-size: 0.8rem;
      color: #888;
      flex-wrap: wrap;
    }
    
    .activity-status {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-align: center;
      min-width: 80px;
    }
    
    .activity-status.success {
      background: #d4edda;
      color: #155724;
    }
    
    .activity-status.info {
      background: #d1ecf1;
      color: #0c5460;
    }
    
    .activity-status.warning {
      background: #fff3cd;
      color: #856404;
    }
    
    .activity-status.error {
      background: #f8d7da;
      color: #721c24;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      padding: 20px 0;
    }
    
    .page-info {
      color: #666;
      font-size: 0.9rem;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-outline {
      background-color: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }
    
    .btn-outline:hover {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class ActivityLogComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Initialize component
  }

}