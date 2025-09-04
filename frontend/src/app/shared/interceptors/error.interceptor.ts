import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, retry, retryWhen, delayWhen, take, concat } from 'rxjs/operators';
import { GlobalErrorHandlerService } from '../services/global-error-handler.service';
import { BackendGuardService } from '../services/backend-guard.service';
import { ErrorHandlerUtil } from '../utils/error-handler.util';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(
    private globalErrorHandler: GlobalErrorHandlerService,
    private backendGuard: BackendGuardService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retryWhen(errors => this.handleRetry(errors, request)),
      catchError((error: HttpErrorResponse) => this.handleError(error, request))
    );
  }

  /**
   * Handles retry logic for failed requests
   */
  private handleRetry(errors: Observable<any>, request: HttpRequest<any>): Observable<any> {
    return errors.pipe(
      delayWhen((error: HttpErrorResponse) => {
        // Only retry on network errors or 5xx server errors
        if (this.shouldRetry(error, request)) {
          console.log(`Retrying request to ${request.url} after error:`, error.status);
          return timer(this.retryDelay);
        }
        // Don't retry, throw the error
        return throwError(error);
      }),
      take(this.retryAttempts),
      concat(throwError('Max retry attempts reached'))
    );
  }

  /**
   * Determines if a request should be retried
   */
  private shouldRetry(error: HttpErrorResponse, request: HttpRequest<any>): boolean {
    // Don't retry on client errors (4xx) except for specific cases
    if (error.status >= 400 && error.status < 500) {
      // Retry on 408 (Request Timeout) and 429 (Too Many Requests)
      return error.status === 408 || error.status === 429;
    }

    // Retry on server errors (5xx) and network errors (0)
    if (error.status >= 500 || error.status === 0) {
      return true;
    }

    // Don't retry POST, PUT, PATCH requests by default to avoid duplicate operations
    if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
      // Only retry if it's explicitly marked as safe to retry
      return request.headers.has('X-Retry-Safe');
    }

    return false;
  }

  /**
   * Handles HTTP errors
   */
  private handleError(error: HttpErrorResponse, request: HttpRequest<any>): Observable<never> {
    console.error('HTTP Error intercepted:', error);

    // Update backend health status if it's a network error
    if (ErrorHandlerUtil.isNetworkError(error)) {
      this.backendGuard.triggerHealthCheck();
    }

    // Create enhanced error with request context
    const enhancedError = this.enhanceError(error, request);

    // Report to global error handler
    this.globalErrorHandler.reportError(enhancedError, 'HTTP_INTERCEPTOR');

    // Handle specific error types
    this.handleSpecificErrors(error);

    return throwError(enhancedError);
  }

  /**
   * Enhances error with additional context
   */
  private enhanceError(error: HttpErrorResponse, request: HttpRequest<any>): any {
    return {
      ...error,
      requestUrl: request.url,
      requestMethod: request.method,
      requestHeaders: request.headers.keys().reduce((acc, key) => {
        acc[key] = request.headers.get(key);
        return acc;
      }, {} as any),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isNetworkError: ErrorHandlerUtil.isNetworkError(error)
    };
  }

  /**
   * Handles specific error scenarios
   */
  private handleSpecificErrors(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        this.handleForbidden();
        break;
      case 404:
        this.handleNotFound(error);
        break;
      case 500:
        this.handleServerError();
        break;
      case 0:
        this.handleNetworkError();
        break;
    }
  }

  /**
   * Handles 401 Unauthorized errors
   */
  private handleUnauthorized(): void {
    console.warn('Unauthorized access detected');
    // You might want to redirect to login or refresh token
    // this.router.navigate(['/login']);
  }

  /**
   * Handles 403 Forbidden errors
   */
  private handleForbidden(): void {
    console.warn('Access forbidden');
    // You might want to show a permission denied message
  }

  /**
   * Handles 404 Not Found errors
   */
  private handleNotFound(error: HttpErrorResponse): void {
    console.warn('Resource not found:', error.url);
    // You might want to log this for API endpoint monitoring
  }

  /**
   * Handles 500 Server errors
   */
  private handleServerError(): void {
    console.error('Server error detected');
    // You might want to show a "try again later" message
  }

  /**
   * Handles network errors
   */
  private handleNetworkError(): void {
    console.error('Network error detected');
    // You might want to show an offline indicator
  }

  /**
   * Sets retry configuration
   */
  public setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }
}