import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { DisputesService } from '../disputes.service';
import { ToastrService } from 'ngx-toastr';
import { DisputeStatus, DisputeResponse, DisputeAttachment } from '../disputes.model';

export interface ResponseFilters {
  search: string;
  status: string[];
  priority: string[];
  responseType: string[];
  creditBureau: string[];
  dateRange: {
    preset: string;
    start: string;
    end: string;
  };
  notes: string;
  outcome: string[];
}

@Component({
  selector: 'app-dispute-responses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dispute-responses.component.html',
  styleUrls: ['./dispute-responses.component.scss']
})
export class DisputeResponsesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  disputeId: string = '';
  responses: DisputeResponse[] = [];
  filteredResponses: DisputeResponse[] = [];
  selectedResponses: string[] = [];
  selectedResponse: DisputeResponse | null = null;

  // UI State
  loading = false;
  error: string | null = null;
  showFilters = false;
  activeView: 'list' | 'detail' = 'list';
  showBulkActions = false;

  // Forms
  filtersForm: FormGroup;
  responseForm: FormGroup;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Enum constants for template access
  DisputeStatus = DisputeStatus;

  // Filter Options
  statusOptions = [
    { value: DisputeStatus.PENDING_RESPONSE, label: 'Pending Response' },
    { value: DisputeStatus.UNDER_REVIEW, label: 'Under Review' },
    { value: DisputeStatus.RESOLVED, label: 'Resolved' },
    { value: DisputeStatus.ESCALATED, label: 'Escalated' }
  ];

  priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  responseTypeOptions = [
    { value: 'verification', label: 'Verification' },
    { value: 'deletion', label: 'Deletion' },
    { value: 'modification', label: 'Modification' },
    { value: 'investigation', label: 'Investigation' },
    { value: 'rejection', label: 'Rejection' }
  ];

  creditBureauOptions = [
    { value: 'experian', label: 'Experian' },
    { value: 'equifax', label: 'Equifax' },
    { value: 'transunion', label: 'TransUnion' }
  ];

  outcomeOptions = [
    { value: 'favorable', label: 'Favorable' },
    { value: 'unfavorable', label: 'Unfavorable' },
    { value: 'partial', label: 'Partial' },
    { value: 'pending', label: 'Pending' }
  ];

  datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  constructor(
    private fb: FormBuilder,
    private disputesService: DisputesService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.loadResponses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      search: [''],
      status: [[]],
      priority: [[]],
      responseType: [[]],
      creditBureau: [[]],
      dateRange: this.fb.group({
        preset: ['last30days'],
        start: [''],
        end: ['']
      }),
      notes: [''],
      outcome: [[]]
    });

    this.responseForm = this.fb.group({
      status: ['', Validators.required],
      priority: ['', Validators.required],
      notes: [''],
      tags: [[]]
    });
  }

  private setupFormSubscriptions(): void {
    // Search with debounce
    this.filtersForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Other filters
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadResponses(): void {
    this.loading = true;
    this.error = null;

    const filters = this.getFiltersFromForm();

    this.disputesService.getResponses(this.disputeId || '').pipe(
      map((responses: DisputeResponse[]) => ({
        data: responses,
        total: responses.length,
        page: this.currentPage,
        limit: this.pageSize
      })),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        this.responses = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load dispute responses. Please try again.';
        this.loading = false;
        console.error('Error loading responses:', error);
      }
    });
  }

  private getFiltersFromForm(): ResponseFilters {
    const formValue = this.filtersForm.value;
    return {
      search: formValue.search || '',
      status: formValue.status || [],
      priority: formValue.priority || [],
      responseType: formValue.responseType || [],
      creditBureau: formValue.creditBureau || [],
      dateRange: formValue.dateRange,
      notes: formValue.notes || '',
      outcome: formValue.outcome || []
    };
  }

  applyFilters(): void {
    let filtered = [...this.responses];
    const filters = this.getFiltersFromForm();

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(response =>
        response.response_content?.toLowerCase().includes(searchTerm) ||
        response.notes?.toLowerCase().includes(searchTerm) ||
        response.response_content?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(response => filters.status.includes('pending'));
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(response => filters.priority.includes('medium'));
    }

    // Response type filter
    if (filters.responseType.length > 0) {
      filtered = filtered.filter(response => filters.responseType.includes(response.response_type));
    }

    // Credit bureau filter
    if (filters.creditBureau.length > 0) {
      filtered = filtered.filter(response => filters.creditBureau.includes('experian'));
    }

    // Outcome filter
    if (filters.outcome.length > 0) {
      filtered = filtered.filter(response => filters.outcome.includes('pending'));
    }

    // Assigned to filter
    if (filters.notes) {
      filtered = filtered.filter(response =>
        response.notes?.toLowerCase().includes(filters.notes.toLowerCase())
      );
    }

    this.filteredResponses = filtered;
  }

  // UI Actions
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      status: [],
      priority: [],
      responseType: [],
      creditBureau: [],
      dateRange: {
        preset: 'last30days',
        start: '',
        end: ''
      },
      notes: '',
      outcome: []
    });
  }

  refresh(): void {
    this.loadResponses();
  }

  // Selection
  toggleResponseSelection(responseId: string): void {
    const index = this.selectedResponses.indexOf(responseId);
    if (index > -1) {
      this.selectedResponses.splice(index, 1);
    } else {
      this.selectedResponses.push(responseId);
    }
    this.showBulkActions = this.selectedResponses.length > 0;
  }

  selectAllResponses(): void {
    if (this.selectedResponses.length === this.filteredResponses.length) {
      this.selectedResponses = [];
    } else {
      this.selectedResponses = this.filteredResponses.map(r => r.id);
    }
    this.showBulkActions = this.selectedResponses.length > 0;
  }

  isResponseSelected(responseId: string): boolean {
    return this.selectedResponses.includes(responseId);
  }

  // Response Actions
  viewResponse(response: DisputeResponse): void {
    this.selectedResponse = response;
    this.activeView = 'detail';
    this.populateResponseForm(response);
  }

  editResponse(response: DisputeResponse): void {
    this.selectedResponse = response;
    this.populateResponseForm(response);
  }

  private populateResponseForm(response: DisputeResponse): void {
    this.responseForm.patchValue({
      status: 'pending',
      priority: 'medium',
      notes: response.notes || '',
      tags: []
    });
  }

  saveResponse(): void {
    if (this.responseForm.valid && this.selectedResponse) {
      const formValue = this.responseForm.value;
      
      this.disputesService.updateResponse(this.selectedResponse.dispute_id, this.selectedResponse.id, formValue)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Response updated successfully');
            this.loadResponses();
          },
          error: (error: any) => {
            this.toastr.error('Failed to update response');
            console.error('Error updating response:', error);
          }
        });
    }
  }

  processResponse(response: DisputeResponse): void {
    // Update response status to processed
    this.disputesService.updateResponse(response.dispute_id, response.id, { processed_date: new Date() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Response processed successfully');
          this.loadResponses();
        },
        error: (error: any) => {
          this.toastr.error('Failed to process response');
          console.error('Error processing response:', error);
        }
      });
  }

  escalateResponse(response: DisputeResponse): void {
    // Update response status to escalated
    this.disputesService.updateResponse(response.dispute_id, response.id, { notes: response.notes + '\n[ESCALATED]' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Response escalated successfully');
          this.loadResponses();
        },
        error: (error: any) => {
          this.toastr.error('Failed to escalate response');
          console.error('Error escalating response:', error);
        }
      });
  }

  downloadAttachment(attachment: DisputeAttachment): void {
    window.open(attachment.file_url, '_blank');
  }

  // Bulk Actions
  bulkUpdateStatus(status: DisputeStatus): void {
    if (this.selectedResponses.length === 0) return;

    this.disputesService.bulkUpdateStatus(this.selectedResponses, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`${this.selectedResponses.length} responses updated`);
          this.selectedResponses = [];
          this.showBulkActions = false;
          this.loadResponses();
        },
        error: (error: any) => {
          this.toastr.error('Failed to update responses');
          console.error('Error updating responses:', error);
        }
      });
  }

  bulkAssign(assignee: string): void {
    if (this.selectedResponses.length === 0) return;

    this.disputesService.bulkAssignResponses(this.selectedResponses, assignee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(`${this.selectedResponses.length} responses assigned`);
          this.selectedResponses = [];
          this.showBulkActions = false;
          this.loadResponses();
        },
        error: (error: any) => {
          this.toastr.error('Failed to assign responses');
          console.error('Error assigning responses:', error);
        }
      });
  }

  // Navigation
  goToDispute(disputeId: string): void {
    this.router.navigate(['/disputes/view', disputeId]);
  }

  goToClient(clientId: string): void {
    this.router.navigate(['/clients/view', clientId]);
  }

  backToList(): void {
    this.activeView = 'list';
    this.selectedResponse = null;
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadResponses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadResponses();
  }

  // Filter helpers
  onStatusChange(status: string, checked: boolean): void {
    const currentStatus = this.filtersForm.get('status')?.value || [];
    if (checked) {
      this.filtersForm.patchValue({ status: [...currentStatus, status] });
    } else {
      this.filtersForm.patchValue({ status: currentStatus.filter((s: string) => s !== status) });
    }
  }

  onPriorityChange(priority: string, checked: boolean): void {
    const currentPriority = this.filtersForm.get('priority')?.value || [];
    if (checked) {
      this.filtersForm.patchValue({ priority: [...currentPriority, priority] });
    } else {
      this.filtersForm.patchValue({ priority: currentPriority.filter((p: string) => p !== priority) });
    }
  }

  onResponseTypeChange(type: string, checked: boolean): void {
    const currentTypes = this.filtersForm.get('responseType')?.value || [];
    if (checked) {
      this.filtersForm.patchValue({ responseType: [...currentTypes, type] });
    } else {
      this.filtersForm.patchValue({ responseType: currentTypes.filter((t: string) => t !== type) });
    }
  }

  onCreditBureauChange(bureau: string, checked: boolean): void {
    const currentBureaus = this.filtersForm.get('creditBureau')?.value || [];
    if (checked) {
      this.filtersForm.patchValue({ creditBureau: [...currentBureaus, bureau] });
    } else {
      this.filtersForm.patchValue({ creditBureau: currentBureaus.filter((b: string) => b !== bureau) });
    }
  }

  onOutcomeChange(outcome: string, checked: boolean): void {
    const currentOutcomes = this.filtersForm.get('outcome')?.value || [];
    if (checked) {
      this.filtersForm.patchValue({ outcome: [...currentOutcomes, outcome] });
    } else {
      this.filtersForm.patchValue({ outcome: currentOutcomes.filter((o: string) => o !== outcome) });
    }
  }

  // Utility methods
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString();
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'pending': 'bg-warning',
      'received': 'bg-info',
      'processed': 'bg-success',
      'escalated': 'bg-danger'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-secondary';
  }

  getPriorityBadgeClass(priority: string): string {
    const priorityClasses = {
      'low': 'bg-success',
      'medium': 'bg-warning',
      'high': 'bg-danger',
      'urgent': 'bg-dark'
    };
    return priorityClasses[priority as keyof typeof priorityClasses] || 'bg-secondary';
  }

  getOutcomeBadgeClass(outcome: string): string {
    const outcomeClasses = {
      'favorable': 'bg-success',
      'unfavorable': 'bg-danger',
      'partial': 'bg-warning',
      'pending': 'bg-secondary'
    };
    return outcomeClasses[outcome as keyof typeof outcomeClasses] || 'bg-secondary';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}