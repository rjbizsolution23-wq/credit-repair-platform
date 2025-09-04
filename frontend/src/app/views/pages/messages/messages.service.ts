import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Message,
  MessageThread,
  MessageTemplate,
  Notification,
  NotificationSettings,
  MessageCampaign,
  BulkMessage,
  MessageAnalytics,
  MessageFilter,
  MessageSearchParams,
  PaginatedResponse,
  MessageType,
  MessageStatus,
  CampaignStatus,
  NotificationStatus,
  BulkRecipient
} from './messages.model';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private readonly apiUrl = `${environment.apiUrl}/messages`;
  
  // Subjects for real-time updates
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private newMessageSubject = new Subject<Message>();
  private newNotificationSubject = new Subject<Notification>();

  // Observables
  public messages$ = this.messagesSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public newMessage$ = this.newMessageSubject.asObservable();
  public newNotification$ = this.newNotificationSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeWebSocket();
  }

  // Message CRUD Operations
  getMessages(params?: MessageSearchParams): Observable<PaginatedResponse<Message>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.query) httpParams = httpParams.set('query', params.query);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      
      if (params.filter) {
        if (params.filter.type) httpParams = httpParams.set('type', params.filter.type.join(','));
        if (params.filter.status) httpParams = httpParams.set('status', params.filter.status.join(','));
        if (params.filter.priority) httpParams = httpParams.set('priority', params.filter.priority.join(','));
        if (params.filter.senderId) httpParams = httpParams.set('senderId', params.filter.senderId);
        if (params.filter.recipientId) httpParams = httpParams.set('recipientId', params.filter.recipientId);
        if (params.filter.threadId) httpParams = httpParams.set('threadId', params.filter.threadId);
        if (params.filter.campaignId) httpParams = httpParams.set('campaignId', params.filter.campaignId);
        if (params.filter.tags) httpParams = httpParams.set('tags', params.filter.tags.join(','));
        if (params.filter.hasAttachments !== undefined) httpParams = httpParams.set('hasAttachments', params.filter.hasAttachments.toString());
        if (params.filter.isRead !== undefined) httpParams = httpParams.set('isRead', params.filter.isRead.toString());
        if (params.filter.dateRange) {
          httpParams = httpParams.set('startDate', params.filter.dateRange.start.toISOString());
          httpParams = httpParams.set('endDate', params.filter.dateRange.end.toISOString());
        }
      }
    }

    return this.http.get<PaginatedResponse<Message>>(`${this.apiUrl}`, { params: httpParams })
      .pipe(
        tap(response => {
          if (params?.page === 1 || !params?.page) {
            this.messagesSubject.next(response.data);
          }
        })
      );
  }

  getMessage(id: string): Observable<Message> {
    return this.http.get<Message>(`${this.apiUrl}/${id}`);
  }

  createMessage(message: Partial<Message>): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}`, message)
      .pipe(
        tap(newMessage => {
          this.newMessageSubject.next(newMessage);
          this.updateMessagesCache(newMessage);
        })
      );
  }

  updateMessage(id: string, updates: Partial<Message>): Observable<Message> {
    return this.http.put<Message>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        tap(updatedMessage => {
          this.updateMessagesCache(updatedMessage);
        })
      );
  }

  deleteMessage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.removeFromMessagesCache(id);
        })
      );
  }

  deleteMessages(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bulk`, { body: { ids } })
      .pipe(
        tap(() => {
          ids.forEach(id => this.removeFromMessagesCache(id));
        })
      );
  }

  // Draft Management Methods
  duplicateDrafts(draftIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/drafts/duplicate`, { draftIds });
  }

  deleteDrafts(draftIds: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/drafts/bulk`, { body: { draftIds } });
  }

  sendDrafts(draftIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/drafts/send`, { draftIds });
  }

  updateDraft(draftId: string, draftData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/drafts/${draftId}`, draftData);
  }

  saveDraft(draftData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/drafts`, draftData);
  }

  getDraft(draftId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/drafts/${draftId}`);
  }

  getContacts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/contacts`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, settings);
  }

  resetSettings(): Observable<any> {
    return this.http.post(`${this.apiUrl}/settings/reset`, {});
  }

  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`);
  }

  getDrafts(page: number = 1, pageSize: number = 10): Observable<any> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get(`${this.apiUrl}/drafts`, { params });
  }

  // Message Actions
  sendMessage(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/send`, {})
      .pipe(
        tap(sentMessage => {
          this.updateMessagesCache(sentMessage);
        })
      );
  }

  resendMessages(messageIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend`, { messageIds });
  }

  getSentMessages(page: number = 1, pageSize: number = 10): Observable<any> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get(`${this.apiUrl}/sent`, { params });
  }

  markAsRead(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/read`, {})
      .pipe(
        tap(readMessage => {
          this.updateMessagesCache(readMessage);
          this.updateUnreadCount();
        })
      );
  }

  markAsUnread(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/unread`, {})
      .pipe(
        tap(unreadMessage => {
          this.updateMessagesCache(unreadMessage);
          this.updateUnreadCount();
        })
      );
  }

  archiveMessage(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/archive`, {});
  }

  unarchiveMessage(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/unarchive`, {});
  }

  starMessage(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/star`, {})
      .pipe(
        tap(starredMessage => {
          this.updateMessagesCache(starredMessage);
        })
      );
  }

  flagMessage(id: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${id}/flag`, {})
      .pipe(
        tap(flaggedMessage => {
          this.updateMessagesCache(flaggedMessage);
        })
      );
  }

  sendReply(threadId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/threads/${threadId}/reply`, { content })
      .pipe(
        tap(newMessage => {
          this.newMessageSubject.next(newMessage);
          this.updateMessagesCache(newMessage);
        })
      );
  }

  toggleThreadMute(threadId: string): Observable<MessageThread> {
    return this.http.post<MessageThread>(`${this.apiUrl}/threads/${threadId}/toggle-mute`, {});
  }

  archiveThread(threadId: string): Observable<MessageThread> {
    return this.http.post<MessageThread>(`${this.apiUrl}/threads/${threadId}/archive`, {});
  }

  markThreadAsRead(threadId: string): Observable<MessageThread> {
    return this.http.post<MessageThread>(`${this.apiUrl}/threads/${threadId}/read`, {});
  }

  markAllMessagesAsRead(threadId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/threads/${threadId}/read-all`, {});
  }

  // Thread Operations
  getThreads(params?: any): Observable<PaginatedResponse<MessageThread>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<MessageThread>>(`${this.apiUrl}/threads`, { params: httpParams });
  }

  getThread(id: string): Observable<MessageThread> {
    return this.http.get<MessageThread>(`${this.apiUrl}/threads/${id}`);
  }

  getThreadMessages(threadId: string, params?: any): Observable<PaginatedResponse<Message>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<Message>>(`${this.apiUrl}/threads/${threadId}/messages`, { params: httpParams });
  }

  // Template Operations
  getTemplates(params?: any): Observable<PaginatedResponse<MessageTemplate>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<MessageTemplate>>(`${this.apiUrl}/templates`, { params: httpParams });
  }

  getTemplate(id: string): Observable<MessageTemplate> {
    return this.http.get<MessageTemplate>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(template: Partial<MessageTemplate>): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: string, updates: Partial<MessageTemplate>): Observable<MessageTemplate> {
    return this.http.put<MessageTemplate>(`${this.apiUrl}/templates/${id}`, updates);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  duplicateTemplate(id: string, name: string): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(`${this.apiUrl}/templates/${id}/duplicate`, { name });
  }

  bulkExportTemplates(templateIds: string[]): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/templates/bulk-export`, { templateIds }, { responseType: 'blob' });
  }

  bulkDeleteTemplates(templateIds: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/bulk-delete`, { body: { templateIds } });
  }

  exportTemplate(templateId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/templates/${templateId}/export`, {
      responseType: 'blob'
    });
  }

  updateTemplateStatus(templateId: string, status: string): Observable<MessageTemplate> {
    return this.http.post<MessageTemplate>(`${this.apiUrl}/templates/${templateId}/status`, {
      status
    });
  }

  bulkUpdateTemplateStatus(templateIds: string[], status: string): Observable<MessageTemplate[]> {
    return this.http.post<MessageTemplate[]>(`${this.apiUrl}/templates/bulk/status`, {
      templateIds,
      status
    });
  }

  // Notification Operations
  getNotifications(params?: any): Observable<PaginatedResponse<Notification>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<Notification>>(`${this.apiUrl}/notifications`, { params: httpParams })
      .pipe(
        tap(response => {
          if (params?.page === 1 || !params?.page) {
            this.notificationsSubject.next(response.data);
          }
        })
      );
  }

  getNotification(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/notifications/${id}`);
  }

  markNotificationAsRead(id: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications/${id}/read`, {})
      .pipe(
        tap(notification => {
          this.updateNotificationsCache(notification);
        })
      );
  }

  markAllNotificationsAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/read-all`, {})
      .pipe(
        tap(() => {
          const notifications = this.notificationsSubject.value.map(n => ({ ...n, isRead: true, status: NotificationStatus.READ }));
          this.notificationsSubject.next(notifications);
        })
      );
  }

  archiveNotification(id: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/notifications/${id}/archive`, {});
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notifications/${id}`)
      .pipe(
        tap(() => {
          this.removeFromNotificationsCache(id);
        })
      );
  }

  // Notification Settings
  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/notifications/settings`);
  }

  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${this.apiUrl}/notifications/settings`, settings);
  }

  sendTestNotification(type: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/notifications/test`, { type });
  }

  // Campaign Operations
  getCampaigns(params?: any): Observable<PaginatedResponse<MessageCampaign>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<MessageCampaign>>(`${this.apiUrl}/campaigns`, { params: httpParams });
  }

  exportCampaigns(): Observable<any> {
    return this.http.get(`${this.apiUrl}/campaigns/export`, { responseType: 'blob' });
  }

  getCampaign(id: string): Observable<MessageCampaign> {
    return this.http.get<MessageCampaign>(`${this.apiUrl}/campaigns/${id}`);
  }

  createCampaign(campaign: Partial<MessageCampaign>): Observable<MessageCampaign> {
    return this.http.post<MessageCampaign>(`${this.apiUrl}/campaigns`, campaign);
  }

  updateCampaign(id: string, updates: Partial<MessageCampaign>): Observable<MessageCampaign> {
    return this.http.put<MessageCampaign>(`${this.apiUrl}/campaigns/${id}`, updates);
  }

  updateCampaignStatus(id: string, status: string): Observable<MessageCampaign> {
    return this.http.put<MessageCampaign>(`${this.apiUrl}/campaigns/${id}/status`, { status });
  }

  deleteCampaign(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/campaigns/${id}`);
  }

  startCampaign(id: string): Observable<MessageCampaign> {
    return this.http.post<MessageCampaign>(`${this.apiUrl}/campaigns/${id}/start`, {});
  }

  pauseCampaign(id: string): Observable<MessageCampaign> {
    return this.http.post<MessageCampaign>(`${this.apiUrl}/campaigns/${id}/pause`, {});
  }

  resumeCampaign(id: string): Observable<MessageCampaign> {
    return this.http.post<MessageCampaign>(`${this.apiUrl}/campaigns/${id}/resume`, {});
  }

  stopCampaign(id: string): Observable<MessageCampaign> {
    return this.http.post<MessageCampaign>(`${this.apiUrl}/campaigns/${id}/stop`, {});
  }

  duplicateCampaign(id: string, name: string): Observable<MessageCampaign> {
    return this.http.post<MessageCampaign>(`${this.apiUrl}/campaigns/${id}/duplicate`, { name });
  }

  // Bulk Messaging
  createBulkMessage(bulkMessage: Partial<BulkMessage>): Observable<BulkMessage> {
    return this.http.post<BulkMessage>(`${this.apiUrl}/bulk`, bulkMessage);
  }

  getBulkMessages(params?: any): Observable<PaginatedResponse<BulkMessage>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<PaginatedResponse<BulkMessage>>(`${this.apiUrl}/bulk`, { params: httpParams });
  }

  getBulkMessage(id: string): Observable<BulkMessage> {
    return this.http.get<BulkMessage>(`${this.apiUrl}/bulk/${id}`);
  }

  startBulkMessage(id: string): Observable<BulkMessage> {
    return this.http.post<BulkMessage>(`${this.apiUrl}/bulk/${id}/start`, {});
  }

  pauseBulkMessage(id: string): Observable<BulkMessage> {
    return this.http.post<BulkMessage>(`${this.apiUrl}/bulk/${id}/pause`, {});
  }

  stopBulkMessage(id: string): Observable<BulkMessage> {
    return this.http.post<BulkMessage>(`${this.apiUrl}/bulk/${id}/stop`, {});
  }

  uploadRecipients(file: File): Observable<BulkRecipient[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BulkRecipient[]>(`${this.apiUrl}/bulk/upload-recipients`, formData);
  }

  // Analytics
  getAnalytics(params?: any): Observable<MessageAnalytics> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<MessageAnalytics>(`${this.apiUrl}/analytics`, { params: httpParams });
  }

  // File Operations
  uploadAttachment(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/attachments`, formData);
  }

  deleteAttachment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/attachments/${id}`);
  }

  // Export Operations
  exportMessages(filter?: MessageFilter, format: 'csv' | 'excel' | 'pdf' = 'csv'): Observable<Blob> {
    let httpParams = new HttpParams().set('format', format);
    
    if (filter) {
      if (filter.type) httpParams = httpParams.set('type', filter.type.join(','));
      if (filter.status) httpParams = httpParams.set('status', filter.status.join(','));
      if (filter.dateRange) {
        httpParams = httpParams.set('startDate', filter.dateRange.start.toISOString());
        httpParams = httpParams.set('endDate', filter.dateRange.end.toISOString());
      }
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  exportAnalytics(params?: any, format: 'csv' | 'excel' | 'pdf' = 'pdf'): Observable<Blob> {
    let httpParams = new HttpParams().set('format', format);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/analytics/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  // Utility Methods
  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`)
      .pipe(
        map(response => response.count),
        tap(count => this.unreadCountSubject.next(count))
      );
  }

  searchMessages(query: string, filters?: MessageFilter): Observable<Message[]> {
    let httpParams = new HttpParams().set('q', query);
    
    if (filters) {
      if (filters.type) httpParams = httpParams.set('type', filters.type.join(','));
      if (filters.status) httpParams = httpParams.set('status', filters.status.join(','));
    }

    return this.http.get<Message[]>(`${this.apiUrl}/search`, { params: httpParams });
  }

  validateTemplate(template: Partial<MessageTemplate>): Observable<{ valid: boolean; errors: string[] }> {
    return this.http.post<{ valid: boolean; errors: string[] }>(`${this.apiUrl}/templates/validate`, template);
  }

  previewTemplate(templateId: string, variables: Record<string, any>): Observable<{ subject: string; content: string; htmlContent?: string }> {
    return this.http.post<{ subject: string; content: string; htmlContent?: string }>(`${this.apiUrl}/templates/${templateId}/preview`, { variables });
  }

  // Private Methods
  private updateMessagesCache(message: Message): void {
    const messages = this.messagesSubject.value;
    const index = messages.findIndex(m => m.id === message.id);
    
    if (index >= 0) {
      messages[index] = message;
    } else {
      messages.unshift(message);
    }
    
    this.messagesSubject.next([...messages]);
  }

  private removeFromMessagesCache(id: string): void {
    const messages = this.messagesSubject.value.filter(m => m.id !== id);
    this.messagesSubject.next(messages);
  }

  private updateNotificationsCache(notification: Notification): void {
    const notifications = this.notificationsSubject.value;
    const index = notifications.findIndex(n => n.id === notification.id);
    
    if (index >= 0) {
      notifications[index] = notification;
    } else {
      notifications.unshift(notification);
    }
    
    this.notificationsSubject.next([...notifications]);
  }

  private removeFromNotificationsCache(id: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(notifications);
  }

  private updateUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }

  // Campaign Analytics Methods
  getCampaignMetrics(campaignId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/campaigns/${campaignId}/metrics`);
  }

  getCampaignActivity(campaignId: string, offset?: number): Observable<any> {
    let httpParams = new HttpParams();
    if (offset !== undefined) {
      httpParams = httpParams.set('offset', offset.toString());
    }
    return this.http.get(`${this.apiUrl}/campaigns/${campaignId}/activity`, { params: httpParams });
  }

  getCampaignTimeSeriesData(campaignId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/campaigns/${campaignId}/timeseries`);
  }

  // Bulk messaging methods (removed duplicate - using existing method at line 428)

  sendBulkMessage(messageId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-messages/${messageId}/send`, {});
  }

  deleteBulkMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bulk-messages/${messageId}`);
  }



  private initializeWebSocket(): void {
    // WebSocket implementation for real-time updates
    // This would connect to your WebSocket server for real-time message updates
    if (typeof WebSocket !== 'undefined') {
      const wsUrl = environment.wsUrl || environment.apiUrl.replace('http', 'ws');
      // const ws = new WebSocket(`${wsUrl}/messages/ws`);
      
      // ws.onmessage = (event) => {
      //   const data = JSON.parse(event.data);
      //   
      //   switch (data.type) {
      //     case 'new_message':
      //       this.newMessageSubject.next(data.message);
      //       this.updateMessagesCache(data.message);
      //       break;
      //     case 'message_updated':
      //       this.updateMessagesCache(data.message);
      //       break;
      //     case 'new_notification':
      //       this.newNotificationSubject.next(data.notification);
      //       this.updateNotificationsCache(data.notification);
      //       break;
      //     case 'unread_count_updated':
      //       this.unreadCountSubject.next(data.count);
      //       break;
      //   }
      // };
    }
  }
}