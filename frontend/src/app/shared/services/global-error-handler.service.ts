import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ErrorHandlerUtil } from '../utils/error-handler.util';
import { BackendGuardService } from './backend-guard.service';

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
  url?: string;
  userId?: string;
  userAgent: string;
  type: 'javascript' | 'http' | 'angular' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandlerService implements ErrorHandler {
  private errorQueue: ErrorInfo[] = [];
  private maxQueueSize = 50;
  private isReporting = false;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private backendGuard: BackendGuardService
  ) {}

  /**
   * Main error handler method called by Angular
   */
  handleError(error: any): void {
    console.error('Global error caught:', error);
    
    const errorInfo = this.processError(error);
    this.logError(errorInfo);
    this.queueError(errorInfo);
    
    // Handle critical errors
    if (errorInfo.severity === 'critical') {
      this.handleCriticalError(errorInfo);
    }
    
    // Show user-friendly notification
    this.showErrorNotification(errorInfo);
  }

  /**
   * Processes raw error into structured ErrorInfo
   */
  private processError(error: any): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: ErrorHandlerUtil.extractErrorMessage(error),
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      type: this.determineErrorType(error),
      severity: this.determineSeverity(error)
    };

    // Add stack trace if available
    if (error && error.stack) {
      errorInfo.stack = error.stack;
    }

    return errorInfo;
  }

  /**
   * Determines the type of error
   */
  private determineErrorType(error: any): ErrorInfo['type'] {
    if (error instanceof HttpErrorResponse) {
      return 'http';
    }
    if (error instanceof Error) {
      return 'javascript';
    }
    if (error && error.ngOriginalError) {
      return 'angular';
    }
    return 'unknown';
  }

  /**
   * Determines the severity of the error
   */
  private determineSeverity(error: any): ErrorInfo['severity'] {
    // Critical errors that break the app
    if (error instanceof TypeError && error.message.includes('Cannot read property')) {
      return 'critical';
    }
    if (error instanceof ReferenceError) {
      return 'critical';
    }
    
    // HTTP errors
    if (error instanceof HttpErrorResponse) {
      if (error.status >= 500) return 'high';
      if (error.status === 401 || error.status === 403) return 'medium';
      if (error.status >= 400) return 'medium';
      return 'low';
    }
    
    // Network errors
    if (ErrorHandlerUtil.isNetworkError(error)) {
      return 'high';
    }
    
    // Default to medium for unknown errors
    return 'medium';
  }

  /**
   * Logs error to console with formatting
   */
  private logError(errorInfo: ErrorInfo): void {
    const logMessage = ErrorHandlerUtil.formatErrorForLogging(errorInfo, 'GlobalErrorHandler');
    
    switch (errorInfo.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logMessage);
        break;
      case 'high':
        console.error('❌ HIGH SEVERITY:', logMessage);
        break;
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY:', logMessage);
        break;
      case 'low':
        console.info('ℹ️ LOW SEVERITY:', logMessage);
        break;
    }
  }

  /**
   * Adds error to queue for potential reporting
   */
  private queueError(errorInfo: ErrorInfo): void {
    this.errorQueue.push(errorInfo);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Handles critical errors that might break the app
   */
  private handleCriticalError(errorInfo: ErrorInfo): void {
    this.ngZone.run(() => {
      // Try to navigate to a safe page
      try {
        this.router.navigate(['/error'], { 
          queryParams: { 
            message: errorInfo.message,
            timestamp: errorInfo.timestamp.toISOString()
          }
        });
      } catch (navigationError) {
        console.error('Failed to navigate to error page:', navigationError);
        // Fallback: reload the page
        window.location.reload();
      }
    });
  }

  /**
   * Shows user-friendly error notification
   */
  private showErrorNotification(errorInfo: ErrorInfo): void {
    // This would integrate with your notification system
    // For now, we'll use a simple approach
    if (errorInfo.severity === 'critical' || errorInfo.severity === 'high') {
      this.ngZone.run(() => {
        // You can integrate with Angular Material Snackbar or similar
        console.log('Would show notification:', errorInfo.message);
      });
    }
  }

  /**
   * Gets all queued errors
   */
  public getQueuedErrors(): ErrorInfo[] {
    return [...this.errorQueue];
  }

  /**
   * Clears the error queue
   */
  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Gets error statistics
   */
  public getErrorStats(): { [key: string]: number } {
    const stats = {
      total: this.errorQueue.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      javascript: 0,
      http: 0,
      angular: 0,
      unknown: 0
    };

    this.errorQueue.forEach(error => {
      stats[error.severity]++;
      stats[error.type]++;
    });

    return stats;
  }

  /**
   * Manually report an error
   */
  public reportError(error: any, context?: string): void {
    const contextualError = context ? `${context}: ${error}` : error;
    this.handleError(contextualError);
  }
}