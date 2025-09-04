import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forum-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="create-forum-container">
      <div class="create-forum-header">
        <button class="btn btn-outline-secondary" [routerLink]="['/social/community/forums']">
          <i class="fas fa-arrow-left"></i> Back to Forums
        </button>
        <h1>Create New Forum</h1>
        <p>Start a new discussion space for the community</p>
      </div>

      <form class="create-forum-form" (ngSubmit)="createForum()" #forumForm="ngForm">
        <div class="form-section">
          <h2>Basic Information</h2>
          
          <div class="form-group">
            <label for="title">Forum Title *</label>
            <input 
              type="text" 
              id="title"
              name="title"
              [(ngModel)]="forum.title" 
              required
              maxlength="100"
              placeholder="Enter a clear, descriptive title for your forum">
            <div class="form-help">Choose a title that clearly describes the forum's purpose</div>
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea 
              id="description"
              name="description"
              [(ngModel)]="forum.description" 
              required
              maxlength="500"
              rows="4"
              placeholder="Describe what this forum is about and what kind of discussions it will host"></textarea>
            <div class="form-help">{{ forum.description.length }}/500 characters</div>
          </div>

          <div class="form-group">
            <label for="category">Category *</label>
            <select id="category" name="category" [(ngModel)]="forum.category" required>
              <option value="">Select a category</option>
              <option value="general">General Discussion</option>
              <option value="credit-tips">Credit Tips & Strategies</option>
              <option value="success-stories">Success Stories</option>
              <option value="questions">Questions & Answers</option>
              <option value="resources">Resources & Tools</option>
              <option value="legal">Legal Advice</option>
              <option value="debt-management">Debt Management</option>
              <option value="financial-planning">Financial Planning</option>
            </select>
            <div class="form-help">Choose the most appropriate category for your forum</div>
          </div>
        </div>

        <div class="form-section">
          <h2>Forum Settings</h2>
          
          <div class="form-group">
            <label for="privacy">Privacy Level *</label>
            <select id="privacy" name="privacy" [(ngModel)]="forum.privacy" required>
              <option value="public">Public - Anyone can view and join</option>
              <option value="private">Private - Invitation only</option>
              <option value="restricted">Restricted - Anyone can view, approval required to join</option>
            </select>
            <div class="form-help">Determine who can access your forum</div>
          </div>

          <div class="form-group">
            <label>Posting Permissions</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  name="allowMemberPosts"
                  [(ngModel)]="forum.allowMemberPosts">
                <span class="checkmark"></span>
                Allow all members to create posts
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  name="requireApproval"
                  [(ngModel)]="forum.requireApproval">
                <span class="checkmark"></span>
                Require approval for new posts
              </label>
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  name="allowAnonymous"
                  [(ngModel)]="forum.allowAnonymous">
                <span class="checkmark"></span>
                Allow anonymous posting
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="tags">Tags</label>
            <input 
              type="text" 
              id="tags"
              name="tags"
              [(ngModel)]="tagsInput" 
              placeholder="Enter tags separated by commas (e.g., credit, repair, tips)">
            <div class="form-help">Add relevant tags to help people find your forum</div>
            <div class="tags-preview" *ngIf="getTagsArray().length > 0">
              <span class="tag" *ngFor="let tag of getTagsArray()">#{{ tag }}</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Forum Rules (Optional)</h2>
          
          <div class="form-group">
            <label for="rules">Community Guidelines</label>
            <textarea 
              id="rules"
              name="rules"
              [(ngModel)]="forum.rules" 
              maxlength="1000"
              rows="6"
              placeholder="Set clear guidelines for your forum community. What behavior is expected? What is not allowed?"></textarea>
            <div class="form-help">{{ forum.rules.length }}/1000 characters</div>
          </div>

          <div class="rules-suggestions">
            <h4>Suggested Rules:</h4>
            <div class="suggestion-buttons">
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="addSuggestedRule('respect')">
                + Be Respectful
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="addSuggestedRule('ontopic')">
                + Stay On Topic
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="addSuggestedRule('nospam')">
                + No Spam
              </button>
              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="addSuggestedRule('privacy')">
                + Respect Privacy
              </button>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Initial Content</h2>
          
          <div class="form-group">
            <label for="welcomePost">Welcome Post</label>
            <textarea 
              id="welcomePost"
              name="welcomePost"
              [(ngModel)]="forum.welcomePost" 
              maxlength="2000"
              rows="6"
              placeholder="Write a welcome message for new members. Introduce the forum's purpose and encourage participation."></textarea>
            <div class="form-help">{{ forum.welcomePost.length }}/2000 characters</div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline-secondary" [routerLink]="['/social/community/forums']">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="!forumForm.valid || isSubmitting">
            <i class="fas fa-spinner fa-spin" *ngIf="isSubmitting"></i>
            <i class="fas fa-plus" *ngIf="!isSubmitting"></i>
            {{ isSubmitting ? 'Creating...' : 'Create Forum' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-forum-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .create-forum-header {
      margin-bottom: 30px;
    }

    .create-forum-header button {
      margin-bottom: 20px;
    }

    .create-forum-header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .create-forum-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .create-forum-form {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .form-section {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-of-type {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .form-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 20px;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 25px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
      font-size: 14px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-help {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: normal;
      margin-bottom: 0;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .checkmark {
      width: 18px;
      height: 18px;
      border: 2px solid #ddd;
      border-radius: 4px;
      position: relative;
      transition: all 0.2s;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark {
      background: #007bff;
      border-color: #007bff;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .tags-preview {
      margin-top: 10px;
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

    .rules-suggestions {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .rules-suggestions h4 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
    }

    .suggestion-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
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

    .btn-outline-secondary {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
    }

    .btn-outline-secondary:hover {
      background: #6c757d;
      color: white;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .fa-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .create-forum-container {
        padding: 15px;
      }
      
      .create-forum-form {
        padding: 20px;
      }
      
      .form-actions {
        flex-direction: column;
      }
      
      .suggestion-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class ForumCreateComponent {
  forum = {
    title: '',
    description: '',
    category: '',
    privacy: 'public',
    allowMemberPosts: true,
    requireApproval: false,
    allowAnonymous: false,
    rules: '',
    welcomePost: ''
  };
  
  tagsInput: string = '';
  isSubmitting: boolean = false;

  constructor(private router: Router) {}

  getTagsArray(): string[] {
    return this.tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  addSuggestedRule(type: string) {
    const rules = {
      respect: 'Be respectful and courteous to all members.',
      ontopic: 'Keep discussions relevant to the forum topic.',
      nospam: 'No spam, self-promotion, or off-topic advertising.',
      privacy: 'Respect member privacy and confidentiality.'
    };

    const rule = rules[type as keyof typeof rules];
    if (rule) {
      if (this.forum.rules) {
        this.forum.rules += '\n\n' + rule;
      } else {
        this.forum.rules = rule;
      }
    }
  }

  createForum() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    
    // Simulate API call
    setTimeout(() => {
      const newForum = {
        ...this.forum,
        id: Date.now(),
        tags: this.getTagsArray(),
        createdAt: new Date(),
        memberCount: 1,
        postCount: this.forum.welcomePost ? 1 : 0,
        todayPosts: 0,
        weekPosts: 0
      };
      
      console.log('Creating forum:', newForum);
      
      // Navigate back to forums list
      this.router.navigate(['/social/community/forums']);
      
      this.isSubmitting = false;
    }, 2000);
  }
}