import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgbModal, NgbPaginationModule, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import {
  CreditReport,
  CreditBureau,
  ReportType,
  ReportStatus,
  getScoreColor,
  getScoreRange
} from '../../../../core/models/credit-report.model';
import {
  CreditReportService,
  CreditReportFilter,
  CreditReportStats,
  BulkReportOperation
} from '../../../../core/services/credit-report.service';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-all-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    NgbDropdownModule,
    NgbTooltipModule
  ],
  templateUrl: './all-reports.component.html',
  styleUrls: ['./all-reports.component.scss']
})
export class AllReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reports: CreditReport[] = [];
  filteredReports: CreditReport[] = [];
  clients: Client[] = [];
  stats: CreditReportStats | null = null;
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // Selection
  selectedReports: Set<string> = new Set();
  selectAll = false;

  // Filters
  filterForm: FormGroup;
  showAdvancedFilters = false;

  // Sorting
  sortField = 'reportDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Enums for template
  CreditBureau = CreditBureau;
  ReportType = ReportType;
  ReportStatus = ReportStatus;

  constructor(
    private creditReportService: CreditReportService,
    private clientService: ClientService,
    private fb: FormBuilder,
    private router: Router,
    private modalService: NgbModal
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      clientId: [''],
      bureau: [''],
      reportType: [''],
      status: [''],
      dateFrom: [''],
      dateTo: [''],
      scoreMin: [''],
      scoreMax: [''],
      hasNegativeItems: [null]
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;

    // Load clients for filter dropdown
    this.clientService.getAllClients().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (clients: any) => {
        this.clients = clients;
      },
      error: (error: any) => {
        console.error('Error loading clients:', error);
      }
    });

    // Load reports
    this.loadReports();

    // Load stats
    this.loadStats();
  }

  private loadReports(): void {
    const filter = this.buildFilter();
    
    this.creditReportService.getReports(filter).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (reports) => {
        this.reports = reports;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load credit reports';
        this.loading = false;
        console.error('Error loading reports:', error);
      }
    });
  }

  private loadStats(): void {
    this.creditReportService.getReportStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  private buildFilter(): CreditReportFilter {
    const formValue = this.filterForm.value;
    const filter: CreditReportFilter = {};

    if (formValue.search) filter.search = formValue.search;
    if (formValue.clientId) filter.clientId = formValue.clientId;
    if (formValue.bureau) filter.bureau = formValue.bureau;
    if (formValue.reportType) filter.reportType = formValue.reportType;
    if (formValue.status) filter.status = formValue.status;
    if (formValue.dateFrom) filter.dateFrom = new Date(formValue.dateFrom);
    if (formValue.dateTo) filter.dateTo = new Date(formValue.dateTo);
    if (formValue.scoreMin) filter.scoreMin = formValue.scoreMin;
    if (formValue.scoreMax) filter.scoreMax = formValue.scoreMax;
    if (formValue.hasNegativeItems !== null) filter.hasNegativeItems = formValue.hasNegativeItems;

    return filter;
  }

  private applyFilters(): void {
    let filtered = [...this.reports];

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = this.getFieldValue(a, this.sortField);
      const bValue = this.getFieldValue(b, this.sortField);
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredReports = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((o, f) => o?.[f], obj);
  }

  // Event Handlers
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onSelectAll(): void {
    if (this.selectAll) {
      this.selectedReports.clear();
    } else {
      this.getPaginatedReports().forEach(report => {
        this.selectedReports.add(report.id);
      });
    }
    this.selectAll = !this.selectAll;
  }

  onSelectReport(reportId: string): void {
    if (this.selectedReports.has(reportId)) {
      this.selectedReports.delete(reportId);
    } else {
      this.selectedReports.add(reportId);
    }
    this.updateSelectAllState();
  }

  private updateSelectAllState(): void {
    const paginatedReports = this.getPaginatedReports();
    this.selectAll = paginatedReports.length > 0 && 
      paginatedReports.every(report => this.selectedReports.has(report.id));
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  onRefresh(): void {
    this.loadData();
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.showAdvancedFilters = false;
  }

  onToggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Navigation
  onViewReport(reportId: string): void {
    this.router.navigate(['/credit-reports/analysis', reportId]);
  }

  onEditReport(reportId: string): void {
    // Navigate to edit form or open modal
    console.log('Edit report:', reportId);
  }

  onDeleteReport(reportId: string): void {
    if (confirm('Are you sure you want to delete this credit report?')) {
      this.creditReportService.deleteReport(reportId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadReports();
        },
        error: (error) => {
          console.error('Error deleting report:', error);
        }
      });
    }
  }

  onArchiveReport(reportId: string): void {
    this.creditReportService.archiveReport(reportId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadReports();
      },
      error: (error) => {
        console.error('Error archiving report:', error);
      }
    });
  }

  onReprocessReport(reportId: string): void {
    this.creditReportService.reprocessReport(reportId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadReports();
      },
      error: (error) => {
        console.error('Error reprocessing report:', error);
      }
    });
  }

  // Bulk Operations
  onBulkDelete(): void {
    if (this.selectedReports.size === 0) return;

    if (confirm(`Are you sure you want to delete ${this.selectedReports.size} selected reports?`)) {
      const operation: BulkReportOperation = {
        operation: 'delete',
        reportIds: Array.from(this.selectedReports)
      };

      this.creditReportService.bulkOperation(operation).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (result) => {
          console.log('Bulk delete result:', result);
          this.selectedReports.clear();
          this.selectAll = false;
          this.loadReports();
        },
        error: (error) => {
          console.error('Error in bulk delete:', error);
        }
      });
    }
  }

  onBulkArchive(): void {
    if (this.selectedReports.size === 0) return;

    const operation: BulkReportOperation = {
      operation: 'archive',
      reportIds: Array.from(this.selectedReports)
    };

    this.creditReportService.bulkOperation(operation).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        console.log('Bulk archive result:', result);
        this.selectedReports.clear();
        this.selectAll = false;
        this.loadReports();
      },
      error: (error) => {
        console.error('Error in bulk archive:', error);
      }
    });
  }

  onExport(): void {
    const filter = this.buildFilter();
    this.creditReportService.exportReports(filter, 'excel').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `credit-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting reports:', error);
      }
    });
  }

  // Utility Methods
  getPaginatedReports(): CreditReport[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredReports.slice(startIndex, endIndex);
  }

  getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  }

  getScoreColor(score: number): string {
    return getScoreColor(score);
  }

  getScoreRange(score: number): string {
    return getScoreRange(score);
  }

  getBureauIcon(bureau: CreditBureau): string {
    switch (bureau) {
      case CreditBureau.EXPERIAN: return 'trending-up';
      case CreditBureau.EQUIFAX: return 'bar-chart';
      case CreditBureau.TRANSUNION: return 'activity';
      default: return 'file-text';
    }
  }

  getStatusClass(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.COMPLETED: return 'badge-success';
      case ReportStatus.PROCESSING: return 'badge-warning';
      case ReportStatus.PENDING: return 'badge-info';
      case ReportStatus.ERROR: return 'badge-danger';
      case ReportStatus.ARCHIVED: return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getNegativeAccountsCount(report: CreditReport): number {
    return report.accounts?.filter(acc => acc.isNegative).length || 0;
  }

  hasNegativeAccounts(report: CreditReport): boolean {
    return report.accounts?.some(acc => acc.isNegative) || false;
  }
}