import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DisputesService } from '../disputes.service';
import { Dispute, DisputeItem, DisputeStatus, DisputePriority } from '../disputes.model';

@Component({
  selector: 'app-view-dispute',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-dispute.component.html',
  styleUrls: ['./view-dispute.component.scss']
})
export class ViewDisputeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  dispute: Dispute | null = null;
  disputeId: string = '';
  loading = true;
  error: string | null = null;
  
  // UI State
  activeTab = 'overview';
  showDeleteModal = false;
  showLetterModal = false;
  selectedLetter: any = null;
  
  // Enums for template
  DisputeStatus = DisputeStatus;
  DisputePriority = DisputePriority;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private disputesService: DisputesService
  ) {}
  
  ngOnInit(): void {
    this.disputeId = this.route.snapshot.params['id'];
    this.loadDispute();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadDispute(): void {
    this.loading = true;
    this.error = null;
    
    this.disputesService.getDispute(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dispute) => {
          this.dispute = dispute;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load dispute details';
          this.loading = false;
          console.error('Error loading dispute:', error);
        }
      });
  }
  
  // Navigation Methods
  goBack(): void {
    this.router.navigate(['/disputes/active']);
  }
  
  editDispute(): void {
    this.router.navigate(['/disputes/edit', this.disputeId]);
  }
  
  duplicateDispute(): void {
    if (this.dispute) {
      this.router.navigate(['/disputes/create'], {
        queryParams: { duplicate: this.disputeId }
      });
    }
  }
  
  // Tab Management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  // Status Management
  updateStatus(status: DisputeStatus): void {
    if (!this.dispute) return;
    
    this.disputesService.updateDispute(this.disputeId, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDispute: any) => {
          this.dispute = updatedDispute;
        },
        error: (error: any) => {
          console.error('Error updating status:', error);
        }
      });
  }
  
  // Priority Management
  updatePriority(priority: DisputePriority): void {
    if (!this.dispute) return;
    
    this.disputesService.updateDispute(this.disputeId, { priority })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedDispute: any) => {
          this.dispute = updatedDispute;
        },
        error: (error: any) => {
          console.error('Error updating priority:', error);
        }
      });
  }
  
  // Letter Management
  viewLetter(letter: any): void {
    this.selectedLetter = letter;
    this.showLetterModal = true;
  }
  
  downloadLetter(letter: any): void {
    this.disputesService.downloadLetter(this.disputeId, letter.id, 'pdf')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${letter.type}_${this.dispute?.id}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error downloading letter:', error);
        }
      });
  }
  
  // Delete Management
  confirmDelete(): void {
    this.showDeleteModal = true;
  }
  
  deleteDispute(): void {
    this.disputesService.deleteDispute(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/disputes/active']);
        },
        error: (error) => {
          console.error('Error deleting dispute:', error);
          this.showDeleteModal = false;
        }
      });
  }
  
  // Utility Methods
  getStatusClass(status: DisputeStatus): string {
    const statusClasses = {
      [DisputeStatus.DRAFT]: 'badge-secondary',
      [DisputeStatus.SUBMITTED]: 'badge-primary',
      [DisputeStatus.IN_PROGRESS]: 'badge-warning',
      [DisputeStatus.PENDING_RESPONSE]: 'badge-warning',
      [DisputeStatus.UNDER_REVIEW]: 'badge-info',
      [DisputeStatus.RESOLVED]: 'badge-success',
      [DisputeStatus.REJECTED]: 'badge-danger',
      [DisputeStatus.ESCALATED]: 'badge-dark'
    };
    return statusClasses[status] || 'badge-secondary';
  }
  
  getPriorityClass(priority: DisputePriority): string {
    const priorityClasses = {
      [DisputePriority.LOW]: 'text-success',
      [DisputePriority.MEDIUM]: 'text-warning',
      [DisputePriority.HIGH]: 'text-danger',
      [DisputePriority.URGENT]: 'text-danger fw-bold'
    };
    return priorityClasses[priority] || 'text-muted';
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
  
  formatCurrency(amount: number): string {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  getDaysRemaining(dueDate: string | Date): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  getProgressPercentage(): number {
    if (!this.dispute?.dispute_items?.length) return 0;
    
    const resolvedItems = this.dispute.dispute_items.filter((item: any) => 
      item.status === 'resolved' || item.status === 'deleted'
    ).length;
    
    return Math.round((resolvedItems / this.dispute.dispute_items.length) * 100);
  }
  
  // Modal Management
  closeModal(): void {
    this.showDeleteModal = false;
    this.showLetterModal = false;
    this.selectedLetter = null;
  }
  
  // Refresh Data
  refresh(): void {
    this.loadDispute();
  }
  
  getEventIcon(eventType: string): string {
    switch (eventType) {
      case 'created':
        return 'fa-plus-circle';
      case 'submitted':
        return 'fa-paper-plane';
      case 'response':
        return 'fa-reply';
      case 'updated':
        return 'fa-edit';
      case 'resolved':
        return 'fa-check-circle';
      case 'rejected':
        return 'fa-times-circle';
      default:
        return 'fa-info-circle';
    }
  }
  
  trackByEventId(index: number, event: any): any {
    return event.id || index;
  }
  
  trackByLetterId(index: number, letter: any): any {
    return letter.id || index;
  }
  
  trackByItemId(index: number, item: any): any {
    return item.id || index;
  }

  abs(value: number): number {
    return Math.abs(value);
  }
  
  getDisputeHistory(): any[] {
    if (!this.dispute) return [];
    
    const history = [];
    
    if (this.dispute.created_date) {
      history.push({
        id: 'created',
        type: 'created',
        title: 'Dispute Created',
        timestamp: this.dispute.created_date,
        description: 'Dispute case was created'
      });
    }
    
    if (this.dispute.submitted_date) {
      history.push({
        id: 'submitted',
        type: 'submitted',
        title: 'Dispute Submitted',
        timestamp: this.dispute.submitted_date,
        description: 'Dispute was submitted to credit bureau'
      });
    }
    
    if (this.dispute.response_date) {
      history.push({
        id: 'response',
        type: 'response',
        title: 'Bureau Response',
        timestamp: this.dispute.response_date,
        description: 'Credit bureau provided response'
      });
    }
    
    if (this.dispute.resolution_date) {
      history.push({
        id: 'resolved',
        type: 'resolved',
        title: 'Dispute Resolved',
        timestamp: this.dispute.resolution_date,
        description: 'Dispute case was resolved'
      });
    }
    
    return history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}