import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { DisputeService } from '../../../../core/services/dispute.service';
import { Dispute, DisputeStatus, DisputeType, CreditBureau, ExportFormat, DisputeFilter } from '../../../../core/models/dispute.model';

@Component({
  selector: 'app-active-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbModule, FeatherIconDirective],
  templateUrl: './active-disputes.component.html',
  styleUrls: ['./active-disputes.component.scss']
})
export class ActiveDisputesComponent implements OnInit {
  disputes: Dispute[] = [];
  filteredDisputes: Dispute[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';
  selectedBureau = '';
  selectedClient = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  selectedDisputes: string[] = [];
  selectAll = false;

  // Template helpers
  Math = Math;
  DisputeStatus = DisputeStatus;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: DisputeStatus.SUBMITTED, label: 'Submitted' },
    { value: DisputeStatus.IN_PROGRESS, label: 'In Progress' },
    { value: DisputeStatus.PENDING_RESPONSE, label: 'Pending Response' },
    { value: DisputeStatus.UNDER_REVIEW, label: 'Under Review' }
  ];

  typeOptions = [
    { value: '', label: 'All Types' },
    { value: DisputeType.ACCOUNT_DISPUTE, label: 'Account Dispute' },
    { value: DisputeType.INQUIRY_DISPUTE, label: 'Inquiry Dispute' },
    { value: DisputeType.PERSONAL_INFO, label: 'Personal Information' },
    { value: DisputeType.PUBLIC_RECORD, label: 'Public Record' }
  ];

  bureauOptions = [
    { value: '', label: 'All Bureaus' },
    { value: CreditBureau.EXPERIAN, label: 'Experian' },
    { value: CreditBureau.EQUIFAX, label: 'Equifax' },
    { value: CreditBureau.TRANSUNION, label: 'TransUnion' }
  ];

  sortOptions = [
    { value: 'createdAt_desc', label: 'Newest First' },
    { value: 'createdAt_asc', label: 'Oldest First' },
    { value: 'submittedAt_desc', label: 'Recently Submitted' },
    { value: 'dueDate_asc', label: 'Due Date (Earliest)' },
    { value: 'priority_desc', label: 'Priority (High to Low)' }
  ];

  selectedSort = 'createdAt_desc';

  constructor(private disputeService: DisputeService) {}

  ngOnInit(): void {
    this.loadDisputes();
  }

  loadDisputes(): void {
    this.loading = true;
    const filters: Partial<DisputeFilter> = {
      status: [DisputeStatus.SUBMITTED, DisputeStatus.IN_PROGRESS, DisputeStatus.PENDING_RESPONSE, DisputeStatus.UNDER_REVIEW],
      search: this.searchTerm,
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: this.selectedSort
    };

    if (this.selectedType) {
      filters.type = [this.selectedType as DisputeType];
    }
    if (this.selectedBureau) {
      filters.bureau = [this.selectedBureau as CreditBureau];
    }
    if (this.selectedClient) {
      filters.clientId = this.selectedClient;
    }

    this.disputeService.getDisputes(filters).subscribe({
      next: (response) => {
        this.disputes = response.data || [];
        this.totalItems = response.total || this.disputes.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading disputes:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.disputes];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dispute => 
        dispute.clientName?.toLowerCase().includes(term) ||
        dispute.creditorName?.toLowerCase().includes(term) ||
        dispute.accountNumber?.includes(term) ||
        dispute.reason?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(dispute => dispute.status === this.selectedStatus);
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(dispute => dispute.type === this.selectedType);
    }

    // Bureau filter
    if (this.selectedBureau) {
      filtered = filtered.filter(dispute => dispute.bureau === this.selectedBureau);
    }

    this.filteredDisputes = filtered;
    this.totalItems = filtered.length;
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.loadDisputes();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDisputes();
  }

  getPaginatedDisputes(): Dispute[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredDisputes.slice(startIndex, endIndex);
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedDisputes = this.getPaginatedDisputes().map(d => d.id);
    } else {
      this.selectedDisputes = [];
    }
  }

  toggleSelectDispute(disputeId: string): void {
    const index = this.selectedDisputes.indexOf(disputeId);
    if (index > -1) {
      this.selectedDisputes.splice(index, 1);
    } else {
      this.selectedDisputes.push(disputeId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    const paginatedIds = this.getPaginatedDisputes().map(d => d.id);
    this.selectAll = paginatedIds.length > 0 && paginatedIds.every(id => this.selectedDisputes.includes(id));
  }

  isSelected(disputeId: string): boolean {
    return this.selectedDisputes.includes(disputeId);
  }

  bulkUpdateStatus(status: DisputeStatus): void {
    if (this.selectedDisputes.length === 0) {
      alert('Please select disputes to update.');
      return;
    }

    if (confirm(`Are you sure you want to update ${this.selectedDisputes.length} dispute(s) to ${status}?`)) {
      this.disputeService.bulkUpdateStatus(this.selectedDisputes, status).subscribe({
        next: () => {
          this.loadDisputes();
          this.selectedDisputes = [];
          this.selectAll = false;
        },
        error: (error) => {
          console.error('Error updating disputes:', error);
        }
      });
    }
  }

  deleteDispute(disputeId: string): void {
    if (confirm('Are you sure you want to delete this dispute?')) {
      this.disputeService.deleteDispute(disputeId).subscribe({
        next: () => {
          this.loadDisputes();
        },
        error: (error) => {
          console.error('Error deleting dispute:', error);
        }
      });
    }
  }

  bulkDelete(): void {
    if (this.selectedDisputes.length === 0) {
      alert('Please select disputes to delete.');
      return;
    }

    if (confirm(`Are you sure you want to delete ${this.selectedDisputes.length} dispute(s)? This action cannot be undone.`)) {
      this.disputeService.bulkDeleteDisputes(this.selectedDisputes).subscribe({
        next: () => {
          this.loadDisputes();
          this.selectedDisputes = [];
          this.selectAll = false;
        },
        error: (error) => {
          console.error('Error deleting disputes:', error);
        }
      });
    }
  }

  exportDisputes(): void {
    const filters: Partial<DisputeFilter> = {};
    
    if (this.selectedStatus) {
      filters.status = [this.selectedStatus as DisputeStatus];
    }
    if (this.selectedType) {
      filters.type = [this.selectedType as DisputeType];
    }
    if (this.selectedBureau) {
      filters.bureau = [this.selectedBureau as CreditBureau];
    }
    if (this.selectedClient) {
      filters.clientId = this.selectedClient;
    }
    if (this.searchTerm) {
      filters.search = this.searchTerm;
    }

    const exportOptions = {
      format: ExportFormat.CSV,
      filters
    };

    this.disputeService.exportDisputes(exportOptions).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `active_disputes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting disputes:', error);
      }
    });
  }

  getStatusBadgeClass(status: DisputeStatus): string {
    switch (status) {
      case DisputeStatus.SUBMITTED: return 'badge-info';
      case DisputeStatus.IN_PROGRESS: return 'badge-warning';
      case DisputeStatus.PENDING_RESPONSE: return 'badge-primary';
      case DisputeStatus.UNDER_REVIEW: return 'badge-secondary';
      case DisputeStatus.COMPLETED: return 'badge-success';
      case DisputeStatus.REJECTED: return 'badge-danger';
      case DisputeStatus.ESCALATED: return 'badge-dark';
      default: return 'badge-light';
    }
  }

  getTypeBadgeClass(type: DisputeType): string {
    switch (type) {
      case DisputeType.ACCOUNT_DISPUTE: return 'badge-primary';
      case DisputeType.INQUIRY_DISPUTE: return 'badge-info';
      case DisputeType.PERSONAL_INFO: return 'badge-warning';
      case DisputeType.PUBLIC_RECORD: return 'badge-danger';
      default: return 'badge-light';
    }
  }

  getBureauBadgeClass(bureau: CreditBureau): string {
    switch (bureau) {
      case CreditBureau.EXPERIAN: return 'badge-success';
      case CreditBureau.EQUIFAX: return 'badge-info';
      case CreditBureau.TRANSUNION: return 'badge-warning';
      default: return 'badge-light';
    }
  }

  getDaysRemaining(dueDate: Date): number {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted';
    }
  }

  refreshDisputes(): void {
    this.selectedDisputes = [];
    this.selectAll = false;
    this.loadDisputes();
  }
}