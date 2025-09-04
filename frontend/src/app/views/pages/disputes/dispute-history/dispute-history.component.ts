import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DisputesService } from '../disputes.service';
import { ClientService } from '../../../../core/services/client.service';
import { DisputeHistoryEntry, DisputeStatus, DisputePriority } from '../disputes.model';

interface FilterOptions {
  dateRange: string;
  status: string;
  priority: string;
  action: string;
  user: string;
  searchTerm: string;
}

@Component({
  selector: 'app-dispute-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dispute-history.component.html',
  styleUrls: ['./dispute-history.component.scss']
})
export class DisputeHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  historyEntries: DisputeHistoryEntry[] = [];
  filteredEntries: DisputeHistoryEntry[] = [];
  loading = true;
  error: string | null = null;
  
  // Make Math available in template
  Math = Math;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  filters: FilterOptions = {
    dateRange: 'all',
    status: 'all',
    priority: 'all',
    action: 'all',
    user: 'all',
    searchTerm: ''
  };
  
  // Filter Options
  dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];
  
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: DisputeStatus.DRAFT, label: 'Draft' },
    { value: DisputeStatus.SUBMITTED, label: 'Submitted' },
    { value: DisputeStatus.IN_PROGRESS, label: 'In Progress' },
    { value: DisputeStatus.UNDER_REVIEW, label: 'Under Review' },
    { value: DisputeStatus.RESOLVED, label: 'Resolved' },
    { value: DisputeStatus.REJECTED, label: 'Rejected' },
    { value: DisputeStatus.ESCALATED, label: 'Escalated' }
  ];
  
  priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: DisputePriority.LOW, label: 'Low' },
    { value: DisputePriority.MEDIUM, label: 'Medium' },
    { value: DisputePriority.HIGH, label: 'High' },
    { value: DisputePriority.URGENT, label: 'Urgent' }
  ];
  
  actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'status_changed', label: 'Status Changed' },
    { value: 'priority_changed', label: 'Priority Changed' },
    { value: 'letter_generated', label: 'Letter Generated' },
    { value: 'letter_sent', label: 'Letter Sent' },
    { value: 'response_received', label: 'Response Received' },
    { value: 'item_added', label: 'Item Added' },
    { value: 'item_removed', label: 'Item Removed' },
    { value: 'note_added', label: 'Note Added' },
    { value: 'deleted', label: 'Deleted' }
  ];
  
  userOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Users' }
  ];
  
  // UI State
  showFilters = false;
  selectedEntries: string[] = [];
  
  // Enums for template
  DisputeStatus = DisputeStatus;
  DisputePriority = DisputePriority;
  
  constructor(
    private disputesService: DisputesService,
    private clientService: ClientService
  ) {}
  
  ngOnInit(): void {
    this.setupSearch();
    this.loadHistory();
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filters.searchTerm = searchTerm;
        this.applyFilters();
      });
  }
  
  loadHistory(): void {
    this.loading = true;
    this.error = null;
    
    this.disputesService.getDisputeHistory({
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...this.filters
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.historyEntries = response.data;
          this.totalItems = response.total;
          this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          this.applyFilters();
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load dispute history';
          this.loading = false;
          console.error('Error loading history:', error);
        }
      });
  }
  
  loadUsers(): void {
    this.clientService.getAllClients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: any) => {
          this.userOptions = [
            { value: 'all', label: 'All Users' },
            ...users.map((user: any) => ({ value: user.id, label: user.name }))
          ];
        },
        error: (error: any) => {
          console.error('Error loading users:', error);
        }
      });
  }
  
  // Search and Filter Methods
  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }
  
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadHistory();
  }
  
  applyFilters(): void {
    let filtered = [...this.historyEntries];
    
    // Apply search filter
    if (this.filters.searchTerm) {
      const searchLower = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.action.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.disputeReferenceNumber?.toLowerCase().includes(searchLower) ||
        entry.clientName?.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredEntries = filtered;
  }
  
  clearFilters(): void {
    this.filters = {
      dateRange: 'all',
      status: 'all',
      priority: 'all',
      action: 'all',
      user: 'all',
      searchTerm: ''
    };
    this.currentPage = 1;
    this.loadHistory();
  }
  
  // Pagination Methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHistory();
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }
  
  // Selection Methods
  toggleSelection(entryId: string): void {
    const index = this.selectedEntries.indexOf(entryId);
    if (index > -1) {
      this.selectedEntries.splice(index, 1);
    } else {
      this.selectedEntries.push(entryId);
    }
  }
  
  selectAll(): void {
    this.selectedEntries = this.filteredEntries.map(entry => entry.id);
  }
  
  deselectAll(): void {
    this.selectedEntries = [];
  }
  
  isSelected(entryId: string): boolean {
    return this.selectedEntries.includes(entryId);
  }
  
  // Export Methods
  exportHistory(): void {
    const exportData = {
      entries: this.selectedEntries.length > 0 
        ? this.filteredEntries.filter(entry => this.selectedEntries.includes(entry.id))
        : this.filteredEntries,
      filters: this.filters,
      exportDate: new Date().toISOString()
    };
    
    this.disputesService.exportDisputes(undefined, 'csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `dispute-history-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error exporting history:', error);
        }
      });
  }
  
  // Utility Methods
  getActionIcon(action: string): string {
    const iconMap: { [key: string]: string } = {
      'created': 'fa-plus-circle',
      'updated': 'fa-edit',
      'status_changed': 'fa-exchange-alt',
      'priority_changed': 'fa-flag',
      'letter_generated': 'fa-file-alt',
      'letter_sent': 'fa-paper-plane',
      'response_received': 'fa-inbox',
      'item_added': 'fa-plus',
      'item_removed': 'fa-minus',
      'note_added': 'fa-sticky-note',
      'deleted': 'fa-trash'
    };
    return iconMap[action] || 'fa-info-circle';
  }
  
  trackByEntryId(index: number, entry: DisputeHistoryEntry): string {
    return entry.id;
  }

  getActionClass(action: string): string {
    const classMap: { [key: string]: string } = {
      'created': 'text-success',
      'updated': 'text-primary',
      'status_changed': 'text-info',
      'priority_changed': 'text-warning',
      'letter_generated': 'text-secondary',
      'letter_sent': 'text-primary',
      'response_received': 'text-info',
      'item_added': 'text-success',
      'item_removed': 'text-danger',
      'note_added': 'text-secondary',
      'deleted': 'text-danger'
    };
    return classMap[action] || 'text-muted';
  }
  
  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  formatDateTime(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatTime(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getRelativeTime(date: string | Date): string {
    if (!date) return 'N/A';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return this.formatDate(date);
  }
  
  // Navigation Methods
  viewDispute(disputeId: string): void {
    // Navigate to dispute view
  }
  
  // Refresh Data
  refresh(): void {
    this.loadHistory();
  }
  
  // Toggle Filters
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
}