import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';

interface CampaignTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: any;
}

interface ScheduleOption {
  type: 'immediate' | 'scheduled' | 'recurring';
  startDate?: Date;
  endDate?: Date;
  frequency?: 'daily' | 'weekly' | 'monthly';
  days?: number[];
  time?: string;
}

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="campaign-form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2>{{ isEditMode ? 'Edit Campaign' : 'Create New Campaign' }}</h2>
          <p class="text-muted">{{ isEditMode ? 'Update your campaign settings' : 'Set up your marketing campaign' }}</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-outline-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
            Back
          </button>
          <button type="button" class="btn btn-outline-primary" (click)="saveDraft()" [disabled]="!campaignForm.valid">
            <i class="fas fa-save"></i>
            Save Draft
          </button>
          <button type="submit" class="btn btn-primary" form="campaignForm" [disabled]="!campaignForm.valid">
            <i class="fas fa-rocket"></i>
            {{ isEditMode ? 'Update Campaign' : 'Launch Campaign' }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="campaignForm" (ngSubmit)="onSubmit()" id="campaignForm">
        <div class="row">
          <!-- Main Content -->
          <div class="col-lg-8">
            <!-- Basic Information -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-info-circle"></i>
                  Basic Information
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="name" class="form-label">Campaign Name *</label>
                    <input type="text" 
                           class="form-control" 
                           id="name"
                           formControlName="name"
                           placeholder="Enter campaign name">
                    <div class="invalid-feedback" *ngIf="campaignForm.get('name')?.invalid && campaignForm.get('name')?.touched">
                      Campaign name is required
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="type" class="form-label">Campaign Type *</label>
                    <select class="form-select" 
                            id="type"
                            formControlName="type"
                            (change)="onTypeChange()">
                      <option value="">Select type</option>
                      <option value="email">Email Campaign</option>
                      <option value="sms">SMS Campaign</option>
                      <option value="mixed">Mixed Campaign</option>
                    </select>
                    <div class="invalid-feedback" *ngIf="campaignForm.get('type')?.invalid && campaignForm.get('type')?.touched">
                      Campaign type is required
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="description" class="form-label">Description</label>
                  <textarea class="form-control" 
                            id="description"
                            formControlName="description"
                            rows="3"
                            placeholder="Describe your campaign objectives and target audience"></textarea>
                </div>
                
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="category" class="form-label">Category</label>
                    <select class="form-select" 
                            id="category"
                            formControlName="category">
                      <option value="">Select category</option>
                      <option value="promotional">Promotional</option>
                      <option value="educational">Educational</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="announcement">Announcement</option>
                      <option value="follow-up">Follow-up</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="priority" class="form-label">Priority</label>
                    <select class="form-select" 
                            id="priority"
                            formControlName="priority">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="tags" class="form-label">Tags</label>
                  <input type="text" 
                         class="form-control" 
                         id="tags"
                         formControlName="tags"
                         placeholder="Enter tags separated by commas">
                  <small class="form-text text-muted">Use tags to organize and filter your campaigns</small>
                </div>
              </div>
            </div>

            <!-- Recipients -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-users"></i>
                  Target Audience
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">Recipient Groups *</label>
                  <div class="recipient-groups">
                    <div class="row">
                      <div class="col-md-8">
                        <select class="form-select" 
                                [(ngModel)]="selectedGroupId"
  >
                          <option value="">Select recipient group</option>
                          <option *ngFor="let group of recipientGroups" [value]="group.id">
                            {{ group.name }} ({{ group.count | number }} recipients)
                          </option>
                        </select>
                      </div>
                      <div class="col-md-4">
                        <button type="button" 
                                class="btn btn-outline-primary w-100"
                                (click)="addRecipientGroup()"
                                [disabled]="!selectedGroupId">
                          <i class="fas fa-plus"></i>
                          Add Group
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="selected-groups mt-3" *ngIf="selectedGroups.length > 0">
                    <h6>Selected Groups:</h6>
                    <div class="group-list">
                      <div class="group-item" *ngFor="let group of selectedGroups; let i = index">
                        <div class="group-info">
                          <strong>{{ group.name }}</strong>
                          <span class="text-muted">({{ group.count | number }} recipients)</span>
                        </div>
                        <button type="button" 
                                class="btn btn-sm btn-outline-danger"
                                (click)="removeRecipientGroup(i)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                    <div class="total-recipients mt-2">
                      <strong>Total Recipients: {{ getTotalRecipients() | number }}</strong>
                    </div>
                  </div>
                  
                  <div class="invalid-feedback" *ngIf="selectedGroups.length === 0 && formSubmitted">
                    At least one recipient group is required
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6">
                    <button type="button" class="btn btn-outline-secondary">
                      <i class="fas fa-plus"></i>
                      Create New Group
                    </button>
                  </div>
                  <div class="col-md-6">
                    <button type="button" class="btn btn-outline-info">
                      <i class="fas fa-upload"></i>
                      Import Recipients
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message Content -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-edit"></i>
                  Message Content
                </h5>
              </div>
              <div class="card-body">
                <!-- Template Selection -->
                <div class="mb-3">
                  <label class="form-label">Use Template (Optional)</label>
                  <div class="row">
                    <div class="col-md-8">
                      <select class="form-select" 
                              [(ngModel)]="selectedTemplateId"
                              [ngModelOptions]="{standalone: true}"
                              (change)="onTemplateSelect()">
                        <option value="">Select a template</option>
                        <option *ngFor="let template of availableTemplates" [value]="template.id">
                          {{ template.name }} ({{ template.type | titlecase }})
                        </option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <button type="button" class="btn btn-outline-primary w-100">
                        <i class="fas fa-plus"></i>
                        Create Template
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Email Content -->
                <div *ngIf="campaignForm.get('type')?.value === 'email' || campaignForm.get('type')?.value === 'mixed'">
                  <div class="mb-3">
                    <label for="subject" class="form-label">Email Subject *</label>
                    <input type="text" 
                           class="form-control" 
                           id="subject"
                           formControlName="subject"
                           placeholder="Enter email subject">
                    <div class="invalid-feedback" *ngIf="campaignForm.get('subject')?.invalid && campaignForm.get('subject')?.touched">
                      Email subject is required
                    </div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="emailContent" class="form-label">Email Content *</label>
                    <div class="content-editor">
                      <div class="editor-toolbar">
                        <button type="button" class="btn btn-sm btn-outline-secondary">
                          <i class="fas fa-bold"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary">
                          <i class="fas fa-italic"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary">
                          <i class="fas fa-underline"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary">
                          <i class="fas fa-link"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary">
                          <i class="fas fa-image"></i>
                        </button>
                      </div>
                      <textarea class="form-control" 
                                id="emailContent"
                                formControlName="emailContent"
                                rows="8"
                                placeholder="Enter your email content here..."></textarea>
                    </div>
                    <div class="invalid-feedback" *ngIf="campaignForm.get('emailContent')?.invalid && campaignForm.get('emailContent')?.touched">
                      Email content is required
                    </div>
                  </div>
                </div>

                <!-- SMS Content -->
                <div *ngIf="campaignForm.get('type')?.value === 'sms' || campaignForm.get('type')?.value === 'mixed'">
                  <div class="mb-3">
                    <label for="smsContent" class="form-label">SMS Content *</label>
                    <textarea class="form-control" 
                              id="smsContent"
                              formControlName="smsContent"
                              rows="4"
                              placeholder="Enter your SMS message..."
                              (input)="updateSmsCharCount()"></textarea>
                    <div class="d-flex justify-content-between">
                      <small class="form-text text-muted">
                        Characters: {{ smsCharCount }}/160 | Messages: {{ smsMessageCount }}
                      </small>
                      <div class="invalid-feedback" *ngIf="campaignForm.get('smsContent')?.invalid && campaignForm.get('smsContent')?.touched">
                        SMS content is required
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Variables -->
                <div class="mb-3" *ngIf="availableVariables.length > 0">
                  <label class="form-label">Available Variables</label>
                  <div class="variables-list">
                    <span class="variable-tag" 
                          *ngFor="let variable of availableVariables"
                          (click)="insertVariable(variable)">
                      {{ variable }}
                    </span>
                  </div>
                  <small class="form-text text-muted">Click on a variable to insert it into your content</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="col-lg-4">
            <!-- Schedule -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-calendar"></i>
                  Schedule
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" 
                           type="radio" 
                           name="scheduleType" 
                           id="immediate"
                           value="immediate"
                           formControlName="scheduleType">
                    <label class="form-check-label" for="immediate">
                      Send Immediately
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" 
                           type="radio" 
                           name="scheduleType" 
                           id="scheduled"
                           value="scheduled"
                           formControlName="scheduleType">
                    <label class="form-check-label" for="scheduled">
                      Schedule for Later
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" 
                           type="radio" 
                           name="scheduleType" 
                           id="recurring"
                           value="recurring"
                           formControlName="scheduleType">
                    <label class="form-check-label" for="recurring">
                      Recurring Campaign
                    </label>
                  </div>
                </div>

                <div *ngIf="campaignForm.get('scheduleType')?.value === 'scheduled'">
                  <div class="mb-3">
                    <label for="startDate" class="form-label">Start Date & Time</label>
                    <input type="datetime-local" 
                           class="form-control" 
                           id="startDate"
                           formControlName="startDate">
                  </div>
                </div>

                <div *ngIf="campaignForm.get('scheduleType')?.value === 'recurring'">
                  <div class="mb-3">
                    <label for="frequency" class="form-label">Frequency</label>
                    <select class="form-select" 
                            id="frequency"
                            formControlName="frequency">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div class="mb-3">
                    <label for="recurringStartDate" class="form-label">Start Date</label>
                    <input type="date" 
                           class="form-control" 
                           id="recurringStartDate"
                           formControlName="recurringStartDate">
                  </div>
                  
                  <div class="mb-3">
                    <label for="recurringEndDate" class="form-label">End Date (Optional)</label>
                    <input type="date" 
                           class="form-control" 
                           id="recurringEndDate"
                           formControlName="recurringEndDate">
                  </div>
                </div>
              </div>
            </div>

            <!-- Settings -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-cog"></i>
                  Settings
                </h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="budget" class="form-label">Budget (Optional)</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input type="number" 
                           class="form-control" 
                           id="budget"
                           formControlName="budget"
                           placeholder="0.00"
                           step="0.01">
                  </div>
                </div>

                <div class="mb-3">
                  <div class="form-check">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="trackOpens"
                           formControlName="trackOpens">
                    <label class="form-check-label" for="trackOpens">
                      Track Opens
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="trackClicks"
                           formControlName="trackClicks">
                    <label class="form-check-label" for="trackClicks">
                      Track Clicks
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" 
                           type="checkbox" 
                           id="allowUnsubscribe"
                           formControlName="allowUnsubscribe">
                    <label class="form-check-label" for="allowUnsubscribe">
                      Include Unsubscribe Link
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">
                  <i class="fas fa-eye"></i>
                  Preview
                </h5>
              </div>
              <div class="card-body">
                <button type="button" class="btn btn-outline-primary w-100 mb-2" (click)="previewEmail()" 
                        *ngIf="campaignForm.get('type')?.value === 'email' || campaignForm.get('type')?.value === 'mixed'">
                  <i class="fas fa-envelope"></i>
                  Preview Email
                </button>
                <button type="button" class="btn btn-outline-primary w-100 mb-2" (click)="previewSms()"
                        *ngIf="campaignForm.get('type')?.value === 'sms' || campaignForm.get('type')?.value === 'mixed'">
                  <i class="fas fa-sms"></i>
                  Preview SMS
                </button>
                <button type="button" class="btn btn-outline-secondary w-100" (click)="sendTestMessage()">
                  <i class="fas fa-paper-plane"></i>
                  Send Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .campaign-form-container {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-content h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .card-header h5 {
      color: #495057;
    }

    .card-header i {
      margin-right: 0.5rem;
      color: #6c757d;
    }

    .recipient-groups .group-list {
      border: 1px solid #e9ecef;
      border-radius: 0.375rem;
      padding: 1rem;
      background-color: #f8f9fa;
    }

    .group-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .group-item:last-child {
      border-bottom: none;
    }

    .group-info {
      flex-grow: 1;
    }

    .total-recipients {
      padding: 0.75rem;
      background-color: #e7f3ff;
      border-radius: 0.375rem;
      text-align: center;
    }

    .content-editor {
      border: 1px solid #ced4da;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .editor-toolbar {
      background-color: #f8f9fa;
      padding: 0.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      gap: 0.25rem;
    }

    .editor-toolbar .btn {
      border: none;
      padding: 0.25rem 0.5rem;
    }

    .content-editor textarea {
      border: none;
      border-radius: 0;
    }

    .content-editor textarea:focus {
      box-shadow: none;
    }

    .variables-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .variable-tag {
      background-color: #e9ecef;
      color: #495057;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .variable-tag:hover {
      background-color: #dee2e6;
    }

    .form-check {
      margin-bottom: 0.75rem;
    }

    .form-check-label {
      font-weight: 500;
    }

    .invalid-feedback {
      display: block;
    }

    @media (max-width: 768px) {
      .campaign-form-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-actions {
        justify-content: center;
      }

      .variables-list {
        flex-direction: column;
      }

      .variable-tag {
        text-align: center;
      }
    }
  `]
})
export class CampaignFormComponent implements OnInit, OnDestroy {
  campaignForm: FormGroup;
  isEditMode = false;
  campaignId?: string;
  formSubmitted = false;
  
  recipientGroups: RecipientGroup[] = [];
  selectedGroups: RecipientGroup[] = [];
  selectedGroupId = '';
  
  availableTemplates: CampaignTemplate[] = [];
  selectedTemplateId = '';
  
  availableVariables = ['{{firstName}}', '{{lastName}}', '{{email}}', '{{company}}', '{{phone}}'];
  
  smsCharCount = 0;
  smsMessageCount = 1;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private messagesService: MessagesService
  ) {
    this.campaignForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.campaignId = params['id'];
        if (this.campaignId) {
          this.loadCampaign(this.campaignId);
        }
      }
    });
    
    this.loadRecipientGroups();
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      category: [''],
      priority: ['medium'],
      tags: [''],
      subject: [''],
      emailContent: [''],
      smsContent: [''],
      scheduleType: ['immediate'],
      startDate: [''],
      frequency: ['weekly'],
      recurringStartDate: [''],
      recurringEndDate: [''],
      budget: [''],
      trackOpens: [true],
      trackClicks: [true],
      allowUnsubscribe: [true]
    });
  }

  loadCampaign(id: string): void {
    this.messagesService.getCampaign(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (campaign) => {
        this.campaignForm.patchValue(campaign);
        // Load selected groups, etc.
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
      }
    });
  }

  loadRecipientGroups(): void {
    // Mock recipient groups for now - implement getRecipientGroups in MessagesService if needed
    this.recipientGroups = [
      { id: '1', name: 'All Clients', description: 'All registered clients', count: 150, criteria: {} },
      { id: '2', name: 'Active Clients', description: 'Clients with active cases', count: 85, criteria: { status: 'active' } },
      { id: '3', name: 'New Clients', description: 'Recently registered clients', count: 25, criteria: { created: 'last_30_days' } }
    ];
  }

  loadTemplates(): void {
    this.messagesService.getTemplates().pipe(takeUntil(this.destroy$)).subscribe({
      next: (templates) => {
        const templateData = Array.isArray(templates) ? templates : templates.data || [];
        this.availableTemplates = templateData as any[];
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  onTypeChange(): void {
    const type = this.campaignForm.get('type')?.value;
    
    // Update validators based on type
    if (type === 'email' || type === 'mixed') {
      this.campaignForm.get('subject')?.setValidators([Validators.required]);
      this.campaignForm.get('emailContent')?.setValidators([Validators.required]);
    } else {
      this.campaignForm.get('subject')?.clearValidators();
      this.campaignForm.get('emailContent')?.clearValidators();
    }
    
    if (type === 'sms' || type === 'mixed') {
      this.campaignForm.get('smsContent')?.setValidators([Validators.required]);
    } else {
      this.campaignForm.get('smsContent')?.clearValidators();
    }
    
    this.campaignForm.get('subject')?.updateValueAndValidity();
    this.campaignForm.get('emailContent')?.updateValueAndValidity();
    this.campaignForm.get('smsContent')?.updateValueAndValidity();
  }

  onTemplateSelect(): void {
    if (this.selectedTemplateId) {
      const template = this.availableTemplates.find(t => t.id === this.selectedTemplateId);
      if (template) {
        if (template.type === 'email') {
          this.campaignForm.patchValue({
            subject: template.subject,
            emailContent: template.content
          });
        } else if (template.type === 'sms') {
          this.campaignForm.patchValue({
            smsContent: template.content
          });
        }
      }
    }
  }

  addRecipientGroup(): void {
    if (this.selectedGroupId) {
      const group = this.recipientGroups.find(g => g.id === this.selectedGroupId);
      if (group && !this.selectedGroups.find(g => g.id === group.id)) {
        this.selectedGroups.push(group);
        this.selectedGroupId = '';
      }
    }
  }

  removeRecipientGroup(index: number): void {
    this.selectedGroups.splice(index, 1);
  }

  getTotalRecipients(): number {
    return this.selectedGroups.reduce((total, group) => total + group.count, 0);
  }

  updateSmsCharCount(): void {
    const content = this.campaignForm.get('smsContent')?.value || '';
    this.smsCharCount = content.length;
    this.smsMessageCount = Math.ceil(this.smsCharCount / 160) || 1;
  }

  insertVariable(variable: string): void {
    // Insert variable at cursor position in active textarea
    const activeElement = document.activeElement as HTMLTextAreaElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;
      const newValue = value.substring(0, start) + variable + value.substring(end);
      
      // Update form control
      const controlName = activeElement.getAttribute('formControlName');
      if (controlName) {
        this.campaignForm.get(controlName)?.setValue(newValue);
      }
      
      // Update SMS char count if SMS content
      if (controlName === 'smsContent') {
        this.updateSmsCharCount();
      }
    }
  }

  previewEmail(): void {
    // Open email preview modal
    console.log('Preview email');
  }

  previewSms(): void {
    // Open SMS preview modal
    console.log('Preview SMS');
  }

  sendTestMessage(): void {
    // Open test message modal
    console.log('Send test message');
  }

  saveDraft(): void {
    if (this.campaignForm.valid && this.selectedGroups.length > 0) {
      const formData = this.prepareCampaignData();
      formData.status = 'draft';
      
      const request = this.isEditMode 
        ? this.messagesService.updateCampaign(this.campaignId!, formData)
        : this.messagesService.createCampaign(formData);
      
      request.subscribe({
        next: () => {
          console.log('Campaign saved as draft');
          this.router.navigate(['/messages/campaigns']);
        },
        error: (error) => {
          console.error('Error saving campaign:', error);
        }
      });
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.campaignForm.valid && this.selectedGroups.length > 0) {
      const formData = this.prepareCampaignData();
      formData.status = 'active';
      
      const request = this.isEditMode 
        ? this.messagesService.updateCampaign(this.campaignId!, formData)
        : this.messagesService.createCampaign(formData);
      
      request.subscribe({
        next: () => {
          console.log('Campaign created/updated successfully');
          this.router.navigate(['/messages/campaigns']);
        },
        error: (error) => {
          console.error('Error creating/updating campaign:', error);
        }
      });
    }
  }

  prepareCampaignData(): any {
    const formValue = this.campaignForm.value;
    
    return {
      ...formValue,
      recipientGroups: this.selectedGroups.map(g => g.id),
      totalRecipients: this.getTotalRecipients(),
      tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : []
    };
  }

  goBack(): void {
    this.router.navigate(['/messages/campaigns']);
  }
}