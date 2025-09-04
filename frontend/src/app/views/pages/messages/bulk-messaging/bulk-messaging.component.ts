import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { CampaignStatus, BulkMessage } from '../messages.model';

// Extended BulkMessage interface for component use
interface ExtendedBulkMessage extends BulkMessage {
  type?: string;
  subject?: string;
  content?: string;
  recipientCount?: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: any;
  lastUpdated: Date;
}

@Component({
  selector: 'app-bulk-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="bulk-messaging-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2>Bulk Messaging</h2>
          <p class="text-muted">Send messages to multiple recipients at once</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary" (click)="showRecipientGroups = !showRecipientGroups">
            <i class="fas fa-users"></i>
            Recipient Groups
          </button>
          <button class="btn btn-primary" (click)="createNewMessage()">
            <i class="fas fa-plus"></i>
            New Bulk Message
          </button>
        </div>
      </div>

      <div class="row">
        <!-- Main Content -->
        <div class="col-lg-8">
          <!-- Filters and Search -->
          <div class="card mb-4">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-4">
                  <input type="text" 
                         class="form-control" 
                         placeholder="Search messages..."
                         [(ngModel)]="searchTerm"
                         (input)="filterMessages()">
                </div>
                <div class="col-md-3">
                  <select class="form-select" 
                          [(ngModel)]="selectedType"
                          (change)="filterMessages()">
                    <option value="">All Types</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <select class="form-select" 
                          [(ngModel)]="selectedStatus"
                          (change)="filterMessages()">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sending">Sending</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <button class="btn btn-outline-secondary w-100" (click)="refreshMessages()">
                    <i class="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Messages List -->
          <div class="messages-list">
            <div class="card mb-3" *ngFor="let message of filteredMessages">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="message-info flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                      <h5 class="card-title mb-0 me-3">{{ message.name }}</h5>
                      <span class="badge" [ngClass]="getStatusBadgeClass(message.status)">
                        {{ message.status | titlecase }}
                      </span>
                      <span class="badge bg-secondary ms-2">
                        <i class="fas" [ngClass]="getTypeIcon(message.type || 'email')"></i>
                        {{ message.type | titlecase }}
                      </span>
                    </div>
                    
                    <p class="text-muted mb-2" *ngIf="message.subject">
                      <strong>Subject:</strong> {{ message.subject }}
                    </p>
                    
                    <p class="message-content mb-3">
                      {{ (message.content || '') | slice:0:150 }}{{ (message.content || '').length > 150 ? '...' : '' }}
                    </p>
                    
                    <div class="message-stats">
                      <div class="row g-3">
                        <div class="col-auto">
                          <small class="text-muted">
                            <i class="fas fa-users"></i>
                            {{ message.recipientCount }} recipients
                          </small>
                        </div>
                        <div class="col-auto" *ngIf="message.deliveryRate !== undefined">
                          <small class="text-muted">
                            <i class="fas fa-paper-plane"></i>
                            {{ message.deliveryRate }}% delivered
                          </small>
                        </div>
                        <div class="col-auto" *ngIf="message.openRate !== undefined">
                          <small class="text-muted">
                            <i class="fas fa-envelope-open"></i>
                            {{ message.openRate }}% opened
                          </small>
                        </div>
                        <div class="col-auto" *ngIf="message.clickRate !== undefined">
                          <small class="text-muted">
                            <i class="fas fa-mouse-pointer"></i>
                            {{ message.clickRate }}% clicked
                          </small>
                        </div>
                        <div class="col-auto">
                          <small class="text-muted">
                            <i class="fas fa-calendar"></i>
                            {{ message.createdAt | date:'short' }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="message-actions">
                    <div class="dropdown">
                      <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                              type="button" 
                              [id]="'messageActions' + message.id"
                              data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <ul class="dropdown-menu" [attr.aria-labelledby]="'messageActions' + message.id">
                        <li><a class="dropdown-item" href="#" (click)="viewMessage(message)">
                          <i class="fas fa-eye"></i> View Details
                        </a></li>
                        <li><a class="dropdown-item" href="#" (click)="editMessage(message)" 
                               *ngIf="message.status === 'draft'">
                          <i class="fas fa-edit"></i> Edit
                        </a></li>
                        <li><a class="dropdown-item" href="#" (click)="duplicateMessage(message)">
                          <i class="fas fa-copy"></i> Duplicate
                        </a></li>
                        <li><a class="dropdown-item" href="#" (click)="scheduleMessage(message)" 
                               *ngIf="message.status === 'draft'">
                          <i class="fas fa-clock"></i> Schedule
                        </a></li>
                        <li><a class="dropdown-item" href="#" (click)="sendNow(message)" 
                               *ngIf="message.status === 'draft' || message.status === 'scheduled'">
                          <i class="fas fa-paper-plane"></i> Send Now
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" (click)="deleteMessage(message)">
                          <i class="fas fa-trash"></i> Delete
                        </a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state text-center py-5" *ngIf="filteredMessages.length === 0">
            <i class="fas fa-bullhorn fa-3x text-muted mb-3"></i>
            <h4>No bulk messages found</h4>
            <p class="text-muted">Create your first bulk message to get started</p>
            <button class="btn btn-primary" (click)="createNewMessage()">
              <i class="fas fa-plus"></i>
              Create Bulk Message
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
          <!-- Quick Stats -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-chart-bar"></i>
                Quick Stats
              </h5>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.totalMessages }}</div>
                    <div class="stat-label">Total Messages</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.sentThisMonth }}</div>
                    <div class="stat-label">Sent This Month</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.avgDeliveryRate }}%</div>
                    <div class="stat-label">Avg Delivery Rate</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.avgOpenRate }}%</div>
                    <div class="stat-label">Avg Open Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recipient Groups -->
          <div class="card mb-4" *ngIf="showRecipientGroups">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">
                  <i class="fas fa-users"></i>
                  Recipient Groups
                </h5>
                <button class="btn btn-outline-primary btn-sm" (click)="createRecipientGroup()">
                  <i class="fas fa-plus"></i>
                  New Group
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="recipient-group" *ngFor="let group of recipientGroups">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h6 class="mb-1">{{ group.name }}</h6>
                    <small class="text-muted">{{ group.count }} recipients</small>
                  </div>
                  <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                            type="button" 
                            [id]="'groupActions' + group.id"
                            data-bs-toggle="dropdown">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu" [attr.aria-labelledby]="'groupActions' + group.id">
                      <li><a class="dropdown-item" href="#" (click)="editRecipientGroup(group)">
                        <i class="fas fa-edit"></i> Edit
                      </a></li>
                      <li><a class="dropdown-item" href="#" (click)="viewRecipientGroup(group)">
                        <i class="fas fa-eye"></i> View Recipients
                      </a></li>
                      <li><a class="dropdown-item text-danger" href="#" (click)="deleteRecipientGroup(group)">
                        <i class="fas fa-trash"></i> Delete
                      </a></li>
                    </ul>
                  </div>
                </div>
                <p class="text-muted small mb-3">{{ group.description }}</p>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                <i class="fas fa-history"></i>
                Recent Activity
              </h5>
            </div>
            <div class="card-body">
              <div class="activity-item" *ngFor="let activity of recentActivity">
                <div class="d-flex align-items-start">
                  <div class="activity-icon">
                    <i class="fas" [ngClass]="activity.icon"></i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-text">{{ activity.text }}</div>
                    <small class="text-muted">{{ activity.timestamp | date:'short' }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Message Modal -->
    <div class="modal fade" id="messageModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingMessage ? 'Edit' : 'Create' }} Bulk Message</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form [formGroup]="messageForm" (ngSubmit)="saveMessage()">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="messageName" class="form-label">Message Name *</label>
                  <input type="text" 
                         id="messageName"
                         class="form-control" 
                         formControlName="name"
                         placeholder="Enter message name">
                </div>
                <div class="col-md-6">
                  <label for="messageType" class="form-label">Message Type *</label>
                  <select id="messageType" class="form-select" formControlName="type">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>
                <div class="col-12" *ngIf="messageForm.get('type')?.value === 'email'">
                  <label for="messageSubject" class="form-label">Subject *</label>
                  <input type="text" 
                         id="messageSubject"
                         class="form-control" 
                         formControlName="subject"
                         placeholder="Enter email subject">
                </div>
                <div class="col-12">
                  <label for="messageContent" class="form-label">Content *</label>
                  <textarea id="messageContent"
                            class="form-control" 
                            rows="6"
                            formControlName="content"
                            placeholder="Enter message content"></textarea>
                  <div class="form-text">
                    Character count: {{ messageForm.get('content')?.value?.length || 0 }}
                    <span *ngIf="messageForm.get('type')?.value === 'sms'"> / 160</span>
                  </div>
                </div>
                <div class="col-12">
                  <label for="recipientGroup" class="form-label">Recipient Group *</label>
                  <select id="recipientGroup" class="form-select" formControlName="recipientGroupId">
                    <option value="">Select recipient group</option>
                    <option *ngFor="let group of recipientGroups" [value]="group.id">
                      {{ group.name }} ({{ group.count }} recipients)
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-outline-primary" (click)="saveAsDraft()">
                Save as Draft
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="!messageForm.valid">
                {{ editingMessage ? 'Update' : 'Create' }} Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bulk-messaging-container {
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

    .message-info {
      min-width: 0;
    }

    .message-content {
      color: #6c757d;
      line-height: 1.5;
    }

    .message-stats {
      border-top: 1px solid #e9ecef;
      padding-top: 1rem;
    }

    .message-stats small {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .message-stats i {
      width: 14px;
      color: #6c757d;
    }

    .stat-item {
      text-align: center;
      padding: 1rem;
      border-radius: 0.5rem;
      background-color: #f8f9fa;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #495057;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }

    .recipient-group {
      padding: 1rem;
      border: 1px solid #e9ecef;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .recipient-group:last-child {
      margin-bottom: 0;
    }

    .activity-item {
      display: flex;
      align-items: start;
      padding: 0.75rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .activity-icon i {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .activity-content {
      flex-grow: 1;
      min-width: 0;
    }

    .activity-text {
      font-size: 0.875rem;
      line-height: 1.4;
      margin-bottom: 0.25rem;
    }

    .empty-state {
      background-color: #f8f9fa;
      border-radius: 0.5rem;
      margin: 2rem 0;
    }

    .badge {
      font-size: 0.75rem;
    }

    .badge i {
      margin-right: 0.25rem;
    }

    @media (max-width: 768px) {
      .bulk-messaging-container {
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

      .message-stats .row {
        margin: 0;
      }

      .message-stats .col-auto {
        padding: 0.25rem;
      }

      .message-actions {
        margin-top: 1rem;
      }
    }
  `]
})
export class BulkMessagingComponent implements OnInit, OnDestroy {
  messages: ExtendedBulkMessage[] = [];
  filteredMessages: ExtendedBulkMessage[] = [];
  recipientGroups: RecipientGroup[] = [];
  selectedMessage: ExtendedBulkMessage | null = null;
  
  searchTerm = '';
  selectedType = '';
  selectedStatus = '';
  showRecipientGroups = false;
  
  messageForm: FormGroup;
  editingMessage: ExtendedBulkMessage | null = null;
  
  stats = {
    totalMessages: 0,
    sentThisMonth: 0,
    avgDeliveryRate: 0,
    avgOpenRate: 0
  };
  
  recentActivity: any[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private messagesService: MessagesService
  ) {
    this.messageForm = this.createMessageForm();
  }

  ngOnInit(): void {
    this.loadMessages();
    this.loadRecipientGroups();
    this.loadStats();
    this.loadRecentActivity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createMessageForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      type: ['email', Validators.required],
      subject: [''],
      content: ['', Validators.required],
      recipientGroupId: ['', Validators.required]
    });
  }

  loadMessages(): void {
    this.messagesService.getBulkMessages().pipe(takeUntil(this.destroy$)).subscribe({
      next: (messages) => {
        this.messages = messages.data || messages;
        this.filterMessages();
      },
      error: (error) => {
        console.error('Error loading bulk messages:', error);
      }
    });
  }

  loadRecipientGroups(): void {
    // Mock recipient groups data - implement getRecipientGroups in MessagesService if needed
    this.recipientGroups = [
      { id: '1', name: 'All Clients', description: 'All active clients', count: 1250, criteria: [], lastUpdated: new Date() },
      { id: '2', name: 'New Clients', description: 'Clients joined in last 30 days', count: 85, criteria: [], lastUpdated: new Date() },
      { id: '3', name: 'High Priority', description: 'Clients with urgent disputes', count: 42, criteria: [], lastUpdated: new Date() }
    ];
  }

  loadStats(): void {
    // Mock stats data - implement getBulkMessagingStats in MessagesService if needed
    this.stats = {
      totalMessages: 1250,
      sentThisMonth: 850,
      avgDeliveryRate: 98.5,
      avgOpenRate: 24.3
    };
  }

  loadRecentActivity(): void {
    // Mock activity data - implement getBulkMessagingActivity in MessagesService if needed
    this.recentActivity = [
      { id: '1', type: 'sent', message: 'Welcome email sent to 150 recipients', timestamp: new Date() },
      { id: '2', type: 'scheduled', message: 'Payment reminder scheduled for tomorrow', timestamp: new Date() }
    ];
  }

  filterMessages(): void {
    this.filteredMessages = this.messages.filter(message => {
      const matchesSearch = !this.searchTerm || 
        message.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (message.content || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (message.subject && message.subject.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesType = !this.selectedType || message.type === this.selectedType;
      const matchesStatus = !this.selectedStatus || message.status === this.selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  refreshMessages(): void {
    this.loadMessages();
  }

  createNewMessage(): void {
    this.editingMessage = null;
    this.messageForm.reset();
    this.messageForm.patchValue({ type: 'email' });
    // Show modal
  }

  editMessage(message: ExtendedBulkMessage): void {
    this.editingMessage = message;
    this.messageForm.patchValue({
      name: message.name,
      type: message.type,
      subject: message.subject,
      content: message.content
    });
    // Show modal
  }

  saveMessage(): void {
    if (this.messageForm.valid) {
      const messageData = this.messageForm.value;
      
      if (this.editingMessage) {
        this.messagesService.updateMessage(this.editingMessage.id, messageData).subscribe({
          next: () => {
            this.loadMessages();
            // Hide modal
          },
          error: (error: any) => {
            console.error('Error updating message:', error);
          }
        });
      } else {
        this.messagesService.createBulkMessage(messageData).subscribe({
          next: () => {
            this.loadMessages();
            // Hide modal
          },
          error: (error) => {
            console.error('Error creating message:', error);
          }
        });
      }
    }
  }

  saveAsDraft(): void {
    if (this.messageForm.valid) {
      const messageData = { ...this.messageForm.value, status: 'draft' };
      
      this.messagesService.createBulkMessage(messageData).subscribe({
        next: () => {
          this.loadMessages();
          // Hide modal
        },
        error: (error) => {
          console.error('Error saving draft:', error);
        }
      });
    }
  }

  viewMessage(message: ExtendedBulkMessage): void {
    // Navigate to message detail view
  }

  duplicateMessage(message: ExtendedBulkMessage): void {
    const duplicateData = {
      name: `${message.name} (Copy)`,
      type: message.type,
      subject: message.subject,
      content: message.content,
      status: CampaignStatus.DRAFT
    };
    
    this.messagesService.createBulkMessage(duplicateData).subscribe({
      next: () => {
        this.loadMessages();
      },
      error: (error: any) => {
        console.error('Error duplicating message:', error);
      }
    });
  }

  scheduleMessage(message: ExtendedBulkMessage): void {
    // Show schedule modal
  }

  sendNow(message: ExtendedBulkMessage): void {
    if (confirm('Are you sure you want to send this message now?')) {
      this.messagesService.sendBulkMessage(message.id).subscribe({
        next: () => {
          this.loadMessages();
        },
        error: (error: any) => {
          console.error('Error sending message:', error);
        }
      });
    }
  }

  deleteMessage(message: ExtendedBulkMessage): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.messagesService.deleteBulkMessage(message.id).subscribe({
        next: () => {
          this.loadMessages();
        },
        error: (error) => {
          console.error('Error deleting message:', error);
        }
      });
    }
  }

  createRecipientGroup(): void {
    // Show recipient group creation modal
  }

  editRecipientGroup(group: RecipientGroup): void {
    // Show recipient group edit modal
  }

  viewRecipientGroup(group: RecipientGroup): void {
    // Show recipient group details
  }

  deleteRecipientGroup(group: RecipientGroup): void {
    if (confirm('Are you sure you want to delete this recipient group?')) {
      // Mock delete functionality - implement deleteRecipientGroup in MessagesService if needed
      this.recipientGroups = this.recipientGroups.filter(g => g.id !== group.id);
      console.log('Recipient group deleted:', group.name);
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'draft': 'bg-secondary',
      'scheduled': 'bg-info',
      'sending': 'bg-warning',
      'sent': 'bg-success',
      'failed': 'bg-danger'
    };
    return classes[status as keyof typeof classes] || 'bg-secondary';
  }

  getTypeIcon(type: string): string {
    const icons = {
      'email': 'fa-envelope',
      'sms': 'fa-sms',
      'notification': 'fa-bell'
    };
    return icons[type as keyof typeof icons] || 'fa-envelope';
  }
}