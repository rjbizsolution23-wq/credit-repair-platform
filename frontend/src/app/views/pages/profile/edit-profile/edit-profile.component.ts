import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="edit-profile">
      <div class="page-header">
        <h1>Edit Profile</h1>
        <p>Update your personal information and preferences</p>
      </div>

      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
        <div class="form-section">
          <h2>Personal Information</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                formControlName="firstName"
                class="form-control"
                placeholder="Enter your first name">
              <div class="error-message" *ngIf="profileForm.get('firstName')?.invalid && profileForm.get('firstName')?.touched">
                First name is required
              </div>
            </div>
            
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                formControlName="lastName"
                class="form-control"
                placeholder="Enter your last name">
              <div class="error-message" *ngIf="profileForm.get('lastName')?.invalid && profileForm.get('lastName')?.touched">
                Last name is required
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              class="form-control"
              placeholder="Enter your email address">
            <div class="error-message" *ngIf="profileForm.get('email')?.invalid && profileForm.get('email')?.touched">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                formControlName="phone"
                class="form-control"
                placeholder="(555) 123-4567">
            </div>
            
            <div class="form-group">
              <label for="dateOfBirth">Date of Birth</label>
              <input 
                type="date" 
                id="dateOfBirth" 
                formControlName="dateOfBirth"
                class="form-control">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Address Information</h2>
          
          <div class="form-group">
            <label for="address">Street Address</label>
            <input 
              type="text" 
              id="address" 
              formControlName="address"
              class="form-control"
              placeholder="Enter your street address">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="city">City</label>
              <input 
                type="text" 
                id="city" 
                formControlName="city"
                class="form-control"
                placeholder="Enter your city">
            </div>
            
            <div class="form-group">
              <label for="state">State</label>
              <select id="state" formControlName="state" class="form-control">
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="CA">California</option>
                <option value="FL">Florida</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <!-- Add more states as needed -->
              </select>
            </div>
            
            <div class="form-group">
              <label for="zipCode">ZIP Code</label>
              <input 
                type="text" 
                id="zipCode" 
                formControlName="zipCode"
                class="form-control"
                placeholder="12345">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2>Profile Settings</h2>
          
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea 
              id="bio" 
              formControlName="bio"
              class="form-control"
              rows="4"
              placeholder="Tell us about yourself..."></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="emailNotifications">
              <span class="checkmark"></span>
              Receive email notifications
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="smsNotifications">
              <span class="checkmark"></span>
              Receive SMS notifications
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/profile">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .edit-profile {
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

    .profile-form {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .form-section {
      padding: 32px;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
    }

    .form-section h2 {
      margin: 0 0 24px 0;
      color: #1f2937;
      font-size: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-row.three-col {
      grid-template-columns: 1fr 1fr 1fr;
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

    .form-control.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 4px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #3b82f6;
    }

    .form-actions {
      padding: 24px 32px;
      background: #f9fafb;
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      border: none;
      font-size: 16px;
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

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EditProfileComponent {
  profileForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      dateOfBirth: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      bio: [''],
      emailNotifications: [true],
      smsNotifications: [false]
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      console.log('Profile updated:', this.profileForm.value);
      // Handle form submission
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }
}