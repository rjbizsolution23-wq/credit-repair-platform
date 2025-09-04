import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  LetterTemplate,
  GeneratedLetter,
  LetterAnalytics,
  BulkLetterGeneration,
  DeliveryTracking,
  LetterCategory,
  LetterType,
  LetterStatus,
  DeliveryMethod,
  RecipientType,
  BulkGenerationSettings
} from '../models/letter.model';
import { environment } from '../../environments/environment';

export interface LetterFilters {
  search?: string;
  clientId?: string;
  templateId?: string;
  category?: LetterCategory;
  status?: LetterStatus;
  recipientType?: RecipientType;
  dateFrom?: Date;
  dateTo?: Date;
  deliveryMethod?: DeliveryMethod;
  responseReceived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateFilters {
  search?: string;
  category?: LetterCategory;
  type?: LetterType;
  isActive?: boolean;
  isDefault?: boolean;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
export class LetterService {
  private apiUrl = `${environment.apiUrl}/letters`;
  private templatesUrl = `${environment.apiUrl}/letter-templates`;
  
  private lettersSubject = new BehaviorSubject<GeneratedLetter[]>([]);
  private templatesSubject = new BehaviorSubject<LetterTemplate[]>([]);
  private analyticsSubject = new BehaviorSubject<LetterAnalytics | null>(null);
  
  public letters$ = this.lettersSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();
  public analytics$ = this.analyticsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Letter Template Operations
  getTemplates(filters?: TemplateFilters): Observable<PaginatedResponse<LetterTemplate>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PaginatedResponse<LetterTemplate>>(`${this.templatesUrl}`, { params })
      .pipe(
        tap(response => {
          if (!filters?.page || filters.page === 1) {
            this.templatesSubject.next(response.data);
          }
        })
      );
  }

  getTemplate(id: string): Observable<LetterTemplate> {
    return this.http.get<LetterTemplate>(`${this.templatesUrl}/${id}`);
  }

  createTemplate(template: Partial<LetterTemplate>): Observable<LetterTemplate> {
    return this.http.post<LetterTemplate>(`${this.templatesUrl}`, template)
      .pipe(
        tap(newTemplate => {
          const currentTemplates = this.templatesSubject.value;
          this.templatesSubject.next([newTemplate, ...currentTemplates]);
        })
      );
  }

  updateTemplate(id: string, template: Partial<LetterTemplate>): Observable<LetterTemplate> {
    return this.http.put<LetterTemplate>(`${this.templatesUrl}/${id}`, template)
      .pipe(
        tap(updatedTemplate => {
          const currentTemplates = this.templatesSubject.value;
          const index = currentTemplates.findIndex(t => t.id === id);
          if (index !== -1) {
            currentTemplates[index] = updatedTemplate;
            this.templatesSubject.next([...currentTemplates]);
          }
        })
      );
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.templatesUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentTemplates = this.templatesSubject.value;
          this.templatesSubject.next(currentTemplates.filter(t => t.id !== id));
        })
      );
  }

  duplicateTemplate(id: string, name: string): Observable<LetterTemplate> {
    return this.http.post<LetterTemplate>(`${this.templatesUrl}/${id}/duplicate`, { name })
      .pipe(
        tap(newTemplate => {
          const currentTemplates = this.templatesSubject.value;
          this.templatesSubject.next([newTemplate, ...currentTemplates]);
        })
      );
  }

  // Generated Letter Operations
  getLetters(filters?: LetterFilters): Observable<PaginatedResponse<GeneratedLetter>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PaginatedResponse<GeneratedLetter>>(`${this.apiUrl}`, { params })
      .pipe(
        tap(response => {
          if (!filters?.page || filters.page === 1) {
            this.lettersSubject.next(response.data);
          }
        })
      );
  }

  getLetter(id: string): Observable<GeneratedLetter> {
    return this.http.get<GeneratedLetter>(`${this.apiUrl}/${id}`);
  }

  generateLetter(data: {
    templateId: string;
    clientId: string;
    disputeId?: string;
    recipientType: RecipientType;
    recipientId: string;
    variables: Record<string, any>;
    deliveryMethod: DeliveryMethod;
    scheduleDate?: Date;
  }): Observable<GeneratedLetter> {
    return this.http.post<GeneratedLetter>(`${this.apiUrl}/generate`, data)
      .pipe(
        tap(newLetter => {
          const currentLetters = this.lettersSubject.value;
          this.lettersSubject.next([newLetter, ...currentLetters]);
        })
      );
  }

  updateLetter(id: string, letter: Partial<GeneratedLetter>): Observable<GeneratedLetter> {
    return this.http.put<GeneratedLetter>(`${this.apiUrl}/${id}`, letter)
      .pipe(
        tap(updatedLetter => {
          const currentLetters = this.lettersSubject.value;
          const index = currentLetters.findIndex(l => l.id === id);
          if (index !== -1) {
            currentLetters[index] = updatedLetter;
            this.lettersSubject.next([...currentLetters]);
          }
        })
      );
  }

  deleteLetter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentLetters = this.lettersSubject.value;
          this.lettersSubject.next(currentLetters.filter(l => l.id !== id));
        })
      );
  }

  sendLetter(id: string): Observable<GeneratedLetter> {
    return this.http.post<GeneratedLetter>(`${this.apiUrl}/${id}/send`, {})
      .pipe(
        tap(updatedLetter => {
          const currentLetters = this.lettersSubject.value;
          const index = currentLetters.findIndex(l => l.id === id);
          if (index !== -1) {
            currentLetters[index] = updatedLetter;
            this.lettersSubject.next([...currentLetters]);
          }
        })
      );
  }

  cancelLetter(id: string): Observable<GeneratedLetter> {
    return this.http.post<GeneratedLetter>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(
        tap(updatedLetter => {
          const currentLetters = this.lettersSubject.value;
          const index = currentLetters.findIndex(l => l.id === id);
          if (index !== -1) {
            currentLetters[index] = updatedLetter;
            this.lettersSubject.next([...currentLetters]);
          }
        })
      );
  }

  recordResponse(id: string, response: {
    responseType: string;
    responseContent: string;
    responseDate: Date;
    attachments?: File[];
  }): Observable<GeneratedLetter> {
    const formData = new FormData();
    formData.append('responseType', response.responseType);
    formData.append('responseContent', response.responseContent);
    formData.append('responseDate', response.responseDate.toISOString());
    
    if (response.attachments) {
      response.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    return this.http.post<GeneratedLetter>(`${this.apiUrl}/${id}/response`, formData)
      .pipe(
        tap(updatedLetter => {
          const currentLetters = this.lettersSubject.value;
          const index = currentLetters.findIndex(l => l.id === id);
          if (index !== -1) {
            currentLetters[index] = updatedLetter;
            this.lettersSubject.next([...currentLetters]);
          }
        })
      );
  }

  // Bulk Operations
  bulkGenerateLetters(data: {
    templateId: string;
    clientIds: string[];
    recipientType: RecipientType;
    deliveryMethod: DeliveryMethod;
    settings: BulkGenerationSettings;
    variables?: Record<string, any>;
  }): Observable<BulkLetterGeneration> {
    return this.http.post<BulkLetterGeneration>(`${this.apiUrl}/bulk-generate`, data);
  }

  getBulkGeneration(id: string): Observable<BulkLetterGeneration> {
    return this.http.get<BulkLetterGeneration>(`${this.apiUrl}/bulk-generate/${id}`);
  }

  getBulkGenerations(): Observable<BulkLetterGeneration[]> {
    return this.http.get<BulkLetterGeneration[]>(`${this.apiUrl}/bulk-generate`);
  }

  cancelBulkGeneration(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-generate/${id}/cancel`, {});
  }

  bulkSendLetters(letterIds: string[]): Observable<{ success: string[], failed: string[] }> {
    return this.http.post<{ success: string[], failed: string[] }>(`${this.apiUrl}/bulk-send`, { letterIds });
  }

  bulkDeleteLetters(letterIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`, { letterIds })
      .pipe(
        tap(() => {
          const currentLetters = this.lettersSubject.value;
          this.lettersSubject.next(currentLetters.filter(l => !letterIds.includes(l.id)));
        })
      );
  }

  // Delivery Tracking
  getDeliveryTracking(letterId: string): Observable<DeliveryTracking> {
    return this.http.get<DeliveryTracking>(`${this.apiUrl}/${letterId}/tracking`);
  }

  updateDeliveryTracking(letterId: string, trackingData: Partial<DeliveryTracking>): Observable<DeliveryTracking> {
    return this.http.put<DeliveryTracking>(`${this.apiUrl}/${letterId}/tracking`, trackingData);
  }

  refreshDeliveryStatus(letterId: string): Observable<DeliveryTracking> {
    return this.http.post<DeliveryTracking>(`${this.apiUrl}/${letterId}/tracking/refresh`, {});
  }

  // Analytics
  getAnalytics(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    clientId?: string;
    category?: LetterCategory;
  }): Observable<LetterAnalytics> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<LetterAnalytics>(`${this.apiUrl}/analytics`, { params })
      .pipe(
        tap(analytics => this.analyticsSubject.next(analytics))
      );
  }

  getTemplateAnalytics(templateId: string): Observable<any> {
    return this.http.get(`${this.templatesUrl}/${templateId}/analytics`);
  }

  // Export/Import
  exportLetters(filters?: LetterFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
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

  exportTemplates(format: 'json' | 'csv' = 'json'): Observable<Blob> {
    return this.http.get(`${this.templatesUrl}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  importTemplates(file: File): Observable<{ imported: number, errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ imported: number, errors: string[] }>(`${this.templatesUrl}/import`, formData);
  }

  // Preview and Validation
  previewLetter(templateId: string, variables: Record<string, any>): Observable<{ content: string, subject: string }> {
    return this.http.post<{ content: string, subject: string }>(`${this.templatesUrl}/${templateId}/preview`, { variables });
  }

  validateTemplate(template: Partial<LetterTemplate>): Observable<{ valid: boolean, errors: string[] }> {
    return this.http.post<{ valid: boolean, errors: string[] }>(`${this.templatesUrl}/validate`, template);
  }

  checkCompliance(letterId: string): Observable<{ compliant: boolean, issues: string[] }> {
    return this.http.post<{ compliant: boolean, issues: string[] }>(`${this.apiUrl}/${letterId}/compliance-check`, {});
  }

  // Search and Suggestions
  searchLetters(query: string): Observable<GeneratedLetter[]> {
    return this.http.get<GeneratedLetter[]>(`${this.apiUrl}/search`, {
      params: { q: query }
    });
  }

  searchTemplates(query: string): Observable<LetterTemplate[]> {
    return this.http.get<LetterTemplate[]>(`${this.templatesUrl}/search`, {
      params: { q: query }
    });
  }

  getTemplateSuggestions(clientId: string, disputeId?: string): Observable<LetterTemplate[]> {
    let params = new HttpParams().set('clientId', clientId);
    if (disputeId) {
      params = params.set('disputeId', disputeId);
    }
    
    return this.http.get<LetterTemplate[]>(`${this.templatesUrl}/suggestions`, { params });
  }

  // Utility Methods
  downloadLetter(letterId: string, format: 'pdf' | 'docx' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${letterId}/download`, {
      params: { format },
      responseType: 'blob'
    });
  }

  printLetter(letterId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${letterId}/print`, {
      responseType: 'blob'
    });
  }

  getLetterHistory(letterId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${letterId}/history`);
  }

  // Real-time Updates
  subscribeToLetterUpdates(letterId: string): Observable<GeneratedLetter> {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll use polling
    return this.getLetter(letterId);
  }

  // Helper Methods
  private buildParams(filters: any): HttpParams {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });
    
    return params;
  }
}