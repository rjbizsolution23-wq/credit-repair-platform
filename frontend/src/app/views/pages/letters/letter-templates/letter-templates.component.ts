import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  LetterTemplate, 
  LetterCategory, 
  LetterType, 
  TemplateVariable,
  VariableType,
  VariableCategory,
  ComplianceStatus
} from '../../../../models/letter.model';
import { LetterService } from '../../../../services/letter.service';

interface TemplateFilters {
  search: string;
  category: LetterCategory | '';
  type: LetterType | '';
  compliance: ComplianceStatus | '';
  isActive: boolean | null;
}

interface TemplateStats {
  total: number;
  active: number;
  compliance: number;
  usage: number;
}

@Component({
  selector: 'app-letter-templates',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './letter-templates.component.html',
  styleUrls: ['./letter-templates.component.scss']
})
export class LetterTemplatesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  templates: LetterTemplate[] = [];
  filteredTemplates: LetterTemplate[] = [];
  selectedTemplates: string[] = [];
  stats: TemplateStats = {
    total: 0,
    active: 0,
    compliance: 0,
    usage: 0
  };

  // UI State
  loading = false;
  error: string | null = null;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showBulkActions = false;
  editingTemplate: LetterTemplate | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filters
  filters: TemplateFilters = {
    search: '',
    category: '',
    type: '',
    compliance: '',
    isActive: null
  };

  // Forms
  templateForm: FormGroup;
  filterForm: FormGroup;

  // Enums for template
  LetterCategory = LetterCategory;
  LetterType = LetterType;
  VariableType = VariableType;
  VariableCategory = VariableCategory;
  ComplianceStatus = ComplianceStatus;
  
  // Math utility for template
  Math = Math;

  constructor(
    private letterService: LetterService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.loadStats();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      type: ['', Validators.required],
      subject: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(50)]],
      variables: this.fb.array([]),
      isActive: [true],
      tags: [''],
      estimatedTime: [''],
      effectiveness: [''],
      legalReferences: [''],
      complianceNotes: ['']
    });

    this.filterForm = this.fb.group({
      search: [''],
      category: [''],
      type: [''],
      compliance: [''],
      isActive: [null]
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
        this.filters = { ...filters };
        this.applyFilters();
      });
  }

  loadTemplates(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortDirection,
      search: this.filters.search || undefined,
      category: this.filters.category || undefined,
      type: this.filters.type || undefined,
      isActive: this.filters.isActive
    };
    
    // Remove empty string values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    this.letterService.getTemplates(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.templates = response.data;
          this.totalItems = response.total;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.applyFilters();
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load templates';
          this.loading = false;
          console.error('Error loading templates:', error);
        }
      });
  }

  private loadStats(): void {
    // Use filtered templates to calculate stats since getTemplateStats may not be available
    this.stats = {
      total: this.filteredTemplates.length,
      active: this.filteredTemplates.filter(t => t.isActive).length,
      compliance: this.filteredTemplates.filter(t => t.isActive).length, // Mock compliance count
      usage: this.filteredTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0)
    };
  }
  
  private getCategoryStats(): any {
    const categories: any = {};
    this.filteredTemplates.forEach(template => {
      categories[template.category] = (categories[template.category] || 0) + 1;
    });
    return categories;
  }

  private applyFilters(): void {
    let filtered = [...this.templates];

    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(search) ||
        template.description?.toLowerCase().includes(search) ||
        template.tags?.some((tag: any) => tag.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (this.filters.category) {
      filtered = filtered.filter(template => template.category === this.filters.category);
    }

    // Type filter
    if (this.filters.type) {
      filtered = filtered.filter(template => template.type === this.filters.type);
    }

    // Compliance filter - removed as complianceStatus is not part of LetterTemplate interface
    // if (this.filters.compliance) {
    //   filtered = filtered.filter(template => template.complianceStatus === this.filters.compliance);
    // }

    // Active filter
    if (this.filters.isActive !== null) {
      filtered = filtered.filter(template => template.isActive === this.filters.isActive);
    }

    this.filteredTemplates = filtered;
  }

  // Template Actions
  onCreateTemplate(): void {
    this.editingTemplate = null;
    this.templateForm.reset({
      isActive: true
    });
    this.showCreateModal = true;
  }

  onEditTemplate(template: LetterTemplate): void {
    this.editingTemplate = template;
    this.templateForm.patchValue({
      name: template.name,
      description: template.description,
      category: template.category,
      type: template.type,
      subject: template.subject,
      content: template.content,
      isActive: template.isActive,
      tags: template.tags?.join(', ') || '',
      priority: template.priority,
      legalBasis: template.legalBasis || '',
      requiredDocuments: template.requiredDocuments?.join('\n') || '',
      followUpDays: template.followUpDays || 30
    });
    this.showEditModal = true;
  }

  onDuplicateTemplate(template: LetterTemplate): void {
    this.editingTemplate = null;
    this.templateForm.patchValue({
      name: `${template.name} (Copy)`,
      description: template.description,
      category: template.category,
      type: template.type,
      subject: template.subject,
      content: template.content,
      isActive: false,
      tags: template.tags?.join(', ') || '',
      legalBasis: template.legalBasis || '',
      requiredDocuments: template.requiredDocuments?.join('\n') || '',
      followUpDays: template.followUpDays || 30
    });
    this.showCreateModal = true;
  }

  onDeleteTemplate(template: LetterTemplate): void {
    this.editingTemplate = template;
    this.showDeleteModal = true;
  }

  onToggleTemplateStatus(template: LetterTemplate): void {
    const updatedTemplate = {
      ...template,
      isActive: !template.isActive
    };

    this.letterService.updateTemplate(template.id, updatedTemplate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTemplates();
          this.loadStats();
        },
        error: (error: any) => {
          console.error('Error updating template status:', error);
        }
      });
  }

  // Form Actions
  onSubmitTemplate(): void {
    if (this.templateForm.valid) {
      const formValue = this.templateForm.value;
      const templateData = {
        ...formValue,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
        legalReferences: formValue.legalReferences ? formValue.legalReferences.split('\n').filter((ref: string) => ref.trim()) : [],
        variables: [] // Will be managed separately
      };

      const request = this.editingTemplate
        ? this.letterService.updateTemplate(this.editingTemplate.id, templateData)
        : this.letterService.createTemplate(templateData);

      request.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModals();
            this.loadTemplates();
            this.loadStats();
          },
          error: (error: any) => {
            console.error('Error saving template:', error);
          }
        });
    }
  }

  onConfirmDelete(): void {
    if (this.editingTemplate) {
      this.letterService.deleteTemplate(this.editingTemplate.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModals();
            this.loadTemplates();
            this.loadStats();
          },
          error: (error: any) => {
            console.error('Error deleting template:', error);
          }
        });
    }
  }

  // Bulk Actions
  onSelectTemplate(templateId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedTemplates.push(templateId);
    } else {
      this.selectedTemplates = this.selectedTemplates.filter(id => id !== templateId);
    }
    this.showBulkActions = this.selectedTemplates.length > 0;
  }

  onSelectAllTemplates(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedTemplates = this.filteredTemplates.map(template => template.id);
    } else {
      this.selectedTemplates = [];
    }
    this.showBulkActions = this.selectedTemplates.length > 0;
  }

  onBulkActivate(): void {
    // Update templates one by one since there's no bulk update for templates
    const updatePromises = this.selectedTemplates.map(id => 
      this.letterService.updateTemplate(id, { isActive: true }).toPromise()
    );
    
    Promise.all(updatePromises)
      .then(() => {
        this.selectedTemplates = [];
        this.showBulkActions = false;
        this.loadTemplates();
        this.loadStats();
      })
      .catch((error: any) => {
        console.error('Error activating templates:', error);
      });
  }

  onBulkDeactivate(): void {
    // Update templates one by one since there's no bulk update for templates
    const updatePromises = this.selectedTemplates.map(id => 
      this.letterService.updateTemplate(id, { isActive: false }).toPromise()
    );
    
    Promise.all(updatePromises)
      .then(() => {
        this.selectedTemplates = [];
        this.showBulkActions = false;
        this.loadTemplates();
        this.loadStats();
      })
      .catch((error: any) => {
        console.error('Error deactivating templates:', error);
      });
  }

  onBulkDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.selectedTemplates.length} templates?`)) {
      // Delete templates one by one since there's no bulk delete for templates
      const deletePromises = this.selectedTemplates.map(id => 
        this.letterService.deleteTemplate(id).toPromise()
      );
      
      Promise.all(deletePromises)
        .then(() => {
          this.selectedTemplates = [];
          this.showBulkActions = false;
          this.loadTemplates();
          this.loadStats();
        })
        .catch((error: any) => {
          console.error('Error deleting templates:', error);
        });
    }
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTemplates();
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = +target.value;
    this.currentPage = 1;
    this.loadTemplates();
  }

  // Sorting
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadTemplates();
  }

  // Filters
  onToggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onClearFilters(): void {
    this.filterForm.reset({
      search: '',
      category: '',
      type: '',
      compliance: '',
      isActive: null
    });
  }

  // Export/Import
  onExportTemplates(): void {
    const templateIds = this.selectedTemplates.length > 0 ? this.selectedTemplates : undefined;
    this.letterService.exportTemplates('json')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `letter-templates-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error exporting templates:', error);
        }
      });
  }

  onImportTemplates(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.letterService.importTemplates(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadTemplates();
            this.loadStats();
            input.value = ''; // Reset file input
          },
          error: (error: any) => {
            console.error('Error importing templates:', error);
          }
        });
    }
  }

  // Navigation
  onViewTemplate(template: LetterTemplate): void {
    this.router.navigate(['/letters/templates', template.id]);
  }

  onManageVariables(template: LetterTemplate): void {
    this.router.navigate(['/letters/templates', template.id, 'variables']);
  }

  // Modal Management
  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.editingTemplate = null;
  }

  // Utility Methods
  isTemplateSelected(templateId: string): boolean {
    return this.selectedTemplates.includes(templateId);
  }

  isAllTemplatesSelected(): boolean {
    return this.filteredTemplates.length > 0 && 
           this.filteredTemplates.every(template => this.selectedTemplates.includes(template.id));
  }

  isSomeTemplatesSelected(): boolean {
    return this.selectedTemplates.length > 0 && 
           this.selectedTemplates.length < this.filteredTemplates.length;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.templateForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.templateForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['email']) return 'Invalid email format';
    }
    return '';
  }

  getCategoryLabel(category: LetterCategory): string {
    const labels: Record<LetterCategory, string> = {
      [LetterCategory.DISPUTE]: 'Dispute Letters',
      [LetterCategory.VALIDATION]: 'Debt Validation',
      [LetterCategory.GOODWILL]: 'Goodwill Letters',
      [LetterCategory.CEASE_DESIST]: 'Cease & Desist',
      [LetterCategory.METHOD_OF_VERIFICATION]: 'Method of Verification',
      [LetterCategory.INTENT_TO_SUE]: 'Intent to Sue',
      [LetterCategory.FOLLOW_UP]: 'Follow-up Letters',
      [LetterCategory.ESCALATION]: 'Escalation Letters',
      [LetterCategory.COMPLAINT]: 'Complaint Letters',
      [LetterCategory.SETTLEMENT]: 'Settlement Letters',
      [LetterCategory.PAYMENT_PLAN]: 'Payment Plan Letters'
    };
    return labels[category] || category;
  }

  getTypeLabel(type: LetterType): string {
    const labels: Record<LetterType, string> = {
      [LetterType.INITIAL]: 'Initial',
      [LetterType.FOLLOW_UP]: 'Follow Up',
      [LetterType.FINAL_NOTICE]: 'Final Notice',
      [LetterType.LEGAL_NOTICE]: 'Legal Notice',
      [LetterType.SETTLEMENT_OFFER]: 'Settlement Offer',
      [LetterType.COMPLAINT_FILING]: 'Complaint Filing'
    };
    return labels[type] || type;
  }

  getComplianceStatusColor(status: ComplianceStatus): string {
    const colors: Record<ComplianceStatus, string> = {
      [ComplianceStatus.COMPLIANT]: 'success',
      [ComplianceStatus.NEEDS_REVIEW]: 'warning',
      [ComplianceStatus.NON_COMPLIANT]: 'danger',
      [ComplianceStatus.PENDING_APPROVAL]: 'info'
    };
    return colors[status] || 'secondary';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatUsageCount(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  trackByTemplateId(index: number, template: LetterTemplate): string {
    return template.id;
  }
}