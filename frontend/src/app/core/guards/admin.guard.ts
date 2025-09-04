import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, CanActivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        const user = authState.user;
        if (user && ['admin', 'super_admin'].includes(user.role)) {
          return true;
        } else {
          this.router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  }
}

// Functional guard export for standalone components
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.authState$.pipe(
    take(1),
    map(authState => {
      const user = authState.user;
      if (user && ['admin', 'super_admin'].includes(user.role)) {
        return true;
      } else {
        router.navigate(['/dashboard']);
        return false;
      }
    })
  );
};