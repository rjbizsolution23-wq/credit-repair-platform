import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="notification-settings-container">
      <div class="card">
        <div class="card-header">
          <h3>Notification Settings</h3>
          <p>Manage how and when you receive notifications</p>
        </div>
        <div class="card-body">
          <div class="notification-sections">
            <div class="notification-section">
              <h4>Email Notifications</h4>
              <div class="notification-options">
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Credit Report Updates</h5>
                    <p>Get notified when your credit report changes</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Dispute Status Updates</h5>
                    <p>Receive updates on your dispute progress</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Account Activity</h5>
                    <p>Security alerts and account changes</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Marketing Updates</h5>
                    <p>Tips, news, and promotional offers</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="notification-section">
              <h4>SMS Notifications</h4>
              <div class="notification-options">
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Critical Alerts</h5>
                    <p>Important security and account alerts</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Dispute Updates</h5>
                    <p>SMS updates on dispute progress</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="notification-section">
              <h4>Push Notifications</h4>
              <div class="notification-options">
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Browser Notifications</h5>
                    <p>Real-time notifications in your browser</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
                
                <div class="notification-item">
                  <div class="notification-info">
                    <h5>Mobile App Notifications</h5>
                    <p>Push notifications on your mobile device</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="notification-section">
              <h4>Frequency Settings</h4>
              <div class="frequency-options">
                <div class="frequency-item">
                  <label for="digest-frequency">Email Digest Frequency</label>
                  <select id="digest-frequency" class="form-select">
                    <option value="daily">Daily</option>
                    <option value="weekly" selected>Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                
                <div class="frequency-item">
                  <label for="quiet-hours">Quiet Hours</label>
                  <div class="quiet-hours-inputs">
                    <input type="time" value="22:00" class="form-input">
                    <span>to</span>
                    <input type="time" value="08:00" class="form-input">
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="notification-actions">
            <button type="button" class="btn btn-outline">Reset to Defaults</button>
            <button type="button" class="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-settings-container {
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
    
    .notification-sections {
      margin-bottom: 30px;
    }
    
    .notification-section {
      margin-bottom: 30px;
    }
    
    .notification-section:last-child {
      margin-bottom: 0;
    }
    
    .notification-section h4 {
      margin: 0 0 16px 0;
      color: #111827;
      font-size: 1.25rem;
      font-weight: 600;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .notification-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .notification-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .notification-info h5 {
      margin: 0 0 4px 0;
      color: #111827;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .notification-info p {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
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
    
    .frequency-options {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .frequency-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .frequency-item label {
      color: #374151;
      font-weight: 500;
    }
    
    .form-select,
    .form-input {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: white;
    }
    
    .form-select:focus,
    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .quiet-hours-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .quiet-hours-inputs span {
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .notification-actions {
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
      .notification-settings-container {
        padding: 16px;
      }
      
      .notification-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      
      .toggle-switch {
        align-self: flex-end;
      }
      
      .notification-actions {
        flex-direction: column;
      }
      
      .quiet-hours-inputs {
        flex-wrap: wrap;
      }
    }
  `]
})
export class NotificationSettingsComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}