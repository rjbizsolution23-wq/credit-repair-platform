import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  platform: string;
  replies?: Comment[];
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="post-detail-container" *ngIf="post">
      <div class="header">
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back to Posts
        </button>
        <div class="header-actions">
          <button class="btn-secondary" (click)="editPost()">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn-primary" (click)="duplicatePost()">
            <i class="fas fa-copy"></i> Duplicate
          </button>
          <button class="btn-danger" (click)="deletePost()">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>

      <div class="post-content">
        <div class="post-header">
          <div class="post-meta">
            <div class="status-badge" [class]="'status-' + post.status">
              <i [class]="getStatusIcon(post.status)"></i>
              {{ post.status | titlecase }}
            </div>
            <div class="platform-badge">
              <i [class]="getPlatformIcon(post.platform)"></i>
              {{ post.platform | titlecase }}
            </div>
          </div>
          <h1>{{ post.title }}</h1>
          <div class="post-info">
            <span class="author">By {{ post.author }}</span>
            <span class="date" *ngIf="post.publishedDate">
              Published {{ formatDate(post.publishedDate) }}
            </span>
            <span class="date" *ngIf="post.scheduledDate && post.status === 'scheduled'">
              Scheduled for {{ formatDate(post.scheduledDate) }}
            </span>
            <span class="date" *ngIf="!post.publishedDate && !post.scheduledDate">
              Created {{ formatDate(post.createdAt) }}
            </span>
          </div>
        </div>

        <div class="post-body">
          <div class="content-section">
            <h3>Content</h3>
            <div class="content-text">{{ post.content }}</div>
          </div>

          <div class="media-section" *ngIf="post.media && post.media.length > 0">
            <h3>Media</h3>
            <div class="media-grid">
              <div *ngFor="let media of post.media" class="media-item">
                <img *ngIf="media.type === 'image'" [src]="media.url" [alt]="media.alt || 'Post image'">
                <video *ngIf="media.type === 'video'" [src]="media.url" controls></video>
                <div class="media-info">
                  <span class="media-type">{{ media.type | titlecase }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tags-section" *ngIf="post.tags && post.tags.length > 0">
            <h3>Tags</h3>
            <div class="tags-list">
              <span *ngFor="let tag of post.tags" class="tag">#{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="engagement-stats" *ngIf="post.status === 'published'">
        <h3>Engagement Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-eye"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatNumber(post.engagement.views) }}</span>
              <span class="stat-label">Views</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-heart"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatNumber(post.engagement.likes) }}</span>
              <span class="stat-label">Likes</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-share"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatNumber(post.engagement.shares) }}</span>
              <span class="stat-label">Shares</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-comment"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatNumber(post.engagement.comments) }}</span>
              <span class="stat-label">Comments</span>
            </div>
          </div>
        </div>
      </div>

      <div class="comments-section" *ngIf="post.status === 'published' && comments.length > 0">
        <h3>Recent Comments</h3>
        <div class="comments-list">
          <div *ngFor="let comment of comments" class="comment-item">
            <div class="comment-header">
              <div class="comment-author">
                <strong>{{ comment.author }}</strong>
                <span class="platform-badge small">
                  <i [class]="getPlatformIcon(comment.platform)"></i>
                </span>
              </div>
              <span class="comment-date">{{ formatDate(comment.timestamp) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div class="comment-actions">
              <button class="btn-link" (click)="replyToComment(comment.id)">
                <i class="fas fa-reply"></i> Reply
              </button>
              <button class="btn-link" (click)="likeComment(comment.id)">
                <i class="fas fa-heart"></i> Like
              </button>
            </div>
          </div>
        </div>
        <div class="load-more" *ngIf="hasMoreComments">
          <button class="btn-outline" (click)="loadMoreComments()">
            Load More Comments
          </button>
        </div>
      </div>

      <div class="post-actions">
        <div class="action-group" *ngIf="post.status === 'draft'">
          <button class="btn-primary" (click)="publishNow()">
            <i class="fas fa-paper-plane"></i> Publish Now
          </button>
          <button class="btn-secondary" (click)="schedulePost()">
            <i class="fas fa-clock"></i> Schedule
          </button>
        </div>
        <div class="action-group" *ngIf="post.status === 'scheduled'">
          <button class="btn-primary" (click)="publishNow()">
            <i class="fas fa-paper-plane"></i> Publish Now
          </button>
          <button class="btn-secondary" (click)="reschedulePost()">
            <i class="fas fa-clock"></i> Reschedule
          </button>
          <button class="btn-outline" (click)="cancelSchedule()">
            <i class="fas fa-times"></i> Cancel Schedule
          </button>
        </div>
        <div class="action-group" *ngIf="post.status === 'published'">
          <button class="btn-secondary" (click)="promotePost()">
            <i class="fas fa-bullhorn"></i> Promote
          </button>
          <button class="btn-outline" (click)="archivePost()">
            <i class="fas fa-archive"></i> Archive
          </button>
        </div>
        <div class="action-group" *ngIf="post.status === 'failed'">
          <button class="btn-primary" (click)="retryPost()">
            <i class="fas fa-redo"></i> Retry
          </button>
          <button class="btn-secondary" (click)="editPost()">
            <i class="fas fa-edit"></i> Edit & Retry
          </button>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading post details...</p>
      </div>
    </div>

    <div class="error-state" *ngIf="error">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error Loading Post</h3>
        <p>{{ error }}</p>
        <button class="btn-primary" (click)="retryLoad()">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .post-detail-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .btn-back {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #666;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .btn-back:hover {
      background-color: #f8f9fa;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary, .btn-outline, .btn-danger, .btn-link {
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

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
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

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .btn-link {
      background: none;
      color: #007bff;
      padding: 0.25rem 0.5rem;
      font-size: 0.9rem;
    }

    .btn-link:hover {
      background-color: #f8f9fa;
      text-decoration: underline;
    }

    .post-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .post-header {
      padding: 2rem;
      border-bottom: 1px solid #eee;
    }

    .post-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .status-badge, .platform-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
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

    .platform-badge {
      background-color: #e9ecef;
      color: #495057;
    }

    .platform-badge.small {
      padding: 0.125rem 0.5rem;
      font-size: 0.7rem;
    }

    .post-header h1 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 2rem;
      line-height: 1.3;
    }

    .post-info {
      display: flex;
      gap: 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .author {
      font-weight: 500;
    }

    .post-body {
      padding: 2rem;
    }

    .content-section, .media-section, .tags-section {
      margin-bottom: 2rem;
    }

    .content-section h3, .media-section h3, .tags-section h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    .content-text {
      line-height: 1.6;
      color: #555;
      font-size: 1.1rem;
      white-space: pre-wrap;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .media-item {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }

    .media-item img, .media-item video {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .media-info {
      padding: 0.5rem;
      background-color: #f8f9fa;
      text-align: center;
    }

    .media-type {
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .engagement-stats {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .engagement-stats h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .comments-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .comments-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .comment-item {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    .comment-item:last-child {
      border-bottom: none;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .comment-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .comment-date {
      font-size: 0.8rem;
      color: #666;
    }

    .comment-content {
      margin-bottom: 0.5rem;
      line-height: 1.5;
      color: #555;
    }

    .comment-actions {
      display: flex;
      gap: 1rem;
    }

    .load-more {
      text-align: center;
      margin-top: 1rem;
    }

    .post-actions {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 2rem;
    }

    .action-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .loading-spinner, .error-message {
      font-size: 1.2rem;
    }

    .loading-spinner i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #007bff;
    }

    .error-message i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #dc3545;
    }

    .error-message h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    @media (max-width: 768px) {
      .post-detail-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-actions {
        flex-wrap: wrap;
        justify-content: center;
      }

      .post-header {
        padding: 1.5rem;
      }

      .post-header h1 {
        font-size: 1.5rem;
      }

      .post-body {
        padding: 1.5rem;
      }

      .post-info {
        flex-direction: column;
        gap: 0.5rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .action-group {
        justify-content: center;
      }
    }
  `]
})
export class PostDetailComponent implements OnInit {
  post: SocialPost | null = null;
  comments: Comment[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  hasMoreComments: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.loadPost(postId);
      this.loadComments(postId);
    }
  }

  loadPost(id: string): void {
    // Simulate API call
    setTimeout(() => {
      this.post = {
        id: id,
        title: 'Exciting Product Launch Announcement',
        content: 'We are thrilled to announce the launch of our latest product! This innovative solution will revolutionize the way you manage your social media presence. Stay tuned for more updates and exclusive offers.\n\nKey features include:\n- Advanced analytics\n- Multi-platform scheduling\n- AI-powered content suggestions\n- Team collaboration tools\n\n#ProductLaunch #Innovation #SocialMedia',
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
      };
      this.isLoading = false;
    }, 1000);
  }

  loadComments(postId: string): void {
    // Simulate API call
    setTimeout(() => {
      this.comments = [
        {
          id: '1',
          author: 'John Smith',
          content: 'This looks amazing! Can\'t wait to try it out.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          platform: 'facebook'
        },
        {
          id: '2',
          author: 'Sarah Johnson',
          content: 'Finally! This is exactly what we\'ve been waiting for.',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          platform: 'facebook'
        },
        {
          id: '3',
          author: 'Mike Wilson',
          content: 'Great work team! The features look very promising.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          platform: 'facebook'
        }
      ];
      this.hasMoreComments = true;
    }, 500);
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
      draft: 'fas fa-edit',
      scheduled: 'fas fa-clock',
      published: 'fas fa-check-circle',
      failed: 'fas fa-exclamation-triangle'
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

  goBack(): void {
    this.router.navigate(['/social/posts']);
  }

  editPost(): void {
    this.router.navigate(['/social/posts', this.post?.id, 'edit']);
  }

  duplicatePost(): void {
    if (this.post) {
      console.log('Duplicating post:', this.post.id);
      // Implement duplication logic
      this.router.navigate(['/social/posts/create'], {
        queryParams: { duplicate: this.post.id }
      });
    }
  }

  deletePost(): void {
    if (this.post && confirm('Are you sure you want to delete this post?')) {
      console.log('Deleting post:', this.post.id);
      // Implement deletion logic
      this.router.navigate(['/social/posts']);
    }
  }

  publishNow(): void {
    if (this.post) {
      console.log('Publishing post now:', this.post.id);
      this.post.status = 'published';
      this.post.publishedDate = new Date();
      // Implement publish logic
    }
  }

  schedulePost(): void {
    console.log('Opening schedule dialog for post:', this.post?.id);
    // Implement schedule dialog
  }

  reschedulePost(): void {
    console.log('Opening reschedule dialog for post:', this.post?.id);
    // Implement reschedule dialog
  }

  cancelSchedule(): void {
    if (this.post && confirm('Are you sure you want to cancel the schedule?')) {
      this.post.status = 'draft';
      this.post.scheduledDate = undefined;
      console.log('Schedule cancelled for post:', this.post.id);
      // Implement cancel schedule logic
    }
  }

  promotePost(): void {
    console.log('Opening promotion dialog for post:', this.post?.id);
    // Implement promotion logic
  }

  archivePost(): void {
    if (this.post && confirm('Are you sure you want to archive this post?')) {
      console.log('Archiving post:', this.post.id);
      // Implement archive logic
    }
  }

  retryPost(): void {
    if (this.post) {
      console.log('Retrying post:', this.post.id);
      this.post.status = 'scheduled';
      // Implement retry logic
    }
  }

  replyToComment(commentId: string): void {
    console.log('Replying to comment:', commentId);
    // Implement reply logic
  }

  likeComment(commentId: string): void {
    console.log('Liking comment:', commentId);
    // Implement like logic
  }

  loadMoreComments(): void {
    console.log('Loading more comments...');
    // Implement load more logic
  }

  retryLoad(): void {
    this.error = null;
    this.isLoading = true;
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.loadPost(postId);
      this.loadComments(postId);
    }
  }
}