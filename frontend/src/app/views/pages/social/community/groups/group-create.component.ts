import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="create-group-container">
      <div class="header">
        <button class="btn btn-outline-secondary" [routerLink]="['/social/community/groups']">
          <i class="fas fa-arrow-left"></i> Back to Groups
        </button>
        <h1>Create New Group</h1>
        <p>Build a community around shared interests and goals</p>
      </div>

      <form [formGroup]="groupForm" (ngSubmit)="onSubmit()" class="group-form">
        <div class="form-section">
          <h2>Basic Information</h2>
          
          <div class="form-group">
            <label for="name">Group Name *</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name" 
              placeholder="Enter group name"
              [class.error]="groupForm.get('name')?.invalid && groupForm.get('name')?.touched">
            <div class="error-message" *ngIf="groupForm.get('name')?.invalid && groupForm.get('name')?.touched">
              <span *ngIf="groupForm.get('name')?.errors?.['required']">Group name is required</span>
              <span *ngIf="groupForm.get('name')?.errors?.['minlength']">Group name must be at least 3 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea 
              id="description" 
              formControlName="description" 
              placeholder="Describe what this group is about..."
              rows="4"
              [class.error]="groupForm.get('description')?.invalid && groupForm.get('description')?.touched"></textarea>
            <div class="error-message" *ngIf="groupForm.get('description')?.invalid && groupForm.get('description')?.touched">
              <span *ngIf="groupForm.get('description')?.errors?.['required']">Description is required</span>
              <span *ngIf="groupForm.get('description')?.errors?.['minlength']">Description must be at least 10 characters</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category *</label>
              <select id="category" formControlName="category">
                <option value="">Select a category</option>
                <option value="credit-education">Credit Education</option>
                <option value="financial-wellness">Financial Wellness</option>
                <option value="success-stories">Success Stories</option>
                <option value="general">General Discussion</option>
                <option value="support">Support & Motivation</option>
              </select>
              <div class="error-message" *ngIf="groupForm.get('category')?.invalid && groupForm.get('category')?.touched">
                <span *ngIf="groupForm.get('category')?.errors?.['required']">Please select a category</span>
              </div>
            </div>

            <div class="form-group">
              <label for="privacy">Privacy Setting *</label>
              <select id="privacy" formControlName="privacy">
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Approval required</option>
                <option value="secret">Secret - Invitation only</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Group Settings</h2>
          
          <div class="form-group">
            <label for="rules">Group Rules</label>
            <textarea 
              id="rules" 
              formControlName="rules" 
              placeholder="Set guidelines for group members..."
              rows="3"></textarea>
            <small class="form-text">Optional: Define rules and guidelines for your group</small>
          </div>

          <div class="form-group">
            <label for="tags">Tags</label>
            <input 
              type="text" 
              id="tags" 
              formControlName="tags" 
              placeholder="credit, repair, education, tips (comma separated)">
            <small class="form-text">Add tags to help people discover your group</small>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="allowMemberPosts">
              <span class="checkmark"></span>
              Allow members to create posts
            </label>
            
            <label class="checkbox-label">
              <input type="checkbox" formControlName="moderateContent">
              <span class="checkmark"></span>
              Moderate content before publishing
            </label>
            
            <label class="checkbox-label">
              <input type="checkbox" formControlName="emailNotifications">
              <span class="checkmark"></span>
              Send email notifications for new posts
            </label>
          </div>
        </div>

        <div class="form-section">
          <h2>Group Image</h2>
          
          <div class="image-upload">
            <div class="upload-area" (click)="fileInput.click()" [class.has-image]="selectedImage">
              <div class="upload-content" *ngIf="!selectedImage">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload group image</p>
                <small>Recommended: 400x400px, max 2MB</small>
              </div>
              <img [src]="selectedImage" *ngIf="selectedImage" alt="Group image preview">
            </div>
            <input #fileInput type="file" accept="image/*" (change)="onImageSelect($event)" style="display: none;">
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="removeImage()" *ngIf="selectedImage">
              Remove Image
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline-secondary" [routerLink]="['/social/community/groups']">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="groupForm.invalid || isSubmitting">
            <i class="fas fa-spinner fa-spin" *ngIf="isSubmitting"></i>
            {{ isSubmitting ? 'Creating...' : 'Create Group' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .create-group-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header button {
      position: absolute;
      left: 20px;
      top: 20px;
    }

    .header h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 28px;
    }

    .header p {
      color: #666;
      margin: 0;
    }

    .group-form {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .form-section {
      margin-bottom: 40px;
    }

    .form-section:last-of-type {
      margin-bottom: 0;
    }

    .form-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f8f9fa;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    input[type="text"],
    textarea,
    select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    input[type="text"]:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    input.error,
    textarea.error,
    select.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .form-text {
      color: #666;
      font-size: 12px;
      margin-top: 5px;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
      margin: 0;
    }

    .checkmark {
      position: relative;
    }

    .image-upload {
      margin-top: 10px;
    }

    .upload-area {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
      margin-bottom: 10px;
    }

    .upload-area:hover {
      border-color: #007bff;
    }

    .upload-area.has-image {
      padding: 0;
      border: none;
    }

    .upload-content i {
      font-size: 32px;
      color: #ccc;
      margin-bottom: 10px;
    }

    .upload-content p {
      margin: 0 0 5px 0;
      color: #333;
      font-weight: 500;
    }

    .upload-content small {
      color: #666;
    }

    .upload-area img {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
      object-fit: cover;
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
      padding: 10px 20px;
      border-radius: 6px;
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

    @media (max-width: 768px) {
      .create-group-container {
        padding: 10px;
      }
      
      .group-form {
        padding: 20px;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .header button {
        position: static;
        margin-bottom: 20px;
      }
      
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class GroupCreateComponent implements OnInit {
  groupForm: FormGroup;
  selectedImage: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      privacy: ['public', Validators.required],
      rules: [''],
      tags: [''],
      allowMemberPosts: [true],
      moderateContent: [false],
      emailNotifications: [true]
    });
  }

  ngOnInit() {
    // Component initialization
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
  }

  onSubmit() {
    if (this.groupForm.valid) {
      this.isSubmitting = true;
      
      const formData = {
        ...this.groupForm.value,
        image: this.selectedImage,
        createdAt: new Date(),
        memberCount: 1, // Creator is the first member
        postCount: 0
      };
      
      // Simulate API call
      setTimeout(() => {
        console.log('Creating group:', formData);
        this.isSubmitting = false;
        
        // Navigate back to groups list
        this.router.navigate(['/social/community/groups']);
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.groupForm.controls).forEach(key => {
        this.groupForm.get(key)?.markAsTouched();
      });
    }
  }
}