import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-integration-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconDirective],
  template: `
    <div class="page-content">
      <div class="row">
        <div class="col-md-12 grid-margin stretch-card">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title">Social Media Integration Settings</h6>
              <form [formGroup]="integrationForm" (ngSubmit)="onSubmit()">
                
                <!-- Facebook Integration -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="mb-3"><i data-feather="facebook" appFeatherIcon class="me-2"></i>Facebook</h6>
                    <div class="row">
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">App ID</label>
                          <input type="text" class="form-control" formControlName="facebookAppId" placeholder="Enter Facebook App ID">
                        </div>
                      </div>
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">App Secret</label>
                          <input type="password" class="form-control" formControlName="facebookAppSecret" placeholder="Enter Facebook App Secret">
                        </div>
                      </div>
                    </div>
                    <div class="form-check form-switch mb-3">
                      <input class="form-check-input" type="checkbox" formControlName="facebookEnabled" id="facebookEnabled">
                      <label class="form-check-label" for="facebookEnabled">
                        Enable Facebook Integration
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Twitter Integration -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="mb-3"><i data-feather="twitter" appFeatherIcon class="me-2"></i>Twitter</h6>
                    <div class="row">
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">API Key</label>
                          <input type="text" class="form-control" formControlName="twitterApiKey" placeholder="Enter Twitter API Key">
                        </div>
                      </div>
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">API Secret</label>
                          <input type="password" class="form-control" formControlName="twitterApiSecret" placeholder="Enter Twitter API Secret">
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">Access Token</label>
                          <input type="text" class="form-control" formControlName="twitterAccessToken" placeholder="Enter Access Token">
                        </div>
                      </div>
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">Access Token Secret</label>
                          <input type="password" class="form-control" formControlName="twitterAccessTokenSecret" placeholder="Enter Access Token Secret">
                        </div>
                      </div>
                    </div>
                    <div class="form-check form-switch mb-3">
                      <input class="form-check-input" type="checkbox" formControlName="twitterEnabled" id="twitterEnabled">
                      <label class="form-check-label" for="twitterEnabled">
                        Enable Twitter Integration
                      </label>
                    </div>
                  </div>
                </div>

                <!-- LinkedIn Integration -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="mb-3"><i data-feather="linkedin" appFeatherIcon class="me-2"></i>LinkedIn</h6>
                    <div class="row">
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">Client ID</label>
                          <input type="text" class="form-control" formControlName="linkedinClientId" placeholder="Enter LinkedIn Client ID">
                        </div>
                      </div>
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">Client Secret</label>
                          <input type="password" class="form-control" formControlName="linkedinClientSecret" placeholder="Enter LinkedIn Client Secret">
                        </div>
                      </div>
                    </div>
                    <div class="form-check form-switch mb-3">
                      <input class="form-check-input" type="checkbox" formControlName="linkedinEnabled" id="linkedinEnabled">
                      <label class="form-check-label" for="linkedinEnabled">
                        Enable LinkedIn Integration
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Instagram Integration -->
                <div class="row mb-4">
                  <div class="col-12">
                    <h6 class="mb-3"><i data-feather="instagram" appFeatherIcon class="me-2"></i>Instagram</h6>
                    <div class="row">
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">Access Token</label>
                          <input type="text" class="form-control" formControlName="instagramAccessToken" placeholder="Enter Instagram Access Token">
                        </div>
                      </div>
                      <div class="col-sm-6">
                        <div class="mb-3">
                          <label class="form-label">Business Account ID</label>
                          <input type="text" class="form-control" formControlName="instagramBusinessId" placeholder="Enter Business Account ID">
                        </div>
                      </div>
                    </div>
                    <div class="form-check form-switch mb-3">
                      <input class="form-check-input" type="checkbox" formControlName="instagramEnabled" id="instagramEnabled">
                      <label class="form-check-label" for="instagramEnabled">
                        Enable Instagram Integration
                      </label>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-12">
                    <button type="submit" class="btn btn-primary me-2" [disabled]="!integrationForm.valid">
                      <i data-feather="save" appFeatherIcon class="me-1"></i>
                      Save Integration Settings
                    </button>
                    <button type="button" class="btn btn-secondary me-2" (click)="testConnections()">
                      <i data-feather="wifi" appFeatherIcon class="me-1"></i>
                      Test Connections
                    </button>
                    <button type="button" class="btn btn-outline-secondary" (click)="resetForm()">
                      <i data-feather="refresh-cw" appFeatherIcon class="me-1"></i>
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class IntegrationSettingsComponent implements OnInit {
  integrationForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.integrationForm = this.fb.group({
      // Facebook
      facebookAppId: [''],
      facebookAppSecret: [''],
      facebookEnabled: [false],
      
      // Twitter
      twitterApiKey: [''],
      twitterApiSecret: [''],
      twitterAccessToken: [''],
      twitterAccessTokenSecret: [''],
      twitterEnabled: [false],
      
      // LinkedIn
      linkedinClientId: [''],
      linkedinClientSecret: [''],
      linkedinEnabled: [false],
      
      // Instagram
      instagramAccessToken: [''],
      instagramBusinessId: [''],
      instagramEnabled: [false]
    });
  }

  ngOnInit(): void {
    this.loadIntegrationSettings();
  }

  loadIntegrationSettings(): void {
    // Load integration settings from service
    console.log('Loading integration settings...');
  }

  onSubmit(): void {
    if (this.integrationForm.valid) {
      console.log('Saving integration settings:', this.integrationForm.value);
      // Save settings via service
    }
  }

  testConnections(): void {
    console.log('Testing social media connections...');
    // Test API connections
  }

  resetForm(): void {
    this.integrationForm.reset();
  }
}