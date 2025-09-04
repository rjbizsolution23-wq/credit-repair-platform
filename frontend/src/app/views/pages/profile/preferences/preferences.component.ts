import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="preferences-container">
      <div class="card">
        <div class="card-header">
          <h3>Preferences</h3>
          <p>Customize your account settings and preferences</p>
        </div>
        <div class="card-body">
          <div class="preferences-sections">
            <div class="preference-section">
              <h4>Display Settings</h4>
              <div class="preference-options">
                <div class="preference-item">
                  <label for="theme-select">Theme</label>
                  <select id="theme-select" class="form-select">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                
                <div class="preference-item">
                  <label for="language-select">Language</label>
                  <select id="language-select" class="form-select">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                
                <div class="preference-item">
                  <label for="timezone-select">Timezone</label>
                  <select id="timezone-select" class="form-select">
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
                
                <div class="preference-item">
                  <label for="date-format">Date Format</label>
                  <select id="date-format" class="form-select">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="preference-section">
              <h4>Dashboard Settings</h4>
              <div class="preference-options">
                <div class="preference-item checkbox-item">
                  <div class="checkbox-info">
                    <h5>Show Credit Score Widget</h5>
                    <p>Display your credit score prominently on the dashboard</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="preference-item checkbox-item">
                  <div class="checkbox-info">
                    <h5>Show Recent Activity</h5>
                    <p>Display recent account activity on the dashboard</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="preference-item checkbox-item">
                  <div class="checkbox-info">
                    <h5>Show Quick Actions</h5>
                    <p>Display quick action buttons for common tasks</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="preference-item">
                  <label for="dashboard-refresh">Auto-refresh Interval</label>
                  <select id="dashboard-refresh" class="form-select">
                    <option value="never">Never</option>
                    <option value="5">Every 5 minutes</option>
                    <option value="15" selected>Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                    <option value="60">Every hour</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="preference-section">
              <h4>Privacy Settings</h4>
              <div class="preference-options">
                <div class="preference-item checkbox-item">
                  <div class="checkbox-info">
                    <h5>Analytics & Usage Data</h5>
                    <p>Help improve our service by sharing anonymous usage data</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="preference-item checkbox-item">
                  <div class="checkbox-info">
                    <h5>Personalized Recommendations</h5>
                    <p>Receive personalized tips and recommendations</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="preference-item checkbox-item">
                  <div class="checkbox-info">
                    <h5>Third-party Integrations</h5>
                    <p>Allow third-party services to access your data</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="preference-section">
              <h4>Communication Preferences</h4>
              <div class="preference-options">
                <div class="preference-item">
                  <label for="contact-method">Preferred Contact Method</label>
                  <select id="contact-method" class="form-select">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="phone">Phone</option>
                    <option value="app">In-App Notifications</option>
                  </select>
                </div>
                
                <div class="preference-item">
                  <label for="communication-frequency">Communication Frequency</label>
                  <select id="communication-frequency" class="form-select">
                    <option value="immediate">Immediate</option>
                    <option value="daily" selected>Daily Digest</option>
                    <option value="weekly">Weekly Summary</option>
                    <option value="monthly">Monthly Report</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div class="preferences-actions">
            <button type="button" class="btn btn-outline">Reset to Defaults</button>
            <button type="button" class="btn btn-primary">Save Preferences</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preferences-container {
      padding: 20px;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .card-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    
    .card-header h3 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .card-header p {
      margin: 0;
      color: #6b7280;
    }
    
    .card-body {
      padding: 20px;
    }
    
    .preferences-sections {
      margin-bottom: 30px;
    }
    
    .preference-section {
      margin-bottom: 30px;
    }
    
    .preference-section:last-child {
      margin-bottom: 0;
    }
    
    .preference-section h4 {
      margin: 0 0 16px 0;
      color: #111827;
      font-size: 1.25rem;
      font-weight: 600;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .preference-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .preference-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .preference-item.checkbox-item {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .preference-item label {
      color: #374151;
      font-weight: 500;
      font-size: 0.875rem;
    }
    
    .checkbox-info h5 {
      margin: 0 0 4px 0;
      color: #111827;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .checkbox-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .form-select {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
      color: #374151;
    }
    
    .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 24px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: #3b82f6;
    }
    
    input:checked + .slider:before {
      transform: translateX(26px);
    }
    
    .preferences-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-outline {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .btn-outline:hover {
      background: #f9fafb;
    }
    
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2563eb;
    }
    
    @media (max-width: 768px) {
      .preferences-container {
        padding: 16px;
      }
      
      .preference-item.checkbox-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .toggle-switch {
        align-self: flex-end;
      }
      
      .preferences-actions {
        flex-direction: column;
      }
    }
  `]
})
export class PreferencesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}