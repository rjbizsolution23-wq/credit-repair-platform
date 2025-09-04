import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  BureauDispute,
  DisputeType,
  DisputeStatus,
  DisputeMethod,
  CreditBureau,
  getDisputeTypeLabel,
  getDisputeStatusLabel,
  getDisputeStatusColor,
  getCreditBureauLabel,
  getDisputeMethodLabel,
  calculateDisputeAge,
  isDisputeOverdue,
  getDaysUntilDeadline,
  formatCurrency,
  formatDate
} from '../bureaus.model';
import { BureausService } from '../bureaus.service';

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './disputes.component.html',
  styleUrls: ['./disputes.component.scss']
})
export class DisputesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  disputes: BureauDispute[] = [];
  filteredDisputes: BureauDispute[] = [];
  selectedDisputes: Set<string> = new Set();
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filtering
  searchControl = new FormControl('');
  showFilters = false;
  filters = {
    search: '',
    type: '',
    status: '',
    bureau: '',
    method: '',
    dateFrom: '',
    dateTo: '',
    overdueOnly: false
  };

  // Enums for templates
  DisputeType = DisputeType;
  DisputeStatus = DisputeStatus;
  DisputeMethod = DisputeMethod;
  CreditBureau = CreditBureau;

  // Bulk actions
  showBulkActions = false;
  bulkActionType: string = '';

  constructor(
    private bureausService: BureausService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeSearchControl();
    this.loadDisputes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSearchControl(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.filters.search = value || '';
        this.applyFilters();
      });
  }

  loadDisputes(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortDirection,
      ...this.getActiveFilters()
    };

    this.bureausService.getDisputes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.disputes = response.data;
          this.totalItems = response.total;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading disputes:', error);
          this.error = 'Failed to load disputes. Please try again.';
          this.loading = false;
        }
      });
  }

  private getActiveFilters(): any {
    const activeFilters: any = {};
    
    if (this.filters.search) activeFilters.search = this.filters.search;
    if (this.filters.type) activeFilters.type = this.filters.type;
    if (this.filters.status) activeFilters.status = this.filters.status;
    if (this.filters.bureau) activeFilters.bureau = this.filters.bureau;
    if (this.filters.method) activeFilters.method = this.filters.method;
    if (this.filters.dateFrom) activeFilters.dateFrom = this.filters.dateFrom;
    if (this.filters.dateTo) activeFilters.dateTo = this.filters.dateTo;
    if (this.filters.overdueOnly) activeFilters.overdueOnly = this.filters.overdueOnly;

    return activeFilters;
  }

  applyFilters(): void {
    let filtered = [...this.disputes];

    // Apply local filters if needed
    if (this.filters.overdueOnly) {
      filtered = filtered.filter(dispute => this.isDisputeOverdue(dispute));
    }

    this.filteredDisputes = filtered;
    this.updateBulkActionsVisibility();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadDisputes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDisputes();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadDisputes();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      type: '',
      status: '',
      bureau: '',
      method: '',
      dateFrom: '',
      dateTo: '',
      overdueOnly: false
    };
    this.searchControl.setValue('');
    this.loadDisputes();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadDisputes();
  }

  // Selection methods
  toggleDisputeSelection(disputeId: string): void {
    if (this.selectedDisputes.has(disputeId)) {
      this.selectedDisputes.delete(disputeId);
    } else {
      this.selectedDisputes.add(disputeId);
    }
    this.updateBulkActionsVisibility();
  }

  toggleAllDisputes(): void {
    if (this.selectedDisputes.size === this.filteredDisputes.length) {
      this.selectedDisputes.clear();
    } else {
      this.selectedDisputes.clear();
      this.filteredDisputes.forEach(dispute => {
        this.selectedDisputes.add(dispute.id);
      });
    }
    this.updateBulkActionsVisibility();
  }

  isDisputeSelected(disputeId: string): boolean {
    return this.selectedDisputes.has(disputeId);
  }

  isAllSelected(): boolean {
    return this.filteredDisputes.length > 0 && 
           this.selectedDisputes.size === this.filteredDisputes.length;
  }

  isIndeterminate(): boolean {
    return this.selectedDisputes.size > 0 && 
           this.selectedDisputes.size < this.filteredDisputes.length;
  }

  private updateBulkActionsVisibility(): void {
    this.showBulkActions = this.selectedDisputes.size > 0;
  }

  // Bulk actions
  performBulkAction(action: string): void {
    if (this.selectedDisputes.size === 0) return;

    this.bulkActionType = action;
    const disputeIds = Array.from(this.selectedDisputes);

    switch (action) {
      case 'submit':
        this.bulkSubmitDisputes(disputeIds);
        break;
      case 'withdraw':
        this.bulkWithdrawDisputes(disputeIds);
        break;
      case 'delete':
        this.confirmBulkDelete(disputeIds);
        break;
    }
  }

  private bulkSubmitDisputes(disputeIds: string[]): void {
    this.bureausService.bulkUpdateDisputes(disputeIds, { status: DisputeStatus.SUBMITTED })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedDisputes.clear();
          this.loadDisputes();
        },
        error: (error) => {
          console.error('Error submitting disputes:', error);
          this.error = 'Failed to submit disputes. Please try again.';
        }
      });
  }

  private bulkWithdrawDisputes(disputeIds: string[]): void {
    this.bureausService.bulkUpdateDisputes(disputeIds, { status: DisputeStatus.CANCELLED })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedDisputes.clear();
          this.loadDisputes();
        },
        error: (error) => {
          console.error('Error withdrawing disputes:', error);
          this.error = 'Failed to withdraw disputes. Please try again.';
        }
      });
  }

  private confirmBulkDelete(disputeIds: string[]): void {
    if (confirm(`Are you sure you want to delete ${disputeIds.length} dispute(s)? This action cannot be undone.`)) {
      this.bulkDeleteDisputes(disputeIds);
    }
  }

  private bulkDeleteDisputes(disputeIds: string[]): void {
    this.bureausService.bulkDeleteDisputes(disputeIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.selectedDisputes.clear();
          this.loadDisputes();
        },
        error: (error) => {
          console.error('Error deleting disputes:', error);
          this.error = 'Failed to delete disputes. Please try again.';
        }
      });
  }

  // Individual dispute actions
  viewDispute(dispute: BureauDispute): void {
    this.router.navigate(['/bureaus/disputes', dispute.id]);
  }

  editDispute(dispute: BureauDispute): void {
    this.router.navigate(['/bureaus/disputes', dispute.id, 'edit']);
  }

  submitDispute(dispute: BureauDispute): void {
    this.bureausService.updateDispute(dispute.id, { status: DisputeStatus.SUBMITTED })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadDisputes();
        },
        error: (error) => {
          console.error('Error submitting dispute:', error);
          this.error = 'Failed to submit dispute. Please try again.';
        }
      });
  }

  withdrawDispute(dispute: BureauDispute): void {
    if (confirm('Are you sure you want to withdraw this dispute?')) {
      this.bureausService.updateDispute(dispute.id, { status: DisputeStatus.CANCELLED })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadDisputes();
          },
          error: (error) => {
            console.error('Error withdrawing dispute:', error);
            this.error = 'Failed to withdraw dispute. Please try again.';
          }
        });
    }
  }

  deleteDispute(dispute: BureauDispute): void {
    if (confirm('Are you sure you want to delete this dispute? This action cannot be undone.')) {
      this.bureausService.deleteDispute(dispute.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadDisputes();
          },
          error: (error) => {
            console.error('Error deleting dispute:', error);
            this.error = 'Failed to delete dispute. Please try again.';
          }
        });
    }
  }

  // Navigation
  createDispute(): void {
    this.router.navigate(['/bureaus/disputes/new']);
  }

  exportDisputes(): void {
    const params = {
      ...this.getActiveFilters(),
      sortBy: this.sortField,
      sortOrder: this.sortDirection
    };

    this.bureausService.exportDisputes(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `disputes-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting disputes:', error);
          this.error = 'Failed to export disputes. Please try again.';
        }
      });
  }

  refreshData(): void {
    this.loadDisputes();
  }

  // Utility methods
  getDisputeTypeLabel(type: DisputeType): string {
    return getDisputeTypeLabel(type);
  }

  getDisputeStatusLabel(status: DisputeStatus): string {
    return getDisputeStatusLabel(status);
  }

  getDisputeStatusColor(status: DisputeStatus): string {
    return getDisputeStatusColor(status);
  }

  getCreditBureauLabel(bureau: CreditBureau): string {
    return getCreditBureauLabel(bureau);
  }

  getDisputeMethodLabel(method: DisputeMethod): string {
    return getDisputeMethodLabel(method);
  }

  calculateDisputeAge(dispute: BureauDispute): number {
    return calculateDisputeAge(dispute.createdAt);
  }

  isDisputeOverdue(dispute: BureauDispute): boolean {
    return isDisputeOverdue(dispute);
  }

  getDaysUntilDeadline(dispute: BureauDispute): number {
    return getDaysUntilDeadline(dispute.expectedResponseDate || '');
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return formatDate(date);
    }
    return formatDate(date.toISOString());
  }

  getDisputePriorityColor(dispute: BureauDispute): string {
    if (this.isDisputeOverdue(dispute)) {
      return 'danger';
    }
    
    const daysUntilDeadline = this.getDaysUntilDeadline(dispute);
    if (daysUntilDeadline <= 7) {
      return 'warning';
    }
    
    return 'primary';
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  canSubmitDispute(dispute: BureauDispute): boolean {
    return dispute.status === DisputeStatus.DRAFT;
  }

  canWithdrawDispute(dispute: BureauDispute): boolean {
    return dispute.status === DisputeStatus.SUBMITTED || 
           dispute.status === DisputeStatus.UNDER_INVESTIGATION;
  }

  canEditDispute(dispute: BureauDispute): boolean {
    return dispute.status === DisputeStatus.DRAFT;
  }

  canDeleteDispute(dispute: BureauDispute): boolean {
    return dispute.status === DisputeStatus.DRAFT || 
           dispute.status === DisputeStatus.CANCELLED;
  }

  getStatusIcon(status: DisputeStatus): string {
    switch (status) {
      case DisputeStatus.DRAFT:
        return 'fas fa-edit';
      case DisputeStatus.SUBMITTED:
        return 'fas fa-paper-plane';
      case DisputeStatus.UNDER_INVESTIGATION:
        return 'fas fa-search';
      case DisputeStatus.RESOLVED:
        return 'fas fa-check-circle';
      case DisputeStatus.REJECTED:
        return 'fas fa-times-circle';
      case DisputeStatus.CANCELLED:
        return 'fas fa-undo';
      default:
        return 'fas fa-question-circle';
    }
  }

  getTypeIcon(type: DisputeType): string {
    switch (type) {
      case DisputeType.INACCURATE_INFORMATION:
        return 'fas fa-exclamation-triangle';
      case DisputeType.IDENTITY_THEFT:
        return 'fas fa-user-secret';
      case DisputeType.OUTDATED_INFORMATION:
        return 'fas fa-calendar-times';
      case DisputeType.DUPLICATE_ACCOUNTS:
        return 'fas fa-copy';
      case DisputeType.UNAUTHORIZED_INQUIRY:
        return 'fas fa-eye-slash';
      case DisputeType.MIXED_FILES:
        return 'fas fa-random';
      default:
        return 'fas fa-file-alt';
    }
  }

  // Track by function for ngFor performance
  trackByDispute(index: number, dispute: any): string {
    return dispute.id;
  }
}