import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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

interface Platform {
  id: string;
  name: string;
  icon: string;
  maxLength: number;
  supportsMedia: boolean;
  supportsScheduling: boolean;
}

@Component({
  selector: 'app-post-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="post-edit-container">
      <div class="header">
        <button class="btn-back" (click)="goBack()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        <h1>{{ isEditing ? 'Edit Post' : 'Create New Post' }}</h1>
        <div class="header-actions">
          <button class="btn-outline" (click)="saveDraft()" [disabled]="isSaving">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button class="btn-secondary" (click)="previewPost()">
            <i class="fas fa-eye"></i> Preview
          </button>
        </div>
      </div>

      <form [formGroup]="postForm" (ngSubmit)="onSubmit()" class="post-form">
        <div class="form-section">
          <div class="section-header">
            <h3>Basic Information</h3>
          </div>
          <div class="form-group">
            <label for="title">Post Title</label>
            <input
              type="text"
              id="title"
              formControlName="title"
              class="form-control"
              placeholder="Enter post title..."
            >
            <div class="error-message" *ngIf="postForm.get('title')?.invalid && postForm.get('title')?.touched">
              Title is required
            </div>
          </div>

          <div class="form-group">
            <label for="platform">Platform</label>
            <select id="platform" formControlName="platform" class="form-control" (change)="onPlatformChange()">
              <option value="">Select platform...</option>
              <option *ngFor="let platform of platforms" [value]="platform.id">
                {{ platform.name }}
              </option>
            </select>
            <div class="error-message" *ngIf="postForm.get('platform')?.invalid && postForm.get('platform')?.touched">
              Platform is required
            </div>
          </div>

          <div class="form-group">
            <label for="content">Content</label>
            <div class="content-editor">
              <textarea
                id="content"
                formControlName="content"
                class="form-control content-textarea"
                placeholder="Write your post content..."
                [maxlength]="selectedPlatform?.maxLength || 2000"
                (input)="updateCharacterCount()"
              ></textarea>
              <div class="character-count">
                <span [class.warning]="characterCount > (selectedPlatform?.maxLength || 2000) * 0.9">
                  {{ characterCount }} / {{ selectedPlatform?.maxLength || 2000 }}
                </span>
              </div>
            </div>
            <div class="error-message" *ngIf="postForm.get('content')?.invalid && postForm.get('content')?.touched">
              Content is required
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h3>Media</h3>
            <button type="button" class="btn-outline btn-sm" (click)="addMedia()" *ngIf="selectedPlatform?.supportsMedia">
              <i class="fas fa-plus"></i> Add Media
            </button>
          </div>
          <div class="media-list" *ngIf="mediaArray.length > 0">
            <div *ngFor="let media of mediaArray.controls; let i = index" class="media-item" [formGroupName]="i">
              <div class="media-preview">
                <img *ngIf="getMediaType(i) === 'image'" [src]="getMediaUrl(i)" alt="Media preview">
                <video *ngIf="getMediaType(i) === 'video'" [src]="getMediaUrl(i)" controls></video>
                <div class="media-placeholder" *ngIf="!getMediaUrl(i)">
                  <i class="fas fa-image"></i>
                  <span>No preview available</span>
                </div>
              </div>
              <div class="media-details">
                <div class="form-group">
                  <label>Media Type</label>
                  <select formControlName="type" class="form-control">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Media URL</label>
                  <input type="url" formControlName="url" class="form-control" placeholder="Enter media URL...">
                </div>
                <div class="form-group">
                  <label>Alt Text (Optional)</label>
                  <input type="text" formControlName="alt" class="form-control" placeholder="Describe the media...">
                </div>
                <button type="button" class="btn-danger btn-sm" (click)="removeMedia(i)">
                  <i class="fas fa-trash"></i> Remove
                </button>
              </div>
            </div>
          </div>
          <div class="no-media" *ngIf="mediaArray.length === 0 && selectedPlatform?.supportsMedia">
            <p>No media added yet. Click "Add Media" to include images or videos.</p>
          </div>
          <div class="no-media-support" *ngIf="!selectedPlatform?.supportsMedia && selectedPlatform">
            <p>{{ selectedPlatform.name }} doesn't support media attachments.</p>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h3>Tags</h3>
          </div>
          <div class="tags-input">
            <div class="tags-list">
              <span *ngFor="let tag of tags; let i = index" class="tag">
                #{{ tag }}
                <button type="button" class="tag-remove" (click)="removeTag(i)">
                  <i class="fas fa-times"></i>
                </button>
              </span>
            </div>
            <input
              type="text"
              class="tag-input"
              placeholder="Add tags..."
              (keydown.enter)="addTag($event)"
              (keydown.space)="addTag($event)"
              #tagInput
            >
          </div>
          <div class="tags-suggestions" *ngIf="suggestedTags.length > 0">
            <span class="suggestion-label">Suggested:</span>
            <button
              *ngFor="let tag of suggestedTags"
              type="button"
              class="tag-suggestion"
              (click)="addSuggestedTag(tag)"
            >
              #{{ tag }}
            </button>
          </div>
        </div>

        <div class="form-section" *ngIf="selectedPlatform?.supportsScheduling">
          <div class="section-header">
            <h3>Scheduling</h3>
          </div>
          <div class="scheduling-options">
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" name="scheduling" value="now" [(ngModel)]="schedulingOption" [ngModelOptions]="{standalone: true}">
                <span class="radio-label">Publish Now</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="scheduling" value="schedule" [(ngModel)]="schedulingOption" [ngModelOptions]="{standalone: true}">
                <span class="radio-label">Schedule for Later</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="scheduling" value="draft" [(ngModel)]="schedulingOption" [ngModelOptions]="{standalone: true}">
                <span class="radio-label">Save as Draft</span>
              </label>
            </div>
            <div class="schedule-datetime" *ngIf="schedulingOption === 'schedule'">
              <div class="form-group">
                <label for="scheduleDate">Schedule Date</label>
                <input
                  type="datetime-local"
                  id="scheduleDate"
                  formControlName="scheduledDate"
                  class="form-control"
                  [min]="minDateTime"
                >
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-outline" (click)="goBack()">
            Cancel
          </button>
          <button type="button" class="btn-secondary" (click)="saveDraft()" [disabled]="isSaving">
            <i class="fas fa-save"></i>
            {{ isSaving ? 'Saving...' : 'Save Draft' }}
          </button>
          <button type="submit" class="btn-primary" [disabled]="postForm.invalid || isSaving">
            <i class="fas fa-paper-plane"></i>
            {{ getSubmitButtonText() }}
          </button>
        </div>
      </form>
    </div>

    <div class="loading-state" *ngIf="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ isEditing ? 'Loading post...' : 'Preparing editor...' }}</p>
      </div>
    </div>

    <div class="preview-modal" *ngIf="showPreview" (click)="closePreview()">
      <div class="preview-content" (click)="$event.stopPropagation()">
        <div class="preview-header">
          <h3>Post Preview</h3>
          <button class="btn-close" (click)="closePreview()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="preview-body">
          <div class="preview-platform">
            <i [class]="getPlatformIcon(postForm.get('platform')?.value)"></i>
            {{ getPlatformName(postForm.get('platform')?.value) }}
          </div>
          <div class="preview-title">{{ postForm.get('title')?.value }}</div>
          <div class="preview-content-text">{{ postForm.get('content')?.value }}</div>
          <div class="preview-media" *ngIf="mediaArray.length > 0">
            <div *ngFor="let media of mediaArray.controls" class="preview-media-item">
              <img *ngIf="media.get('type')?.value === 'image'" [src]="media.get('url')?.value" alt="Preview">
              <video *ngIf="media.get('type')?.value === 'video'" [src]="media.get('url')?.value" controls></video>
            </div>
          </div>
          <div class="preview-tags" *ngIf="tags.length > 0">
            <span *ngFor="let tag of tags" class="preview-tag">#{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .post-edit-container {
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

    .header h1 {
      margin: 0;
      color: #333;
      font-size: 1.8rem;
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

    .btn-primary, .btn-secondary, .btn-outline, .btn-danger, .btn-close {
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

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
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

    .btn-close {
      background: none;
      color: #666;
      padding: 0.5rem;
      border-radius: 50%;
    }

    .btn-close:hover {
      background-color: #f8f9fa;
    }

    .post-form {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .form-section {
      padding: 2rem;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-child {
      border-bottom: none;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.3rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .content-editor {
      position: relative;
    }

    .content-textarea {
      min-height: 150px;
      resize: vertical;
      font-family: inherit;
    }

    .character-count {
      position: absolute;
      bottom: 0.5rem;
      right: 0.75rem;
      font-size: 0.8rem;
      color: #666;
      background: rgba(255,255,255,0.9);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .character-count .warning {
      color: #dc3545;
      font-weight: 500;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .media-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .media-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f8f9fa;
    }

    .media-preview {
      flex: 0 0 150px;
      height: 150px;
      border-radius: 4px;
      overflow: hidden;
      background-color: #eee;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .media-preview img, .media-preview video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .media-placeholder {
      text-align: center;
      color: #666;
    }

    .media-placeholder i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .media-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-media, .no-media-support {
      text-align: center;
      padding: 2rem;
      color: #666;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .tags-input {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0.5rem;
      min-height: 50px;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      background-color: #007bff;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
    }

    .tag-remove:hover {
      background-color: rgba(255,255,255,0.2);
    }

    .tag-input {
      border: none;
      outline: none;
      flex: 1;
      min-width: 100px;
      padding: 0.25rem;
      font-size: 1rem;
    }

    .tags-suggestions {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .suggestion-label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .tag-suggestion {
      background-color: #e9ecef;
      color: #495057;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .tag-suggestion:hover {
      background-color: #dee2e6;
    }

    .scheduling-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background-color 0.3s ease;
    }

    .radio-option:hover {
      background-color: #f8f9fa;
    }

    .radio-option input[type="radio"] {
      margin: 0;
    }

    .radio-label {
      font-weight: 500;
      color: #333;
    }

    .schedule-datetime {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 2rem;
      background-color: #f8f9fa;
      border-top: 1px solid #eee;
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .loading-spinner {
      font-size: 1.2rem;
    }

    .loading-spinner i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #007bff;
    }

    .preview-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .preview-content {
      background: white;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .preview-header h3 {
      margin: 0;
      color: #333;
    }

    .preview-body {
      padding: 1.5rem;
    }

    .preview-platform {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .preview-title {
      font-size: 1.3rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #333;
    }

    .preview-content-text {
      line-height: 1.6;
      margin-bottom: 1rem;
      white-space: pre-wrap;
      color: #555;
    }

    .preview-media {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .preview-media-item img, .preview-media-item video {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 4px;
    }

    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .preview-tag {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    @media (max-width: 768px) {
      .post-edit-container {
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

      .form-section {
        padding: 1.5rem;
      }

      .media-item {
        flex-direction: column;
      }

      .media-preview {
        flex: none;
        width: 100%;
        height: 200px;
      }

      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .preview-content {
        width: 95%;
        margin: 1rem;
      }
    }
  `]
})
export class PostEditComponent implements OnInit {
  postForm: FormGroup;
  post: SocialPost | null = null;
  isEditing: boolean = false;
  isLoading: boolean = true;
  isSaving: boolean = false;
  showPreview: boolean = false;
  characterCount: number = 0;
  schedulingOption: string = 'now';
  tags: string[] = [];
  suggestedTags: string[] = ['marketing', 'social', 'business', 'announcement', 'tips'];
  minDateTime: string = '';

  platforms: Platform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'fab fa-facebook',
      maxLength: 2000,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'fab fa-twitter',
      maxLength: 280,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'fab fa-instagram',
      maxLength: 2200,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'fab fa-linkedin',
      maxLength: 3000,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'fab fa-youtube',
      maxLength: 5000,
      supportsMedia: true,
      supportsScheduling: false
    }
  ];

  selectedPlatform: Platform | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.postForm = this.createForm();
    this.setMinDateTime();
  }

  ngOnInit(): void {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.isEditing = true;
      this.loadPost(postId);
    } else {
      this.isLoading = false;
      this.checkForDuplicateSource();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      platform: ['', Validators.required],
      scheduledDate: [''],
      media: this.fb.array([])
    });
  }

  get mediaArray(): FormArray {
    return this.postForm.get('media') as FormArray;
  }

  loadPost(id: string): void {
    // Simulate API call
    setTimeout(() => {
      this.post = {
        id: id,
        title: 'Exciting Product Launch Announcement',
        content: 'We are thrilled to announce the launch of our latest product! This innovative solution will revolutionize the way you manage your social media presence.',
        platform: 'facebook',
        status: 'draft',
        author: 'Marketing Team',
        tags: ['ProductLaunch', 'Innovation', 'SocialMedia'],
        engagement: {
          likes: 0,
          shares: 0,
          comments: 0,
          views: 0
        },
        media: [
          {
            type: 'image',
            url: '/assets/product-launch.jpg',
            alt: 'Product launch banner'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.populateForm();
      this.isLoading = false;
    }, 1000);
  }

  populateForm(): void {
    if (this.post) {
      this.postForm.patchValue({
        title: this.post.title,
        content: this.post.content,
        platform: this.post.platform,
        scheduledDate: this.post.scheduledDate ? this.formatDateForInput(this.post.scheduledDate) : ''
      });

      this.tags = [...this.post.tags];
      this.onPlatformChange();
      this.updateCharacterCount();

      // Populate media
      if (this.post.media) {
        this.post.media.forEach(media => {
          this.addMediaItem(media);
        });
      }
    }
  }

  checkForDuplicateSource(): void {
    const duplicateId = this.route.snapshot.queryParamMap.get('duplicate');
    if (duplicateId) {
      this.loadPost(duplicateId);
    }
  }

  onPlatformChange(): void {
    const platformId = this.postForm.get('platform')?.value;
    this.selectedPlatform = this.platforms.find(p => p.id === platformId) || null;
    this.updateCharacterCount();
  }

  updateCharacterCount(): void {
    const content = this.postForm.get('content')?.value || '';
    this.characterCount = content.length;
  }

  addMedia(): void {
    this.addMediaItem();
  }

  addMediaItem(media?: any): void {
    const mediaGroup = this.fb.group({
      type: [media?.type || 'image'],
      url: [media?.url || ''],
      alt: [media?.alt || '']
    });
    this.mediaArray.push(mediaGroup);
  }

  removeMedia(index: number): void {
    this.mediaArray.removeAt(index);
  }

  getMediaType(index: number): string {
    return this.mediaArray.at(index).get('type')?.value || 'image';
  }

  getMediaUrl(index: number): string {
    return this.mediaArray.at(index).get('url')?.value || '';
  }

  addTag(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    const input = keyboardEvent.target as HTMLInputElement;
    const tag = input.value.trim().toLowerCase();

    if ((keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') && tag && !this.tags.includes(tag)) {
      keyboardEvent.preventDefault();
      this.tags.push(tag);
      input.value = '';
      this.updateSuggestedTags();
    }
  }

  addSuggestedTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updateSuggestedTags();
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
    this.updateSuggestedTags();
  }

  updateSuggestedTags(): void {
    this.suggestedTags = this.suggestedTags.filter(tag => !this.tags.includes(tag));
  }

  setMinDateTime(): void {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
    this.minDateTime = this.formatDateForInput(now);
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getPlatformIcon(platformId: string): string {
    const platform = this.platforms.find(p => p.id === platformId);
    return platform?.icon || 'fas fa-globe';
  }

  getPlatformName(platformId: string): string {
    const platform = this.platforms.find(p => p.id === platformId);
    return platform?.name || 'Unknown Platform';
  }

  getSubmitButtonText(): string {
    if (this.schedulingOption === 'schedule') {
      return 'Schedule Post';
    } else if (this.schedulingOption === 'draft') {
      return 'Save Draft';
    } else {
      return 'Publish Now';
    }
  }

  previewPost(): void {
    this.showPreview = true;
  }

  closePreview(): void {
    this.showPreview = false;
  }

  saveDraft(): void {
    if (this.postForm.valid) {
      this.isSaving = true;
      const formData = this.prepareFormData('draft');
      
      // Simulate API call
      setTimeout(() => {
        console.log('Draft saved:', formData);
        this.isSaving = false;
        // Show success message
      }, 1000);
    }
  }

  onSubmit(): void {
    if (this.postForm.valid) {
      this.isSaving = true;
      const formData = this.prepareFormData(this.schedulingOption);
      
      // Simulate API call
      setTimeout(() => {
        console.log('Post submitted:', formData);
        this.isSaving = false;
        this.router.navigate(['/social/posts']);
      }, 1500);
    }
  }

  prepareFormData(status: string): any {
    const formValue = this.postForm.value;
    return {
      ...formValue,
      tags: this.tags,
      status: status,
      scheduledDate: status === 'schedule' ? new Date(formValue.scheduledDate) : null,
      id: this.post?.id || null
    };
  }

  goBack(): void {
    if (this.isEditing && this.post) {
      this.router.navigate(['/social/posts', this.post.id]);
    } else {
      this.router.navigate(['/social/posts']);
    }
  }
}