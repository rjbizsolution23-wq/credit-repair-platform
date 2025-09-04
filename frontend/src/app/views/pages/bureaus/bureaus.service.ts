import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  BureauDispute,
  BureauCommunication,
  BureauResponse,
  BureauContact,
  DisputeTracking,
  BureauAnalytics,
  DisputeTemplate,
  AutomationRule,
  CreditBureau,
  DisputeType,
  DisputeStatus,
  CommunicationType,
  CommunicationStatus,
  ResponseType,
  ContactType
} from './bureaus.model';

export interface DisputeFilters {
  search?: string;
  bureau?: CreditBureau;
  type?: DisputeType;
  status?: DisputeStatus;
  clientId?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  priority?: string;
  overdue?: boolean;
}

export interface CommunicationFilters {
  search?: string;
  bureau?: CreditBureau;
  type?: CommunicationType;
  status?: CommunicationStatus;
  clientId?: string;
  disputeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ResponseFilters {
  search?: string;
  bureau?: CreditBureau;
  type?: ResponseType;
  status?: string;
  clientId?: string;
  disputeId?: string;
  dateFrom?: string;
  dateTo?: string;
  actionRequired?: boolean;
}

export interface ContactFilters {
  search?: string;
  bureau?: CreditBureau;
  type?: ContactType;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class BureausService {
  private readonly apiUrl = '/api/bureaus';
  private disputesSubject = new BehaviorSubject<BureauDispute[]>([]);
  private communicationsSubject = new BehaviorSubject<BureauCommunication[]>([]);
  private responsesSubject = new BehaviorSubject<BureauResponse[]>([]);
  private contactsSubject = new BehaviorSubject<BureauContact[]>([]);

  public disputes$ = this.disputesSubject.asObservable();
  public communications$ = this.communicationsSubject.asObservable();
  public responses$ = this.responsesSubject.asObservable();
  public contacts$ = this.contactsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Dispute Management
  getDisputes(filters?: DisputeFilters, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc'): Observable<PaginatedResponse<BureauDispute>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<BureauDispute>>(`${this.apiUrl}/disputes`, { params })
      .pipe(
        tap(response => {
          if (page === 1) {
            this.disputesSubject.next(response.data);
          }
        })
      );
  }

  getDispute(id: string): Observable<BureauDispute> {
    return this.http.get<BureauDispute>(`${this.apiUrl}/disputes/${id}`);
  }

  createDispute(dispute: Partial<BureauDispute>): Observable<BureauDispute> {
    return this.http.post<BureauDispute>(`${this.apiUrl}/disputes`, dispute)
      .pipe(
        tap(newDispute => {
          const currentDisputes = this.disputesSubject.value;
          this.disputesSubject.next([newDispute, ...currentDisputes]);
        })
      );
  }

  updateDispute(id: string, updates: Partial<BureauDispute>): Observable<BureauDispute> {
    return this.http.put<BureauDispute>(`${this.apiUrl}/disputes/${id}`, updates)
      .pipe(
        tap(updatedDispute => {
          const currentDisputes = this.disputesSubject.value;
          const index = currentDisputes.findIndex(d => d.id === id);
          if (index !== -1) {
            currentDisputes[index] = updatedDispute;
            this.disputesSubject.next([...currentDisputes]);
          }
        })
      );
  }

  deleteDispute(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disputes/${id}`)
      .pipe(
        tap(() => {
          const currentDisputes = this.disputesSubject.value;
          this.disputesSubject.next(currentDisputes.filter(d => d.id !== id));
        })
      );
  }

  bulkUpdateDisputes(ids: string[], updates: Partial<BureauDispute>): Observable<BureauDispute[]> {
    return this.http.put<BureauDispute[]>(`${this.apiUrl}/disputes/bulk`, { ids, updates })
      .pipe(
        tap(updatedDisputes => {
          const currentDisputes = this.disputesSubject.value;
          const updatedMap = new Map(updatedDisputes.map(d => [d.id, d]));
          const newDisputes = currentDisputes.map(d => updatedMap.get(d.id) || d);
          this.disputesSubject.next(newDisputes);
        })
      );
  }

  bulkDeleteDisputes(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disputes/bulk`, { body: { ids } })
      .pipe(
        tap(() => {
          const currentDisputes = this.disputesSubject.value;
          this.disputesSubject.next(currentDisputes.filter(d => !ids.includes(d.id)));
        })
      );
  }

  submitDispute(id: string): Observable<BureauDispute> {
    return this.http.post<BureauDispute>(`${this.apiUrl}/disputes/${id}/submit`, {});
  }

  escalateDispute(id: string, reason: string): Observable<BureauDispute> {
    return this.http.post<BureauDispute>(`${this.apiUrl}/disputes/${id}/escalate`, { reason });
  }

  // Communication Management
  getCommunications(filters?: CommunicationFilters, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc'): Observable<PaginatedResponse<BureauCommunication>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<BureauCommunication>>(`${this.apiUrl}/communications`, { params })
      .pipe(
        tap(response => {
          if (page === 1) {
            this.communicationsSubject.next(response.data);
          }
        })
      );
  }

  getCommunication(id: string): Observable<BureauCommunication> {
    return this.http.get<BureauCommunication>(`${this.apiUrl}/communications/${id}`);
  }

  createCommunication(communication: Partial<BureauCommunication>): Observable<BureauCommunication> {
    return this.http.post<BureauCommunication>(`${this.apiUrl}/communications`, communication)
      .pipe(
        tap(newCommunication => {
          const currentCommunications = this.communicationsSubject.value;
          this.communicationsSubject.next([newCommunication, ...currentCommunications]);
        })
      );
  }

  updateCommunication(id: string, updates: Partial<BureauCommunication>): Observable<BureauCommunication> {
    return this.http.put<BureauCommunication>(`${this.apiUrl}/communications/${id}`, updates);
  }

  deleteCommunication(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/communications/${id}`);
  }

  sendCommunication(id: string): Observable<BureauCommunication> {
    return this.http.post<BureauCommunication>(`${this.apiUrl}/communications/${id}/send`, {});
  }

  // Response Management
  getResponses(filters?: ResponseFilters, page = 1, limit = 10, sortBy = 'receivedAt', sortOrder = 'desc'): Observable<PaginatedResponse<BureauResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<BureauResponse>>(`${this.apiUrl}/responses`, { params })
      .pipe(
        tap(response => {
          if (page === 1) {
            this.responsesSubject.next(response.data);
          }
        })
      );
  }

  getResponse(id: string): Observable<BureauResponse> {
    return this.http.get<BureauResponse>(`${this.apiUrl}/responses/${id}`);
  }

  processResponse(id: string, notes: string, nextSteps: string[]): Observable<BureauResponse> {
    return this.http.post<BureauResponse>(`${this.apiUrl}/responses/${id}/process`, { notes, nextSteps });
  }

  markResponseReviewed(id: string, reviewedBy: string): Observable<BureauResponse> {
    return this.http.post<BureauResponse>(`${this.apiUrl}/responses/${id}/review`, { reviewedBy });
  }

  // Contact Management
  getContacts(filters?: ContactFilters, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc'): Observable<PaginatedResponse<BureauContact>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<BureauContact>>(`${this.apiUrl}/contacts`, { params })
      .pipe(
        tap(response => {
          if (page === 1) {
            this.contactsSubject.next(response.data);
          }
        })
      );
  }

  getContact(id: string): Observable<BureauContact> {
    return this.http.get<BureauContact>(`${this.apiUrl}/contacts/${id}`);
  }

  createContact(contact: Partial<BureauContact>): Observable<BureauContact> {
    return this.http.post<BureauContact>(`${this.apiUrl}/contacts`, contact)
      .pipe(
        tap(newContact => {
          const currentContacts = this.contactsSubject.value;
          this.contactsSubject.next([newContact, ...currentContacts]);
        })
      );
  }

  updateContact(id: string, updates: Partial<BureauContact>): Observable<BureauContact> {
    return this.http.put<BureauContact>(`${this.apiUrl}/contacts/${id}`, updates);
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/contacts/${id}`);
  }

  // Tracking
  getDisputeTracking(disputeId: string): Observable<DisputeTracking[]> {
    return this.http.get<DisputeTracking[]>(`${this.apiUrl}/disputes/${disputeId}/tracking`);
  }

  addTrackingEntry(disputeId: string, entry: Partial<DisputeTracking>): Observable<DisputeTracking> {
    return this.http.post<DisputeTracking>(`${this.apiUrl}/disputes/${disputeId}/tracking`, entry);
  }

  // Analytics
  getAnalytics(dateFrom?: string, dateTo?: string): Observable<BureauAnalytics> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<BureauAnalytics>(`${this.apiUrl}/analytics`, { params });
  }

  getDisputesByBureau(dateFrom?: string, dateTo?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<any[]>(`${this.apiUrl}/analytics/disputes-by-bureau`, { params });
  }

  getDisputesByType(dateFrom?: string, dateTo?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<any[]>(`${this.apiUrl}/analytics/disputes-by-type`, { params });
  }

  getSuccessRateTrends(dateFrom?: string, dateTo?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);

    return this.http.get<any[]>(`${this.apiUrl}/analytics/success-rate-trends`, { params });
  }

  // Templates
  getTemplates(): Observable<DisputeTemplate[]> {
    return this.http.get<DisputeTemplate[]>(`${this.apiUrl}/templates`);
  }

  getTemplate(id: string): Observable<DisputeTemplate> {
    return this.http.get<DisputeTemplate>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(template: Partial<DisputeTemplate>): Observable<DisputeTemplate> {
    return this.http.post<DisputeTemplate>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: string, updates: Partial<DisputeTemplate>): Observable<DisputeTemplate> {
    return this.http.put<DisputeTemplate>(`${this.apiUrl}/templates/${id}`, updates);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  // Automation
  getAutomationRules(): Observable<AutomationRule[]> {
    return this.http.get<AutomationRule[]>(`${this.apiUrl}/automation/rules`);
  }

  getAutomationRule(id: string): Observable<AutomationRule> {
    return this.http.get<AutomationRule>(`${this.apiUrl}/automation/rules/${id}`);
  }

  createAutomationRule(rule: Partial<AutomationRule>): Observable<AutomationRule> {
    return this.http.post<AutomationRule>(`${this.apiUrl}/automation/rules`, rule);
  }

  updateAutomationRule(id: string, updates: Partial<AutomationRule>): Observable<AutomationRule> {
    return this.http.put<AutomationRule>(`${this.apiUrl}/automation/rules/${id}`, updates);
  }

  deleteAutomationRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/automation/rules/${id}`);
  }

  toggleAutomationRule(id: string, isActive: boolean): Observable<AutomationRule> {
    return this.http.patch<AutomationRule>(`${this.apiUrl}/automation/rules/${id}/toggle`, { isActive });
  }

  // Export
  exportDisputes(filters?: DisputeFilters, format = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/disputes/export`, {
      params,
      responseType: 'blob'
    });
  }

  exportCommunications(filters?: CommunicationFilters, format = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/communications/export`, {
      params,
      responseType: 'blob'
    });
  }

  exportResponses(filters?: ResponseFilters, format = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/responses/export`, {
      params,
      responseType: 'blob'
    });
  }

  // File Upload
  uploadDocument(file: File, disputeId?: string, communicationId?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (disputeId) formData.append('disputeId', disputeId);
    if (communicationId) formData.append('communicationId', communicationId);

    return this.http.post(`${this.apiUrl}/documents/upload`, formData);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/${documentId}`);
  }

  // Utility Methods
  refreshData(): void {
    this.getDisputes().subscribe();
    this.getCommunications().subscribe();
    this.getResponses().subscribe();
    this.getContacts().subscribe();
  }

  clearCache(): void {
    this.disputesSubject.next([]);
    this.communicationsSubject.next([]);
    this.responsesSubject.next([]);
    this.contactsSubject.next([]);
  }
}