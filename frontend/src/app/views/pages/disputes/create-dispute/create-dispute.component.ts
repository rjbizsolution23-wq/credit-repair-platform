import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DisputeService } from '../../../../core/services/dispute.service';
import { ClientService } from '../../../../core/services/client.service';
import { 
  Dispute, 
  DisputeType, 
  CreditBureau, 
  DisputePriority,
  DisputeTemplate,
  getDisputeTypeLabel,
  getCreditBureauLabel,
  getDisputePriorityLabel
} from '../../../../core/models/dispute.model';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-create-dispute',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgbModule],
  templateUrl: './create-dispute.component.html',
  styleUrls: ['./create-dispute.component.scss']
})
export class CreateDisputeComponent implements OnInit {
  disputeForm: FormGroup;
  loading = false;
  submitting = false;
  clients: Client[] = [];
  templates: DisputeTemplate[] = [];
  selectedTemplate: DisputeTemplate | null = null;
  duplicateDisputes: Dispute[] = [];
  showDuplicateWarning = false;
  
  // Form step management
  currentStep = 1;
  totalSteps = 4;
  
  // Enum options for dropdowns
  disputeTypes = Object.values(DisputeType);
  creditBureaus = Object.values(CreditBureau);
  priorities = Object.values(DisputePriority);
  
  // Reason options by dispute type
  reasonOptions: Record<DisputeType, string[]> = {
    [DisputeType.ACCOUNT_DISPUTE]: [
      'Not my account',
      'Incorrect balance',
      'Incorrect payment history',
      'Account closed by consumer',
      'Paid in full',
      'Settled for less than full balance',
      'Incorrect dates',
      'Duplicate account'
    ],
    [DisputeType.INQUIRY_DISPUTE]: [
      'Not authorized by me',
      'Identity theft',
      'Promotional inquiry',
      'Duplicate inquiry',
      'Incorrect date'
    ],
    [DisputeType.PERSONAL_INFO]: [
      'Incorrect name',
      'Incorrect address',
      'Incorrect SSN',
      'Incorrect date of birth',
      'Incorrect employment information',
      'Mixed credit file'
    ],
    [DisputeType.PUBLIC_RECORD]: [
      'Not my record',
      'Incorrect information',
      'Satisfied/Paid',
      'Dismissed',
      'Incorrect dates'
    ],
    [DisputeType.MIXED_FILE]: [
      'Information belongs to someone else',
      'Similar name confusion',
      'SSN mix-up'
    ],
    [DisputeType.IDENTITY_THEFT]: [
      'Fraudulent account',
      'Unauthorized inquiry',
      'Identity theft victim'
    ],
    [DisputeType.FRAUD_ALERT]: [
      'Request fraud alert',
      'Extend fraud alert',
      'Remove fraud alert'
    ],
    [DisputeType.CREDIT_FREEZE]: [
      'Request credit freeze',
      'Lift credit freeze',
      'Remove credit freeze'
    ]
  };

  constructor(
    private fb: FormBuilder,
    private disputeService: DisputeService,
    private clientService: ClientService,
    private router: Router
  ) {
    this.disputeForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadClients();
    this.loadTemplates();
    this.setupFormValidation();
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Step 1: Basic Information
      clientId: ['', Validators.required],
      type: ['', Validators.required],
      bureau: ['', Validators.required],
      priority: [DisputePriority.MEDIUM, Validators.required],
      
      // Step 2: Account/Item Details
      creditorName: ['', Validators.required],
      originalCreditor: [''],
      accountNumber: ['', Validators.required],
      amount: [0, [Validators.min(0)]],
      reason: ['', Validators.required],
      customReason: [''],
      
      // Step 3: Dispute Details
      description: ['', [Validators.required, Validators.minLength(10)]],
      templateId: [''],
      dueDate: [''],
      tags: [''],
      
      // Step 4: Additional Information
      notes: [''],
      isUrgent: [false],
      requiresFollowUp: [false],
      followUpDate: [''],
      attachments: [[]]
    });
  }

  setupFormValidation(): void {
    // Watch for type changes to update reason options
    this.disputeForm.get('type')?.valueChanges.subscribe(type => {
      if (type) {
        this.disputeForm.get('reason')?.setValue('');
        this.loadTemplatesByType(type);
      }
    });

    // Watch for bureau changes to filter templates
    this.disputeForm.get('bureau')?.valueChanges.subscribe(bureau => {
      if (bureau) {
        this.loadTemplatesByTypeAndBureau();
      }
    });

    // Watch for template selection
    this.disputeForm.get('templateId')?.valueChanges.subscribe(templateId => {
      if (templateId) {
        this.applyTemplate(templateId);
      }
    });

    // Watch for account details to check duplicates
    const accountFields = ['clientId', 'creditorName', 'accountNumber', 'bureau'];
    accountFields.forEach(field => {
      this.disputeForm.get(field)?.valueChanges.subscribe(() => {
        this.checkForDuplicates();
      });
    });

    // Conditional validation for custom reason
    this.disputeForm.get('reason')?.valueChanges.subscribe(reason => {
      const customReasonControl = this.disputeForm.get('customReason');
      if (reason === 'Other' || reason === 'Custom') {
        customReasonControl?.setValidators([Validators.required]);
      } else {
        customReasonControl?.clearValidators();
      }
      customReasonControl?.updateValueAndValidity();
    });

    // Conditional validation for follow-up date
    this.disputeForm.get('requiresFollowUp')?.valueChanges.subscribe(requires => {
      const followUpDateControl = this.disputeForm.get('followUpDate');
      if (requires) {
        followUpDateControl?.setValidators([Validators.required]);
      } else {
        followUpDateControl?.clearValidators();
      }
      followUpDateControl?.updateValueAndValidity();
    });
  }

  loadClients(): void {
    this.clientService.getAllClients({ limit: 1000 }).subscribe({
      next: (response: any) => {
        this.clients = response.data || [];
      },
      error: (error: any) => {
        console.error('Error loading clients:', error);
      }
    });
  }

  loadTemplates(): void {
    this.disputeService.getDisputeTemplates().subscribe({
      next: (response) => {
        this.templates = response.data || [];
      },
      error: (error) => {
        console.error('Error loading templates:', error);
      }
    });
  }

  loadTemplatesByType(type: DisputeType): void {
    this.disputeService.getDisputeTemplates(type).subscribe({
      next: (response) => {
        this.templates = response.data || [];
      },
      error: (error) => {
        console.error('Error loading templates by type:', error);
      }
    });
  }

  loadTemplatesByTypeAndBureau(): void {
    const type = this.disputeForm.get('type')?.value;
    const bureau = this.disputeForm.get('bureau')?.value;
    
    if (type && bureau) {
      this.disputeService.getDisputeTemplates(type, bureau).subscribe({
        next: (response) => {
          this.templates = response.data || [];
        },
        error: (error) => {
          console.error('Error loading templates:', error);
        }
      });
    }
  }

  applyTemplate(templateId: string): void {
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      this.selectedTemplate = template;
      this.disputeForm.patchValue({
        description: template.content
      });
    }
  }

  checkForDuplicates(): void {
    const formValue = this.disputeForm.value;
    
    if (formValue.clientId && formValue.creditorName && formValue.accountNumber && formValue.bureau) {
      const disputeData = {
        clientId: formValue.clientId,
        creditorName: formValue.creditorName,
        accountNumber: formValue.accountNumber,
        bureau: formValue.bureau
      };

      this.disputeService.checkDuplicateDispute(disputeData).subscribe({
        next: (response) => {
          this.duplicateDisputes = response.data || [];
          this.showDuplicateWarning = this.duplicateDisputes.length > 0;
        },
        error: (error) => {
          console.error('Error checking duplicates:', error);
        }
      });
    }
  }

  // Step navigation
  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return (this.disputeForm.get('clientId')?.valid ?? false) && 
               (this.disputeForm.get('type')?.valid ?? false) && 
               (this.disputeForm.get('bureau')?.valid ?? false) && 
               (this.disputeForm.get('priority')?.valid ?? false);
      case 2:
        return (this.disputeForm.get('creditorName')?.valid ?? false) && 
               (this.disputeForm.get('accountNumber')?.valid ?? false) && 
               (this.disputeForm.get('reason')?.valid ?? false) &&
               (this.disputeForm.get('reason')?.value !== 'Other' || (this.disputeForm.get('customReason')?.valid ?? false));
      case 3:
        return this.disputeForm.get('description')?.valid ?? false;
      case 4:
        return !this.disputeForm.get('requiresFollowUp')?.value || (this.disputeForm.get('followUpDate')?.valid ?? false);
      default:
        return false;
    }
  }

  canProceed(): boolean {
    return this.isStepValid(this.currentStep);
  }

  // Form submission
  onSubmit(): void {
    if (this.disputeForm.valid) {
      this.submitting = true;
      
      const formValue = this.disputeForm.value;
      const disputeData: Partial<Dispute> = {
        clientId: formValue.clientId,
        type: formValue.type,
        bureau: formValue.bureau,
        priority: formValue.priority,
        creditorName: formValue.creditorName,
        originalCreditor: formValue.originalCreditor || undefined,
        accountNumber: formValue.accountNumber,
        amount: formValue.amount || 0,
        reason: formValue.reason === 'Other' ? formValue.customReason : formValue.reason,
        description: formValue.description,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
        metadata: {
          notes: formValue.notes,
          isUrgent: formValue.isUrgent,
          requiresFollowUp: formValue.requiresFollowUp,
          followUpDate: formValue.followUpDate ? new Date(formValue.followUpDate) : undefined,
          templateId: formValue.templateId || undefined
        }
      };

      this.disputeService.createDispute(disputeData).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/disputes/view', response.data.id]);
          }
        },
        error: (error) => {
          console.error('Error creating dispute:', error);
          this.submitting = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  saveDraft(): void {
    const formValue = this.disputeForm.value;
    const disputeData: Partial<Dispute> = {
      ...formValue,
      status: 'draft' as any
    };

    this.disputeService.createDispute(disputeData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/disputes/edit', response.data.id]);
        }
      },
      error: (error) => {
        console.error('Error saving draft:', error);
      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.disputeForm.controls).forEach(key => {
      const control = this.disputeForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods
  getDisputeTypeLabel(type: DisputeType): string {
    return getDisputeTypeLabel(type);
  }

  getCreditBureauLabel(bureau: CreditBureau): string {
    return getCreditBureauLabel(bureau);
  }

  getDisputePriorityLabel(priority: DisputePriority): string {
    return getDisputePriorityLabel(priority);
  }

  getReasonOptions(): string[] {
    const type = this.disputeForm.get('type')?.value as DisputeType;
    return type ? [...this.reasonOptions[type], 'Other'] : [];
  }

  getSelectedClient(): Client | undefined {
    const clientId = this.disputeForm.get('clientId')?.value;
    return this.clients.find(c => c.id === clientId);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.disputeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.disputeForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  // File handling
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    const currentAttachments = this.disputeForm.get('attachments')?.value || [];
    this.disputeForm.patchValue({
      attachments: [...currentAttachments, ...files]
    });
  }

  removeAttachment(index: number): void {
    const attachments = this.disputeForm.get('attachments')?.value || [];
    attachments.splice(index, 1);
    this.disputeForm.patchValue({ attachments });
  }

  // Cancel and navigation
  cancel(): void {
    if (this.disputeForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/disputes/active']);
      }
    } else {
      this.router.navigate(['/disputes/active']);
    }
  }
}