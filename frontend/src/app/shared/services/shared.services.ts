import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { NotificationConfig, ThemeConfig, UserPermissions } from '../models/shared.models';

// Notification Service
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<NotificationConfig>();
  public notifications$ = this.notificationSubject.asObservable();

  success(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'error',
      title,
      message,
      duration
    });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  show(config: NotificationConfig): void {
    this.notificationSubject.next(config);
  }
}

// Loading Service
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCounter = 0;

  public loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.loadingCounter++;
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.loadingCounter--;
    if (this.loadingCounter <= 0) {
      this.loadingCounter = 0;
      this.loadingSubject.next(false);
    }
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

// Theme Service
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeConfig>({
    mode: 'light',
    fontSize: 'md',
    compact: false
  });

  public theme$ = this.themeSubject.asObservable();

  setTheme(config: Partial<ThemeConfig>): void {
    const currentTheme = this.themeSubject.value;
    const newTheme = { ...currentTheme, ...config };
    this.themeSubject.next(newTheme);
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
  }

  getTheme(): ThemeConfig {
    return this.themeSubject.value;
  }

  toggleMode(): void {
    const currentTheme = this.getTheme();
    const newMode = currentTheme.mode === 'light' ? 'dark' : 'light';
    this.setTheme({ mode: newMode });
  }

  private applyTheme(theme: ThemeConfig): void {
    const body = document.body;
    
    // Apply theme mode
    body.classList.remove('light-mode', 'dark-mode');
    body.classList.add(`${theme.mode}-mode`);
    
    // Apply font size
    body.classList.remove('font-sm', 'font-md', 'font-lg');
    body.classList.add(`font-${theme.fontSize}`);
    
    // Apply compact mode
    if (theme.compact) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }
    
    // Apply custom colors if provided
    if (theme.primaryColor) {
      document.documentElement.style.setProperty('--bs-primary', theme.primaryColor);
    }
    if (theme.secondaryColor) {
      document.documentElement.style.setProperty('--bs-secondary', theme.secondaryColor);
    }
  }

  private saveTheme(theme: ThemeConfig): void {
    localStorage.setItem('theme-config', JSON.stringify(theme));
  }

  loadTheme(): void {
    const savedTheme = localStorage.getItem('theme-config');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme) as ThemeConfig;
        this.setTheme(theme);
      } catch (error) {
        console.warn('Failed to load saved theme:', error);
      }
    }
  }
}

// Permission Service
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<UserPermissions>({});
  public permissions$ = this.permissionsSubject.asObservable();

  setPermissions(permissions: UserPermissions): void {
    this.permissionsSubject.next(permissions);
  }

  hasPermission(permission: string): boolean {
    const permissions = this.permissionsSubject.value;
    return permissions[permission] === true;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  getPermissions(): UserPermissions {
    return this.permissionsSubject.value;
  }
}

// Utility Service
@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  
  // Generate unique ID
  generateId(prefix: string = 'id'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Debounce function
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Deep clone object
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }
    if (typeof obj === 'object') {
      const clonedObj = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    return obj;
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format percentage
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  // Format phone number
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  }

  // Format SSN
  formatSSN(ssn: string): string {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  }

  // Validate email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Validate phone
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleaned = phone.replace(/\D/g, '');
    return phoneRegex.test(cleaned) && cleaned.length >= 10;
  }

  // Get initials from name
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }

  // Truncate text
  truncateText(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) {
      return text;
    }
    return text.slice(0, length) + suffix;
  }

  // Download file
  downloadFile(data: Blob, filename: string): void {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Copy to clipboard
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Get browser info
  getBrowserInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)![1];
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)![1];
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)![1];
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/(\d+)/)![1];
    }

    return { name: browserName, version: browserVersion };
  }

  // Check if mobile device
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Get device type
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}

// Export all services
export const SHARED_SERVICES = [
  NotificationService,
  LoadingService,
  ThemeService,
  PermissionService,
  UtilityService
];