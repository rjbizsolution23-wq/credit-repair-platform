import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="general-settings-container">
      <div class="card">
        <div class="card-header">
          <h3>General Settings</h3>
          <p>Manage your application's general configuration</p>
        </div>
        <div class="card-body">
          <div class="settings-section">
            <h4>Application Settings</h4>
            <div class="form-group">
              <label for="appName">Application Name</label>
              <input type="text" id="appName" class="form-control" placeholder="Enter application name">
            </div>
            <div class="form-group">
              <label for="timezone">Timezone</label>
              <select id="timezone" class="form-control">
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="CST">Central Time</option>
              </select>
            </div>
            <div class="form-group">
              <label for="language">Default Language</label>
              <select id="language" class="form-control">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>Display Settings</h4>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="darkMode">
                <span class="checkmark"></span>
                Enable Dark Mode
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="compactView">
                <span class="checkmark"></span>
                Compact View
              </label>
            </div>
          </div>
          
          <div class="settings-actions">
            <button type="button" class="btn btn-primary">Save Changes</button>
            <button type="button" class="btn btn-secondary">Reset to Defaults</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .general-settings-container {
      padding: 20px;
      max-width: 800px;
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
    
    .settings-section {
      margin-bottom: 30px;
    }
    
    .settings-section h4 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.2rem;
      border-bottom: 2px solid #007bff;
      padding-bottom: 5px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
    
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: normal;
    }
    
    .checkbox-label input[type="checkbox"] {
      margin-right: 8px;
    }
    
    .settings-actions {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      display: flex;
      gap: 10px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.3s ease;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #545b62;
    }
  `]
})
export class GeneralSettingsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Initialize component
  }

}