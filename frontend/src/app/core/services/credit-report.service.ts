import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  CreditReport,
  CreditScoreHistory,
  CreditMonitoring,
  ReportComparison,
  CreditBureau,
  ReportType,
  ReportStatus,
  AlertType,
  MonitoringFrequency
} from '../models/credit-report.model';
import { environment } from '../../../environments/environment';

export interface CreditReportFilter {
  clientId?: string;
  bureau?: CreditBureau;
  reportType?: ReportType;
  status?: ReportStatus;
  dateFrom?: Date;
  dateTo?: Date;
  scoreMin?: number;
  scoreMax?: number;
  hasNegativeItems?: boolean;
  search?: string;
}

export interface CreditReportStats {
  totalReports: number;
  averageScore: number;
  scoreImprovement: number;
  negativeItemsRemoved: number;
  reportsThisMonth: number;
  scoreDistribution: { range: string; count: number }[];
  bureauBreakdown: { bureau: CreditBureau; count: number }[];
}

export interface UploadReportRequest {
  clientId: string;
  bureau: CreditBureau;
  reportType: ReportType;
  file: File;
  notes?: string;
}

export interface BulkReportOperation {
  operation: 'delete' | 'archive' | 'reprocess';
  reportIds: string[];
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreditReportService {
  private apiUrl = `${environment.apiUrl}/credit-reports`;
  private reportsSubject = new BehaviorSubject<CreditReport[]>([]);
  private statsSubject = new BehaviorSubject<CreditReportStats | null>(null);

  public reports$ = this.reportsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Credit Reports CRUD
  getReports(filter?: CreditReportFilter): Observable<CreditReport[]> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<CreditReport[]>(this.apiUrl, { params }).pipe(
      tap(reports => this.reportsSubject.next(reports))
    );
  }

  getReport(id: string): Observable<CreditReport> {
    return this.http.get<CreditReport>(`${this.apiUrl}/${id}`);
  }

  getClientReports(clientId: string): Observable<CreditReport[]> {
    return this.http.get<CreditReport[]>(`${this.apiUrl}/client/${clientId}`);
  }

  uploadReport(request: UploadReportRequest): Observable<CreditReport> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('clientId', request.clientId);
    formData.append('bureau', request.bureau);
    formData.append('reportType', request.reportType);
    if (request.notes) {
      formData.append('notes', request.notes);
    }

    return this.http.post<CreditReport>(`${this.apiUrl}/upload`, formData);
  }

  updateReport(id: string, updates: Partial<CreditReport>): Observable<CreditReport> {
    return this.http.put<CreditReport>(`${this.apiUrl}/${id}`, updates);
  }

  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  archiveReport(id: string): Observable<CreditReport> {
    return this.http.patch<CreditReport>(`${this.apiUrl}/${id}/archive`, {});
  }

  reprocessReport(id: string): Observable<CreditReport> {
    return this.http.post<CreditReport>(`${this.apiUrl}/${id}/reprocess`, {});
  }

  // Bulk Operations
  bulkOperation(operation: BulkReportOperation): Observable<{ success: number; failed: number; errors: string[] }> {
    return this.http.post<{ success: number; failed: number; errors: string[] }>(
      `${this.apiUrl}/bulk`,
      operation
    );
  }

  // Credit Scores
  getScoreHistory(clientId: string, bureau?: CreditBureau): Observable<CreditScoreHistory[]> {
    let params = new HttpParams();
    if (bureau) {
      params = params.set('bureau', bureau);
    }
    return this.http.get<CreditScoreHistory[]>(`${this.apiUrl}/scores/${clientId}`, { params });
  }

  addScoreEntry(entry: Omit<CreditScoreHistory, 'id'>): Observable<CreditScoreHistory> {
    return this.http.post<CreditScoreHistory>(`${this.apiUrl}/scores`, entry);
  }

  // Credit Monitoring
  getMonitoringSettings(clientId: string): Observable<CreditMonitoring> {
    return this.http.get<CreditMonitoring>(`${this.apiUrl}/monitoring/${clientId}`);
  }

  updateMonitoringSettings(clientId: string, settings: Partial<CreditMonitoring>): Observable<CreditMonitoring> {
    return this.http.put<CreditMonitoring>(`${this.apiUrl}/monitoring/${clientId}`, settings);
  }

  triggerMonitoringCheck(clientId: string): Observable<{ message: string; newAlerts: number }> {
    return this.http.post<{ message: string; newAlerts: number }>(
      `${this.apiUrl}/monitoring/${clientId}/check`,
      {}
    );
  }

  // Report Comparison
  compareReports(clientId: string, reportIds: string[]): Observable<ReportComparison> {
    return this.http.post<ReportComparison>(`${this.apiUrl}/compare`, {
      clientId,
      reportIds
    });
  }

  getLatestComparison(clientId: string): Observable<ReportComparison> {
    return this.http.get<ReportComparison>(`${this.apiUrl}/compare/${clientId}/latest`);
  }

  // Analytics and Statistics
  getReportStats(filter?: CreditReportFilter): Observable<CreditReportStats> {
    let params = new HttpParams();
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<CreditReportStats>(`${this.apiUrl}/stats`, { params }).pipe(
      tap(stats => this.statsSubject.next(stats))
    );
  }

  getScoreTrends(clientId?: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Observable<any> {
    let params = new HttpParams().set('period', period);
    if (clientId) {
      params = params.set('clientId', clientId);
    }
    return this.http.get(`${this.apiUrl}/trends`, { params });
  }

  // Credit Alerts
  getAlerts(clientId?: string, type?: AlertType): Observable<any[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (type) params = params.set('type', type);
    return this.http.get<any[]>(`${this.apiUrl}/alerts`, { params });
  }

  markAlertAsRead(alertId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/alerts/${alertId}/read`, {});
  }

  dismissAlert(alertId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/alerts/${alertId}`);
  }

  deleteAlert(alertId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/alerts/${alertId}`);
  }

  testNotifications(): Observable<{ message: string; success: boolean }> {
    return this.http.post<{ message: string; success: boolean }>(`${this.apiUrl}/notifications/test`, {});
  }

  // Report Analysis
  analyzeReport(reportId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${reportId}/analyze`, {});
  }

  getAnalysisResults(reportId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${reportId}/analysis`);
  }

  // Export and Import
  exportReports(filter?: CreditReportFilter, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (filter) {
      Object.keys(filter).forEach(key => {
        const value = (filter as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Search and Filtering
  searchReports(query: string): Observable<CreditReport[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<CreditReport[]>(`${this.apiUrl}/search`, { params });
  }

  getFilterOptions(): Observable<{
    bureaus: CreditBureau[];
    reportTypes: ReportType[];
    statuses: ReportStatus[];
    scoreRanges: { min: number; max: number; label: string }[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/filter-options`);
  }

  // Validation and Processing
  validateReportFile(file: File): Observable<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ valid: boolean; errors: string[]; warnings: string[] }>(
      `${this.apiUrl}/validate`,
      formData
    );
  }

  getProcessingStatus(reportId: string): Observable<{ status: string; progress: number; message: string }> {
    return this.http.get<{ status: string; progress: number; message: string }>(
      `${this.apiUrl}/${reportId}/processing-status`
    );
  }

  // Utility Methods
  refreshReports(): void {
    this.getReports().subscribe();
  }

  refreshStats(): void {
    this.getReportStats().subscribe();
  }

  clearCache(): void {
    this.reportsSubject.next([]);
    this.statsSubject.next(null);
  }
}