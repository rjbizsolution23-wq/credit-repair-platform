import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  Violation,
  EnforcementAction,
  ComplianceItem,
  Regulation,
  EnforcementAlert,
  EnforcementAnalytics,
  ViolationType,
  ViolationSeverity,
  ViolationStatus,
  ActionType,
  ActionStatus,
  ComplianceStatus,
  RegulationType,
  AlertType,
  AlertPriority
} from './enforcement.model';

export interface ViolationFilters {
  search?: string;
  type?: ViolationType;
  severity?: ViolationSeverity;
  status?: ViolationStatus;
  reportedBy?: string;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedTo?: string;
  tags?: string[];
}

export interface ActionFilters {
  search?: string;
  type?: ActionType;
  status?: ActionStatus;
  assignedTo?: string;
  priority?: AlertPriority;
  dueFrom?: Date;
  dueTo?: Date;
  violationId?: string;
  overdue?: boolean;
}

export interface ComplianceFilters {
  search?: string;
  status?: ComplianceStatus;
  regulationId?: string;
  assignedTo?: string;
  riskLevel?: number;
  auditDueFrom?: Date;
  auditDueTo?: Date;
  tags?: string[];
}

export interface RegulationFilters {
  search?: string;
  type?: RegulationType;
  jurisdiction?: string;
  status?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface AlertFilters {
  search?: string;
  type?: AlertType;
  priority?: AlertPriority;
  assignedTo?: string;
  acknowledged?: boolean;
  resolved?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EnforcementService {
  private readonly baseUrl = '/api/enforcement';
  private violationsSubject = new BehaviorSubject<Violation[]>([]);
  private actionsSubject = new BehaviorSubject<EnforcementAction[]>([]);
  private alertsSubject = new BehaviorSubject<EnforcementAlert[]>([]);

  public violations$ = this.violationsSubject.asObservable();
  public actions$ = this.actionsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Violation Methods
  getViolations(filters?: ViolationFilters, page = 1, limit = 10): Observable<PaginatedResponse<Violation>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      params = this.buildViolationParams(params, filters);
    }

    return this.http.get<ApiResponse<PaginatedResponse<Violation>>>(`${this.baseUrl}/violations`, { params })
      .pipe(
        map(response => response.data),
        tap(data => this.violationsSubject.next(data.data)),
        catchError(this.handleError)
      );
  }

  getViolation(id: string): Observable<Violation> {
    return this.http.get<ApiResponse<Violation>>(`${this.baseUrl}/violations/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createViolation(violation: Partial<Violation>): Observable<Violation> {
    return this.http.post<ApiResponse<Violation>>(`${this.baseUrl}/violations`, violation)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  updateViolation(id: string, violation: Partial<Violation>): Observable<Violation> {
    return this.http.put<ApiResponse<Violation>>(`${this.baseUrl}/violations/${id}`, violation)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  deleteViolation(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/violations/${id}`)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  bulkUpdateViolations(ids: string[], updates: Partial<Violation>): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/violations/bulk`, { ids, updates })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  bulkDeleteViolations(ids: string[]): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/violations/bulk`, { body: { ids } })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshViolations()),
        catchError(this.handleError)
      );
  }

  // Enforcement Action Methods
  getActions(filters?: ActionFilters, page = 1, limit = 10): Observable<PaginatedResponse<EnforcementAction>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      params = this.buildActionParams(params, filters);
    }

    return this.http.get<ApiResponse<PaginatedResponse<EnforcementAction>>>(`${this.baseUrl}/actions`, { params })
      .pipe(
        map(response => response.data),
        tap(data => this.actionsSubject.next(data.data)),
        catchError(this.handleError)
      );
  }

  getAction(id: string): Observable<EnforcementAction> {
    return this.http.get<ApiResponse<EnforcementAction>>(`${this.baseUrl}/actions/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createAction(action: Partial<EnforcementAction>): Observable<EnforcementAction> {
    return this.http.post<ApiResponse<EnforcementAction>>(`${this.baseUrl}/actions`, action)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError(this.handleError)
      );
  }

  updateAction(id: string, action: Partial<EnforcementAction>): Observable<EnforcementAction> {
    return this.http.put<ApiResponse<EnforcementAction>>(`${this.baseUrl}/actions/${id}`, action)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError(this.handleError)
      );
  }

  deleteAction(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/actions/${id}`)
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError(this.handleError)
      );
  }

  updateActionProgress(id: string, progress: number, notes?: string): Observable<EnforcementAction> {
    return this.http.patch<ApiResponse<EnforcementAction>>(`${this.baseUrl}/actions/${id}/progress`, { progress, notes })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError(this.handleError)
      );
  }

  completeAction(id: string, notes?: string): Observable<EnforcementAction> {
    return this.http.patch<ApiResponse<EnforcementAction>>(`${this.baseUrl}/actions/${id}/complete`, { notes })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError(this.handleError)
      );
  }

  bulkUpdateEnforcementActions(ids: string[], updates: Partial<EnforcementAction>): Observable<void> {
    return this.http.patch<ApiResponse<void>>(`${this.baseUrl}/actions/bulk`, { ids, updates })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError((error: any) => this.handleError(error))
      );
  }

  bulkDeleteEnforcementActions(ids: string[]): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/actions/bulk`, { body: { ids } })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshActions()),
        catchError(this.handleError)
      );
  }

  // Compliance Item Methods
  getComplianceItems(filters?: ComplianceFilters, page = 1, limit = 10): Observable<PaginatedResponse<ComplianceItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      params = this.buildComplianceParams(params, filters);
    }

    return this.http.get<ApiResponse<PaginatedResponse<ComplianceItem>>>(`${this.baseUrl}/compliance`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getComplianceItem(id: string): Observable<ComplianceItem> {
    return this.http.get<ApiResponse<ComplianceItem>>(`${this.baseUrl}/compliance/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateComplianceStatus(id: string, status: ComplianceStatus, notes?: string): Observable<ComplianceItem> {
    return this.http.patch<ApiResponse<ComplianceItem>>(`${this.baseUrl}/compliance/${id}/status`, { status, notes })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  scheduleAudit(id: string, auditDate: Date, auditor: string): Observable<ComplianceItem> {
    return this.http.patch<ApiResponse<ComplianceItem>>(`${this.baseUrl}/compliance/${id}/audit`, { auditDate, auditor })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Regulation Methods
  getRegulations(filters?: RegulationFilters, page = 1, limit = 10): Observable<PaginatedResponse<Regulation>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      params = this.buildRegulationParams(params, filters);
    }

    return this.http.get<ApiResponse<PaginatedResponse<Regulation>>>(`${this.baseUrl}/regulations`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getRegulation(id: string): Observable<Regulation> {
    return this.http.get<ApiResponse<Regulation>>(`${this.baseUrl}/regulations/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Alert Methods
  getAlerts(filters?: AlertFilters, page = 1, limit = 10): Observable<PaginatedResponse<EnforcementAlert>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      params = this.buildAlertParams(params, filters);
    }

    return this.http.get<ApiResponse<PaginatedResponse<EnforcementAlert>>>(`${this.baseUrl}/alerts`, { params })
      .pipe(
        map(response => response.data),
        tap(data => this.alertsSubject.next(data.data)),
        catchError(this.handleError)
      );
  }

  acknowledgeAlert(id: string): Observable<EnforcementAlert> {
    return this.http.patch<ApiResponse<EnforcementAlert>>(`${this.baseUrl}/alerts/${id}/acknowledge`, {})
      .pipe(
        map(response => response.data),
        tap(() => this.refreshAlerts()),
        catchError(this.handleError)
      );
  }

  resolveAlert(id: string, notes?: string): Observable<EnforcementAlert> {
    return this.http.patch<ApiResponse<EnforcementAlert>>(`${this.baseUrl}/alerts/${id}/resolve`, { notes })
      .pipe(
        map(response => response.data),
        tap(() => this.refreshAlerts()),
        catchError(this.handleError)
      );
  }

  // Analytics Methods
  getAnalytics(startDate: Date, endDate: Date): Observable<EnforcementAnalytics> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<EnforcementAnalytics>>(`${this.baseUrl}/analytics`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Export Methods
  exportViolations(filters?: ViolationFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filters) {
      params = this.buildViolationParams(params, filters);
    }

    return this.http.get(`${this.baseUrl}/violations/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  exportActions(filters?: ActionFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filters) {
      params = this.buildActionParams(params, filters);
    }

    return this.http.get(`${this.baseUrl}/actions/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  exportCompliance(filters?: ComplianceFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filters) {
      params = this.buildComplianceParams(params, filters);
    }

    return this.http.get(`${this.baseUrl}/compliance/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Search Methods
  searchViolations(query: string): Observable<Violation[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<Violation[]>>(`${this.baseUrl}/violations/search`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  searchActions(query: string): Observable<EnforcementAction[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<EnforcementAction[]>>(`${this.baseUrl}/actions/search`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Utility Methods
  private refreshViolations(): void {
    this.getViolations().subscribe();
  }

  private refreshActions(): void {
    this.getActions().subscribe();
  }

  private refreshAlerts(): void {
    this.getAlerts().subscribe();
  }

  private buildViolationParams(params: HttpParams, filters: ViolationFilters): HttpParams {
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.severity) params = params.set('severity', filters.severity);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.reportedBy) params = params.set('reportedBy', filters.reportedBy);
    if (filters.clientId) params = params.set('clientId', filters.clientId);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
    return params;
  }

  private buildActionParams(params: HttpParams, filters: ActionFilters): HttpParams {
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.violationId) params = params.set('violationId', filters.violationId);
    if (filters.dueFrom) params = params.set('dueFrom', filters.dueFrom.toISOString());
    if (filters.dueTo) params = params.set('dueTo', filters.dueTo.toISOString());
    if (filters.overdue !== undefined) params = params.set('overdue', filters.overdue.toString());
    return params;
  }

  private buildComplianceParams(params: HttpParams, filters: ComplianceFilters): HttpParams {
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.regulationId) params = params.set('regulationId', filters.regulationId);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.riskLevel) params = params.set('riskLevel', filters.riskLevel.toString());
    if (filters.auditDueFrom) params = params.set('auditDueFrom', filters.auditDueFrom.toISOString());
    if (filters.auditDueTo) params = params.set('auditDueTo', filters.auditDueTo.toISOString());
    if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
    return params;
  }

  private buildRegulationParams(params: HttpParams, filters: RegulationFilters): HttpParams {
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.jurisdiction) params = params.set('jurisdiction', filters.jurisdiction);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.effectiveFrom) params = params.set('effectiveFrom', filters.effectiveFrom.toISOString());
    if (filters.effectiveTo) params = params.set('effectiveTo', filters.effectiveTo.toISOString());
    return params;
  }

  private buildAlertParams(params: HttpParams, filters: AlertFilters): HttpParams {
    if (filters.search) params = params.set('search', filters.search);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.acknowledged !== undefined) params = params.set('acknowledged', filters.acknowledged.toString());
    if (filters.resolved !== undefined) params = params.set('resolved', filters.resolved.toString());
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo.toISOString());
    return params;
  }

  private handleError(error: any): Observable<never> {
    console.error('Enforcement service error:', error);
    return throwError(() => error);
  }
}