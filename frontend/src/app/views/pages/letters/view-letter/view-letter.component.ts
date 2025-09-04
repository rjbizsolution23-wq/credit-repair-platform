import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
// import { ToastrService } from 'ngx-toastr';
import { LetterService } from '../../../../services/letter.service';
import { GeneratedLetter, LetterStatus, DeliveryMethod, ResponseType, DeliveryStatus } from '../../../../models/letter.model';

@Component({
  selector: 'app-view-letter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './view-letter.component.html',
  styleUrls: ['./view-letter.component.scss']
})
export class ViewLetterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component State
  letter: GeneratedLetter | null = null;
  loading = true;
  error: string | null = null;
  
  // UI State
  activeTab = 'content';
  showEditModal = false;
  showDeleteModal = false;
  showSendModal = false;
  showResponseModal = false;
  
  // Forms
  editForm: FormGroup;
  sendForm: FormGroup;
  responseForm: FormGroup;
  
  // Enums for template
  LetterStatus = LetterStatus;
  DeliveryMethod = DeliveryMethod;
  ResponseType = ResponseType;
  DeliveryStatus = DeliveryStatus;
  
  // Processing states
  sending = false;
  updating = false;
  deleting = false;
  recordingResponse = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private letterService: LetterService,
    // private toastr: ToastrService
  ) {
    this.initializeForms();
  }
  
  ngOnInit(): void {
    this.loadLetter();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForms(): void {
    this.editForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      priority: ['medium', Validators.required],
      notes: ['', Validators.maxLength(1000)],
      tags: [[]]
    });
    
    this.sendForm = this.fb.group({
      deliveryMethod: ['email', Validators.required],
      recipientEmail: ['', [Validators.email]],
      recipientAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]]
      }),
      scheduledDate: [''],
      includeAttachments: [true],
      requestDeliveryConfirmation: [false],
      notes: ['', Validators.maxLength(500)]
    });
    
    this.responseForm = this.fb.group({
      responseType: ['', Validators.required],
      responseDate: ['', Validators.required],
      responseContent: ['', Validators.required],
      attachments: [[]],
      followUpRequired: [false],
      followUpDate: [''],
      notes: ['', Validators.maxLength(1000)]
    });
  }
  
  loadLetter(): void {
    const letterId = this.route.snapshot.paramMap.get('id');
    if (!letterId) {
      this.error = 'Letter ID not provided';
      this.loading = false;
      return;
    }
    
    this.letterService.getLetter(letterId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (letter: any) => {
          this.letter = letter;
          this.populateEditForm();
          this.populateSendForm();
        },
        error: (error: any) => {
          console.error('Error loading letter:', error);
          this.error = 'Failed to load letter. Please try again.';
          // this.toastr.error('Failed to load letter');
        }
      });
  }
  
  private populateEditForm(): void {
    if (!this.letter) return;
    
    this.editForm.patchValue({
      subject: this.letter.subject,
      escalationLevel: this.letter.escalationLevel || 0
    });
  }
  
  private populateSendForm(): void {
    if (!this.letter) return;
    
    this.sendForm.patchValue({
      deliveryMethod: this.letter.deliveryMethod || 'email',
      recipientId: this.letter.recipientId || '',
      includeAttachments: true,
      requestDeliveryConfirmation: false
    });
  }
  
  // Tab Management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  // Letter Actions
  editLetter(): void {
    this.showEditModal = true;
  }
  
  sendLetter(): void {
    this.showSendModal = true;
  }
  
  deleteLetter(): void {
    this.showDeleteModal = true;
  }
  
  recordResponse(): void {
    this.showResponseModal = true;
  }
  
  downloadLetter(): void {
    if (!this.letter) return;
    
    this.letterService.downloadLetter(this.letter.id, 'pdf')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${this.letter!.subject}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          // this.toastr.success('Letter downloaded successfully');
        },
        error: (error: any) => {
          console.error('Error downloading letter:', error);
          // this.toastr.error('Failed to download letter');
        }
      });
  }
  
  printLetter(): void {
    window.print();
  }
  
  duplicateLetter(): void {
    if (!this.letter) return;
    
    this.router.navigate(['/letters/create'], {
      queryParams: { template: this.letter.templateId, duplicate: this.letter.id }
    });
  }
  
  // Form Submissions
  onEditSubmit(): void {
    if (this.editForm.invalid || !this.letter) return;
    
    this.updating = true;
    const formData = this.editForm.value;
    
    this.letterService.updateLetter(this.letter.id, formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.updating = false)
      )
      .subscribe({
        next: (updatedLetter: any) => {
          this.letter = updatedLetter;
          this.showEditModal = false;
          // this.toastr.success('Letter updated successfully');
        },
        error: (error: any) => {
          console.error('Error updating letter:', error);
          // this.toastr.error('Failed to update letter');
        }
      });
  }
  
  onSendSubmit(): void {
    if (this.sendForm.invalid || !this.letter) return;
    
    this.sending = true;
    const formData = this.sendForm.value;
    
    this.letterService.sendLetter(this.letter.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.sending = false)
      )
      .subscribe({
        next: (result: any) => {
          this.letter!.status = LetterStatus.SENT;
          this.letter!.sentDate = new Date();
          this.showSendModal = false;
          // this.toastr.success('Letter sent successfully');
        },
        error: (error: any) => {
          console.error('Error sending letter:', error);
          // this.toastr.error('Failed to send letter');
        }
      });
  }
  
  onResponseSubmit(): void {
    if (this.responseForm.invalid || !this.letter) return;
    
    this.recordingResponse = true;
    const formData = this.responseForm.value;
    
    this.letterService.recordResponse(this.letter.id, formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.recordingResponse = false)
      )
      .subscribe({
        next: (response: any) => {
          this.letter!.responseReceived = true;
          this.letter!.responseDate = new Date(formData.responseDate);
          this.letter!.responseType = formData.responseType;
          this.showResponseModal = false;
          // this.toastr.success('Response recorded successfully');
        },
        error: (error: any) => {
          console.error('Error recording response:', error);
          // this.toastr.error('Failed to record response');
        }
      });
  }
  
  confirmDelete(): void {
    if (!this.letter) return;
    
    this.deleting = true;
    
    this.letterService.deleteLetter(this.letter.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.deleting = false)
      )
      .subscribe({
        next: () => {
          // this.toastr.success('Letter deleted successfully');
          this.router.navigate(['/letters']);
        },
        error: (error: any) => {
          console.error('Error deleting letter:', error);
          // this.toastr.error('Failed to delete letter');
        }
      });
  }
  
  // Modal Management
  closeEditModal(): void {
    this.showEditModal = false;
    this.editForm.reset();
    this.populateEditForm();
  }
  
  closeSendModal(): void {
    this.showSendModal = false;
    this.sendForm.reset();
    this.populateSendForm();
  }
  
  closeDeleteModal(): void {
    this.showDeleteModal = false;
  }
  
  closeResponseModal(): void {
    this.showResponseModal = false;
    this.responseForm.reset();
  }
  
  // Utility Methods
  getStatusColor(status: LetterStatus): string {
    switch (status) {
      case LetterStatus.DRAFT:
        return 'secondary';
      case LetterStatus.PENDING_REVIEW:
        return 'warning';
      case LetterStatus.SENT:
        return 'primary';
      case LetterStatus.DELIVERED:
        return 'success';
      case LetterStatus.FAILED:
        return 'danger';
      case LetterStatus.CANCELLED:
        return 'dark';
      default:
        return 'secondary';
    }
  }
  
  getDeliveryStatusColor(status: DeliveryStatus): string {
    switch (status) {
      case DeliveryStatus.PENDING:
        return 'warning';
      case DeliveryStatus.IN_TRANSIT:
        return 'info';
      case DeliveryStatus.DELIVERED:
        return 'success';
      case DeliveryStatus.FAILED_DELIVERY:
        return 'danger';
      case DeliveryStatus.RETURNED:
        return 'secondary';
      default:
        return 'secondary';
    }
  }
  
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  }
  
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  // Form Validation Helpers
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['maxlength']) return `${fieldName} is too long`;
    if (field.errors['pattern']) return `${fieldName} format is invalid`;
    
    return 'Invalid input';
  }
  
  // Navigation
  goBack(): void {
    this.router.navigate(['/letters']);
  }
  
  goToTemplate(): void {
    if (this.letter?.templateId) {
      this.router.navigate(['/letters/templates', this.letter.templateId]);
    }
  }
  
  goToClient(): void {
    if (this.letter?.clientId) {
      this.router.navigate(['/clients', this.letter.clientId]);
    }
  }
  
  goToReport(): void {
    // Navigate to credit reports - reportId property not available in current model
    this.router.navigate(['/credit-reports']);
  }
}