import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Admin Service for Rick Jefferson Solutions
// Handles CRO management, client operations, and compliance tracking

export interface DashboardStats {
  totalClients: number;
  activeDisputes: number;
  monthlyRevenue: number;
  averageScoreIncrease: number;
  completionRate: number;
  clientSatisfaction: number;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enrollmentDate: Date;
  status: 'active' | 'inactive' | 'suspended' | 'completed';
  assignedCRO: string;
  currentScore: {
    experian?: number;
    equifax?: number;
    transunion?: number;
  };
  initialScore: {
    experian?: number;
    equifax?: number;
    transunion?: number;
  };
  totalDisputes: number;
  activeDisputes: number;
  monthlyFee: number;
  totalPaid: number;
  lastActivity: Date;
  notes?: string;
}

export interface CRO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: Date;
  status: 'active' | 'inactive' | 'suspended';
  role: 'junior' | 'senior' | 'manager' | 'director';
  clientCount: number;
  performance: {
    averageScoreIncrease: number;
    completionRate: number;
    clientSatisfaction: number;
    monthlyDisputes: number;
  };
  certifications: string[];
  lastLogin: Date;
}

export interface LetterTemplate {
  id: string;
  name: string;
  category: 'initial_dispute' | 'verification' | 'furnisher' | 'escalation' | 'goodwill' | 'debt_validation' | 'cease_desist';
  description: string;
  content: string;
  fcraSection?: string;
  metro2Compliant: boolean;
  isActive: boolean;
  createdBy: string;
  createdDate: Date;
  lastModified: Date;
  usageCount: number;
  successRate: number;
}

export interface ComplianceData {
  overallScore: number;
  fcraCompliance: number;
  metro2Compliance: number;
  fdcpaCompliance: number;
  stateCompliance: number;
  recentAudits: AuditRecord[];
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface AuditRecord {
  id: string;
  date: Date;
  auditor: string;
  type: 'internal' | 'external' | 'regulatory';
  score: number;
  findings: string[];
  status: 'passed' | 'failed' | 'conditional';
  followUpRequired: boolean;
}

export interface ComplianceViolation {
  id: string;
  date: Date;
  type: 'fcra' | 'fdcpa' | 'metro2' | 'state';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  clientId?: string;
  croId?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolution?: string;
  resolvedDate?: Date;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;
  private dashboardStatsSubject = new BehaviorSubject<DashboardStats | null>(null);
  public dashboardStats$ = this.dashboardStatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Dashboard Statistics
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`)
      .pipe(
        map(stats => {
          this.dashboardStatsSubject.next(stats);
          return stats;
        }),
        catchError(this.handleError)
      );
  }

  getRevenueChart(period: 'week' | 'month' | 'quarter' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/admin/dashboard/revenue-chart`, {
      params: { period }
    }).pipe(catchError(this.handleError));
  }

  getScoreImprovementChart(period: 'week' | 'month' | 'quarter' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/admin/dashboard/score-improvement-chart`, {
      params: { period }
    }).pipe(catchError(this.handleError));
  }

  getDisputeVolumeChart(period: 'week' | 'month' | 'quarter' | 'year'): Observable<ChartData> {
    return this.http.get<ChartData>(`${this.apiUrl}/admin/dashboard/dispute-volume-chart`, {
      params: { period }
    }).pipe(catchError(this.handleError));
  }

  // Client Management
  getClients(filters?: {
    status?: string;
    assignedCRO?: string;
    enrollmentDateFrom?: Date;
    enrollmentDateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ clients: Client[], total: number, page: number, totalPages: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<{ clients: Client[], total: number, page: number, totalPages: number }>(
      `${this.apiUrl}/admin/clients`, { params }
    ).pipe(catchError(this.handleError));
  }

  getClient(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/admin/clients/${clientId}`)
      .pipe(catchError(this.handleError));
  }

  createClient(clientData: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(`${this.apiUrl}/admin/clients`, clientData)
      .pipe(catchError(this.handleError));
  }

  updateClient(clientId: string, clientData: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/admin/clients/${clientId}`, clientData)
      .pipe(catchError(this.handleError));
  }

  deleteClient(clientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/clients/${clientId}`)
      .pipe(catchError(this.handleError));
  }

  assignClientToCRO(clientId: string, croId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/clients/${clientId}/assign`, { croId })
      .pipe(catchError(this.handleError));
  }

  bulkUpdateClients(clientIds: string[], updates: Partial<Client>): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/admin/clients/bulk-update`, {
      clientIds,
      updates
    }).pipe(catchError(this.handleError));
  }

  exportClients(filters?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get(`${this.apiUrl}/admin/clients/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // CRO Management
  getCROs(filters?: {
    status?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ cros: CRO[], total: number, page: number, totalPages: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ cros: CRO[], total: number, page: number, totalPages: number }>(
      `${this.apiUrl}/admin/cros`, { params }
    ).pipe(catchError(this.handleError));
  }

  getCRO(croId: string): Observable<CRO> {
    return this.http.get<CRO>(`${this.apiUrl}/admin/cros/${croId}`)
      .pipe(catchError(this.handleError));
  }

  createCRO(croData: Partial<CRO>): Observable<CRO> {
    return this.http.post<CRO>(`${this.apiUrl}/admin/cros`, croData)
      .pipe(catchError(this.handleError));
  }

  updateCRO(croId: string, croData: Partial<CRO>): Observable<CRO> {
    return this.http.put<CRO>(`${this.apiUrl}/admin/cros/${croId}`, croData)
      .pipe(catchError(this.handleError));
  }

  deleteCRO(croId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/cros/${croId}`)
      .pipe(catchError(this.handleError));
  }

  getCROPerformance(croId: string, period: 'week' | 'month' | 'quarter' | 'year'): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/cros/${croId}/performance`, {
      params: { period }
    }).pipe(catchError(this.handleError));
  }

  // Letter Template Management
  getLetterTemplates(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<{ templates: LetterTemplate[], total: number, page: number, totalPages: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ templates: LetterTemplate[], total: number, page: number, totalPages: number }>(
      `${this.apiUrl}/admin/letter-templates`, { params }
    ).pipe(catchError(this.handleError));
  }

  getLetterTemplate(templateId: string): Observable<LetterTemplate> {
    return this.http.get<LetterTemplate>(`${this.apiUrl}/admin/letter-templates/${templateId}`)
      .pipe(catchError(this.handleError));
  }

  createLetterTemplate(templateData: Partial<LetterTemplate>): Observable<LetterTemplate> {
    return this.http.post<LetterTemplate>(`${this.apiUrl}/admin/letter-templates`, templateData)
      .pipe(catchError(this.handleError));
  }

  updateLetterTemplate(templateId: string, templateData: Partial<LetterTemplate>): Observable<LetterTemplate> {
    return this.http.put<LetterTemplate>(`${this.apiUrl}/admin/letter-templates/${templateId}`, templateData)
      .pipe(catchError(this.handleError));
  }

  deleteLetterTemplate(templateId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/letter-templates/${templateId}`)
      .pipe(catchError(this.handleError));
  }

  cloneLetterTemplate(templateId: string, newName: string): Observable<LetterTemplate> {
    return this.http.post<LetterTemplate>(`${this.apiUrl}/admin/letter-templates/${templateId}/clone`, {
      name: newName
    }).pipe(catchError(this.handleError));
  }

  validateTemplateCompliance(templateContent: string): Observable<{
    isCompliant: boolean;
    violations: string[];
    suggestions: string[];
  }> {
    return this.http.post<{
      isCompliant: boolean;
      violations: string[];
      suggestions: string[];
    }>(`${this.apiUrl}/admin/letter-templates/validate-compliance`, {
      content: templateContent
    }).pipe(catchError(this.handleError));
  }

  // Compliance Management
  getComplianceData(): Observable<ComplianceData> {
    return this.http.get<ComplianceData>(`${this.apiUrl}/admin/compliance/overview`)
      .pipe(catchError(this.handleError));
  }

  getAuditRecords(filters?: {
    type?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Observable<{ audits: AuditRecord[], total: number, page: number, totalPages: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<{ audits: AuditRecord[], total: number, page: number, totalPages: number }>(
      `${this.apiUrl}/admin/compliance/audits`, { params }
    ).pipe(catchError(this.handleError));
  }

  createAuditRecord(auditData: Partial<AuditRecord>): Observable<AuditRecord> {
    return this.http.post<AuditRecord>(`${this.apiUrl}/admin/compliance/audits`, auditData)
      .pipe(catchError(this.handleError));
  }

  getComplianceViolations(filters?: {
    type?: string;
    severity?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Observable<{ violations: ComplianceViolation[], total: number, page: number, totalPages: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<{ violations: ComplianceViolation[], total: number, page: number, totalPages: number }>(
      `${this.apiUrl}/admin/compliance/violations`, { params }
    ).pipe(catchError(this.handleError));
  }

  resolveComplianceViolation(violationId: string, resolution: string): Observable<ComplianceViolation> {
    return this.http.post<ComplianceViolation>(`${this.apiUrl}/admin/compliance/violations/${violationId}/resolve`, {
      resolution
    }).pipe(catchError(this.handleError));
  }

  runComplianceCheck(scope: 'all' | 'clients' | 'templates' | 'processes'): Observable<{
    checkId: string;
    status: 'running' | 'completed' | 'failed';
    results?: any;
  }> {
    return this.http.post<{
      checkId: string;
      status: 'running' | 'completed' | 'failed';
      results?: any;
    }>(`${this.apiUrl}/admin/compliance/check`, { scope })
      .pipe(catchError(this.handleError));
  }

  // Reporting and Analytics
  generateReport(reportType: 'client_summary' | 'cro_performance' | 'compliance_audit' | 'financial_summary', 
                 parameters: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/admin/reports/generate`, {
      type: reportType,
      parameters
    }, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  getSystemHealth(): Observable<{
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    activeUsers: number;
    systemLoad: number;
    databaseStatus: string;
    lastBackup: Date;
    issues: string[];
  }> {
    return this.http.get<{
      status: 'healthy' | 'warning' | 'critical';
      uptime: number;
      activeUsers: number;
      systemLoad: number;
      databaseStatus: string;
      lastBackup: Date;
      issues: string[];
    }>(`${this.apiUrl}/admin/system/health`)
      .pipe(catchError(this.handleError));
  }

  // Utility Methods
  private handleError = (error: any): Observable<never> => {
    console.error('AdminService Error:', error);
    throw error;
  }

  // Rick Jefferson Solutions Branding
  getBrandingConfig(): Observable<{
    colors: { [key: string]: string };
    fonts: { [key: string]: string };
    logos: { [key: string]: string };
    contactInfo: {
      phone: string;
      email: string;
      website: string;
      address: string;
    };
  }> {
    return this.http.get<{
      colors: { [key: string]: string };
      fonts: { [key: string]: string };
      logos: { [key: string]: string };
      contactInfo: {
        phone: string;
        email: string;
        website: string;
        address: string;
      };
    }>(`${this.apiUrl}/admin/branding`)
      .pipe(catchError(this.handleError));
  }

  // 10 Step Total Enforcement Chain™ Configuration
  getEnforcementChainConfig(): Observable<{
    steps: {
      id: number;
      title: string;
      description: string;
      estimatedDuration: number;
      requiredActions: string[];
      successCriteria: string[];
    }[];
  }> {
    return this.http.get<{
      steps: {
        id: number;
        title: string;
        description: string;
        estimatedDuration: number;
        requiredActions: string[];
        successCriteria: string[];
      }[];
    }>(`${this.apiUrl}/admin/enforcement-chain-config`)
      .pipe(catchError(this.handleError));
  }
}

// Rick Jefferson Solutions - Admin Service
// Comprehensive admin panel functionality for credit repair platform
// Includes CRO management, client operations, compliance tracking, and reporting
// Built with Metro 2® compliance and 10 Step Total Enforcement Chain™ integration