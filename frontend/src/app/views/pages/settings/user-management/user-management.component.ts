import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-management-container">
      <div class="card">
        <div class="card-header">
          <h3>User Management</h3>
          <p>Manage users, roles, and permissions</p>
        </div>
        <div class="card-body">
          <div class="management-section">
            <div class="section-header">
              <h4>Users</h4>
              <button type="button" class="btn btn-primary">Add New User</button>
            </div>
            <div class="users-table">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td>john&#64;example.com</td>
                    <td>Admin</td>
                    <td><span class="status active">Active</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline">Edit</button>
                      <button class="btn btn-sm btn-danger">Delete</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Jane Smith</td>
                    <td>jane&#64;example.com</td>
                    <td>User</td>
                    <td><span class="status active">Active</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline">Edit</button>
                      <button class="btn btn-sm btn-danger">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="management-section">
            <div class="section-header">
              <h4>Roles & Permissions</h4>
              <button type="button" class="btn btn-primary">Create Role</button>
            </div>
            <div class="roles-grid">
              <div class="role-card">
                <h5>Administrator</h5>
                <p>Full system access</p>
                <div class="permissions">
                  <span class="permission">Read</span>
                  <span class="permission">Write</span>
                  <span class="permission">Delete</span>
                  <span class="permission">Manage Users</span>
                </div>
                <button class="btn btn-sm btn-outline">Edit</button>
              </div>
              <div class="role-card">
                <h5>User</h5>
                <p>Standard user access</p>
                <div class="permissions">
                  <span class="permission">Read</span>
                  <span class="permission">Write</span>
                </div>
                <button class="btn btn-sm btn-outline">Edit</button>
              </div>
              <div class="role-card">
                <h5>Viewer</h5>
                <p>Read-only access</p>
                <div class="permissions">
                  <span class="permission">Read</span>
                </div>
                <button class="btn btn-sm btn-outline">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 20px;
      max-width: 1200px;
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
    
    .management-section {
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
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .table th,
    .table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    
    .table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    
    .status {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .status.active {
      background: #d4edda;
      color: #155724;
    }
    
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 10px;
    }
    
    .role-card {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      background: #f8f9fa;
    }
    
    .role-card h5 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1.1rem;
    }
    
    .role-card p {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    .permissions {
      margin-bottom: 15px;
    }
    
    .permission {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      margin-right: 5px;
      margin-bottom: 5px;
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
      margin-right: 5px;
    }
  `]
})
export class UserManagementComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Initialize component
  }

}