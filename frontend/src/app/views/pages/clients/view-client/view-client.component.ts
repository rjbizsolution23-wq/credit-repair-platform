import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule, TitleCasePipe } from '@angular/common';

// Services
import { ClientsService } from '../clients.service';
import { DisputesService } from '../../disputes/disputes.service';
import { ToastrService } from 'ngx-toastr';

// Models
import { Client } from '../clients.model';
import { Dispute } from '../../disputes/disputes.model';

@Component({
  selector: 'app-view-client',
  templateUrl: './view-client.component.html',
  styleUrls: ['./view-client.component.scss'],
  standalone: true,
  imports: [CommonModule, TitleCasePipe]
})
export class ViewClientComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  client: Client | null = null;
  clientId: string = '';
  isLoading = false;
  error: string | null = null;
  
  // Related data
  recentDisputes: Dispute[] = [];
  disputesLoading = false;
  
  // UI state
  activeTab = 'overview';
  showDeleteConfirm = false;
  isDeleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private disputesService: DisputesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    if (this.clientId) {
      this.loadClient();
      this.loadRecentDisputes();
    } else {
      this.error = 'Invalid client ID';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadClient(): void {
    this.isLoading = true;
    this.error = null;
    
    this.clientsService.getClientById(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client: Client) => {
          this.client = client;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading client:', error);
          this.error = 'Failed to load client information';
          this.isLoading = false;
          this.toastr.error('Failed to load client information');
        }
      });
  }

  private loadRecentDisputes(): void {
    this.disputesLoading = true;
    
    this.disputesService.getDisputes(
      { client_id: this.clientId },
      { page: 1, limit: 5, sort_by: 'created_date', sort_order: 'desc' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentDisputes = response.data;
          this.disputesLoading = false;
        },
        error: (error) => {
          console.error('Error loading disputes:', error);
          this.disputesLoading = false;
        }
      });
  }

  onEdit(): void {
    if (this.client) {
      this.router.navigate(['/clients/edit', this.client.id]);
    }
  }

  onDelete(): void {
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (this.client && !this.isDeleting) {
      this.isDeleting = true;
      
      this.clientsService.deleteClient(this.client.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Client deleted successfully');
            this.router.navigate(['/clients']);
          },
          error: (error) => {
            console.error('Error deleting client:', error);
            this.toastr.error('Failed to delete client');
            this.isDeleting = false;
            this.showDeleteConfirm = false;
          }
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  onCreateDispute(): void {
    if (this.client) {
      this.router.navigate(['/disputes/create'], {
        queryParams: { client_id: this.client.id }
      });
    }
  }

  onViewAllDisputes(): void {
    if (this.client) {
      this.router.navigate(['/disputes'], {
        queryParams: { client_id: this.client.id }
      });
    }
  }

  onViewDispute(dispute: Dispute): void {
    this.router.navigate(['/disputes/view', dispute.id]);
  }

  onRefresh(): void {
    this.loadClient();
    this.loadRecentDisputes();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Utility methods for template
  getFullName(): string {
    if (!this.client) return '';
    const parts = [this.client.firstName, this.client.middleName, this.client.lastName]
      .filter(part => part && part.trim().length > 0);
    return parts.join(' ');
  }

  getFormattedPhone(phone: string | undefined): string {
    if (!phone) return 'Not provided';
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  getFormattedSSN(ssn: string | undefined): string {
    if (!ssn) return 'Not provided';
    // Mask SSN for security
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return '***-**-****';
  }

  getFormattedAddress(address: any): string {
    if (!address || !address.street) return 'Not provided';
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip_code
    ].filter(part => part && part.trim().length > 0);
    
    return parts.join(', ');
  }

  getFormattedDate(date: string | Date | undefined): string {
    if (!date) return 'Not provided';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }

  getFormattedDateTime(date: string | Date | undefined): string {
    if (!date) return 'Not provided';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge bg-success';
      case 'inactive':
        return 'badge bg-secondary';
      case 'suspended':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  getDisputeStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'badge bg-secondary';
      case 'submitted':
        return 'badge bg-primary';
      case 'in_progress':
        return 'badge bg-info';
      case 'pending_response':
        return 'badge bg-warning';
      case 'under_review':
        return 'badge bg-warning';
      case 'resolved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      case 'escalated':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getDisputeTypeLabel(type: string): string {
    switch (type) {
      case 'account_dispute':
        return 'Account Dispute';
      case 'inquiry_dispute':
        return 'Inquiry Dispute';
      case 'personal_info':
        return 'Personal Information';
      case 'public_record':
        return 'Public Record';
      case 'mixed_file':
        return 'Mixed File';
      default:
        return type || 'Unknown';
    }
  }

  getBureauLabel(bureau: string): string {
    switch (bureau?.toLowerCase()) {
      case 'experian':
        return 'Experian';
      case 'equifax':
        return 'Equifax';
      case 'transunion':
        return 'TransUnion';
      default:
        return bureau || 'Unknown';
    }
  }

  getContactMethodLabel(method: string | undefined): string {
    switch (method?.toLowerCase()) {
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone';
      case 'text':
        return 'Text Message';
      case 'mail':
        return 'Mail';
      default:
        return method || 'Not specified';
    }
  }

  getFormattedIncome(income: number | undefined): string {
    if (!income || income === 0) return 'Not provided';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(income);
  }

  getClientAge(): string {
    if (!this.client?.dateOfBirth) return 'Not provided';
    
    try {
      const birthDate = new Date(this.client.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return `${age} years old`;
    } catch {
      return 'Invalid date';
    }
  }

  hasEmploymentInfo(): boolean {
    return !!(this.client?.employment?.employer_name || 
             this.client?.employment?.job_title ||
             this.client?.employment?.monthly_income);
  }

  hasPreviousAddress(): boolean {
    return !!(this.client?.previous_address?.street);
  }
}