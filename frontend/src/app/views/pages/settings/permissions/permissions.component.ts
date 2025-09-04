import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  granted: boolean;
  required: boolean;
  lastModified: Date;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

interface AccessRequest {
  id: string;
  requester: string;
  permission: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestDate: Date;
  reviewDate?: Date;
  reviewer?: string;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, FeatherIconDirective],
  template: `
    <div class="permissions-container">
      <div class="page-header">
        <h1>Permissions & Access Control</h1>
        <p>Manage user permissions, roles, and access requests</p>
      </div>

      <!-- User Roles -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">User Roles</h5>
              <button type="button" class="btn btn-primary btn-sm" (click)="createRole()">
                <i data-feather="plus" appFeatherIcon></i>
                Create Role
              </button>
            </div>
            <div class="card-body">
              <div class="roles-grid">
                <div class="role-card" *ngFor="let role of userRoles">
                  <div class="role-header">
                    <h6 class="role-name">{{ role.name }}</h6>
                    <div class="role-status">
                      <span class="badge" [ngClass]="role.isActive ? 'bg-success' : 'bg-secondary'">
                        {{ role.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                  </div>
                  <p class="role-description">{{ role.description }}</p>
                  <div class="role-permissions">
                    <small class="text-muted">{{ role.permissions.length }} permissions assigned</small>
                  </div>
                  <div class="role-actions mt-3">
                    <button type="button" class="btn btn-outline-primary btn-sm me-2" (click)="editRole(role)">
                      <i data-feather="edit" appFeatherIcon></i>
                      Edit
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" (click)="deleteRole(role)">
                      <i data-feather="trash-2" appFeatherIcon></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permissions Management -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Permission Categories</h5>
            </div>
            <div class="card-body">
              <div class="permission-categories">
                <div class="category-section" *ngFor="let category of categories">
                  <h6 class="category-title">{{ category }}</h6>
                  <div class="permissions-list">
                    <div class="permission-item" *ngFor="let permission of getPermissionsByCategory(category)">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="permission-info">
                          <h6 class="permission-name">
                            {{ permission.name }}
                            <span class="badge bg-warning ms-2" *ngIf="permission.required">Required</span>
                          </h6>
                          <p class="permission-description">{{ permission.description }}</p>
                          <small class="text-muted">Last modified: {{ formatDate(permission.lastModified) }}</small>
                        </div>
                        <div class="permission-control">
                          <div class="form-check form-switch">
                            <input 
                              class="form-check-input" 
                              type="checkbox" 
                              [id]="'permission-' + permission.id"
                              [(ngModel)]="permission.granted"
                              [disabled]="permission.required"
                              (change)="updatePermission(permission)">
                            <label class="form-check-label" [for]="'permission-' + permission.id">
                              {{ permission.granted ? 'Granted' : 'Denied' }}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Access Requests -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Access Requests</h5>
              <div class="header-actions">
                <button type="button" class="btn btn-outline-primary btn-sm me-2" (click)="requestAccess()">
                  <i data-feather="plus" appFeatherIcon></i>
                  Request Access
                </button>
                <div class="btn-group" ngbDropdown role="group">
                  <button type="button" class="btn btn-outline-secondary btn-sm dropdown-toggle" ngbDropdownToggle>
                    Filter: {{ selectedFilter }}
                  </button>
                  <div class="dropdown-menu" ngbDropdownMenu>
                    <button class="dropdown-item" (click)="filterRequests('all')">All Requests</button>
                    <button class="dropdown-item" (click)="filterRequests('pending')">Pending</button>
                    <button class="dropdown-item" (click)="filterRequests('approved')">Approved</button>
                    <button class="dropdown-item" (click)="filterRequests('denied')">Denied</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="access-requests">
                <div class="request-item" *ngFor="let request of filteredRequests">
                  <div class="d-flex justify-content-between align-items-start">
                    <div class="request-info">
                      <h6 class="request-permission">{{ request.permission }}</h6>
                      <p class="request-details">
                        <strong>Requester:</strong> {{ request.requester }}<br>
                        <strong>Reason:</strong> {{ request.reason }}<br>
                        <strong>Requested:</strong> {{ formatDate(request.requestDate) }}
                        <span *ngIf="request.reviewDate">
                          <br><strong>Reviewed:</strong> {{ formatDate(request.reviewDate) }} by {{ request.reviewer }}
                        </span>
                      </p>
                    </div>
                    <div class="request-actions">
                      <span class="badge mb-2" [ngClass]="getRequestStatusClass(request.status)">
                        {{ request.status | titlecase }}
                      </span>
                      <div class="action-buttons" *ngIf="request.status === 'pending'">
                        <button type="button" class="btn btn-success btn-sm me-2" (click)="approveRequest(request)">
                          <i data-feather="check" appFeatherIcon></i>
                          Approve
                        </button>
                        <button type="button" class="btn btn-danger btn-sm" (click)="denyRequest(request)">
                          <i data-feather="x" appFeatherIcon></i>
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="text-center mt-3" *ngIf="filteredRequests.length === 0">
                  <p class="text-muted">No access requests found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Matrix -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Permission Matrix</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-bordered permission-matrix">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th *ngFor="let role of userRoles">{{ role.name }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let permission of permissions">
                      <td class="permission-name-cell">
                        <strong>{{ permission.name }}</strong>
                        <br>
                        <small class="text-muted">{{ permission.description }}</small>
                      </td>
                      <td *ngFor="let role of userRoles" class="text-center">
                        <div class="form-check form-switch d-flex justify-content-center">
                          <input 
                            class="form-check-input" 
                            type="checkbox" 
                            [checked]="hasRolePermission(role, permission)"
                            (change)="toggleRolePermission(role, permission, $event)">
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .permissions-container {
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

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .role-card {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      background-color: #fff;
      transition: box-shadow 0.2s;
    }

    .role-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .role-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 10px;
    }

    .role-name {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0;
      color: #2c3e50;
    }

    .role-description {
      color: #6c757d;
      margin-bottom: 10px;
    }

    .role-permissions {
      margin-bottom: 15px;
    }

    .category-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .category-section:last-child {
      border-bottom: none;
    }

    .category-title {
      color: #495057;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-size: 0.875rem;
      letter-spacing: 0.5px;
    }

    .permission-item {
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 10px;
      background-color: #fff;
    }

    .permission-item:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .permission-name {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 5px;
      color: #2c3e50;
    }

    .permission-description {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 5px;
    }

    .request-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .request-item:last-child {
      border-bottom: none;
    }

    .request-permission {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 10px;
      color: #2c3e50;
    }

    .request-details {
      font-size: 0.875rem;
      color: #6c757d;
      margin-bottom: 0;
      line-height: 1.6;
    }

    .permission-matrix {
      font-size: 0.875rem;
    }

    .permission-name-cell {
      min-width: 250px;
      vertical-align: middle;
    }

    .permission-matrix td {
      vertical-align: middle;
    }

    .badge.bg-success {
      background-color: #28a745 !important;
    }

    .badge.bg-warning {
      background-color: #ffc107 !important;
      color: #212529 !important;
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

    .form-check-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }
  `]
})
export class PermissionsComponent implements OnInit {
  selectedFilter: string = 'All';
  categories: string[] = ['User Management', 'Content Management', 'System Administration', 'Data Access'];

  userRoles: UserRole[] = [
    {
      id: '1',
      name: 'Administrator',
      description: 'Full system access with all permissions',
      permissions: ['user.create', 'user.edit', 'user.delete', 'content.create', 'content.edit', 'content.delete', 'system.config'],
      isActive: true
    },
    {
      id: '2',
      name: 'Editor',
      description: 'Content management and editing permissions',
      permissions: ['content.create', 'content.edit', 'user.view'],
      isActive: true
    },
    {
      id: '3',
      name: 'Viewer',
      description: 'Read-only access to content and data',
      permissions: ['content.view', 'user.view'],
      isActive: true
    },
    {
      id: '4',
      name: 'Guest',
      description: 'Limited access for temporary users',
      permissions: ['content.view'],
      isActive: false
    }
  ];

  permissions: Permission[] = [
    {
      id: '1',
      name: 'Create Users',
      description: 'Ability to create new user accounts',
      category: 'User Management',
      granted: true,
      required: false,
      lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Edit Users',
      description: 'Ability to modify existing user accounts',
      category: 'User Management',
      granted: true,
      required: false,
      lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      name: 'Delete Users',
      description: 'Ability to delete user accounts',
      category: 'User Management',
      granted: false,
      required: false,
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      name: 'View Users',
      description: 'Ability to view user information',
      category: 'User Management',
      granted: true,
      required: true,
      lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '5',
      name: 'Create Content',
      description: 'Ability to create new content',
      category: 'Content Management',
      granted: true,
      required: false,
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '6',
      name: 'Edit Content',
      description: 'Ability to modify existing content',
      category: 'Content Management',
      granted: true,
      required: false,
      lastModified: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      id: '7',
      name: 'Delete Content',
      description: 'Ability to delete content',
      category: 'Content Management',
      granted: false,
      required: false,
      lastModified: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    },
    {
      id: '8',
      name: 'View Content',
      description: 'Ability to view content',
      category: 'Content Management',
      granted: true,
      required: true,
      lastModified: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    },
    {
      id: '9',
      name: 'System Configuration',
      description: 'Ability to modify system settings',
      category: 'System Administration',
      granted: false,
      required: false,
      lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    {
      id: '10',
      name: 'Data Export',
      description: 'Ability to export system data',
      category: 'Data Access',
      granted: true,
      required: false,
      lastModified: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
    }
  ];

  accessRequests: AccessRequest[] = [
    {
      id: '1',
      requester: 'John Doe',
      permission: 'Delete Users',
      reason: 'Need to clean up inactive user accounts',
      status: 'pending',
      requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      requester: 'Jane Smith',
      permission: 'System Configuration',
      reason: 'Required for system maintenance tasks',
      status: 'approved',
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewer: 'Admin User'
    },
    {
      id: '3',
      requester: 'Bob Johnson',
      permission: 'Delete Content',
      reason: 'Need to remove outdated content',
      status: 'denied',
      requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reviewDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewer: 'Admin User'
    }
  ];

  filteredRequests: AccessRequest[] = [];

  ngOnInit(): void {
    this.filteredRequests = [...this.accessRequests];
  }

  getPermissionsByCategory(category: string): Permission[] {
    return this.permissions.filter(permission => permission.category === category);
  }

  updatePermission(permission: Permission): void {
    permission.lastModified = new Date();
    console.log('Updated permission:', permission);
    // Here you would typically save to backend
  }

  createRole(): void {
    console.log('Creating new role...');
    // Here you would open a role creation modal/dialog
    alert('Role creation functionality would be implemented here');
  }

  editRole(role: UserRole): void {
    console.log('Editing role:', role);
    // Here you would open a role editing modal/dialog
    alert(`Edit role functionality for ${role.name} would be implemented here`);
  }

  deleteRole(role: UserRole): void {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      this.userRoles = this.userRoles.filter(r => r.id !== role.id);
      console.log('Role deleted:', role);
    }
  }

  requestAccess(): void {
    console.log('Requesting access...');
    // Here you would open an access request modal/dialog
    alert('Access request functionality would be implemented here');
  }

  filterRequests(filter: string): void {
    this.selectedFilter = filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1);
    
    if (filter === 'all') {
      this.filteredRequests = [...this.accessRequests];
    } else {
      this.filteredRequests = this.accessRequests.filter(request => request.status === filter);
    }
  }

  approveRequest(request: AccessRequest): void {
    if (confirm(`Approve access request for "${request.permission}" by ${request.requester}?`)) {
      request.status = 'approved';
      request.reviewDate = new Date();
      request.reviewer = 'Current User'; // Would be actual user
      console.log('Request approved:', request);
    }
  }

  denyRequest(request: AccessRequest): void {
    if (confirm(`Deny access request for "${request.permission}" by ${request.requester}?`)) {
      request.status = 'denied';
      request.reviewDate = new Date();
      request.reviewer = 'Current User'; // Would be actual user
      console.log('Request denied:', request);
    }
  }

  getRequestStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-warning',
      'approved': 'bg-success',
      'denied': 'bg-danger'
    };
    return `badge ${classes[status] || 'bg-secondary'}`;
  }

  hasRolePermission(role: UserRole, permission: Permission): boolean {
    return role.permissions.includes(permission.id);
  }

  toggleRolePermission(role: UserRole, permission: Permission, event: any): void {
    const isChecked = event.target.checked;
    
    if (isChecked) {
      if (!role.permissions.includes(permission.id)) {
        role.permissions.push(permission.id);
      }
    } else {
      role.permissions = role.permissions.filter(p => p !== permission.id);
    }
    
    console.log(`Permission ${permission.name} ${isChecked ? 'granted to' : 'removed from'} role ${role.name}`);
    // Here you would typically save to backend
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