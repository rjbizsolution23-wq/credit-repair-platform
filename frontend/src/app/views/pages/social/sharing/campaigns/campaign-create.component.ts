import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-campaign-create',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FeatherIconDirective,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="card-title">Create New Campaign</h4>
              <button class="btn btn-outline-secondary" (click)="goBack()">
                <i data-feather="arrow-left" appFeatherIcon></i>
                Back to Campaigns
              </button>
            </div>
            
            <form [formGroup]="campaignForm" (ngSubmit)="onSubmit()">
              <!-- Campaign Basic Info -->
              <div class="row">
                <div class="col-md-8">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Campaign Details</h6>
                      
                      <div class="mb-3">
                        <label class="form-label">Campaign Name *</label>
                        <input type="text" class="form-control" formControlName="name" 
                               placeholder="Enter campaign name">
                        <div *ngIf="campaignForm.get('name')?.invalid && campaignForm.get('name')?.touched" 
                             class="text-danger small">
                          Campaign name is required
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" rows="3" formControlName="description"
                                  placeholder="Describe your campaign goals and target audience"></textarea>
                      </div>
                      
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Campaign Type *</label>
                            <select class="form-select" formControlName="type">
                              <option value="">Select campaign type</option>
                              <option value="awareness">Brand Awareness</option>
                              <option value="lead-generation">Lead Generation</option>
                              <option value="engagement">Engagement</option>
                              <option value="conversion">Conversion</option>
                              <option value="retention">Customer Retention</option>
                            </select>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Budget</label>
                            <div class="input-group">
                              <span class="input-group-text">$</span>
                              <input type="number" class="form-control" formControlName="budget"
                                     placeholder="0.00" min="0" step="0.01">
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Start Date *</label>
                            <input type="date" class="form-control" formControlName="startDate">
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" formControlName="endDate">
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Content Planning -->
                  <div class="card mt-4">
                    <div class="card-body">
                      <h6 class="card-title">Content Planning</h6>
                      
                      <div class="mb-3">
                        <label class="form-label">Content Themes</label>
                        <div class="row">
                          <div class="col-md-4" *ngFor="let theme of contentThemes">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" 
                                     [value]="theme.value" [id]="theme.value"
                                     (change)="onThemeChange($event, theme.value)">
                              <label class="form-check-label" [for]="theme.value">
                                {{ theme.label }}
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Posting Frequency</label>
                        <select class="form-select" formControlName="postingFrequency">
                          <option value="daily">Daily</option>
                          <option value="every-other-day">Every Other Day</option>
                          <option value="weekly">Weekly</option>
                          <option value="bi-weekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Content Calendar Notes</label>
                        <textarea class="form-control" rows="3" formControlName="contentNotes"
                                  placeholder="Add any specific content requirements or notes"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Campaign Settings -->
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Platform Selection</h6>
                      
                      <div class="mb-3">
                        <label class="form-label">Target Platforms *</label>
                        <div *ngFor="let platform of socialPlatforms" class="form-check">
                          <input class="form-check-input" type="checkbox" 
                                 [value]="platform.value" [id]="platform.value"
                                 (change)="onPlatformChange($event, platform.value)">
                          <label class="form-check-label d-flex align-items-center" [for]="platform.value">
                            <i [attr.data-feather]="platform.icon" appFeatherIcon class="me-2"></i>
                            {{ platform.label }}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="card mt-4">
                    <div class="card-body">
                      <h6 class="card-title">Target Audience</h6>
                      
                      <div class="mb-3">
                        <label class="form-label">Age Range</label>
                        <div class="row">
                          <div class="col-6">
                            <input type="number" class="form-control" formControlName="ageMin"
                                   placeholder="Min" min="18" max="100">
                          </div>
                          <div class="col-6">
                            <input type="number" class="form-control" formControlName="ageMax"
                                   placeholder="Max" min="18" max="100">
                          </div>
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Gender</label>
                        <select class="form-select" formControlName="gender">
                          <option value="all">All</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Location</label>
                        <input type="text" class="form-control" formControlName="location"
                               placeholder="e.g., United States, California">
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Interests</label>
                        <textarea class="form-control" rows="3" formControlName="interests"
                                  placeholder="Credit repair, personal finance, real estate..."></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <div class="card mt-4">
                    <div class="card-body">
                      <h6 class="card-title">Campaign Goals</h6>
                      
                      <div class="mb-3">
                        <label class="form-label">Primary Goal</label>
                        <select class="form-select" formControlName="primaryGoal">
                          <option value="">Select primary goal</option>
                          <option value="brand-awareness">Increase Brand Awareness</option>
                          <option value="lead-generation">Generate Leads</option>
                          <option value="website-traffic">Drive Website Traffic</option>
                          <option value="engagement">Boost Engagement</option>
                          <option value="conversions">Increase Conversions</option>
                        </select>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Target Metrics</label>
                        <div class="row">
                          <div class="col-12 mb-2">
                            <div class="input-group input-group-sm">
                              <span class="input-group-text">Reach</span>
                              <input type="number" class="form-control" formControlName="targetReach">
                            </div>
                          </div>
                          <div class="col-12 mb-2">
                            <div class="input-group input-group-sm">
                              <span class="input-group-text">Engagement</span>
                              <input type="number" class="form-control" formControlName="targetEngagement">
                            </div>
                          </div>
                          <div class="col-12">
                            <div class="input-group input-group-sm">
                              <span class="input-group-text">Leads</span>
                              <input type="number" class="form-control" formControlName="targetLeads">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Form Actions -->
              <div class="row mt-4">
                <div class="col-md-12">
                  <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-outline-secondary" (click)="saveDraft()">
                      <i data-feather="save" appFeatherIcon></i>
                      Save as Draft
                    </button>
                    <button type="submit" class="btn btn-primary" [disabled]="campaignForm.invalid">
                      <i data-feather="play" appFeatherIcon></i>
                      Launch Campaign
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CampaignCreateComponent implements OnInit {
  campaignForm: FormGroup;
  selectedThemes: string[] = [];
  selectedPlatforms: string[] = [];
  
  contentThemes = [
    { value: 'educational', label: 'Educational Content' },
    { value: 'success-stories', label: 'Success Stories' },
    { value: 'tips', label: 'Credit Tips' },
    { value: 'industry-news', label: 'Industry News' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'behind-scenes', label: 'Behind the Scenes' }
  ];
  
  socialPlatforms = [
    { value: 'facebook', label: 'Facebook', icon: 'facebook' },
    { value: 'twitter', label: 'Twitter', icon: 'twitter' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { value: 'instagram', label: 'Instagram', icon: 'instagram' },
    { value: 'youtube', label: 'YouTube', icon: 'youtube' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      budget: [0],
      startDate: ['', Validators.required],
      endDate: [''],
      postingFrequency: ['weekly'],
      contentNotes: [''],
      ageMin: [25],
      ageMax: [65],
      gender: ['all'],
      location: [''],
      interests: [''],
      primaryGoal: [''],
      targetReach: [0],
      targetEngagement: [0],
      targetLeads: [0]
    });
  }

  ngOnInit(): void {
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    this.campaignForm.patchValue({ startDate: today });
  }
  
  onThemeChange(event: any, theme: string): void {
    if (event.target.checked) {
      this.selectedThemes.push(theme);
    } else {
      this.selectedThemes = this.selectedThemes.filter(t => t !== theme);
    }
  }
  
  onPlatformChange(event: any, platform: string): void {
    if (event.target.checked) {
      this.selectedPlatforms.push(platform);
    } else {
      this.selectedPlatforms = this.selectedPlatforms.filter(p => p !== platform);
    }
  }
  
  onSubmit(): void {
    if (this.campaignForm.valid) {
      const campaignData = {
        ...this.campaignForm.value,
        themes: this.selectedThemes,
        platforms: this.selectedPlatforms,
        status: 'active'
      };
      
      console.log('Creating campaign:', campaignData);
      // Here you would typically call a service to create the campaign
      
      // Navigate back to campaigns list
      this.router.navigate(['/social/sharing/campaigns']);
    }
  }
  
  saveDraft(): void {
    const campaignData = {
      ...this.campaignForm.value,
      themes: this.selectedThemes,
      platforms: this.selectedPlatforms,
      status: 'draft'
    };
    
    console.log('Saving campaign draft:', campaignData);
    // Here you would typically call a service to save the draft
  }
  
  goBack(): void {
    this.router.navigate(['/social/sharing/campaigns']);
  }
}