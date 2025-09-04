import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">Privacy & Security Settings</h6>
            <p class="text-muted mb-3">Configure your privacy and security preferences</p>
            
            <form>
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Profile Visibility</label>
                    <select class="form-select" [(ngModel)]="settings.profileVisibility" name="profileVisibility">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                    </select>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Data Sharing</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="dataSharingSwitch" [(ngModel)]="settings.dataSharing" name="dataSharing">
                      <label class="form-check-label" for="dataSharingSwitch">
                        Allow data sharing with partners
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Two-Factor Authentication</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="twoFactorSwitch" [(ngModel)]="settings.twoFactorAuth" name="twoFactorAuth">
                      <label class="form-check-label" for="twoFactorSwitch">
                        Enable 2FA
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Login Notifications</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="loginNotificationsSwitch" [(ngModel)]="settings.loginNotifications" name="loginNotifications">
                      <label class="form-check-label" for="loginNotificationsSwitch">
                        Notify on new login
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Activity Tracking</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="activityTrackingSwitch" [(ngModel)]="settings.activityTracking" name="activityTracking">
                      <label class="form-check-label" for="activityTrackingSwitch">
                        Allow activity tracking
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Marketing Communications</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="marketingSwitch" [(ngModel)]="settings.marketingCommunications" name="marketingCommunications">
                      <label class="form-check-label" for="marketingSwitch">
                        Receive marketing emails
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Session Timeout (minutes)</label>
                <input type="number" class="form-control" [(ngModel)]="settings.sessionTimeout" name="sessionTimeout" min="5" max="480">
              </div>
              
              <button type="submit" class="btn btn-primary me-2" (click)="saveSettings()">
                <i data-feather="save" appFeatherIcon class="btn-icon-prepend"></i>
                Save Settings
              </button>
              <button type="button" class="btn btn-secondary">
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PrivacySettingsComponent {
  settings = {
    profileVisibility: 'private',
    dataSharing: false,
    twoFactorAuth: true,
    loginNotifications: true,
    activityTracking: false,
    marketingCommunications: false,
    sessionTimeout: 30
  };

  saveSettings() {
    console.log('Saving privacy settings:', this.settings);
    // Implement save logic here
  }
}