import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import {
  ComplianceAudit,
  CompliancePolicy,
  ComplianceViolation,
  ComplianceTraining,
  TrainingRecord,
  ComplianceAlert,
  ComplianceReport,
  ComplianceAnalytics,
  AuditType,
  AuditStatus,
  PolicyType,
  PolicyStatus,
  ViolationType,
  ViolationStatus,
  TrainingType,
  TrainingStatus,
  AlertSeverity,
  AlertStatus,
  ReportType,
  ComplianceArea
} from './compliance.model';

export interface ComplianceFilters {
  search?: string;
  complianceArea?: ComplianceArea;
  status?: string;
  type?: string;
  severity?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedTo?: string;
  tags?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly apiUrl = '/api/compliance';
  private auditsSubject = new BehaviorSubject<ComplianceAudit[]>([]);
  private policiesSubject = new BehaviorSubject<CompliancePolicy[]>([]);
  private violationsSubject = new BehaviorSubject<ComplianceViolation[]>([]);
  private trainingsSubject = new BehaviorSubject<ComplianceTraining[]>([]);
  private alertsSubject = new BehaviorSubject<ComplianceAlert[]>([]);

  public audits$ = this.auditsSubject.asObservable();
  public policies$ = this.policiesSubject.asObservable();
  public violations$ = this.violationsSubject.asObservable();
  public trainings$ = this.trainingsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Audit Methods
  getAudits(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<ComplianceAudit[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ComplianceAudit[]>>(`${this.apiUrl}/audits`, { params })
      .pipe(
        tap(response => this.auditsSubject.next(response.data)),
        catchError(this.handleError)
      );
  }

  getAudit(id: string): Observable<ComplianceAudit> {
    return this.http.get<ComplianceAudit>(`${this.apiUrl}/audits/${id}`)
      .pipe(catchError(this.handleError));
  }

  createAudit(audit: Partial<ComplianceAudit>): Observable<ComplianceAudit> {
    return this.http.post<ComplianceAudit>(`${this.apiUrl}/audits`, audit)
      .pipe(
        tap(() => this.refreshAudits()),
        catchError(this.handleError)
      );
  }

  updateAudit(id: string, audit: Partial<ComplianceAudit>): Observable<ComplianceAudit> {
    return this.http.put<ComplianceAudit>(`${this.apiUrl}/audits/${id}`, audit)
      .pipe(
        tap(() => this.refreshAudits()),
        catchError(this.handleError)
      );
  }

  deleteAudit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/audits/${id}`)
      .pipe(
        tap(() => this.refreshAudits()),
        catchError(this.handleError)
      );
  }

  bulkUpdateAudits(ids: string[], updates: Partial<ComplianceAudit>): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/audits/bulk`, { ids, updates })
      .pipe(
        tap(() => this.refreshAudits()),
        catchError(this.handleError)
      );
  }

  // Policy Methods
  getPolicies(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<CompliancePolicy[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<CompliancePolicy[]>>(`${this.apiUrl}/policies`, { params })
      .pipe(
        tap(response => this.policiesSubject.next(response.data)),
        catchError(this.handleError)
      );
  }

  getPolicy(id: string): Observable<CompliancePolicy> {
    return this.http.get<CompliancePolicy>(`${this.apiUrl}/policies/${id}`)
      .pipe(catchError(this.handleError));
  }

  createPolicy(policy: Partial<CompliancePolicy>): Observable<CompliancePolicy> {
    return this.http.post<CompliancePolicy>(`${this.apiUrl}/policies`, policy)
      .pipe(
        tap(() => this.refreshPolicies()),
        catchError(this.handleError)
      );
  }

  updatePolicy(id: string, policy: Partial<CompliancePolicy>): Observable<CompliancePolicy> {
    return this.http.put<CompliancePolicy>(`${this.apiUrl}/policies/${id}`, policy)
      .pipe(
        tap(() => this.refreshPolicies()),
        catchError(this.handleError)
      );
  }

  deletePolicy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/policies/${id}`)
      .pipe(
        tap(() => this.refreshPolicies()),
        catchError(this.handleError)
      );
  }

  approvePolicy(id: string): Observable<CompliancePolicy> {
    return this.http.post<CompliancePolicy>(`${this.apiUrl}/policies/${id}/approve`, {})
      .pipe(
        tap(() => this.refreshPolicies()),
        catchError(this.handleError)
      );
  }

  // Violation Methods
  getViolations(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<ComplianceViolation[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ComplianceViolation[]>>(`${this.apiUrl}/violations`, { params })
      .pipe(
        tap(response => this.violationsSubject.next(response.data)),
        catchError(this.handleError)
      );
  }

  getViolation(id: string): Observable<ComplianceViolation> {
    return this.http.get<ComplianceViolation>(`${this.apiUrl}/violations/${id}`)
      .pipe(catchError(this.handleError));
  }

  createViolation(violation: Partial<ComplianceViolation>): Observable<ComplianceViolation> {
    return this.http.post<ComplianceViolation>(`${this.apiUrl}/violations`, violation)
      .pipe(
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  updateViolation(id: string, violation: Partial<ComplianceViolation>): Observable<ComplianceViolation> {
    return this.http.put<ComplianceViolation>(`${this.apiUrl}/violations/${id}`, violation)
      .pipe(
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  deleteViolation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/violations/${id}`)
      .pipe(
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  resolveViolation(id: string, resolution: string): Observable<ComplianceViolation> {
    return this.http.post<ComplianceViolation>(`${this.apiUrl}/violations/${id}/resolve`, { resolution })
      .pipe(
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  // Training Methods
  getTrainings(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<ComplianceTraining[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ComplianceTraining[]>>(`${this.apiUrl}/trainings`, { params })
      .pipe(
        tap(response => this.trainingsSubject.next(response.data)),
        catchError(this.handleError)
      );
  }

  getTraining(id: string): Observable<ComplianceTraining> {
    return this.http.get<ComplianceTraining>(`${this.apiUrl}/trainings/${id}`)
      .pipe(catchError(this.handleError));
  }

  createTraining(training: Partial<ComplianceTraining>): Observable<ComplianceTraining> {
    return this.http.post<ComplianceTraining>(`${this.apiUrl}/trainings`, training)
      .pipe(
        tap(() => this.refreshTrainings()),
        catchError(this.handleError)
      );
  }

  updateTraining(id: string, training: Partial<ComplianceTraining>): Observable<ComplianceTraining> {
    return this.http.put<ComplianceTraining>(`${this.apiUrl}/trainings/${id}`, training)
      .pipe(
        tap(() => this.refreshTrainings()),
        catchError(this.handleError)
      );
  }

  deleteTraining(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/trainings/${id}`)
      .pipe(
        tap(() => this.refreshTrainings()),
        catchError(this.handleError)
      );
  }

  enrollInTraining(trainingId: string, userId: string): Observable<TrainingRecord> {
    return this.http.post<TrainingRecord>(`${this.apiUrl}/trainings/${trainingId}/enroll`, { userId })
      .pipe(catchError(this.handleError));
  }

  getTrainingRecords(userId?: string, trainingId?: string): Observable<TrainingRecord[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    if (trainingId) params = params.set('trainingId', trainingId);

    return this.http.get<TrainingRecord[]>(`${this.apiUrl}/training-records`, { params })
      .pipe(catchError(this.handleError));
  }

  updateTrainingProgress(recordId: string, progress: Partial<TrainingRecord>): Observable<TrainingRecord> {
    return this.http.put<TrainingRecord>(`${this.apiUrl}/training-records/${recordId}`, progress)
      .pipe(catchError(this.handleError));
  }

  // Alert Methods
  getAlerts(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<ComplianceAlert[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ComplianceAlert[]>>(`${this.apiUrl}/alerts`, { params })
      .pipe(
        tap(response => this.alertsSubject.next(response.data)),
        catchError(this.handleError)
      );
  }

  getAlert(id: string): Observable<ComplianceAlert> {
    return this.http.get<ComplianceAlert>(`${this.apiUrl}/alerts/${id}`)
      .pipe(catchError(this.handleError));
  }

  acknowledgeAlert(id: string): Observable<ComplianceAlert> {
    return this.http.post<ComplianceAlert>(`${this.apiUrl}/alerts/${id}/acknowledge`, {})
      .pipe(
        tap(() => this.refreshAlerts()),
        catchError(this.handleError)
      );
  }

  resolveAlert(id: string, resolution: string): Observable<ComplianceAlert> {
    return this.http.post<ComplianceAlert>(`${this.apiUrl}/alerts/${id}/resolve`, { resolution })
      .pipe(
        tap(() => this.refreshAlerts()),
        catchError(this.handleError)
      );
  }

  dismissAlert(id: string): Observable<ComplianceAlert> {
    return this.http.post<ComplianceAlert>(`${this.apiUrl}/alerts/${id}/dismiss`, {})
      .pipe(
        tap(() => this.refreshAlerts()),
        catchError(this.handleError)
      );
  }

  // Report Methods
  getReports(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<ComplianceReport[]>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ComplianceReport[]>>(`${this.apiUrl}/reports`, { params })
      .pipe(catchError(this.handleError));
  }

  getReport(id: string): Observable<ComplianceReport> {
    return this.http.get<ComplianceReport>(`${this.apiUrl}/reports/${id}`)
      .pipe(catchError(this.handleError));
  }

  generateReport(config: any): Observable<ComplianceReport> {
    return this.http.post<ComplianceReport>(`${this.apiUrl}/reports/generate`, config)
      .pipe(catchError(this.handleError));
  }

  exportReport(id: string, format: 'pdf' | 'excel' | 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reports/${id}/export`, {
      params: { format },
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Analytics Methods
  getAnalytics(dateRange?: { startDate: Date; endDate: Date }): Observable<ComplianceAnalytics> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('startDate', dateRange.startDate.toISOString());
      params = params.set('endDate', dateRange.endDate.toISOString());
    }

    return this.http.get<ComplianceAnalytics>(`${this.apiUrl}/analytics`, { params })
      .pipe(catchError(this.handleError));
  }

  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`)
      .pipe(catchError(this.handleError));
  }

  // File Upload Methods
  uploadFile(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post(`${this.apiUrl}/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  // Export Methods
  exportData(type: string, filters?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/${type}`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Utility Methods
  private refreshAudits(): void {
    this.getAudits().subscribe();
  }

  private refreshPolicies(): void {
    this.getPolicies().subscribe();
  }

  private refreshViolations(): void {
    this.getViolations().subscribe();
  }

  private refreshTrainings(): void {
    this.getTrainings().subscribe();
  }

  private refreshAlerts(): void {
    this.getAlerts().subscribe();
  }

  private handleError(error: any): Observable<never> {
    console.error('Compliance service error:', error);
    return throwError(() => error);
  }

  // Search Methods
  searchAudits(query: string): Observable<ComplianceAudit[]> {
    return this.http.get<ComplianceAudit[]>(`${this.apiUrl}/audits/search`, {
      params: { q: query }
    }).pipe(catchError(this.handleError));
  }

  searchPolicies(query: string): Observable<CompliancePolicy[]> {
    return this.http.get<CompliancePolicy[]>(`${this.apiUrl}/policies/search`, {
      params: { q: query }
    }).pipe(catchError(this.handleError));
  }

  searchViolations(query: string): Observable<ComplianceViolation[]> {
    return this.http.get<ComplianceViolation[]>(`${this.apiUrl}/violations/search`, {
      params: { q: query }
    }).pipe(catchError(this.handleError));
  }

  searchTrainings(query: string): Observable<ComplianceTraining[]> {
    return this.http.get<ComplianceTraining[]>(`${this.apiUrl}/trainings/search`, {
      params: { q: query }
    }).pipe(catchError(this.handleError));
  }

  // Bulk Operations
  bulkDeleteAudits(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/audits/bulk`, {
      body: { ids }
    }).pipe(
      tap(() => this.refreshAudits()),
      catchError(this.handleError)
    );
  }

  bulkDeletePolicies(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/policies/bulk`, {
      body: { ids }
    }).pipe(
      tap(() => this.refreshPolicies()),
      catchError(this.handleError)
    );
  }

  bulkDeleteViolations(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/violations/bulk`, {
      body: { ids }
    }).pipe(
      tap(() => this.refreshViolations()),
      catchError(this.handleError)
    );
  }

  bulkDeleteTrainings(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/trainings/bulk`, {
      body: { ids }
    }).pipe(
      tap(() => this.refreshTrainings()),
      catchError(this.handleError)
    );
  }
}