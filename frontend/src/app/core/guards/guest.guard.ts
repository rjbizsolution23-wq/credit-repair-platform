import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.authState$.pipe(
      take(1),
      map(authState => {
        // If user is already authenticated, redirect to dashboard
        if (authState.isAuthenticated) {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
          return false;
        }
        
        // Allow access to guest routes (login, register, etc.)
        return true;
      })
    );
  }
}