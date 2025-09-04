import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MessagesService } from '../messages.service';
import { Message } from '../messages.model';

@Component({
  selector: 'app-compose',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="compose-message">
      <div class="compose-header">
        <h2>{{ isEditingDraft ? 'Edit Draft' : 'Compose Message' }}</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="saveDraft()" [disabled]="saving">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button class="btn btn-primary" (click)="sendMessage()" [disabled]="!composeForm.valid || sending">
            <i class="fas fa-paper-plane"></i> {{ sending ? 'Sending...' : 'Send' }}
          </button>
          <button class="btn btn-outline" routerLink="/messages">
            <i class="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>

      <form [formGroup]="composeForm" class="compose-form">
        <!-- Message Type Selection -->
        <div class="form-group">
          <label for="messageType">Message Type</label>
          <select id="messageType" class="form-control" formControlName="type" (change)="onTypeChange()">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="notification">In-App Notification</option>
          </select>
        </div>

        <!-- Recipients -->
        <div class="form-group">
          <label for="recipients">Recipients</label>
          <div class="recipients-input">
            <input type="text" 
                   id="recipients" 
                   class="form-control" 
                   formControlName="recipients"
                   placeholder="Enter email addresses or phone numbers separated by commas"
                   (input)="onRecipientsChange()"
                   [class.is-invalid]="composeForm.get('recipients')?.invalid && composeForm.get('recipients')?.touched">
            <button type="button" class="btn btn-sm btn-secondary" (click)="showContactPicker()">
              <i class="fas fa-address-book"></i> Contacts
            </button>
          </div>
          <div class="recipients-tags" *ngIf="recipientTags.length > 0">
            <span class="recipient-tag" *ngFor="let recipient of recipientTags; let i = index">
              {{ recipient }}
              <button type="button" (click)="removeRecipient(i)">
                <i class="fas fa-times"></i>
              </button>
            </span>
          </div>
          <div class="invalid-feedback" *ngIf="composeForm.get('recipients')?.invalid && composeForm.get('recipients')?.touched">
            Please enter at least one valid recipient
          </div>
        </div>

        <!-- Subject (for email and notification) -->
        <div class="form-group" *ngIf="messageType !== 'sms'">
          <label for="subject">Subject</label>
          <input type="text" 
                 id="subject" 
                 class="form-control" 
                 formControlName="subject"
                 placeholder="Enter message subject"
                 [class.is-invalid]="composeForm.get('subject')?.invalid && composeForm.get('subject')?.touched">
          <div class="invalid-feedback" *ngIf="composeForm.get('subject')?.invalid && composeForm.get('subject')?.touched">
            Subject is required
          </div>
        </div>

        <!-- Message Content -->
        <div class="form-group">
          <label for="content">Message</label>
          <div class="content-editor">
            <div class="editor-toolbar" *ngIf="messageType === 'email'">
              <button type="button" class="btn-toolbar" (click)="formatText('bold')" title="Bold">
                <i class="fas fa-bold"></i>
              </button>
              <button type="button" class="btn-toolbar" (click)="formatText('italic')" title="Italic">
                <i class="fas fa-italic"></i>
              </button>
              <button type="button" class="btn-toolbar" (click)="formatText('underline')" title="Underline">
                <i class="fas fa-underline"></i>
              </button>
              <div class="toolbar-separator"></div>
              <button type="button" class="btn-toolbar" (click)="insertTemplate()" title="Insert Template">
                <i class="fas fa-file-alt"></i>
              </button>
              <button type="button" class="btn-toolbar" (click)="insertVariable()" title="Insert Variable">
                <i class="fas fa-code"></i>
              </button>
            </div>
            <textarea id="content" 
                      class="form-control content-textarea" 
                      formControlName="content"
                      [placeholder]="getContentPlaceholder()"
                      [maxlength]="getMaxLength()"
                      [class.is-invalid]="composeForm.get('content')?.invalid && composeForm.get('content')?.touched"
                      (input)="updateCharacterCount()"></textarea>
            <div class="character-count">
              {{ characterCount }} / {{ getMaxLength() }} characters
              <span class="remaining" [class.warning]="characterCount > getMaxLength() * 0.9">
                ({{ getMaxLength() - characterCount }} remaining)
              </span>
            </div>
          </div>
          <div class="invalid-feedback" *ngIf="composeForm.get('content')?.invalid && composeForm.get('content')?.touched">
            Message content is required
          </div>
        </div>

        <!-- Attachments (for email only) -->
        <div class="form-group" *ngIf="messageType === 'email'">
          <label>Attachments</label>
          <div class="attachments-section">
            <input type="file" 
                   #fileInput 
                   multiple 
                   (change)="onFileSelected($event)"
                   accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                   style="display: none;">
            <button type="button" class="btn btn-outline" (click)="fileInput.click()">
              <i class="fas fa-paperclip"></i> Add Attachments
            </button>
            <div class="attachments-list" *ngIf="attachments.length > 0">
              <div class="attachment-item" *ngFor="let attachment of attachments; let i = index">
                <i class="fas fa-file"></i>
                <span class="attachment-name">{{ attachment.name }}</span>
                <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
                <button type="button" class="btn-remove" (click)="removeAttachment(i)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Scheduling -->
        <div class="form-group">
          <div class="form-check">
            <input type="checkbox" 
                   id="scheduleMessage" 
                   class="form-check-input" 
                   [(ngModel)]="scheduleMessage"
                   [ngModelOptions]="{standalone: true}">
            <label for="scheduleMessage" class="form-check-label">Schedule for later</label>
          </div>
          <div class="schedule-inputs" *ngIf="scheduleMessage">
            <div class="schedule-row">
              <input type="date" 
                     class="form-control" 
                     formControlName="scheduleDate"
                     [min]="minDate">
              <input type="time" 
                     class="form-control" 
                     formControlName="scheduleTime">
            </div>
          </div>
        </div>

        <!-- Priority -->
        <div class="form-group">
          <label for="priority">Priority</label>
          <select id="priority" class="form-control" formControlName="priority">
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </form>

      <!-- Auto-save indicator -->
      <div class="auto-save-status" *ngIf="autoSaveStatus">
        <i class="fas" [class]="autoSaveStatus.icon"></i>
        {{ autoSaveStatus.message }}
      </div>

      <!-- Template Picker Modal -->
      <div class="modal" *ngIf="showTemplatePicker" (click)="closeTemplatePicker()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Select Template</h3>
            <button class="btn-close" (click)="closeTemplatePicker()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="template-list">
              <div class="template-item" 
                   *ngFor="let template of templates" 
                   (click)="selectTemplate(template)">
                <h4>{{ template.name }}</h4>
                <p>{{ template.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Picker Modal -->
      <div class="modal" *ngIf="showContactPickerModal" (click)="closeContactPicker()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Select Contacts</h3>
            <button class="btn-close" (click)="closeContactPicker()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <input type="text" 
                   class="form-control" 
                   placeholder="Search contacts..." 
                   [(ngModel)]="contactSearchTerm"
                   (input)="filterContacts()">
            <div class="contacts-list">
              <div class="contact-item" 
                   *ngFor="let contact of filteredContacts" 
                   (click)="selectContact(contact)">
                <div class="contact-avatar">{{ getInitials(contact.name) }}</div>
                <div class="contact-info">
                  <div class="contact-name">{{ contact.name }}</div>
                  <div class="contact-email">{{ contact.email }}</div>
                </div>
                <div class="contact-select">
                  <i class="fas fa-plus"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .compose-message {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .compose-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .compose-header h2 {
      margin: 0;
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .compose-form {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #333;
    }

    .recipients-input {
      display: flex;
      gap: 10px;
    }

    .recipients-input .form-control {
      flex: 1;
    }

    .recipients-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .recipient-tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .recipient-tag button {
      background: none;
      border: none;
      color: #1976d2;
      cursor: pointer;
      padding: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-editor {
      border: 1px solid #ced4da;
      border-radius: 4px;
      overflow: hidden;
    }

    .editor-toolbar {
      background: #f8f9fa;
      padding: 8px;
      border-bottom: 1px solid #ced4da;
      display: flex;
      gap: 5px;
    }

    .btn-toolbar {
      background: none;
      border: 1px solid #ced4da;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      color: #666;
    }

    .btn-toolbar:hover {
      background: #e9ecef;
    }

    .toolbar-separator {
      width: 1px;
      background: #ced4da;
      margin: 0 5px;
    }

    .content-textarea {
      border: none;
      resize: vertical;
      min-height: 200px;
      font-family: inherit;
    }

    .content-textarea:focus {
      outline: none;
      box-shadow: none;
    }

    .character-count {
      padding: 8px;
      background: #f8f9fa;
      font-size: 12px;
      color: #666;
      text-align: right;
    }

    .character-count .remaining.warning {
      color: #dc3545;
      font-weight: 600;
    }

    .attachments-section {
      border: 2px dashed #ced4da;
      border-radius: 4px;
      padding: 20px;
      text-align: center;
    }

    .attachments-list {
      margin-top: 15px;
      text-align: left;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 5px;
    }

    .attachment-name {
      flex: 1;
      font-weight: 500;
    }

    .attachment-size {
      color: #666;
      font-size: 12px;
    }

    .btn-remove {
      background: none;
      border: none;
      color: #dc3545;
      cursor: pointer;
      padding: 2px;
    }

    .schedule-inputs {
      margin-top: 10px;
    }

    .schedule-row {
      display: flex;
      gap: 10px;
    }

    .schedule-row .form-control {
      flex: 1;
    }

    .auto-save-status {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 10px 15px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
    }

    .template-list, .contacts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .template-item, .contact-item {
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .template-item:hover, .contact-item:hover {
      background: #f8f9fa;
    }

    .template-item h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .template-item p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .contact-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .contact-info {
      flex: 1;
    }

    .contact-name {
      font-weight: 600;
      color: #333;
    }

    .contact-email {
      color: #666;
      font-size: 14px;
    }

    .contact-select {
      color: #007bff;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-outline {
      background: white;
      color: #666;
      border: 1px solid #ced4da;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-control {
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      width: 100%;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .invalid-feedback {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .form-check {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-check-input {
      margin: 0;
    }

    .form-check-label {
      margin: 0;
      cursor: pointer;
    }
  `]
})
export class ComposeComponent implements OnInit, OnDestroy {
  composeForm: FormGroup;
  messageType = 'email';
  recipientTags: string[] = [];
  attachments: File[] = [];
  characterCount = 0;
  scheduleMessage = false;
  minDate = new Date().toISOString().split('T')[0];
  
  // Status flags
  sending = false;
  saving = false;
  isEditingDraft = false;
  draftId: string | null = null;
  
  // Auto-save
  autoSaveStatus: { icon: string; message: string } | null = null;
  autoSaveInterval: any;
  
  // Modals
  showTemplatePicker = false;
  showContactPickerModal = false;
  
  // Data
  templates: any[] = [];
  contacts: any[] = [];
  filteredContacts: any[] = [];
  contactSearchTerm = '';

  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.composeForm = this.fb.group({
      type: ['email', Validators.required],
      recipients: ['', Validators.required],
      subject: ['', Validators.required],
      content: ['', Validators.required],
      priority: ['normal'],
      scheduleDate: [''],
      scheduleTime: ['']
    });
  }

  ngOnInit(): void {
    // Check if editing a draft
    this.route.queryParams.subscribe(params => {
      if (params['draft']) {
        this.draftId = params['draft'];
        this.isEditingDraft = true;
        if (this.draftId) {
          this.loadDraft(this.draftId);
        }
      }
    });

    // Load templates and contacts
    this.loadTemplates();
    this.loadContacts();

    // Set up auto-save
    this.setupAutoSave();

    // Update character count initially
    this.updateCharacterCount();
  }

  ngOnDestroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  loadDraft(draftId: string): void {
    this.messagesService.getDraft(draftId).subscribe({
      next: (draft) => {
        this.composeForm.patchValue({
          type: draft.type,
          recipients: draft.recipients,
          subject: draft.subject,
          content: draft.content,
          priority: draft.priority
        });
        this.messageType = draft.type;
        this.recipientTags = draft.recipients ? draft.recipients.split(',').map((r: string) => r.trim()) : [];
        this.updateCharacterCount();
      },
      error: (error) => console.error('Load draft error:', error)
    });
  }

  loadTemplates(): void {
    this.messagesService.getTemplates().subscribe({
      next: (templates) => this.templates = templates.data || templates,
      error: (error) => console.error('Load templates error:', error)
    });
  }

  loadContacts(): void {
    this.messagesService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.filteredContacts = contacts;
      },
      error: (error) => console.error('Load contacts error:', error)
    });
  }

  setupAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      if (this.composeForm.dirty && this.composeForm.value.content) {
        this.autoSaveDraft();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  onTypeChange(): void {
    this.messageType = this.composeForm.value.type;
    
    // Update form validators based on type
    if (this.messageType === 'sms') {
      this.composeForm.get('subject')?.clearValidators();
    } else {
      this.composeForm.get('subject')?.setValidators([Validators.required]);
    }
    this.composeForm.get('subject')?.updateValueAndValidity();
    
    this.updateCharacterCount();
  }

  onRecipientsChange(): void {
    const recipients = this.composeForm.value.recipients;
    if (recipients) {
      this.recipientTags = recipients.split(',').map((r: string) => r.trim()).filter((r: string) => r);
    } else {
      this.recipientTags = [];
    }
  }

  removeRecipient(index: number): void {
    this.recipientTags.splice(index, 1);
    this.composeForm.patchValue({
      recipients: this.recipientTags.join(', ')
    });
  }

  updateCharacterCount(): void {
    const content = this.composeForm.value.content || '';
    this.characterCount = content.length;
  }

  getContentPlaceholder(): string {
    switch (this.messageType) {
      case 'email':
        return 'Enter your email message...';
      case 'sms':
        return 'Enter your SMS message (160 characters recommended)...';
      case 'notification':
        return 'Enter your notification message...';
      default:
        return 'Enter your message...';
    }
  }

  getMaxLength(): number {
    switch (this.messageType) {
      case 'sms':
        return 160;
      case 'notification':
        return 200;
      default:
        return 5000;
    }
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.attachments.push(...files);
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatText(command: string): void {
    document.execCommand(command, false);
  }

  insertTemplate(): void {
    this.showTemplatePicker = true;
  }

  insertVariable(): void {
    // Show variable picker or insert common variables
    const variables = ['{{firstName}}', '{{lastName}}', '{{email}}', '{{company}}'];
    // For now, just insert the first variable
    const currentContent = this.composeForm.value.content || '';
    this.composeForm.patchValue({
      content: currentContent + variables[0]
    });
    this.updateCharacterCount();
  }

  selectTemplate(template: any): void {
    this.composeForm.patchValue({
      subject: template.subject,
      content: template.content
    });
    this.updateCharacterCount();
    this.closeTemplatePicker();
  }

  closeTemplatePicker(): void {
    this.showTemplatePicker = false;
  }

  showContactPicker(): void {
    this.showContactPickerModal = true;
  }

  closeContactPicker(): void {
    this.showContactPickerModal = false;
    this.contactSearchTerm = '';
    this.filteredContacts = this.contacts;
  }

  filterContacts(): void {
    const term = this.contactSearchTerm.toLowerCase();
    this.filteredContacts = this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term)
    );
  }

  selectContact(contact: any): void {
    const currentRecipients = this.composeForm.value.recipients || '';
    const newRecipients = currentRecipients ? 
      `${currentRecipients}, ${contact.email}` : 
      contact.email;
    
    this.composeForm.patchValue({
      recipients: newRecipients
    });
    this.onRecipientsChange();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  saveDraft(): void {
    this.saving = true;
    const formData = this.composeForm.value;
    
    const draftData = {
      ...formData,
      attachments: this.attachments,
      scheduleMessage: this.scheduleMessage
    };

    const saveObservable = this.isEditingDraft && this.draftId ?
      this.messagesService.updateDraft(this.draftId, draftData) :
      this.messagesService.saveDraft(draftData);

    saveObservable.subscribe({
      next: (response: any) => {
        this.saving = false;
        this.composeForm.markAsPristine();
        if (!this.isEditingDraft) {
          this.draftId = response.id;
          this.isEditingDraft = true;
        }
        this.showAutoSaveStatus('fa-check-circle', 'Draft saved');
      },
      error: (error: any) => {
        this.saving = false;
        this.showAutoSaveStatus('fa-exclamation-circle', 'Save failed');
        console.error('Save draft error:', error);
      }
    });
  }

  autoSaveDraft(): void {
    if (!this.composeForm.value.content) return;
    
    const formData = this.composeForm.value;
    const draftData = {
      ...formData,
      attachments: this.attachments,
      scheduleMessage: this.scheduleMessage
    };

    const saveObservable = this.isEditingDraft && this.draftId ?
      this.messagesService.updateDraft(this.draftId, draftData) :
      this.messagesService.saveDraft(draftData);

    saveObservable.subscribe({
      next: (response: any) => {
        this.composeForm.markAsPristine();
        if (!this.isEditingDraft) {
          this.draftId = response.id;
          this.isEditingDraft = true;
        }
        this.showAutoSaveStatus('fa-save', 'Auto-saved');
      },
      error: (error: any) => {
        this.showAutoSaveStatus('fa-exclamation-circle', 'Auto-save failed');
      }
    });
  }

  sendMessage(): void {
    if (!this.composeForm.valid) return;

    this.sending = true;
    const formData = this.composeForm.value;
    
    const messageData = {
      ...formData,
      attachments: this.attachments,
      scheduleMessage: this.scheduleMessage
    };

    this.messagesService.createMessage(messageData).subscribe({
      next: () => {
        this.sending = false;
        // Delete draft if editing one
        if (this.isEditingDraft && this.draftId) {
          this.messagesService.deleteDrafts([this.draftId]).subscribe();
        }
        this.router.navigate(['/messages/sent']);
      },
      error: (error) => {
        this.sending = false;
        console.error('Send message error:', error);
      }
    });
  }

  showAutoSaveStatus(icon: string, message: string): void {
    this.autoSaveStatus = { icon, message };
    setTimeout(() => {
      this.autoSaveStatus = null;
    }, 3000);
  }
}