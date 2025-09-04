import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MessagesService } from '../messages.service';
import { Message } from '../messages.model';

@Component({
  selector: 'app-message-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="message-detail" *ngIf="message">
      <!-- Header -->
      <div class="message-header">
        <div class="header-left">
          <button class="btn btn-outline" routerLink="/messages" title="Back to Messages">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="message-info">
            <h2>{{ message.subject || 'No Subject' }}</h2>
            <div class="message-meta">
              <span class="sender">{{ getSenderDisplay() }}</span>
              <span class="date">{{ formatDate(message.timestamp || message.createdAt) }}</span>
              <span class="type-badge" [class]="'type-' + message.type">{{ message.type.toUpperCase() }}</span>
              <span class="priority-badge" [class]="'priority-' + message.priority" *ngIf="message.priority !== 'normal'">
                {{ message.priority.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="toggleStar()" [class.starred]="message.isStarred" title="Star Message">
            <i class="fas" [class.fa-star]="message.isStarred" [class.fa-star-o]="!message.isStarred"></i>
          </button>
          <button class="btn btn-outline" (click)="toggleFlag()" [class.flagged]="message.isFlagged" title="Flag Message">
            <i class="fas fa-flag" [class.flagged]="message.isFlagged"></i>
          </button>
          <button class="btn btn-outline" (click)="reply()" title="Reply">
            <i class="fas fa-reply"></i> Reply
          </button>
          <button class="btn btn-outline" (click)="forward()" title="Forward">
            <i class="fas fa-share"></i> Forward
          </button>
          <div class="dropdown" [class.open]="showMoreActions">
            <button class="btn btn-outline" (click)="toggleMoreActions()" title="More Actions">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="dropdown-menu" *ngIf="showMoreActions">
              <button class="dropdown-item" (click)="markAsUnread()">
                <i class="fas fa-envelope"></i> Mark as Unread
              </button>
              <button class="dropdown-item" (click)="moveToFolder()">
                <i class="fas fa-folder"></i> Move to Folder
              </button>
              <button class="dropdown-item" (click)="addLabel()">
                <i class="fas fa-tag"></i> Add Label
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" (click)="printMessage()">
                <i class="fas fa-print"></i> Print
              </button>
              <button class="dropdown-item" (click)="exportMessage()">
                <i class="fas fa-download"></i> Export
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" (click)="deleteMessage()">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recipients (for sent messages) -->
      <div class="recipients-section" *ngIf="isSentMessage() && message.recipients?.length">
        <div class="recipients-header">
          <span class="label">To:</span>
          <button class="btn-link" (click)="toggleRecipientsExpanded()" *ngIf="(message.recipients?.length || 0) > 3">
            {{ recipientsExpanded ? 'Show Less' : 'Show All (' + (message.recipients?.length || 0) + ')' }}
          </button>
        </div>
        <div class="recipients-list">
          <span class="recipient" 
                *ngFor="let recipient of getDisplayRecipients(); let i = index"
                [title]="recipient">
            {{ recipient }}
            <span *ngIf="i < getDisplayRecipients().length - 1">, </span>
          </span>
        </div>
      </div>

      <!-- Message Content -->
      <div class="message-content">
        <div class="content-body" [innerHTML]="getFormattedContent()"></div>
        
        <!-- Attachments -->
        <div class="attachments-section" *ngIf="message.attachments?.length">
          <h4>Attachments ({{ message.attachments.length }})</h4>
          <div class="attachments-list">
            <div class="attachment-item" *ngFor="let attachment of message.attachments">
              <div class="attachment-icon">
                <i class="fas" [class]="getAttachmentIcon(attachment.type)"></i>
              </div>
              <div class="attachment-info">
                <div class="attachment-name">{{ attachment.name }}</div>
                <div class="attachment-size">{{ formatFileSize(attachment.size) }}</div>
              </div>
              <div class="attachment-actions">
                <button class="btn btn-sm btn-outline" (click)="downloadAttachment(attachment)">
                  <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-outline" (click)="previewAttachment(attachment)" *ngIf="canPreview(attachment)">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Status (for sent messages) -->
        <div class="delivery-status" *ngIf="isSentMessage() && message.deliveryStatus">
          <h4>Delivery Status</h4>
          <div class="status-info">
            <span class="status-badge" [class]="'status-' + message.deliveryStatus">{{ message.deliveryStatus }}</span>
            <span class="status-time" *ngIf="message.deliveredAt">{{ formatDate(message.deliveredAt) }}</span>
          </div>
        </div>

        <!-- Read Status -->
        <div class="read-status" *ngIf="message.readAt">
          <h4>Read Status</h4>
          <div class="read-info">
            <span class="read-time">Read {{ formatDate(message.readAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Thread Messages -->
      <div class="thread-section" *ngIf="threadMessages.length > 1">
        <div class="thread-header">
          <h3>Conversation ({{ threadMessages.length }} messages)</h3>
          <button class="btn btn-outline" (click)="toggleThreadExpanded()">
            {{ threadExpanded ? 'Collapse' : 'Expand All' }}
          </button>
        </div>
        <div class="thread-messages">
          <div class="thread-message" 
               *ngFor="let msg of threadMessages; let i = index"
               [class.current]="msg.id === message.id"
               [class.expanded]="threadExpanded || msg.id === message.id">
            <div class="thread-message-header" (click)="toggleMessageExpanded(msg)">
              <div class="message-avatar">{{ getInitials(msg.senderName || 'Unknown') }}</div>
              <div class="message-summary">
                <div class="message-sender">{{ msg.senderName || 'Unknown' }}</div>
                <div class="message-preview">{{ getMessagePreview(msg) }}</div>
              </div>
              <div class="message-time">{{ formatDate(msg.timestamp || msg.createdAt) }}</div>
              <div class="expand-icon">
                <i class="fas" [class.fa-chevron-down]="!isMessageExpanded(msg)" [class.fa-chevron-up]="isMessageExpanded(msg)"></i>
              </div>
            </div>
            <div class="thread-message-content" *ngIf="isMessageExpanded(msg)">
              <div [innerHTML]="getFormattedContent(msg)"></div>
              <div class="message-attachments" *ngIf="msg.attachments?.length">
                <div class="attachment-item" *ngFor="let attachment of msg.attachments">
                  <i class="fas" [class]="getAttachmentIcon(attachment.type)"></i>
                  <span>{{ attachment.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reply -->
      <div class="quick-reply" *ngIf="showQuickReply">
        <div class="reply-header">
          <h4>Quick Reply</h4>
          <button class="btn btn-outline" (click)="closeQuickReply()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="reply-form">
          <textarea class="form-control" 
                    [(ngModel)]="replyContent" 
                    placeholder="Type your reply..."
                    rows="4"></textarea>
          <div class="reply-actions">
            <button class="btn btn-secondary" (click)="closeQuickReply()">Cancel</button>
            <button class="btn btn-primary" (click)="sendQuickReply()" [disabled]="!replyContent.trim()">
              <i class="fas fa-paper-plane"></i> Send Reply
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" *ngIf="loading">
      <div class="spinner"></div>
      <p>Loading message...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" *ngIf="error">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3>Message Not Found</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" routerLink="/messages">Back to Messages</button>
    </div>

    <!-- Attachment Preview Modal -->
    <div class="modal" *ngIf="selectedAttachment" (click)="closePreview()">
      <div class="modal-content attachment-preview" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ selectedAttachment.name }}</h3>
          <button class="btn-close" (click)="closePreview()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="preview-content" [ngSwitch]="getPreviewType(selectedAttachment)">
            <img *ngSwitchCase="'image'" [src]="selectedAttachment.url" [alt]="selectedAttachment.name">
            <iframe *ngSwitchCase="'pdf'" [src]="selectedAttachment.url" frameborder="0"></iframe>
            <div *ngSwitchDefault class="preview-placeholder">
              <i class="fas fa-file-alt"></i>
              <p>Preview not available for this file type</p>
              <button class="btn btn-primary" (click)="downloadAttachment(selectedAttachment)">
                <i class="fas fa-download"></i> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-detail {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      flex: 1;
    }

    .message-info h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }

    .sender {
      font-weight: 600;
      color: #333;
    }

    .date {
      color: #666;
      font-size: 14px;
    }

    .type-badge, .priority-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .type-email { background: #e3f2fd; color: #1976d2; }
    .type-sms { background: #f3e5f5; color: #7b1fa2; }
    .type-notification { background: #e8f5e8; color: #388e3c; }

    .priority-high { background: #fff3e0; color: #f57c00; }
    .priority-urgent { background: #ffebee; color: #d32f2f; }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn.starred {
      color: #ffc107;
    }

    .btn.flagged {
      color: #dc3545;
    }

    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      min-width: 180px;
      z-index: 1000;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 15px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      color: #333;
    }

    .dropdown-item:hover {
      background: #f8f9fa;
    }

    .dropdown-item.danger {
      color: #dc3545;
    }

    .dropdown-divider {
      height: 1px;
      background: #eee;
      margin: 5px 0;
    }

    .recipients-section {
      background: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .recipients-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .recipients-header .label {
      font-weight: 600;
      color: #666;
    }

    .btn-link {
      background: none;
      border: none;
      color: #007bff;
      cursor: pointer;
      font-size: 14px;
    }

    .recipients-list {
      color: #333;
    }

    .recipient {
      display: inline;
    }

    .message-content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .content-body {
      line-height: 1.6;
      color: #333;
      margin-bottom: 30px;
    }

    .attachments-section h4,
    .delivery-status h4,
    .read-receipts h4 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 4px;
      background: #f8f9fa;
    }

    .attachment-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #007bff;
      color: white;
      border-radius: 4px;
      font-size: 18px;
    }

    .attachment-info {
      flex: 1;
    }

    .attachment-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .attachment-size {
      color: #666;
      font-size: 12px;
    }

    .attachment-actions {
      display: flex;
      gap: 5px;
    }

    .status-list, .receipts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .status-item, .receipt-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-delivered { background: #e8f5e8; color: #388e3c; }
    .status-failed { background: #ffebee; color: #d32f2f; }
    .status-pending { background: #fff3e0; color: #f57c00; }

    .thread-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .thread-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .thread-header h3 {
      margin: 0;
      color: #333;
    }

    .thread-messages {
      padding: 0;
    }

    .thread-message {
      border-bottom: 1px solid #eee;
    }

    .thread-message:last-child {
      border-bottom: none;
    }

    .thread-message.current {
      background: #f8f9fa;
    }

    .thread-message-header {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 20px;
      cursor: pointer;
    }

    .thread-message-header:hover {
      background: #f8f9fa;
    }

    .message-avatar {
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

    .message-summary {
      flex: 1;
    }

    .message-sender {
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .message-preview {
      color: #666;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .message-time {
      color: #666;
      font-size: 12px;
    }

    .expand-icon {
      color: #666;
    }

    .thread-message-content {
      padding: 0 20px 20px 75px;
      border-top: 1px solid #eee;
      background: white;
    }

    .message-attachments {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .message-attachments .attachment-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 0;
      background: none;
      border: none;
    }

    .quick-reply {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .reply-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }

    .reply-header h4 {
      margin: 0;
      color: #333;
    }

    .reply-form {
      padding: 20px;
    }

    .reply-form .form-control {
      margin-bottom: 15px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      padding: 10px;
      resize: vertical;
    }

    .reply-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 48px;
      color: #dc3545;
      margin-bottom: 20px;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .modal-content.attachment-preview {
      max-width: 90vw;
      max-height: 90vh;
      background: white;
      border-radius: 8px;
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
      flex: 1;
      overflow: auto;
    }

    .preview-content {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-content img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .preview-content iframe {
      width: 100%;
      height: 600px;
    }

    .preview-placeholder {
      text-align: center;
      padding: 60px;
      color: #666;
    }

    .preview-placeholder i {
      font-size: 48px;
      margin-bottom: 20px;
      color: #ccc;
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
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
  `]
})
export class MessageDetailComponent implements OnInit, OnDestroy {
  message: Message | null = null;
  threadMessages: Message[] = [];
  loading = true;
  error: string | null = null;
  currentUserId = 'current-user-id'; // TODO: Get from auth service
  
  // UI State
  showMoreActions = false;
  recipientsExpanded = false;
  threadExpanded = false;
  showQuickReply = false;
  expandedMessages = new Set<string>();
  
  // Quick Reply
  replyContent = '';
  
  // Preview
  selectedAttachment: any = null;

  constructor(
    private messagesService: MessagesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const messageId = params['id'];
      if (messageId) {
        this.loadMessage(messageId);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadMessage(messageId: string): void {
    this.loading = true;
    this.error = null;

    this.messagesService.getMessage(messageId).subscribe({
      next: (message) => {
        this.message = message;
        this.loading = false;
        
        // Mark as read if unread
        if (!message.isRead) {
          this.messagesService.markAsRead(messageId).subscribe();
        }
        
        // Load thread messages
        this.loadThreadMessages(message.threadId || messageId);
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Message not found or could not be loaded.';
        console.error('Load message error:', error);
      }
    });
  }

  loadThreadMessages(threadId: string): void {
    this.messagesService.getThreadMessages(threadId).subscribe({
      next: (response) => {
        const messages = Array.isArray(response) ? response : response.data || [];
        this.threadMessages = messages.sort((a: Message, b: Message) => 
          new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime()
        );
        
        // Expand current message by default
        if (this.message) {
          this.expandedMessages.add(this.message.id);
        }
      },
      error: (error) => console.error('Load thread messages error:', error)
    });
  }

  isSentMessage(): boolean {
    return this.message?.senderId === this.currentUserId;
  }

  getSenderDisplay(): string {
    if (!this.message) return '';
    
    if (this.isSentMessage()) {
      return `To: ${this.message.recipients?.map(r => r.name || r.email).join(', ') || 'Unknown'}`;
    } else {
      return `From: ${this.message.senderName || 'Unknown'}`;
    }
  }

  formatDate(date: string | Date): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  getFormattedContent(message?: Message): string {
    const msg = message || this.message;
    if (!msg) return '';
    
    // Basic HTML formatting for plain text
    let content = msg.content || '';
    
    // Convert line breaks to <br>
    content = content.replace(/\n/g, '<br>');
    
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    content = content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
    
    return content;
  }

  getDisplayRecipients(): string[] {
    if (!this.message?.recipients) return [];
    
    const recipientNames = this.message.recipients.map(r => r.name || r.email || 'Unknown').filter(name => name !== 'Unknown');
    
    if (this.recipientsExpanded || recipientNames.length <= 3) {
      return recipientNames;
    }
    
    return recipientNames.slice(0, 3);
  }

  toggleRecipientsExpanded(): void {
    this.recipientsExpanded = !this.recipientsExpanded;
  }

  toggleMoreActions(): void {
    this.showMoreActions = !this.showMoreActions;
  }

  toggleStar(): void {
    if (!this.message) return;
    
    this.message.isStarred = !this.message.isStarred;
    this.messagesService.updateMessage(this.message.id, { isStarred: this.message.isStarred }).subscribe({
      error: (error) => {
        // Revert on error
        this.message!.isStarred = !this.message!.isStarred;
        console.error('Toggle star error:', error);
      }
    });
  }

  toggleFlag(): void {
    if (!this.message) return;
    
    this.message.isFlagged = !this.message.isFlagged;
    this.messagesService.updateMessage(this.message.id, { isFlagged: this.message.isFlagged }).subscribe({
      error: (error: any) => {
        // Revert on error
        this.message!.isFlagged = !this.message!.isFlagged;
        console.error('Toggle flag error:', error);
      }
    });
  }

  reply(): void {
    this.showQuickReply = true;
  }

  forward(): void {
    this.router.navigate(['/messages/compose'], {
      queryParams: { forward: this.message?.id }
    });
  }

  markAsUnread(): void {
    if (!this.message) return;
    
    this.messagesService.markAsUnread(this.message.id).subscribe({
      next: () => {
        this.message!.isRead = false;
        this.showMoreActions = false;
      },
      error: (error) => console.error('Mark as unread error:', error)
    });
  }

  moveToFolder(): void {
    // Implement folder selection modal
    console.log('Move to folder');
    this.showMoreActions = false;
  }

  addLabel(): void {
    // Implement label selection modal
    console.log('Add label');
    this.showMoreActions = false;
  }

  printMessage(): void {
    window.print();
    this.showMoreActions = false;
  }

  exportMessage(): void {
    // Implement message export
    console.log('Export message');
    this.showMoreActions = false;
  }

  deleteMessage(): void {
    if (!this.message || !confirm('Are you sure you want to delete this message?')) return;
    
    this.messagesService.deleteMessages([this.message.id]).subscribe({
      next: () => {
        this.router.navigate(['/messages']);
      },
      error: (error) => console.error('Delete message error:', error)
    });
  }

  getAttachmentIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'image': 'fa-image',
      'pdf': 'fa-file-pdf',
      'document': 'fa-file-word',
      'spreadsheet': 'fa-file-excel',
      'text': 'fa-file-alt',
      'archive': 'fa-file-archive'
    };
    
    return iconMap[type] || 'fa-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadAttachment(attachment: any): void {
    // Implement attachment download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  }

  canPreview(attachment: any): boolean {
    return ['image', 'pdf'].includes(attachment.type);
  }

  previewAttachment(attachment: any): void {
    this.selectedAttachment = attachment;
  }

  closePreview(): void {
    this.selectedAttachment = null;
  }

  getPreviewType(attachment: any): string {
    return attachment.type;
  }

  toggleThreadExpanded(): void {
    this.threadExpanded = !this.threadExpanded;
    
    if (this.threadExpanded) {
      // Expand all messages
      this.threadMessages.forEach(msg => this.expandedMessages.add(msg.id));
    } else {
      // Collapse all except current
      this.expandedMessages.clear();
      if (this.message) {
        this.expandedMessages.add(this.message.id);
      }
    }
  }

  toggleMessageExpanded(message: Message): void {
    if (this.expandedMessages.has(message.id)) {
      this.expandedMessages.delete(message.id);
    } else {
      this.expandedMessages.add(message.id);
    }
  }

  isMessageExpanded(message: Message): boolean {
    return this.expandedMessages.has(message.id);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getMessagePreview(message: Message): string {
    const content = message.content || '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  closeQuickReply(): void {
    this.showQuickReply = false;
    this.replyContent = '';
  }

  sendQuickReply(): void {
    if (!this.message || !this.replyContent.trim()) return;
    
    const replyData = {
      type: this.message.type,
      recipients: [{
        id: this.message.senderId,
        name: this.message.senderName || 'Unknown',
        type: 'to' as const
      }],
      subject: `Re: ${this.message.subject}`,
      content: this.replyContent,
      threadId: this.message.threadId || this.message.id
    };
    
    this.messagesService.createMessage(replyData).subscribe({
      next: () => {
        this.closeQuickReply();
        // Reload thread to show new reply
        this.loadThreadMessages(this.message!.threadId || this.message!.id);
      },
      error: (error) => console.error('Send reply error:', error)
    });
  }
}