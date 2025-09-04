import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Client, ClientStatus, ClientStage, ClientFilters, ClientListResponse } from './clients.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
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
   * Preview import clients from file
   */
  previewImport(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/import/preview`, formData);
  }

  /**
   * Import clients from file
   */
  importClients(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/import`, formData);
  }

  /**
   * Export clients
   */
  exportClients(exportData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/export`, exportData);
  }

  /**
   * Get client statistics
   */
  getClientStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  /**
   * Search clients
   */
  searchClients(query: string): Observable<Client[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Client[]>(`${this.apiUrl}/search`, { params });
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
   * Get client timeline
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
   * Get client credit report
   */
  getClientCreditReport(clientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${clientId}/credit-report`);
  }

  /**
   * Get filtered client count
   */
  getFilteredClientCount(filters?: any): Observable<{ count: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ count: number }>(`${this.apiUrl}/count`, { params });
  }

  /**
   * Get available tags
   */
  getAvailableTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tags`);
  }
}