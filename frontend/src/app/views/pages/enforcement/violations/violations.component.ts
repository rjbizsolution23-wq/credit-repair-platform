import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { 
  Violation, 
  ViolationType, 
  ViolationSeverity, 
  ViolationStatus,
  getViolationTypeLabel,
  getViolationSeverityLabel,
  getViolationStatusLabel,
  getViolationSeverityColor,
  getViolationStatusColor
} from '../enforcement.model';
import { EnforcementService, PaginatedResponse } from '../enforcement.service';

interface ViolationFilters {
  search?: string;
  type?: ViolationType;
  severity?: ViolationSeverity;
  status?: ViolationStatus;
  reportedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
  regulationId?: string;
}

// Using PaginatedResponse from enforcement.service.ts
// interface ViolationListResponse {
//   violations: Violation[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

@Component({
  selector: 'app-violations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FeatherIconDirective, NgbPaginationModule],
  templateUrl: './violations.component.html',
  styleUrls: ['./violations.component.scss']
})
export class ViolationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Make Math available in template
  Math = Math;
  
  // Data
  violations: Violation[] = [];
  selectedViolations: string[] = [];
  
  // UI State
  loading = false;
  refreshing = false;
  showFilters = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalItems = 0;
  totalPages = 0;
  
  // Sorting
  sortField = 'reportedDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Filters
  filters: ViolationFilters = {};
  filterForm: FormGroup;
  
  // Enums for template
  ViolationType = ViolationType;
  ViolationSeverity = ViolationSeverity;
  ViolationStatus = ViolationStatus;
  
  // Modal states
  showDeleteModal = false;
  showBulkActionModal = false;
  selectedBulkAction = '';
  violationToDelete: Violation | null = null;
  
  constructor(
    private enforcementService: EnforcementService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.initializeFilterForm();
  }
  
  ngOnInit(): void {
    this.setupFilterSubscription();
    this.loadViolations();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      severity: [''],
      status: [''],
      reportedBy: [''],
      dateFrom: [''],
      dateTo: [''],
      clientId: [''],
      regulationId: ['']
    });
  }
  
  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(filters => {
        // Convert string dates to Date objects
        const processedFilters = { ...filters };
        if (processedFilters.dateFrom && typeof processedFilters.dateFrom === 'string') {
          processedFilters.dateFrom = new Date(processedFilters.dateFrom);
        }
        if (processedFilters.dateTo && typeof processedFilters.dateTo === 'string') {
          processedFilters.dateTo = new Date(processedFilters.dateTo);
        }
        this.filters = processedFilters;
        this.currentPage = 1;
        this.loadViolations();
      });
  }
  
  loadViolations(): void {
    this.loading = true;
    
    this.enforcementService.getViolations(this.filters, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<Violation>) => {
          this.violations = response.data;
          this.totalItems = response.total;
          this.totalPages = response.totalPages;
          this.loading = false;
          this.refreshing = false;
        },
        error: (error) => {
          console.error('Error loading violations:', error);
          this.toastr.error('Failed to load violations');
          this.loading = false;
          this.refreshing = false;
        }
      });
  }
  
  refreshData(): void {
    this.refreshing = true;
    this.loadViolations();
  }
  
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadViolations();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadViolations();
  }
  
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadViolations();
  }
  
  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'chevrons-up-down';
    return this.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters(): void {
    this.filterForm.reset();
    this.filters = {};
    this.currentPage = 1;
    this.loadViolations();
  }
  
  // Selection methods
  toggleViolationSelection(violationId: string): void {
    const index = this.selectedViolations.indexOf(violationId);
    if (index > -1) {
      this.selectedViolations.splice(index, 1);
    } else {
      this.selectedViolations.push(violationId);
    }
  }
  
  toggleAllViolations(): void {
    if (this.selectedViolations.length === this.violations.length) {
      this.selectedViolations = [];
    } else {
      this.selectedViolations = this.violations.map(v => v.id);
    }
  }
  
  isViolationSelected(violationId: string): boolean {
    return this.selectedViolations.includes(violationId);
  }
  
  get allViolationsSelected(): boolean {
    return this.violations.length > 0 && this.selectedViolations.length === this.violations.length;
  }
  
  get someViolationsSelected(): boolean {
    return this.selectedViolations.length > 0 && this.selectedViolations.length < this.violations.length;
  }
  
  // Navigation methods
  createViolation(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }
  
  viewViolation(violation: Violation): void {
    this.router.navigate([violation.id], { relativeTo: this.route });
  }
  
  editViolation(violation: Violation): void {
    this.router.navigate([violation.id, 'edit'], { relativeTo: this.route });
  }
  
  // Action methods
  updateViolationStatus(violation: Violation, status: ViolationStatus): void {
    this.enforcementService.updateViolation(violation.id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Violation status updated successfully');
          this.loadViolations();
        },
        error: (error) => {
          console.error('Error updating violation status:', error);
          this.toastr.error('Failed to update violation status');
        }
      });
  }
  
  assignViolation(violation: Violation, assignedTo: string): void {
    this.enforcementService.updateViolation(violation.id, { assignedTo })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Violation assigned successfully');
          this.loadViolations();
        },
        error: (error) => {
          console.error('Error assigning violation:', error);
          this.toastr.error('Failed to assign violation');
        }
      });
  }
  
  deleteViolation(violation: Violation): void {
    this.violationToDelete = violation;
    this.showDeleteModal = true;
  }
  
  confirmDelete(): void {
    if (!this.violationToDelete) return;
    
    this.enforcementService.deleteViolation(this.violationToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Violation deleted successfully');
          this.showDeleteModal = false;
          this.violationToDelete = null;
          this.loadViolations();
        },
        error: (error) => {
          console.error('Error deleting violation:', error);
          this.toastr.error('Failed to delete violation');
        }
      });
  }
  
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.violationToDelete = null;
  }
  
  // Bulk actions
  showBulkActions(): void {
    this.showBulkActionModal = true;
  }
  
  executeBulkAction(action: string): void {
    if (this.selectedViolations.length === 0) {
      this.toastr.warning('Please select violations to perform bulk action');
      return;
    }
    
    this.selectedBulkAction = action;
    
    let request;
    switch (action) {
      case 'resolve':
        request = this.enforcementService.bulkUpdateViolations(
          this.selectedViolations, 
          { status: ViolationStatus.RESOLVED }
        );
        break;
      case 'close':
        request = this.enforcementService.bulkUpdateViolations(
          this.selectedViolations, 
          { status: ViolationStatus.RESOLVED }
        );
        break;
      case 'delete':
        request = this.enforcementService.bulkDeleteViolations(this.selectedViolations);
        break;
      default:
        this.toastr.error('Invalid bulk action');
        return;
    }
    
    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`Bulk ${action} completed successfully`);
          this.selectedViolations = [];
          this.showBulkActionModal = false;
          this.loadViolations();
        },
        error: (error) => {
          console.error(`Error performing bulk ${action}:`, error);
          this.toastr.error(`Failed to perform bulk ${action}`);
        }
      });
  }
  
  cancelBulkAction(): void {
    this.showBulkActionModal = false;
    this.selectedBulkAction = '';
  }
  
  // Export methods
  exportViolations(format: 'csv' | 'excel' | 'pdf'): void {
    const params = {
      format,
      ...this.filters
    };
    
    this.enforcementService.exportViolations(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `violations.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.toastr.success('Violations exported successfully');
        },
        error: (error) => {
          console.error('Error exporting violations:', error);
          this.toastr.error('Failed to export violations');
        }
      });
  }
  
  // Utility methods
  getViolationTypeLabel = getViolationTypeLabel;
  getViolationSeverityLabel = getViolationSeverityLabel;
  getViolationStatusLabel = getViolationStatusLabel;
  getViolationSeverityColor = getViolationSeverityColor;
  getViolationStatusColor = getViolationStatusColor;
  
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }
  
  formatRelativeDate(date: string | Date): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }
  
  getRiskLevel(violation: Violation): string {
    if (violation.severity === ViolationSeverity.CRITICAL) return 'High';
    if (violation.severity === ViolationSeverity.HIGH) return 'Medium-High';
    if (violation.severity === ViolationSeverity.MEDIUM) return 'Medium';
    return 'Low';
  }
  
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium-high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  }
  
  getStatusBadgeClass(status: ViolationStatus): string {
    const color = this.getViolationStatusColor(status);
    return `bg-${color} bg-opacity-10 text-${color}`;
  }
  
  getSeverityBadgeClass(severity: ViolationSeverity): string {
    const color = this.getViolationSeverityColor(severity);
    return `bg-${color} bg-opacity-10 text-${color}`;
  }
}