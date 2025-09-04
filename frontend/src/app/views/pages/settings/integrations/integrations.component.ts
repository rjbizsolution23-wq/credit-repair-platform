import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  isConnected: boolean;
  isEnabled: boolean;
  lastSync?: Date;
  icon: string;
  features: string[];
  configUrl?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  createdDate: Date;
  lastUsed?: Date;
  isActive: boolean;
  permissions: string[];
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, FeatherIconDirective],
  template: `
    <div class="integrations-container">
      <div class="page-header">
        <h1>Integrations & API</h1>
        <p>Manage third-party integrations, API keys, and webhooks</p>
      </div>

      <!-- Integration Categories -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Available Integrations</h5>
            </div>
            <div class="card-body">
              <div class="integration-categories">
                <div class="category-section" *ngFor="let category of categories">
                  <h6 class="category-title">{{ category }}</h6>
                  <div class="integrations-grid">
                    <div class="integration-card" *ngFor="let integration of getIntegrationsByCategory(category)">
                      <div class="integration-header">
                        <div class="integration-icon">
                          <i [attr.data-feather]="integration.icon" appFeatherIcon></i>
                        </div>
                        <div class="integration-info">
                          <h6 class="integration-name">{{ integration.name }}</h6>
                          <p class="integration-provider">by {{ integration.provider }}</p>
                        </div>
                        <div class="integration-status">
                          <span class="badge" [ngClass]="integration.isConnected ? 'bg-success' : 'bg-secondary'">
                            {{ integration.isConnected ? 'Connected' : 'Not Connected' }}
                          </span>
                        </div>
                      </div>
                      <p class="integration-description">{{ integration.description }}</p>
                      <div class="integration-features">
                        <span class="feature-tag" *ngFor="let feature of integration.features">{{ feature }}</span>
                      </div>
                      <div class="integration-actions mt-3">
                        <button 
                          type="button" 
                          class="btn btn-sm me-2"
                          [ngClass]="integration.isConnected ? 'btn-outline-danger' : 'btn-primary'"
                          (click)="toggleIntegration(integration)">
                          <i [attr.data-feather]="integration.isConnected ? 'unlink' : 'link'" appFeatherIcon></i>
                          {{ integration.isConnected ? 'Disconnect' : 'Connect' }}
                        </button>
                        <button 
                          type="button" 
                          class="btn btn-outline-secondary btn-sm"
                          *ngIf="integration.isConnected"
                          (click)="configureIntegration(integration)">
                          <i data-feather="settings" appFeatherIcon></i>
                          Configure
                        </button>
                      </div>
                      <div class="integration-sync" *ngIf="integration.isConnected && integration.lastSync">
                        <small class="text-muted">Last sync: {{ formatDate(integration.lastSync) }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- API Keys Management -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">API Keys</h5>
              <button type="button" class="btn btn-primary btn-sm" (click)="createApiKey()">
                <i data-feather="plus" appFeatherIcon></i>
                Generate API Key
              </button>
            </div>
            <div class="card-body">
              <div class="api-keys-list">
                <div class="api-key-item" *ngFor="let apiKey of apiKeys">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="api-key-info">
                      <h6 class="api-key-name">{{ apiKey.name }}</h6>
                      <p class="api-key-details">
                        <strong>Service:</strong> {{ apiKey.service }}<br>
                        <strong>Created:</strong> {{ formatDate(apiKey.createdDate) }}
                        <span *ngIf="apiKey.lastUsed">
                          <br><strong>Last used:</strong> {{ formatDate(apiKey.lastUsed) }}
                        </span>
                      </p>
                      <div class="api-key-permissions">
                        <span class="permission-badge" *ngFor="let permission of apiKey.permissions">{{ permission }}</span>
                      </div>
                    </div>
                    <div class="api-key-actions">
                      <span class="badge mb-2" [ngClass]="apiKey.isActive ? 'bg-success' : 'bg-secondary'">
                        {{ apiKey.isActive ? 'Active' : 'Inactive' }}
                      </span>
                      <div class="action-buttons">
                        <button type="button" class="btn btn-outline-primary btn-sm me-2" (click)="viewApiKey(apiKey)">
                          <i data-feather="eye" appFeatherIcon></i>
                          View
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm me-2" (click)="regenerateApiKey(apiKey)">
                          <i data-feather="refresh-cw" appFeatherIcon></i>
                          Regenerate
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" (click)="deleteApiKey(apiKey)">
                          <i data-feather="trash-2" appFeatherIcon></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="apiKeys.length === 0">
                  <p class="text-muted">No API keys created yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhooks Management -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Webhooks</h5>
              <button type="button" class="btn btn-primary btn-sm" (click)="createWebhook()">
                <i data-feather="plus" appFeatherIcon></i>
                Create Webhook
              </button>
            </div>
            <div class="card-body">
              <div class="webhooks-list">
                <div class="webhook-item" *ngFor="let webhook of webhooks">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="webhook-info">
                      <h6 class="webhook-name">{{ webhook.name }}</h6>
                      <p class="webhook-details">
                        <strong>URL:</strong> {{ webhook.url }}<br>
                        <strong>Events:</strong> {{ webhook.events.join(', ') }}
                        <span *ngIf="webhook.lastTriggered">
                          <br><strong>Last triggered:</strong> {{ formatDate(webhook.lastTriggered) }}
                        </span>
                      </p>
                      <div class="webhook-stats">
                        <span class="stat-badge success">{{ webhook.successCount }} success</span>
                        <span class="stat-badge danger" *ngIf="webhook.failureCount > 0">{{ webhook.failureCount }} failures</span>
                      </div>
                    </div>
                    <div class="webhook-actions">
                      <span class="badge mb-2" [ngClass]="webhook.isActive ? 'bg-success' : 'bg-secondary'">
                        {{ webhook.isActive ? 'Active' : 'Inactive' }}
                      </span>
                      <div class="action-buttons">
                        <button type="button" class="btn btn-outline-primary btn-sm me-2" (click)="testWebhook(webhook)">
                          <i data-feather="send" appFeatherIcon></i>
                          Test
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm me-2" (click)="editWebhook(webhook)">
                          <i data-feather="edit" appFeatherIcon></i>
                          Edit
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" (click)="deleteWebhook(webhook)">
                          <i data-feather="trash-2" appFeatherIcon></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="webhooks.length === 0">
                  <p class="text-muted">No webhooks configured yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Integration Logs -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Integration Activity Log</h5>
            </div>
            <div class="card-body">
              <div class="activity-log">
                <div class="log-item" *ngFor="let logEntry of integrationLogs">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="log-info">
                      <h6 class="log-action">{{ logEntry.action }}</h6>
                      <p class="log-details">
                        {{ logEntry.details }}
                        <br>
                        <small class="text-muted">{{ formatDate(logEntry.timestamp) }}</small>
                      </p>
                    </div>
                    <div class="log-status">
                      <span class="badge" [ngClass]="getLogStatusClass(logEntry.status)">
                        {{ logEntry.status }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="integrationLogs.length === 0">
                  <p class="text-muted">No integration activity recorded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .integrations-container {
      padding: 20px;
    }

    .page-header {
      margin-bottom: 30px;
    }

    .page-header h1 {
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .page-header p {
      color: #6c757d;
      margin-bottom: 0;
    }

    .category-section {
      margin-bottom: 30px;
    }

    .category-title {
      color: #495057;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-size: 0.875rem;
      letter-spacing: 0.5px;
    }

    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .integration-card {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      background-color: #fff;
      transition: box-shadow 0.2s;
    }

    .integration-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .integration-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }

    .integration-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
    }

    .integration-info {
      flex: 1;
    }

    .integration-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 2px;
      color: #2c3e50;
    }

    .integration-provider {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
    }

    .integration-description {
      color: #6c757d;
      margin-bottom: 15px;
      font-size: 0.875rem;
    }

    .integration-features {
      margin-bottom: 15px;
    }

    .feature-tag {
      display: inline-block;
      background-color: #e9ecef;
      color: #495057;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-right: 5px;
      margin-bottom: 5px;
    }

    .integration-sync {
      margin-top: 10px;
    }

    .api-key-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .api-key-item:last-child {
      border-bottom: none;
    }

    .api-key-name {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .api-key-details {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .api-key-permissions {
      margin-bottom: 10px;
    }

    .permission-badge {
      display: inline-block;
      background-color: #17a2b8;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-right: 5px;
      margin-bottom: 5px;
    }

    .webhook-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .webhook-item:last-child {
      border-bottom: none;
    }

    .webhook-name {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .webhook-details {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 10px;
      line-height: 1.6;
    }

    .webhook-stats {
      margin-bottom: 10px;
    }

    .stat-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-right: 5px;
      margin-bottom: 5px;
    }

    .stat-badge.success {
      background-color: #28a745;
      color: white;
    }

    .stat-badge.danger {
      background-color: #dc3545;
      color: white;
    }

    .log-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .log-item:last-child {
      border-bottom: none;
    }

    .log-action {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 5px;
      color: #2c3e50;
    }

    .log-details {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .badge.bg-success {
      background-color: #28a745 !important;
    }

    .badge.bg-warning {
      background-color: #ffc107 !important;
    }

    .badge.bg-danger {
      background-color: #dc3545 !important;
    }

    .badge.bg-secondary {
      background-color: #6c757d !important;
    }

    .badge.bg-info {
      background-color: #17a2b8 !important;
    }
  `]
})
export class IntegrationsComponent implements OnInit {
  categories: string[] = ['CRM & Sales', 'Marketing', 'Analytics', 'Communication', 'Development'];

  integrations: Integration[] = [
    {
      id: '1',
      name: 'Salesforce',
      description: 'Sync customer data and manage leads directly from your CRM',
      category: 'CRM & Sales',
      provider: 'Salesforce',
      isConnected: true,
      isEnabled: true,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: 'database',
      features: ['Lead Management', 'Contact Sync', 'Opportunity Tracking']
    },
    {
      id: '2',
      name: 'HubSpot',
      description: 'Integrate with HubSpot for comprehensive marketing automation',
      category: 'CRM & Sales',
      provider: 'HubSpot',
      isConnected: false,
      isEnabled: false,
      icon: 'target',
      features: ['Marketing Automation', 'Lead Scoring', 'Email Campaigns']
    },
    {
      id: '3',
      name: 'Mailchimp',
      description: 'Sync email lists and automate marketing campaigns',
      category: 'Marketing',
      provider: 'Mailchimp',
      isConnected: true,
      isEnabled: true,
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      icon: 'mail',
      features: ['Email Marketing', 'List Management', 'Campaign Analytics']
    },
    {
      id: '4',
      name: 'Google Analytics',
      description: 'Track website performance and user behavior',
      category: 'Analytics',
      provider: 'Google',
      isConnected: true,
      isEnabled: true,
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      icon: 'bar-chart',
      features: ['Traffic Analysis', 'Conversion Tracking', 'Custom Reports']
    },
    {
      id: '5',
      name: 'Slack',
      description: 'Receive notifications and updates in your Slack workspace',
      category: 'Communication',
      provider: 'Slack',
      isConnected: false,
      isEnabled: false,
      icon: 'message-square',
      features: ['Real-time Notifications', 'Team Collaboration', 'Custom Alerts']
    },
    {
      id: '6',
      name: 'GitHub',
      description: 'Connect your development workflow and track code changes',
      category: 'Development',
      provider: 'GitHub',
      isConnected: true,
      isEnabled: true,
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      icon: 'github',
      features: ['Repository Sync', 'Issue Tracking', 'Pull Request Notifications']
    }
  ];

  apiKeys: ApiKey[] = [
    {
      id: '1',
      name: 'Production API Key',
      key: 'pk_live_51H***************',
      service: 'Main Application',
      createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isActive: true,
      permissions: ['read', 'write', 'delete']
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'pk_test_51H***************',
      service: 'Development Environment',
      createdDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isActive: true,
      permissions: ['read', 'write']
    },
    {
      id: '3',
      name: 'Analytics API Key',
      key: 'ak_live_51H***************',
      service: 'Analytics Service',
      createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isActive: false,
      permissions: ['read']
    }
  ];

  webhooks: Webhook[] = [
    {
      id: '1',
      name: 'Payment Notifications',
      url: 'https://api.example.com/webhooks/payments',
      events: ['payment.success', 'payment.failed'],
      isActive: true,
      secret: 'whsec_***************',
      lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
      successCount: 1247,
      failureCount: 3
    },
    {
      id: '2',
      name: 'User Registration',
      url: 'https://api.example.com/webhooks/users',
      events: ['user.created', 'user.updated'],
      isActive: true,
      secret: 'whsec_***************',
      lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
      successCount: 892,
      failureCount: 0
    },
    {
      id: '3',
      name: 'Order Processing',
      url: 'https://api.example.com/webhooks/orders',
      events: ['order.created', 'order.completed', 'order.cancelled'],
      isActive: false,
      secret: 'whsec_***************',
      successCount: 0,
      failureCount: 0
    }
  ];

  integrationLogs: any[] = [
    {
      action: 'Salesforce Sync Completed',
      details: 'Successfully synced 150 contacts and 25 leads',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'success'
    },
    {
      action: 'Google Analytics Connected',
      details: 'Analytics integration configured and activated',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'success'
    },
    {
      action: 'Mailchimp Sync Failed',
      details: 'Authentication error - API key expired',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'error'
    },
    {
      action: 'Webhook Test Sent',
      details: 'Test payload sent to payment notification webhook',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'info'
    }
  ];

  ngOnInit(): void {
    this.loadIntegrations();
  }

  getIntegrationsByCategory(category: string): Integration[] {
    return this.integrations.filter(integration => integration.category === category);
  }

  toggleIntegration(integration: Integration): void {
    if (integration.isConnected) {
      if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
        integration.isConnected = false;
        integration.isEnabled = false;
        integration.lastSync = undefined;
        console.log('Integration disconnected:', integration);
      }
    } else {
      console.log('Connecting integration:', integration);
      // Here you would open the OAuth flow or configuration modal
      alert(`Connection flow for ${integration.name} would be implemented here`);
      // Simulate successful connection
      integration.isConnected = true;
      integration.isEnabled = true;
      integration.lastSync = new Date();
    }
  }

  configureIntegration(integration: Integration): void {
    console.log('Configuring integration:', integration);
    alert(`Configuration panel for ${integration.name} would be implemented here`);
  }

  createApiKey(): void {
    console.log('Creating new API key...');
    alert('API key generation form would be implemented here');
  }

  viewApiKey(apiKey: ApiKey): void {
    console.log('Viewing API key:', apiKey);
    alert(`API Key: ${apiKey.key}\n\nWarning: This is sensitive information. Store it securely.`);
  }

  regenerateApiKey(apiKey: ApiKey): void {
    if (confirm(`Are you sure you want to regenerate the API key for ${apiKey.name}? The old key will be invalidated.`)) {
      const newKey = 'pk_' + Math.random().toString(36).substring(2, 15);
      apiKey.key = newKey + '***************';
      apiKey.createdDate = new Date();
      console.log('API key regenerated:', apiKey);
      alert(`New API key generated: ${newKey}***************`);
    }
  }

  deleteApiKey(apiKey: ApiKey): void {
    if (confirm(`Are you sure you want to delete the API key "${apiKey.name}"? This action cannot be undone.`)) {
      this.apiKeys = this.apiKeys.filter(key => key.id !== apiKey.id);
      console.log('API key deleted:', apiKey);
    }
  }

  createWebhook(): void {
    console.log('Creating new webhook...');
    alert('Webhook creation form would be implemented here');
  }

  testWebhook(webhook: Webhook): void {
    console.log('Testing webhook:', webhook);
    alert(`Test payload sent to ${webhook.url}`);
    webhook.lastTriggered = new Date();
    webhook.successCount++;
  }

  editWebhook(webhook: Webhook): void {
    console.log('Editing webhook:', webhook);
    alert(`Webhook editing form for ${webhook.name} would be implemented here`);
  }

  deleteWebhook(webhook: Webhook): void {
    if (confirm(`Are you sure you want to delete the webhook "${webhook.name}"?`)) {
      this.webhooks = this.webhooks.filter(wh => wh.id !== webhook.id);
      console.log('Webhook deleted:', webhook);
    }
  }

  loadIntegrations(): void {
    // Here you would load integrations from backend
    console.log('Loading integrations...');
  }

  getLogStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'success': 'bg-success',
      'warning': 'bg-warning',
      'error': 'bg-danger',
      'info': 'bg-info'
    };
    return `badge ${classes[status] || 'bg-secondary'}`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}