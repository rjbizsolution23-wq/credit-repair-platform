import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { ClientService } from '../../../../core/services/client.service';
import { Client, ClientStatus, ClientStage } from '../../../../core/models/client.model';

@Component({
  selector: 'app-add-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgbModule, FeatherIconDirective],
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.scss']
})
export class AddClientComponent implements OnInit {
  clientForm: FormGroup;
  loading = false;
  submitted = false;

  statusOptions = [
    { value: ClientStatus.ACTIVE, label: 'Active' },
    { value: ClientStatus.INACTIVE, label: 'Inactive' }
  ];

  stageOptions = [
    { value: ClientStage.INITIAL_REVIEW, label: 'Initial Review' },
    { value: ClientStage.CREDIT_ANALYSIS, label: 'Credit Analysis' },
    { value: ClientStage.DISPUTE_PHASE, label: 'Dispute Phase' },
    { value: ClientStage.VERIFICATION, label: 'Verification' },
    { value: ClientStage.LEGAL_ACTION, label: 'Legal Action' },
    { value: ClientStage.MONITORING, label: 'Monitoring' },
    { value: ClientStage.COMPLETED, label: 'Completed' }
  ];

  subscriptionPlans = [
    { value: 'basic', label: 'Basic Plan - $99/month', price: 99 },
    { value: 'premium', label: 'Premium Plan - $149/month', price: 149 },
    { value: 'enterprise', label: 'Enterprise Plan - $199/month', price: 199 }
  ];

  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private router: Router
  ) {
    this.clientForm = this.createForm();
  }

  ngOnInit(): void {}

  createForm(): FormGroup {
    return this.fb.group({
      // Personal Information
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      dateOfBirth: [''],
      ssn: ['', [Validators.pattern(/^\d{3}-?\d{2}-?\d{4}$/)]],
      
      // Address Information
      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
        country: ['United States']
      }),
      
      // Account Information
      status: [ClientStatus.ACTIVE, Validators.required],
      currentStage: [ClientStage.INITIAL_REVIEW, Validators.required],
      assignedAgent: [''],
      subscriptionPlan: ['basic', Validators.required],
      monthlyFee: [99],
      
      // Additional Information
      notes: [''],
      creditScore: ['', [Validators.min(300), Validators.max(850)]],
      
      // Preferences
      preferences: this.fb.group({
        communicationMethod: [['email']],
        emailNotifications: [true],
        smsNotifications: [false],
        pushNotifications: [true],
        reportFrequency: ['monthly']
      })
    });
  }

  get f() {
    return this.clientForm.controls;
  }

  get addressControls() {
    return (this.clientForm.get('address') as FormGroup).controls;
  }

  get preferencesControls() {
    return (this.clientForm.get('preferences') as FormGroup).controls;
  }

  onSubscriptionPlanChange(): void {
    const selectedPlan = this.subscriptionPlans.find(
      plan => plan.value === this.f['subscriptionPlan'].value
    );
    if (selectedPlan) {
      this.f['monthlyFee'].setValue(selectedPlan.price);
    }
  }

  formatSSN(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5, 9);
    } else if (value.length >= 4) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    this.f['ssn'].setValue(value);
  }

  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 7) {
      value = '(' + value.substring(0, 3) + ') ' + value.substring(3, 6) + '-' + value.substring(6, 10);
    } else if (value.length >= 4) {
      value = '(' + value.substring(0, 3) + ') ' + value.substring(3);
    } else if (value.length >= 1) {
      value = '(' + value;
    }
    this.f['phone'].setValue(value);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.clientForm.invalid) {
      this.markFormGroupTouched(this.clientForm);
      return;
    }

    this.loading = true;
    const clientData = this.prepareClientData();

    this.clientService.createClient(clientData).subscribe({
      next: (client: Client) => {
        this.loading = false;
        this.router.navigate(['/clients/view', client.id], {
          queryParams: { created: 'true' }
        });
      },
      error: (error) => {
        console.error('Error creating client:', error);
        this.loading = false;
        // Handle error (show toast, etc.)
      }
    });
  }

  prepareClientData(): Partial<Client> {
    const formValue = this.clientForm.value;
    
    return {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth ? new Date(formValue.dateOfBirth) : undefined,
      ssn: formValue.ssn,
      address: formValue.address,
      status: formValue.status,
      currentStage: formValue.currentStage,
      assignedAgent: formValue.assignedAgent || undefined,
      subscriptionPlan: formValue.subscriptionPlan,
      monthlyFee: formValue.monthlyFee,
      creditScore: formValue.creditScore || undefined,
      notes: formValue.notes,
      preferences: {
        communicationMethod: formValue.preferences.communicationMethod,
        notificationSettings: {
          emailNotifications: formValue.preferences.emailNotifications,
          smsNotifications: formValue.preferences.smsNotifications,
          pushNotifications: formValue.preferences.pushNotifications,
          disputeUpdates: true,
          paymentReminders: true,
          creditScoreChanges: true
        },
        reportFrequency: formValue.preferences.reportFrequency,
        autoPayEnabled: false
      }
    };
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string, formGroup?: FormGroup): boolean {
    const group = formGroup || this.clientForm;
    const field = group.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  get addressFormGroup(): FormGroup {
    return this.clientForm.get('address') as FormGroup;
  }

  getFieldError(fieldName: string, formGroup?: FormGroup): string {
    const group = formGroup || this.clientForm;
    const field = group.get(fieldName);
    
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['pattern']) {
        if (fieldName === 'phone') return 'Please enter a valid phone number';
        if (fieldName === 'ssn') return 'Please enter a valid SSN (XXX-XX-XXXX)';
        if (fieldName === 'zipCode') return 'Please enter a valid ZIP code';
      }
      if (field.errors['min']) return `${fieldName} must be at least ${field.errors['min'].min}`;
      if (field.errors['max']) return `${fieldName} must be at most ${field.errors['max'].max}`;
    }
    
    return '';
  }

  onCancel(): void {
    this.router.navigate(['/clients/all']);
  }

  onReset(): void {
    this.clientForm.reset();
    this.submitted = false;
    this.clientForm.patchValue({
      status: ClientStatus.ACTIVE,
      currentStage: ClientStage.INITIAL_REVIEW,
      subscriptionPlan: 'basic',
      monthlyFee: 99,
      address: {
        country: 'United States'
      },
      preferences: {
        communicationMethod: ['email'],
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        reportFrequency: 'monthly'
      }
    });
  }
}