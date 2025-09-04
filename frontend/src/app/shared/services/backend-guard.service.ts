import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BackendHealthStatus {
  isOnline: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendGuardService {
  private healthStatusSubject = new BehaviorSubject<BackendHealthStatus>({
    isOnline: true,
    lastChecked: new Date()
  });

  public healthStatus$ = this.healthStatusSubject.asObservable();
  private healthCheckInterval = 30000; // 30 seconds
  private healthCheckTimeout = 5000; // 5 seconds
  private baseUrl = environment.apiUrl || 'http://localhost:8787';

  constructor(private http: HttpClient) {
    this.startHealthMonitoring();
  }

  /**
   * Starts continuous health monitoring
   */
  private startHealthMonitoring(): void {
    // Initial health check
    this.checkBackendHealth();
    
    // Set up periodic health checks
    timer(this.healthCheckInterval, this.healthCheckInterval).subscribe(() => {
      this.checkBackendHealth();
    });
  }

  /**
   * Performs a health check against the backend
   */
  public checkBackendHealth(): Observable<boolean> {
    const startTime = Date.now();
    const healthEndpoint = `${this.baseUrl}/health`;
    
    return this.http.get(healthEndpoint, { 
      observe: 'response',
      responseType: 'text'
    }).pipe(
      timeout(this.healthCheckTimeout),
      map(response => {
        const responseTime = Date.now() - startTime;
        const isOnline = response.status >= 200 && response.status < 300;
        
        this.updateHealthStatus({
          isOnline,
          lastChecked: new Date(),
          responseTime
        });
        
        return isOnline;
      }),
      catchError((error: HttpErrorResponse) => {
        const responseTime = Date.now() - startTime;
        
        this.updateHealthStatus({
          isOnline: false,
          lastChecked: new Date(),
          responseTime,
          error: this.getErrorMessage(error)
        });
        
        return of(false);
      })
    );
  }

  /**
   * Checks if a specific endpoint is reachable
   */
  public checkEndpoint(endpoint: string): Observable<boolean> {
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    return this.http.head(fullUrl, { observe: 'response' }).pipe(
      timeout(this.healthCheckTimeout),
      map(response => response.status >= 200 && response.status < 300),
      catchError(() => of(false))
    );
  }

  /**
   * Gets the current health status
   */
  public getCurrentHealthStatus(): BackendHealthStatus {
    return this.healthStatusSubject.value;
  }

  /**
   * Checks if the backend is currently online
   */
  public isBackendOnline(): boolean {
    return this.healthStatusSubject.value.isOnline;
  }

  /**
   * Updates the health status and notifies subscribers
   */
  private updateHealthStatus(status: BackendHealthStatus): void {
    this.healthStatusSubject.next(status);
  }

  /**
   * Extracts error message from HTTP error
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Network connection failed';
    }
    if (error.status >= 500) {
      return 'Server error';
    }
    if (error.status === 404) {
      return 'Health endpoint not found';
    }
    if (error.name === 'TimeoutError') {
      return 'Request timeout';
    }
    
    return error.message || 'Unknown error';
  }

  /**
   * Sets custom health check interval
   */
  public setHealthCheckInterval(intervalMs: number): void {
    this.healthCheckInterval = intervalMs;
  }

  /**
   * Sets custom health check timeout
   */
  public setHealthCheckTimeout(timeoutMs: number): void {
    this.healthCheckTimeout = timeoutMs;
  }

  /**
   * Manually triggers a health check
   */
  public triggerHealthCheck(): void {
    this.checkBackendHealth().subscribe();
  }
}