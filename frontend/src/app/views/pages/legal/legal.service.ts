import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  LegalDocument,
  LegalCase,
  ComplianceItem,
  LegalAnalytics,
  DocumentType,
  DocumentStatus,
  CaseType,
  CaseStatus,
  CasePriority,
  ComplianceArea,
  ComplianceStatus,
  RiskLevel
} from './legal.model';

export interface DocumentFilters {
  search?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  category?: string;
  tags?: string[];
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CaseFilters {
  search?: string;
  type?: CaseType;
  status?: CaseStatus;
  priority?: CasePriority;
  assignedAttorney?: string;
  clientId?: string;
  jurisdiction?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ComplianceFilters {
  search?: string;
  area?: ComplianceArea;
  status?: ComplianceStatus;
  riskLevel?: RiskLevel;
  reviewedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
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
export class LegalService {
  private readonly baseUrl = '/api/legal';
  private documentsSubject = new BehaviorSubject<LegalDocument[]>([]);
  private casesSubject = new BehaviorSubject<LegalCase[]>([]);
  private complianceSubject = new BehaviorSubject<ComplianceItem[]>([]);

  public documents$ = this.documentsSubject.asObservable();
  public cases$ = this.casesSubject.asObservable();
  public compliance$ = this.complianceSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Document Management
  getDocuments(filters?: DocumentFilters, pagination?: PaginationParams): Observable<ApiResponse<LegalDocument[]>> {
    let params = new HttpParams();
    
    if (pagination) {
      params = params.set('page', pagination.page.toString())
                    .set('limit', pagination.limit.toString());
      if (pagination.sortBy) {
        params = params.set('sortBy', pagination.sortBy)
                      .set('sortOrder', pagination.sortOrder || 'asc');
      }
    }

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.createdBy) params = params.set('createdBy', filters.createdBy);
      if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get<ApiResponse<LegalDocument[]>>(`${this.baseUrl}/documents`, { params })
      .pipe(
        map(response => {
          this.documentsSubject.next(response.data);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getDocument(id: string): Observable<LegalDocument> {
    return this.http.get<LegalDocument>(`${this.baseUrl}/documents/${id}`)
      .pipe(catchError(this.handleError));
  }

  createDocument(document: Partial<LegalDocument>): Observable<LegalDocument> {
    return this.http.post<LegalDocument>(`${this.baseUrl}/documents`, document)
      .pipe(catchError(this.handleError));
  }

  updateDocument(id: string, document: Partial<LegalDocument>): Observable<LegalDocument> {
    return this.http.put<LegalDocument>(`${this.baseUrl}/documents/${id}`, document)
      .pipe(catchError(this.handleError));
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${id}`)
      .pipe(catchError(this.handleError));
  }

  bulkDeleteDocuments(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/documents/bulk-delete`, { ids })
      .pipe(catchError(this.handleError));
  }

  approveDocument(id: string): Observable<LegalDocument> {
    return this.http.post<LegalDocument>(`${this.baseUrl}/documents/${id}/approve`, {})
      .pipe(catchError(this.handleError));
  }

  rejectDocument(id: string, reason: string): Observable<LegalDocument> {
    return this.http.post<LegalDocument>(`${this.baseUrl}/documents/${id}/reject`, { reason })
      .pipe(catchError(this.handleError));
  }

  archiveDocument(id: string): Observable<LegalDocument> {
    return this.http.post<LegalDocument>(`${this.baseUrl}/documents/${id}/archive`, {})
      .pipe(catchError(this.handleError));
  }

  // Case Management
  getCases(filters?: CaseFilters, pagination?: PaginationParams): Observable<ApiResponse<LegalCase[]>> {
    let params = new HttpParams();
    
    if (pagination) {
      params = params.set('page', pagination.page.toString())
                    .set('limit', pagination.limit.toString());
      if (pagination.sortBy) {
        params = params.set('sortBy', pagination.sortBy)
                      .set('sortOrder', pagination.sortOrder || 'asc');
      }
    }

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.assignedAttorney) params = params.set('assignedAttorney', filters.assignedAttorney);
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.jurisdiction) params = params.set('jurisdiction', filters.jurisdiction);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get<ApiResponse<LegalCase[]>>(`${this.baseUrl}/cases`, { params })
      .pipe(
        map(response => {
          this.casesSubject.next(response.data);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getCase(id: string): Observable<LegalCase> {
    return this.http.get<LegalCase>(`${this.baseUrl}/cases/${id}`)
      .pipe(catchError(this.handleError));
  }

  createCase(caseData: Partial<LegalCase>): Observable<LegalCase> {
    return this.http.post<LegalCase>(`${this.baseUrl}/cases`, caseData)
      .pipe(catchError(this.handleError));
  }

  updateCase(id: string, caseData: Partial<LegalCase>): Observable<LegalCase> {
    return this.http.put<LegalCase>(`${this.baseUrl}/cases/${id}`, caseData)
      .pipe(catchError(this.handleError));
  }

  deleteCase(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cases/${id}`)
      .pipe(catchError(this.handleError));
  }

  bulkDeleteCases(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/cases/bulk-delete`, { ids })
      .pipe(catchError(this.handleError));
  }

  updateCaseStatus(id: string, status: CaseStatus): Observable<LegalCase> {
    return this.http.patch<LegalCase>(`${this.baseUrl}/cases/${id}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  updateCasePriority(id: string, priority: CasePriority): Observable<LegalCase> {
    return this.http.patch<LegalCase>(`${this.baseUrl}/cases/${id}/priority`, { priority })
      .pipe(catchError(this.handleError));
  }

  assignCase(id: string, attorneyId: string): Observable<LegalCase> {
    return this.http.patch<LegalCase>(`${this.baseUrl}/cases/${id}/assign`, { attorneyId })
      .pipe(catchError(this.handleError));
  }

  closeCase(id: string, outcome: string): Observable<LegalCase> {
    return this.http.post<LegalCase>(`${this.baseUrl}/cases/${id}/close`, { outcome })
      .pipe(catchError(this.handleError));
  }

  // Compliance Management
  getComplianceItems(filters?: ComplianceFilters, pagination?: PaginationParams): Observable<ApiResponse<ComplianceItem[]>> {
    let params = new HttpParams();
    
    if (pagination) {
      params = params.set('page', pagination.page.toString())
                    .set('limit', pagination.limit.toString());
      if (pagination.sortBy) {
        params = params.set('sortBy', pagination.sortBy)
                      .set('sortOrder', pagination.sortOrder || 'asc');
      }
    }

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.area) params = params.set('area', filters.area);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.riskLevel) params = params.set('riskLevel', filters.riskLevel);
      if (filters.reviewedBy) params = params.set('reviewedBy', filters.reviewedBy);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get<ApiResponse<ComplianceItem[]>>(`${this.baseUrl}/compliance`, { params })
      .pipe(
        map(response => {
          this.complianceSubject.next(response.data);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  getComplianceItem(id: string): Observable<ComplianceItem> {
    return this.http.get<ComplianceItem>(`${this.baseUrl}/compliance/${id}`)
      .pipe(catchError(this.handleError));
  }

  createComplianceItem(item: Partial<ComplianceItem>): Observable<ComplianceItem> {
    return this.http.post<ComplianceItem>(`${this.baseUrl}/compliance`, item)
      .pipe(catchError(this.handleError));
  }

  updateComplianceItem(id: string, item: Partial<ComplianceItem>): Observable<ComplianceItem> {
    return this.http.put<ComplianceItem>(`${this.baseUrl}/compliance/${id}`, item)
      .pipe(catchError(this.handleError));
  }

  deleteComplianceItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/compliance/${id}`)
      .pipe(catchError(this.handleError));
  }

  bulkDeleteComplianceItems(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/compliance/bulk-delete`, { ids })
      .pipe(catchError(this.handleError));
  }

  updateComplianceStatus(id: string, status: ComplianceStatus): Observable<ComplianceItem> {
    return this.http.patch<ComplianceItem>(`${this.baseUrl}/compliance/${id}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  reviewComplianceItem(id: string, reviewNotes: string): Observable<ComplianceItem> {
    return this.http.post<ComplianceItem>(`${this.baseUrl}/compliance/${id}/review`, { reviewNotes })
      .pipe(catchError(this.handleError));
  }

  // Analytics
  getAnalytics(dateRange?: { start: Date; end: Date }): Observable<LegalAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      params = params.set('startDate', dateRange.start.toISOString())
                    .set('endDate', dateRange.end.toISOString());
    }

    return this.http.get<LegalAnalytics>(`${this.baseUrl}/analytics`, { params })
      .pipe(catchError(this.handleError));
  }

  // Export Functions
  exportDocuments(filters?: DocumentFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.createdBy) params = params.set('createdBy', filters.createdBy);
      if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get(`${this.baseUrl}/documents/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  exportCases(filters?: CaseFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.assignedAttorney) params = params.set('assignedAttorney', filters.assignedAttorney);
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.jurisdiction) params = params.set('jurisdiction', filters.jurisdiction);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get(`${this.baseUrl}/cases/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  exportCompliance(filters?: ComplianceFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.area) params = params.set('area', filters.area);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.riskLevel) params = params.set('riskLevel', filters.riskLevel);
      if (filters.reviewedBy) params = params.set('reviewedBy', filters.reviewedBy);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get(`${this.baseUrl}/compliance/export`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // File Upload
  uploadDocument(file: File, metadata: any): Observable<LegalDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.http.post<LegalDocument>(`${this.baseUrl}/documents/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  uploadCaseDocument(caseId: string, file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.http.post(`${this.baseUrl}/cases/${caseId}/documents`, formData)
      .pipe(catchError(this.handleError));
  }

  uploadComplianceEvidence(complianceId: string, file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    return this.http.post(`${this.baseUrl}/compliance/${complianceId}/evidence`, formData)
      .pipe(catchError(this.handleError));
  }

  // Utility Methods
  private handleError = (error: any): Observable<never> => {
    console.error('Legal Service Error:', error);
    throw error;
  };

  // Helper methods for form validation
  validateDocumentForm(document: Partial<LegalDocument>): string[] {
    const errors: string[] = [];
    
    if (!document.title?.trim()) {
      errors.push('Title is required');
    }
    
    if (!document.type) {
      errors.push('Document type is required');
    }
    
    if (!document.content?.trim()) {
      errors.push('Content is required');
    }
    
    if (document.expirationDate && document.effectiveDate && 
        document.expirationDate <= document.effectiveDate) {
      errors.push('Expiration date must be after effective date');
    }
    
    return errors;
  }

  validateCaseForm(caseData: Partial<LegalCase>): string[] {
    const errors: string[] = [];
    
    if (!caseData.title?.trim()) {
      errors.push('Case title is required');
    }
    
    if (!caseData.type) {
      errors.push('Case type is required');
    }
    
    if (!caseData.description?.trim()) {
      errors.push('Case description is required');
    }
    
    if (!caseData.jurisdiction?.trim()) {
      errors.push('Jurisdiction is required');
    }
    
    if (!caseData.assignedAttorney?.trim()) {
      errors.push('Assigned attorney is required');
    }
    
    return errors;
  }

  validateComplianceForm(item: Partial<ComplianceItem>): string[] {
    const errors: string[] = [];
    
    if (!item.area) {
      errors.push('Compliance area is required');
    }
    
    if (!item.regulation?.trim()) {
      errors.push('Regulation is required');
    }
    
    if (!item.requirement?.trim()) {
      errors.push('Requirement is required');
    }
    
    if (!item.description?.trim()) {
      errors.push('Description is required');
    }
    
    if (item.nextReviewDate && item.lastReviewDate && 
        item.nextReviewDate <= item.lastReviewDate) {
      errors.push('Next review date must be after last review date');
    }
    
    return errors;
  }
}