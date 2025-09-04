import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="forum-detail-container" *ngIf="forum">
      <div class="forum-header">
        <button class="btn btn-outline-secondary" [routerLink]="['/social/community/forums']">
          <i class="fas fa-arrow-left"></i> Back to Forums
        </button>
        
        <div class="forum-info">
          <div class="forum-icon">
            <i [class]="forum.icon"></i>
          </div>
          <div class="forum-details">
            <h1>{{ forum.title }}</h1>
            <p class="forum-description">{{ forum.description }}</p>
            <div class="forum-meta">
              <span class="category">{{ forum.category | titlecase }}</span>
              <span class="privacy" [class]="forum.privacy">{{ forum.privacy | titlecase }}</span>
              <span class="member-count">
                <i class="fas fa-users"></i> {{ forum.memberCount }} members
              </span>
              <span class="post-count">
                <i class="fas fa-comments"></i> {{ forum.postCount }} posts
              </span>
            </div>
          </div>
          <div class="forum-actions">
            <button class="btn btn-primary" (click)="toggleMembership()" *ngIf="!forum.isMember">
              <i class="fas fa-plus"></i> Join Forum
            </button>
            <button class="btn btn-outline-danger" (click)="toggleMembership()" *ngIf="forum.isMember">
              <i class="fas fa-minus"></i> Leave Forum
            </button>
            <button class="btn btn-outline-primary" (click)="shareForum()">
              <i class="fas fa-share"></i> Share
            </button>
          </div>
        </div>
      </div>

      <div class="forum-content">
        <div class="main-content">
          <div class="post-composer" *ngIf="forum.isMember && forum.allowMemberPosts">
            <div class="composer-header">
              <div class="user-avatar">
                <img src="/assets/user-avatar.jpg" alt="Your avatar">
              </div>
              <div class="composer-form">
                <input 
                  type="text" 
                  [(ngModel)]="newPost.title" 
                  placeholder="What's your post title?"
                  class="post-title-input">
                <textarea 
                  [(ngModel)]="newPost.content" 
                  placeholder="Share your thoughts with the forum..."
                  rows="4"></textarea>
              </div>
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
                <select [(ngModel)]="newPost.category" class="post-category">
                  <option value="">Select category</option>
                  <option value="question">Question</option>
                  <option value="discussion">Discussion</option>
                  <option value="tip">Tip/Advice</option>
                  <option value="success">Success Story</option>
                </select>
              </div>
              <button class="btn btn-primary btn-sm" (click)="createPost()" [disabled]="!newPost.title.trim() || !newPost.content.trim()">
                {{ forum.requireApproval ? 'Submit for Review' : 'Post' }}
              </button>
            </div>
          </div>

          <div class="posts-section">
            <div class="section-header">
              <h2>Forum Posts</h2>
              <div class="sort-options">
                <select [(ngModel)]="sortBy" (change)="sortPosts()">
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="oldest">Oldest First</option>
                  <option value="replies">Most Replies</option>
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
                      <span class="post-category" *ngIf="post.category">{{ post.category | titlecase }}</span>
                    </div>
                  </div>
                  <div class="post-menu">
                    <button class="btn-icon" (click)="togglePostMenu(post)">
                      <i class="fas fa-ellipsis-h"></i>
                    </button>
                  </div>
                </div>

                <div class="post-content">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <p>{{ post.content }}</p>
                  <img [src]="post.image" *ngIf="post.image" [alt]="'Post image'" class="post-image">
                </div>

                <div class="post-actions">
                  <button class="action-btn" (click)="toggleLike(post)" [class.active]="post.isLiked">
                    <i class="fas fa-heart"></i>
                    <span>{{ post.likes }}</span>
                  </button>
                  <button class="action-btn" (click)="toggleReplies(post)">
                    <i class="fas fa-reply"></i>
                    <span>{{ post.replies.length }} replies</span>
                  </button>
                  <button class="action-btn" (click)="sharePost(post)">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                  </button>
                  <button class="action-btn" (click)="bookmarkPost(post)" [class.active]="post.isBookmarked">
                    <i class="fas fa-bookmark"></i>
                    <span>Save</span>
                  </button>
                </div>

                <div class="replies-section" *ngIf="post.showReplies">
                  <div class="reply" *ngFor="let reply of post.replies">
                    <img [src]="reply.author.avatar || '/assets/user-avatar.jpg'" [alt]="reply.author.name">
                    <div class="reply-content">
                      <div class="reply-header">
                        <strong>{{ reply.author.name }}</strong>
                        <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                      <p>{{ reply.content }}</p>
                      <div class="reply-actions">
                        <button class="reply-action" (click)="toggleReplyLike(reply)" [class.active]="reply.isLiked">
                          <i class="fas fa-heart"></i> {{ reply.likes }}
                        </button>
                        <button class="reply-action" (click)="replyToReply(reply)">
                          <i class="fas fa-reply"></i> Reply
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="reply-composer" *ngIf="forum.isMember">
                    <img src="/assets/user-avatar.jpg" alt="Your avatar">
                    <div class="reply-input">
                      <textarea 
                        [(ngModel)]="post.newReply" 
                        placeholder="Write a reply..."
                        rows="3"></textarea>
                      <div class="reply-composer-actions">
                        <button class="btn btn-sm btn-outline-secondary" (click)="cancelReply(post)">
                          Cancel
                        </button>
                        <button class="btn btn-sm btn-primary" (click)="addReply(post)" [disabled]="!post.newReply?.trim()">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="empty-state" *ngIf="sortedPosts.length === 0">
              <i class="fas fa-comments"></i>
              <h3>No posts yet</h3>
              <p *ngIf="forum.isMember">Be the first to start a discussion!</p>
              <p *ngIf="!forum.isMember">Join the forum to see and create posts.</p>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="sidebar-section">
            <h3>Forum Stats</h3>
            <div class="forum-stats">
              <div class="stat">
                <i class="fas fa-users"></i>
                <div>
                  <strong>{{ forum.memberCount }}</strong>
                  <span>Members</span>
                </div>
              </div>
              <div class="stat">
                <i class="fas fa-comments"></i>
                <div>
                  <strong>{{ forum.postCount }}</strong>
                  <span>Posts</span>
                </div>
              </div>
              <div class="stat">
                <i class="fas fa-calendar"></i>
                <div>
                  <strong>{{ formatDate(forum.createdAt) }}</strong>
                  <span>Created</span>
                </div>
              </div>
              <div class="stat">
                <i class="fas fa-clock"></i>
                <div>
                  <strong>{{ forum.todayPosts }}</strong>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-section" *ngIf="forum.rules">
            <h3>Forum Rules</h3>
            <div class="rules-content">
              <p>{{ forum.rules }}</p>
            </div>
          </div>

          <div class="sidebar-section" *ngIf="forum.tags && forum.tags.length > 0">
            <h3>Tags</h3>
            <div class="tags">
              <span class="tag" *ngFor="let tag of forum.tags">#{{ tag }}</span>
            </div>
          </div>

          <div class="sidebar-section">
            <h3>Active Members</h3>
            <div class="members-list">
              <div class="member" *ngFor="let member of activeMembers">
                <img [src]="member.avatar || '/assets/user-avatar.jpg'" [alt]="member.name">
                <div class="member-info">
                  <strong>{{ member.name }}</strong>
                  <span>{{ member.postsCount }} posts</span>
                </div>
                <div class="member-status" [class]="member.status"></div>
              </div>
            </div>
            <button class="btn btn-outline-primary btn-sm" style="width: 100%; margin-top: 10px;">
              View All Members
            </button>
          </div>

          <div class="sidebar-section">
            <h3>Related Forums</h3>
            <div class="related-forums">
              <div class="related-forum" *ngFor="let relatedForum of relatedForums" [routerLink]="['/social/community/forums', relatedForum.id]">
                <div class="related-forum-icon">
                  <i [class]="relatedForum.icon"></i>
                </div>
                <div class="related-forum-info">
                  <strong>{{ relatedForum.title }}</strong>
                  <span>{{ relatedForum.memberCount }} members</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forum-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .forum-header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .forum-header button {
      margin-bottom: 20px;
    }

    .forum-info {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }

    .forum-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      flex-shrink: 0;
    }

    .forum-details {
      flex: 1;
    }

    .forum-details h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .forum-description {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 16px;
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
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .privacy {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .privacy.public {
      background: #d4edda;
      color: #155724;
    }

    .privacy.private {
      background: #f8d7da;
      color: #721c24;
    }

    .privacy.restricted {
      background: #fff3cd;
      color: #856404;
    }

    .member-count,
    .post-count {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
      font-size: 14px;
    }

    .forum-actions {
      display: flex;
      gap: 10px;
      flex-direction: column;
    }

    .forum-content {
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

    .composer-form {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .post-title-input {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .composer-form textarea {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
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
      align-items: center;
    }

    .post-category {
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
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
      display: block;
    }

    .post-category {
      background: #e9ecef;
      color: #495057;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      margin-top: 2px;
      display: inline-block;
    }

    .post-content {
      margin-bottom: 15px;
    }

    .post-title {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
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

    .replies-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .reply {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }

    .reply img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .reply-content {
      flex: 1;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
    }

    .reply-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 5px;
    }

    .reply-header strong {
      font-size: 14px;
      color: #333;
    }

    .reply-time {
      font-size: 12px;
      color: #666;
    }

    .reply-content p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
    }

    .reply-actions {
      display: flex;
      gap: 15px;
    }

    .reply-action {
      background: none;
      border: none;
      color: #666;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .reply-action:hover {
      color: #333;
    }

    .reply-action.active {
      color: #dc3545;
    }

    .reply-composer {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-top: 15px;
    }

    .reply-composer img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .reply-input {
      flex: 1;
    }

    .reply-input textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
      margin-bottom: 8px;
    }

    .reply-composer-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
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

    .forum-stats {
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
      flex: 1;
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

    .member-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .member-status.online {
      background: #28a745;
    }

    .member-status.offline {
      background: #6c757d;
    }

    .related-forums {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .related-forum {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
      color: inherit;
    }

    .related-forum:hover {
      background: #f8f9fa;
      text-decoration: none;
      color: inherit;
    }

    .related-forum-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #007bff, #0056b3);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
    }

    .related-forum-info {
      display: flex;
      flex-direction: column;
    }

    .related-forum-info strong {
      font-size: 14px;
      color: #333;
    }

    .related-forum-info span {
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
      .forum-content {
        grid-template-columns: 1fr;
      }
      
      .forum-info {
        flex-direction: column;
        text-align: center;
      }
      
      .forum-actions {
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
      
      .composer-options {
        justify-content: space-between;
      }
    }
  `]
})
export class ForumDetailComponent implements OnInit {
  forum: any = null;
  posts: any[] = [];
  sortedPosts: any[] = [];
  activeMembers: any[] = [];
  relatedForums: any[] = [];
  newPost = {
    title: '',
    content: '',
    category: ''
  };
  sortBy: string = 'recent';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const forumId = params['id'];
      this.loadForum(forumId);
      this.loadPosts(forumId);
      this.loadActiveMembers(forumId);
      this.loadRelatedForums(forumId);
    });
  }

  loadForum(id: string) {
    // Mock data - replace with actual API call
    this.forum = {
      id: parseInt(id),
      title: 'Credit Score Improvement Tips',
      description: 'Share and discuss strategies for improving your credit score effectively. This is a supportive community where members help each other achieve better financial health.',
      category: 'credit-tips',
      privacy: 'public',
      icon: 'fas fa-chart-line',
      memberCount: 89,
      postCount: 156,
      todayPosts: 5,
      createdAt: new Date('2023-08-15'),
      isMember: true,
      allowMemberPosts: true,
      requireApproval: false,
      rules: 'Be respectful and supportive. Share genuine experiences and tips. No spam or promotional content. Keep discussions relevant to credit improvement.',
      tags: ['credit', 'score', 'improvement', 'tips', 'financial-health']
    };
  }

  loadPosts(forumId: string) {
    // Mock data - replace with actual API call
    this.posts = [
      {
        id: 1,
        title: 'How I raised my credit score by 100 points in 6 months',
        content: 'I wanted to share my journey and the specific steps I took to improve my credit score dramatically. It required discipline and patience, but the results were worth it.',
        category: 'success',
        author: {
          id: 1,
          name: 'Sarah Johnson',
          avatar: '/assets/user1.jpg'
        },
        createdAt: new Date('2024-01-20'),
        likes: 34,
        isLiked: true,
        isBookmarked: false,
        image: '/assets/credit-improvement.jpg',
        replies: [
          {
            id: 1,
            content: 'This is so inspiring! What was your starting score?',
            author: {
              id: 2,
              name: 'Mike Chen',
              avatar: '/assets/user2.jpg'
            },
            createdAt: new Date('2024-01-20'),
            likes: 5,
            isLiked: false
          },
          {
            id: 2,
            content: 'Amazing progress! I\'m following similar steps and seeing improvements too.',
            author: {
              id: 3,
              name: 'Lisa Rodriguez',
              avatar: '/assets/user3.jpg'
            },
            createdAt: new Date('2024-01-20'),
            likes: 3,
            isLiked: true
          }
        ],
        showReplies: false,
        newReply: ''
      },
      {
        id: 2,
        title: 'Best credit monitoring services - comparison',
        content: 'I\'ve been using several credit monitoring services and wanted to share my experience with each one. Here\'s what I\'ve learned about the pros and cons of each.',
        category: 'tip',
        author: {
          id: 4,
          name: 'David Wilson',
          avatar: '/assets/user4.jpg'
        },
        createdAt: new Date('2024-01-19'),
        likes: 28,
        isLiked: false,
        isBookmarked: true,
        replies: [
          {
            id: 3,
            content: 'Thanks for this detailed comparison! Very helpful.',
            author: {
              id: 5,
              name: 'Emma Thompson',
              avatar: '/assets/user5.jpg'
            },
            createdAt: new Date('2024-01-19'),
            likes: 2,
            isLiked: false
          }
        ],
        showReplies: false,
        newReply: ''
      },
      {
        id: 3,
        title: 'Question about paying off collections',
        content: 'I have some old collections on my report. Should I pay them off or wait for them to fall off? What\'s the best strategy here?',
        category: 'question',
        author: {
          id: 6,
          name: 'Robert Brown',
          avatar: '/assets/user6.jpg'
        },
        createdAt: new Date('2024-01-18'),
        likes: 12,
        isLiked: false,
        isBookmarked: false,
        replies: [
          {
            id: 4,
            content: 'It depends on how old they are and your overall strategy. Generally, paying them off can help.',
            author: {
              id: 1,
              name: 'Sarah Johnson',
              avatar: '/assets/user1.jpg'
            },
            createdAt: new Date('2024-01-18'),
            likes: 8,
            isLiked: true
          },
          {
            id: 5,
            content: 'I\'d recommend consulting with a credit counselor for personalized advice.',
            author: {
              id: 7,
              name: 'Jennifer Lee',
              avatar: '/assets/user7.jpg'
            },
            createdAt: new Date('2024-01-18'),
            likes: 4,
            isLiked: false
          }
        ],
        showReplies: false,
        newReply: ''
      }
    ];
    
    this.sortPosts();
  }

  loadActiveMembers(forumId: string) {
    // Mock data - replace with actual API call
    this.activeMembers = [
      {
        id: 1,
        name: 'Sarah Johnson',
        avatar: '/assets/user1.jpg',
        postsCount: 23,
        status: 'online'
      },
      {
        id: 2,
        name: 'Mike Chen',
        avatar: '/assets/user2.jpg',
        postsCount: 18,
        status: 'online'
      },
      {
        id: 3,
        name: 'Lisa Rodriguez',
        avatar: '/assets/user3.jpg',
        postsCount: 15,
        status: 'offline'
      },
      {
        id: 4,
        name: 'David Wilson',
        avatar: '/assets/user4.jpg',
        postsCount: 12,
        status: 'online'
      }
    ];
  }

  loadRelatedForums(forumId: string) {
    // Mock data - replace with actual API call
    this.relatedForums = [
      {
        id: 2,
        title: 'Success Stories',
        icon: 'fas fa-trophy',
        memberCount: 124
      },
      {
        id: 3,
        title: 'General Q&A',
        icon: 'fas fa-question-circle',
        memberCount: 167
      },
      {
        id: 4,
        title: 'Credit Repair Resources',
        icon: 'fas fa-book',
        memberCount: 98
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
      case 'replies':
        this.sortedPosts = [...this.posts].sort((a, b) => b.replies.length - a.replies.length);
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
    this.forum.isMember = !this.forum.isMember;
    if (this.forum.isMember) {
      this.forum.memberCount++;
    } else {
      this.forum.memberCount--;
    }
  }

  shareForum() {
    // Implement share functionality
    console.log('Sharing forum:', this.forum.title);
  }

  createPost() {
    if (this.newPost.title.trim() && this.newPost.content.trim()) {
      const newPost = {
        id: this.posts.length + 1,
        title: this.newPost.title,
        content: this.newPost.content,
        category: this.newPost.category,
        author: {
          id: 999,
          name: 'You',
          avatar: '/assets/user-avatar.jpg'
        },
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        isBookmarked: false,
        replies: [],
        showReplies: false,
        newReply: ''
      };
      
      this.posts.unshift(newPost);
      this.sortPosts();
      this.newPost = { title: '', content: '', category: '' };
      this.forum.postCount++;
      this.forum.todayPosts++;
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

  toggleReplies(post: any) {
    post.showReplies = !post.showReplies;
  }

  addReply(post: any) {
    if (post.newReply?.trim()) {
      const newReply = {
        id: post.replies.length + 1,
        content: post.newReply,
        author: {
          id: 999,
          name: 'You',
          avatar: '/assets/user-avatar.jpg'
        },
        createdAt: new Date(),
        likes: 0,
        isLiked: false
      };
      
      post.replies.push(newReply);
      post.newReply = '';
    }
  }

  cancelReply(post: any) {
    post.newReply = '';
    post.showReplies = false;
  }

  toggleReplyLike(reply: any) {
    reply.isLiked = !reply.isLiked;
    if (reply.isLiked) {
      reply.likes++;
    } else {
      reply.likes--;
    }
  }

  replyToReply(reply: any) {
    // Implement reply to reply functionality
    console.log('Replying to reply:', reply.id);
  }

  sharePost(post: any) {
    // Implement share post functionality
    console.log('Sharing post:', post.id);
  }

  bookmarkPost(post: any) {
    post.isBookmarked = !post.isBookmarked;
  }

  togglePostMenu(post: any) {
    // Implement post menu functionality
    console.log('Toggle post menu for:', post.id);
  }
}