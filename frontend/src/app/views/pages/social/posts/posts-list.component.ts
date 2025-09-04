import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface SocialPost {
  id: string;
  title: string;
  content: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledDate?: Date;
  publishedDate?: Date;
  author: string;
  tags: string[];
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  media?: {
    type: 'image' | 'video' | 'gif';
    url: string;
    alt?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="posts-list-container">
      <div class="header">
        <div class="header-content">
          <h1>Social Media Posts</h1>
          <p>Manage and track your social media content across all platforms</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="createPost()">
            <i class="fas fa-plus"></i> Create Post
          </button>
        </div>
      </div>

      <div class="filters-section">
        <form [formGroup]="filterForm" class="filters-form">
          <div class="filter-group">
            <label for="search">Search</label>
            <div class="search-input">
              <i class="fas fa-search"></i>
              <input
                type="text"
                id="search"
                formControlName="search"
                placeholder="Search posts..."
                (input)="applyFilters()"
              >
            </div>
          </div>
          <div class="filter-group">
            <label for="platform">Platform</label>
            <select id="platform" formControlName="platform" (change)="applyFilters()">
              <option value="">All Platforms</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="status">Status</label>
            <select id="status" formControlName="status" (change)="applyFilters()">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="dateRange">Date Range</label>
            <select id="dateRange" formControlName="dateRange" (change)="applyFilters()">
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </form>
      </div>

      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getTotalPosts() }}</span>
            <span class="stat-label">Total Posts</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getScheduledPosts() }}</span>
            <span class="stat-label">Scheduled</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getPublishedPosts() }}</span>
            <span class="stat-label">Published</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-edit"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ getDraftPosts() }}</span>
            <span class="stat-label">Drafts</span>
          </div>
        </div>
      </div>

      <div class="posts-grid" *ngIf="!isLoading && filteredPosts.length > 0">
        <div *ngFor="let post of filteredPosts" class="post-card" (click)="viewPost(post.id)">
          <div class="post-header">
            <div class="post-meta">
              <div class="platform-badge">
                <i [class]="getPlatformIcon(post.platform)"></i>
                {{ post.platform | titlecase }}
              </div>
              <div class="status-badge" [class]="'status-' + post.status">
                <i [class]="getStatusIcon(post.status)"></i>
                {{ post.status | titlecase }}
              </div>
            </div>
            <div class="post-actions">
              <button class="btn-icon" (click)="editPost(post.id, $event)" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon" (click)="duplicatePost(post.id, $event)" title="Duplicate">
                <i class="fas fa-copy"></i>
              </button>
              <button class="btn-icon" (click)="deletePost(post.id, $event)" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ getPostExcerpt(post.content) }}</p>
            
            <div class="post-media" *ngIf="post.media && post.media.length > 0">
              <div class="media-preview">
                <img *ngIf="post.media[0].type === 'image'" [src]="post.media[0].url" [alt]="post.media[0].alt || 'Post media'">
                <video *ngIf="post.media[0].type === 'video'" [src]="post.media[0].url"></video>
                <div class="media-count" *ngIf="post.media.length > 1">
                  +{{ post.media.length - 1 }} more
                </div>
              </div>
            </div>
            
            <div class="post-tags" *ngIf="post.tags && post.tags.length > 0">
              <span *ngFor="let tag of post.tags.slice(0, 3)" class="tag">#{{ tag }}</span>
              <span *ngIf="post.tags.length > 3" class="tag-more">+{{ post.tags.length - 3 }} more</span>
            </div>
          </div>
          
          <div class="post-footer">
            <div class="post-info">
              <span class="author">{{ post.author }}</span>
              <span class="date">
                <i class="fas fa-calendar"></i>
                {{ formatDate(post.publishedDate || post.scheduledDate || post.createdAt) }}
              </span>
            </div>
            
            <div class="engagement-stats" *ngIf="post.status === 'published'">
              <div class="stat" title="Views">
                <i class="fas fa-eye"></i>
                {{ formatNumber(post.engagement.views) }}
              </div>
              <div class="stat" title="Likes">
                <i class="fas fa-heart"></i>
                {{ formatNumber(post.engagement.likes) }}
              </div>
              <div class="stat" title="Shares">
                <i class="fas fa-share"></i>
                {{ formatNumber(post.engagement.shares) }}
              </div>
              <div class="stat" title="Comments">
                <i class="fas fa-comment"></i>
                {{ formatNumber(post.engagement.comments) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!isLoading && filteredPosts.length === 0">
        <div class="empty-icon">
          <i class="fas fa-file-alt"></i>
        </div>
        <h3>No posts found</h3>
        <p *ngIf="hasActiveFilters()">Try adjusting your filters to see more results.</p>
        <p *ngIf="!hasActiveFilters()">Get started by creating your first social media post.</p>
        <button class="btn-primary" (click)="createPost()">
          <i class="fas fa-plus"></i> Create Your First Post
        </button>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading posts...</p>
        </div>
      </div>

      <div class="pagination" *ngIf="!isLoading && filteredPosts.length > 0 && totalPages > 1">
        <button 
          class="btn-outline" 
          [disabled]="currentPage === 1" 
          (click)="goToPage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        
        <div class="page-numbers">
          <button 
            *ngFor="let page of getPageNumbers()" 
            class="page-btn" 
            [class.active]="page === currentPage"
            (click)="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="btn-outline" 
          [disabled]="currentPage === totalPages" 
          (click)="goToPage(currentPage + 1)"
        >
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .posts-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
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
    }

    .header-content p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .btn-primary, .btn-outline, .btn-icon {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      text-decoration: none;
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

    .btn-outline:hover:not(:disabled) {
      background-color: #007bff;
      color: white;
    }

    .btn-outline:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-icon {
      padding: 0.5rem;
      background: none;
      color: #666;
      border-radius: 4px;
    }

    .btn-icon:hover {
      background-color: #f8f9fa;
      color: #333;
    }

    .filters-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }

    .search-input {
      position: relative;
    }

    .search-input i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .search-input input {
      padding-left: 2.5rem;
    }

    input, select {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      display: block;
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .post-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .post-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    .post-meta {
      display: flex;
      gap: 0.5rem;
    }

    .platform-badge, .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .platform-badge {
      background-color: #e9ecef;
      color: #495057;
    }

    .status-badge.status-draft {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-badge.status-scheduled {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .status-badge.status-published {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.status-failed {
      background-color: #f8d7da;
      color: #721c24;
    }

    .post-actions {
      display: flex;
      gap: 0.25rem;
    }

    .post-content {
      padding: 1rem;
    }

    .post-title {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
      line-height: 1.3;
    }

    .post-excerpt {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-media {
      margin-bottom: 1rem;
    }

    .media-preview {
      position: relative;
      border-radius: 4px;
      overflow: hidden;
      height: 150px;
    }

    .media-preview img, .media-preview video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .media-count {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.7rem;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .tag, .tag-more {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .tag-more {
      background-color: #f8f9fa;
      color: #666;
    }

    .post-footer {
      padding: 1rem;
      border-top: 1px solid #eee;
      background-color: #f8f9fa;
    }

    .post-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .author {
      font-weight: 500;
      color: #333;
      font-size: 0.8rem;
    }

    .date {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #666;
      font-size: 0.8rem;
    }

    .engagement-stats {
      display: flex;
      gap: 1rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #666;
      font-size: 0.8rem;
    }

    .empty-state, .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-icon, .loading-spinner {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #ccc;
    }

    .loading-spinner i {
      color: #007bff;
    }

    .empty-state h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-numbers {
      display: flex;
      gap: 0.25rem;
    }

    .page-btn {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      background: white;
      color: #666;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .page-btn:hover {
      background-color: #f8f9fa;
    }

    .page-btn.active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }

    @media (max-width: 768px) {
      .posts-list-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .filters-form {
        grid-template-columns: 1fr;
      }

      .stats-overview {
        grid-template-columns: repeat(2, 1fr);
      }

      .posts-grid {
        grid-template-columns: 1fr;
      }

      .post-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .engagement-stats {
        justify-content: space-between;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class PostsListComponent implements OnInit {
  posts: SocialPost[] = [];
  filteredPosts: SocialPost[] = [];
  filterForm: FormGroup;
  isLoading: boolean = true;
  currentPage: number = 1;
  postsPerPage: number = 12;
  totalPages: number = 1;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      platform: [''],
      status: [''],
      dateRange: ['']
    });
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    // Simulate API call
    setTimeout(() => {
      this.posts = [
        {
          id: '1',
          title: 'Exciting Product Launch Announcement',
          content: 'We are thrilled to announce the launch of our latest product! This innovative solution will revolutionize the way you manage your social media presence. Stay tuned for more updates and exclusive offers.',
          platform: 'facebook',
          status: 'published',
          publishedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          author: 'Marketing Team',
          tags: ['ProductLaunch', 'Innovation', 'SocialMedia'],
          engagement: {
            likes: 1250,
            shares: 89,
            comments: 156,
            views: 8420
          },
          media: [
            {
              type: 'image',
              url: '/assets/product-launch.jpg',
              alt: 'Product launch banner'
            }
          ],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          title: 'Weekly Tips: Social Media Best Practices',
          content: 'Here are our top 5 tips for improving your social media engagement this week. From optimal posting times to content strategies that work.',
          platform: 'twitter',
          status: 'scheduled',
          scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
          author: 'Content Team',
          tags: ['Tips', 'BestPractices', 'Engagement'],
          engagement: {
            likes: 0,
            shares: 0,
            comments: 0,
            views: 0
          },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          title: 'Behind the Scenes: Our Team',
          content: 'Meet the amazing people behind our success! Today we\'re featuring our development team and their incredible work on our latest features.',
          platform: 'instagram',
          status: 'draft',
          author: 'HR Team',
          tags: ['Team', 'BehindTheScenes', 'Culture'],
          engagement: {
            likes: 0,
            shares: 0,
            comments: 0,
            views: 0
          },
          media: [
            {
              type: 'image',
              url: '/assets/team-photo.jpg',
              alt: 'Team photo'
            },
            {
              type: 'image',
              url: '/assets/office-space.jpg',
              alt: 'Office space'
            }
          ],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          id: '4',
          title: 'Customer Success Story',
          content: 'Read how our client increased their social media engagement by 300% using our platform. Their journey from startup to success.',
          platform: 'linkedin',
          status: 'published',
          publishedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          author: 'Sales Team',
          tags: ['CustomerSuccess', 'CaseStudy', 'Growth'],
          engagement: {
            likes: 892,
            shares: 234,
            comments: 67,
            views: 5670
          },
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          id: '5',
          title: 'Failed Post Example',
          content: 'This post failed to publish due to API limitations.',
          platform: 'twitter',
          status: 'failed',
          author: 'Marketing Team',
          tags: ['Test'],
          engagement: {
            likes: 0,
            shares: 0,
            comments: 0,
            views: 0
          },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ];
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.posts];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Platform filter
    if (filters.platform) {
      filtered = filtered.filter(post => post.platform === filters.platform);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(post => post.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let filterDate: Date;

      switch (filters.dateRange) {
        case 'today':
          filterDate = startOfDay;
          break;
        case 'week':
          filterDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          filterDate = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          filterDate = new Date(startOfDay.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          filterDate = new Date(0);
      }

      filtered = filtered.filter(post => {
        const postDate = post.publishedDate || post.scheduledDate || post.createdAt;
        return postDate >= filterDate;
      });
    }

    this.filteredPosts = filtered;
    this.totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
    this.currentPage = 1;
  }

  getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      facebook: 'fab fa-facebook',
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      linkedin: 'fab fa-linkedin',
      youtube: 'fab fa-youtube'
    };
    return icons[platform] || 'fas fa-globe';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      draft: 'fas fa-edit',
      scheduled: 'fas fa-clock',
      published: 'fas fa-check-circle',
      failed: 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  getPostExcerpt(content: string): string {
    return content.length > 120 ? content.substring(0, 120) + '...' : content;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getTotalPosts(): number {
    return this.posts.length;
  }

  getScheduledPosts(): number {
    return this.posts.filter(post => post.status === 'scheduled').length;
  }

  getPublishedPosts(): number {
    return this.posts.filter(post => post.status === 'published').length;
  }

  getDraftPosts(): number {
    return this.posts.filter(post => post.status === 'draft').length;
  }

  hasActiveFilters(): boolean {
    const filters = this.filterForm.value;
    return !!(filters.search || filters.platform || filters.status || filters.dateRange);
  }

  createPost(): void {
    this.router.navigate(['/social/posts/create']);
  }

  viewPost(id: string): void {
    this.router.navigate(['/social/posts', id]);
  }

  editPost(id: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/social/posts', id, 'edit']);
  }

  duplicatePost(id: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/social/posts/create'], {
      queryParams: { duplicate: id }
    });
  }

  deletePost(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this post?')) {
      console.log('Deleting post:', id);
      // Implement deletion logic
      this.posts = this.posts.filter(post => post.id !== id);
      this.applyFilters();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}