import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'suspended';
  territory?: string;
  manager?: string;
  commissionRate: number;
  performanceScore: number;
  totalClients: number;
  activeDisputes: number;
  monthlyRevenue: number;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Territory {
  id: string;
  name: string;
  description: string;
  assignedStaff: string[];
  clientCount: number;
  revenue: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PerformanceMetric {
  id?: string;
  staffId: string;
  period: string;
  clientsAcquired: number;
  disputesResolved: number;
  revenue: number;
  customerSatisfaction: number;
  commissionEarned: number;
  tasksCompleted: number;
  responseTime: number;
  createdAt?: string;
}

export interface StaffCommission {
  id: string;
  staffId: string;
  period: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  bonuses: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

export interface StaffAnalytics {
  totalStaff: number;
  activeStaff: number;
  newHiresThisMonth: number;
  averagePerformance: number;
  totalCommissions: number;
  averageCommissionRate: number;
  topPerformers: StaffMember[];
  departmentDistribution: { [key: string]: number };
  performanceTrends: { period: string; score: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = `${environment.apiUrl}/staff`;
  private staffSubject = new BehaviorSubject<StaffMember[]>([]);
  private territoriesSubject = new BehaviorSubject<Territory[]>([]);
  
  public staff$ = this.staffSubject.asObservable();
  public territories$ = this.territoriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Staff Management
  getStaffMembers(params?: any): Observable<StaffMember[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get<{ data: StaffMember[] }>(`${this.apiUrl}`, { params: httpParams })
      .pipe(
        map(response => {
          this.staffSubject.next(response.data);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  getStaffMember(id: string): Observable<StaffMember> {
    return this.http.get<{ data: StaffMember }>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createStaffMember(staff: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.post<{ data: StaffMember }>(`${this.apiUrl}`, staff)
      .pipe(
        map(response => {
          const currentStaff = this.staffSubject.value;
          this.staffSubject.next([...currentStaff, response.data]);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  updateStaffMember(id: string, staff: Partial<StaffMember>): Observable<StaffMember> {
    return this.http.put<{ data: StaffMember }>(`${this.apiUrl}/${id}`, staff)
      .pipe(
        map(response => {
          const currentStaff = this.staffSubject.value;
          const index = currentStaff.findIndex(s => s.id === id);
          if (index !== -1) {
            currentStaff[index] = response.data;
            this.staffSubject.next([...currentStaff]);
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  deleteStaffMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        map(() => {
          const currentStaff = this.staffSubject.value;
          this.staffSubject.next(currentStaff.filter(s => s.id !== id));
        }),
        catchError(this.handleError)
      );
  }

  // Territory Management
  getTerritories(): Observable<Territory[]> {
    return this.http.get<{ data: Territory[] }>(`${this.apiUrl}/territories`)
      .pipe(
        map(response => {
          this.territoriesSubject.next(response.data);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  createTerritory(territory: Partial<Territory>): Observable<Territory> {
    return this.http.post<{ data: Territory }>(`${this.apiUrl}/territories`, territory)
      .pipe(
        map(response => {
          const currentTerritories = this.territoriesSubject.value;
          this.territoriesSubject.next([...currentTerritories, response.data]);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  updateTerritory(id: string, territory: Partial<Territory>): Observable<Territory> {
    return this.http.put<{ data: Territory }>(`${this.apiUrl}/territories/${id}`, territory)
      .pipe(
        map(response => {
          const currentTerritories = this.territoriesSubject.value;
          const index = currentTerritories.findIndex(t => t.id === id);
          if (index !== -1) {
            currentTerritories[index] = response.data;
            this.territoriesSubject.next([...currentTerritories]);
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  deleteTerritory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/territories/${id}`)
      .pipe(
        map(() => {
          const currentTerritories = this.territoriesSubject.value;
          this.territoriesSubject.next(currentTerritories.filter(t => t.id !== id));
        }),
        catchError(this.handleError)
      );
  }

  assignStaffToTerritory(staffId: string, territoryId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/territories/${territoryId}/assign`, { staffId })
      .pipe(catchError(this.handleError));
  }

  removeStaffFromTerritory(staffId: string, territoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/territories/${territoryId}/staff/${staffId}`)
      .pipe(catchError(this.handleError));
  }

  // Performance Management
  getPerformanceMetrics(staffId?: string, period?: string): Observable<PerformanceMetric[]> {
    let httpParams = new HttpParams();
    if (staffId) httpParams = httpParams.set('staffId', staffId);
    if (period) httpParams = httpParams.set('period', period);
    
    return this.http.get<{ data: PerformanceMetric[] }>(`${this.apiUrl}/performance`, { params: httpParams })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updatePerformanceMetric(staffId: string, metric: Partial<PerformanceMetric>): Observable<PerformanceMetric> {
    return this.http.post<{ data: PerformanceMetric }>(`${this.apiUrl}/${staffId}/performance`, metric)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Commission Management
  getCommissions(staffId?: string, period?: string): Observable<StaffCommission[]> {
    let httpParams = new HttpParams();
    if (staffId) httpParams = httpParams.set('staffId', staffId);
    if (period) httpParams = httpParams.set('period', period);
    
    return this.http.get<{ data: StaffCommission[] }>(`${this.apiUrl}/commissions`, { params: httpParams })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  calculateCommission(staffId: string, period: string): Observable<StaffCommission> {
    return this.http.post<{ data: StaffCommission }>(`${this.apiUrl}/${staffId}/commissions/calculate`, { period })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  payCommission(commissionId: string): Observable<StaffCommission> {
    return this.http.post<{ data: StaffCommission }>(`${this.apiUrl}/commissions/${commissionId}/pay`, {})
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Analytics
  getStaffAnalytics(period?: string): Observable<StaffAnalytics> {
    let httpParams = new HttpParams();
    if (period) httpParams = httpParams.set('period', period);
    
    return this.http.get<{ data: StaffAnalytics }>(`${this.apiUrl}/analytics`, { params: httpParams })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getDepartmentPerformance(department: string, period?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (period) httpParams = httpParams.set('period', period);
    
    return this.http.get<{ data: any }>(`${this.apiUrl}/departments/${department}/performance`, { params: httpParams })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Reporting
  exportStaffData(format: 'csv' | 'excel' = 'csv', filters?: any): Observable<Blob> {
    let httpParams = new HttpParams().set('format', format);
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          httpParams = httpParams.set(key, filters[key]);
        }
      });
    }
    
    return this.http.get(`${this.apiUrl}/export`, {
      params: httpParams,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  generatePerformanceReport(staffId: string, period: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${staffId}/performance/report`, {
      params: { period },
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Utility Methods
  searchStaff(query: string): Observable<StaffMember[]> {
    return this.http.get<{ data: StaffMember[] }>(`${this.apiUrl}/search`, {
      params: { q: query }
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getStaffByDepartment(department: string): Observable<StaffMember[]> {
    return this.http.get<{ data: StaffMember[] }>(`${this.apiUrl}`, {
      params: { department }
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  getStaffByTerritory(territoryId: string): Observable<StaffMember[]> {
    return this.http.get<{ data: StaffMember[] }>(`${this.apiUrl}`, {
      params: { territory: territoryId }
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  updateStaffStatus(staffId: string, status: 'active' | 'inactive' | 'suspended'): Observable<StaffMember> {
    return this.http.patch<{ data: StaffMember }>(`${this.apiUrl}/${staffId}/status`, { status })
      .pipe(
        map(response => {
          const currentStaff = this.staffSubject.value;
          const index = currentStaff.findIndex(s => s.id === staffId);
          if (index !== -1) {
            currentStaff[index] = response.data;
            this.staffSubject.next([...currentStaff]);
          }
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  bulkUpdateStaff(updates: { id: string; data: Partial<StaffMember> }[]): Observable<StaffMember[]> {
    return this.http.patch<{ data: StaffMember[] }>(`${this.apiUrl}/bulk-update`, { updates })
      .pipe(
        map(response => {
          this.staffSubject.next(response.data);
          return response.data;
        }),
        catchError(this.handleError)
      );
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Staff Service Error:', error);
    throw error;
  };
}