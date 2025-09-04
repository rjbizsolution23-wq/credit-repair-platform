import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h4 class="card-title mb-0">Account Settings</h4>
              <p class="text-muted mb-0">Configure your social media account settings</p>
            </div>
            <div class="card-body">
              <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="accountName" class="form-label">Account Name</label>
                      <input
                        type="text"
                        class="form-control"
                        id="accountName"
                        formControlName="accountName"
                        placeholder="Enter account name"
                      >
                      <div *ngIf="settingsForm.get('accountName')?.invalid && settingsForm.get('accountName')?.touched" class="text-danger">
                        Account name is required
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="platform" class="form-label">Platform</label>
                      <select class="form-select" id="platform" formControlName="platform">
                        <option value="">Select Platform</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter</option>
                        <option value="instagram">Instagram</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="username" class="form-label">Username</label>
                      <input
                        type="text"
                        class="form-control"
                        id="username"
                        formControlName="username"
                        placeholder="Enter username"
                      >
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="status" class="form-label">Status</label>
                      <select class="form-select" id="status" formControlName="status">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="autoPost"
                      formControlName="autoPost"
                    >
                    <label class="form-check-label" for="autoPost">
                      Enable automatic posting
                    </label>
                  </div>
                </div>

                <div class="mb-3">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="notifications"
                      formControlName="notifications"
                    >
                    <label class="form-check-label" for="notifications">
                      Enable notifications
                    </label>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label">Description</label>
                  <textarea
                    class="form-control"
                    id="description"
                    rows="3"
                    formControlName="description"
                    placeholder="Enter account description"
                  ></textarea>
                </div>

                <div class="d-flex justify-content-between">
                  <button type="button" class="btn btn-secondary" (click)="goBack()">
                    <i class="fas fa-arrow-left me-2"></i>Back
                  </button>
                  <div>
                    <button type="button" class="btn btn-danger me-2" (click)="deleteAccount()">
                      <i class="fas fa-trash me-2"></i>Delete Account
                    </button>
                    <button type="submit" class="btn btn-primary" [disabled]="settingsForm.invalid">
                      <i class="fas fa-save me-2"></i>Save Settings
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border: 1px solid rgba(0, 0, 0, 0.125);
    }
    
    .form-control:focus,
    .form-select:focus {
      border-color: #86b7fe;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
    }
    
    .btn {
      border-radius: 0.375rem;
    }
    
    .text-danger {
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `]
})
export class AccountSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  accountId: string | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.settingsForm = this.fb.group({
      accountName: ['', Validators.required],
      platform: ['', Validators.required],
      username: [''],
      status: ['active'],
      autoPost: [false],
      notifications: [true],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id');
    if (this.accountId) {
      this.loadAccountSettings();
    }
  }

  loadAccountSettings(): void {
    this.loading = true;
    // Simulate loading account settings
    setTimeout(() => {
      const mockSettings = {
        accountName: 'My Social Account',
        platform: 'facebook',
        username: 'myusername',
        status: 'active',
        autoPost: true,
        notifications: true,
        description: 'This is my social media account for business purposes.'
      };
      
      this.settingsForm.patchValue(mockSettings);
      this.loading = false;
    }, 1000);
  }

  onSubmit(): void {
    if (this.settingsForm.valid) {
      this.loading = true;
      const formData = this.settingsForm.value;
      
      // Simulate API call
      setTimeout(() => {
        console.log('Account settings updated:', formData);
        this.loading = false;
        // Show success message or redirect
        alert('Account settings updated successfully!');
      }, 1000);
    }
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      this.loading = true;
      
      // Simulate API call
      setTimeout(() => {
        console.log('Account deleted:', this.accountId);
        this.loading = false;
        alert('Account deleted successfully!');
        this.router.navigate(['/social/accounts']);
      }, 1000);
    }
  }

  goBack(): void {
    this.router.navigate(['/social/accounts', this.accountId]);
  }
}