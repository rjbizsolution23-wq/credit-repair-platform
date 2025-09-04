import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DisputesService } from '../disputes.service';
import { DisputeTemplate, DisputeType } from '../disputes.model';

interface FilterOptions {
  category: string;
  type: string;
  status: string;
  searchTerm: string;
}

@Component({
  selector: 'app-dispute-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './dispute-templates.component.html',
  styleUrls: ['./dispute-templates.component.scss']
})
export class DisputeTemplatesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  
  templates: DisputeTemplate[] = [];
  filteredTemplates: DisputeTemplate[] = [];
  loading = true;
  error: string | null = null;
  
  // UI State
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showPreviewModal = false;
  showImportModal = false;
  selectedTemplate: DisputeTemplate | null = null;
  
  // Forms
  templateForm: FormGroup;
  importForm: FormGroup;
  
  // Filters
  filters: FilterOptions = {
    category: 'all',
    type: 'all',
    status: 'all',
    searchTerm: ''
  };

  // Handle tags input
  onTagsChange(event: any): void {
    const value = event.target.value;
    const tags = value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    this.templateForm.patchValue({ tags });
  }
  
  // Filter Options
  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'credit_report_errors', label: 'Credit Report Errors' },
    { value: 'identity_theft', label: 'Identity Theft' },
    { value: 'debt_validation', label: 'Debt Validation' },
    { value: 'goodwill_letters', label: 'Goodwill Letters' },
    { value: 'cease_and_desist', label: 'Cease and Desist' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'escalation', label: 'Escalation' },
    { value: 'custom', label: 'Custom' }
  ];
  
  typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: DisputeType.ACCOUNT_DISPUTE, label: 'Account Dispute' },
    { value: DisputeType.INQUIRY_DISPUTE, label: 'Inquiry Dispute' },
    { value: DisputeType.PERSONAL_INFO, label: 'Personal Information' },
    { value: DisputeType.PUBLIC_RECORD, label: 'Public Record' },
    { value: DisputeType.MIXED_FILE, label: 'Mixed File' }
  ];
  
  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'draft', label: 'Draft' }
  ];
  
  // Template Variables
  availableVariables = [
    { key: '{{client_name}}', description: 'Client full name' },
    { key: '{{client_first_name}}', description: 'Client first name' },
    { key: '{{client_last_name}}', description: 'Client last name' },
    { key: '{{client_address}}', description: 'Client address' },
    { key: '{{client_city}}', description: 'Client city' },
    { key: '{{client_state}}', description: 'Client state' },
    { key: '{{client_zip}}', description: 'Client ZIP code' },
    { key: '{{client_phone}}', description: 'Client phone number' },
    { key: '{{client_email}}', description: 'Client email address' },
    { key: '{{client_ssn}}', description: 'Client SSN (last 4 digits)' },
    { key: '{{client_dob}}', description: 'Client date of birth' },
    { key: '{{dispute_reference}}', description: 'Dispute reference number' },
    { key: '{{dispute_date}}', description: 'Dispute creation date' },
    { key: '{{bureau_name}}', description: 'Credit bureau name' },
    { key: '{{bureau_address}}', description: 'Credit bureau address' },
    { key: '{{account_number}}', description: 'Account number' },
    { key: '{{creditor_name}}', description: 'Creditor name' },
    { key: '{{account_type}}', description: 'Account type' },
    { key: '{{dispute_reason}}', description: 'Dispute reason' },
    { key: '{{current_date}}', description: 'Current date' },
    { key: '{{company_name}}', description: 'Company name' },
    { key: '{{company_address}}', description: 'Company address' },
    { key: '{{company_phone}}', description: 'Company phone' },
    { key: '{{company_email}}', description: 'Company email' }
  ];
  
  // Enums for template
  DisputeType = DisputeType;
  
  constructor(
    private disputesService: DisputesService,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.setupSearch();
    this.loadTemplates();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  initializeForms(): void {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      category: ['', Validators.required],
      type: ['', Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(50)]],
      isActive: [true],
      tags: [[]],
      variables: [[]]
    });
    
    this.importForm = this.fb.group({
      file: [null, Validators.required],
      overwriteExisting: [false],
      validateTemplates: [true]
    });
  }
  
  setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.filters.searchTerm = searchTerm;
        this.applyFilters();
      });
  }
  
  loadTemplates(): void {
    this.loading = true;
    this.error = null;
    
    this.disputesService.getDisputeTemplates(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates: DisputeTemplate[]) => {
          this.templates = templates;
          this.applyFilters();
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load dispute templates';
          this.loading = false;
          console.error('Error loading templates:', error);
        }
      });
  }
  
  // Search and Filter Methods
  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }
  
  onFilterChange(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    let filtered = [...this.templates];
    
    // Apply category filter
    // Category filter removed as it doesn't exist in DisputeTemplate interface
    
    // Apply type filter
    if (this.filters.type !== 'all') {
      filtered = filtered.filter(template => template.type === this.filters.type);
    }
    
    // Apply status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(template => {
        switch (this.filters.status) {
          case 'active': return template.is_active;
          case 'inactive': return !template.is_active;
          case 'draft': return false; // No draft status in current model
          default: return true;
        }
      });
    }
    
    // Apply search filter
    if (this.filters.searchTerm) {
      const searchLower = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.subject.toLowerCase().includes(searchLower) ||
        template.content.toLowerCase().includes(searchLower)
      );
    }
    
    this.filteredTemplates = filtered;
  }
  
  clearFilters(): void {
    this.filters = {
      category: 'all',
      type: 'all',
      status: 'all',
      searchTerm: ''
    };
    this.applyFilters();
  }
  
  // Template Management Methods
  createTemplate(): void {
    this.selectedTemplate = null;
    this.templateForm.reset({
      isActive: true,
      tags: [],
      variables: []
    });
    this.showCreateModal = true;
  }
  
  editTemplate(template: DisputeTemplate): void {
    this.selectedTemplate = template;
    this.templateForm.patchValue({
      name: template.name,
      type: template.type,
      bureau: template.bureau,
      subject: template.subject,
      content: template.content,
      is_active: template.is_active,
      variables: template.variables || []
    });
    this.showEditModal = true;
  }
  
  saveTemplate(): void {
    if (this.templateForm.valid) {
      const templateData = this.templateForm.value;
      
      const request = this.selectedTemplate
        ? this.disputesService.updateTemplate(this.selectedTemplate.id, templateData)
        : this.disputesService.createTemplate(templateData);
      
      request.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModals();
            this.loadTemplates();
          },
          error: (error: any) => {
            console.error('Error saving template:', error);
          }
        });
    }
  }
  
  confirmDelete(template: DisputeTemplate): void {
    this.selectedTemplate = template;
    this.showDeleteModal = true;
  }
  
  deleteTemplate(): void {
    if (this.selectedTemplate) {
      this.disputesService.deleteTemplate(this.selectedTemplate.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeModals();
            this.loadTemplates();
          },
          error: (error: any) => {
            console.error('Error deleting template:', error);
          }
        });
    }
  }
  
  duplicateTemplate(template: DisputeTemplate): void {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined
    };
    
    this.disputesService.createTemplate(duplicatedTemplate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (error: any) => {
          console.error('Error duplicating template:', error);
        }
      });
  }
  
  toggleTemplateStatus(template: DisputeTemplate): void {
    const updatedTemplate = { ...template, is_active: !template.is_active };
    
    this.disputesService.updateTemplate(template.id, updatedTemplate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTemplates();
        },
        error: (error) => {
          console.error('Error updating template status:', error);
        }
      });
  }
  
  // Preview Methods
  previewTemplate(template: DisputeTemplate): void {
    this.selectedTemplate = template;
    this.showPreviewModal = true;
  }
  
  generatePreview(template: DisputeTemplate): string {
    // Replace template variables with sample data
    let preview = template.content;
    
    const sampleData: { [key: string]: string } = {
      '{{client_name}}': 'John Doe',
      '{{client_first_name}}': 'John',
      '{{client_last_name}}': 'Doe',
      '{{client_address}}': '123 Main St',
      '{{client_city}}': 'Anytown',
      '{{client_state}}': 'CA',
      '{{client_zip}}': '12345',
      '{{client_phone}}': '(555) 123-4567',
      '{{client_email}}': 'john.doe@example.com',
      '{{client_ssn}}': '****1234',
      '{{client_dob}}': '01/01/1980',
      '{{dispute_reference}}': 'DSP-2024-001',
      '{{dispute_date}}': new Date().toLocaleDateString(),
      '{{bureau_name}}': 'Experian',
      '{{bureau_address}}': 'P.O. Box 4500, Allen, TX 75013',
      '{{account_number}}': '****5678',
      '{{creditor_name}}': 'Sample Bank',
      '{{account_type}}': 'Credit Card',
      '{{dispute_reason}}': 'Account not mine',
      '{{current_date}}': new Date().toLocaleDateString(),
      '{{company_name}}': 'Credit Repair Pro',
      '{{company_address}}': '456 Business Ave, Suite 100',
      '{{company_phone}}': '(555) 987-6543',
      '{{company_email}}': 'info@creditrepairpro.com'
    };
    
    Object.keys(sampleData).forEach(key => {
      preview = preview.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), sampleData[key]);
    });
    
    return preview;
  }
  
  // Import/Export Methods
  importTemplates(): void {
    this.importForm.reset({
      overwriteExisting: false,
      validateTemplates: true
    });
    this.showImportModal = true;
  }
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.importForm.patchValue({ file });
    }
  }
  
  processImport(): void {
    if (this.importForm.valid) {
      const formData = new FormData();
      formData.append('file', this.importForm.get('file')?.value);
      formData.append('overwriteExisting', this.importForm.get('overwriteExisting')?.value);
      formData.append('validateTemplates', this.importForm.get('validateTemplates')?.value);
      
      this.disputesService.importDisputeTemplates(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result: any) => {
            this.closeModals();
            this.loadTemplates();
            console.log('Import result:', result);
          },
          error: (error) => {
            console.error('Error importing templates:', error);
          }
        });
    }
  }
  
  exportTemplates(): void {
    this.disputesService.exportDisputeTemplates(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `dispute-templates-${new Date().toISOString().split('T')[0]}.json`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting templates:', error);
        }
      });
  }
  
  // Utility Methods
  insertVariable(variable: string): void {
    const contentControl = document.getElementById('templateContent') as HTMLTextAreaElement;
    if (contentControl) {
      const start = contentControl.selectionStart;
      const end = contentControl.selectionEnd;
      const currentValue = this.templateForm.get('content')?.value || '';
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      
      this.templateForm.patchValue({ content: newValue });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        contentControl.focus();
        contentControl.setSelectionRange(start + variable.length, start + variable.length);
      });
    }
  }
  
  // Track by function for ngFor performance
  trackByTemplateId(index: number, template: DisputeTemplate): string {
    return template.id;
  }
  
  getTemplateIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'credit_report_errors': 'fa-exclamation-triangle',
      'identity_theft': 'fa-user-shield',
      'debt_validation': 'fa-search-dollar',
      'goodwill_letters': 'fa-heart',
      'cease_and_desist': 'fa-stop-circle',
      'follow_up': 'fa-reply',
      'escalation': 'fa-level-up-alt',
      'custom': 'fa-cog'
    };
    return iconMap[category] || 'fa-file-alt';
  }
  
  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Modal Management
  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showPreviewModal = false;
    this.showImportModal = false;
    this.selectedTemplate = null;
  }
  
  // Refresh Data
  refresh(): void {
    this.loadTemplates();
  }
}