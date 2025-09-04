import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClientsService } from '../clients.service';
import { Client } from '../clients.model';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  duplicates: number;
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

interface ImportPreview {
  headers: string[];
  rows: any[][];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
}

@Component({
  selector: 'app-import-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './import-clients.component.html',
  styleUrls: ['./import-clients.component.scss']
})
export class ImportClientsComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  importForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  
  // File handling
  selectedFile: File | null = null;
  isDragOver = false;
  
  // Import process
  currentStep = 1; // 1: Upload, 2: Preview, 3: Configure, 4: Results
  importPreview: ImportPreview | null = null;
  importResult: ImportResult | null = null;
  isImporting = false;
  
  // Configuration
  fieldMappings: { [key: string]: string } = {};
  availableFields = [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'ssn', label: 'SSN', required: false },
    { key: 'dateOfBirth', label: 'Date of Birth', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'state', label: 'State', required: false },
    { key: 'zipCode', label: 'ZIP Code', required: false },
    { key: 'employer', label: 'Employer', required: false },
    { key: 'income', label: 'Annual Income', required: false }
  ];
  
  importOptions = {
    skipDuplicates: true,
    updateExisting: false,
    validateData: true,
    sendWelcomeEmail: false
  };
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private clientsService: ClientsService
  ) {
    this.importForm = this.createForm();
  }
  
  ngOnInit(): void {
    this.resetImport();
  }
  
  private createForm(): FormGroup {
    return this.fb.group({
      fileType: ['csv', Validators.required],
      hasHeaders: [true],
      delimiter: [',', Validators.required],
      encoding: ['utf-8', Validators.required]
    });
  }
  
  // File Upload Methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }
  
  private handleFile(file: File): void {
    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      this.error = 'Please select a valid CSV or Excel file.';
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.error = 'File size must be less than 10MB.';
      return;
    }
    
    this.selectedFile = file;
    this.error = null;
    this.processFile();
  }
  
  async processFile(): Promise<void> {
    if (!this.selectedFile) return;
    
    this.isLoading = true;
    this.error = null;
    
    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('options', JSON.stringify(this.importForm.value));
      
      this.importPreview = await this.clientsService.previewImport(formData).toPromise();
      this.currentStep = 2;
      
      // Auto-map fields based on headers
      this.autoMapFields();
    } catch (error: any) {
      this.error = error.message || 'Failed to process file. Please check the file format and try again.';
    } finally {
      this.isLoading = false;
    }
  }
  
  private autoMapFields(): void {
    if (!this.importPreview) return;
    
    this.fieldMappings = {};
    
    this.importPreview.headers.forEach((header, index) => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try to match common field names
      const fieldMap: { [key: string]: string[] } = {
        'firstName': ['firstname', 'fname', 'first'],
        'lastName': ['lastname', 'lname', 'last', 'surname'],
        'email': ['email', 'emailaddress', 'mail'],
        'phone': ['phone', 'phonenumber', 'telephone', 'mobile'],
        'ssn': ['ssn', 'socialsecurity', 'socialsecuritynumber'],
        'dateOfBirth': ['dateofbirth', 'dob', 'birthdate', 'birthday'],
        'address': ['address', 'street', 'streetaddress'],
        'city': ['city'],
        'state': ['state', 'province'],
        'zipCode': ['zipcode', 'zip', 'postalcode'],
        'employer': ['employer', 'company', 'workplace'],
        'income': ['income', 'salary', 'annualincome']
      };
      
      for (const [fieldKey, patterns] of Object.entries(fieldMap)) {
        if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
          this.fieldMappings[fieldKey] = header;
          break;
        }
      }
    });
  }
  
  // Navigation Methods
  goToStep(step: number): void {
    if (step < this.currentStep || (step === 2 && this.importPreview)) {
      this.currentStep = step;
    }
  }
  
  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  // Field Mapping Methods
  onFieldMappingChange(fieldKey: string, headerValue: string): void {
    if (headerValue === '') {
      delete this.fieldMappings[fieldKey];
    } else {
      this.fieldMappings[fieldKey] = headerValue;
    }
  }
  
  getRequiredFieldsMapped(): string[] {
    return this.availableFields
      .filter(field => field.required)
      .filter(field => !this.fieldMappings[field.key])
      .map(field => field.label);
  }
  
  canProceedToImport(): boolean {
    return this.getRequiredFieldsMapped().length === 0;
  }
  
  // Import Methods
  async startImport(): Promise<void> {
    if (!this.selectedFile || !this.canProceedToImport()) return;
    
    this.isImporting = true;
    this.error = null;
    
    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('mappings', JSON.stringify(this.fieldMappings));
      formData.append('options', JSON.stringify({
        ...this.importForm.value,
        ...this.importOptions
      }));
      
      this.importResult = await this.clientsService.importClients(formData).toPromise();
      this.currentStep = 4;
    } catch (error: any) {
      this.error = error.message || 'Import failed. Please try again.';
    } finally {
      this.isImporting = false;
    }
  }
  
  // Utility Methods
  resetImport(): void {
    this.currentStep = 1;
    this.selectedFile = null;
    this.importPreview = null;
    this.importResult = null;
    this.fieldMappings = {};
    this.error = null;
    this.isLoading = false;
    this.isImporting = false;
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  
  downloadTemplate(): void {
    const headers = this.availableFields.map(field => field.label);
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  downloadErrors(): void {
    if (!this.importResult?.errors) return;
    
    const headers = ['Row', 'Field', 'Value', 'Error Message'];
    const rows = this.importResult.errors.map(error => [
      error.row.toString(),
      error.field,
      error.value,
      error.message
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-errors.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  getPreviewRows(): any[][] {
    if (!this.importPreview) return [];
    return this.importPreview.rows.slice(0, 5); // Show first 5 rows
  }
  
  onCancel(): void {
    this.router.navigate(['/clients']);
  }
  
  onFinish(): void {
    this.router.navigate(['/clients'], {
      queryParams: { imported: this.importResult?.imported || 0 }
    });
  }
}