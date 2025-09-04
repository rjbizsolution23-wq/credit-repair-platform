import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbPaginationModule, NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

import { EnforcementService } from '../enforcement.service';
import {
  EnforcementAction,
  ActionType,
  ActionStatus,
  ActionRequirement,
  ActionProgress,
  getActionTypeLabel,
  getActionStatusLabel,
  getActionStatusColor
} from '../enforcement.model';

@Component({
  selector: 'app-enforcement-actions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPaginationModule,
    NgbDropdownModule,
    NgbTooltipModule,
    FeatherIconDirective
  ],
  templateUrl: './enforcement-actions.component.html',
  styleUrls: ['./enforcement-actions.component.scss']
})
export class EnforcementActionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  actions: EnforcementAction[] = [];
  filteredActions: EnforcementAction[] = [];
  selectedActions: Set<string> = new Set();
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // Sorting
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filtering
  showFilters = false;
  filterForm: FormGroup;
  searchTerm = '';

  // Enums for template
  Math = Math;
  ActionType = ActionType;
  ActionStatus = ActionStatus;

  constructor(
    private enforcementService: EnforcementService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadActions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: [''],
      assignedTo: [''],
      priority: [''],
      dateRange: this.fb.group({
        start: [''],
        end: ['']
      })
    });
  }

  private setupSearchSubscription(): void {
    this.filterForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.searchTerm = value;
        this.applyFilters();
      });
  }

  loadActions(): void {
    this.loading = true;
    this.error = null;

    const filters = this.buildFilters();

    this.enforcementService.getActions({
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortDirection,
      ...filters
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.actions = response.data;
        this.totalItems = response.total;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading enforcement actions:', error);
        this.error = 'Failed to load enforcement actions. Please try again.';
        this.loading = false;
        this.toastr.error('Failed to load enforcement actions');
      }
    });
  }

  private buildFilters(): any {
    const formValue = this.filterForm.value;
    const filters: any = {};

    if (formValue.type) {
      filters.type = formValue.type;
    }

    if (formValue.status) {
      filters.status = formValue.status;
    }

    if (formValue.assignedTo) {
      filters.assignedTo = formValue.assignedTo;
    }

    if (formValue.priority) {
      filters.priority = formValue.priority;
    }

    if (formValue.dateRange.start) {
      filters.startDate = formValue.dateRange.start;
    }

    if (formValue.dateRange.end) {
      filters.endDate = formValue.dateRange.end;
    }

    return filters;
  }

  applyFilters(): void {
    let filtered = [...this.actions];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(action =>
        action.title.toLowerCase().includes(term) ||
        action.description.toLowerCase().includes(term) ||
        action.assignedTo.toLowerCase().includes(term)
      );
    }

    this.filteredActions = filtered;
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadActions();
  }

  onPageChange(page: number | Event): void {
    if (typeof page === 'number') {
      this.currentPage = page;
    } else {
      // Handle event object case
      this.currentPage = (page.target as any)?.value || 1;
    }
    this.loadActions();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadActions();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadActions();
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.selectedActions.size === this.filteredActions.length) {
      this.selectedActions.clear();
    } else {
      this.selectedActions.clear();
      this.filteredActions.forEach(action => {
        this.selectedActions.add(action.id);
      });
    }
  }

  toggleSelect(actionId: string): void {
    if (this.selectedActions.has(actionId)) {
      this.selectedActions.delete(actionId);
    } else {
      this.selectedActions.add(actionId);
    }
  }

  isSelected(actionId: string): boolean {
    return this.selectedActions.has(actionId);
  }

  isAllSelected(): boolean {
    return this.filteredActions.length > 0 && 
           this.selectedActions.size === this.filteredActions.length;
  }

  isIndeterminate(): boolean {
    return this.selectedActions.size > 0 && 
           this.selectedActions.size < this.filteredActions.length;
  }

  // Action methods
  createAction(): void {
    this.router.navigate(['../create'], { relativeTo: this.route });
  }

  viewAction(actionId: string): void {
    this.router.navigate(['../view', actionId], { relativeTo: this.route });
  }

  editAction(actionId: string): void {
    this.router.navigate(['../edit', actionId], { relativeTo: this.route });
  }

  updateActionStatus(actionId: string, status: ActionStatus): void {
    this.enforcementService.updateAction(actionId, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Action status updated successfully');
          this.loadActions();
        },
        error: (error: any) => {
          console.error('Error updating action status:', error);
          this.toastr.error('Failed to update action status');
        }
      });
  }

  deleteAction(actionId: string): void {
    if (confirm('Are you sure you want to delete this enforcement action?')) {
      this.enforcementService.deleteAction(actionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Enforcement action deleted successfully');
            this.loadActions();
          },
          error: (error: any) => {
            console.error('Error deleting action:', error);
            this.toastr.error('Failed to delete action');
          }
        });
    }
  }

  // Bulk actions
  bulkUpdateStatus(status: ActionStatus): void {
    if (this.selectedActions.size === 0) {
      this.toastr.warning('Please select actions to update');
      return;
    }

    const actionIds = Array.from(this.selectedActions);
    
    this.enforcementService.bulkUpdateEnforcementActions(actionIds, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`${actionIds.length} actions updated successfully`);
          this.selectedActions.clear();
          this.loadActions();
        },
        error: (error: any) => {
          console.error('Error updating actions:', error);
          this.toastr.error('Failed to update actions');
        }
      });
  }

  bulkDelete(): void {
    if (this.selectedActions.size === 0) {
      this.toastr.warning('Please select actions to delete');
      return;
    }

    const actionIds = Array.from(this.selectedActions);
    
    if (confirm(`Are you sure you want to delete ${actionIds.length} enforcement actions?`)) {
      this.enforcementService.bulkDeleteEnforcementActions(actionIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success(`${actionIds.length} actions deleted successfully`);
            this.selectedActions.clear();
            this.loadActions();
          },
          error: (error: any) => {
            console.error('Error deleting actions:', error);
            this.toastr.error('Failed to delete actions');
          }
        });
    }
  }

  // Export
  exportActions(): void {
    const filters = this.buildFilters();
    
    this.enforcementService.exportActions({
      ...filters,
      search: this.searchTerm
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enforcement-actions-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Actions exported successfully');
      },
      error: (error: any) => {
        console.error('Error exporting actions:', error);
        this.toastr.error('Failed to export actions');
      }
    });
  }

  refresh(): void {
    this.loadActions();
  }

  // Utility methods
  getActionTypeLabel(type: ActionType): string {
    return getActionTypeLabel(type);
  }

  getActionStatusLabel(status: ActionStatus): string {
    return getActionStatusLabel(status);
  }

  getActionStatusColor(status: ActionStatus): string {
    return getActionStatusColor(status);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  formatDateTime(date: string | Date): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  }

  calculateProgress(action: EnforcementAction): number {
    if (!action.requirements || action.requirements.length === 0) {
      return action.status === ActionStatus.COMPLETED ? 100 : 0;
    }

    const completedRequirements = action.requirements.filter(r => r.completed).length;
    return Math.round((completedRequirements / action.requirements.length) * 100);
  }

  isOverdue(action: EnforcementAction): boolean {
    if (!action.dueDate) {
      return false;
    }

    const dueDate = new Date(action.dueDate);
    const now = new Date();
    return dueDate < now && action.status !== ActionStatus.COMPLETED;
  }

  getDaysUntilDue(action: EnforcementAction): number | null {
    if (!action.dueDate) {
      return null;
    }

    const dueDate = new Date(action.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  }
}