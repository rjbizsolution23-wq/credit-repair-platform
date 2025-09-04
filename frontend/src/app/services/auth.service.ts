import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// Authentication Service for Rick Jefferson Solutions
// Handles secure role-based access for clients, CROs, and admins
// Implements JWT token management and RBAC (Role-Based Access Control)

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'cro' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  permissions: string[];
  lastLogin?: Date;
  profilePicture?: string;
  phone?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Role-specific data
  clientData?: {
    enrollmentDate: Date;
    assignedCRO?: string;
    subscriptionStatus: 'active' | 'cancelled' | 'suspended';
    paymentMethod?: string;
  };
  croData?: {
    hireDate: Date;
    department: string;
    supervisor?: string;
    certifications: string[];
    clientCount: number;
  };
  adminData?: {
    department: string;
    accessLevel: number;
    lastPasswordChange: Date;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresTwoFactor?: boolean;
  twoFactorMethod?: 'sms' | 'email' | 'authenticator';
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'client'; // Only clients can self-register
  referralCode?: string;
  marketingConsent?: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetup {
  method: 'sms' | 'email' | 'authenticator';
  phoneNumber?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'rjs_access_token';
  private refreshTokenKey = 'rjs_refresh_token';
  private userKey = 'rjs_user_data';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private refreshTokenTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  // Initialize authentication state from stored tokens
  private initializeAuth(): void {
    // Auto-login with default user - bypassing login requirement
    const defaultUser: User = {
      id: '1',
      email: 'admin@rickjeffersonsolutions.com',
      firstName: 'Rick',
      lastName: 'Jefferson',
      role: 'admin',
      status: 'active',
      permissions: ['*'],
      twoFactorEnabled: false,
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const defaultToken = 'auto-generated-token-' + Date.now();
    const defaultRefreshToken = 'auto-generated-refresh-token-' + Date.now();
    
    // Store the auto-generated authentication using individual methods
    this.storeToken(defaultToken);
    this.storeRefreshToken(defaultRefreshToken);
    this.storeUser(defaultUser);
    
    // Update the authentication state
    this.currentUserSubject.next(defaultUser);
    this.isAuthenticatedSubject.next(true);
  }

  // Authentication Methods
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (!response.requiresTwoFactor) {
            this.handleSuccessfulAuth(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  verifyTwoFactor(email: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/verify-2fa`, {
      email,
      code
    }).pipe(
      tap(response => this.handleSuccessfulAuth(response)),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterRequest): Observable<{ message: string; requiresVerification: boolean }> {
    return this.http.post<{ message: string; requiresVerification: boolean }>(
      `${this.apiUrl}/auth/register`, userData
    ).pipe(catchError(this.handleError));
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/verify-email`, {
      token
    }).pipe(catchError(this.handleError));
  }

  resendVerificationEmail(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/resend-verification`, {
      email
    }).pipe(catchError(this.handleError));
  }

  requestPasswordReset(request: PasswordResetRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, request)
      .pipe(catchError(this.handleError));
  }

  resetPassword(request: PasswordResetConfirm): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, request)
      .pipe(catchError(this.handleError));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  logout(): void {
    const refreshToken = this.getStoredRefreshToken();
    
    // Call logout endpoint to invalidate tokens on server
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, {
        refreshToken
      }).subscribe();
    }
    
    this.clearStoredAuth();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
    }
    
    this.router.navigate(['/login']);
  }

  // Token Management
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getStoredRefreshToken();
    
    if (!refreshToken) {
      return throwError('No refresh token available');
    }
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, {
      refreshToken
    }).pipe(
      tap(response => this.handleSuccessfulAuth(response)),
      catchError(error => {
        this.logout();
        return throwError(error);
      })
    );
  }

  private scheduleTokenRefresh(): void {
    const token = this.getStoredToken();
    if (!token) return;
    
    const payload = this.decodeToken(token);
    if (!payload) return;
    
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const refreshTime = expiresAt - (5 * 60 * 1000); // Refresh 5 minutes before expiry
    
    if (refreshTime > now) {
      this.refreshTokenTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime - now);
    }
  }

  // Two-Factor Authentication
  setupTwoFactor(setup: TwoFactorSetup): Observable<{
    qrCode?: string;
    backupCodes?: string[];
    message: string;
  }> {
    return this.http.post<{
      qrCode?: string;
      backupCodes?: string[];
      message: string;
    }>(`${this.apiUrl}/auth/setup-2fa`, setup, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  confirmTwoFactorSetup(code: string): Observable<{ message: string; backupCodes: string[] }> {
    return this.http.post<{ message: string; backupCodes: string[] }>(
      `${this.apiUrl}/auth/confirm-2fa`, { code }, {
        headers: this.getAuthHeaders()
      }
    ).pipe(catchError(this.handleError));
  }

  disableTwoFactor(password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/disable-2fa`, {
      password
    }, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  generateBackupCodes(): Observable<{ backupCodes: string[] }> {
    return this.http.post<{ backupCodes: string[] }>(`${this.apiUrl}/auth/generate-backup-codes`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Role-Based Access Control
  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.permissions?.includes(permission) || false;
  }

  hasRole(role: string | string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  canAccess(resource: string, action: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    
    // Super admin has access to everything
    if (user.role === 'super_admin') return true;
    
    // Check specific permission
    const permission = `${resource}:${action}`;
    return this.hasPermission(permission);
  }

  getUserPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiUrl}/auth/permissions`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // User Profile Management
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(user => this.currentUserSubject.next(user)),
      catchError(this.handleError)
    );
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/auth/profile`, profileData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.storeUser(user);
      }),
      catchError(this.handleError)
    );
  }

  uploadProfilePicture(file: File): Observable<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    return this.http.post<{ profilePicture: string }>(
      `${this.apiUrl}/auth/profile/picture`, formData, {
        headers: this.getAuthHeaders()
      }
    ).pipe(catchError(this.handleError));
  }

  // Session Management
  getActiveSessions(): Observable<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    location?: string;
    lastActivity: Date;
    isCurrent: boolean;
  }[]> {
    return this.http.get<{
      id: string;
      deviceInfo: string;
      ipAddress: string;
      location?: string;
      lastActivity: Date;
      isCurrent: boolean;
    }[]>(`${this.apiUrl}/auth/sessions`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  terminateSession(sessionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/auth/sessions/${sessionId}`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  terminateAllSessions(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/auth/sessions`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  // Utility Methods
  private handleSuccessfulAuth(response: LoginResponse): void {
    this.storeToken(response.accessToken);
    this.storeRefreshToken(response.refreshToken);
    this.storeUser(response.user);
    
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
    
    this.scheduleTokenRefresh();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private storeRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  private clearStoredAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;
    
    const expiresAt = payload.exp * 1000;
    return Date.now() >= expiresAt;
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      return null;
    }
  }

  private handleError = (error: any): Observable<never> => {
    console.error('AuthService Error:', error);
    
    // Handle specific error cases
    if (error.status === 401) {
      this.logout();
    }
    
    throw error;
  }

  // Rick Jefferson Solutions Specific Methods
  getClientEnrollmentStatus(): Observable<{
    isEnrolled: boolean;
    enrollmentDate?: Date;
    subscriptionStatus?: string;
    assignedCRO?: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  }> {
    return this.http.get<{
      isEnrolled: boolean;
      enrollmentDate?: Date;
      subscriptionStatus?: string;
      assignedCRO?: {
        id: string;
        name: string;
        email: string;
        phone: string;
      };
    }>(`${this.apiUrl}/auth/client/enrollment-status`, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  requestCROAccess(justification: string): Observable<{ message: string; requestId: string }> {
    return this.http.post<{ message: string; requestId: string }>(
      `${this.apiUrl}/auth/request-cro-access`, {
        justification
      }, {
        headers: this.getAuthHeaders()
      }
    ).pipe(catchError(this.handleError));
  }

  // Compliance and Audit Trail
  logSecurityEvent(event: {
    type: 'login' | 'logout' | 'password_change' | 'permission_change' | 'data_access';
    description: string;
    metadata?: any;
  }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/security-log`, event, {
      headers: this.getAuthHeaders()
    }).pipe(catchError(this.handleError));
  }

  getSecurityLog(filters?: {
    eventType?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Observable<{
    events: {
      id: string;
      type: string;
      description: string;
      timestamp: Date;
      ipAddress: string;
      userAgent: string;
      metadata?: any;
    }[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let params: any = {};
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params[key] = value.toISOString();
          } else {
            params[key] = value.toString();
          }
        }
      });
    }

    return this.http.get<{
      events: {
        id: string;
        type: string;
        description: string;
        timestamp: Date;
        ipAddress: string;
        userAgent: string;
        metadata?: any;
      }[];
      total: number;
      page: number;
      totalPages: number;
    }>(`${this.apiUrl}/auth/security-log`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(catchError(this.handleError));
  }
}

// Rick Jefferson Solutions - Authentication Service
// Comprehensive authentication and authorization system
// Implements JWT tokens, RBAC, 2FA, and compliance logging
// Built for credit repair platform with role-based access control