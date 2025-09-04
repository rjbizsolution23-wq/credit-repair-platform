import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="groups-container">
      <div class="header">
        <h1>Community Groups</h1>
        <button class="btn btn-primary" [routerLink]="['/social/community/groups/create']">
          <i class="fas fa-plus"></i> Create Group
        </button>
      </div>

      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search groups..." [(ngModel)]="searchTerm" (input)="filterGroups()">
        </div>
        <div class="filter-options">
          <select [(ngModel)]="selectedCategory" (change)="filterGroups()">
            <option value="">All Categories</option>
            <option value="credit-education">Credit Education</option>
            <option value="financial-wellness">Financial Wellness</option>
            <option value="success-stories">Success Stories</option>
            <option value="general">General Discussion</option>
          </select>
          <select [(ngModel)]="selectedStatus" (change)="filterGroups()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="private">Private</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div class="groups-grid">
        <div class="group-card" *ngFor="let group of filteredGroups">
          <div class="group-header">
            <div class="group-avatar">
              <img [src]="group.avatar || '/assets/group-default.jpg'" [alt]="group.name">
            </div>
            <div class="group-info">
              <h3 [routerLink]="['/social/community/groups', group.id]">{{ group.name }}</h3>
              <p class="group-description">{{ group.description }}</p>
              <div class="group-meta">
                <span class="category">{{ group.category | titlecase }}</span>
                <span class="status" [class]="group.status">{{ group.status | titlecase }}</span>
              </div>
            </div>
          </div>

          <div class="group-stats">
            <div class="stat">
              <i class="fas fa-users"></i>
              <span>{{ group.memberCount }} members</span>
            </div>
            <div class="stat">
              <i class="fas fa-comments"></i>
              <span>{{ group.postCount }} posts</span>
            </div>
            <div class="stat">
              <i class="fas fa-clock"></i>
              <span>{{ formatDate(group.lastActivity) }}</span>
            </div>
          </div>

          <div class="group-actions">
            <button class="btn btn-outline-primary" [routerLink]="['/social/community/groups', group.id]">
              View Group
            </button>
            <button class="btn btn-primary" (click)="joinGroup(group)" *ngIf="!group.isMember">
              Join Group
            </button>
            <button class="btn btn-outline-secondary" (click)="leaveGroup(group)" *ngIf="group.isMember">
              Leave Group
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="filteredGroups.length === 0">
        <i class="fas fa-users"></i>
        <h3>No groups found</h3>
        <p>Try adjusting your search criteria or create a new group.</p>
        <button class="btn btn-primary" [routerLink]="['/social/community/groups/create']">
          Create First Group
        </button>
      </div>
    </div>
  `,
  styles: [`
    .groups-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .filters {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
    }

    .search-box i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .search-box input {
      width: 100%;
      padding: 10px 10px 10px 40px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .filter-options {
      display: flex;
      gap: 10px;
    }

    .filter-options select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .group-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .group-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .group-header {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .group-avatar {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .group-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .group-info {
      flex: 1;
    }

    .group-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      cursor: pointer;
      text-decoration: none;
    }

    .group-info h3:hover {
      color: #007bff;
    }

    .group-description {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .group-meta {
      display: flex;
      gap: 10px;
    }

    .category {
      background: #e9ecef;
      color: #495057;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status.active {
      background: #d4edda;
      color: #155724;
    }

    .status.private {
      background: #fff3cd;
      color: #856404;
    }

    .status.archived {
      background: #f8d7da;
      color: #721c24;
    }

    .group-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding: 10px 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #666;
    }

    .stat i {
      color: #999;
    }

    .group-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-outline-primary {
      background: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }

    .btn-outline-primary:hover {
      background: #007bff;
      color: white;
    }

    .btn-outline-secondary {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
    }

    .btn-outline-secondary:hover {
      background: #6c757d;
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state i {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 20px 0;
    }

    @media (max-width: 768px) {
      .groups-grid {
        grid-template-columns: 1fr;
      }
      
      .filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-options {
        justify-content: space-between;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
    }
  `]
})
export class GroupsListComponent implements OnInit {
  groups: any[] = [];
  filteredGroups: any[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    // Mock data - replace with actual API call
    this.groups = [
      {
        id: 1,
        name: 'Credit Repair Success Stories',
        description: 'Share your journey and celebrate credit repair victories with the community.',
        category: 'success-stories',
        status: 'active',
        memberCount: 245,
        postCount: 89,
        lastActivity: new Date('2024-01-20'),
        isMember: true,
        avatar: '/assets/group1.jpg'
      },
      {
        id: 2,
        name: 'Financial Wellness Tips',
        description: 'Daily tips and strategies for maintaining good financial health.',
        category: 'financial-wellness',
        status: 'active',
        memberCount: 189,
        postCount: 156,
        lastActivity: new Date('2024-01-19'),
        isMember: false,
        avatar: '/assets/group2.jpg'
      },
      {
        id: 3,
        name: 'Credit Education Hub',
        description: 'Learn the fundamentals of credit scores, reports, and improvement strategies.',
        category: 'credit-education',
        status: 'active',
        memberCount: 312,
        postCount: 203,
        lastActivity: new Date('2024-01-18'),
        isMember: true,
        avatar: '/assets/group3.jpg'
      },
      {
        id: 4,
        name: 'Beginner Questions',
        description: 'A safe space for newcomers to ask questions about credit repair.',
        category: 'general',
        status: 'active',
        memberCount: 156,
        postCount: 78,
        lastActivity: new Date('2024-01-17'),
        isMember: false,
        avatar: '/assets/group4.jpg'
      },
      {
        id: 5,
        name: 'Advanced Strategies',
        description: 'For experienced members to discuss advanced credit repair techniques.',
        category: 'credit-education',
        status: 'private',
        memberCount: 67,
        postCount: 134,
        lastActivity: new Date('2024-01-16'),
        isMember: true,
        avatar: '/assets/group5.jpg'
      }
    ];
    
    this.filteredGroups = [...this.groups];
  }

  filterGroups() {
    this.filteredGroups = this.groups.filter(group => {
      const matchesSearch = !this.searchTerm || 
        group.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || group.category === this.selectedCategory;
      const matchesStatus = !this.selectedStatus || group.status === this.selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  joinGroup(group: any) {
    // Implement join group logic
    group.isMember = true;
    group.memberCount++;
    console.log('Joined group:', group.name);
  }

  leaveGroup(group: any) {
    // Implement leave group logic
    group.isMember = false;
    group.memberCount--;
    console.log('Left group:', group.name);
  }
}