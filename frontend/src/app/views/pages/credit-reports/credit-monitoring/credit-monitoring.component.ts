import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { CreditReportService } from '../../../../core/services/credit-report.service';
import { CreditMonitoring, MonitoringSettings, CreditAlert, AlertType, AlertSeverity, MonitoringFrequency, CreditBureau } from '../../../../core/models/credit-report.model';

@Component({
  selector: 'app-credit-monitoring',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './credit-monitoring.component.html',
  styleUrls: ['./credit-monitoring.component.scss']
})
export class CreditMonitoringComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Make Math available in template
  Math = Math;
  
  clientId = 'default-client'; // TODO: Get from route or auth service
  monitoring: CreditMonitoring[] = [];
  alerts: CreditAlert[] = [];
  settings: MonitoringSettings | null = null;
  
  // Forms
  settingsForm: FormGroup;
  
  // UI State
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  activeTab = 'overview';
  lastCheck: Date | null = null;
  
  // Filters
  alertFilters = {
    severity: '',
    type: '',
    bureau: '',
    dateRange: '30',
    isRead: ''
  };
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Enums for template
  AlertType = AlertType;
  AlertSeverity = AlertSeverity;
  MonitoringFrequency = MonitoringFrequency;
  CreditBureau = CreditBureau;

  constructor(
    private fb: FormBuilder,
    private creditReportService: CreditReportService
  ) {
    this.settingsForm = this.createSettingsForm();
  }

  ngOnInit(): void {
    this.loadMonitoringData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createSettingsForm(): FormGroup {
    return this.fb.group({
      enabled: [true],
      frequency: [MonitoringFrequency.DAILY, Validators.required],
      bureaus: this.fb.group({
        experian: [true],
        equifax: [true],
        transunion: [true]
      }),
      alertTypes: this.fb.group({
        scoreChanges: [true],
        newAccounts: [true],
        newInquiries: [true],
        addressChanges: [true],
        personalInfoChanges: [true],
        publicRecords: [true],
        suspiciousActivity: [true]
      }),
      thresholds: this.fb.group({
        scoreChangeThreshold: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
        inquiryAlertDays: [7, [Validators.required, Validators.min(1), Validators.max(30)]]
      }),
      notifications: this.fb.group({
        email: [true],
        sms: [false],
        push: [true],
        emailAddress: ['', [Validators.email]],
        phoneNumber: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]]
      })
    });
  }

  private loadMonitoringData(): void {
    this.loading = true;
    this.error = null;

    // Load monitoring settings
    this.creditReportService.getMonitoringSettings(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings: any) => {
          this.settings = settings;
          if (this.settings) {
            this.settingsForm.patchValue(this.settings);
          }
        },
        error: (error: any) => {
          console.error('Error loading monitoring settings:', error);
        }
      });

    // Load alerts
    this.creditReportService.getAlerts(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alerts: any) => {
          this.alerts = alerts || [];
          this.totalItems = alerts.length || 0;
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading alerts:', error);
          this.error = 'Failed to load monitoring data. Please try again.';
          this.loading = false;
        }
      });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    
    if (tab === 'alerts') {
      this.loadAlerts();
    }
  }

  private loadAlerts(): void {
    // Note: The service method doesn't support pagination/filtering parameters
    // This would need to be implemented in the backend service
    this.creditReportService.getAlerts(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alerts: any) => {
          this.alerts = alerts || [];
          this.totalItems = alerts.length || 0;
        },
        error: (error: any) => {
          console.error('Error loading alerts:', error);
          this.error = 'Failed to load alerts. Please try again.';
        }
      });
  }

  onSaveSettings(): void {
    if (this.settingsForm.valid) {
      this.saving = true;
      this.error = null;
      this.success = null;

      const settings = this.settingsForm.value;
      
      this.creditReportService.updateMonitoringSettings(this.clientId, settings)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.success = 'Monitoring settings saved successfully!';
            this.saving = false;
            setTimeout(() => this.success = null, 5000);
          },
          error: (error: any) => {
            console.error('Error saving settings:', error);
            this.error = 'Failed to save settings. Please try again.';
            this.saving = false;
          }
        });
    } else {
      this.markFormGroupTouched(this.settingsForm);
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAlerts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAlerts();
  }

  onMarkAlertAsRead(alertId: string): void {
    this.creditReportService.markAlertAsRead(alertId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const alert = this.alerts.find(a => a.id === alertId);
          if (alert) {
            alert.isRead = true;
          }
        },
        error: (error: any) => {
          console.error('Error marking alert as read:', error);
        }
      });
  }

  onDeleteAlert(alertId: string): void {
    if (confirm('Are you sure you want to delete this alert?')) {
      this.creditReportService.deleteAlert(alertId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.alerts = this.alerts.filter(a => a.id !== alertId);
            this.totalItems--;
          },
          error: (error: any) => {
            console.error('Error deleting alert:', error);
            this.error = 'Failed to delete alert. Please try again.';
          }
        });
    }
  }

  onTestNotifications(): void {
    this.creditReportService.testNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Test notifications sent successfully!';
          setTimeout(() => this.success = null, 5000);
        },
        error: (error: any) => {
          console.error('Error sending test notifications:', error);
          this.error = 'Failed to send test notifications. Please try again.';
        }
      });
  }

  onEnableMonitoring(): void {
    this.settingsForm.patchValue({ enabled: true });
    this.onSaveSettings();
  }

  onDisableMonitoring(): void {
    if (confirm('Are you sure you want to disable credit monitoring?')) {
      this.settingsForm.patchValue({ enabled: false });
      this.onSaveSettings();
    }
  }

  // Utility methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.settingsForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid phone number';
      }
      if (field.errors['min']) {
        return `Minimum value is ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Maximum value is ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.LOW:
        return 'info';
      case AlertSeverity.MEDIUM:
        return 'warning';
      case AlertSeverity.HIGH:
        return 'danger';
      case AlertSeverity.CRITICAL:
        return 'dark';
      default:
        return 'secondary';
    }
  }

  getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.LOW:
        return 'info';
      case AlertSeverity.MEDIUM:
        return 'alert-triangle';
      case AlertSeverity.HIGH:
        return 'alert-circle';
      case AlertSeverity.CRITICAL:
        return 'alert-octagon';
      default:
        return 'bell';
    }
  }

  getAlertTypeIcon(type: AlertType): string {
    switch (type) {
      case AlertType.SCORE_CHANGE:
        return 'trending-up';
      case AlertType.NEW_ACCOUNT:
        return 'credit-card';
      case AlertType.NEW_INQUIRY:
        return 'search';
      case AlertType.ADDRESS_CHANGE:
        return 'map-pin';
      case AlertType.IDENTITY_ALERT:
        return 'user';
      case AlertType.FRAUD_ALERT:
        return 'shield-alert';
      default:
        return 'bell';
    }
  }

  getBureauIcon(bureau: CreditBureau): string {
    switch (bureau) {
      case CreditBureau.EXPERIAN:
        return 'trending-up';
      case CreditBureau.EQUIFAX:
        return 'bar-chart';
      case CreditBureau.TRANSUNION:
        return 'activity';
      default:
        return 'file-text';
    }
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUnreadAlertsCount(): number {
    return this.alerts.filter(alert => !alert.isRead).length;
  }

  getHighPriorityAlertsCount(): number {
    return this.alerts.filter(alert => 
      alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.CRITICAL
    ).length;
  }

  onRefresh(): void {
    this.loadMonitoringData();
  }
}