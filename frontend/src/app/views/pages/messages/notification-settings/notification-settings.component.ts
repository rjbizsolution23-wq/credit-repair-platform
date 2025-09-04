import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { NotificationSettings } from '../messages.model';

interface ComponentNotificationSettings {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    categories: {
      system: boolean;
      account: boolean;
      payment: boolean;
      dispute: boolean;
      reminder: boolean;
      marketing: boolean;
    };
  };
  sms: {
    enabled: boolean;
    categories: {
      system: boolean;
      account: boolean;
      payment: boolean;
      dispute: boolean;
      reminder: boolean;
      marketing: boolean;
    };
  };
  push: {
    enabled: boolean;
    categories: {
      system: boolean;
      account: boolean;
      payment: boolean;
      dispute: boolean;
      reminder: boolean;
      marketing: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    categories: {
      system: boolean;
      account: boolean;
      payment: boolean;
      dispute: boolean;
      reminder: boolean;
      marketing: boolean;
    };
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  preferences: {
    language: string;
    autoMarkAsRead: boolean;
    groupSimilar: boolean;
    showPreviews: boolean;
  };
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="notification-settings-container">
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <button class="btn btn-outline-secondary" routerLink="/messages/notifications">
            <i class="fas fa-arrow-left"></i>
            Back to Notifications
          </button>
          <div class="header-text">
            <h2>Notification Settings</h2>
            <p class="text-muted">Customize how and when you receive notifications</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary" (click)="resetToDefaults()">
            <i class="fas fa-undo"></i>
            Reset to Defaults
          </button>
          <button class="btn btn-primary" (click)="saveSettings()" [disabled]="saving">
            <i class="fas fa-save"></i>
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>

      <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
        <div class="row">
          <!-- Left Column -->
          <div class="col-lg-8">
            <!-- Email Notifications -->
            <div class="card mb-4">
              <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-envelope text-primary me-2"></i>
                    Email Notifications
                  </h5>
                  <div class="form-check form-switch">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="emailEnabled"
                           formControlName="emailEnabled">
                    <label class="form-check-label" for="emailEnabled">
                      Enable Email Notifications
                    </label>
                  </div>
                </div>
              </div>
              <div class="card-body" *ngIf="settingsForm.get('emailEnabled')?.value">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="emailFrequency" class="form-label">Frequency</label>
                    <select id="emailFrequency" class="form-select" formControlName="emailFrequency">
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Summary</option>
                    </select>
                  </div>
                </div>
                
                <div class="categories-section mt-4">
                  <h6>Categories</h6>
                  <div class="row g-3">
                    <div class="col-md-6" *ngFor="let category of categories">
                      <div class="form-check">
                        <input class="form-check-input" 
                               type="checkbox" 
                               [id]="'email-' + category.key"
                               [formControlName]="'email' + category.key.charAt(0).toUpperCase() + category.key.slice(1)">
                        <label class="form-check-label" [for]="'email-' + category.key">
                          <i class="fas" [ngClass]="category.icon"></i>
                          {{ category.label }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SMS Notifications -->
            <div class="card mb-4">
              <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-sms text-success me-2"></i>
                    SMS Notifications
                  </h5>
                  <div class="form-check form-switch">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="smsEnabled"
                           formControlName="smsEnabled">
                    <label class="form-check-label" for="smsEnabled">
                      Enable SMS Notifications
                    </label>
                  </div>
                </div>
              </div>
              <div class="card-body" *ngIf="settingsForm.get('smsEnabled')?.value">
                <div class="alert alert-info">
                  <i class="fas fa-info-circle"></i>
                  SMS notifications are sent only for high-priority alerts to avoid message charges.
                </div>
                
                <div class="categories-section">
                  <h6>Categories</h6>
                  <div class="row g-3">
                    <div class="col-md-6" *ngFor="let category of categories">
                      <div class="form-check">
                        <input class="form-check-input" 
                               type="checkbox" 
                               [id]="'sms-' + category.key"
                               [formControlName]="'sms' + category.key.charAt(0).toUpperCase() + category.key.slice(1)">
                        <label class="form-check-label" [for]="'sms-' + category.key">
                          <i class="fas" [ngClass]="category.icon"></i>
                          {{ category.label }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Push Notifications -->
            <div class="card mb-4">
              <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-mobile-alt text-warning me-2"></i>
                    Push Notifications
                  </h5>
                  <div class="form-check form-switch">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="pushEnabled"
                           formControlName="pushEnabled">
                    <label class="form-check-label" for="pushEnabled">
                      Enable Push Notifications
                    </label>
                  </div>
                </div>
              </div>
              <div class="card-body" *ngIf="settingsForm.get('pushEnabled')?.value">
                <div class="categories-section">
                  <h6>Categories</h6>
                  <div class="row g-3">
                    <div class="col-md-6" *ngFor="let category of categories">
                      <div class="form-check">
                        <input class="form-check-input" 
                               type="checkbox" 
                               [id]="'push-' + category.key"
                               [formControlName]="'push' + category.key.charAt(0).toUpperCase() + category.key.slice(1)">
                        <label class="form-check-label" [for]="'push-' + category.key">
                          <i class="fas" [ngClass]="category.icon"></i>
                          {{ category.label }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- In-App Notifications -->
            <div class="card mb-4">
              <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-bell text-info me-2"></i>
                    In-App Notifications
                  </h5>
                  <div class="form-check form-switch">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="inAppEnabled"
                           formControlName="inAppEnabled">
                    <label class="form-check-label" for="inAppEnabled">
                      Enable In-App Notifications
                    </label>
                  </div>
                </div>
              </div>
              <div class="card-body" *ngIf="settingsForm.get('inAppEnabled')?.value">
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <div class="form-check">
                      <input class="form-check-input" 
                             type="checkbox" 
                             id="inAppSound"
                             formControlName="inAppSound">
                      <label class="form-check-label" for="inAppSound">
                        <i class="fas fa-volume-up"></i>
                        Play notification sound
                      </label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-check">
                      <input class="form-check-input" 
                             type="checkbox" 
                             id="inAppDesktop"
                             formControlName="inAppDesktop">
                      <label class="form-check-label" for="inAppDesktop">
                        <i class="fas fa-desktop"></i>
                        Show desktop notifications
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="categories-section">
                  <h6>Categories</h6>
                  <div class="row g-3">
                    <div class="col-md-6" *ngFor="let category of categories">
                      <div class="form-check">
                        <input class="form-check-input" 
                               type="checkbox" 
                               [id]="'inApp-' + category.key"
                               [formControlName]="'inApp' + category.key.charAt(0).toUpperCase() + category.key.slice(1)">
                        <label class="form-check-label" [for]="'inApp-' + category.key">
                          <i class="fas" [ngClass]="category.icon"></i>
                          {{ category.label }}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="col-lg-4">
            <!-- Quiet Hours -->
            <div class="card mb-4">
              <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-moon text-secondary me-2"></i>
                    Quiet Hours
                  </h5>
                  <div class="form-check form-switch">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="quietHoursEnabled"
                           formControlName="quietHoursEnabled">
                    <label class="form-check-label" for="quietHoursEnabled">
                      Enable
                    </label>
                  </div>
                </div>
              </div>
              <div class="card-body" *ngIf="settingsForm.get('quietHoursEnabled')?.value">
                <div class="mb-3">
                  <label for="quietStartTime" class="form-label">Start Time</label>
                  <input type="time" 
                         id="quietStartTime"
                         class="form-control" 
                         formControlName="quietStartTime">
                </div>
                <div class="mb-3">
                  <label for="quietEndTime" class="form-label">End Time</label>
                  <input type="time" 
                         id="quietEndTime"
                         class="form-control" 
                         formControlName="quietEndTime">
                </div>
                <div class="mb-3">
                  <label for="quietTimezone" class="form-label">Timezone</label>
                  <select id="quietTimezone" class="form-select" formControlName="quietTimezone">
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <small class="text-muted">
                  During quiet hours, only urgent notifications will be delivered.
                </small>
              </div>
            </div>

            <!-- Preferences -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-cog text-secondary me-2"></i>
                  Preferences
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="language" class="form-label">Language</label>
                  <select id="language" class="form-select" formControlName="language">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div class="form-check mb-3">
                  <input class="form-check-input" 
                         type="checkbox" 
                         id="autoMarkAsRead"
                         formControlName="autoMarkAsRead">
                  <label class="form-check-label" for="autoMarkAsRead">
                    Auto-mark as read when viewed
                  </label>
                </div>

                <div class="form-check mb-3">
                  <input class="form-check-input" 
                         type="checkbox" 
                         id="groupSimilar"
                         formControlName="groupSimilar">
                  <label class="form-check-label" for="groupSimilar">
                    Group similar notifications
                  </label>
                </div>

                <div class="form-check">
                  <input class="form-check-input" 
                         type="checkbox" 
                         id="showPreviews"
                         formControlName="showPreviews">
                  <label class="form-check-label" for="showPreviews">
                    Show notification previews
                  </label>
                </div>
              </div>
            </div>

            <!-- Test Notifications -->
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-flask text-secondary me-2"></i>
                  Test Notifications
                </h5>
              </div>
              <div class="card-body">
                <p class="text-muted mb-3">
                  Send test notifications to verify your settings are working correctly.
                </p>
                <div class="d-grid gap-2">
                  <button class="btn btn-outline-primary btn-sm" (click)="sendTestNotification('email')">
                    <i class="fas fa-envelope"></i>
                    Test Email
                  </button>
                  <button class="btn btn-outline-success btn-sm" 
                          (click)="sendTestNotification('sms')"
                          [disabled]="!settingsForm.get('smsEnabled')?.value">
                    <i class="fas fa-sms"></i>
                    Test SMS
                  </button>
                  <button class="btn btn-outline-warning btn-sm" 
                          (click)="sendTestNotification('push')"
                          [disabled]="!settingsForm.get('pushEnabled')?.value">
                    <i class="fas fa-mobile-alt"></i>
                    Test Push
                  </button>
                  <button class="btn btn-outline-info btn-sm" 
                          (click)="sendTestNotification('inApp')"
                          [disabled]="!settingsForm.get('inAppEnabled')?.value">
                    <i class="fas fa-bell"></i>
                    Test In-App
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .notification-settings-container {
      padding: 1.5rem;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-text h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .card-title i {
      width: 20px;
    }

    .form-check-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-check-label i {
      width: 16px;
      color: #6c757d;
    }

    .categories-section h6 {
      margin-bottom: 1rem;
      font-weight: 600;
      color: #495057;
    }

    .form-check {
      padding: 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s;
    }

    .form-check:hover {
      background-color: #f8f9fa;
    }

    .form-switch .form-check-input {
      width: 2.5rem;
      height: 1.25rem;
    }

    .alert {
      border: none;
      border-radius: 0.5rem;
    }

    .d-grid .btn {
      justify-content: flex-start;
    }

    .d-grid .btn i {
      margin-right: 0.5rem;
      width: 16px;
    }

    @media (max-width: 768px) {
      .notification-settings-container {
        padding: 1rem;
      }

      .settings-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .header-actions {
        justify-content: center;
      }

      .card-header .d-flex {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .categories-section .row {
        margin: 0;
      }

      .categories-section .col-md-6 {
        padding: 0.25rem;
      }
    }
  `]
})
export class NotificationSettingsComponent implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  saving = false;
  
  categories = [
    { key: 'system', label: 'System Updates', icon: 'fa-cog' },
    { key: 'account', label: 'Account Activity', icon: 'fa-user' },
    { key: 'payment', label: 'Payment Alerts', icon: 'fa-credit-card' },
    { key: 'dispute', label: 'Dispute Updates', icon: 'fa-gavel' },
    { key: 'reminder', label: 'Reminders', icon: 'fa-clock' },
    { key: 'marketing', label: 'Marketing', icon: 'fa-bullhorn' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService
  ) {
    this.settingsForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    const form = this.fb.group({
      // Email settings
      emailEnabled: [true],
      emailFrequency: ['immediate'],
      emailSystem: [true],
      emailAccount: [true],
      emailPayment: [true],
      emailDispute: [true],
      emailReminder: [true],
      emailMarketing: [false],

      // SMS settings
      smsEnabled: [false],
      smsSystem: [true],
      smsAccount: [true],
      smsPayment: [true],
      smsDispute: [true],
      smsReminder: [false],
      smsMarketing: [false],

      // Push settings
      pushEnabled: [true],
      pushSystem: [true],
      pushAccount: [true],
      pushPayment: [true],
      pushDispute: [true],
      pushReminder: [true],
      pushMarketing: [false],

      // In-app settings
      inAppEnabled: [true],
      inAppSound: [true],
      inAppDesktop: [true],
      inAppSystem: [true],
      inAppAccount: [true],
      inAppPayment: [true],
      inAppDispute: [true],
      inAppReminder: [true],
      inAppMarketing: [false],

      // Quiet hours
      quietHoursEnabled: [false],
      quietStartTime: ['22:00'],
      quietEndTime: ['08:00'],
      quietTimezone: ['America/New_York'],

      // Preferences
      language: ['en'],
      autoMarkAsRead: [true],
      groupSimilar: [true],
      showPreviews: [true]
    });

    return form;
  }

  loadSettings(): void {
    this.messagesService.getNotificationSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings: any) => {
        this.settingsForm.patchValue(this.flattenServiceSettings(settings));
      },
      error: (error: any) => {
        console.error('Error loading notification settings:', error);
      }
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid && !this.saving) {
      this.saving = true;
      
      const settings = this.buildSettingsObject();
      
      const mappedSettings = this.mapToServiceSettings(settings);
      this.messagesService.updateNotificationSettings(mappedSettings).subscribe({
        next: () => {
          this.saving = false;
          // Show success message
        },
        error: (error: any) => {
          console.error('Error saving notification settings:', error);
          this.saving = false;
        }
      });
    }
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all notification settings to their default values?')) {
      this.settingsForm.reset();
      this.settingsForm.patchValue({
        emailEnabled: true,
        emailFrequency: 'immediate',
        emailSystem: true,
        emailAccount: true,
        emailPayment: true,
        emailDispute: true,
        emailReminder: true,
        emailMarketing: false,

        smsEnabled: false,
        smsSystem: true,
        smsAccount: true,
        smsPayment: true,
        smsDispute: true,
        smsReminder: false,
        smsMarketing: false,

        pushEnabled: true,
        pushSystem: true,
        pushAccount: true,
        pushPayment: true,
        pushDispute: true,
        pushReminder: true,
        pushMarketing: false,

        inAppEnabled: true,
        inAppSound: true,
        inAppDesktop: true,
        inAppSystem: true,
        inAppAccount: true,
        inAppPayment: true,
        inAppDispute: true,
        inAppReminder: true,
        inAppMarketing: false,

        quietHoursEnabled: false,
        quietStartTime: '22:00',
        quietEndTime: '08:00',
        quietTimezone: 'America/New_York',

        language: 'en',
        autoMarkAsRead: true,
        groupSimilar: true,
        showPreviews: true
      });
    }
  }

  sendTestNotification(type: string): void {
    this.messagesService.sendTestNotification(type).subscribe({
      next: () => {
        // Show success message
        console.log(`Test ${type} notification sent successfully`);
      },
      error: (error: any) => {
        console.error(`Error sending test ${type} notification:`, error);
      }
    });
  }

  private flattenServiceSettings(settings: NotificationSettings): any {
    // Convert service NotificationSettings to form structure
    return {
      emailEnabled: settings.emailNotifications,
      smsEnabled: settings.smsNotifications,
      pushEnabled: settings.pushNotifications,
      inAppEnabled: settings.inAppNotifications,
      frequency: settings.frequency,
      quietHoursEnabled: settings.quietHours?.enabled || false,
      quietStartTime: settings.quietHours?.startTime || '22:00',
      quietEndTime: settings.quietHours?.endTime || '08:00',
      quietTimezone: settings.quietHours?.timezone || 'UTC',
      // Set default values for preferences since they come as array
      language: 'en',
      autoMarkAsRead: false,
      groupSimilar: true,
      showPreviews: true
    };
  }

  private flattenSettings(settings: ComponentNotificationSettings): any {
    return {
      emailEnabled: settings.email.enabled,
      emailFrequency: settings.email.frequency,
      emailSystem: settings.email.categories.system,
      emailAccount: settings.email.categories.account,
      emailPayment: settings.email.categories.payment,
      emailDispute: settings.email.categories.dispute,
      emailReminder: settings.email.categories.reminder,
      emailMarketing: settings.email.categories.marketing,

      smsEnabled: settings.sms.enabled,
      smsSystem: settings.sms.categories.system,
      smsAccount: settings.sms.categories.account,
      smsPayment: settings.sms.categories.payment,
      smsDispute: settings.sms.categories.dispute,
      smsReminder: settings.sms.categories.reminder,
      smsMarketing: settings.sms.categories.marketing,

      pushEnabled: settings.push.enabled,
      pushSystem: settings.push.categories.system,
      pushAccount: settings.push.categories.account,
      pushPayment: settings.push.categories.payment,
      pushDispute: settings.push.categories.dispute,
      pushReminder: settings.push.categories.reminder,
      pushMarketing: settings.push.categories.marketing,

      inAppEnabled: settings.inApp.enabled,
      inAppSound: settings.inApp.sound,
      inAppDesktop: settings.inApp.desktop,
      inAppSystem: settings.inApp.categories.system,
      inAppAccount: settings.inApp.categories.account,
      inAppPayment: settings.inApp.categories.payment,
      inAppDispute: settings.inApp.categories.dispute,
      inAppReminder: settings.inApp.categories.reminder,
      inAppMarketing: settings.inApp.categories.marketing,

      quietHoursEnabled: settings.quietHours.enabled,
      quietStartTime: settings.quietHours.startTime,
      quietEndTime: settings.quietHours.endTime,
      quietTimezone: settings.quietHours.timezone,

      language: settings.preferences.language,
      autoMarkAsRead: settings.preferences.autoMarkAsRead,
      groupSimilar: settings.preferences.groupSimilar,
      showPreviews: settings.preferences.showPreviews
    };
  }

  private mapToServiceSettings(settings: ComponentNotificationSettings): Partial<NotificationSettings> {
    return {
      emailNotifications: settings.email.enabled,
      enableEmailNotifications: settings.email.enabled,
      smsNotifications: settings.sms.enabled,
      enableSmsNotifications: settings.sms.enabled,
      pushNotifications: settings.push.enabled,
      inAppNotifications: settings.inApp.enabled,
      frequency: settings.email.frequency,
      quietHours: {
        enabled: settings.quietHours.enabled,
        startTime: settings.quietHours.startTime,
        endTime: settings.quietHours.endTime,
        timezone: settings.quietHours.timezone
      },
      preferences: [] // Convert to array format as needed
    };
  }

  private buildSettingsObject(): ComponentNotificationSettings {
    const formValue = this.settingsForm.value;
    
    return {
      email: {
        enabled: formValue.emailEnabled,
        frequency: formValue.emailFrequency,
        categories: {
          system: formValue.emailSystem,
          account: formValue.emailAccount,
          payment: formValue.emailPayment,
          dispute: formValue.emailDispute,
          reminder: formValue.emailReminder,
          marketing: formValue.emailMarketing
        }
      },
      sms: {
        enabled: formValue.smsEnabled,
        categories: {
          system: formValue.smsSystem,
          account: formValue.smsAccount,
          payment: formValue.smsPayment,
          dispute: formValue.smsDispute,
          reminder: formValue.smsReminder,
          marketing: formValue.smsMarketing
        }
      },
      push: {
        enabled: formValue.pushEnabled,
        categories: {
          system: formValue.pushSystem,
          account: formValue.pushAccount,
          payment: formValue.pushPayment,
          dispute: formValue.pushDispute,
          reminder: formValue.pushReminder,
          marketing: formValue.pushMarketing
        }
      },
      inApp: {
        enabled: formValue.inAppEnabled,
        sound: formValue.inAppSound,
        desktop: formValue.inAppDesktop,
        categories: {
          system: formValue.inAppSystem,
          account: formValue.inAppAccount,
          payment: formValue.inAppPayment,
          dispute: formValue.inAppDispute,
          reminder: formValue.inAppReminder,
          marketing: formValue.inAppMarketing
        }
      },
      quietHours: {
        enabled: formValue.quietHoursEnabled,
        startTime: formValue.quietStartTime,
        endTime: formValue.quietEndTime,
        timezone: formValue.quietTimezone
      },
      preferences: {
        language: formValue.language,
        autoMarkAsRead: formValue.autoMarkAsRead,
        groupSimilar: formValue.groupSimilar,
        showPreviews: formValue.showPreviews
      }
    };
  }
}