import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientsService } from '../clients.service';
import { Client } from '../clients.model';

interface ExportFormat {
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface ExportField {
  key: string;
  label: string;
  category: string;
  selected: boolean;
}

interface ExportOptions {
  format: string;
  includeHeaders: boolean;
  dateFormat: string;
  encoding: string;
  delimiter: string;
  includeDeleted: boolean;
  includeInactive: boolean;
}

interface ExportFilter {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  status: string[];
  tags: string[];
  searchTerm: string;
}

@Component({
  selector: 'app-export-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './export-clients.component.html',
  styleUrls: ['./export-clients.component.scss']
})
export class ExportClientsComponent implements OnInit {
  exportForm: FormGroup;
  isLoading = false;
  isExporting = false;
  error: string | null = null;
  
  // Export configuration
  availableFormats: ExportFormat[] = [
    {
      value: 'csv',
      label: 'CSV',
      description: 'Comma-separated values, compatible with Excel',
      icon: 'fas fa-file-csv'
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Microsoft Excel format (.xlsx)',
      icon: 'fas fa-file-excel'
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Portable Document Format for reports',
      icon: 'fas fa-file-pdf'
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'JavaScript Object Notation for developers',
      icon: 'fas fa-file-code'
    }
  ];
  
  availableFields: ExportField[] = [
    // Personal Information
    { key: 'firstName', label: 'First Name', category: 'Personal', selected: true },
    { key: 'lastName', label: 'Last Name', category: 'Personal', selected: true },
    { key: 'middleName', label: 'Middle Name', category: 'Personal', selected: false },
    { key: 'dateOfBirth', label: 'Date of Birth', category: 'Personal', selected: true },
    { key: 'ssn', label: 'Social Security Number', category: 'Personal', selected: false },
    { key: 'gender', label: 'Gender', category: 'Personal', selected: false },
    
    // Contact Information
    { key: 'email', label: 'Email Address', category: 'Contact', selected: true },
    { key: 'phone', label: 'Phone Number', category: 'Contact', selected: true },
    { key: 'alternatePhone', label: 'Alternate Phone', category: 'Contact', selected: false },
    
    // Address Information
    { key: 'currentAddress', label: 'Current Address', category: 'Address', selected: true },
    { key: 'currentCity', label: 'Current City', category: 'Address', selected: true },
    { key: 'currentState', label: 'Current State', category: 'Address', selected: true },
    { key: 'currentZip', label: 'Current ZIP Code', category: 'Address', selected: true },
    { key: 'previousAddress', label: 'Previous Address', category: 'Address', selected: false },
    { key: 'previousCity', label: 'Previous City', category: 'Address', selected: false },
    { key: 'previousState', label: 'Previous State', category: 'Address', selected: false },
    { key: 'previousZip', label: 'Previous ZIP Code', category: 'Address', selected: false },
    
    // Employment Information
    { key: 'employer', label: 'Employer', category: 'Employment', selected: false },
    { key: 'jobTitle', label: 'Job Title', category: 'Employment', selected: false },
    { key: 'workPhone', label: 'Work Phone', category: 'Employment', selected: false },
    { key: 'annualIncome', label: 'Annual Income', category: 'Employment', selected: false },
    
    // Account Information
    { key: 'status', label: 'Status', category: 'Account', selected: true },
    { key: 'createdAt', label: 'Created Date', category: 'Account', selected: true },
    { key: 'updatedAt', label: 'Updated Date', category: 'Account', selected: false },
    { key: 'lastLoginAt', label: 'Last Login', category: 'Account', selected: false },
    { key: 'tags', label: 'Tags', category: 'Account', selected: false },
    { key: 'notes', label: 'Notes', category: 'Account', selected: false }
  ];
  
  exportOptions: ExportOptions = {
    format: 'csv',
    includeHeaders: true,
    dateFormat: 'MM/dd/yyyy',
    encoding: 'utf-8',
    delimiter: ',',
    includeDeleted: false,
    includeInactive: false
  };
  
  exportFilter: ExportFilter = {
    dateRange: {
      start: null,
      end: null
    },
    status: [],
    tags: [],
    searchTerm: ''
  };
  
  // Statistics
  totalClients = 0;
  filteredClients = 0;
  selectedFields = 0;
  
  // Available options
  availableStatuses = ['Active', 'Inactive', 'Pending', 'Suspended'];
  availableTags: string[] = [];
  fieldCategories: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientsService: ClientsService
  ) {
    this.exportForm = this.createForm();
  }
  
  ngOnInit(): void {
    this.initializeComponent();
  }
  
  private createForm(): FormGroup {
    return this.fb.group({
      format: [this.exportOptions.format, Validators.required],
      includeHeaders: [this.exportOptions.includeHeaders],
      dateFormat: [this.exportOptions.dateFormat, Validators.required],
      encoding: [this.exportOptions.encoding, Validators.required],
      delimiter: [this.exportOptions.delimiter],
      includeDeleted: [this.exportOptions.includeDeleted],
      includeInactive: [this.exportOptions.includeInactive],
      searchTerm: [this.exportFilter.searchTerm],
      dateRangeStart: [this.exportFilter.dateRange.start],
      dateRangeEnd: [this.exportFilter.dateRange.end]
    });
  }
  
  private async initializeComponent(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      
      // Get field categories
      this.fieldCategories = [...new Set(this.availableFields.map(field => field.category))];
      
      // Load statistics and available options
      await this.loadStatistics();
      await this.loadAvailableOptions();
      
      // Update selected fields count
      this.updateSelectedFieldsCount();
      
      // Update filtered clients count
      this.updateFilteredClientsCount();
      
    } catch (error: any) {
      console.error('Error initializing export clients:', error);
      this.error = 'Failed to load export options. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
  
  private async loadStatistics(): Promise<void> {
    try {
      const stats = await this.clientsService.getClientStats().toPromise();
      this.totalClients = stats.total;
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  }
  
  private async loadAvailableOptions(): Promise<void> {
    try {
      // Load available tags
      const tags = await this.clientsService.getAvailableTags().toPromise();
      this.availableTags = tags || [];
    } catch (error: any) {
      console.error('Error loading available options:', error);
    }
  }
  
  // Field selection methods
  onFieldSelectionChange(field: ExportField): void {
    field.selected = !field.selected;
    this.updateSelectedFieldsCount();
  }
  
  onCategorySelectionChange(category: string, selected: boolean): void {
    this.availableFields
      .filter(field => field.category === category)
      .forEach(field => field.selected = selected);
    this.updateSelectedFieldsCount();
  }
  
  selectAllFields(): void {
    this.availableFields.forEach(field => field.selected = true);
    this.updateSelectedFieldsCount();
  }
  
  deselectAllFields(): void {
    this.availableFields.forEach(field => field.selected = false);
    this.updateSelectedFieldsCount();
  }
  
  private updateSelectedFieldsCount(): void {
    this.selectedFields = this.availableFields.filter(field => field.selected).length;
  }
  
  // Filter methods
  onFilterChange(): void {
    this.updateFilteredClientsCount();
  }
  
  private async updateFilteredClientsCount(): Promise<void> {
    try {
      const filters = this.buildFilters();
      const count = await this.clientsService.getFilteredClientCount(filters).toPromise();
      this.filteredClients = count?.count || 0;
    } catch (error: any) {
      console.error('Error updating filtered clients count:', error);
      this.filteredClients = this.totalClients;
    }
  }
  
  private buildFilters(): any {
    const formValue = this.exportForm.value;
    
    return {
      searchTerm: formValue.searchTerm,
      dateRange: {
        start: formValue.dateRangeStart,
        end: formValue.dateRangeEnd
      },
      status: this.exportFilter.status,
      tags: this.exportFilter.tags,
      includeDeleted: formValue.includeDeleted,
      includeInactive: formValue.includeInactive
    };
  }
  
  // Export methods
  async onExport(): Promise<void> {
    if (this.exportForm.invalid || this.selectedFields === 0) {
      this.error = 'Please select at least one field to export and ensure all required fields are filled.';
      return;
    }
    
    try {
      this.isExporting = true;
      this.error = null;
      
      const exportData = this.buildExportData();
      
      // Start export
      const result = await this.clientsService.exportClients(exportData).toPromise();
      
      if (result.success) {
        // Download the file
        this.downloadFile(result.downloadUrl, result.filename);
        
        // Show success message
        this.showSuccessMessage(`Successfully exported ${this.filteredClients} clients.`);
      } else {
        throw new Error(result.message || 'Export failed');
      }
      
    } catch (error: any) {
      console.error('Error exporting clients:', error);
      this.error = error.message || 'Failed to export clients. Please try again.';
    } finally {
      this.isExporting = false;
    }
  }
  
  private buildExportData(): any {
    const formValue = this.exportForm.value;
    
    return {
      format: formValue.format,
      fields: this.availableFields
        .filter(field => field.selected)
        .map(field => field.key),
      options: {
        includeHeaders: formValue.includeHeaders,
        dateFormat: formValue.dateFormat,
        encoding: formValue.encoding,
        delimiter: formValue.delimiter
      },
      filters: this.buildFilters()
    };
  }
  
  private downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }
  
  private showSuccessMessage(message: string): void {
    // You can implement a toast notification service here
    console.log('Success:', message);
  }
  
  // Utility methods
  getFieldsByCategory(category: string): ExportField[] {
    return this.availableFields.filter(field => field.category === category);
  }
  
  getCategorySelectionState(category: string): 'all' | 'some' | 'none' {
    const categoryFields = this.getFieldsByCategory(category);
    const selectedCount = categoryFields.filter(field => field.selected).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryFields.length) return 'all';
    return 'some';
  }
  
  getSelectedFormat(): ExportFormat | undefined {
    return this.availableFormats.find(format => format.value === this.exportForm.get('format')?.value);
  }
  
  isDelimiterVisible(): boolean {
    const format = this.exportForm.get('format')?.value;
    return format === 'csv';
  }
  
  // Navigation methods
  onCancel(): void {
    this.router.navigate(['/clients']);
  }
  
  onReset(): void {
    this.exportForm.reset();
    this.exportOptions = {
      format: 'csv',
      includeHeaders: true,
      dateFormat: 'MM/dd/yyyy',
      encoding: 'utf-8',
      delimiter: ',',
      includeDeleted: false,
      includeInactive: false
    };
    this.exportFilter = {
      dateRange: {
        start: null,
        end: null
      },
      status: [],
      tags: [],
      searchTerm: ''
    };
    this.availableFields.forEach(field => {
      field.selected = ['firstName', 'lastName', 'email', 'phone', 'status', 'createdAt'].includes(field.key);
    });
    this.updateSelectedFieldsCount();
    this.updateFilteredClientsCount();
  }
  
  // Template helper methods
  onStatusToggle(status: string): void {
    const index = this.exportFilter.status.indexOf(status);
    if (index > -1) {
      this.exportFilter.status.splice(index, 1);
    } else {
      this.exportFilter.status.push(status);
    }
    this.onFilterChange();
  }
  
  onTagToggle(tag: string): void {
    const index = this.exportFilter.tags.indexOf(tag);
    if (index > -1) {
      this.exportFilter.tags.splice(index, 1);
    } else {
      this.exportFilter.tags.push(tag);
    }
    this.onFilterChange();
  }
  
  isStatusSelected(status: string): boolean {
    return this.exportFilter.status.includes(status);
  }
  
  isTagSelected(tag: string): boolean {
    return this.exportFilter.tags.includes(tag);
  }
}