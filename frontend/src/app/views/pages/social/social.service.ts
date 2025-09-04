import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, interval } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  SocialPost,
  SocialAccount,
  CommunityForum,
  CommunityGroup,
  SharingTemplate,
  SharingCampaign,
  SocialAnalytics,
  SocialFilter,
  SocialSearchParams,
  PaginatedResponse,
  PostStatus,
  AccountStatus,
  CampaignStatus,
  SocialPlatform,
  PostType,
  EngagementType,
  EventStatus,
  CommunityRole,
  ContentCategory,
  AnalyticsOverview,
  EngagementAnalytics,
  ReachAnalytics,
  AudienceAnalytics,
  ContentAnalytics,
  CompetitorAnalytics,
  TrendAnalytics,
  AnalyticsReport,
  MediaAttachment,
  PostEngagement,
  PostAnalytics,
  AccountAnalytics,
  ForumTopic,
  GroupEvent,
  GroupMember,
  CampaignAnalytics,
  TemplateUsage,
  DateRange
} from './social.model';

@Injectable({
  providedIn: 'root'
})
export class SocialService {
  private readonly apiUrl = `${environment.apiUrl}/social`;
  private readonly wsUrl = environment.wsUrl;
  
  // Real-time updates
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Subjects for real-time updates
  private newPostSubject = new Subject<SocialPost>();
  private postUpdateSubject = new Subject<SocialPost>();
  private engagementUpdateSubject = new Subject<PostEngagement>();
  private accountUpdateSubject = new Subject<SocialAccount>();
  private campaignUpdateSubject = new Subject<SharingCampaign>();
  private analyticsUpdateSubject = new Subject<any>();
  
  // State management
  private postsSubject = new BehaviorSubject<SocialPost[]>([]);
  private accountsSubject = new BehaviorSubject<SocialAccount[]>([]);
  private campaignsSubject = new BehaviorSubject<SharingCampaign[]>([]);
  private templatesSubject = new BehaviorSubject<SharingTemplate[]>([]);
  private forumsSubject = new BehaviorSubject<CommunityForum[]>([]);
  private groupsSubject = new BehaviorSubject<CommunityGroup[]>([]);
  
  // Public observables
  public posts$ = this.postsSubject.asObservable();
  public accounts$ = this.accountsSubject.asObservable();
  public campaigns$ = this.campaignsSubject.asObservable();
  public templates$ = this.templatesSubject.asObservable();
  public forums$ = this.forumsSubject.asObservable();
  public groups$ = this.groupsSubject.asObservable();
  
  public newPost$ = this.newPostSubject.asObservable();
  public postUpdate$ = this.postUpdateSubject.asObservable();
  public engagementUpdate$ = this.engagementUpdateSubject.asObservable();
  public accountUpdate$ = this.accountUpdateSubject.asObservable();
  public campaignUpdate$ = this.campaignUpdateSubject.asObservable();
  public analyticsUpdate$ = this.analyticsUpdateSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.initializeWebSocket();
    this.startPeriodicUpdates();
  }
  
  // WebSocket connection management
  private initializeWebSocket(): void {
    if (this.wsUrl) {
      this.connectWebSocket();
    }
  }
  
  private connectWebSocket(): void {
    try {
      this.socket = new WebSocket(`${this.wsUrl}/social`);
      
      this.socket.onopen = () => {
        console.log('Social WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('Social WebSocket disconnected');
        this.handleReconnect();
      };
      
      this.socket.onerror = (error) => {
        console.error('Social WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.handleReconnect();
    }
  }
  
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'new_post':
        this.newPostSubject.next(data.post);
        this.updatePostsState(data.post);
        break;
      case 'post_update':
        this.postUpdateSubject.next(data.post);
        this.updatePostsState(data.post);
        break;
      case 'engagement_update':
        this.engagementUpdateSubject.next(data.engagement);
        break;
      case 'account_update':
        this.accountUpdateSubject.next(data.account);
        this.updateAccountsState(data.account);
        break;
      case 'campaign_update':
        this.campaignUpdateSubject.next(data.campaign);
        this.updateCampaignsState(data.campaign);
        break;
      case 'analytics_update':
        this.analyticsUpdateSubject.next(data.analytics);
        break;
    }
  }
  
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connectWebSocket();
      }, delay);
    }
  }
  
  private startPeriodicUpdates(): void {
    // Update analytics every 5 minutes
    interval(300000).pipe(
      switchMap(() => this.getAnalyticsOverview())
    ).subscribe(analytics => {
      this.analyticsUpdateSubject.next(analytics);
    });
  }
  
  // State update helpers
  private updatePostsState(post: SocialPost): void {
    const currentPosts = this.postsSubject.value;
    const index = currentPosts.findIndex(p => p.id === post.id);
    
    if (index >= 0) {
      currentPosts[index] = post;
    } else {
      currentPosts.unshift(post);
    }
    
    this.postsSubject.next([...currentPosts]);
  }
  
  private updateAccountsState(account: SocialAccount): void {
    const currentAccounts = this.accountsSubject.value;
    const index = currentAccounts.findIndex(a => a.id === account.id);
    
    if (index >= 0) {
      currentAccounts[index] = account;
    } else {
      currentAccounts.push(account);
    }
    
    this.accountsSubject.next([...currentAccounts]);
  }
  
  private updateCampaignsState(campaign: SharingCampaign): void {
    const currentCampaigns = this.campaignsSubject.value;
    const index = currentCampaigns.findIndex(c => c.id === campaign.id);
    
    if (index >= 0) {
      currentCampaigns[index] = campaign;
    } else {
      currentCampaigns.push(campaign);
    }
    
    this.campaignsSubject.next([...currentCampaigns]);
  }
  
  // Posts API methods
  getPosts(filter?: SocialFilter): Observable<PaginatedResponse<SocialPost>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.platform) params = params.set('platform', filter.platform);
      if (filter.type) params = params.set('type', filter.type);
      if (filter.accountId) params = params.set('accountId', filter.accountId);
      if (filter.dateRange?.start) params = params.set('startDate', filter.dateRange.start.toISOString());
      if (filter.dateRange?.end) params = params.set('endDate', filter.dateRange.end.toISOString());
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortOrder) params = params.set('sortOrder', filter.sortOrder);
    }
    
    return this.http.get<PaginatedResponse<SocialPost>>(`${this.apiUrl}/posts`, { params })
      .pipe(
        tap(response => {
          this.postsSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }
  
  getPost(id: string): Observable<SocialPost> {
    return this.http.get<SocialPost>(`${this.apiUrl}/posts/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  createPost(post: Partial<SocialPost>): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.apiUrl}/posts`, post)
      .pipe(
        tap(newPost => {
          this.updatePostsState(newPost);
        }),
        catchError(this.handleError)
      );
  }
  
  updatePost(id: string, updates: Partial<SocialPost>): Observable<SocialPost> {
    return this.http.put<SocialPost>(`${this.apiUrl}/posts/${id}`, updates)
      .pipe(
        tap(updatedPost => {
          this.updatePostsState(updatedPost);
        }),
        catchError(this.handleError)
      );
  }
  
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`)
      .pipe(
        tap(() => {
          const currentPosts = this.postsSubject.value.filter(p => p.id !== id);
          this.postsSubject.next(currentPosts);
        }),
        catchError(this.handleError)
      );
  }
  
  publishPost(id: string): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.apiUrl}/posts/${id}/publish`, {})
      .pipe(
        tap(publishedPost => {
          this.updatePostsState(publishedPost);
        }),
        catchError(this.handleError)
      );
  }
  
  schedulePost(id: string, scheduledTime: Date): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.apiUrl}/posts/${id}/schedule`, {
      scheduledTime: scheduledTime.toISOString()
    })
      .pipe(
        tap(scheduledPost => {
          this.updatePostsState(scheduledPost);
        }),
        catchError(this.handleError)
      );
  }
  
  duplicatePost(id: string): Observable<SocialPost> {
    return this.http.post<SocialPost>(`${this.apiUrl}/posts/${id}/duplicate`, {})
      .pipe(
        tap(duplicatedPost => {
          this.updatePostsState(duplicatedPost);
        }),
        catchError(this.handleError)
      );
  }
  
  getPostAnalytics(id: string): Observable<PostAnalytics> {
    return this.http.get<PostAnalytics>(`${this.apiUrl}/posts/${id}/analytics`)
      .pipe(catchError(this.handleError));
  }
  
  getPostEngagement(id: string): Observable<PostEngagement[]> {
    return this.http.get<PostEngagement[]>(`${this.apiUrl}/posts/${id}/engagement`)
      .pipe(catchError(this.handleError));
  }
  
  // Accounts API methods
  getAccounts(filter?: SocialFilter): Observable<PaginatedResponse<SocialAccount>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.platform) params = params.set('platform', filter.platform);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }
    
    return this.http.get<PaginatedResponse<SocialAccount>>(`${this.apiUrl}/accounts`, { params })
      .pipe(
        tap(response => {
          this.accountsSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }
  
  getAccount(id: string): Observable<SocialAccount> {
    return this.http.get<SocialAccount>(`${this.apiUrl}/accounts/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  connectAccount(platform: SocialPlatform, credentials: any): Observable<SocialAccount> {
    return this.http.post<SocialAccount>(`${this.apiUrl}/accounts/connect`, {
      platform,
      credentials
    })
      .pipe(
        tap(newAccount => {
          this.updateAccountsState(newAccount);
        }),
        catchError(this.handleError)
      );
  }
  
  updateAccount(id: string, updates: Partial<SocialAccount>): Observable<SocialAccount> {
    return this.http.put<SocialAccount>(`${this.apiUrl}/accounts/${id}`, updates)
      .pipe(
        tap(updatedAccount => {
          this.updateAccountsState(updatedAccount);
        }),
        catchError(this.handleError)
      );
  }
  
  disconnectAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/accounts/${id}`)
      .pipe(
        tap(() => {
          const currentAccounts = this.accountsSubject.value.filter(a => a.id !== id);
          this.accountsSubject.next(currentAccounts);
        }),
        catchError(this.handleError)
      );
  }
  
  refreshAccount(id: string): Observable<SocialAccount> {
    return this.http.post<SocialAccount>(`${this.apiUrl}/accounts/${id}/refresh`, {})
      .pipe(
        tap(refreshedAccount => {
          this.updateAccountsState(refreshedAccount);
        }),
        catchError(this.handleError)
      );
  }
  
  getAccountAnalytics(id: string, dateRange?: DateRange): Observable<AccountAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<AccountAnalytics>(`${this.apiUrl}/accounts/${id}/analytics`, { params })
      .pipe(catchError(this.handleError));
  }
  
  // Community API methods
  getForums(filter?: SocialFilter): Observable<PaginatedResponse<CommunityForum>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
      if (filter.search) params = params.set('search', filter.search);
    }
    
    return this.http.get<PaginatedResponse<CommunityForum>>(`${this.apiUrl}/community/forums`, { params })
      .pipe(
        tap(response => {
          this.forumsSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }
  
  getForum(id: string): Observable<CommunityForum> {
    return this.http.get<CommunityForum>(`${this.apiUrl}/community/forums/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  createForum(forum: Partial<CommunityForum>): Observable<CommunityForum> {
    return this.http.post<CommunityForum>(`${this.apiUrl}/community/forums`, forum)
      .pipe(catchError(this.handleError));
  }
  
  getForumTopics(forumId: string, filter?: SocialFilter): Observable<PaginatedResponse<ForumTopic>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }
    
    return this.http.get<PaginatedResponse<ForumTopic>>(`${this.apiUrl}/community/forums/${forumId}/topics`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getGroups(filter?: SocialFilter): Observable<PaginatedResponse<CommunityGroup>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
      if (filter.search) params = params.set('search', filter.search);
    }
    
    return this.http.get<PaginatedResponse<CommunityGroup>>(`${this.apiUrl}/community/groups`, { params })
      .pipe(
        tap(response => {
          this.groupsSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }
  
  getGroup(id: string): Observable<CommunityGroup> {
    return this.http.get<CommunityGroup>(`${this.apiUrl}/community/groups/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  createGroup(group: Partial<CommunityGroup>): Observable<CommunityGroup> {
    return this.http.post<CommunityGroup>(`${this.apiUrl}/community/groups`, group)
      .pipe(catchError(this.handleError));
  }
  
  joinGroup(groupId: string): Observable<GroupMember> {
    return this.http.post<GroupMember>(`${this.apiUrl}/community/groups/${groupId}/join`, {})
      .pipe(catchError(this.handleError));
  }
  
  leaveGroup(groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/community/groups/${groupId}/leave`)
      .pipe(catchError(this.handleError));
  }
  
  getGroupEvents(groupId: string, filter?: SocialFilter): Observable<PaginatedResponse<GroupEvent>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
    }
    
    return this.http.get<PaginatedResponse<GroupEvent>>(`${this.apiUrl}/community/groups/${groupId}/events`, { params })
      .pipe(catchError(this.handleError));
  }
  
  // Templates API methods
  getTemplates(filter?: SocialFilter): Observable<PaginatedResponse<SharingTemplate>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.category) params = params.set('category', filter.category);
      if (filter.platform) params = params.set('platform', filter.platform);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
      if (filter.search) params = params.set('search', filter.search);
    }
    
    return this.http.get<PaginatedResponse<SharingTemplate>>(`${this.apiUrl}/sharing/templates`, { params })
      .pipe(
        tap(response => {
          this.templatesSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }
  
  getTemplate(id: string): Observable<SharingTemplate> {
    return this.http.get<SharingTemplate>(`${this.apiUrl}/sharing/templates/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  createTemplate(template: Partial<SharingTemplate>): Observable<SharingTemplate> {
    return this.http.post<SharingTemplate>(`${this.apiUrl}/sharing/templates`, template)
      .pipe(catchError(this.handleError));
  }
  
  updateTemplate(id: string, updates: Partial<SharingTemplate>): Observable<SharingTemplate> {
    return this.http.put<SharingTemplate>(`${this.apiUrl}/sharing/templates/${id}`, updates)
      .pipe(catchError(this.handleError));
  }
  
  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sharing/templates/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  duplicateTemplate(id: string): Observable<SharingTemplate> {
    return this.http.post<SharingTemplate>(`${this.apiUrl}/sharing/templates/${id}/duplicate`, {})
      .pipe(catchError(this.handleError));
  }
  
  getTemplateUsage(id: string): Observable<TemplateUsage> {
    return this.http.get<TemplateUsage>(`${this.apiUrl}/sharing/templates/${id}/usage`)
      .pipe(catchError(this.handleError));
  }
  
  // Campaigns API methods
  getCampaigns(filter?: SocialFilter): Observable<PaginatedResponse<SharingCampaign>> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.platform) params = params.set('platform', filter.platform);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.limit) params = params.set('limit', filter.limit.toString());
      if (filter.search) params = params.set('search', filter.search);
    }
    
    return this.http.get<PaginatedResponse<SharingCampaign>>(`${this.apiUrl}/sharing/campaigns`, { params })
      .pipe(
        tap(response => {
          this.campaignsSubject.next(response.data);
        }),
        catchError(this.handleError)
      );
  }
  
  getCampaign(id: string): Observable<SharingCampaign> {
    return this.http.get<SharingCampaign>(`${this.apiUrl}/sharing/campaigns/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  createCampaign(campaign: Partial<SharingCampaign>): Observable<SharingCampaign> {
    return this.http.post<SharingCampaign>(`${this.apiUrl}/sharing/campaigns`, campaign)
      .pipe(
        tap(newCampaign => {
          this.updateCampaignsState(newCampaign);
        }),
        catchError(this.handleError)
      );
  }
  
  updateCampaign(id: string, updates: Partial<SharingCampaign>): Observable<SharingCampaign> {
    return this.http.put<SharingCampaign>(`${this.apiUrl}/sharing/campaigns/${id}`, updates)
      .pipe(
        tap(updatedCampaign => {
          this.updateCampaignsState(updatedCampaign);
        }),
        catchError(this.handleError)
      );
  }
  
  deleteCampaign(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sharing/campaigns/${id}`)
      .pipe(
        tap(() => {
          const currentCampaigns = this.campaignsSubject.value.filter(c => c.id !== id);
          this.campaignsSubject.next(currentCampaigns);
        }),
        catchError(this.handleError)
      );
  }
  
  startCampaign(id: string): Observable<SharingCampaign> {
    return this.http.post<SharingCampaign>(`${this.apiUrl}/sharing/campaigns/${id}/start`, {})
      .pipe(
        tap(startedCampaign => {
          this.updateCampaignsState(startedCampaign);
        }),
        catchError(this.handleError)
      );
  }
  
  pauseCampaign(id: string): Observable<SharingCampaign> {
    return this.http.post<SharingCampaign>(`${this.apiUrl}/sharing/campaigns/${id}/pause`, {})
      .pipe(
        tap(pausedCampaign => {
          this.updateCampaignsState(pausedCampaign);
        }),
        catchError(this.handleError)
      );
  }
  
  stopCampaign(id: string): Observable<SharingCampaign> {
    return this.http.post<SharingCampaign>(`${this.apiUrl}/sharing/campaigns/${id}/stop`, {})
      .pipe(
        tap(stoppedCampaign => {
          this.updateCampaignsState(stoppedCampaign);
        }),
        catchError(this.handleError)
      );
  }
  
  getCampaignAnalytics(id: string): Observable<CampaignAnalytics> {
    return this.http.get<CampaignAnalytics>(`${this.apiUrl}/sharing/campaigns/${id}/analytics`)
      .pipe(catchError(this.handleError));
  }
  
  // Analytics API methods
  getAnalyticsOverview(dateRange?: DateRange): Observable<AnalyticsOverview> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<AnalyticsOverview>(`${this.apiUrl}/analytics/overview`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getEngagementAnalytics(dateRange?: DateRange): Observable<EngagementAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<EngagementAnalytics>(`${this.apiUrl}/analytics/engagement`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getReachAnalytics(dateRange?: DateRange): Observable<ReachAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<ReachAnalytics>(`${this.apiUrl}/analytics/reach`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getAudienceAnalytics(dateRange?: DateRange): Observable<AudienceAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<AudienceAnalytics>(`${this.apiUrl}/analytics/audience`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getContentAnalytics(dateRange?: DateRange): Observable<ContentAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<ContentAnalytics>(`${this.apiUrl}/analytics/content`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getCompetitorAnalytics(dateRange?: DateRange): Observable<CompetitorAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<CompetitorAnalytics>(`${this.apiUrl}/analytics/competitor`, { params })
      .pipe(catchError(this.handleError));
  }
  
  getTrendAnalytics(dateRange?: DateRange): Observable<TrendAnalytics> {
    let params = new HttpParams();
    
    if (dateRange) {
      if (dateRange.start) params = params.set('startDate', dateRange.start.toISOString());
      if (dateRange.end) params = params.set('endDate', dateRange.end.toISOString());
    }
    
    return this.http.get<TrendAnalytics>(`${this.apiUrl}/analytics/trends`, { params })
      .pipe(catchError(this.handleError));
  }
  
  generateAnalyticsReport(config: Partial<AnalyticsReport>): Observable<AnalyticsReport> {
    return this.http.post<AnalyticsReport>(`${this.apiUrl}/analytics/reports`, config)
      .pipe(catchError(this.handleError));
  }
  
  exportAnalytics(format: 'csv' | 'xlsx' | 'pdf', config: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/analytics/export`, {
      format,
      config
    }, {
      responseType: 'blob'
    })
      .pipe(catchError(this.handleError));
  }
  
  // Media upload methods
  uploadMedia(file: File): Observable<MediaAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<MediaAttachment>(`${this.apiUrl}/media/upload`, formData)
      .pipe(catchError(this.handleError));
  }
  
  deleteMedia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/media/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  // Search methods
  searchPosts(params: SocialSearchParams): Observable<PaginatedResponse<SocialPost>> {
    let httpParams = new HttpParams();
    
    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.platform) httpParams = httpParams.set('platform', params.platform);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.dateRange?.start) httpParams = httpParams.set('startDate', params.dateRange.start.toISOString());
    if (params.dateRange?.end) httpParams = httpParams.set('endDate', params.dateRange.end.toISOString());
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    
    return this.http.get<PaginatedResponse<SocialPost>>(`${this.apiUrl}/search/posts`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }
  
  searchAccounts(params: SocialSearchParams): Observable<PaginatedResponse<SocialAccount>> {
    let httpParams = new HttpParams();
    
    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.platform) httpParams = httpParams.set('platform', params.platform);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    
    return this.http.get<PaginatedResponse<SocialAccount>>(`${this.apiUrl}/search/accounts`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }
  
  // Utility methods
  getUnreadCounts(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/unread-counts`)
      .pipe(catchError(this.handleError));
  }
  
  markAsRead(type: string, ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-read`, { type, ids })
      .pipe(catchError(this.handleError));
  }
  
  getOptimalPostingTimes(accountId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/accounts/${accountId}/optimal-times`)
      .pipe(catchError(this.handleError));
  }
  
  validateTemplate(template: Partial<SharingTemplate>): Observable<{ valid: boolean; errors: string[] }> {
    return this.http.post<{ valid: boolean; errors: string[] }>(`${this.apiUrl}/sharing/templates/validate`, template)
      .pipe(catchError(this.handleError));
  }
  
  previewTemplate(templateId: string, variables: { [key: string]: any }): Observable<{ preview: string }> {
    return this.http.post<{ preview: string }>(`${this.apiUrl}/sharing/templates/${templateId}/preview`, { variables })
      .pipe(catchError(this.handleError));
  }
  
  // Error handling
  private handleError = (error: any): Observable<never> => {
    console.error('Social service error:', error);
    throw error;
  };
  
  // Cleanup
  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.close();
    }
    
    this.newPostSubject.complete();
    this.postUpdateSubject.complete();
    this.engagementUpdateSubject.complete();
    this.accountUpdateSubject.complete();
    this.campaignUpdateSubject.complete();
    this.analyticsUpdateSubject.complete();
    
    this.postsSubject.complete();
    this.accountsSubject.complete();
    this.campaignsSubject.complete();
    this.templatesSubject.complete();
    this.forumsSubject.complete();
    this.groupsSubject.complete();
  }
}