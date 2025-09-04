import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { 
  Dispute, 
  DisputeFilter, 
  DisputeStats, 
  DisputeTemplate, 
  DisputeDocument, 
  DisputeResponse, 
  DisputeNote,
  BulkDisputeOperation,
  DisputeExportOptions,
  DisputeStatus,
  DisputePriority,
  CreditBureau,
  DisputeType
} from '../models/dispute.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DisputeService {
  private apiUrl = `${environment.apiUrl}/disputes`;
  private disputesSubject = new BehaviorSubject<Dispute[]>([]);
  public disputes$ = this.disputesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get disputes with filtering and pagination
  getDisputes(filters?: DisputeFilter): Observable<ApiResponse<Dispute[]>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status?.length) params = params.set('status', filters.status.join(','));
      if (filters.type?.length) params = params.set('type', filters.type.join(','));
      if (filters.bureau?.length) params = params.set('bureau', filters.bureau.join(','));
      if (filters.priority?.length) params = params.set('priority', filters.priority.join(','));
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.createdBy) params = params.set('createdBy', filters.createdBy);
      if (filters.tags?.length) params = params.set('tags', filters.tags.join(','));
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sort) params = params.set('sort', filters.sort);
      
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString());
        params = params.set('endDate', filters.dateRange.end.toISOString());
      }
      
      if (filters.dueDate) {
        if (filters.dueDate.start) params = params.set('dueStart', filters.dueDate.start.toISOString());
        if (filters.dueDate.end) params = params.set('dueEnd', filters.dueDate.end.toISOString());
      }
    }

    return this.http.get<ApiResponse<Dispute[]>>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.disputesSubject.next(response.data);
          }
        })
      );
  }

  // Get single dispute by ID
  getDispute(id: string): Observable<ApiResponse<Dispute>> {
    return this.http.get<ApiResponse<Dispute>>(`${this.apiUrl}/${id}`);
  }

  // Create new dispute
  createDispute(dispute: Partial<Dispute>): Observable<ApiResponse<Dispute>> {
    return this.http.post<ApiResponse<Dispute>>(this.apiUrl, dispute)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const currentDisputes = this.disputesSubject.value;
            this.disputesSubject.next([response.data, ...currentDisputes]);
          }
        })
      );
  }

  // Update dispute
  updateDispute(id: string, updates: Partial<Dispute>): Observable<ApiResponse<Dispute>> {
    return this.http.put<ApiResponse<Dispute>>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const currentDisputes = this.disputesSubject.value;
            const index = currentDisputes.findIndex(d => d.id === id);
            if (index !== -1) {
              currentDisputes[index] = response.data;
              this.disputesSubject.next([...currentDisputes]);
            }
          }
        })
      );
  }

  // Delete dispute
  deleteDispute(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(response => {
          if (response.success) {
            const currentDisputes = this.disputesSubject.value;
            this.disputesSubject.next(currentDisputes.filter(d => d.id !== id));
          }
        })
      );
  }

  // Bulk operations
  bulkUpdateStatus(disputeIds: string[], status: DisputeStatus): Observable<ApiResponse<void>> {
    const operation: BulkDisputeOperation = {
      disputeIds,
      operation: 'update_status' as any,
      data: { status }
    };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/bulk`, operation);
  }

  bulkUpdatePriority(disputeIds: string[], priority: DisputePriority): Observable<ApiResponse<void>> {
    const operation: BulkDisputeOperation = {
      disputeIds,
      operation: 'update_priority' as any,
      data: { priority }
    };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/bulk`, operation);
  }

  bulkDeleteDisputes(disputeIds: string[]): Observable<ApiResponse<void>> {
    const operation: BulkDisputeOperation = {
      disputeIds,
      operation: 'delete' as any
    };
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/bulk`, operation)
      .pipe(
        tap(response => {
          if (response.success) {
            const currentDisputes = this.disputesSubject.value;
            this.disputesSubject.next(currentDisputes.filter(d => !disputeIds.includes(d.id)));
          }
        })
      );
  }

  // Dispute statistics
  getDisputeStats(filters?: DisputeFilter): Observable<ApiResponse<DisputeStats>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.createdBy) params = params.set('createdBy', filters.createdBy);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString());
        params = params.set('endDate', filters.dateRange.end.toISOString());
      }
    }

    return this.http.get<ApiResponse<DisputeStats>>(`${this.apiUrl}/stats`, { params });
  }

  // Templates
  getDisputeTemplates(type?: DisputeType, bureau?: CreditBureau): Observable<ApiResponse<DisputeTemplate[]>> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (bureau) params = params.set('bureau', bureau);
    
    return this.http.get<ApiResponse<DisputeTemplate[]>>(`${this.apiUrl}/templates`, { params });
  }

  getDisputeTemplate(id: string): Observable<ApiResponse<DisputeTemplate>> {
    return this.http.get<ApiResponse<DisputeTemplate>>(`${this.apiUrl}/templates/${id}`);
  }

  createDisputeTemplate(template: Partial<DisputeTemplate>): Observable<ApiResponse<DisputeTemplate>> {
    return this.http.post<ApiResponse<DisputeTemplate>>(`${this.apiUrl}/templates`, template);
  }

  updateDisputeTemplate(id: string, updates: Partial<DisputeTemplate>): Observable<ApiResponse<DisputeTemplate>> {
    return this.http.put<ApiResponse<DisputeTemplate>>(`${this.apiUrl}/templates/${id}`, updates);
  }

  deleteDisputeTemplate(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/templates/${id}`);
  }

  // Documents
  getDisputeDocuments(disputeId: string): Observable<ApiResponse<DisputeDocument[]>> {
    return this.http.get<ApiResponse<DisputeDocument[]>>(`${this.apiUrl}/${disputeId}/documents`);
  }

  uploadDisputeDocument(disputeId: string, file: File, category: string, description?: string): Observable<ApiResponse<DisputeDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) formData.append('description', description);
    
    return this.http.post<ApiResponse<DisputeDocument>>(`${this.apiUrl}/${disputeId}/documents`, formData);
  }

  deleteDisputeDocument(disputeId: string, documentId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${disputeId}/documents/${documentId}`);
  }

  downloadDisputeDocument(disputeId: string, documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${disputeId}/documents/${documentId}/download`, { 
      responseType: 'blob' 
    });
  }

  // Responses
  getDisputeResponses(disputeId: string): Observable<ApiResponse<DisputeResponse[]>> {
    return this.http.get<ApiResponse<DisputeResponse[]>>(`${this.apiUrl}/${disputeId}/responses`);
  }

  addDisputeResponse(disputeId: string, response: Partial<DisputeResponse>): Observable<ApiResponse<DisputeResponse>> {
    return this.http.post<ApiResponse<DisputeResponse>>(`${this.apiUrl}/${disputeId}/responses`, response);
  }

  updateDisputeResponse(disputeId: string, responseId: string, updates: Partial<DisputeResponse>): Observable<ApiResponse<DisputeResponse>> {
    return this.http.put<ApiResponse<DisputeResponse>>(`${this.apiUrl}/${disputeId}/responses/${responseId}`, updates);
  }

  deleteDisputeResponse(disputeId: string, responseId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${disputeId}/responses/${responseId}`);
  }

  // Notes
  getDisputeNotes(disputeId: string): Observable<ApiResponse<DisputeNote[]>> {
    return this.http.get<ApiResponse<DisputeNote[]>>(`${this.apiUrl}/${disputeId}/notes`);
  }

  addDisputeNote(disputeId: string, note: Partial<DisputeNote>): Observable<ApiResponse<DisputeNote>> {
    return this.http.post<ApiResponse<DisputeNote>>(`${this.apiUrl}/${disputeId}/notes`, note);
  }

  updateDisputeNote(disputeId: string, noteId: string, updates: Partial<DisputeNote>): Observable<ApiResponse<DisputeNote>> {
    return this.http.put<ApiResponse<DisputeNote>>(`${this.apiUrl}/${disputeId}/notes/${noteId}`, updates);
  }

  deleteDisputeNote(disputeId: string, noteId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${disputeId}/notes/${noteId}`);
  }

  // Timeline
  getDisputeTimeline(disputeId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${disputeId}/timeline`);
  }

  // Export
  exportDisputes(options: DisputeExportOptions): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, options, { 
      responseType: 'blob' 
    });
  }

  // Search and suggestions
  searchDisputes(query: string, limit: number = 10): Observable<ApiResponse<Dispute[]>> {
    const params = new HttpParams()
      .set('search', query)
      .set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Dispute[]>>(`${this.apiUrl}/search`, { params });
  }

  getDisputeSuggestions(clientId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/suggestions/${clientId}`);
  }

  // Validation
  validateDispute(dispute: Partial<Dispute>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/validate`, dispute);
  }

  // Duplicate detection
  checkDuplicateDispute(dispute: Partial<Dispute>): Observable<ApiResponse<Dispute[]>> {
    return this.http.post<ApiResponse<Dispute[]>>(`${this.apiUrl}/check-duplicates`, dispute);
  }

  // Auto-generation
  generateDisputeLetter(disputeId: string, templateId: string, variables: Record<string, any>): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${disputeId}/generate-letter`, {
      templateId,
      variables
    });
  }

  // Batch creation
  createBulkDisputes(disputes: Partial<Dispute>[]): Observable<ApiResponse<Dispute[]>> {
    return this.http.post<ApiResponse<Dispute[]>>(`${this.apiUrl}/bulk-create`, { disputes })
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            const currentDisputes = this.disputesSubject.value;
            this.disputesSubject.next([...response.data, ...currentDisputes]);
          }
        })
      );
  }

  // Analytics
  getDisputeAnalytics(period: string = '30d'): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/analytics`, { params });
  }

  getDisputeTrends(period: string = '12m'): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/trends`, { params });
  }

  // Utility methods
  refreshDisputes(): void {
    this.getDisputes().subscribe();
  }

  clearDisputesCache(): void {
    this.disputesSubject.next([]);
  }

  getDisputeById(id: string): Dispute | undefined {
    return this.disputesSubject.value.find(d => d.id === id);
  }

  getDisputesByClient(clientId: string): Dispute[] {
    return this.disputesSubject.value.filter(d => d.clientId === clientId);
  }

  getDisputesByStatus(status: DisputeStatus): Dispute[] {
    return this.disputesSubject.value.filter(d => d.status === status);
  }

  getOverdueDisputes(): Dispute[] {
    const now = new Date();
    return this.disputesSubject.value.filter(d => 
      d.dueDate && new Date(d.dueDate) < now && 
      !['completed', 'rejected', 'cancelled'].includes(d.status)
    );
  }

  getDisputeCount(): number {
    return this.disputesSubject.value.length;
  }

  getActiveDisputeCount(): number {
    return this.disputesSubject.value.filter(d => 
      ['submitted', 'in_progress', 'pending_response', 'under_review'].includes(d.status)
    ).length;
  }
}