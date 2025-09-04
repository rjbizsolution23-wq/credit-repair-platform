import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkRole(route);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkRole(childRoute);
  }

  private checkRole(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // Check if user is authenticated first
        if (!authState.isAuthenticated) {
          this.router.navigate(['/auth/login'], { replaceUrl: true });
          return false;
        }

        // Get required roles from route data
        const requiredRoles = route.data['roles'] as string[];
        
        if (!requiredRoles || requiredRoles.length === 0) {
          // No specific roles required
          return true;
        }

        // Check if user has any of the required roles
        const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
        
        if (!hasRequiredRole) {
          this.router.navigate(['/error/unauthorized'], { replaceUrl: true });
          return false;
        }

        return true;
      })
    );
  }
}