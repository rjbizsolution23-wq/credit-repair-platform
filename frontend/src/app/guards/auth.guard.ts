import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// Authentication Guard for Rick Jefferson Solutions
// Protects routes based on authentication status and role-based permissions
// Implements comprehensive access control for credit repair platform

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAccess(route, state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAccess(childRoute, state.url);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkAccess(route, `/${url}`);
  }

  private checkAccess(route: ActivatedRouteSnapshot | Route, url: string): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.handleUnauthorized(url);
          return false;
        }

        // Check role-based access
        const requiredRoles = this.getRequiredRoles(route);
        const requiredPermissions = this.getRequiredPermissions(route);
        const requiredResource = this.getRequiredResource(route);
        const requiredAction = this.getRequiredAction(route);

        // If no specific requirements, allow access for authenticated users
        if (!requiredRoles && !requiredPermissions && !requiredResource) {
          return true;
        }

        // Check role requirements
        if (requiredRoles && !this.authService.hasRole(requiredRoles)) {
          this.handleForbidden(url);
          return false;
        }

        // Check permission requirements
        if (requiredPermissions) {
          const hasAllPermissions = requiredPermissions.every(permission => 
            this.authService.hasPermission(permission)
          );
          if (!hasAllPermissions) {
            this.handleForbidden(url);
            return false;
          }
        }

        // Check resource-action requirements
        if (requiredResource && requiredAction) {
          if (!this.authService.canAccess(requiredResource, requiredAction)) {
            this.handleForbidden(url);
            return false;
          }
        }

        return true;
      }),
      catchError(() => {
        this.handleUnauthorized(url);
        return of(false);
      })
    );
  }

  private getRequiredRoles(route: ActivatedRouteSnapshot | Route): string[] | null {
    return route.data?.['roles'] || null;
  }

  private getRequiredPermissions(route: ActivatedRouteSnapshot | Route): string[] | null {
    return route.data?.['permissions'] || null;
  }

  private getRequiredResource(route: ActivatedRouteSnapshot | Route): string | null {
    return route.data?.['resource'] || null;
  }

  private getRequiredAction(route: ActivatedRouteSnapshot | Route): string | null {
    return route.data?.['action'] || null;
  }

  private handleUnauthorized(attemptedUrl: string): void {
    // Store the attempted URL for redirect after login
    sessionStorage.setItem('rjs_redirect_url', attemptedUrl);
    this.router.navigate(['/login']);
  }

  private handleForbidden(attemptedUrl: string): void {
    console.warn(`Access denied to ${attemptedUrl}`);
    this.router.navigate(['/unauthorized']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        const allowedRoles = route.data['roles'] as string[];
        if (!allowedRoles || allowedRoles.length === 0) {
          return true;
        }

        const hasRole = allowedRoles.includes(user.role);
        if (!hasRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        const requiredPermissions = route.data['permissions'] as string[];
        if (!requiredPermissions || requiredPermissions.length === 0) {
          return true;
        }

        const hasAllPermissions = requiredPermissions.every(permission => 
          this.authService.hasPermission(permission)
        );

        if (!hasAllPermissions) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

// Specific guards for Rick Jefferson Solutions roles
@Injectable({
  providedIn: 'root'
})
export class ClientGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        if (user.role !== 'client') {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // Additional client-specific checks
        if (user.status !== 'active') {
          this.router.navigate(['/account-suspended']);
          return false;
        }

        if (!user.emailVerified) {
          this.router.navigate(['/verify-email']);
          return false;
        }

        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class CROGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        if (!['cro', 'admin', 'super_admin'].includes(user.role)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // Additional CRO-specific checks
        if (user.status !== 'active') {
          this.router.navigate(['/account-suspended']);
          return false;
        }

        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        if (!['admin', 'super_admin'].includes(user.role)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        if (user.role !== 'super_admin') {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

// Email verification guard
@Injectable({
  providedIn: 'root'
})
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        if (!user.emailVerified) {
          this.router.navigate(['/verify-email']);
          return false;
        }

        return true;
      })
    );
  }
}

// Account status guard
@Injectable({
  providedIn: 'root'
})
export class ActiveAccountGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        switch (user.status) {
          case 'active':
            return true;
          case 'suspended':
            this.router.navigate(['/account-suspended']);
            return false;
          case 'inactive':
            this.router.navigate(['/account-inactive']);
            return false;
          case 'pending_verification':
            this.router.navigate(['/verify-email']);
            return false;
          default:
            this.router.navigate(['/account-status']);
            return false;
        }
      })
    );
  }
}

// Subscription guard for clients
@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Paywall disabled - always allow access
    return of(true);
  }
}

// Rick Jefferson Solutions - Authentication Guards
// Comprehensive route protection with role-based access control
// Implements security layers for credit repair platform
// Ensures proper authorization for all user types