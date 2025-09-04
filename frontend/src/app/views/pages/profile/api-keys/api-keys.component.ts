import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="api-keys-container">
      <div class="card">
        <div class="card-header">
          <h3>API Keys</h3>
          <p>Manage your API keys for external integrations</p>
        </div>
        <div class="card-body">
          <div class="api-keys-section">
            <div class="section-header">
              <h4>Your API Keys</h4>
              <button type="button" class="btn btn-primary">Generate New Key</button>
            </div>
            <div class="api-keys-list">
              <div class="api-key-item">
                <div class="key-info">
                  <h5>Production API Key</h5>
                  <p class="key-description">Used for production environment</p>
                  <div class="key-value">
                    <code>sk_prod_1234567890abcdef...</code>
                    <button class="btn btn-sm btn-outline copy-btn">Copy</button>
                  </div>
                  <div class="key-meta">
                    <span class="created-date">Created: Jan 15, 2024</span>
                    <span class="last-used">Last used: 2 hours ago</span>
                  </div>
                </div>
                <div class="key-actions">
                  <button class="btn btn-sm btn-outline">Edit</button>
                  <button class="btn btn-sm btn-danger">Revoke</button>
                </div>
              </div>
              
              <div class="api-key-item">
                <div class="key-info">
                  <h5>Development API Key</h5>
                  <p class="key-description">Used for development and testing</p>
                  <div class="key-value">
                    <code>sk_dev_abcdef1234567890...</code>
                    <button class="btn btn-sm btn-outline copy-btn">Copy</button>
                  </div>
                  <div class="key-meta">
                    <span class="created-date">Created: Jan 10, 2024</span>
                    <span class="last-used">Last used: 1 day ago</span>
                  </div>
                </div>
                <div class="key-actions">
                  <button class="btn btn-sm btn-outline">Edit</button>
                  <button class="btn btn-sm btn-danger">Revoke</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="api-usage-section">
            <h4>API Usage</h4>
            <div class="usage-stats">
              <div class="stat-card">
                <h5>Requests This Month</h5>
                <p class="stat-value">12,450</p>
                <p class="stat-limit">of 50,000 limit</p>
              </div>
              <div class="stat-card">
                <h5>Rate Limit</h5>
                <p class="stat-value">1,000</p>
                <p class="stat-limit">requests per hour</p>
              </div>
              <div class="stat-card">
                <h5>Success Rate</h5>
                <p class="stat-value">99.8%</p>
                <p class="stat-limit">last 30 days</p>
              </div>
            </div>
          </div>
          
          <div class="api-docs-section">
            <h4>API Documentation</h4>
            <p>Learn how to integrate with our API and explore available endpoints.</p>
            <div class="docs-links">
              <a href="#" class="btn btn-outline">View Documentation</a>
              <a href="#" class="btn btn-outline">API Reference</a>
              <a href="#" class="btn btn-outline">Code Examples</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-keys-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .card-header {
      background: #f8f9fa;
      padding: 20px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .card-header h3 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.5rem;
    }
    
    .card-header p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .card-body {
      padding: 20px;
    }
    
    .api-keys-section,
    .api-usage-section,
    .api-docs-section {
      margin-bottom: 40px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .section-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }
    
    .api-key-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 15px;
      background: #f8f9fa;
    }
    
    .key-info {
      flex: 1;
    }
    
    .key-info h5 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.1rem;
    }
    
    .key-description {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .key-value {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .key-value code {
      background: #e9ecef;
      padding: 5px 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      color: #495057;
    }
    
    .key-meta {
      display: flex;
      gap: 20px;
      font-size: 0.8rem;
      color: #666;
    }
    
    .key-actions {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    
    .usage-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    
    .stat-card {
      padding: 20px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      text-align: center;
      background: #f8f9fa;
    }
    
    .stat-card h5 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 1rem;
    }
    
    .stat-value {
      margin: 0 0 5px 0;
      font-size: 2rem;
      font-weight: bold;
      color: #007bff;
    }
    
    .stat-limit {
      margin: 0;
      font-size: 0.8rem;
      color: #666;
    }
    
    .docs-links {
      display: flex;
      gap: 10px;
      margin-top: 15px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-outline {
      background-color: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }
    
    .btn-outline:hover {
      background-color: #007bff;
      color: white;
    }
    
    .btn-danger {
      background-color: #dc3545;
      color: white;
    }
    
    .btn-danger:hover {
      background-color: #c82333;
    }
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .copy-btn {
      font-size: 11px;
      padding: 2px 6px;
    }
  `]
})
export class ApiKeysComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Initialize component
  }

}