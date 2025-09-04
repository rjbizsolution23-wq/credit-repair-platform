import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forums-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="forums-container">
      <div class="forums-header">
        <div class="header-content">
          <h1>Community Forums</h1>
          <p>Join discussions, ask questions, and share knowledge with the community</p>
        </div>
        <button class="btn btn-primary" [routerLink]="['/social/community/forums/create']">
          <i class="fas fa-plus"></i> Create Forum
        </button>
      </div>

      <div class="forums-filters">
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (input)="filterForums()"
            placeholder="Search forums...">
        </div>
        
        <div class="filter-options">
          <select [(ngModel)]="selectedCategory" (change)="filterForums()">
            <option value="">All Categories</option>
            <option value="general">General Discussion</option>
            <option value="credit-tips">Credit Tips</option>
            <option value="success-stories">Success Stories</option>
            <option value="questions">Q&A</option>
            <option value="resources">Resources</option>
          </select>
          
          <select [(ngModel)]="sortBy" (change)="sortForums()">
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="active">Most Active</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div class="forums-grid">
        <div class="forum-card" *ngFor="let forum of filteredForums" [routerLink]="['/social/community/forums', forum.id]">
          <div class="forum-header">
            <div class="forum-icon">
              <i [class]="forum.icon"></i>
            </div>
            <div class="forum-info">
              <h3>{{ forum.title }}</h3>
              <p>{{ forum.description }}</p>
              <div class="forum-meta">
                <span class="category">{{ forum.category | titlecase }}</span>
                <span class="post-count">
                  <i class="fas fa-comments"></i> {{ forum.postCount }} posts
                </span>
                <span class="member-count">
                  <i class="fas fa-users"></i> {{ forum.memberCount }} members
                </span>
              </div>
            </div>
          </div>
          
          <div class="forum-stats">
            <div class="stat">
              <span class="stat-value">{{ forum.todayPosts }}</span>
              <span class="stat-label">Today</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ forum.weekPosts }}</span>
              <span class="stat-label">This Week</span>
            </div>
          </div>
          
          <div class="forum-activity">
            <div class="latest-post" *ngIf="forum.latestPost">
              <div class="post-info">
                <span class="post-title">{{ forum.latestPost.title }}</span>
                <div class="post-meta">
                  <span class="author">by {{ forum.latestPost.author }}</span>
                  <span class="time">{{ formatDate(forum.latestPost.createdAt) }}</span>
                </div>
              </div>
              <div class="author-avatar">
                <img [src]="forum.latestPost.authorAvatar || '/assets/user-avatar.jpg'" [alt]="forum.latestPost.author">
              </div>
            </div>
            <div class="no-posts" *ngIf="!forum.latestPost">
              <span>No posts yet</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="filteredForums.length === 0">
        <i class="fas fa-comments"></i>
        <h3>No forums found</h3>
        <p *ngIf="searchTerm || selectedCategory">Try adjusting your search or filter criteria.</p>
        <p *ngIf="!searchTerm && !selectedCategory">Be the first to create a forum!</p>
        <button class="btn btn-primary" [routerLink]="['/social/community/forums/create']">
          Create First Forum
        </button>
      </div>
    </div>
  `,
  styles: [`
    .forums-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .forums-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 30px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-content h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .forums-filters {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .search-bar {
      flex: 1;
      position: relative;
    }

    .search-bar i {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .search-bar input {
      width: 100%;
      padding: 12px 15px 12px 45px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .filter-options {
      display: flex;
      gap: 15px;
    }

    .filter-options select {
      padding: 12px 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      min-width: 150px;
    }

    .forums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .forum-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .forum-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      text-decoration: none;
      color: inherit;
    }

    .forum-header {
      display: flex;
      gap: 15px;
      align-items: flex-start;
    }

    .forum-icon {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      flex-shrink: 0;
    }

    .forum-info {
      flex: 1;
    }

    .forum-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }

    .forum-info p {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .forum-meta {
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
    }

    .category {
      background: #e9ecef;
      color: #495057;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .post-count,
    .member-count {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 12px;
    }

    .forum-stats {
      display: flex;
      gap: 20px;
      padding: 15px 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .stat-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .forum-activity {
      min-height: 60px;
    }

    .latest-post {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .post-info {
      flex: 1;
    }

    .post-title {
      display: block;
      color: #333;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 5px;
      line-height: 1.3;
    }

    .post-meta {
      display: flex;
      gap: 10px;
      font-size: 12px;
      color: #666;
    }

    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .author-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-posts {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60px;
      color: #999;
      font-style: italic;
    }

    .btn {
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
      text-decoration: none;
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .empty-state i {
      font-size: 64px;
      color: #ccc;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    }

    .empty-state p {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .forums-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }
      
      .forums-filters {
        flex-direction: column;
      }
      
      .filter-options {
        flex-direction: column;
      }
      
      .forums-grid {
        grid-template-columns: 1fr;
      }
      
      .forum-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .forum-stats {
        justify-content: space-around;
      }
    }
  `]
})
export class ForumsListComponent implements OnInit {
  forums: any[] = [];
  filteredForums: any[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  sortBy: string = 'recent';

  ngOnInit() {
    this.loadForums();
  }

  loadForums() {
    // Mock data - replace with actual API call
    this.forums = [
      {
        id: 1,
        title: 'Credit Score Improvement Tips',
        description: 'Share and discuss strategies for improving your credit score effectively.',
        category: 'credit-tips',
        icon: 'fas fa-chart-line',
        postCount: 156,
        memberCount: 89,
        todayPosts: 5,
        weekPosts: 23,
        createdAt: new Date('2023-08-15'),
        latestPost: {
          title: 'How I raised my score by 100 points in 6 months',
          author: 'Sarah Johnson',
          authorAvatar: '/assets/user1.jpg',
          createdAt: new Date('2024-01-20')
        }
      },
      {
        id: 2,
        title: 'Success Stories',
        description: 'Celebrate your credit repair victories and inspire others with your journey.',
        category: 'success-stories',
        icon: 'fas fa-trophy',
        postCount: 89,
        memberCount: 124,
        todayPosts: 3,
        weekPosts: 18,
        createdAt: new Date('2023-09-01'),
        latestPost: {
          title: 'Finally debt-free after 3 years!',
          author: 'Mike Chen',
          authorAvatar: '/assets/user2.jpg',
          createdAt: new Date('2024-01-19')
        }
      },
      {
        id: 3,
        title: 'General Q&A',
        description: 'Ask questions and get answers from the community about credit repair.',
        category: 'questions',
        icon: 'fas fa-question-circle',
        postCount: 234,
        memberCount: 167,
        todayPosts: 8,
        weekPosts: 45,
        createdAt: new Date('2023-07-20'),
        latestPost: {
          title: 'Should I pay off collections or let them fall off?',
          author: 'Lisa Rodriguez',
          authorAvatar: '/assets/user3.jpg',
          createdAt: new Date('2024-01-20')
        }
      },
      {
        id: 4,
        title: 'Credit Repair Resources',
        description: 'Share useful tools, templates, and resources for credit repair.',
        category: 'resources',
        icon: 'fas fa-book',
        postCount: 67,
        memberCount: 98,
        todayPosts: 2,
        weekPosts: 12,
        createdAt: new Date('2023-10-10'),
        latestPost: {
          title: 'Free credit monitoring services comparison',
          author: 'David Wilson',
          authorAvatar: '/assets/user4.jpg',
          createdAt: new Date('2024-01-18')
        }
      },
      {
        id: 5,
        title: 'Newcomers Welcome',
        description: 'New to credit repair? Start here for basic guidance and support.',
        category: 'general',
        icon: 'fas fa-hand-wave',
        postCount: 45,
        memberCount: 78,
        todayPosts: 1,
        weekPosts: 8,
        createdAt: new Date('2023-11-05'),
        latestPost: {
          title: 'Just starting my credit repair journey',
          author: 'Emma Thompson',
          authorAvatar: '/assets/user5.jpg',
          createdAt: new Date('2024-01-17')
        }
      }
    ];
    
    this.filteredForums = [...this.forums];
    this.sortForums();
  }

  filterForums() {
    this.filteredForums = this.forums.filter(forum => {
      const matchesSearch = !this.searchTerm || 
        forum.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        forum.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || 
        forum.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    this.sortForums();
  }

  sortForums() {
    switch (this.sortBy) {
      case 'recent':
        this.filteredForums.sort((a, b) => {
          const aLatest = a.latestPost ? new Date(a.latestPost.createdAt).getTime() : 0;
          const bLatest = b.latestPost ? new Date(b.latestPost.createdAt).getTime() : 0;
          return bLatest - aLatest;
        });
        break;
      case 'popular':
        this.filteredForums.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'active':
        this.filteredForums.sort((a, b) => b.weekPosts - a.weekPosts);
        break;
      case 'oldest':
        this.filteredForums.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }
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
}