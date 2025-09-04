import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-connect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="account-connect-container">
      <div class="header">
        <h2>Connect Social Media Account</h2>
        <p>Connect your social media accounts to start sharing content</p>
      </div>

      <div class="platform-selection">
        <h3>Select Platform</h3>
        <div class="platform-grid">
          <div 
            *ngFor="let platform of platforms" 
            class="platform-card"
            [class.selected]="selectedPlatform === platform.id"
            (click)="selectPlatform(platform.id)"
          >
            <div class="platform-icon">
              <i [class]="platform.icon"></i>
            </div>
            <h4>{{ platform.name }}</h4>
            <p>{{ platform.description }}</p>
          </div>
        </div>
      </div>

      <div class="connection-form" *ngIf="selectedPlatform">
        <form [formGroup]="connectForm" (ngSubmit)="onConnect()">
          <div class="form-group">
            <label for="accountName">Account Name</label>
            <input 
              type="text" 
              id="accountName"
              formControlName="accountName"
              placeholder="Enter a name for this account"
            >
          </div>

          <div class="form-group">
            <label for="username">Username/Handle</label>
            <input 
              type="text" 
              id="username"
              formControlName="username"
              placeholder="@username"
            >
          </div>

          <div class="form-group">
            <label for="accessToken">Access Token</label>
            <input 
              type="password" 
              id="accessToken"
              formControlName="accessToken"
              placeholder="Enter access token"
            >
          </div>

          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                formControlName="autoPost"
              >
              Enable automatic posting
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="connectForm.invalid || isConnecting">
              {{ isConnecting ? 'Connecting...' : 'Connect Account' }}
            </button>
          </div>
        </form>
      </div>

      <div class="oauth-section" *ngIf="selectedPlatform">
        <div class="divider">
          <span>OR</span>
        </div>
        <button class="btn-oauth" (click)="connectWithOAuth()">
          <i class="fas fa-link"></i>
          Connect with {{ getSelectedPlatformName() }} OAuth
        </button>
      </div>
    </div>
  `,
  styles: [`
    .account-connect-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h2 {
      color: #333;
      margin-bottom: 0.5rem;
    }

    .header p {
      color: #666;
      font-size: 1.1rem;
    }

    .platform-selection h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .platform-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .platform-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .platform-card:hover {
      border-color: #007bff;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
    }

    .platform-card.selected {
      border-color: #007bff;
      background-color: #f8f9ff;
    }

    .platform-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #007bff;
    }

    .platform-card h4 {
      margin-bottom: 0.5rem;
      color: #333;
    }

    .platform-card p {
      color: #666;
      font-size: 0.9rem;
    }

    .connection-form {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
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

    .form-group input[type="text"],
    .form-group input[type="password"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-group input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn-primary, .btn-secondary, .btn-oauth {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-primary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .oauth-section {
      text-align: center;
    }

    .divider {
      position: relative;
      margin: 2rem 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background-color: #ddd;
    }

    .divider span {
      background-color: white;
      padding: 0 1rem;
      color: #666;
    }

    .btn-oauth {
      background-color: #28a745;
      color: white;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-oauth:hover {
      background-color: #218838;
    }
  `]
})
export class AccountConnectComponent implements OnInit {
  connectForm: FormGroup;
  selectedPlatform: string = '';
  isConnecting: boolean = false;

  platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Connect your Facebook page or profile',
      icon: 'fab fa-facebook'
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      description: 'Connect your Twitter/X account',
      icon: 'fab fa-twitter'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Connect your Instagram business account',
      icon: 'fab fa-instagram'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Connect your LinkedIn profile or company page',
      icon: 'fab fa-linkedin'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      description: 'Connect your YouTube channel',
      icon: 'fab fa-youtube'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      description: 'Connect your TikTok account',
      icon: 'fab fa-tiktok'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.connectForm = this.fb.group({
      accountName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required]],
      accessToken: ['', [Validators.required]],
      autoPost: [false]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  selectPlatform(platformId: string): void {
    this.selectedPlatform = platformId;
    // Reset form when platform changes
    this.connectForm.reset();
    this.connectForm.patchValue({ autoPost: false });
  }

  getSelectedPlatformName(): string {
    const platform = this.platforms.find(p => p.id === this.selectedPlatform);
    return platform ? platform.name : '';
  }

  onConnect(): void {
    if (this.connectForm.valid && this.selectedPlatform) {
      this.isConnecting = true;
      
      const formData = {
        ...this.connectForm.value,
        platform: this.selectedPlatform
      };

      // Simulate API call
      setTimeout(() => {
        console.log('Connecting account:', formData);
        this.isConnecting = false;
        // Navigate back to accounts list
        this.router.navigate(['/social/accounts']);
      }, 2000);
    }
  }

  connectWithOAuth(): void {
    if (this.selectedPlatform) {
      console.log('Initiating OAuth connection for:', this.selectedPlatform);
      // Implement OAuth flow
      // This would typically redirect to the platform's OAuth endpoint
    }
  }

  onCancel(): void {
    this.router.navigate(['/social/accounts']);
  }
}