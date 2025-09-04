import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgbTooltipModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import {
  CreditBureau,
  ReportType
} from '../../../../core/models/credit-report.model';
import {
  CreditReportService,
  UploadReportRequest
} from '../../../../core/services/credit-report.service';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';

interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Component({
  selector: 'app-upload-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    NgbProgressbarModule,
    FeatherIconDirective
  ],
  templateUrl: './upload-report.component.html',
  styleUrls: ['./upload-report.component.scss']
})
export class UploadReportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  uploadForm: FormGroup;
  clients: Client[] = [];
  selectedFile: File | null = null;
  fileValidation: FileValidationResult | null = null;
  
  loading = false;
  uploading = false;
  uploadProgress = 0;
  error: string | null = null;
  success: string | null = null;

  // Drag and drop
  isDragOver = false;

  // Enums for template
  CreditBureau = CreditBureau;
  ReportType = ReportType;

  // Supported file types
  supportedTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    private fb: FormBuilder,
    private creditReportService: CreditReportService,
    private clientService: ClientService,
    private router: Router
  ) {
    this.uploadForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      clientId: ['', Validators.required],
      bureau: ['', Validators.required],
      reportType: ['', Validators.required],
      notes: ['']
    });
  }

  private loadClients(): void {
    this.loading = true;
    this.clientService.getAllClients().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (clients: any) => {
        this.clients = clients;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Failed to load clients';
        this.loading = false;
        console.error('Error loading clients:', error);
      }
    });
  }

  // File handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    this.error = null;
    this.success = null;
    this.fileValidation = null;

    // Validate file type
    if (!this.supportedTypes.includes(file.type)) {
      this.error = 'Unsupported file type. Please upload PDF, TXT, CSV, or Excel files.';
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.error = 'File size exceeds 10MB limit.';
      return;
    }

    this.selectedFile = file;
    this.validateFile();
  }

  private validateFile(): void {
    if (!this.selectedFile) return;

    this.loading = true;
    this.creditReportService.validateReportFile(this.selectedFile).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (validation) => {
        this.fileValidation = validation;
        this.loading = false;
        
        if (!validation.valid) {
          this.error = 'File validation failed. Please check the errors below.';
        }
      },
      error: (error) => {
        this.error = 'Failed to validate file';
        this.loading = false;
        console.error('Error validating file:', error);
      }
    });
  }

  onRemoveFile(): void {
    this.selectedFile = null;
    this.fileValidation = null;
    this.error = null;
    this.success = null;
    
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.markFormGroupTouched();
      return;
    }

    if (this.fileValidation && !this.fileValidation.valid) {
      this.error = 'Please fix file validation errors before uploading.';
      return;
    }

    this.uploadReport();
  }

  private uploadReport(): void {
    if (!this.selectedFile) return;

    const formValue = this.uploadForm.value;
    const request: UploadReportRequest = {
      clientId: formValue.clientId,
      bureau: formValue.bureau,
      reportType: formValue.reportType,
      file: this.selectedFile,
      notes: formValue.notes || undefined
    };

    this.uploading = true;
    this.uploadProgress = 0;
    this.error = null;

    // Simulate upload progress (in real implementation, this would come from the HTTP request)
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += Math.random() * 10;
      }
    }, 200);

    this.creditReportService.uploadReport(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (report) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.uploading = false;
        this.success = 'Credit report uploaded successfully!';
        
        // Reset form after successful upload
        setTimeout(() => {
          this.router.navigate(['/credit-reports/analysis', report.id]);
        }, 2000);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.uploading = false;
        this.uploadProgress = 0;
        this.error = 'Failed to upload credit report. Please try again.';
        console.error('Error uploading report:', error);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.uploadForm.controls).forEach(key => {
      const control = this.uploadForm.get(key);
      control?.markAsTouched();
    });
  }

  // Navigation
  onCancel(): void {
    this.router.navigate(['/credit-reports']);
  }

  onViewReports(): void {
    this.router.navigate(['/credit-reports']);
  }

  // Utility methods
  getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    if (file.type === 'application/pdf') return 'file-text';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'file-plus';
    if (file.type.includes('csv')) return 'database';
    return 'file';
  }

  getBureauIcon(bureau: CreditBureau): string {
    switch (bureau) {
      case CreditBureau.EXPERIAN: return 'trending-up';
      case CreditBureau.EQUIFAX: return 'bar-chart';
      case CreditBureau.TRANSUNION: return 'activity';
      default: return 'file-text';
    }
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.uploadForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.uploadForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      clientId: 'Client',
      bureau: 'Credit Bureau',
      reportType: 'Report Type',
      notes: 'Notes'
    };
    return labels[fieldName] || fieldName;
  }
}