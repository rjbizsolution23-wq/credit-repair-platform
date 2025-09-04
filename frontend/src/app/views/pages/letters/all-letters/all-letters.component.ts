import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import {
  GeneratedLetter,
  LetterTemplate,
  LetterCategory,
  LetterStatus,
  DeliveryMethod,
  RecipientType,
  getLetterCategoryLabel,
  getLetterStatusColor
} from '../../../../models/letter.model';
import { LetterService, LetterFilters, PaginatedResponse } from '../../../../services/letter.service';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-all-letters',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgbModule,
    FeatherIconDirective
  ],
  templateUrl: './all-letters.component.html',
  styleUrls: ['./all-letters.component.scss']
})
export class AllLettersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  letters: GeneratedLetter[] = [];
  clients: Client[] = [];
  templates: LetterTemplate[] = [];
  filteredLetters: GeneratedLetter[] = [];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Loading states
  loading = false;
  loadingClients = false;
  loadingTemplates = false;
  
  // Forms
  filterForm: FormGroup;
  
  // Filters
  showAdvancedFilters = false;
  
  // Selection
  selectedLetters: Set<string> = new Set();
  selectAll = false;
  
  // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Enums for template
  LetterCategory = LetterCategory;
  LetterStatus = LetterStatus;
  DeliveryMethod = DeliveryMethod;
  RecipientType = RecipientType;
  
  // Statistics
  stats = {
    total: 0,
    sent: 0,
    delivered: 0,
    responses: 0
  };

  // Math helper for template
  Math = Math;

  constructor(
    private letterService: LetterService,
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadTemplates();
    this.loadLetters();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      clientId: [''],
      category: [''],
      status: [''],
      recipientType: [''],
      deliveryMethod: [''],
      responseReceived: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadLetters();
      });
  }

  private loadClients(): void {
    this.loadingClients = true;
    this.clientService.getAllClients({ limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.clients = response.data;
          this.loadingClients = false;
        },
        error: (error: any) => {
          console.error('Error loading clients:', error);
          this.loadingClients = false;
        }
      });
  }

  private loadTemplates(): void {
    this.loadingTemplates = true;
    this.letterService.getTemplates({ limit: 1000, isActive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.templates = response.data;
          this.loadingTemplates = false;
        },
        error: (error: any) => {
          console.error('Error loading templates:', error);
          this.loadingTemplates = false;
        }
      });
  }

  loadLetters(): void {
    this.loading = true;
    const filters = this.buildFilters();
    
    this.letterService.getLetters(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse<GeneratedLetter>) => {
          this.letters = response.data;
          this.totalItems = response.total;
          this.totalPages = response.totalPages;
          this.calculateStats();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading letters:', error);
          this.loading = false;
        }
      });
  }

  private buildFilters(): LetterFilters {
    const formValue = this.filterForm.value;
    const filters: LetterFilters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    // Add non-empty filters
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'dateFrom' || key === 'dateTo') {
          (filters as any)[key] = new Date(value);
        } else if (key === 'responseReceived') {
          (filters as any)[key] = value === 'true';
        } else {
          (filters as any)[key] = value;
        }
      }
    });

    return filters;
  }

  private calculateStats(): void {
    this.stats = {
      total: this.totalItems,
      sent: this.letters.filter(l => l.status === LetterStatus.SENT || l.status === LetterStatus.DELIVERED).length,
      delivered: this.letters.filter(l => l.status === LetterStatus.DELIVERED).length,
      responses: this.letters.filter(l => l.responseReceived).length
    };
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLetters();
  }

  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = +target.value;
    this.currentPage = 1;
    this.loadLetters();
  }

  // Sorting
  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadLetters();
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'minus';
    return this.sortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  // Selection
  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.letters.forEach(letter => this.selectedLetters.add(letter.id));
    } else {
      this.selectedLetters.clear();
    }
  }

  toggleSelectLetter(letterId: string): void {
    if (this.selectedLetters.has(letterId)) {
      this.selectedLetters.delete(letterId);
    } else {
      this.selectedLetters.add(letterId);
    }
    this.selectAll = this.selectedLetters.size === this.letters.length;
  }

  isSelected(letterId: string): boolean {
    return this.selectedLetters.has(letterId);
  }

  // Bulk Actions
  bulkSend(): void {
    if (this.selectedLetters.size === 0) return;
    
    const letterIds = Array.from(this.selectedLetters);
    this.letterService.bulkSendLetters(letterIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Bulk send result:', result);
          this.selectedLetters.clear();
          this.selectAll = false;
          this.loadLetters();
        },
        error: (error) => {
          console.error('Error sending letters:', error);
        }
      });
  }

  bulkDelete(): void {
    if (this.selectedLetters.size === 0) return;
    
    if (confirm('Are you sure you want to delete the selected letters?')) {
      const letterIds = Array.from(this.selectedLetters);
      this.letterService.bulkDeleteLetters(letterIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.selectedLetters.clear();
            this.selectAll = false;
            this.loadLetters();
          },
          error: (error) => {
            console.error('Error deleting letters:', error);
          }
        });
    }
  }

  // Individual Actions
  sendLetter(letterId: string): void {
    this.letterService.sendLetter(letterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadLetters();
        },
        error: (error) => {
          console.error('Error sending letter:', error);
        }
      });
  }

  cancelLetter(letterId: string): void {
    if (confirm('Are you sure you want to cancel this letter?')) {
      this.letterService.cancelLetter(letterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadLetters();
          },
          error: (error) => {
            console.error('Error cancelling letter:', error);
          }
        });
    }
  }

  deleteLetter(letterId: string): void {
    if (confirm('Are you sure you want to delete this letter?')) {
      this.letterService.deleteLetter(letterId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadLetters();
          },
          error: (error) => {
            console.error('Error deleting letter:', error);
          }
        });
    }
  }

  downloadLetter(letterId: string, format: 'pdf' | 'docx' = 'pdf'): void {
    this.letterService.downloadLetter(letterId, format)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `letter-${letterId}.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading letter:', error);
        }
      });
  }

  // Export
  exportLetters(format: 'csv' | 'excel' | 'pdf' = 'csv'): void {
    const filters = this.buildFilters();
    this.letterService.exportLetters(filters, format)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `letters-export.${format}`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting letters:', error);
        }
      });
  }

  // Filters
  clearFilters(): void {
    this.filterForm.reset();
    this.showAdvancedFilters = false;
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Utility methods
  getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  }

  getCategoryLabel(category: LetterCategory): string {
    return getLetterCategoryLabel(category);
  }

  getCategoryFromTemplateId(templateId: string): LetterCategory | null {
    const template = this.templates.find(t => t.id === templateId);
    return template ? template.category : null;
  }

  getStatusColor(status: LetterStatus): string {
    return getLetterStatusColor(status);
  }

  getStatusIcon(status: LetterStatus): string {
    const icons = {
      [LetterStatus.DRAFT]: 'edit-3',
      [LetterStatus.PENDING_REVIEW]: 'clock',
      [LetterStatus.APPROVED]: 'check-circle',
      [LetterStatus.SCHEDULED]: 'calendar',
      [LetterStatus.SENT]: 'send',
      [LetterStatus.DELIVERED]: 'check-circle',
      [LetterStatus.FAILED]: 'x-circle',
      [LetterStatus.RESPONSE_RECEIVED]: 'mail',
      [LetterStatus.COMPLETED]: 'check-circle',
      [LetterStatus.CANCELLED]: 'x-circle'
    };
    return icons[status] || 'file-text';
  }

  getDeliveryMethodIcon(method: DeliveryMethod): string {
    const icons = {
      [DeliveryMethod.EMAIL]: 'mail',
      [DeliveryMethod.USPS_FIRST_CLASS]: 'mail',
      [DeliveryMethod.USPS_CERTIFIED]: 'shield',
      [DeliveryMethod.USPS_PRIORITY]: 'zap',
      [DeliveryMethod.FEDEX]: 'truck',
      [DeliveryMethod.UPS]: 'truck',
      [DeliveryMethod.HAND_DELIVERY]: 'user',
      [DeliveryMethod.FAX]: 'printer'
    };
    return icons[method] || 'send';
  }

  getRecipientTypeIcon(type: RecipientType): string {
    const icons = {
      [RecipientType.CREDIT_BUREAU]: 'database',
      [RecipientType.CREDITOR]: 'credit-card',
      [RecipientType.COLLECTION_AGENCY]: 'phone',
      [RecipientType.DATA_FURNISHER]: 'server',
      [RecipientType.ATTORNEY_GENERAL]: 'shield',
      [RecipientType.CFPB]: 'shield',
      [RecipientType.FTC]: 'shield',
      [RecipientType.COURT]: 'home'
    };
    return icons[type] || 'user';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  getDaysAgo(date: Date | string): number {
    if (!date) return 0;
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canSendLetter(letter: GeneratedLetter): boolean {
    return letter.status === LetterStatus.APPROVED || letter.status === LetterStatus.SCHEDULED;
  }

  canCancelLetter(letter: GeneratedLetter): boolean {
    return letter.status === LetterStatus.SCHEDULED || letter.status === LetterStatus.PENDING_REVIEW;
  }

  canEditLetter(letter: GeneratedLetter): boolean {
    return letter.status === LetterStatus.DRAFT;
  }

  trackByLetterId(index: number, letter: GeneratedLetter): string {
    return letter.id;
  }
}