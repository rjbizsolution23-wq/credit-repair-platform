import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { DisputesService } from '../disputes.service';
import { Dispute, DisputeItem, DisputeType, DisputeStatus, CreditBureau, DisputeReason, DisputePriority } from '../disputes.model';

@Component({
  selector: 'app-edit-dispute',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-dispute.component.html',
  styleUrls: ['./edit-dispute.component.scss']
})
export class EditDisputeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  disputeForm!: FormGroup;
  dispute: Dispute | null = null;
  disputeId: string = '';
  
  loading = false;
  saving = false;
  error: string | null = null;
  
  // Enums for templates
  DisputeType = DisputeType;
  DisputeStatus = DisputeStatus;
  CreditBureau = CreditBureau;
  DisputeReason = DisputeReason;
  DisputePriority = DisputePriority;
  
  // Form options
  disputeTypes = Object.values(DisputeType);
  disputeStatuses = Object.values(DisputeStatus);
  creditBureaus = Object.values(CreditBureau);
  disputeReasons = Object.values(DisputeReason);
  disputePriorities = Object.values(DisputePriority);
  
  // UI State
  showLetterPreview = false;
  letterContent = '';
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private disputesService: DisputesService
  ) {
    this.initializeForm();
  }
  
  ngOnInit(): void {
    this.disputeId = this.route.snapshot.params['id'];
    if (this.disputeId) {
      this.loadDispute();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForm(): void {
    this.disputeForm = this.fb.group({
      clientId: ['', Validators.required],
      type: [DisputeType.ACCOUNT_DISPUTE, Validators.required],
      status: [DisputeStatus.DRAFT, Validators.required],
      priority: [DisputePriority.MEDIUM, Validators.required],
      bureaus: [[], Validators.required],
      reason: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      items: this.fb.array([]),
      dueDate: [''],
      notes: [''],
      tags: [[]],
      attachments: [[]]
    });
    
    // Watch for form changes to update letter preview
    this.disputeForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.showLetterPreview) {
          this.generateLetterPreview();
        }
      });
  }
  
  public loadDispute(): void {
    this.loading = true;
    this.error = null;
    
    this.disputesService.getDispute(this.disputeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dispute) => {
          this.dispute = dispute;
          this.populateForm(dispute);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load dispute. Please try again.';
          this.loading = false;
          console.error('Error loading dispute:', error);
        }
      });
  }
  
  private populateForm(dispute: Dispute): void {
    // Clear existing items
    this.clearDisputeItems();
    
    // Populate form with dispute data
    this.disputeForm.patchValue({
      clientId: dispute.client_id,
      status: dispute.status,
      priority: dispute.priority,
      bureaus: dispute.bureau,
      reason: dispute.reason,
      description: dispute.description,
      dueDate: dispute.due_date ? new Date(dispute.due_date).toISOString().split('T')[0] : '',
      notes: dispute.notes || '',
      attachments: dispute.attachments || []
    });
    
    // Add dispute items
    dispute.dispute_items.forEach((item: any) => {
      this.addDisputeItem(item);
    });
  }
  
  get disputeItems(): FormArray {
    return this.disputeForm.get('items') as FormArray;
  }
  
  addDisputeItem(item?: DisputeItem): void {
    const itemForm = this.fb.group({
      id: [item?.id || this.generateId()],
      account_number: [item?.account_number || '', Validators.required],
      account_name: [item?.account_name || '', Validators.required],
      balance: [item?.balance || 0],
      dispute_reason: [item?.dispute_reason || '', Validators.required],
      status: [item?.status || ''],
      description: [item?.description || '', Validators.required],
      selected: [item?.selected || false]
    });
    
    this.disputeItems.push(itemForm);
  }
  
  removeDisputeItem(index: number): void {
    this.disputeItems.removeAt(index);
  }
  
  clearDisputeItems(): void {
    while (this.disputeItems.length !== 0) {
      this.disputeItems.removeAt(0);
    }
  }
  
  toggleLetterPreview(): void {
    this.showLetterPreview = !this.showLetterPreview;
    if (this.showLetterPreview) {
      this.generateLetterPreview();
    }
  }
  
  generateLetterPreview(): void {
    if (!this.disputeForm.valid) {
      this.letterContent = 'Please complete all required fields to generate letter preview.';
      return;
    }
    
    const formValue = this.disputeForm.value;
    
    // Letter content generation would be handled by the service
    // this.letterContent = formValue;
  }
  
  onSubmit(): void {
    if (this.disputeForm.valid && !this.saving) {
      this.saving = true;
      this.error = null;
      
      const formValue = this.disputeForm.value;
      const updatedDispute: Dispute = {
        ...formValue,
        id: this.disputeId,
        created_date: this.dispute?.created_date || new Date(),
        updated_date: new Date(),
        due_date: formValue.dueDate ? new Date(formValue.dueDate) : undefined
      };
      
      this.disputesService.updateDispute(this.disputeId, updatedDispute)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/disputes/view', this.disputeId]);
          },
          error: (error) => {
            this.error = 'Failed to update dispute. Please try again.';
            this.saving = false;
            console.error('Error updating dispute:', error);
          }
        });
    } else {
      this.markFormGroupTouched(this.disputeForm);
    }
  }
  
  onCancel(): void {
    this.router.navigate(['/disputes/view', this.disputeId]);
  }
  
  onDelete(): void {
    if (confirm('Are you sure you want to delete this dispute? This action cannot be undone.')) {
      this.disputesService.deleteDispute(this.disputeId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/disputes']);
          },
          error: (error) => {
            this.error = 'Failed to delete dispute. Please try again.';
            console.error('Error deleting dispute:', error);
          }
        });
    }
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  // Utility methods for templates
  getDisputeTypeLabel(type: DisputeType): string {
    return this.disputesService.getDisputeTypeLabel(type);
  }
  
  getDisputeStatusLabel(status: DisputeStatus): string {
    return this.disputesService.getDisputeStatusLabel(status);
  }
  
  getCreditBureauLabel(bureau: CreditBureau): string {
    return this.disputesService.getCreditBureauLabel(bureau);
  }
  
  getDisputeReasonLabel(reason: DisputeReason): string {
    return this.disputesService.getDisputeReasonLabel(reason);
  }
  
  getDisputePriorityLabel(priority: DisputePriority): string {
    return this.disputesService.getDisputePriorityLabel(priority);
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.disputeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getFieldError(fieldName: string): string {
    const field = this.disputeForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }
}