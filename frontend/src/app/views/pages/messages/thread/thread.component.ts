import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessagesService } from '../messages.service';
import { Message, MessageThread } from '../messages.model';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="thread-container">
      <!-- Thread Header -->
      <div class="thread-header">
        <div class="thread-info">
          <h2>{{ thread?.subject || 'Message Thread' }}</h2>
          <div class="thread-meta">
            <span class="participant-count">{{ thread?.participants?.length || 0 }} participants</span>
            <span class="message-count">{{ thread?.messages?.length || 0 }} messages</span>
            <span class="last-activity">Last activity: {{ thread?.lastActivity | date:'short' }}</span>
          </div>
        </div>
        <div class="thread-actions">
          <button class="btn btn-outline-primary" (click)="toggleMute()">
            <i class="fas" [class.fa-volume-mute]="thread?.isMuted" [class.fa-volume-up]="!thread?.isMuted"></i>
            {{ thread?.isMuted ? 'Unmute' : 'Mute' }}
          </button>
          <button class="btn btn-outline-secondary" (click)="markAllAsRead()">
            <i class="fas fa-check-double"></i>
            Mark All Read
          </button>
          <button class="btn btn-outline-danger" (click)="archiveThread()">
            <i class="fas fa-archive"></i>
            Archive
          </button>
        </div>
      </div>

      <!-- Participants -->
      <div class="participants-section" *ngIf="thread?.participants?.length">
        <h5>Participants</h5>
        <div class="participants-list">
          <div class="participant" *ngFor="let participant of thread?.participants">
            <img [src]="participant.avatar || '/assets/default-avatar.png'" 
                 [alt]="participant.name" class="participant-avatar">
            <span class="participant-name">{{ participant.name }}</span>
            <span class="participant-email">{{ participant.email }}</span>
            <span class="participant-status" [class]="'status-' + participant.status">
              {{ participant.status }}
            </span>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-section">
        <div class="message-item" 
             *ngFor="let message of thread?.messages; trackBy: trackByMessageId"
             [class.own-message]="message.senderId === currentUserId"
             [class.unread]="!message.isRead">
          
          <!-- Message Header -->
          <div class="message-header">
            <div class="sender-info">
              <img [src]="message.senderAvatar || '/assets/default-avatar.png'" 
                   [alt]="message.senderName" class="sender-avatar">
              <div class="sender-details">
                <span class="sender-name">{{ message.senderName }}</span>
                <span class="message-time">{{ message.timestamp | date:'short' }}</span>
              </div>
            </div>
            <div class="message-actions">
              <button class="btn btn-sm btn-outline-secondary" (click)="replyToMessage(message)">
                <i class="fas fa-reply"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary" (click)="forwardMessage(message)">
                <i class="fas fa-share"></i>
              </button>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        data-bs-toggle="dropdown">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" (click)="starMessage(message)">
                    <i class="fas fa-star"></i> Star
                  </a></li>
                  <li><a class="dropdown-item" (click)="flagMessage(message)">
                    <i class="fas fa-flag"></i> Flag
                  </a></li>
                  <li><a class="dropdown-item" (click)="copyMessage(message)">
                    <i class="fas fa-copy"></i> Copy
                  </a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item text-danger" (click)="deleteMessage(message)">
                    <i class="fas fa-trash"></i> Delete
                  </a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Message Content -->
          <div class="message-content">
            <div class="message-body" [innerHTML]="message.content"></div>
            
            <!-- Attachments -->
            <div class="attachments" *ngIf="message.attachments?.length">
              <div class="attachment" *ngFor="let attachment of message.attachments">
                <i class="fas fa-paperclip"></i>
                <a [href]="attachment.url" target="_blank">{{ attachment.name }}</a>
                <span class="attachment-size">({{ formatFileSize(attachment.size) }})</span>
              </div>
            </div>

            <!-- Message Status -->
            <div class="message-status">
              <span class="delivery-status" [class]="'status-' + message.deliveryStatus">
                <i class="fas" [class.fa-check]="message.deliveryStatus === 'delivered'"
                   [class.fa-check-double]="message.deliveryStatus === 'read'"
                   [class.fa-clock]="message.deliveryStatus === 'pending'"
                   [class.fa-exclamation-triangle]="message.deliveryStatus === 'failed'"></i>
                {{ message.deliveryStatus }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reply -->
      <div class="quick-reply-section">
        <form [formGroup]="replyForm" (ngSubmit)="sendReply()">
          <div class="reply-input-group">
            <textarea formControlName="content" 
                      class="form-control" 
                      placeholder="Type your reply..."
                      rows="3"
                      (keydown.ctrl.enter)="sendReply()"></textarea>
            <div class="reply-actions">
              <button type="button" class="btn btn-outline-secondary" (click)="attachFile()">
                <i class="fas fa-paperclip"></i>
              </button>
              <button type="button" class="btn btn-outline-secondary" (click)="insertEmoji()">
                <i class="fas fa-smile"></i>
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="replyForm.invalid || sending">
                <i class="fas fa-paper-plane"></i>
                {{ sending ? 'Sending...' : 'Send' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .thread-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .thread-header {
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      background: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .thread-info h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .thread-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .thread-actions {
      display: flex;
      gap: 0.5rem;
    }

    .participants-section {
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .participants-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .participant {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: white;
      border-radius: 0.375rem;
      border: 1px solid #e0e0e0;
    }

    .participant-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .participant-name {
      font-weight: 500;
    }

    .participant-email {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .participant-status {
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-online {
      background: #d4edda;
      color: #155724;
    }

    .status-offline {
      background: #f8d7da;
      color: #721c24;
    }

    .messages-section {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .message-item {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #e0e0e0;
      background: white;
    }

    .message-item.own-message {
      margin-left: 2rem;
      background: #e3f2fd;
      border-color: #2196f3;
    }

    .message-item.unread {
      border-left: 4px solid #2196f3;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .sender-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sender-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .sender-name {
      font-weight: 600;
      display: block;
    }

    .message-time {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .message-actions {
      display: flex;
      gap: 0.25rem;
    }

    .message-content {
      margin-left: 3.25rem;
    }

    .message-body {
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }

    .attachments {
      margin-bottom: 0.75rem;
    }

    .attachment {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 0.25rem;
      margin-bottom: 0.25rem;
    }

    .attachment a {
      text-decoration: none;
      color: #2196f3;
    }

    .attachment-size {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .message-status {
      display: flex;
      justify-content: flex-end;
      font-size: 0.75rem;
    }

    .delivery-status {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-delivered {
      color: #28a745;
    }

    .status-read {
      color: #2196f3;
    }

    .status-pending {
      color: #ffc107;
    }

    .status-failed {
      color: #dc3545;
    }

    .quick-reply-section {
      padding: 1rem;
      border-top: 1px solid #e0e0e0;
      background: white;
    }

    .reply-input-group {
      position: relative;
    }

    .reply-input-group textarea {
      padding-right: 120px;
      resize: vertical;
      min-height: 80px;
    }

    .reply-actions {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      display: flex;
      gap: 0.25rem;
    }

    @media (max-width: 768px) {
      .thread-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .thread-actions {
        justify-content: center;
      }

      .message-item.own-message {
        margin-left: 0;
      }

      .message-content {
        margin-left: 0;
      }

      .participants-list {
        flex-direction: column;
      }
    }
  `]
})
export class ThreadComponent implements OnInit, OnDestroy {
  thread: MessageThread | null = null;
  replyForm: FormGroup;
  sending = false;
  currentUserId = 'current-user-id'; // This should come from auth service
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messagesService: MessagesService,
    private fb: FormBuilder
  ) {
    this.replyForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.loadThread(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadThread(threadId: string): void {
    this.messagesService.getThread(threadId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (thread: MessageThread) => {
        this.thread = thread;
        this.markThreadAsRead();
      },
      error: (error: any) => {
        console.error('Error loading thread:', error);
      }
    });
  }

  markThreadAsRead(): void {
    if (this.thread) {
      this.messagesService.markThreadAsRead(this.thread.id).subscribe();
    }
  }

  markAllAsRead(): void {
    if (this.thread) {
      this.messagesService.markAllMessagesAsRead(this.thread.id).subscribe({
        next: () => {
          if (this.thread) {
            this.thread.messages.forEach(message => message.isRead = true);
          }
        }
      });
    }
  }

  toggleMute(): void {
    if (this.thread) {
      this.messagesService.toggleThreadMute(this.thread.id).subscribe({
        next: () => {
          if (this.thread) {
            this.thread.isMuted = !this.thread.isMuted;
          }
        }
      });
    }
  }

  archiveThread(): void {
    if (this.thread && confirm('Are you sure you want to archive this thread?')) {
      this.messagesService.archiveThread(this.thread.id).subscribe({
        next: () => {
          this.router.navigate(['/messages']);
        }
      });
    }
  }

  sendReply(): void {
    if (this.replyForm.valid && this.thread && !this.sending) {
      this.sending = true;
      const content = this.replyForm.get('content')?.value;

      this.messagesService.sendReply(this.thread.id, content).subscribe({
        next: (newMessage: Message) => {
          if (this.thread) {
            this.thread.messages.push(newMessage);
            this.thread.lastActivity = new Date();
          }
          this.replyForm.reset();
          this.sending = false;
        },
        error: (error: any) => {
          console.error('Error sending reply:', error);
          this.sending = false;
        }
      });
    }
  }

  replyToMessage(message: Message): void {
    const replyContent = `@${message.senderName} `;
    this.replyForm.patchValue({ content: replyContent });
    const textarea = document.querySelector('textarea[formControlName="content"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(replyContent.length, replyContent.length);
    }
  }

  forwardMessage(message: Message): void {
    this.router.navigate(['/messages/compose'], {
      queryParams: { forward: message.id }
    });
  }

  starMessage(message: Message): void {
    this.messagesService.starMessage(message.id).subscribe({
      next: () => {
        message.isStarred = !message.isStarred;
      }
    });
  }

  flagMessage(message: Message): void {
    this.messagesService.flagMessage(message.id).subscribe({
      next: () => {
        message.isFlagged = !message.isFlagged;
      }
    });
  }

  copyMessage(message: Message): void {
    navigator.clipboard.writeText(message.content).then(() => {
      // Show success notification
    });
  }

  deleteMessage(message: Message): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.messagesService.deleteMessage(message.id).subscribe({
        next: () => {
          if (this.thread) {
            const index = this.thread.messages.findIndex(m => m.id === message.id);
            if (index > -1) {
              this.thread.messages.splice(index, 1);
            }
          }
        }
      });
    }
  }

  attachFile(): void {
    // Implement file attachment logic
    console.log('Attach file clicked');
  }

  insertEmoji(): void {
    // Implement emoji picker logic
    console.log('Insert emoji clicked');
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}