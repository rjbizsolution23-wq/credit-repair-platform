import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-social-settings',
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
            <h6 class="card-title">Social Media Settings</h6>
            <p class="text-muted mb-3">Configure your social media integration settings</p>
            
            <form>
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Facebook Integration</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="facebookSwitch" [(ngModel)]="settings.facebook.enabled" name="facebook">
                      <label class="form-check-label" for="facebookSwitch">
                        Enable Facebook Integration
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Twitter Integration</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="twitterSwitch" [(ngModel)]="settings.twitter.enabled" name="twitter">
                      <label class="form-check-label" for="twitterSwitch">
                        Enable Twitter Integration
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">LinkedIn Integration</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="linkedinSwitch" [(ngModel)]="settings.linkedin.enabled" name="linkedin">
                      <label class="form-check-label" for="linkedinSwitch">
                        Enable LinkedIn Integration
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Instagram Integration</label>
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="instagramSwitch" [(ngModel)]="settings.instagram.enabled" name="instagram">
                      <label class="form-check-label" for="instagramSwitch">
                        Enable Instagram Integration
                      </label>
                    </div>
                  </div>
                </div>
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
export class SocialSettingsComponent {
  settings = {
    facebook: { enabled: false },
    twitter: { enabled: false },
    linkedin: { enabled: false },
    instagram: { enabled: false }
  };

  saveSettings() {
    console.log('Saving social settings:', this.settings);
    // Implement save logic here
  }
}