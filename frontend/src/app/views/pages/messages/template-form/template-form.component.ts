import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';

interface MessageTemplate {
  id?: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'sms' | 'notification';
  category: string;
  tags: string[];
  isActive: boolean;
  variables: string[];
}

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="template-form-container">
      <!-- Header -->
      <div class="form-header">
        <div class="header-content">
          <h2>{{ isEditMode ? 'Edit Template' : 'Create New Template' }}</h2>
          <p class="text-muted">{{ isEditMode ? 'Update your message template' : 'Create a reusable message template' }}</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-outline-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i>
            Back
          </button>
          <button type="button" class="btn btn-outline-info" (click)="previewTemplate()" [disabled]="templateForm.invalid">
            <i class="fas fa-eye"></i>
            Preview
          </button>
          <button type="submit" form="templateForm" class="btn btn-primary" [disabled]="templateForm.invalid || saving">
            <i class="fas fa-save"></i>
            {{ saving ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>

      <!-- Form -->
      <form id="templateForm" [formGroup]="templateForm" (ngSubmit)="saveTemplate()">
        <div class="row">
          <!-- Left Column -->
          <div class="col-lg-8">
            <!-- Basic Information -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Basic Information</h5>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="name" class="form-label">Template Name *</label>
                    <input type="text" 
                           id="name"
                           class="form-control" 
                           formControlName="name"
                           placeholder="Enter template name">
                    <div class="invalid-feedback" *ngIf="templateForm.get('name')?.invalid && templateForm.get('name')?.touched">
                      Template name is required
                    </div>
                  </div>
                  <div class="col-md-3">
                    <label for="type" class="form-label">Type *</label>
                    <select id="type" class="form-select" formControlName="type">
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="notification">Notification</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label for="category" class="form-label">Category *</label>
                    <select id="category" class="form-select" formControlName="category">
                      <option value="welcome">Welcome</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="reminder">Reminder</option>
                      <option value="notification">Notification</option>
                      <option value="marketing">Marketing</option>
                      <option value="support">Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div class="row g-3 mt-2">
                  <div class="col-12" *ngIf="templateForm.get('type')?.value !== 'sms'">
                    <label for="subject" class="form-label">Subject *</label>
                    <input type="text" 
                           id="subject"
                           class="form-control" 
                           formControlName="subject"
                           placeholder="Enter subject line">
                    <div class="invalid-feedback" *ngIf="templateForm.get('subject')?.invalid && templateForm.get('subject')?.touched">
                      Subject is required for email and notification templates
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">Content</h5>
                <div class="content-tools">
                  <button type="button" class="btn btn-sm btn-outline-secondary" (click)="insertVariable()">
                    <i class="fas fa-code"></i>
                    Insert Variable
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" (click)="formatText('bold')">
                    <i class="fas fa-bold"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" (click)="formatText('italic')">
                    <i class="fas fa-italic"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" (click)="formatText('underline')">
                    <i class="fas fa-underline"></i>
                  </button>
                </div>
              </div>
              <div class="card-body">
                <textarea id="content"
                          class="form-control content-editor" 
                          formControlName="content"
                          [placeholder]="getContentPlaceholder()"
                          rows="12"
                          (input)="updateCharacterCount()"></textarea>
                <div class="content-footer">
                  <div class="character-count">
                    <span [class.text-warning]="characterCount > characterLimit * 0.8"
                          [class.text-danger]="characterCount > characterLimit">
                      {{ characterCount }} / {{ characterLimit }} characters
                    </span>
                  </div>
                  <div class="content-help">
                    <small class="text-muted">
                      Use variables like {{'{{'}}firstName{{'}}'}}, {{'{{'}}lastName{{'}}'}}, {{'{{'}}companyName{{'}}'}} to personalize messages
                    </small>
                  </div>
                </div>
                <div class="invalid-feedback" *ngIf="templateForm.get('content')?.invalid && templateForm.get('content')?.touched">
                  Content is required
                </div>
              </div>
            </div>

            <!-- Variables -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Variables</h5>
              </div>
              <div class="card-body">
                <div class="variables-section">
                  <div class="detected-variables" *ngIf="detectedVariables.length > 0">
                    <h6>Detected Variables</h6>
                    <div class="variable-tags">
                      <span class="badge bg-primary me-2 mb-2" *ngFor="let variable of detectedVariables">
                        {{'{{'}}{{ variable }}{{'}}'}}
                      </span>
                    </div>
                  </div>
                  
                  <div class="common-variables mt-3">
                    <h6>Common Variables</h6>
                    <div class="variable-buttons">
                      <button type="button" 
                              class="btn btn-sm btn-outline-primary me-2 mb-2"
                              *ngFor="let variable of commonVariables"
                              (click)="insertVariableAtCursor(variable)">
                        {{'{{'}}{{ variable }}{{'}}'}}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="col-lg-4">
            <!-- Settings -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Settings</h5>
              </div>
              <div class="card-body">
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" 
                         type="checkbox" 
                         id="isActive"
                         formControlName="isActive">
                  <label class="form-check-label" for="isActive">
                    Active Template
                  </label>
                  <small class="form-text text-muted d-block">
                    Only active templates can be used in messages
                  </small>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Tags</h5>
              </div>
              <div class="card-body">
                <div class="tags-input-group">
                  <input type="text" 
                         class="form-control" 
                         placeholder="Add tags..."
                         [(ngModel)]="newTag"
                         [ngModelOptions]="{standalone: true}"
                         (keydown.enter)="addTag($event)"
                         (keydown.comma)="addTag($event)">
                  <button type="button" class="btn btn-outline-secondary" (click)="addTag()">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                <div class="tags-list mt-2" *ngIf="tags.length > 0">
                  <span class="tag" *ngFor="let tag of tags; let i = index">
                    {{ tag }}
                    <button type="button" class="tag-remove" (click)="removeTag(i)">
                      <i class="fas fa-times"></i>
                    </button>
                  </span>
                </div>
                <small class="form-text text-muted">
                  Press Enter or comma to add tags
                </small>
              </div>
            </div>

            <!-- Preview -->
            <div class="card" *ngIf="showPreview">
              <div class="card-header">
                <h5 class="card-title mb-0">Preview</h5>
              </div>
              <div class="card-body">
                <div class="preview-content">
                  <div class="preview-subject" *ngIf="templateForm.get('subject')?.value">
                    <strong>Subject:</strong> {{ templateForm.get('subject')?.value }}
                  </div>
                  <div class="preview-body" [innerHTML]="getPreviewContent()"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .template-form-container {
      padding: 1.5rem;
    }

    .form-header {
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

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .content-editor {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      resize: vertical;
    }

    .content-tools {
      display: flex;
      gap: 0.25rem;
    }

    .content-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e0e0e0;
    }

    .character-count {
      font-size: 0.875rem;
    }

    .variables-section h6 {
      margin-bottom: 0.75rem;
      font-weight: 600;
    }

    .variable-tags .badge {
      font-family: 'Courier New', monospace;
    }

    .variable-buttons {
      display: flex;
      flex-wrap: wrap;
    }

    .variable-buttons .btn {
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
    }

    .tags-input-group {
      display: flex;
      gap: 0.5rem;
    }

    .tags-input-group input {
      flex: 1;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: inherit;
      padding: 0;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .tag-remove:hover {
      color: #d32f2f;
    }

    .preview-content {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.25rem;
      border: 1px solid #e0e0e0;
    }

    .preview-subject {
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .preview-body {
      white-space: pre-wrap;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .template-form-container {
        padding: 1rem;
      }

      .form-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .header-actions {
        justify-content: center;
      }

      .content-tools {
        flex-wrap: wrap;
        justify-content: center;
      }

      .content-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .tags-input-group {
        flex-direction: column;
      }
    }
  `]
})
export class TemplateFormComponent implements OnInit, OnDestroy {
  templateForm: FormGroup;
  isEditMode = false;
  templateId: string | null = null;
  saving = false;
  showPreview = false;
  
  newTag = '';
  tags: string[] = [];
  detectedVariables: string[] = [];
  characterCount = 0;
  characterLimit = 5000;
  
  commonVariables = [
    'firstName', 'lastName', 'fullName', 'email', 'phone',
    'companyName', 'address', 'city', 'state', 'zipCode',
    'accountNumber', 'balance', 'dueDate', 'currentDate'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private messagesService: MessagesService
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['email', Validators.required],
      category: ['welcome', Validators.required],
      subject: [''],
      content: ['', [Validators.required, Validators.minLength(10)]],
      isActive: [true]
    });

    // Update subject validation based on type
    this.templateForm.get('type')?.valueChanges.subscribe(type => {
      const subjectControl = this.templateForm.get('subject');
      if (type === 'sms') {
        subjectControl?.clearValidators();
        this.characterLimit = 160;
      } else {
        subjectControl?.setValidators([Validators.required]);
        this.characterLimit = 5000;
      }
      subjectControl?.updateValueAndValidity();
      this.updateCharacterCount();
    });

    // Detect variables in content
    this.templateForm.get('content')?.valueChanges.subscribe(content => {
      this.detectVariables(content || '');
      this.updateCharacterCount();
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.templateId = params['id'];
        this.loadTemplate();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplate(): void {
    if (this.templateId) {
      this.messagesService.getTemplate(this.templateId).pipe(takeUntil(this.destroy$)).subscribe({
        next: (template: any) => {
          this.templateForm.patchValue({
            name: template.name,
            type: template.type,
            category: template.category,
            subject: template.subject,
            content: template.content,
            isActive: template.isActive
          });
          this.tags = [...template.tags];
          this.detectVariables(template.content);
        },
        error: (error: any) => {
          console.error('Error loading template:', error);
          this.router.navigate(['/messages/templates']);
        }
      });
    }
  }

  saveTemplate(): void {
    if (this.templateForm.valid && !this.saving) {
      this.saving = true;
      
      const templateData = {
        ...this.templateForm.value,
        tags: this.tags,
        variables: this.detectedVariables
      };

      const saveOperation = this.isEditMode && this.templateId
        ? this.messagesService.updateTemplate(this.templateId, templateData)
        : this.messagesService.createTemplate(templateData);

      saveOperation.subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/messages/templates']);
        },
        error: (error: any) => {
          console.error('Error saving template:', error);
          this.saving = false;
        }
      });
    }
  }

  previewTemplate(): void {
    this.showPreview = !this.showPreview;
  }

  goBack(): void {
    this.router.navigate(['/messages/templates']);
  }

  addTag(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    const tag = this.newTag.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  insertVariable(): void {
    // This would open a modal or dropdown with available variables
    console.log('Insert variable clicked');
  }

  insertVariableAtCursor(variable: string): void {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const variableText = `{{${variable}}}`;
      
      const newText = before + variableText + after;
      this.templateForm.patchValue({ content: newText });
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableText.length, start + variableText.length);
      });
    }
  }

  formatText(format: string): void {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      if (selectedText) {
        let formattedText = '';
        switch (format) {
          case 'bold':
            formattedText = `**${selectedText}**`;
            break;
          case 'italic':
            formattedText = `*${selectedText}*`;
            break;
          case 'underline':
            formattedText = `_${selectedText}_`;
            break;
        }
        
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newText = before + formattedText + after;
        
        this.templateForm.patchValue({ content: newText });
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
        });
      }
    }
  }

  detectVariables(content: string): void {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(variableRegex);
    
    if (matches) {
      this.detectedVariables = [...new Set(
        matches.map(match => match.replace(/[{}]/g, ''))
      )];
    } else {
      this.detectedVariables = [];
    }
  }

  updateCharacterCount(): void {
    const content = this.templateForm.get('content')?.value || '';
    this.characterCount = content.length;
  }

  getContentPlaceholder(): string {
    const type = this.templateForm.get('type')?.value;
    switch (type) {
      case 'email':
        return 'Enter your email content here...\n\nYou can use variables like {{firstName}} to personalize the message.';
      case 'sms':
        return 'Enter your SMS message here (max 160 characters)...\n\nUse {{firstName}} for personalization.';
      case 'notification':
        return 'Enter your notification content here...\n\nKeep it concise and clear.';
      default:
        return 'Enter your message content here...';
    }
  }

  getPreviewContent(): string {
    let content = this.templateForm.get('content')?.value || '';
    
    // Replace variables with sample data for preview
    const sampleData: { [key: string]: string } = {
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      companyName: 'Acme Corp',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      accountNumber: 'ACC-12345',
      balance: '$1,234.56',
      dueDate: '2024-02-15',
      currentDate: new Date().toLocaleDateString()
    };

    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, sampleData[key]);
    });

    return content;
  }
}