import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../messages.service';
import { MessageSettings } from '../messages.model';

@Component({
  selector: 'app-message-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-settings">
      <div class="page-header">
        <h2>Message Settings</h2>
        <p>Configure your messaging preferences and settings</p>
      </div>

      <div class="settings-container" *ngIf="settings">
        <div class="settings-section">
          <h3>General Settings</h3>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableNotifications" (change)="saveSettings()">
              Enable message notifications
            </label>
            <p class="setting-description">Receive notifications when new messages arrive</p>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableEmailNotifications" (change)="saveSettings()">
              Email notifications
            </label>
            <p class="setting-description">Send email notifications for important messages</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableSmsNotifications" (change)="saveSettings()">
              SMS notifications
            </label>
            <p class="setting-description">Send SMS notifications for urgent messages</p>
          </div>
        </div>

        <div class="settings-section">
          <h3>Auto-Reply Settings</h3>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableAutoReply" (change)="saveSettings()">
              Enable auto-reply
            </label>
            <p class="setting-description">Automatically respond to incoming messages</p>
          </div>

          <div class="setting-item" *ngIf="settings.enableAutoReply">
            <label for="autoReplyMessage">Auto-reply message</label>
            <textarea 
              id="autoReplyMessage" 
              class="form-control" 
              rows="3" 
              [(ngModel)]="settings.autoReplyMessage"
              (blur)="saveSettings()"
              placeholder="Enter your auto-reply message...">
            </textarea>
          </div>
        </div>

        <div class="settings-section">
          <h3>Message Retention</h3>
          <div class="setting-item">
            <label for="retentionPeriod">Delete messages after</label>
            <select id="retentionPeriod" class="form-control" [(ngModel)]="settings.retentionPeriod" (change)="saveSettings()">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">6 months</option>
              <option value="365">1 year</option>
              <option value="0">Never</option>
            </select>
            <p class="setting-description">Automatically delete old messages to save storage space</p>
          </div>
        </div>

        <div class="settings-section">
          <h3>Privacy Settings</h3>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableReadReceipts" (change)="saveSettings()">
              Send read receipts
            </label>
            <p class="setting-description">Let senders know when you've read their messages</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableTypingIndicators" (change)="saveSettings()">
              Show typing indicators
            </label>
            <p class="setting-description">Show when you're typing a response</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="settings.enableOnlineStatus" (change)="saveSettings()">
              Show online status
            </label>
            <p class="setting-description">Let others see when you're online</p>
          </div>
        </div>

        <div class="settings-section">
          <h3>Message Formatting</h3>
          <div class="setting-item">
            <label for="defaultFont">Default font</label>
            <select id="defaultFont" class="form-control" [(ngModel)]="settings.defaultFont" (change)="saveSettings()">
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="defaultFontSize">Default font size</label>
            <select id="defaultFontSize" class="form-control" [(ngModel)]="settings.defaultFontSize" (change)="saveSettings()">
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
            </select>
          </div>
        </div>

        <div class="settings-actions">
          <button type="button" class="btn btn-primary" (click)="saveSettings()" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Save Settings' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="resetSettings()">
            Reset to Defaults
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Loading settings...</p>
      </div>

      <div class="error" *ngIf="error">
        <p>{{ error }}</p>
      </div>

      <div class="success" *ngIf="successMessage">
        <p>{{ successMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .message-settings {
      padding: 20px;
      max-width: 800px;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .page-header h2 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .page-header p {
      margin: 0;
      color: #666;
    }

    .settings-section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .settings-section h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 2px solid #f8f9fa;
      padding-bottom: 10px;
    }

    .setting-item {
      margin-bottom: 20px;
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: flex;
      align-items: center;
      font-weight: 600;
      color: #333;
      cursor: pointer;
      margin-bottom: 5px;
    }

    .setting-label input[type="checkbox"] {
      margin-right: 10px;
      transform: scale(1.2);
    }

    .setting-description {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      margin-top: 5px;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .settings-actions {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      gap: 15px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .loading, .error, .success {
      text-align: center;
      padding: 40px;
    }

    .error {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    .success {
      color: #155724;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 4px;
    }

    label {
      font-weight: 600;
      margin-bottom: 5px;
      display: block;
      color: #333;
    }
  `]
})
export class MessageSettingsComponent implements OnInit {
  settings: MessageSettings | null = null;
  loading = false;
  saving = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(private messagesService: MessagesService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.error = null;

    this.messagesService.getSettings().subscribe({
      next: (settings: any) => {
        this.settings = settings;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load settings';
        this.loading = false;
        console.error('Settings error:', error);
      }
    });
  }

  saveSettings(): void {
    if (!this.settings) return;

    this.saving = true;
    this.error = null;
    this.successMessage = null;

    this.messagesService.updateSettings(this.settings).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = 'Settings saved successfully';
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (error: any) => {
        this.error = 'Failed to save settings';
        this.saving = false;
        console.error('Save settings error:', error);
      }
    });
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.loading = true;
      this.error = null;

      this.messagesService.resetSettings().subscribe({
        next: (settings: any) => {
          this.settings = settings;
          this.loading = false;
          this.successMessage = 'Settings reset to defaults';
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error: any) => {
          this.error = 'Failed to reset settings';
          this.loading = false;
          console.error('Reset settings error:', error);
        }
      });
    }
  }
}