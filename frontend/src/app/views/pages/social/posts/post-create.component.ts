import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  file?: File;
  alt?: string;
  size: number;
  name: string;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  maxLength: number;
  supportsMedia: boolean;
  supportsScheduling: boolean;
}

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="post-create-container">
      <div class="header">
        <div class="header-content">
          <button class="btn-back" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="header-text">
            <h1>{{ isEditing ? 'Edit Post' : 'Create New Post' }}</h1>
            <p>{{ isEditing ? 'Update your social media post' : 'Create and schedule your social media content' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-outline" (click)="saveDraft()" [disabled]="isSaving">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button class="btn-primary" (click)="publishPost()" [disabled]="!postForm.valid || isSaving">
            <i class="fas fa-paper-plane"></i> 
            {{ isScheduled ? 'Schedule Post' : 'Publish Now' }}
          </button>
        </div>
      </div>

      <div class="content-wrapper">
        <div class="main-content">
          <form [formGroup]="postForm" class="post-form">
            <!-- Platform Selection -->
            <div class="form-section">
              <h3>Select Platforms</h3>
              <div class="platforms-grid">
                <div 
                  *ngFor="let platform of platforms" 
                  class="platform-card"
                  [class.selected]="isPlatformSelected(platform.id)"
                  [class.disabled]="!platform.enabled"
                  (click)="togglePlatform(platform.id)"
                >
                  <div class="platform-icon">
                    <i [class]="platform.icon"></i>
                  </div>
                  <div class="platform-info">
                    <span class="platform-name">{{ platform.name }}</span>
                    <span class="platform-limit">{{ platform.maxLength }} chars</span>
                  </div>
                  <div class="platform-status">
                    <i class="fas fa-check" *ngIf="isPlatformSelected(platform.id)"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Post Content -->
            <div class="form-section">
              <h3>Post Content</h3>
              <div class="form-group">
                <label for="title">Title</label>
                <input
                  type="text"
                  id="title"
                  formControlName="title"
                  placeholder="Enter post title..."
                  maxlength="100"
                >
                <div class="char-count">{{ postForm.get('title')?.value?.length || 0 }}/100</div>
              </div>
              
              <div class="form-group">
                <label for="content">Content</label>
                <textarea
                  id="content"
                  formControlName="content"
                  placeholder="What's on your mind?"
                  rows="6"
                  [maxlength]="getMaxContentLength()"
                  (input)="updateCharacterCount()"
                ></textarea>
                <div class="char-count">{{ contentLength }}/{{ getMaxContentLength() }}</div>
                <div class="content-preview" *ngIf="postForm.get('content')?.value">
                  <strong>Preview:</strong>
                  <p>{{ postForm.get('content')?.value }}</p>
                </div>
              </div>
            </div>

            <!-- Media Upload -->
            <div class="form-section">
              <h3>Media</h3>
              <div class="media-upload-area" (click)="triggerFileInput()" [class.has-files]="mediaFiles.length > 0">
                <input 
                  #fileInput 
                  type="file" 
                  multiple 
                  accept="image/*,video/*,.gif"
                  (change)="onFileSelected($event)"
                  style="display: none;"
                >
                <div class="upload-content" *ngIf="mediaFiles.length === 0">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Click to upload images, videos, or GIFs</p>
                  <span class="upload-hint">Supports JPG, PNG, MP4, GIF (Max 10MB each)</span>
                </div>
                
                <div class="media-grid" *ngIf="mediaFiles.length > 0">
                  <div *ngFor="let media of mediaFiles; let i = index" class="media-item">
                    <div class="media-preview">
                      <img *ngIf="media.type === 'image'" [src]="media.url" [alt]="media.alt || 'Media preview'">
                      <video *ngIf="media.type === 'video'" [src]="media.url" controls></video>
                      <div class="media-overlay">
                        <button type="button" class="btn-icon" (click)="editMedia(i, $event)">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-icon" (click)="removeMedia(i, $event)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div class="media-info">
                      <span class="media-name">{{ media.name }}</span>
                      <span class="media-size">{{ formatFileSize(media.size) }}</span>
                    </div>
                  </div>
                  
                  <div class="add-more-media" (click)="triggerFileInput($event)">
                    <i class="fas fa-plus"></i>
                    <span>Add More</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="form-section">
              <h3>Tags</h3>
              <div class="form-group">
                <label for="newTag">Add Tags</label>
                <div class="tag-input-container">
                  <input
                    type="text"
                    id="newTag"
                    [(ngModel)]="newTag"
                    placeholder="Enter tag and press Enter"
                    (keydown.enter)="addTag($event)"
                    [ngModelOptions]="{standalone: true}"
                  >
                  <button type="button" class="btn-add-tag" (click)="addTag()">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                
                <div class="tags-list" *ngIf="tags.length > 0">
                  <span *ngFor="let tag of tags; let i = index" class="tag">
                    #{{ tag }}
                    <button type="button" class="tag-remove" (click)="removeTag(i)">
                      <i class="fas fa-times"></i>
                    </button>
                  </span>
                </div>
                
                <div class="suggested-tags" *ngIf="suggestedTags.length > 0">
                  <span class="suggested-label">Suggested:</span>
                  <button 
                    *ngFor="let tag of suggestedTags" 
                    type="button" 
                    class="suggested-tag"
                    (click)="addSuggestedTag(tag)"
                  >
                    #{{ tag }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Scheduling -->
            <div class="form-section">
              <h3>Scheduling</h3>
              <div class="scheduling-options">
                <label class="radio-option">
                  <input 
                    type="radio" 
                    name="scheduling" 
                    value="now" 
                    [(ngModel)]="schedulingOption"
                    [ngModelOptions]="{standalone: true}"
                    (change)="updateScheduling()"
                  >
                  <span class="radio-label">
                    <i class="fas fa-paper-plane"></i>
                    Publish Now
                  </span>
                </label>
                
                <label class="radio-option">
                  <input 
                    type="radio" 
                    name="scheduling" 
                    value="schedule" 
                    [(ngModel)]="schedulingOption"
                    [ngModelOptions]="{standalone: true}"
                    (change)="updateScheduling()"
                  >
                  <span class="radio-label">
                    <i class="fas fa-clock"></i>
                    Schedule for Later
                  </span>
                </label>
              </div>
              
              <div class="schedule-inputs" *ngIf="schedulingOption === 'schedule'">
                <div class="form-row">
                  <div class="form-group">
                    <label for="scheduleDate">Date</label>
                    <input
                      type="date"
                      id="scheduleDate"
                      formControlName="scheduleDate"
                      [min]="getMinDate()"
                    >
                  </div>
                  <div class="form-group">
                    <label for="scheduleTime">Time</label>
                    <input
                      type="time"
                      id="scheduleTime"
                      formControlName="scheduleTime"
                    >
                  </div>
                </div>
                
                <div class="timezone-info">
                  <i class="fas fa-globe"></i>
                  <span>Timezone: {{ getCurrentTimezone() }}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
          <div class="preview-card">
            <h4>Post Preview</h4>
            <div class="preview-content">
              <div class="preview-platform" *ngFor="let platformId of selectedPlatforms">
                <div class="preview-header">
                  <i [class]="getPlatformIcon(platformId)"></i>
                  <span>{{ getPlatformName(platformId) }}</span>
                </div>
                <div class="preview-post">
                  <div class="preview-title" *ngIf="postForm.get('title')?.value">
                    {{ postForm.get('title')?.value }}
                  </div>
                  <div class="preview-text" *ngIf="postForm.get('content')?.value">
                    {{ postForm.get('content')?.value }}
                  </div>
                  <div class="preview-media" *ngIf="mediaFiles.length > 0">
                    <div class="preview-media-count">
                      <i class="fas fa-image"></i>
                      {{ mediaFiles.length }} {{ mediaFiles.length === 1 ? 'file' : 'files' }}
                    </div>
                  </div>
                  <div class="preview-tags" *ngIf="tags.length > 0">
                    <span *ngFor="let tag of tags.slice(0, 3)" class="preview-tag">#{{ tag }}</span>
                    <span *ngIf="tags.length > 3" class="preview-tag-more">+{{ tags.length - 3 }} more</span>
                  </div>
                </div>
              </div>
              
              <div class="preview-empty" *ngIf="selectedPlatforms.length === 0">
                <i class="fas fa-eye-slash"></i>
                <p>Select platforms to see preview</p>
              </div>
            </div>
          </div>

          <div class="tips-card">
            <h4>Tips for Better Engagement</h4>
            <ul class="tips-list">
              <li><i class="fas fa-lightbulb"></i> Use relevant hashtags to increase discoverability</li>
              <li><i class="fas fa-clock"></i> Post when your audience is most active</li>
              <li><i class="fas fa-image"></i> Include visuals to boost engagement</li>
              <li><i class="fas fa-question"></i> Ask questions to encourage comments</li>
              <li><i class="fas fa-heart"></i> Keep your tone authentic and engaging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .post-create-container {
      max-width: 1400px;
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

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-back {
      padding: 0.75rem;
      border: none;
      border-radius: 6px;
      background-color: #f8f9fa;
      color: #666;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-back:hover {
      background-color: #e9ecef;
      color: #333;
    }

    .header-text h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2rem;
    }

    .header-text p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
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

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
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

    .content-wrapper {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .main-content {
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

    .form-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
      font-size: 1.3rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
      position: relative;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    input, textarea, select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .char-count {
      position: absolute;
      top: 0.5rem;
      right: 0.75rem;
      font-size: 0.8rem;
      color: #666;
      background: white;
      padding: 0 0.25rem;
    }

    .content-preview {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      border-left: 3px solid #007bff;
    }

    .content-preview strong {
      color: #333;
      font-size: 0.9rem;
    }

    .content-preview p {
      margin: 0.5rem 0 0 0;
      color: #666;
      line-height: 1.4;
    }

    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .platform-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #eee;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .platform-card:hover:not(.disabled) {
      border-color: #007bff;
      background-color: #f8f9fa;
    }

    .platform-card.selected {
      border-color: #007bff;
      background-color: #e7f3ff;
    }

    .platform-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .platform-icon {
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

    .platform-info {
      flex: 1;
    }

    .platform-name {
      display: block;
      font-weight: 500;
      color: #333;
    }

    .platform-limit {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .platform-status {
      color: #007bff;
      font-size: 1.2rem;
    }

    .media-upload-area {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .media-upload-area:hover {
      border-color: #007bff;
      background-color: #f8f9fa;
    }

    .media-upload-area.has-files {
      padding: 1rem;
    }

    .upload-content {
      color: #666;
    }

    .upload-content i {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #ccc;
    }

    .upload-content p {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }

    .upload-hint {
      font-size: 0.9rem;
      color: #999;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .media-item {
      position: relative;
    }

    .media-preview {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background-color: #f8f9fa;
    }

    .media-preview img, .media-preview video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .media-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .media-preview:hover .media-overlay {
      opacity: 1;
    }

    .media-overlay .btn-icon {
      background: white;
      color: #333;
      padding: 0.5rem;
      border-radius: 50%;
    }

    .media-info {
      margin-top: 0.5rem;
      text-align: center;
    }

    .media-name {
      display: block;
      font-size: 0.8rem;
      color: #333;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .media-size {
      display: block;
      font-size: 0.7rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .add-more-media {
      aspect-ratio: 1;
      border: 2px dashed #ddd;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #666;
    }

    .add-more-media:hover {
      border-color: #007bff;
      color: #007bff;
      background-color: #f8f9fa;
    }

    .tag-input-container {
      display: flex;
      gap: 0.5rem;
    }

    .tag-input-container input {
      flex: 1;
    }

    .btn-add-tag {
      padding: 0.75rem 1rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .btn-add-tag:hover {
      background-color: #0056b3;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #007bff;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      font-size: 0.7rem;
    }

    .tag-remove:hover {
      color: #ccc;
    }

    .suggested-tags {
      margin-top: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .suggested-label {
      font-size: 0.9rem;
      color: #666;
      font-weight: 500;
    }

    .suggested-tag {
      background: none;
      border: 1px solid #ddd;
      color: #666;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .suggested-tag:hover {
      border-color: #007bff;
      color: #007bff;
    }

    .scheduling-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .radio-option:hover {
      border-color: #007bff;
      background-color: #f8f9fa;
    }

    .radio-option input[type="radio"] {
      width: auto;
      margin: 0;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .schedule-inputs {
      background-color: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .timezone-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      color: #666;
      font-size: 0.9rem;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .preview-card, .tips-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .preview-card h4, .tips-card h4 {
      margin: 0;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      color: #333;
      font-size: 1.2rem;
      border-bottom: 1px solid #eee;
    }

    .preview-content {
      padding: 1.5rem;
    }

    .preview-platform {
      margin-bottom: 1.5rem;
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-platform:last-child {
      margin-bottom: 0;
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background-color: #f8f9fa;
      border-bottom: 1px solid #eee;
      font-weight: 500;
      color: #333;
    }

    .preview-post {
      padding: 1rem;
    }

    .preview-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .preview-text {
      color: #666;
      line-height: 1.4;
      margin-bottom: 0.75rem;
    }

    .preview-media {
      margin-bottom: 0.75rem;
    }

    .preview-media-count {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background-color: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .preview-tag {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .preview-tag-more {
      background-color: #f8f9fa;
      color: #666;
      padding: 0.125rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
    }

    .preview-empty {
      text-align: center;
      color: #666;
      padding: 2rem;
    }

    .preview-empty i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #ccc;
    }

    .tips-list {
      list-style: none;
      padding: 0 1.5rem 1.5rem 1.5rem;
      margin: 0;
    }

    .tips-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .tips-list li:last-child {
      margin-bottom: 0;
    }

    .tips-list i {
      color: #007bff;
      margin-top: 0.1rem;
      flex-shrink: 0;
    }

    @media (max-width: 1024px) {
      .content-wrapper {
        grid-template-columns: 1fr;
      }

      .sidebar {
        order: -1;
      }
    }

    @media (max-width: 768px) {
      .post-create-container {
        padding: 1rem;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .header-actions {
        justify-content: center;
      }

      .platforms-grid {
        grid-template-columns: 1fr;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .media-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .scheduling-options {
        gap: 0.5rem;
      }
    }
  `]
})
export class PostCreateComponent implements OnInit {
  postForm: FormGroup;
  mediaFiles: MediaFile[] = [];
  tags: string[] = [];
  newTag: string = '';
  suggestedTags: string[] = ['marketing', 'socialmedia', 'business', 'tips', 'announcement'];
  selectedPlatforms: string[] = [];
  schedulingOption: 'now' | 'schedule' = 'now';
  contentLength: number = 0;
  isSaving: boolean = false;
  isEditing: boolean = false;
  isScheduled: boolean = false;

  platforms: SocialPlatform[] = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'fab fa-facebook',
      enabled: true,
      maxLength: 63206,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'fab fa-twitter',
      enabled: true,
      maxLength: 280,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'fab fa-instagram',
      enabled: true,
      maxLength: 2200,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'fab fa-linkedin',
      enabled: true,
      maxLength: 3000,
      supportsMedia: true,
      supportsScheduling: true
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'fab fa-youtube',
      enabled: false,
      maxLength: 5000,
      supportsMedia: true,
      supportsScheduling: true
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      content: ['', [Validators.required, Validators.maxLength(this.getMaxContentLength())]],
      scheduleDate: [''],
      scheduleTime: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['duplicate']) {
        this.loadPostForDuplication(params['duplicate']);
      }
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.loadPostForEditing(params['id']);
      }
    });

    this.updateCharacterCount();
  }

  loadPostForDuplication(postId: string): void {
    // Simulate loading post data for duplication
    console.log('Loading post for duplication:', postId);
  }

  loadPostForEditing(postId: string): void {
    // Simulate loading post data for editing
    console.log('Loading post for editing:', postId);
  }

  updateCharacterCount(): void {
    this.contentLength = this.postForm.get('content')?.value?.length || 0;
  }

  getMaxContentLength(): number {
    if (this.selectedPlatforms.length === 0) {
      return 280; // Default to Twitter's limit
    }
    
    const selectedPlatformLimits = this.selectedPlatforms.map(id => {
      const platform = this.platforms.find(p => p.id === id);
      return platform ? platform.maxLength : 280;
    });
    
    return Math.min(...selectedPlatformLimits);
  }

  isPlatformSelected(platformId: string): boolean {
    return this.selectedPlatforms.includes(platformId);
  }

  togglePlatform(platformId: string): void {
    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform || !platform.enabled) return;

    const index = this.selectedPlatforms.indexOf(platformId);
    if (index > -1) {
      this.selectedPlatforms.splice(index, 1);
    } else {
      this.selectedPlatforms.push(platformId);
    }

    // Update content max length validation
    const contentControl = this.postForm.get('content');
    if (contentControl) {
      contentControl.setValidators([
        Validators.required,
        Validators.maxLength(this.getMaxContentLength())
      ]);
      contentControl.updateValueAndValidity();
    }
  }

  triggerFileInput(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        if (this.validateFile(file)) {
          this.addMediaFile(file);
        }
      });
    }
  }

  validateFile(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];

    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      alert(`File ${file.name} is not a supported format.`);
      return false;
    }

    return true;
  }

  addMediaFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaFile: MediaFile = {
        id: Date.now().toString(),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: e.target?.result as string,
        file: file,
        size: file.size,
        name: file.name
      };
      this.mediaFiles.push(mediaFile);
    };
    reader.readAsDataURL(file);
  }

  editMedia(index: number, event: Event): void {
    event.stopPropagation();
    // Implement media editing logic
    console.log('Edit media at index:', index);
  }

  removeMedia(index: number, event: Event): void {
    event.stopPropagation();
    this.mediaFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  addTag(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    if (this.newTag.trim() && !this.tags.includes(this.newTag.trim())) {
      this.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  addSuggestedTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  updateScheduling(): void {
    this.isScheduled = this.schedulingOption === 'schedule';
    
    if (this.isScheduled) {
      this.postForm.get('scheduleDate')?.setValidators([Validators.required]);
      this.postForm.get('scheduleTime')?.setValidators([Validators.required]);
    } else {
      this.postForm.get('scheduleDate')?.clearValidators();
      this.postForm.get('scheduleTime')?.clearValidators();
    }
    
    this.postForm.get('scheduleDate')?.updateValueAndValidity();
    this.postForm.get('scheduleTime')?.updateValueAndValidity();
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  getPlatformIcon(platformId: string): string {
    const platform = this.platforms.find(p => p.id === platformId);
    return platform ? platform.icon : 'fas fa-globe';
  }

  getPlatformName(platformId: string): string {
    const platform = this.platforms.find(p => p.id === platformId);
    return platform ? platform.name : 'Unknown Platform';
  }

  saveDraft(): void {
    if (this.isSaving) return;
    
    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      console.log('Draft saved:', {
        ...this.postForm.value,
        platforms: this.selectedPlatforms,
        media: this.mediaFiles,
        tags: this.tags,
        status: 'draft'
      });
      
      this.isSaving = false;
      alert('Draft saved successfully!');
    }, 1000);
  }

  publishPost(): void {
    if (!this.postForm.valid || this.isSaving) return;
    
    if (this.selectedPlatforms.length === 0) {
      alert('Please select at least one platform.');
      return;
    }
    
    this.isSaving = true;
    
    // Simulate API call
    setTimeout(() => {
      const postData = {
        ...this.postForm.value,
        platforms: this.selectedPlatforms,
        media: this.mediaFiles,
        tags: this.tags,
        status: this.isScheduled ? 'scheduled' : 'published'
      };
      
      console.log('Post published:', postData);
      
      this.isSaving = false;
      alert(`Post ${this.isScheduled ? 'scheduled' : 'published'} successfully!`);
      this.router.navigate(['/social/posts']);
    }, 2000);
  }

  goBack(): void {
    this.router.navigate(['/social/posts']);
  }
}