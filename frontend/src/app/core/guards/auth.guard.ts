import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, CanLoad, Router, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment, CanActivateFn, CanActivateChildFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

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
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url, route.data);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(state.url, childRoute.data);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url = segments.map(segment => segment.path).join('/');
    return this.checkAuth(`/${url}`, route.data);
  }

  private checkAuth(url: string, routeData: any = {}): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // Check if user is authenticated
        if (!authState.isAuthenticated) {
          this.redirectToLogin(url);
          return false;
        }

        // Check role requirements
        if (routeData.roles && routeData.roles.length > 0) {
          if (!this.authService.hasAnyRole(routeData.roles)) {
            this.redirectToUnauthorized();
            return false;
          }
        }

        // Check permission requirements
        if (routeData.permissions && routeData.permissions.length > 0) {
          const hasAllPermissions = routeData.permissions.every((permission: string) => 
            this.authService.hasPermission(permission)
          );
          
          if (!hasAllPermissions) {
            this.redirectToUnauthorized();
            return false;
          }
        }

        return true;
      }),
      catchError(() => {
        this.redirectToLogin(url);
        return of(false);
      })
    );
  }

  private redirectToLogin(returnUrl: string): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl },
      replaceUrl: true
    });
  }

  private redirectToUnauthorized(): void {
    this.router.navigate(['/unauthorized'], {
      replaceUrl: true
    });
  }
}

// Functional guard exports for standalone components
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.authState$.pipe(
    take(1),
    map(authState => {
      if (!authState.isAuthenticated) {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
          replaceUrl: true
        });
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
        replaceUrl: true
      });
      return of(false);
    })
  );
};

export const authChildGuard: CanActivateChildFn = (childRoute, state) => {
  return authGuard(childRoute, state);
};
