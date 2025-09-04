import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent implements OnInit {
  isAuthenticated$: Observable<boolean>;
  userRole: string | null = null;
  requiredPermissions: string[] = [];
  attemptedUrl: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit(): void {
    this.attemptedUrl = this.router.url;
    this.loadUserInfo();
    this.extractRequiredPermissions();
  }

  private loadUserInfo(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userRole = user.role;
    }
  }

  private extractRequiredPermissions(): void {
    // In a real application, you might extract this from route data or query params
    const urlSegments = this.attemptedUrl.split('/');
    
    // Map URL segments to required permissions
    const permissionMap: { [key: string]: string[] } = {
      'admin': ['admin_access', 'user_management'],
      'reports': ['view_reports', 'generate_reports'],
      'settings': ['manage_settings'],
      'billing': ['view_billing', 'manage_billing'],
      'analytics': ['view_analytics']
    };

    for (const segment of urlSegments) {
      if (permissionMap[segment]) {
        this.requiredPermissions = permissionMap[segment];
        break;
      }
    }
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.attemptedUrl }
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  requestAccess(): void {
    // In a real application, this would send a request to administrators
    console.log('Access request sent for:', {
      url: this.attemptedUrl,
      permissions: this.requiredPermissions,
      userRole: this.userRole
    });
    
    // For now, navigate to a contact or support page
    this.router.navigate(['/support'], {
      queryParams: {
        type: 'access_request',
        url: this.attemptedUrl,
        permissions: this.requiredPermissions.join(',')
      }
    });
  }

  contactSupport(): void {
    this.router.navigate(['/support'], {
      queryParams: {
        type: 'unauthorized_access',
        url: this.attemptedUrl
      }
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser() {
    return this.authService.getUser();
  }

  get hasRequiredPermissions(): boolean {
    if (this.requiredPermissions.length === 0) {
      return true;
    }
    
    return this.requiredPermissions.some(permission => 
      this.authService.hasPermission(permission)
    );
  }

  get accessDeniedReason(): string {
    if (!this.isLoggedIn) {
      return 'You need to log in to access this page.';
    }
    
    if (!this.hasRequiredPermissions) {
      return `Your current role (${this.userRole}) does not have the required permissions to access this page.`;
    }
    
    return 'Access to this resource is restricted.';
  }

  get suggestedActions(): Array<{label: string, action: string, icon: string, primary?: boolean}> {
    const actions = [];
    
    if (!this.isLoggedIn) {
      actions.push(
        { label: 'Log In', action: 'login', icon: 'fas fa-sign-in-alt', primary: true },
        { label: 'Go to Dashboard', action: 'home', icon: 'fas fa-home' }
      );
    } else {
      actions.push(
        { label: 'Go to Dashboard', action: 'home', icon: 'fas fa-home', primary: true },
        { label: 'Request Access', action: 'request', icon: 'fas fa-user-plus' },
        { label: 'Contact Support', action: 'support', icon: 'fas fa-life-ring' },
        { label: 'Log Out', action: 'logout', icon: 'fas fa-sign-out-alt' }
      );
    }
    
    return actions;
  }

  executeAction(action: string): void {
    switch (action) {
      case 'login':
        this.goToLogin();
        break;
      case 'home':
        this.goHome();
        break;
      case 'request':
        this.requestAccess();
        break;
      case 'support':
        this.contactSupport();
        break;
      case 'logout':
        this.logout();
        break;
      default:
        this.goBack();
    }
  }
}