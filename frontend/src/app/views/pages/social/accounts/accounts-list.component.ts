import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

interface SocialAccount {
  id: string;
  name: string;
  platform: string;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  followers: number;
  lastSync: Date;
  autoPost: boolean;
  profileImage?: string;
}

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="accounts-container">
      <div class="header">
        <div class="title-section">
          <h1>Social Media Accounts</h1>
          <p>Manage your connected social media accounts</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="connectAccount()">
            <i class="fas fa-plus"></i>
            Connect Account
          </button>
          <button class="btn-secondary" (click)="syncAllAccounts()" [disabled]="isSyncing">
            <i class="fas fa-sync" [class.fa-spin]="isSyncing"></i>
            {{ isSyncing ? 'Syncing...' : 'Sync All' }}
          </button>
        </div>
      </div>

      <div class="filters-section">
        <form [formGroup]="filterForm">
          <div class="filter-group">
            <label for="platformFilter">Platform:</label>
            <select id="platformFilter" formControlName="platform" (change)="applyFilters()">
              <option value="">All Platforms</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter/X</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="statusFilter">Status:</label>
            <select id="statusFilter" formControlName="status" (change)="applyFilters()">
              <option value="">All Status</option>
              <option value="connected">Connected</option>
              <option value="disconnected">Disconnected</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div class="filter-group">
            <label for="searchFilter">Search:</label>
            <input 
              type="text" 
              id="searchFilter" 
              formControlName="search" 
              placeholder="Search accounts..."
              (input)="applyFilters()"
            >
          </div>
        </form>
      </div>

      <div class="accounts-grid" *ngIf="filteredAccounts.length > 0">
        <div 
          *ngFor="let account of filteredAccounts" 
          class="account-card"
          [class]="'status-' + account.status"
        >
          <div class="account-header">
            <div class="account-avatar">
              <img [src]="account.profileImage || '/assets/default-avatar.png'" [alt]="account.name">
              <div class="platform-badge">
                <i [class]="getPlatformIcon(account.platform)"></i>
              </div>
            </div>
            <div class="account-info">
              <h3>{{ account.name }}</h3>
              <p class="username">{{ account.username }}</p>
              <div class="status-badge" [class]="'status-' + account.status">
                <i [class]="getStatusIcon(account.status)"></i>
                {{ account.status | titlecase }}
              </div>
            </div>
            <div class="account-menu">
              <button class="menu-btn" (click)="toggleMenu(account.id)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div class="menu-dropdown" *ngIf="activeMenu === account.id">
                <button (click)="viewAccount(account.id)">View Details</button>
                <button (click)="editAccount(account.id)">Edit Settings</button>
                <button (click)="syncAccount(account.id)">Sync Now</button>
                <button class="danger" (click)="disconnectAccount(account.id)">Disconnect</button>
              </div>
            </div>
          </div>

          <div class="account-stats">
            <div class="stat">
              <span class="stat-value">{{ formatNumber(account.followers) }}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatDate(account.lastSync) }}</span>
              <span class="stat-label">Last Sync</span>
            </div>
          </div>

          <div class="account-settings">
            <div class="setting-item">
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  [checked]="account.autoPost" 
                  (change)="toggleAutoPost(account.id, $event)"
                >
                <span class="slider"></span>
              </label>
              <span>Auto-post enabled</span>
            </div>
          </div>

          <div class="account-actions">
            <button class="btn-outline" (click)="viewAccount(account.id)">
              <i class="fas fa-eye"></i>
              View
            </button>
            <button class="btn-outline" (click)="editAccount(account.id)">
              <i class="fas fa-cog"></i>
              Settings
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="filteredAccounts.length === 0 && !isLoading">
        <div class="empty-icon">
          <i class="fas fa-users"></i>
        </div>
        <h3>No accounts found</h3>
        <p *ngIf="hasFilters()">Try adjusting your filters or search terms.</p>
        <p *ngIf="!hasFilters()">Connect your first social media account to get started.</p>
        <button class="btn-primary" (click)="connectAccount()">
          <i class="fas fa-plus"></i>
          Connect Account
        </button>
      </div>

      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading accounts...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accounts-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .title-section h1 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .title-section p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary, .btn-outline {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .btn-secondary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
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

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .filters-section form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .filter-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .filter-group select,
    .filter-group input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .account-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border-left: 4px solid #e0e0e0;
    }

    .account-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .account-card.status-connected {
      border-left-color: #28a745;
    }

    .account-card.status-disconnected {
      border-left-color: #dc3545;
    }

    .account-card.status-error {
      border-left-color: #ffc107;
    }

    .account-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      position: relative;
    }

    .account-avatar {
      position: relative;
    }

    .account-avatar img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .platform-badge {
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
    }

    .account-info {
      flex: 1;
    }

    .account-info h3 {
      margin: 0 0 0.25rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .username {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.status-connected {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.status-disconnected {
      background-color: #f8d7da;
      color: #721c24;
    }

    .status-badge.status-error {
      background-color: #fff3cd;
      color: #856404;
    }

    .account-menu {
      position: relative;
    }

    .menu-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 4px;
    }

    .menu-btn:hover {
      background-color: #f8f9fa;
    }

    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10;
      min-width: 150px;
    }

    .menu-dropdown button {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      color: #333;
    }

    .menu-dropdown button:hover {
      background-color: #f8f9fa;
    }

    .menu-dropdown button.danger {
      color: #dc3545;
    }

    .menu-dropdown button.danger:hover {
      background-color: #f8d7da;
    }

    .account-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      padding: 1rem 0;
      border-top: 1px solid #eee;
      border-bottom: 1px solid #eee;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.2rem;
      font-weight: bold;
      color: #007bff;
    }

    .stat-label {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .account-settings {
      margin-bottom: 1rem;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      color: #333;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
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
      transition: 0.4s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #007bff;
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    .account-actions {
      display: flex;
      gap: 0.5rem;
    }

    .account-actions .btn-outline {
      flex: 1;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .empty-state, .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-icon, .loading-spinner {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #ccc;
    }

    .empty-state h3 {
      margin-bottom: 1rem;
      color: #333;
    }

    .empty-state p {
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-actions {
        flex-wrap: wrap;
        justify-content: center;
      }

      .filters-section form {
        grid-template-columns: 1fr;
      }

      .accounts-grid {
        grid-template-columns: 1fr;
      }

      .account-stats {
        justify-content: space-around;
      }
    }
  `]
})
export class AccountsListComponent implements OnInit {
  accounts: SocialAccount[] = [];
  filteredAccounts: SocialAccount[] = [];
  filterForm: FormGroup;
  activeMenu: string | null = null;
  isLoading: boolean = true;
  isSyncing: boolean = false;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      platform: [''],
      status: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    // Simulate API call
    setTimeout(() => {
      this.accounts = [
        {
          id: '1',
          name: 'My Business Facebook',
          platform: 'facebook',
          username: '@mybusiness',
          status: 'connected',
          followers: 15420,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          autoPost: true,
          profileImage: '/assets/default-avatar.png'
        },
        {
          id: '2',
          name: 'Company Twitter',
          platform: 'twitter',
          username: '@company',
          status: 'connected',
          followers: 8930,
          lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000),
          autoPost: false,
          profileImage: '/assets/default-avatar.png'
        },
        {
          id: '3',
          name: 'Instagram Business',
          platform: 'instagram',
          username: '@instabusiness',
          status: 'error',
          followers: 23100,
          lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
          autoPost: true,
          profileImage: '/assets/default-avatar.png'
        }
      ];
      this.filteredAccounts = [...this.accounts];
      this.isLoading = false;
    }, 1000);
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredAccounts = this.accounts.filter(account => {
      const matchesPlatform = !filters.platform || account.platform === filters.platform;
      const matchesStatus = !filters.status || account.status === filters.status;
      const matchesSearch = !filters.search || 
        account.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.username.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesPlatform && matchesStatus && matchesSearch;
    });
  }

  hasFilters(): boolean {
    const filters = this.filterForm.value;
    return !!(filters.platform || filters.status || filters.search);
  }

  getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      facebook: 'fab fa-facebook',
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      linkedin: 'fab fa-linkedin',
      youtube: 'fab fa-youtube',
      tiktok: 'fab fa-tiktok'
    };
    return icons[platform] || 'fas fa-globe';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      connected: 'fas fa-check-circle',
      disconnected: 'fas fa-times-circle',
      error: 'fas fa-exclamation-triangle'
    };
    return icons[status] || 'fas fa-question-circle';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  }

  connectAccount(): void {
    this.router.navigate(['/social/accounts/connect']);
  }

  viewAccount(id: string): void {
    this.activeMenu = null;
    this.router.navigate(['/social/accounts', id]);
  }

  editAccount(id: string): void {
    this.activeMenu = null;
    this.router.navigate(['/social/accounts', id, 'settings']);
  }

  syncAccount(id: string): void {
    this.activeMenu = null;
    console.log('Syncing account:', id);
    // Implement sync logic
  }

  syncAllAccounts(): void {
    this.isSyncing = true;
    // Simulate sync operation
    setTimeout(() => {
      this.isSyncing = false;
      // Update last sync times
      this.accounts.forEach(account => {
        account.lastSync = new Date();
      });
    }, 3000);
  }

  disconnectAccount(id: string): void {
    this.activeMenu = null;
    if (confirm('Are you sure you want to disconnect this account?')) {
      console.log('Disconnecting account:', id);
      // Implement disconnect logic
    }
  }

  toggleAutoPost(id: string, event: any): void {
    const account = this.accounts.find(a => a.id === id);
    if (account) {
      account.autoPost = event.target.checked;
      console.log('Auto-post toggled for account:', id, account.autoPost);
      // Implement API call to save setting
    }
  }

  toggleMenu(id: string): void {
    this.activeMenu = this.activeMenu === id ? null : id;
  }
}