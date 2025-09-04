import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'client';
  permissions: string[];
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  password: string;
}

export interface ValidateResetTokenResponse {
  valid: boolean;
  message?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly userKey = 'auth_user';
  private readonly rememberMeKey = 'remember_me';

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  public authState$ = this.authStateSubject.asObservable();
  public isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  private refreshTokenTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state - Auto-login enabled (no authentication required)
   */
  private initializeAuth(): void {
    // Auto-login with default user - bypassing login requirement
    const defaultUser: User = {
      id: '1',
      email: 'admin@rickjeffersonsolutions.com',
      firstName: 'Rick',
      lastName: 'Jefferson',
      role: 'admin',
      permissions: ['*'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const defaultToken = 'auto-generated-token-' + Date.now();
    const defaultRefreshToken = 'auto-generated-refresh-token-' + Date.now();
    
    // Store the auto-generated authentication using the storeAuth method
    const mockResponse: LoginResponse = {
      token: defaultToken,
      refreshToken: defaultRefreshToken,
      user: defaultUser,
      expiresIn: 3600
    };
    
    this.storeAuth(mockResponse, true);
    
    // Update the authentication state
    this.updateAuthState({
      isAuthenticated: true,
      user: defaultUser,
      token: defaultToken,
      loading: false,
      error: null
    });
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.updateAuthState({ ...this.authStateSubject.value, loading: true, error: null });

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleLoginSuccess(response, credentials.rememberMe);
        }),
        catchError(error => {
          this.handleAuthError(error);
          return throwError(error);
        })
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<LoginResponse> {
    this.updateAuthState({ ...this.authStateSubject.value, loading: true, error: null });

    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          this.handleLoginSuccess(response, false);
        }),
        catchError(error => {
          this.handleAuthError(error);
          return throwError(error);
        })
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    const token = this.getStoredToken();
    
    // Clear local state immediately
    this.clearAuth();

    // Notify server (optional, continue even if it fails)
    if (token) {
      return this.http.post(`${this.apiUrl}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).pipe(
        catchError(() => {
          // Ignore logout errors, user is already logged out locally
          return [];
        })
      );
    }

    return new Observable(observer => {
      observer.next();
      observer.complete();
    });
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getStoredRefreshToken();
    
    if (!refreshToken) {
      this.clearAuth();
      return throwError('No refresh token available');
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.handleLoginSuccess(response, this.getRememberMe());
        }),
        catchError(error => {
          this.clearAuth();
          return throwError(error);
        })
      );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(request: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Validate reset password token
   */
  validateResetToken(token: string): Observable<ValidateResetTokenResponse> {
    return this.http.post<ValidateResetTokenResponse>(`${this.apiUrl}/reset-password/validate`, {
      token
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reset password with token
   */
  resetPassword(request: ResetPasswordConfirmRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/confirm`, {
      token: request.token,
      newPassword: request.password
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Change password for authenticated user
   */
  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData)
      .pipe(
        tap(user => {
          this.updateAuthState({
            ...this.authStateSubject.value,
            user
          });
          this.storeUser(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get current user
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
      .pipe(
        tap(user => {
          this.updateAuthState({
            ...this.authStateSubject.value,
            user
          });
          this.storeUser(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.authStateSubject.value.user;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.authStateSubject.value.token;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(response: LoginResponse, rememberMe: boolean = false): void {
    this.storeAuth(response, rememberMe);
    this.updateAuthState({
      isAuthenticated: true,
      user: response.user,
      token: response.token,
      loading: false,
      error: null
    });
    this.startRefreshTokenTimer();
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: HttpErrorResponse): void {
    let errorMessage = 'An error occurred during authentication';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Invalid credentials';
    } else if (error.status === 403) {
      errorMessage = 'Access denied';
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    }

    this.updateAuthState({
      ...this.authStateSubject.value,
      loading: false,
      error: errorMessage
    });
  }

  /**
   * Generic error handler
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    }

    return throwError(errorMessage);
  }

  /**
   * Clear authentication state
   */
  private clearAuth(): void {
    this.clearStoredAuth();
    this.stopRefreshTokenTimer();
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    });
    this.router.navigate(['/auth/login']);
  }

  /**
   * Update authentication state
   */
  private updateAuthState(state: AuthState): void {
    this.authStateSubject.next(state);
  }

  /**
   * Store authentication data
   */
  private storeAuth(response: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem(this.tokenKey, response.token);
    storage.setItem(this.refreshTokenKey, response.refreshToken);
    storage.setItem(this.userKey, JSON.stringify(response.user));
    localStorage.setItem(this.rememberMeKey, rememberMe.toString());
  }

  /**
   * Store user data
   */
  private storeUser(user: User): void {
    const rememberMe = this.getRememberMe();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Get stored token
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  }

  /**
   * Get stored refresh token
   */
  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey) || sessionStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Get stored user
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.userKey) || sessionStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get remember me preference
   */
  private getRememberMe(): boolean {
    return localStorage.getItem(this.rememberMeKey) === 'true';
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.rememberMeKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.userKey);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Start refresh token timer
   */
  private startRefreshTokenTimer(): void {
    const token = this.getStoredToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();
      const refreshTime = expiresIn - (5 * 60 * 1000); // Refresh 5 minutes before expiry

      if (refreshTime > 0) {
        this.refreshTokenTimer = timer(refreshTime).subscribe(() => {
          this.refreshToken().subscribe({
            error: () => this.clearAuth()
          });
        });
      } else {
        // Token is about to expire or already expired
        this.refreshToken().subscribe({
          error: () => this.clearAuth()
        });
      }
    } catch {
      this.clearAuth();
    }
  }

  /**
   * Stop refresh token timer
   */
  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimer) {
      this.refreshTokenTimer.unsubscribe();
      this.refreshTokenTimer = null;
    }
  }



  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Get current user role
   */
  getCurrentUserRole(): string | null {
    return this.authStateSubject.value.user?.role || null;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if current user is client
   */
  isClient(): boolean {
    return this.hasRole('client');
  }

  /**
   * Clean up on service destroy
   */
  ngOnDestroy(): void {
    this.stopRefreshTokenTimer();
  }
}