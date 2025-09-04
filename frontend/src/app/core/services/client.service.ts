import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Client, ClientStatus, ClientStage } from '../models/client.model';
import { environment } from '../../../environments/environment';

export interface ClientListResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  stage?: ClientStage;
  assignedAgent?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/clients`;
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  public clients$ = this.clientsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all clients with optional filtering
   */
  getAllClients(filters?: ClientFilters): Observable<ClientListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ClientFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ClientListResponse>(this.apiUrl, { params })
      .pipe(
        tap(response => {
          this.clientsSubject.next(response.data);
        })
      );
  }

  /**
   * Get a single client by ID
   */
  getClientById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new client
   */
  createClient(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client)
      .pipe(
        tap(newClient => {
          const currentClients = this.clientsSubject.value;
          this.clientsSubject.next([...currentClients, newClient]);
        })
      );
  }

  /**
   * Update an existing client
   */
  updateClient(id: string, updates: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        tap(updatedClient => {
          const currentClients = this.clientsSubject.value;
          const index = currentClients.findIndex(c => c.id === id);
          if (index !== -1) {
            currentClients[index] = updatedClient;
            this.clientsSubject.next([...currentClients]);
          }
        })
      );
  }

  /**
   * Delete a client
   */
  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentClients = this.clientsSubject.value;
          const filteredClients = currentClients.filter(c => c.id !== id);
          this.clientsSubject.next(filteredClients);
        })
      );
  }

  /**
   * Update client status
   */
  updateClientStatus(id: string, status: ClientStatus): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/status`, { status })
      .pipe(
        tap(updatedClient => {
          const currentClients = this.clientsSubject.value;
          const index = currentClients.findIndex(c => c.id === id);
          if (index !== -1) {
            currentClients[index] = updatedClient;
            this.clientsSubject.next([...currentClients]);
          }
        })
      );
  }

  /**
   * Update client stage
   */
  updateClientStage(id: string, stage: ClientStage): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/stage`, { stage })
      .pipe(
        tap(updatedClient => {
          const currentClients = this.clientsSubject.value;
          const index = currentClients.findIndex(c => c.id === id);
          if (index !== -1) {
            currentClients[index] = updatedClient;
            this.clientsSubject.next([...currentClients]);
          }
        })
      );
  }

  /**
   * Get client statistics
   */
  getClientStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  /**
   * Get clients by status
   */
  getClientsByStatus(status: ClientStatus): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Get clients by stage
   */
  getClientsByStage(stage: ClientStage): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/stage/${stage}`);
  }

  /**
   * Search clients
   */
  searchClients(query: string): Observable<Client[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Client[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Get client credit reports
   */
  getClientCreditReports(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/credit-reports`);
  }

  /**
   * Get client disputes
   */
  getClientDisputes(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/disputes`);
  }

  /**
   * Get client documents
   */
  getClientDocuments(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/documents`);
  }

  /**
   * Upload client document
   */
  uploadClientDocument(clientId: string, file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return this.http.post(`${this.apiUrl}/${clientId}/documents`, formData);
  }

  /**
   * Delete client document
   */
  deleteClientDocument(clientId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clientId}/documents/${documentId}`);
  }

  /**
   * Get client communications
   */
  getClientCommunications(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/communications`);
  }

  /**
   * Send communication to client
   */
  sendCommunication(clientId: string, communication: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clientId}/communications`, communication);
  }

  /**
   * Get client goals
   */
  getClientGoals(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/goals`);
  }

  /**
   * Create client goal
   */
  createClientGoal(clientId: string, goal: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clientId}/goals`, goal);
  }

  /**
   * Update client goal
   */
  updateClientGoal(clientId: string, goalId: string, updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${clientId}/goals/${goalId}`, updates);
  }

  /**
   * Delete client goal
   */
  deleteClientGoal(clientId: string, goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clientId}/goals/${goalId}`);
  }

  /**
   * Export clients to CSV
   */
  exportClients(filters?: ClientFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ClientFilters];
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

  /**
   * Import clients from CSV
   */
  importClients(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/import`, formData);
  }

  /**
   * Get client activity timeline
   */
  getClientTimeline(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/timeline`);
  }

  /**
   * Add client note
   */
  addClientNote(clientId: string, note: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clientId}/notes`, { note });
  }

  /**
   * Get client notes
   */
  getClientNotes(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/notes`);
  }

  /**
   * Update client preferences
   */
  updateClientPreferences(clientId: string, preferences: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${clientId}/preferences`, preferences);
  }

  /**
   * Get client payment history
   */
  getClientPaymentHistory(clientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clientId}/payments`);
  }

  /**
   * Process client payment
   */
  processClientPayment(clientId: string, paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${clientId}/payments`, paymentData);
  }

  /**
   * Get client subscription details
   */
  getClientSubscription(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${clientId}/subscription`);
  }

  /**
   * Update client subscription
   */
  updateClientSubscription(clientId: string, subscriptionData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${clientId}/subscription`, subscriptionData);
  }

  /**
   * Cancel client subscription
   */
  cancelClientSubscription(clientId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${clientId}/subscription`);
  }
}