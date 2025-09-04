import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  CreditBuildingStrategy,
  CreditRecommendation,
  CreditGoal,
  ProgressTracking,
  CreditEducationTopic,
  CreditBuildingTool,
  CreditBuildingReport,
  CreditBuildingAnalytics,
  StrategyType,
  StrategyStatus,
  RecommendationType,
  RecommendationPriority,
  RecommendationStatus,
  GoalType,
  GoalStatus,
  ProgressMetric,
  EducationLevel,
  ToolType
} from './credit-building.model';

export interface StrategyFilters {
  search?: string;
  type?: StrategyType;
  status?: StrategyStatus;
  clientId?: string;
  assignedTo?: string;
  priority?: RecommendationPriority;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface RecommendationFilters {
  search?: string;
  type?: RecommendationType;
  priority?: RecommendationPriority;
  status?: RecommendationStatus;
  clientId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface GoalFilters {
  search?: string;
  type?: GoalType;
  status?: GoalStatus;
  clientId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProgressFilters {
  clientId?: string;
  metric?: ProgressMetric;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface EducationFilters {
  search?: string;
  level?: EducationLevel;
  category?: string;
  tags?: string[];
}

export interface ToolFilters {
  search?: string;
  type?: ToolType;
  category?: string;
  isActive?: boolean;
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

export interface BulkActionRequest {
  ids: string[];
  action: string;
  data?: any;
}

export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  filters?: any;
  columns?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CreditBuildingService {
  private readonly apiUrl = '/api/credit-building';
  private strategiesSubject = new BehaviorSubject<CreditBuildingStrategy[]>([]);
  private recommendationsSubject = new BehaviorSubject<CreditRecommendation[]>([]);
  private goalsSubject = new BehaviorSubject<CreditGoal[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public strategies$ = this.strategiesSubject.asObservable();
  public recommendations$ = this.recommendationsSubject.asObservable();
  public goals$ = this.goalsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Strategy Methods
  getStrategies(filters?: StrategyFilters, pagination?: PaginationParams): Observable<ApiResponse<CreditBuildingStrategy[]>> {
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
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }
    
    this.setLoading(true);
    return this.http.get<ApiResponse<CreditBuildingStrategy[]>>(`${this.apiUrl}/strategies`, { params })
      .pipe(
        tap(response => {
          this.strategiesSubject.next(response.data);
          this.setLoading(false);
          this.clearError();
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Failed to load strategies');
          return throwError(error);
        })
      );
  }

  getStrategy(id: string): Observable<CreditBuildingStrategy> {
    return this.http.get<CreditBuildingStrategy>(`${this.apiUrl}/strategies/${id}`)
      .pipe(
        catchError(error => {
          this.setError('Failed to load strategy');
          return throwError(error);
        })
      );
  }

  createStrategy(strategy: Partial<CreditBuildingStrategy>): Observable<CreditBuildingStrategy> {
    return this.http.post<CreditBuildingStrategy>(`${this.apiUrl}/strategies`, strategy)
      .pipe(
        tap(newStrategy => {
          const currentStrategies = this.strategiesSubject.value;
          this.strategiesSubject.next([...currentStrategies, newStrategy]);
        }),
        catchError(error => {
          this.setError('Failed to create strategy');
          return throwError(error);
        })
      );
  }

  updateStrategy(id: string, strategy: Partial<CreditBuildingStrategy>): Observable<CreditBuildingStrategy> {
    return this.http.put<CreditBuildingStrategy>(`${this.apiUrl}/strategies/${id}`, strategy)
      .pipe(
        tap(updatedStrategy => {
          const currentStrategies = this.strategiesSubject.value;
          const index = currentStrategies.findIndex(s => s.id === id);
          if (index !== -1) {
            currentStrategies[index] = updatedStrategy;
            this.strategiesSubject.next([...currentStrategies]);
          }
        }),
        catchError(error => {
          this.setError('Failed to update strategy');
          return throwError(error);
        })
      );
  }

  deleteStrategy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/strategies/${id}`)
      .pipe(
        tap(() => {
          const currentStrategies = this.strategiesSubject.value;
          this.strategiesSubject.next(currentStrategies.filter(s => s.id !== id));
        }),
        catchError(error => {
          this.setError('Failed to delete strategy');
          return throwError(error);
        })
      );
  }

  bulkUpdateStrategies(request: BulkActionRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/strategies/bulk`, request)
      .pipe(
        tap(() => {
          // Refresh strategies after bulk action
          this.getStrategies().subscribe();
        }),
        catchError(error => {
          this.setError('Failed to perform bulk action on strategies');
          return throwError(error);
        })
      );
  }

  // Recommendation Methods
  getRecommendations(filters?: RecommendationFilters, pagination?: PaginationParams): Observable<ApiResponse<CreditRecommendation[]>> {
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
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }
    
    this.setLoading(true);
    return this.http.get<ApiResponse<CreditRecommendation[]>>(`${this.apiUrl}/recommendations`, { params })
      .pipe(
        tap(response => {
          this.recommendationsSubject.next(response.data);
          this.setLoading(false);
          this.clearError();
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Failed to load recommendations');
          return throwError(error);
        })
      );
  }

  getRecommendation(id: string): Observable<CreditRecommendation> {
    return this.http.get<CreditRecommendation>(`${this.apiUrl}/recommendations/${id}`)
      .pipe(
        catchError(error => {
          this.setError('Failed to load recommendation');
          return throwError(error);
        })
      );
  }

  createRecommendation(recommendation: Partial<CreditRecommendation>): Observable<CreditRecommendation> {
    return this.http.post<CreditRecommendation>(`${this.apiUrl}/recommendations`, recommendation)
      .pipe(
        tap(newRecommendation => {
          const currentRecommendations = this.recommendationsSubject.value;
          this.recommendationsSubject.next([...currentRecommendations, newRecommendation]);
        }),
        catchError(error => {
          this.setError('Failed to create recommendation');
          return throwError(error);
        })
      );
  }

  updateRecommendation(id: string, recommendation: Partial<CreditRecommendation>): Observable<CreditRecommendation> {
    return this.http.put<CreditRecommendation>(`${this.apiUrl}/recommendations/${id}`, recommendation)
      .pipe(
        tap(updatedRecommendation => {
          const currentRecommendations = this.recommendationsSubject.value;
          const index = currentRecommendations.findIndex(r => r.id === id);
          if (index !== -1) {
            currentRecommendations[index] = updatedRecommendation;
            this.recommendationsSubject.next([...currentRecommendations]);
          }
        }),
        catchError(error => {
          this.setError('Failed to update recommendation');
          return throwError(error);
        })
      );
  }

  deleteRecommendation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/recommendations/${id}`)
      .pipe(
        tap(() => {
          const currentRecommendations = this.recommendationsSubject.value;
          this.recommendationsSubject.next(currentRecommendations.filter(r => r.id !== id));
        }),
        catchError(error => {
          this.setError('Failed to delete recommendation');
          return throwError(error);
        })
      );
  }

  generateRecommendations(clientId: string): Observable<CreditRecommendation[]> {
    return this.http.post<CreditRecommendation[]>(`${this.apiUrl}/recommendations/generate`, { clientId })
      .pipe(
        catchError(error => {
          this.setError('Failed to generate recommendations');
          return throwError(error);
        })
      );
  }

  // Goal Methods
  getGoals(filters?: GoalFilters, pagination?: PaginationParams): Observable<ApiResponse<CreditGoal[]>> {
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
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }
    
    this.setLoading(true);
    return this.http.get<ApiResponse<CreditGoal[]>>(`${this.apiUrl}/goals`, { params })
      .pipe(
        tap(response => {
          this.goalsSubject.next(response.data);
          this.setLoading(false);
          this.clearError();
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Failed to load goals');
          return throwError(error);
        })
      );
  }

  getGoal(id: string): Observable<CreditGoal> {
    return this.http.get<CreditGoal>(`${this.apiUrl}/goals/${id}`)
      .pipe(
        catchError(error => {
          this.setError('Failed to load goal');
          return throwError(error);
        })
      );
  }

  createGoal(goal: Partial<CreditGoal>): Observable<CreditGoal> {
    return this.http.post<CreditGoal>(`${this.apiUrl}/goals`, goal)
      .pipe(
        tap(newGoal => {
          const currentGoals = this.goalsSubject.value;
          this.goalsSubject.next([...currentGoals, newGoal]);
        }),
        catchError(error => {
          this.setError('Failed to create goal');
          return throwError(error);
        })
      );
  }

  updateGoal(id: string, goal: Partial<CreditGoal>): Observable<CreditGoal> {
    return this.http.put<CreditGoal>(`${this.apiUrl}/goals/${id}`, goal)
      .pipe(
        tap(updatedGoal => {
          const currentGoals = this.goalsSubject.value;
          const index = currentGoals.findIndex(g => g.id === id);
          if (index !== -1) {
            currentGoals[index] = updatedGoal;
            this.goalsSubject.next([...currentGoals]);
          }
        }),
        catchError(error => {
          this.setError('Failed to update goal');
          return throwError(error);
        })
      );
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/goals/${id}`)
      .pipe(
        tap(() => {
          const currentGoals = this.goalsSubject.value;
          this.goalsSubject.next(currentGoals.filter(g => g.id !== id));
        }),
        catchError(error => {
          this.setError('Failed to delete goal');
          return throwError(error);
        })
      );
  }

  // Progress Tracking Methods
  getProgress(filters?: ProgressFilters, pagination?: PaginationParams): Observable<ApiResponse<ProgressTracking[]>> {
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
      if (filters.clientId) params = params.set('clientId', filters.clientId);
      if (filters.metric) params = params.set('metric', filters.metric);
      if (filters.dateRange) {
        params = params.set('startDate', filters.dateRange.start.toISOString())
                      .set('endDate', filters.dateRange.end.toISOString());
      }
    }
    
    return this.http.get<ApiResponse<ProgressTracking[]>>(`${this.apiUrl}/progress`, { params })
      .pipe(
        catchError(error => {
          this.setError('Failed to load progress data');
          return throwError(error);
        })
      );
  }

  recordProgress(progress: Partial<ProgressTracking>): Observable<ProgressTracking> {
    return this.http.post<ProgressTracking>(`${this.apiUrl}/progress`, progress)
      .pipe(
        catchError(error => {
          this.setError('Failed to record progress');
          return throwError(error);
        })
      );
  }

  // Education Methods
  getEducationTopics(filters?: EducationFilters, pagination?: PaginationParams): Observable<ApiResponse<CreditEducationTopic[]>> {
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
      if (filters.level) params = params.set('level', filters.level);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.tags) {
        filters.tags.forEach(tag => {
          params = params.append('tags', tag);
        });
      }
    }
    
    return this.http.get<ApiResponse<CreditEducationTopic[]>>(`${this.apiUrl}/education`, { params })
      .pipe(
        catchError(error => {
          this.setError('Failed to load education topics');
          return throwError(error);
        })
      );
  }

  getEducationTopic(id: string): Observable<CreditEducationTopic> {
    return this.http.get<CreditEducationTopic>(`${this.apiUrl}/education/${id}`)
      .pipe(
        catchError(error => {
          this.setError('Failed to load education topic');
          return throwError(error);
        })
      );
  }

  // Tools Methods
  getTools(filters?: ToolFilters, pagination?: PaginationParams): Observable<ApiResponse<CreditBuildingTool[]>> {
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
      if (filters.category) params = params.set('category', filters.category);
      if (filters.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());
    }
    
    return this.http.get<ApiResponse<CreditBuildingTool[]>>(`${this.apiUrl}/tools`, { params })
      .pipe(
        catchError(error => {
          this.setError('Failed to load tools');
          return throwError(error);
        })
      );
  }

  getTool(id: string): Observable<CreditBuildingTool> {
    return this.http.get<CreditBuildingTool>(`${this.apiUrl}/tools/${id}`)
      .pipe(
        catchError(error => {
          this.setError('Failed to load tool');
          return throwError(error);
        })
      );
  }

  useTool(id: string, inputs: Record<string, any>): Observable<Record<string, any>> {
    return this.http.post<Record<string, any>>(`${this.apiUrl}/tools/${id}/use`, { inputs })
      .pipe(
        catchError(error => {
          this.setError('Failed to use tool');
          return throwError(error);
        })
      );
  }

  // Reports Methods
  getReports(clientId?: string, type?: string): Observable<CreditBuildingReport[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId);
    if (type) params = params.set('type', type);
    
    return this.http.get<CreditBuildingReport[]>(`${this.apiUrl}/reports`, { params })
      .pipe(
        catchError(error => {
          this.setError('Failed to load reports');
          return throwError(error);
        })
      );
  }

  getReport(id: string): Observable<CreditBuildingReport> {
    return this.http.get<CreditBuildingReport>(`${this.apiUrl}/reports/${id}`)
      .pipe(
        catchError(error => {
          this.setError('Failed to load report');
          return throwError(error);
        })
      );
  }

  generateReport(clientId: string, type: string, options?: any): Observable<CreditBuildingReport> {
    return this.http.post<CreditBuildingReport>(`${this.apiUrl}/reports/generate`, {
      clientId,
      type,
      options
    })
      .pipe(
        catchError(error => {
          this.setError('Failed to generate report');
          return throwError(error);
        })
      );
  }

  // Analytics Methods
  getAnalytics(dateRange?: { start: Date; end: Date }): Observable<CreditBuildingAnalytics> {
    let params = new HttpParams();
    if (dateRange) {
      params = params.set('startDate', dateRange.start.toISOString())
                    .set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<CreditBuildingAnalytics>(`${this.apiUrl}/analytics`, { params })
      .pipe(
        catchError(error => {
          this.setError('Failed to load analytics');
          return throwError(error);
        })
      );
  }

  // Export Methods
  exportStrategies(request: ExportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/strategies/export`, request, {
      responseType: 'blob'
    })
      .pipe(
        catchError(error => {
          this.setError('Failed to export strategies');
          return throwError(error);
        })
      );
  }

  exportRecommendations(request: ExportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/recommendations/export`, request, {
      responseType: 'blob'
    })
      .pipe(
        catchError(error => {
          this.setError('Failed to export recommendations');
          return throwError(error);
        })
      );
  }

  exportGoals(request: ExportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/goals/export`, request, {
      responseType: 'blob'
    })
      .pipe(
        catchError(error => {
          this.setError('Failed to export goals');
          return throwError(error);
        })
      );
  }

  exportProgress(request: ExportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/progress/export`, request, {
      responseType: 'blob'
    })
      .pipe(
        catchError(error => {
          this.setError('Failed to export progress data');
          return throwError(error);
        })
      );
  }

  // File Upload Methods
  uploadFile(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return this.http.post(`${this.apiUrl}/upload`, formData)
      .pipe(
        catchError(error => {
          this.setError('Failed to upload file');
          return throwError(error);
        })
      );
  }

  // Utility Methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  // Cache Management
  clearCache(): void {
    this.strategiesSubject.next([]);
    this.recommendationsSubject.next([]);
    this.goalsSubject.next([]);
    this.clearError();
  }

  refreshData(): void {
    this.getStrategies().subscribe();
    this.getRecommendations().subscribe();
    this.getGoals().subscribe();
  }
}