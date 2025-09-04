import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for certain URLs
    if (this.shouldSkipAuth(request.url)) {
      return next.handle(request);
    }

    // Add auth token to request
    const authRequest = this.addAuthToken(request);

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 errors (unauthorized)
        if (error.status === 401 && !this.isAuthUrl(request.url)) {
          return this.handle401Error(authRequest, next);
        }

        // Handle 403 errors (forbidden)
        if (error.status === 403) {
          this.authService.logout().subscribe();
        }

        return throwError(error);
      })
    );
  }

  /**
   * Add authentication token to request headers
   */
  private addAuthToken(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return request;
  }

  /**
   * Handle 401 unauthorized errors
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.token);
          
          // Retry the original request with new token
          const newAuthRequest = this.addAuthToken(request);
          return next.handle(newAuthRequest);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout().subscribe();
          return throwError(error);
        })
      );
    } else {
      // Wait for token refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => {
          const newAuthRequest = this.addAuthToken(request);
          return next.handle(newAuthRequest);
        })
      );
    }
  }

  /**
   * Check if request URL should skip authentication
   */
  private shouldSkipAuth(url: string): boolean {
    const skipUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/reset-password',
      '/auth/refresh',
      '/public'
    ];

    return skipUrls.some(skipUrl => url.includes(skipUrl)) || 
           !url.startsWith(environment.apiUrl);
  }

  /**
   * Check if URL is an authentication endpoint
   */
  private isAuthUrl(url: string): boolean {
    const authUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/reset-password',
      '/auth/refresh'
    ];

    return authUrls.some(authUrl => url.includes(authUrl));
  }
}