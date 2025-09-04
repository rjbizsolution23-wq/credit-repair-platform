import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';

@Component({
  selector: 'app-template-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h4 class="card-title">Create Social Media Template</h4>
              <button class="btn btn-outline-secondary" (click)="goBack()">
                <i data-feather="arrow-left" appFeatherIcon></i>
                Back to Templates
              </button>
            </div>
            
            <form [formGroup]="templateForm" (ngSubmit)="onSubmit()">
              <div class="row">
                <!-- Template Basic Information -->
                <div class="col-md-8">
                  <div class="card">
                    <div class="card-header">
                      <h5 class="mb-0">Template Information</h5>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label for="templateName" class="form-label">Template Name *</label>
                          <input type="text" 
                                 class="form-control" 
                                 id="templateName"
                                 formControlName="name"
                                 placeholder="Enter template name">
                          <div *ngIf="templateForm.get('name')?.invalid && templateForm.get('name')?.touched" 
                               class="text-danger small mt-1">
                            Template name is required
                          </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                          <label for="templateCategory" class="form-label">Category *</label>
                          <select class="form-select" 
                                  id="templateCategory"
                                  formControlName="category">
                            <option value="">Select category</option>
                            <option value="promotional">Promotional</option>
                            <option value="educational">Educational</option>
                            <option value="announcement">Announcement</option>
                            <option value="testimonial">Testimonial</option>
                            <option value="seasonal">Seasonal</option>
                            <option value="engagement">Engagement</option>
                            <option value="other">Other</option>
                          </select>
                          <div *ngIf="templateForm.get('category')?.invalid && templateForm.get('category')?.touched" 
                               class="text-danger small mt-1">
                            Category is required
                          </div>
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <label for="templateDescription" class="form-label">Description</label>
                        <textarea class="form-control" 
                                  id="templateDescription"
                                  formControlName="description"
                                  rows="3"
                                  placeholder="Describe the purpose and use case of this template"></textarea>
                      </div>
                      
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Target Platforms *</label>
                          <div class="d-flex flex-wrap gap-2">
                            <div class="form-check" *ngFor="let platform of availablePlatforms">
                              <input class="form-check-input" 
                                     type="checkbox" 
                                     [id]="'platform-' + platform.value"
                                     [value]="platform.value"
                                     (change)="onPlatformChange($event)">
                              <label class="form-check-label" [for]="'platform-' + platform.value">
                                <i [attr.data-feather]="platform.icon" appFeatherIcon class="me-1"></i>
                                {{ platform.label }}
                              </label>
                            </div>
                          </div>
                          <div *ngIf="selectedPlatforms.length === 0 && templateForm.touched" 
                               class="text-danger small mt-1">
                            At least one platform must be selected
                          </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                          <label for="templateTags" class="form-label">Tags</label>
                          <input type="text" 
                                 class="form-control" 
                                 id="templateTags"
                                 formControlName="tags"
                                 placeholder="Enter tags separated by commas">
                          <small class="text-muted">Separate tags with commas (e.g., credit repair, finance, tips)</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Content Section -->
                  <div class="card mt-4">
                    <div class="card-header">
                      <h5 class="mb-0">Template Content</h5>
                    </div>
                    <div class="card-body">
                      <div class="mb-3">
                        <label for="templateTitle" class="form-label">Post Title/Headline</label>
                        <input type="text" 
                               class="form-control" 
                               id="templateTitle"
                               formControlName="title"
                               placeholder="Enter post title or headline">
                      </div>
                      
                      <div class="mb-3">
                        <label for="templateContent" class="form-label">Content *</label>
                        <textarea class="form-control" 
                                  id="templateContent"
                                  formControlName="content"
                                  rows="8"
                                  placeholder="Write your template content here. Use {{ '{' }}variables{{ '}' }} for dynamic content."></textarea>
                        <div *ngIf="templateForm.get('content')?.invalid && templateForm.get('content')?.touched" 
                             class="text-danger small mt-1">
                          Content is required
                        </div>
                        <small class="text-muted">
                          Use variables like {{ '{' }}company_name{{ '}' }}, {{ '{' }}customer_name{{ '}' }}, {{ '{' }}service_name{{ '}' }} for personalization
                        </small>
                      </div>
                      
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label for="templateHashtags" class="form-label">Default Hashtags</label>
                          <input type="text" 
                                 class="form-control" 
                                 id="templateHashtags"
                                 formControlName="hashtags"
                                 placeholder="#creditrepair #finance #tips">
                          <small class="text-muted">Include # symbol for each hashtag</small>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                          <label for="templateCta" class="form-label">Call to Action</label>
                          <input type="text" 
                                 class="form-control" 
                                 id="templateCta"
                                 formControlName="callToAction"
                                 placeholder="Learn more at our website">
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Media Section -->
                  <div class="card mt-4">
                    <div class="card-header">
                      <h5 class="mb-0">Media & Design</h5>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Template Type</label>
                          <div class="d-flex gap-3">
                            <div class="form-check">
                              <input class="form-check-input" 
                                     type="radio" 
                                     name="templateType" 
                                     id="textOnly"
                                     value="text"
                                     formControlName="type">
                              <label class="form-check-label" for="textOnly">
                                <i data-feather="type" appFeatherIcon class="me-1"></i>
                                Text Only
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" 
                                     type="radio" 
                                     name="templateType" 
                                     id="withImage"
                                     value="image"
                                     formControlName="type">
                              <label class="form-check-label" for="withImage">
                                <i data-feather="image" appFeatherIcon class="me-1"></i>
                                With Image
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" 
                                     type="radio" 
                                     name="templateType" 
                                     id="withVideo"
                                     value="video"
                                     formControlName="type">
                              <label class="form-check-label" for="withVideo">
                                <i data-feather="video" appFeatherIcon class="me-1"></i>
                                With Video
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                          <label for="templateImageUrl" class="form-label">Default Image URL</label>
                          <input type="url" 
                                 class="form-control" 
                                 id="templateImageUrl"
                                 formControlName="imageUrl"
                                 placeholder="https://example.com/image.jpg">
                          <small class="text-muted">Optional: Default image for this template</small>
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <label for="designNotes" class="form-label">Design Notes</label>
                        <textarea class="form-control" 
                                  id="designNotes"
                                  formControlName="designNotes"
                                  rows="3"
                                  placeholder="Any specific design guidelines or notes for this template"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Preview and Actions -->
                <div class="col-md-4">
                  <div class="card sticky-top">
                    <div class="card-header">
                      <h5 class="mb-0">Template Preview</h5>
                    </div>
                    <div class="card-body">
                      <div class="border rounded p-3 mb-3" style="min-height: 200px; background-color: #f8f9fa;">
                        <div *ngIf="templateForm.get('title')?.value" class="fw-bold mb-2">
                          {{ templateForm.get('title')?.value }}
                        </div>
                        <div *ngIf="templateForm.get('content')?.value" class="mb-2">
                          {{ getPreviewContent() }}
                        </div>
                        <div *ngIf="templateForm.get('hashtags')?.value" class="text-primary small">
                          {{ templateForm.get('hashtags')?.value }}
                        </div>
                        <div *ngIf="templateForm.get('callToAction')?.value" class="mt-2">
                          <small class="text-muted">{{ templateForm.get('callToAction')?.value }}</small>
                        </div>
                        <div *ngIf="!templateForm.get('title')?.value && !templateForm.get('content')?.value" 
                             class="text-muted text-center">
                          <i data-feather="eye" appFeatherIcon class="mb-2"></i>
                          <p>Preview will appear here as you type</p>
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <label class="form-label">Selected Platforms:</label>
                        <div class="d-flex flex-wrap gap-1">
                          <span *ngFor="let platform of selectedPlatforms" 
                                class="badge bg-primary">
                            {{ getPlatformLabel(platform) }}
                          </span>
                          <span *ngIf="selectedPlatforms.length === 0" 
                                class="text-muted small">
                            No platforms selected
                          </span>
                        </div>
                      </div>
                      
                      <div class="d-grid gap-2">
                        <button type="submit" 
                                class="btn btn-primary"
                                [disabled]="templateForm.invalid || selectedPlatforms.length === 0">
                          <i data-feather="save" appFeatherIcon class="me-2"></i>
                          Save Template
                        </button>
                        
                        <button type="button" 
                                class="btn btn-outline-secondary"
                                (click)="saveAsDraft()">
                          <i data-feather="file-text" appFeatherIcon class="me-2"></i>
                          Save as Draft
                        </button>
                        
                        <button type="button" 
                                class="btn btn-outline-info"
                                (click)="previewTemplate()">
                          <i data-feather="eye" appFeatherIcon class="me-2"></i>
                          Full Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sticky-top {
      top: 20px;
    }
    
    .form-check-input:checked + .form-check-label {
      color: #0d6efd;
    }
    
    .badge {
      font-size: 0.75em;
    }
  `]
})
export class TemplateCreateComponent implements OnInit {
  templateForm: FormGroup;
  selectedPlatforms: string[] = [];
  
  availablePlatforms = [
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
    this.templateForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      title: [''],
      content: ['', Validators.required],
      hashtags: [''],
      callToAction: [''],
      tags: [''],
      type: ['text'],
      imageUrl: [''],
      designNotes: ['']
    });
  }

  ngOnInit(): void {
    // Initialize form with default values if needed
  }
  
  onPlatformChange(event: any): void {
    const platform = event.target.value;
    const isChecked = event.target.checked;
    
    if (isChecked) {
      this.selectedPlatforms.push(platform);
    } else {
      this.selectedPlatforms = this.selectedPlatforms.filter(p => p !== platform);
    }
  }
  
  getPlatformLabel(platform: string): string {
    const found = this.availablePlatforms.find(p => p.value === platform);
    return found ? found.label : platform;
  }
  
  getPreviewContent(): string {
    const content = this.templateForm.get('content')?.value || '';
    // Replace variables with sample data for preview
    return content
      .replace(/{company_name}/g, 'Your Company')
      .replace(/{customer_name}/g, 'John Doe')
      .replace(/{service_name}/g, 'Credit Repair Service')
      .slice(0, 200) + (content.length > 200 ? '...' : '');
  }
  
  onSubmit(): void {
    if (this.templateForm.valid && this.selectedPlatforms.length > 0) {
      const templateData = {
        ...this.templateForm.value,
        platforms: this.selectedPlatforms,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating template:', templateData);
      
      // In a real app, this would call a service to save the template
      alert('Template created successfully!');
      this.router.navigate(['/social/sharing/templates']);
    } else {
      // Mark all fields as touched to show validation errors
      this.templateForm.markAllAsTouched();
      
      if (this.selectedPlatforms.length === 0) {
        alert('Please select at least one platform for this template.');
      }
    }
  }
  
  saveAsDraft(): void {
    const templateData = {
      ...this.templateForm.value,
      platforms: this.selectedPlatforms,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    
    console.log('Saving template as draft:', templateData);
    
    // In a real app, this would call a service to save the draft
    alert('Template saved as draft!');
    this.router.navigate(['/social/sharing/templates']);
  }
  
  previewTemplate(): void {
    if (this.templateForm.get('content')?.value) {
      // Open a modal or navigate to a preview page
      console.log('Opening template preview');
      alert('Template preview functionality would open here');
    } else {
      alert('Please add some content to preview the template.');
    }
  }
  
  goBack(): void {
    this.router.navigate(['/social/sharing/templates']);
  }
}