import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Models
import {
  Dispute,
  DisputeTemplate,
  DisputeLetter,
  DisputeStats,
  DisputeChartData,
  DisputeResponse,
  DisputeAttachment,
  DisputeHistoryEntry,
  DisputeType,
  DisputeStatus,
  CreditBureau,
  DisputePriority,
  DisputeReason,
  DeliveryMethod
} from './disputes.model';

// Environment
import { environment } from '../../../../environments/environment';

interface DisputeFilters {
  search?: string;
  status?: DisputeStatus;
  type?: DisputeType;
  bureau?: CreditBureau;
  client_id?: string;
  priority?: DisputePriority;
  date_from?: string;
  date_to?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

@Injectable({
  providedIn: 'root'
})
export class DisputesService {
  private readonly apiUrl = `${environment.apiUrl}/disputes`;
  private disputesSubject = new BehaviorSubject<Dispute[]>([]);
  public disputes$ = this.disputesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Dispute CRUD Operations
  getDisputes(filters?: DisputeFilters, pagination?: PaginationParams): Observable<PaginatedResponse<Dispute>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DisputeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    if (pagination) {
      params = params.set('page', pagination.page.toString());
      params = params.set('limit', pagination.limit.toString());
      if (pagination.sort_by) {
        params = params.set('sort_by', pagination.sort_by);
      }
      if (pagination.sort_order) {
        params = params.set('sort_order', pagination.sort_order);
      }
    }

    return this.http.get<PaginatedResponse<Dispute>>(`${this.apiUrl}`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching disputes:', error);
          return of({
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            total_pages: 0
          });
        })
      );
  }

  getDispute(id: string): Observable<Dispute> {
    return this.http.get<Dispute>(`${this.apiUrl}/${id}`);
  }

  createDispute(dispute: Partial<Dispute>): Observable<Dispute> {
    return this.http.post<Dispute>(`${this.apiUrl}`, dispute);
  }

  updateDispute(id: string, dispute: Partial<Dispute>): Observable<Dispute> {
    return this.http.put<Dispute>(`${this.apiUrl}/${id}`, dispute);
  }

  deleteDispute(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Bulk Operations
  bulkCreateDisputes(disputes: Partial<Dispute>[]): Observable<Dispute[]> {
    return this.http.post<Dispute[]>(`${this.apiUrl}/bulk`, { disputes });
  }

  bulkUpdateStatus(disputeIds: string[], status: DisputeStatus): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/bulk/status`, {
      dispute_ids: disputeIds,
      status
    });
  }

  bulkDelete(disputeIds: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bulk`, {
      body: { dispute_ids: disputeIds }
    });
  }

  bulkAssignResponses(disputeIds: string[], responseData: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk/assign-responses`, {
      dispute_ids: disputeIds,
      response_data: responseData
    });
  }

  // Statistics and Analytics
  getDisputeStats(filters?: DisputeFilters): Observable<DisputeStats> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DisputeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<DisputeStats>(`${this.apiUrl}/stats`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching dispute stats:', error);
          return of({
            total: 0,
            active: 0,
            pending: 0,
            completed: 0,
            success_rate: 0,
            by_bureau: {
              [CreditBureau.EXPERIAN]: 0,
              [CreditBureau.EQUIFAX]: 0,
              [CreditBureau.TRANSUNION]: 0
            },
            by_type: {
              [DisputeType.ACCOUNT_DISPUTE]: 0,
              [DisputeType.INQUIRY_DISPUTE]: 0,
              [DisputeType.PERSONAL_INFO]: 0,
              [DisputeType.PUBLIC_RECORD]: 0,
              [DisputeType.MIXED_FILE]: 0
            },
            by_status: {
              [DisputeStatus.DRAFT]: 0,
              [DisputeStatus.SUBMITTED]: 0,
              [DisputeStatus.IN_PROGRESS]: 0,
              [DisputeStatus.PENDING_RESPONSE]: 0,
              [DisputeStatus.UNDER_REVIEW]: 0,
              [DisputeStatus.RESOLVED]: 0,
              [DisputeStatus.REJECTED]: 0,
              [DisputeStatus.ESCALATED]: 0
            }
          });
        })
      );
  }

  getDisputeChartData(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Observable<DisputeChartData> {
    const params = new HttpParams().set('period', period);
    
    return this.http.get<DisputeChartData>(`${this.apiUrl}/analytics/chart`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching chart data:', error);
          return of({
            labels: [],
            datasets: []
          });
        })
      );
  }

  getRecentDisputes(limit: number = 5): Observable<Dispute[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('sort_by', 'created_date')
      .set('sort_order', 'desc');

    return this.http.get<PaginatedResponse<Dispute>>(`${this.apiUrl}`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching recent disputes:', error);
          return of([]);
        })
      );
  }

  getDisputeHistory(filters?: any): Observable<PaginatedResponse<DisputeHistoryEntry>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<DisputeHistoryEntry>>(`${this.apiUrl}/history`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching dispute history:', error);
          return of({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            total_pages: 0
          });
        })
      );
  }

  // Template Operations
  getTemplates(type?: DisputeType, bureau?: CreditBureau): Observable<DisputeTemplate[]> {
    let params = new HttpParams();
    
    if (type) {
      params = params.set('type', type);
    }
    if (bureau) {
      params = params.set('bureau', bureau);
    }

    return this.http.get<DisputeTemplate[]>(`${this.apiUrl}/templates`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching templates:', error);
          return of([]);
        })
      );
  }

  getTemplate(id: string): Observable<DisputeTemplate> {
    return this.http.get<DisputeTemplate>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(template: Partial<DisputeTemplate>): Observable<DisputeTemplate> {
    return this.http.post<DisputeTemplate>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: string, template: Partial<DisputeTemplate>): Observable<DisputeTemplate> {
    return this.http.put<DisputeTemplate>(`${this.apiUrl}/templates/${id}`, template);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  // Letter Operations
  generateLetter(disputeId: string, templateId: string, customizations?: any): Observable<DisputeLetter> {
    return this.http.post<DisputeLetter>(`${this.apiUrl}/${disputeId}/letters`, {
      template_id: templateId,
      customizations
    });
  }

  getLetters(disputeId: string): Observable<DisputeLetter[]> {
    return this.http.get<DisputeLetter[]>(`${this.apiUrl}/${disputeId}/letters`);
  }

  getLetter(disputeId: string, letterId: string): Observable<DisputeLetter> {
    return this.http.get<DisputeLetter>(`${this.apiUrl}/${disputeId}/letters/${letterId}`);
  }

  sendLetter(disputeId: string, letterId: string, deliveryMethod: DeliveryMethod): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${disputeId}/letters/${letterId}/send`, {
      delivery_method: deliveryMethod
    });
  }

  downloadLetter(disputeId: string, letterId: string, format: 'pdf' | 'docx' = 'pdf'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    
    return this.http.get(`${this.apiUrl}/${disputeId}/letters/${letterId}/download`, {
      params,
      responseType: 'blob'
    });
  }

  downloadMultipleLetters(letterIds: string[]): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/letters/download-multiple`, {
      letter_ids: letterIds
    }, {
      responseType: 'blob'
    });
  }

  saveAndSendLetters(saveData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/letters/save-and-send`, saveData);
  }

  generateDisputeLetters(disputeData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-letters`, disputeData);
  }

  // Attachment Operations
  uploadAttachment(disputeId: string, file: File, description?: string): Observable<DisputeAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.http.post<DisputeAttachment>(`${this.apiUrl}/${disputeId}/attachments`, formData);
  }

  getAttachments(disputeId: string): Observable<DisputeAttachment[]> {
    return this.http.get<DisputeAttachment[]>(`${this.apiUrl}/${disputeId}/attachments`);
  }

  deleteAttachment(disputeId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${disputeId}/attachments/${attachmentId}`);
  }

  downloadAttachment(disputeId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${disputeId}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });
  }

  // Response Operations
  getResponses(disputeId: string): Observable<DisputeResponse[]> {
    return this.http.get<DisputeResponse[]>(`${this.apiUrl}/${disputeId}/responses`);
  }

  addResponse(disputeId: string, response: Partial<DisputeResponse>): Observable<DisputeResponse> {
    return this.http.post<DisputeResponse>(`${this.apiUrl}/${disputeId}/responses`, response);
  }

  updateResponse(disputeId: string, responseId: string, response: Partial<DisputeResponse>): Observable<DisputeResponse> {
    return this.http.put<DisputeResponse>(`${this.apiUrl}/${disputeId}/responses/${responseId}`, response);
  }

  // Search and Filter
  searchDisputes(query: string, filters?: DisputeFilters): Observable<Dispute[]> {
    let params = new HttpParams().set('search', query);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DisputeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Dispute>>(`${this.apiUrl}/search`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error searching disputes:', error);
          return of([]);
        })
      );
  }

  // Export Operations
  exportDisputes(filters?: DisputeFilters, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DisputeFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Analytics Operations
  getAnalytics(filters?: any): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params = params.set(key, value.join(','));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<any>(`${this.apiUrl}/analytics`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching analytics:', error);
          return of({
            totalDisputes: 0,
            successRate: 0,
            averageResolutionTime: 0,
            byStatus: {},
            byBureau: {},
            byType: {},
            trends: []
          });
        })
      );
  }

  exportAnalytics(filters?: any, format: 'pdf' | 'excel' | 'csv' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params = params.set(key, value.join(','));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get(`${this.apiUrl}/analytics/export`, {
      params,
      responseType: 'blob'
    });
  }

  // Real-time Updates
  subscribeToUpdates(disputeId?: string): Observable<any> {
    // This would typically use WebSocket or Server-Sent Events
    // For now, return an empty observable
    return of(null);
  }

  // Utility Methods
  validateDispute(dispute: Partial<Dispute>): string[] {
    const errors: string[] = [];
    
    if (!dispute.client_id) {
      errors.push('Client is required');
    }
    
    if (!dispute.type) {
      errors.push('Dispute type is required');
    }
    
    if (!dispute.bureau) {
      errors.push('Credit bureau is required');
    }
    
    if (!dispute.description || dispute.description.trim().length === 0) {
      errors.push('Description is required');
    }
    
    if (!dispute.dispute_items || dispute.dispute_items.length === 0) {
      errors.push('At least one dispute item is required');
    }
    
    return errors;
  }

  getDuplicateDisputes(clientId: string, accountNumber?: string): Observable<Dispute[]> {
    let params = new HttpParams().set('client_id', clientId);
    
    if (accountNumber) {
      params = params.set('account_number', accountNumber);
    }

    return this.http.get<Dispute[]>(`${this.apiUrl}/duplicates`, { params })
      .pipe(
        catchError(error => {
          console.error('Error checking for duplicates:', error);
          return of([]);
        })
      );
  }

  // Cache Management
  refreshCache(): void {
    // Refresh local cache if needed
    this.getDisputes().subscribe(response => {
      this.disputesSubject.next(response.data);
    });
  }

  clearCache(): void {
    this.disputesSubject.next([]);
  }

  // Label utility methods
  getCreditBureauLabel(bureau: CreditBureau): string {
    const labels: Record<CreditBureau, string> = {
      [CreditBureau.EXPERIAN]: 'Experian',
      [CreditBureau.EQUIFAX]: 'Equifax',
      [CreditBureau.TRANSUNION]: 'TransUnion'
    };
    return labels[bureau] || bureau;
  }

  getDisputeReasonLabel(reason: DisputeReason): string {
    const labels: Record<DisputeReason, string> = {
      [DisputeReason.NOT_MINE]: 'Not Mine',
      [DisputeReason.INCORRECT_BALANCE]: 'Incorrect Balance',
      [DisputeReason.INCORRECT_PAYMENT_HISTORY]: 'Incorrect Payment History',
      [DisputeReason.ACCOUNT_CLOSED]: 'Account Closed',
      [DisputeReason.PAID_IN_FULL]: 'Paid in Full',
      [DisputeReason.SETTLED]: 'Settled',
      [DisputeReason.INCORRECT_DATES]: 'Incorrect Dates',
      [DisputeReason.DUPLICATE]: 'Duplicate',
      [DisputeReason.IDENTITY_THEFT]: 'Identity Theft',
      [DisputeReason.UNAUTHORIZED]: 'Unauthorized',
      [DisputeReason.INCORRECT_PERSONAL_INFO]: 'Incorrect Personal Info'
    };
    return labels[reason] || reason;
  }

  getDisputePriorityLabel(priority: DisputePriority): string {
    const labels: Record<DisputePriority, string> = {
      [DisputePriority.LOW]: 'Low',
      [DisputePriority.MEDIUM]: 'Medium',
      [DisputePriority.HIGH]: 'High',
      [DisputePriority.URGENT]: 'Urgent'
    };
    return labels[priority] || priority;
  }

  getDisputeTypeLabel(type: DisputeType): string {
    const labels: Record<DisputeType, string> = {
      [DisputeType.ACCOUNT_DISPUTE]: 'Account Dispute',
      [DisputeType.INQUIRY_DISPUTE]: 'Inquiry Dispute',
      [DisputeType.PERSONAL_INFO]: 'Personal Information',
      [DisputeType.PUBLIC_RECORD]: 'Public Record',
      [DisputeType.MIXED_FILE]: 'Mixed File'
    };
    return labels[type] || type;
  }

  getDisputeStatusLabel(status: DisputeStatus): string {
    const labels: Record<DisputeStatus, string> = {
      [DisputeStatus.DRAFT]: 'Draft',
      [DisputeStatus.SUBMITTED]: 'Submitted',
      [DisputeStatus.IN_PROGRESS]: 'In Progress',
      [DisputeStatus.PENDING_RESPONSE]: 'Pending Response',
      [DisputeStatus.UNDER_REVIEW]: 'Under Review',
      [DisputeStatus.RESOLVED]: 'Resolved',
      [DisputeStatus.REJECTED]: 'Rejected',
      [DisputeStatus.ESCALATED]: 'Escalated'
    };
    return labels[status] || status;
  }

  // Template methods
  getDisputeTemplates(filters?: any): Observable<DisputeTemplate[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<DisputeTemplate[]>(`${this.apiUrl}/templates`, { params });
  }

  importDisputeTemplates(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/templates/import`, formData);
  }

  exportDisputeTemplates(filters: any): Observable<Blob> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/templates/export`, {
      params,
      responseType: 'blob'
    });
  }
}