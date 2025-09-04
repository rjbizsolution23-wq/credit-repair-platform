import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconDirective],
  template: `
    <div class="page-content">
      <div class="row">
        <div class="col-md-12 grid-margin stretch-card">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title">Social Media Notification Settings</h6>
              <form [formGroup]="notificationForm" (ngSubmit)="onSubmit()">
                <div class="row">
                  <div class="col-sm-6">
                    <div class="mb-3">
                      <label class="form-label">Email Notifications</label>
                      <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" formControlName="emailEnabled" id="emailEnabled">
                        <label class="form-check-label" for="emailEnabled">
                          Enable email notifications
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="mb-3">
                      <label class="form-label">Push Notifications</label>
                      <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" formControlName="pushEnabled" id="pushEnabled">
                        <label class="form-check-label" for="pushEnabled">
                          Enable push notifications
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-sm-12">
                    <div class="mb-3">
                      <label class="form-label">Notification Types</label>
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" formControlName="postScheduled" id="postScheduled">
                        <label class="form-check-label" for="postScheduled">
                          Post scheduled notifications
                        </label>
                      </div>
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" formControlName="engagementAlerts" id="engagementAlerts">
                        <label class="form-check-label" for="engagementAlerts">
                          Engagement alerts
                        </label>
                      </div>
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" formControlName="analyticsReports" id="analyticsReports">
                        <label class="form-check-label" for="analyticsReports">
                          Weekly analytics reports
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary me-2">Save Settings</button>
                <button type="button" class="btn btn-secondary" (click)="resetForm()">Reset</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotificationSettingsComponent implements OnInit {
  notificationForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.notificationForm = this.fb.group({
      emailEnabled: [true],
      pushEnabled: [false],
      postScheduled: [true],
      engagementAlerts: [true],
      analyticsReports: [false]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    // Load settings from service
    console.log('Loading notification settings...');
  }

  onSubmit(): void {
    if (this.notificationForm.valid) {
      console.log('Saving notification settings:', this.notificationForm.value);
      // Save settings via service
    }
  }

  resetForm(): void {
    this.notificationForm.reset({
      emailEnabled: true,
      pushEnabled: false,
      postScheduled: true,
      engagementAlerts: true,
      analyticsReports: false
    });
  }
}