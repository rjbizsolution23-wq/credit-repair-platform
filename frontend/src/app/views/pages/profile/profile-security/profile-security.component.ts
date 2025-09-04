import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="profile-security">
      <div class="page-header">
        <h1>Security Settings</h1>
        <p>Manage your account security and privacy settings</p>
      </div>

      <div class="security-sections">
        <!-- Password Section -->
        <div class="security-section">
          <div class="section-header">
            <h2>Change Password</h2>
            <p>Update your password to keep your account secure</p>
          </div>
          
          <form [formGroup]="passwordForm" (ngSubmit)="onPasswordSubmit()" class="security-form">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input 
                type="password" 
                id="currentPassword" 
                formControlName="currentPassword"
                class="form-control"
                placeholder="Enter your current password">
              <div class="error-message" *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">
                Current password is required
              </div>
            </div>

            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input 
                type="password" 
                id="newPassword" 
                formControlName="newPassword"
                class="form-control"
                placeholder="Enter your new password">
              <div class="error-message" *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">
                Password must be at least 8 characters long
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                formControlName="confirmPassword"
                class="form-control"
                placeholder="Confirm your new password">
              <div class="error-message" *ngIf="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched">
                Passwords do not match
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="passwordForm.invalid">
                Update Password
              </button>
            </div>
          </form>
        </div>

        <!-- Two-Factor Authentication Section -->
        <div class="security-section">
          <div class="section-header">
            <h2>Two-Factor Authentication</h2>
            <p>Add an extra layer of security to your account</p>
          </div>
          
          <div class="security-option">
            <div class="option-info">
              <h3>SMS Authentication</h3>
              <p>Receive verification codes via text message</p>
            </div>
            <div class="option-control">
              <label class="toggle-switch">
                <input type="checkbox" [checked]="smsEnabled" (change)="toggleSMS($event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="security-option">
            <div class="option-info">
              <h3>Authenticator App</h3>
              <p>Use an authenticator app like Google Authenticator</p>
            </div>
            <div class="option-control">
              <label class="toggle-switch">
                <input type="checkbox" [checked]="appEnabled" (change)="toggleApp($event)">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Login Activity Section -->
        <div class="security-section">
          <div class="section-header">
            <h2>Recent Login Activity</h2>
            <p>Monitor recent access to your account</p>
          </div>
          
          <div class="activity-list">
            <div class="activity-item" *ngFor="let activity of loginActivity">
              <div class="activity-icon">
                <i class="icon-device" [class]="activity.deviceIcon"></i>
              </div>
              <div class="activity-details">
                <div class="activity-device">{{ activity.device }}</div>
                <div class="activity-location">{{ activity.location }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
              <div class="activity-status" [class]="activity.status">
                {{ activity.status }}
              </div>
            </div>
          </div>
        </div>

        <!-- Privacy Settings Section -->
        <div class="security-section">
          <div class="section-header">
            <h2>Privacy Settings</h2>
            <p>Control how your information is used and shared</p>
          </div>
          
          <div class="privacy-options">
            <div class="privacy-option">
              <label class="checkbox-label">
                <input type="checkbox" [checked]="privacySettings.profileVisible" (change)="updatePrivacy('profileVisible', $event)">
                <span class="checkmark"></span>
                Make my profile visible to other users
              </label>
            </div>

            <div class="privacy-option">
              <label class="checkbox-label">
                <input type="checkbox" [checked]="privacySettings.emailVisible" (change)="updatePrivacy('emailVisible', $event)">
                <span class="checkmark"></span>
                Allow others to find me by email
              </label>
            </div>

            <div class="privacy-option">
              <label class="checkbox-label">
                <input type="checkbox" [checked]="privacySettings.activityVisible" (change)="updatePrivacy('activityVisible', $event)">
                <span class="checkmark"></span>
                Show my activity status
              </label>
            </div>
          </div>
        </div>

        <!-- Account Deletion Section -->
        <div class="security-section danger-section">
          <div class="section-header">
            <h2>Delete Account</h2>
            <p>Permanently delete your account and all associated data</p>
          </div>
          
          <div class="danger-zone">
            <p class="warning-text">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </p>
            <button class="btn btn-danger" (click)="showDeleteConfirmation = true">
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="showDeleteConfirmation" (click)="showDeleteConfirmation = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Confirm Account Deletion</h3>
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showDeleteConfirmation = false">
              Cancel
            </button>
            <button class="btn btn-danger" (click)="deleteAccount()">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-security {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 32px;
    }

    .page-header p {
      color: #6b7280;
      margin: 0;
    }

    .security-sections {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .security-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .danger-section {
      border: 2px solid #fecaca;
    }

    .section-header {
      padding: 24px 32px;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-header h2 {
      margin: 0 0 8px 0;
      color: #1f2937;
      font-size: 20px;
    }

    .section-header p {
      color: #6b7280;
      margin: 0;
    }

    .security-form {
      padding: 32px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #374151;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 4px;
    }

    .form-actions {
      margin-top: 24px;
    }

    .security-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      border-bottom: 1px solid #e5e7eb;
    }

    .security-option:last-child {
      border-bottom: none;
    }

    .option-info h3 {
      margin: 0 0 4px 0;
      color: #1f2937;
      font-size: 16px;
    }

    .option-info p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #3b82f6;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .activity-list {
      padding: 0 32px 32px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-details {
      flex: 1;
    }

    .activity-device {
      font-weight: 500;
      color: #1f2937;
    }

    .activity-location {
      color: #6b7280;
      font-size: 14px;
    }

    .activity-time {
      color: #9ca3af;
      font-size: 12px;
    }

    .activity-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .activity-status.current {
      background: #dcfce7;
      color: #166534;
    }

    .activity-status.recent {
      background: #fef3c7;
      color: #92400e;
    }

    .privacy-options {
      padding: 32px;
    }

    .privacy-option {
      margin-bottom: 16px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #3b82f6;
    }

    .danger-zone {
      padding: 32px;
    }

    .warning-text {
      color: #dc2626;
      margin-bottom: 16px;
      padding: 16px;
      background: #fef2f2;
      border-radius: 8px;
      border-left: 4px solid #dc2626;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-size: 16px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 2px solid #e5e7eb;
    }

    .btn-secondary:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover {
      background: #b91c1c;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 32px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
    }

    .modal-content h3 {
      margin: 0 0 16px 0;
      color: #1f2937;
    }

    .modal-content p {
      margin: 0 0 24px 0;
      color: #6b7280;
    }

    .modal-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
    }
  `]
})
export class ProfileSecurityComponent {
  passwordForm: FormGroup;
  smsEnabled = false;
  appEnabled = true;
  showDeleteConfirmation = false;
  
  privacySettings = {
    profileVisible: true,
    emailVisible: false,
    activityVisible: true
  };

  loginActivity = [
    {
      device: 'Chrome on Windows',
      location: 'New York, NY',
      time: '2 hours ago',
      status: 'current',
      deviceIcon: 'icon-desktop'
    },
    {
      device: 'Safari on iPhone',
      location: 'New York, NY',
      time: '1 day ago',
      status: 'recent',
      deviceIcon: 'icon-mobile'
    },
    {
      device: 'Firefox on Mac',
      location: 'Los Angeles, CA',
      time: '3 days ago',
      status: 'recent',
      deviceIcon: 'icon-desktop'
    }
  ];

  constructor(private fb: FormBuilder) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  onPasswordSubmit() {
    if (this.passwordForm.valid) {
      console.log('Password updated');
      // Handle password update
      this.passwordForm.reset();
    }
  }

  toggleSMS(event: any) {
    this.smsEnabled = event.target.checked;
    console.log('SMS 2FA:', this.smsEnabled);
  }

  toggleApp(event: any) {
    this.appEnabled = event.target.checked;
    console.log('App 2FA:', this.appEnabled);
  }

  updatePrivacy(setting: string, event: any) {
    (this.privacySettings as any)[setting] = event.target.checked;
    console.log('Privacy settings updated:', this.privacySettings);
  }

  deleteAccount() {
    console.log('Account deletion requested');
    this.showDeleteConfirmation = false;
    // Handle account deletion
  }
}