import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="group-detail-container" *ngIf="group">
      <div class="group-header">
        <button class="btn btn-outline-secondary" [routerLink]="['/social/community/groups']">
          <i class="fas fa-arrow-left"></i> Back to Groups
        </button>
        
        <div class="group-info">
          <div class="group-avatar">
            <img [src]="group.avatar || '/assets/group-default.jpg'" [alt]="group.name">
          </div>
          <div class="group-details">
            <h1>{{ group.name }}</h1>
            <p class="group-description">{{ group.description }}</p>
            <div class="group-meta">
              <span class="category">{{ group.category | titlecase }}</span>
              <span class="status" [class]="group.status">{{ group.status | titlecase }}</span>
              <span class="member-count">
                <i class="fas fa-users"></i> {{ group.memberCount }} members
              </span>
            </div>
          </div>
          <div class="group-actions">
            <button class="btn btn-primary" (click)="toggleMembership()" *ngIf="!group.isMember">
              <i class="fas fa-plus"></i> Join Group
            </button>
            <button class="btn btn-outline-danger" (click)="toggleMembership()" *ngIf="group.isMember">
              <i class="fas fa-minus"></i> Leave Group
            </button>
            <button class="btn btn-outline-primary" (click)="shareGroup()">
              <i class="fas fa-share"></i> Share
            </button>
          </div>
        </div>
      </div>

      <div class="group-content">
        <div class="main-content">
          <div class="post-composer" *ngIf="group.isMember && group.allowMemberPosts">
            <div class="composer-header">
              <div class="user-avatar">
                <img src="/assets/user-avatar.jpg" alt="Your avatar">
              </div>
              <textarea 
                [(ngModel)]="newPostContent" 
                placeholder="Share something with the group..."
                rows="3"></textarea>
            </div>
            <div class="composer-actions">
              <div class="composer-options">
                <button type="button" class="btn-icon" title="Add image">
                  <i class="fas fa-image"></i>
                </button>
                <button type="button" class="btn-icon" title="Add link">
                  <i class="fas fa-link"></i>
                </button>
                <button type="button" class="btn-icon" title="Add poll">
                  <i class="fas fa-poll"></i>
                </button>
              </div>
              <button class="btn btn-primary btn-sm" (click)="createPost()" [disabled]="!newPostContent.trim()">
                Post
              </button>
            </div>
          </div>

          <div class="posts-section">
            <div class="section-header">
              <h2>Recent Posts</h2>
              <div class="sort-options">
                <select [(ngModel)]="sortBy" (change)="sortPosts()">
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div class="posts-list">
              <div class="post-card" *ngFor="let post of sortedPosts">
                <div class="post-header">
                  <div class="author-info">
                    <img [src]="post.author.avatar || '/assets/user-avatar.jpg'" [alt]="post.author.name">
                    <div class="author-details">
                      <h4>{{ post.author.name }}</h4>
                      <span class="post-time">{{ formatDate(post.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="post-menu">
                    <button class="btn-icon" (click)="togglePostMenu(post)">
                      <i class="fas fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>

                <div class="post-content">
                  <p>{{ post.content }}</p>
                  <img [src]="post.image" *ngIf="post.image" [alt]="'Post image'" class="post-image">
                </div>

                <div class="post-actions">
                  <button class="action-btn" (click)="toggleLike(post)" [class.active]="post.isLiked">
                    <i class="fas fa-heart"></i>
                    <span>{{ post.likes }}</span>
                  </button>
                  <button class="action-btn" (click)="toggleComments(post)">
                    <i class="fas fa-comment"></i>
                    <span>{{ post.comments.length }}</span>
                  </button>
                  <button class="action-btn" (click)="sharePost(post)">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                  </button>
                </div>

                <div class="comments-section" *ngIf="post.showComments">
                  <div class="comment" *ngFor="let comment of post.comments">
                    <img [src]="comment.author.avatar || '/assets/user-avatar.jpg'" [alt]="comment.author.name">
                    <div class="comment-content">
                      <div class="comment-header">
                        <strong>{{ comment.author.name }}</strong>
                        <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                      </div>
                      <p>{{ comment.content }}</p>
                    </div>
                  </div>
                  
                  <div class="comment-composer" *ngIf="group.isMember">
                    <img src="/assets/user-avatar.jpg" alt="Your avatar">
                    <div class="comment-input">
                      <input 
                        type="text" 
                        [(ngModel)]="post.newComment" 
                        placeholder="Write a comment..."
                        (keyup.enter)="addComment(post)">
                      <button class="btn btn-sm btn-primary" (click)="addComment(post)" [disabled]="!post.newComment?.trim()">
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="sortedPosts.length === 0">
              <i class="fas fa-comments"></i>
              <h3>No posts yet</h3>
              <p *ngIf="group.isMember">Be the first to share something with the group!</p>
              <p *ngIf="!group.isMember">Join the group to see and create posts.</p>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="sidebar-section">
            <h3>About</h3>
            <div class="group-stats">
              <div class="stat">
                <i class="fas fa-users"></i>
                <div>
                  <strong>{{ group.memberCount }}</strong>
                  <span>Members</span>
                </div>
              </div>
              <div class="stat">
                <i class="fas fa-comments"></i>
                <div>
                  <strong>{{ group.postCount }}</strong>
                  <span>Posts</span>
                </div>
              </div>
              <div class="stat">
                <i class="fas fa-calendar"></i>
                <div>
                  <strong>{{ formatDate(group.createdAt) }}</strong>
                  <span>Created</span>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-section" *ngIf="group.rules">
            <h3>Group Rules</h3>
            <div class="rules-content">
              <p>{{ group.rules }}</p>
            </div>
          </div>

          <div class="sidebar-section" *ngIf="group.tags && group.tags.length > 0">
            <h3>Tags</h3>
            <div class="tags">
              <span class="tag" *ngFor="let tag of group.tags">#{{ tag }}</span>
            </div>
          </div>

          <div class="sidebar-section">
            <h3>Recent Members</h3>
            <div class="members-list">
              <div class="member" *ngFor="let member of recentMembers">
                <img [src]="member.avatar || '/assets/user-avatar.jpg'" [alt]="member.name">
                <div class="member-info">
                  <strong>{{ member.name }}</strong>
                  <span>{{ formatDate(member.joinedAt) }}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-outline-primary btn-sm" style="width: 100%; margin-top: 10px;">
              View All Members
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .group-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .group-header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .group-header button {
      margin-bottom: 20px;
    }

    .group-info {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .group-avatar {
      width: 100px;
      height: 100px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .group-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .group-details {
      flex: 1;
    }

    .group-details h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .group-description {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }

    .group-meta {
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
    }

    .category {
      background: #e9ecef;
      color: #495057;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .status {
      padding: 4px 12px;
      border-radius: 6px;
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

    .member-count {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 14px;
    }

    .group-actions {
      display: flex;
      gap: 10px;
      flex-direction: column;
    }

    .group-content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .post-composer {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .composer-header {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .composer-header textarea {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      resize: vertical;
      font-family: inherit;
    }

    .composer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .composer-options {
      display: flex;
      gap: 10px;
    }

    .btn-icon {
      background: none;
      border: none;
      color: #666;
      font-size: 16px;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #f8f9fa;
      color: #333;
    }

    .posts-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
    }

    .sort-options select {
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .post-card {
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 20px;
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .author-info {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .author-info img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-details h4 {
      margin: 0;
      color: #333;
      font-size: 14px;
    }

    .post-time {
      color: #666;
      font-size: 12px;
    }

    .post-content {
      margin-bottom: 15px;
    }

    .post-content p {
      margin: 0 0 10px 0;
      color: #333;
      line-height: 1.5;
    }

    .post-image {
      max-width: 100%;
      border-radius: 8px;
      margin-top: 10px;
    }

    .post-actions {
      display: flex;
      gap: 20px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .action-btn {
      background: none;
      border: none;
      color: #666;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .action-btn:hover {
      background: #f8f9fa;
    }

    .action-btn.active {
      color: #dc3545;
    }

    .comments-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .comment {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .comment img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .comment-content {
      flex: 1;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 10px;
    }

    .comment-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 5px;
    }

    .comment-header strong {
      font-size: 14px;
      color: #333;
    }

    .comment-time {
      font-size: 12px;
      color: #666;
    }

    .comment-content p {
      margin: 0;
      font-size: 14px;
      color: #333;
    }

    .comment-composer {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 10px;
    }

    .comment-composer img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .comment-input {
      flex: 1;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .comment-input input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 14px;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sidebar-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .sidebar-section h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
    }

    .group-stats {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat i {
      color: #666;
      width: 20px;
    }

    .stat div {
      display: flex;
      flex-direction: column;
    }

    .stat strong {
      color: #333;
      font-size: 16px;
    }

    .stat span {
      color: #666;
      font-size: 12px;
    }

    .rules-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      background: #e9ecef;
      color: #495057;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .member {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .member img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .member-info {
      display: flex;
      flex-direction: column;
    }

    .member-info strong {
      font-size: 14px;
      color: #333;
    }

    .member-info span {
      font-size: 12px;
      color: #666;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
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

    .btn-outline-danger {
      background: transparent;
      color: #dc3545;
      border: 1px solid #dc3545;
    }

    .btn-outline-danger:hover {
      background: #dc3545;
      color: white;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-state i {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 15px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0;
    }

    @media (max-width: 768px) {
      .group-content {
        grid-template-columns: 1fr;
      }
      
      .group-info {
        flex-direction: column;
        text-align: center;
      }
      
      .group-actions {
        flex-direction: row;
        justify-content: center;
      }
      
      .composer-header {
        flex-direction: column;
      }
      
      .composer-actions {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
      }
    }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: any = null;
  posts: any[] = [];
  sortedPosts: any[] = [];
  recentMembers: any[] = [];
  newPostContent: string = '';
  sortBy: string = 'recent';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const groupId = params['id'];
      this.loadGroup(groupId);
      this.loadPosts(groupId);
      this.loadRecentMembers(groupId);
    });
  }

  loadGroup(id: string) {
    // Mock data - replace with actual API call
    this.group = {
      id: parseInt(id),
      name: 'Credit Repair Success Stories',
      description: 'Share your journey and celebrate credit repair victories with the community. This is a supportive space where members can inspire each other with their success stories.',
      category: 'success-stories',
      status: 'active',
      memberCount: 245,
      postCount: 89,
      createdAt: new Date('2023-06-15'),
      lastActivity: new Date('2024-01-20'),
      isMember: true,
      allowMemberPosts: true,
      avatar: '/assets/group1.jpg',
      rules: 'Be respectful and supportive. Share genuine experiences. No spam or promotional content. Keep discussions relevant to credit repair.',
      tags: ['credit', 'repair', 'success', 'motivation', 'financial-health']
    };
  }

  loadPosts(groupId: string) {
    // Mock data - replace with actual API call
    this.posts = [
      {
        id: 1,
        content: 'Just wanted to share that I finally reached a 750 credit score! It took 18 months of consistent effort, but it was worth it. Thank you to everyone in this group for the support and advice.',
        author: {
          id: 1,
          name: 'Sarah Johnson',
          avatar: '/assets/user1.jpg'
        },
        createdAt: new Date('2024-01-20'),
        likes: 24,
        isLiked: true,
        image: '/assets/credit-score.jpg',
        comments: [
          {
            id: 1,
            content: 'Congratulations! That\'s amazing progress. What was your starting score?',
            author: {
              id: 2,
              name: 'Mike Chen',
              avatar: '/assets/user2.jpg'
            },
            createdAt: new Date('2024-01-20')
          },
          {
            id: 2,
            content: 'So inspiring! I\'m at 680 now and hoping to reach 750 by the end of the year.',
            author: {
              id: 3,
              name: 'Lisa Rodriguez',
              avatar: '/assets/user3.jpg'
            },
            createdAt: new Date('2024-01-20')
          }
        ],
        showComments: false,
        newComment: ''
      },
      {
        id: 2,
        content: 'Quick tip: Setting up automatic payments for all my bills was a game-changer for my payment history. Haven\'t missed a payment in over a year now!',
        author: {
          id: 4,
          name: 'David Wilson',
          avatar: '/assets/user4.jpg'
        },
        createdAt: new Date('2024-01-19'),
        likes: 18,
        isLiked: false,
        comments: [
          {
            id: 3,
            content: 'Great advice! I need to set this up for my credit cards.',
            author: {
              id: 5,
              name: 'Emma Thompson',
              avatar: '/assets/user5.jpg'
            },
            createdAt: new Date('2024-01-19')
          }
        ],
        showComments: false,
        newComment: ''
      }
    ];
    
    this.sortPosts();
  }

  loadRecentMembers(groupId: string) {
    // Mock data - replace with actual API call
    this.recentMembers = [
      {
        id: 1,
        name: 'Alex Martinez',
        avatar: '/assets/user6.jpg',
        joinedAt: new Date('2024-01-18')
      },
      {
        id: 2,
        name: 'Jennifer Lee',
        avatar: '/assets/user7.jpg',
        joinedAt: new Date('2024-01-17')
      },
      {
        id: 3,
        name: 'Robert Brown',
        avatar: '/assets/user8.jpg',
        joinedAt: new Date('2024-01-16')
      }
    ];
  }

  sortPosts() {
    switch (this.sortBy) {
      case 'recent':
        this.sortedPosts = [...this.posts].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'popular':
        this.sortedPosts = [...this.posts].sort((a, b) => b.likes - a.likes);
        break;
      case 'oldest':
        this.sortedPosts = [...this.posts].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      default:
        this.sortedPosts = [...this.posts];
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

  toggleMembership() {
    this.group.isMember = !this.group.isMember;
    if (this.group.isMember) {
      this.group.memberCount++;
    } else {
      this.group.memberCount--;
    }
  }

  shareGroup() {
    // Implement share functionality
    console.log('Sharing group:', this.group.name);
  }

  createPost() {
    if (this.newPostContent.trim()) {
      const newPost = {
        id: this.posts.length + 1,
        content: this.newPostContent,
        author: {
          id: 999,
          name: 'You',
          avatar: '/assets/user-avatar.jpg'
        },
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        comments: [],
        showComments: false,
        newComment: ''
      };
      
      this.posts.unshift(newPost);
      this.sortPosts();
      this.newPostContent = '';
      this.group.postCount++;
    }
  }

  toggleLike(post: any) {
    post.isLiked = !post.isLiked;
    if (post.isLiked) {
      post.likes++;
    } else {
      post.likes--;
    }
  }

  toggleComments(post: any) {
    post.showComments = !post.showComments;
  }

  addComment(post: any) {
    if (post.newComment?.trim()) {
      const newComment = {
        id: post.comments.length + 1,
        content: post.newComment,
        author: {
          id: 999,
          name: 'You',
          avatar: '/assets/user-avatar.jpg'
        },
        createdAt: new Date()
      };
      
      post.comments.push(newComment);
      post.newComment = '';
    }
  }

  sharePost(post: any) {
    // Implement share post functionality
    console.log('Sharing post:', post.id);
  }

  togglePostMenu(post: any) {
    // Implement post menu functionality
    console.log('Toggle post menu for:', post.id);
  }
}