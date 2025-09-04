import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Enhanced Client Portal Interfaces
export interface ClientPortalUser {
  id: string;
  clientId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  lastLogin?: Date;
  isActive: boolean;
  permissions: PortalPermission[];
  preferences: ClientPreferences;
  onboardingCompleted: boolean;
  twoFactorEnabled: boolean;
}

export interface PortalPermission {
  id: string;
  name: string;
  description: string;
  isGranted: boolean;
  category: 'documents' | 'disputes' | 'reports' | 'communications' | 'billing';
}

export interface ClientPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  dashboard: {
    layout: 'compact' | 'detailed';
    widgets: string[];
  };
  privacy: {
    shareProgress: boolean;
    allowMarketing: boolean;
  };
}

export interface ClientDocument {
  id: string;
  clientId: string;
  name: string;
  type: 'identity' | 'income' | 'credit_report' | 'dispute_letter' | 'other';
  category: string;
  size: number;
  uploadDate: Date;
  uploadedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  url?: string;
  thumbnailUrl?: string;
  metadata: {
    description?: string;
    tags: string[];
    isRequired: boolean;
    expiryDate?: Date;
  };
}

export interface ClientMilestone {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: 'onboarding' | 'dispute' | 'improvement' | 'completion';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  targetDate?: Date;
  completedDate?: Date;
  progress: number; // 0-100
  requirements: MilestoneRequirement[];
  rewards?: {
    points: number;
    badge?: string;
    message: string;
  };
}

export interface MilestoneRequirement {
  id: string;
  description: string;
  isCompleted: boolean;
  completedDate?: Date;
}

export interface ClientProgress {
  clientId: string;
  overallProgress: number;
  creditScoreImprovement: {
    initial: number;
    current: number;
    target: number;
    improvement: number;
  };
  disputesProgress: {
    total: number;
    pending: number;
    resolved: number;
    successRate: number;
  };
  milestonesProgress: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  timelineData: ProgressTimelineItem[];
}

export interface ProgressTimelineItem {
  date: Date;
  type: 'milestone' | 'dispute' | 'score_update' | 'document' | 'communication';
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  metadata?: any;
}

export interface ClientDashboard {
  clientId: string;
  widgets: DashboardWidget[];
  quickActions: QuickAction[];
  notifications: DashboardNotification[];
  upcomingTasks: UpcomingTask[];
}

export interface DashboardWidget {
  id: string;
  type: 'progress' | 'score' | 'disputes' | 'documents' | 'timeline' | 'goals';
  title: string;
  data: any;
  position: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  isEnabled: boolean;
  requiresPermission?: string;
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface UpcomingTask {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedTime: number; // minutes
  isOverdue: boolean;
}

export interface PortalInvitation {
  id: string;
  email: string;
  clientId: string;
  clientName: string;
  invitedBy: string;
  invitedDate: Date;
  expiresDate: Date;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  permissions: string[];
  message?: string;
}

export interface ClientPortalAnalytics {
  totalUsers: number;
  activeUsers: number;
  loginStats: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  documentStats: {
    totalUploads: number;
    pendingReview: number;
    approvedToday: number;
  };
  engagementMetrics: {
    averageSessionTime: number;
    pageViews: number;
    featureUsage: { [key: string]: number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClientPortalService {
  private apiUrl = `${environment.apiUrl}/client-portal`;
  private portalUsersSubject = new BehaviorSubject<ClientPortalUser[]>([]);
  public portalUsers$ = this.portalUsersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Portal User Management
  getPortalUsers(filters?: any): Observable<ClientPortalUser[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<ClientPortalUser[]>(`${this.apiUrl}/users`, { params })
      .pipe(
        tap(users => this.portalUsersSubject.next(users))
      );
  }

  getPortalUser(userId: string): Observable<ClientPortalUser> {
    return this.http.get<ClientPortalUser>(`${this.apiUrl}/users/${userId}`);
  }

  createPortalUser(userData: Partial<ClientPortalUser>): Observable<ClientPortalUser> {
    return this.http.post<ClientPortalUser>(`${this.apiUrl}/users`, userData)
      .pipe(
        tap(newUser => {
          const currentUsers = this.portalUsersSubject.value;
          this.portalUsersSubject.next([...currentUsers, newUser]);
        })
      );
  }

  updatePortalUser(userId: string, userData: Partial<ClientPortalUser>): Observable<ClientPortalUser> {
    return this.http.put<ClientPortalUser>(`${this.apiUrl}/users/${userId}`, userData)
      .pipe(
        tap(updatedUser => {
          const currentUsers = this.portalUsersSubject.value;
          const index = currentUsers.findIndex(u => u.id === userId);
          if (index !== -1) {
            currentUsers[index] = updatedUser;
            this.portalUsersSubject.next([...currentUsers]);
          }
        })
      );
  }

  deletePortalUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`)
      .pipe(
        tap(() => {
          const currentUsers = this.portalUsersSubject.value;
          this.portalUsersSubject.next(currentUsers.filter(u => u.id !== userId));
        })
      );
  }

  toggleUserStatus(userId: string): Observable<ClientPortalUser> {
    return this.http.patch<ClientPortalUser>(`${this.apiUrl}/users/${userId}/toggle-status`, {});
  }

  // Invitation Management
  getInvitations(filters?: any): Observable<PortalInvitation[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<PortalInvitation[]>(`${this.apiUrl}/invitations`, { params });
  }

  sendInvitation(invitationData: Partial<PortalInvitation>): Observable<PortalInvitation> {
    return this.http.post<PortalInvitation>(`${this.apiUrl}/invitations`, invitationData);
  }

  resendInvitation(invitationId: string): Observable<PortalInvitation> {
    return this.http.post<PortalInvitation>(`${this.apiUrl}/invitations/${invitationId}/resend`, {});
  }

  revokeInvitation(invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/invitations/${invitationId}`);
  }

  // Document Management
  getClientDocuments(clientId: string, filters?: any): Observable<ClientDocument[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<ClientDocument[]>(`${this.apiUrl}/clients/${clientId}/documents`, { params });
  }

  uploadDocument(clientId: string, file: File, metadata: any): Observable<ClientDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.http.post<ClientDocument>(`${this.apiUrl}/clients/${clientId}/documents`, formData);
  }

  updateDocumentStatus(clientId: string, documentId: string, status: string, notes?: string): Observable<ClientDocument> {
    return this.http.patch<ClientDocument>(
      `${this.apiUrl}/clients/${clientId}/documents/${documentId}/status`,
      { status, notes }
    );
  }

  deleteDocument(clientId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clients/${clientId}/documents/${documentId}`);
  }

  downloadDocument(clientId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/clients/${clientId}/documents/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  // Milestone Management
  getClientMilestones(clientId: string): Observable<ClientMilestone[]> {
    return this.http.get<ClientMilestone[]>(`${this.apiUrl}/clients/${clientId}/milestones`);
  }

  createMilestone(clientId: string, milestoneData: Partial<ClientMilestone>): Observable<ClientMilestone> {
    return this.http.post<ClientMilestone>(`${this.apiUrl}/clients/${clientId}/milestones`, milestoneData);
  }

  updateMilestone(clientId: string, milestoneId: string, updates: Partial<ClientMilestone>): Observable<ClientMilestone> {
    return this.http.put<ClientMilestone>(`${this.apiUrl}/clients/${clientId}/milestones/${milestoneId}`, updates);
  }

  completeMilestone(clientId: string, milestoneId: string): Observable<ClientMilestone> {
    return this.http.patch<ClientMilestone>(`${this.apiUrl}/clients/${clientId}/milestones/${milestoneId}/complete`, {});
  }

  updateMilestoneRequirement(clientId: string, milestoneId: string, requirementId: string, isCompleted: boolean): Observable<MilestoneRequirement> {
    return this.http.patch<MilestoneRequirement>(
      `${this.apiUrl}/clients/${clientId}/milestones/${milestoneId}/requirements/${requirementId}`,
      { isCompleted }
    );
  }

  // Progress Tracking
  getClientProgress(clientId: string): Observable<ClientProgress> {
    return this.http.get<ClientProgress>(`${this.apiUrl}/clients/${clientId}/progress`);
  }

  updateClientProgress(clientId: string): Observable<ClientProgress> {
    return this.http.post<ClientProgress>(`${this.apiUrl}/clients/${clientId}/progress/update`, {});
  }

  getProgressTimeline(clientId: string, filters?: any): Observable<ProgressTimelineItem[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get<ProgressTimelineItem[]>(`${this.apiUrl}/clients/${clientId}/timeline`, { params });
  }

  // Dashboard Management
  getClientDashboard(clientId: string): Observable<ClientDashboard> {
    return this.http.get<ClientDashboard>(`${this.apiUrl}/clients/${clientId}/dashboard`);
  }

  updateDashboardLayout(clientId: string, widgets: DashboardWidget[]): Observable<ClientDashboard> {
    return this.http.put<ClientDashboard>(`${this.apiUrl}/clients/${clientId}/dashboard/layout`, { widgets });
  }

  markNotificationAsRead(clientId: string, notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/clients/${clientId}/notifications/${notificationId}/read`, {});
  }

  completeTask(clientId: string, taskId: string): Observable<UpcomingTask> {
    return this.http.patch<UpcomingTask>(`${this.apiUrl}/clients/${clientId}/tasks/${taskId}/complete`, {});
  }

  // Preferences Management
  getClientPreferences(clientId: string): Observable<ClientPreferences> {
    return this.http.get<ClientPreferences>(`${this.apiUrl}/clients/${clientId}/preferences`);
  }

  updateClientPreferences(clientId: string, preferences: Partial<ClientPreferences>): Observable<ClientPreferences> {
    return this.http.put<ClientPreferences>(`${this.apiUrl}/clients/${clientId}/preferences`, preferences);
  }

  // Analytics
  getPortalAnalytics(dateRange?: { start: Date; end: Date }): Observable<ClientPortalAnalytics> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('start', dateRange.start.toISOString());
      params = params.set('end', dateRange.end.toISOString());
    }

    return this.http.get<ClientPortalAnalytics>(`${this.apiUrl}/analytics`, { params });
  }

  // Permissions Management
  getAvailablePermissions(): Observable<PortalPermission[]> {
    return this.http.get<PortalPermission[]>(`${this.apiUrl}/permissions`);
  }

  updateUserPermissions(userId: string, permissions: string[]): Observable<ClientPortalUser> {
    return this.http.put<ClientPortalUser>(`${this.apiUrl}/users/${userId}/permissions`, { permissions });
  }

  // Bulk Operations
  bulkUpdateUsers(userIds: string[], updates: Partial<ClientPortalUser>): Observable<ClientPortalUser[]> {
    return this.http.patch<ClientPortalUser[]>(`${this.apiUrl}/users/bulk`, { userIds, updates });
  }

  exportPortalData(format: 'csv' | 'excel' | 'pdf', filters?: any): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Utility Methods
  validateDocumentUpload(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported. Please upload JPG, PNG, PDF, or DOC files.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateInvitationLink(invitationId: string): string {
    return `${environment.clientPortalUrl}/accept-invitation/${invitationId}`;
  }

  calculateProgressPercentage(completed: number, total: number): number {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Load all portal data for a client
  loadClientPortalData(clientId: string): Observable<{
    user: ClientPortalUser;
    documents: ClientDocument[];
    milestones: ClientMilestone[];
    progress: ClientProgress;
    dashboard: ClientDashboard;
    preferences: ClientPreferences;
  }> {
    return forkJoin({
      user: this.getPortalUser(clientId),
      documents: this.getClientDocuments(clientId),
      milestones: this.getClientMilestones(clientId),
      progress: this.getClientProgress(clientId),
      dashboard: this.getClientDashboard(clientId),
      preferences: this.getClientPreferences(clientId)
    });
  }
}