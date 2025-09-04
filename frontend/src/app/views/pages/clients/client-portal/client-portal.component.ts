import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {
  ClientPortalService,
  ClientPortalUser,
  PortalPermission,
  PortalInvitation,
  ClientDocument,
  ClientMilestone,
  ClientProgress,
  ClientDashboard,
  ClientPortalAnalytics
} from '../../../../core/services/client-portal.service';

@Component({
  selector: 'app-client-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-portal.component.html',
  styleUrls: ['./client-portal.component.scss']
})
export class ClientPortalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State
  isLoading = false;
  error: string | null = null;
  activeTab: 'overview' | 'users' | 'invitations' | 'documents' | 'milestones' | 'analytics' = 'overview';
  
  // Data
  portalUsers: ClientPortalUser[] = [];
  invitations: PortalInvitation[] = [];
  availablePermissions: PortalPermission[] = [];
  documents: ClientDocument[] = [];
  milestones: ClientMilestone[] = [];
  analytics: ClientPortalAnalytics | null = null;
  
  // Forms
  inviteForm: FormGroup;
  settingsForm: FormGroup;
  documentUploadForm: FormGroup;
  milestoneForm: FormGroup;
  
  // UI State
  showInviteModal = false;
  showSettingsModal = false;
  showDocumentModal = false;
  showMilestoneModal = false;
  showDeleteConfirm = false;
  selectedUser: ClientPortalUser | null = null;
  selectedInvitation: PortalInvitation | null = null;
  selectedDocument: ClientDocument | null = null;
  selectedMilestone: ClientMilestone | null = null;
  isSubmitting = false;
  isDeleting = false;
  
  // Search and Filter
  searchTerm = '';
  statusFilter = 'all';
  documentTypeFilter = 'all';
  milestoneStatusFilter = 'all';
  
  // File Upload
  selectedFiles: File[] = [];
  uploadProgress = 0;
  isUploading = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  constructor(
    private fb: FormBuilder,
    private clientPortalService: ClientPortalService,
    private toastr: ToastrService
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.loadPortalData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForms(): void {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      clientId: ['', Validators.required],
      permissions: [[], Validators.required],
      message: [''],
      expiresInDays: [7, [Validators.required, Validators.min(1), Validators.max(30)]]
    });
    
    this.settingsForm = this.fb.group({
      allowSelfRegistration: [false],
      requireEmailVerification: [true],
      sessionTimeout: [30, [Validators.required, Validators.min(5)]],
      maxLoginAttempts: [5, [Validators.required, Validators.min(3)]],
      passwordPolicy: this.fb.group({
        minLength: [8, [Validators.required, Validators.min(6)]],
        requireUppercase: [true],
        requireNumbers: [true],
        requireSpecialChars: [true]
      })
    });
    
    this.documentUploadForm = this.fb.group({
      clientId: ['', Validators.required],
      type: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      tags: [''],
      isRequired: [false],
      expiryDate: [null]
    });
    
    this.milestoneForm = this.fb.group({
      clientId: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      targetDate: [null],
      requirements: this.fb.array([])
    });
  }
  
  private loadPortalData(): void {
    this.isLoading = true;
    this.error = null;
    
    forkJoin({
      users: this.clientPortalService.getPortalUsers(),
      invitations: this.clientPortalService.getInvitations(),
      permissions: this.clientPortalService.getAvailablePermissions(),
      analytics: this.clientPortalService.getPortalAnalytics()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        this.portalUsers = data.users;
        this.invitations = data.invitations;
        this.availablePermissions = data.permissions;
        this.analytics = data.analytics;
        this.totalItems = this.portalUsers.length;
      },
      error: (error) => {
        this.error = 'Failed to load portal data. Please try again.';
        this.toastr.error('Failed to load portal data', 'Error');
        console.error('Portal data loading error:', error);
        this.loadMockData();
      }
    });
  }
  
  private loadMockData(): void {
    // Mock data for development/fallback
    this.portalUsers = [
      {
        id: '1',
        clientId: 'client-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0123',
        lastLogin: new Date('2024-01-15'),
        isActive: true,
        permissions: [],
        preferences: {
          notifications: { email: true, sms: false, push: true, frequency: 'daily' },
          dashboard: { layout: 'detailed', widgets: ['progress', 'score', 'disputes'] },
          privacy: { shareProgress: false, allowMarketing: true }
        },
        onboardingCompleted: true,
        twoFactorEnabled: false
      }
    ];
    
    this.invitations = [
      {
        id: '1',
        email: 'jane.smith@example.com',
        clientId: 'client-2',
        clientName: 'Jane Smith',
        invitedBy: 'Admin User',
        invitedDate: new Date('2024-01-10'),
        expiresDate: new Date('2024-01-17'),
        status: 'pending',
        permissions: ['documents', 'disputes']
      }
    ];
    
    this.analytics = {
      totalUsers: 150,
      activeUsers: 120,
      loginStats: { daily: 45, weekly: 98, monthly: 135 },
      documentStats: { totalUploads: 1250, pendingReview: 23, approvedToday: 8 },
      engagementMetrics: {
        averageSessionTime: 1800,
        pageViews: 5420,
        featureUsage: {
          'documents': 89,
          'progress': 156,
          'disputes': 67,
          'milestones': 34
        }
      }
    };
  }
  
  // Tab Management
  setActiveTab(tab: 'overview' | 'users' | 'invitations' | 'documents' | 'milestones' | 'analytics'): void {
    this.activeTab = tab;
    
    // Load tab-specific data
    switch (tab) {
      case 'documents':
        this.loadDocuments();
        break;
      case 'milestones':
        this.loadMilestones();
        break;
    }
  }
  
  // User Management
  onInviteUser(): void {
    this.selectedUser = null;
    this.inviteForm.reset({
      expiresInDays: 7
    });
    this.showInviteModal = true;
  }
  
  onSubmitInvite(): void {
    if (this.inviteForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.inviteForm.value;
      
      const invitationData = {
        email: formData.email,
        clientId: formData.clientId,
        permissions: formData.permissions,
        message: formData.message,
        expiresDate: new Date(Date.now() + formData.expiresInDays * 24 * 60 * 60 * 1000)
      };
      
      this.clientPortalService.sendInvitation(invitationData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (invitation) => {
            this.invitations.push(invitation);
            this.showInviteModal = false;
            this.toastr.success('Invitation sent successfully', 'Success');
          },
          error: (error) => {
            this.toastr.error('Failed to send invitation', 'Error');
            console.error('Invitation error:', error);
          }
        });
    }
  }
  
  onEditUser(user: ClientPortalUser): void {
    this.selectedUser = user;
    // Populate edit form with user data
  }
  
  onToggleUserStatus(user: ClientPortalUser): void {
    this.clientPortalService.toggleUserStatus(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          const index = this.portalUsers.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.portalUsers[index] = updatedUser;
          }
          this.toastr.success(
            `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
            'Success'
          );
        },
        error: (error) => {
          this.toastr.error('Failed to update user status', 'Error');
          console.error('User status update error:', error);
        }
      });
  }
  
  onDeleteUser(user: ClientPortalUser): void {
    this.selectedUser = user;
    this.showDeleteConfirm = true;
  }
  
  confirmDeleteUser(): void {
    if (this.selectedUser && !this.isDeleting) {
      this.isDeleting = true;
      
      this.clientPortalService.deletePortalUser(this.selectedUser.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isDeleting = false;
            this.showDeleteConfirm = false;
            this.selectedUser = null;
          })
        )
        .subscribe({
          next: () => {
            this.portalUsers = this.portalUsers.filter(u => u.id !== this.selectedUser!.id);
            this.toastr.success('User deleted successfully', 'Success');
          },
          error: (error) => {
            this.toastr.error('Failed to delete user', 'Error');
            console.error('User deletion error:', error);
          }
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.selectedUser = null;
    this.isDeleting = false;
  }
  
  // Invitation Management
  onResendInvitation(invitation: PortalInvitation): void {
    this.clientPortalService.resendInvitation(invitation.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedInvitation) => {
          const index = this.invitations.findIndex(i => i.id === invitation.id);
          if (index !== -1) {
            this.invitations[index] = updatedInvitation;
          }
          this.toastr.success('Invitation resent successfully', 'Success');
        },
        error: (error) => {
          this.toastr.error('Failed to resend invitation', 'Error');
          console.error('Resend invitation error:', error);
        }
      });
  }
  
  onRevokeInvitation(invitation: PortalInvitation): void {
    this.selectedInvitation = invitation;
    this.showDeleteConfirm = true;
  }
  
  confirmRevokeInvitation(): void {
    if (this.selectedInvitation && !this.isDeleting) {
      this.isDeleting = true;
      
      this.clientPortalService.revokeInvitation(this.selectedInvitation.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isDeleting = false;
            this.showDeleteConfirm = false;
            this.selectedInvitation = null;
          })
        )
        .subscribe({
          next: () => {
            this.invitations = this.invitations.filter(i => i.id !== this.selectedInvitation!.id);
            this.toastr.success('Invitation revoked successfully', 'Success');
          },
          error: (error) => {
            this.toastr.error('Failed to revoke invitation', 'Error');
            console.error('Revoke invitation error:', error);
          }
        });
    }
  }
  
  // Document Management
  private loadDocuments(): void {
    // Load documents for all clients or specific client
    // Implementation depends on requirements
  }
  
  onUploadDocument(): void {
    this.documentUploadForm.reset();
    this.selectedFiles = [];
    this.showDocumentModal = true;
  }
  
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = [];
    
    files.forEach(file => {
      const validation = this.clientPortalService.validateDocumentUpload(file);
      if (validation.isValid) {
        this.selectedFiles.push(file);
      } else {
        this.toastr.error(validation.errors.join(', '), 'Invalid File');
      }
    });
  }
  
  onSubmitDocumentUpload(): void {
    if (this.documentUploadForm.valid && this.selectedFiles.length > 0 && !this.isUploading) {
      this.isUploading = true;
      const formData = this.documentUploadForm.value;
      
      // Upload files sequentially or in parallel
      const uploadPromises = this.selectedFiles.map(file => 
        this.clientPortalService.uploadDocument(formData.clientId, file, {
          type: formData.type,
          category: formData.category,
          description: formData.description,
          tags: formData.tags.split(',').map((tag: string) => tag.trim()),
          isRequired: formData.isRequired,
          expiryDate: formData.expiryDate
        }).toPromise()
      );
      
      Promise.all(uploadPromises)
        .then(uploadedDocuments => {
          this.documents.push(...uploadedDocuments.filter((doc): doc is ClientDocument => doc !== null && doc !== undefined));
          this.showDocumentModal = false;
          this.toastr.success(`${uploadedDocuments.length} document(s) uploaded successfully`, 'Success');
        })
        .catch(error => {
          this.toastr.error('Failed to upload documents', 'Error');
          console.error('Document upload error:', error);
        })
        .finally(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
        });
    }
  }
  
  // Milestone Management
  private loadMilestones(): void {
    // Load milestones for all clients or specific client
    // Implementation depends on requirements
  }
  
  onCreateMilestone(): void {
    this.selectedMilestone = null;
    this.milestoneForm.reset();
    this.showMilestoneModal = true;
  }
  
  onSubmitMilestone(): void {
    if (this.milestoneForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.milestoneForm.value;
      
      this.clientPortalService.createMilestone(formData.clientId, formData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (milestone) => {
            this.milestones.push(milestone);
            this.showMilestoneModal = false;
            this.toastr.success('Milestone created successfully', 'Success');
          },
          error: (error) => {
            this.toastr.error('Failed to create milestone', 'Error');
            console.error('Milestone creation error:', error);
          }
        });
    }
  }

  onSubmitSettings(): void {
    if (this.settingsForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      // TODO: Implement settings update logic
      console.log('Settings form submitted:', this.settingsForm.value);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.showSettingsModal = false;
        this.toastr.success('Settings updated successfully', 'Success');
      }, 1000);
    }
  }
  
  // Utility Methods
  getFullName(user: ClientPortalUser): string {
    return `${user.firstName} ${user.lastName}`;
  }
  
  getFormattedDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
  
  getFormattedDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
  
  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'pending': 'badge-warning',
      'accepted': 'badge-success',
      'expired': 'badge-danger',
      'revoked': 'badge-secondary',
      'active': 'badge-success',
      'inactive': 'badge-secondary'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-secondary';
  }
  
  getUserStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge badge-success' : 'badge badge-secondary';
  }
  
  getPermissionNames(permissions: string[]): string {
    return permissions.join(', ');
  }
  
  isInvitationExpired(invitation: PortalInvitation): boolean {
    return new Date(invitation.expiresDate) < new Date();
  }
  
  getFilteredUsers(): ClientPortalUser[] {
    return this.portalUsers.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && user.isActive) ||
        (this.statusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }
  
  getFilteredInvitations(): PortalInvitation[] {
    return this.invitations.filter(invitation => {
      const matchesSearch = !this.searchTerm || 
        invitation.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invitation.clientName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'all' || invitation.status === this.statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }
  
  onRefresh(): void {
    this.loadPortalData();
  }
  
  closeModal(): void {
    this.showInviteModal = false;
    this.showSettingsModal = false;
    this.showDocumentModal = false;
    this.showMilestoneModal = false;
    this.showDeleteConfirm = false;
    this.selectedUser = null;
    this.selectedInvitation = null;
    this.selectedDocument = null;
    this.selectedMilestone = null;
  }
  
  onPermissionChange(permissionId: string, event: any): void {
    const permissions = this.inviteForm.get('permissions')?.value || [];
    if (event.target.checked) {
      if (!permissions.includes(permissionId)) {
        permissions.push(permissionId);
      }
    } else {
      const index = permissions.indexOf(permissionId);
      if (index > -1) {
        permissions.splice(index, 1);
      }
    }
    this.inviteForm.patchValue({ permissions });
  }
  
  isPermissionSelected(permissionId: string): boolean {
    const permissions = this.inviteForm.get('permissions')?.value || [];
    return permissions.includes(permissionId);
  }
  
  // Helper methods for template
  getGrantedPermissionsCount(permissions: PortalPermission[]): number {
    return permissions.filter(p => p.isGranted).length;
  }
  
  hasNoGrantedPermissions(permissions: PortalPermission[]): boolean {
    return permissions.filter(p => p.isGranted).length === 0;
  }
  
  formatFileSize(bytes: number): string {
    return this.clientPortalService.formatFileSize(bytes);
  }
  
  calculateProgress(completed: number, total: number): number {
    return this.clientPortalService.calculateProgressPercentage(completed, total);
  }

  onOpenSettings(): void {
    this.showSettingsModal = true;
  }
}