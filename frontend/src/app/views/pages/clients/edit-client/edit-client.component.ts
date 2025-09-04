import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

// Services
import { ClientsService } from '../clients.service';
import { ToastrService } from 'ngx-toastr';

// Models
import { Client } from '../clients.model';

@Component({
  selector: 'app-edit-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-client.component.html',
  styleUrls: ['./edit-client.component.scss']
})
export class EditClientComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  clientForm: FormGroup;
  client: Client | null = null;
  clientId: string = '';
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // Form validation patterns
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  phonePattern = /^[\+]?[1-9][\d]{0,2}[\s\-\.]?[\(]?[\d]{1,3}[\)]?[\s\-\.]?[\d]{1,4}[\s\-\.]?[\d]{1,4}$/;
  ssnPattern = /^\d{3}-?\d{2}-?\d{4}$/;
  zipPattern = /^\d{5}(-\d{4})?$/;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private clientsService: ClientsService,
    private toastr: ToastrService
  ) {
    this.clientForm = this.createForm();
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    if (this.clientId) {
      this.loadClient();
    } else {
      this.error = 'Invalid client ID';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Personal Information
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      middle_name: ['', [Validators.maxLength(50)]],
      date_of_birth: ['', [Validators.required]],
      ssn: ['', [Validators.required, Validators.pattern(this.ssnPattern)]],
      
      // Contact Information
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      phone: ['', [Validators.required, Validators.pattern(this.phonePattern)]],
      secondary_phone: ['', [Validators.pattern(this.phonePattern)]],
      
      // Address Information
      address: this.fb.group({
        street: ['', [Validators.required, Validators.maxLength(100)]],
        city: ['', [Validators.required, Validators.maxLength(50)]],
        state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
        zip_code: ['', [Validators.required, Validators.pattern(this.zipPattern)]],
        country: ['US', [Validators.required]]
      }),
      
      // Previous Address (optional)
      previous_address: this.fb.group({
        street: ['', [Validators.maxLength(100)]],
        city: ['', [Validators.maxLength(50)]],
        state: ['', [Validators.minLength(2), Validators.maxLength(2)]],
        zip_code: ['', [Validators.pattern(this.zipPattern)]],
        country: ['US']
      }),
      
      // Employment Information
      employment: this.fb.group({
        employer_name: ['', [Validators.maxLength(100)]],
        job_title: ['', [Validators.maxLength(100)]],
        work_phone: ['', [Validators.pattern(this.phonePattern)]],
        monthly_income: [0, [Validators.min(0)]],
        employment_length: ['', [Validators.maxLength(50)]]
      }),
      
      // Additional Information
      preferred_contact_method: ['email', [Validators.required]],
      notes: ['', [Validators.maxLength(1000)]],
      status: ['active', [Validators.required]]
    });
  }

  public loadClient(): void {
    this.isLoading = true;
    this.error = null;
    
    this.clientsService.getClientById(this.clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (client: Client) => {
          this.client = client;
          this.populateForm(client);
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading client:', error);
          this.error = 'Failed to load client information';
          this.isLoading = false;
          this.toastr.error('Failed to load client information');
        }
      });
  }

  private populateForm(client: Client): void {
    this.clientForm.patchValue({
      first_name: client.firstName,
      last_name: client.lastName,
      middle_name: client.middleName,
      date_of_birth: client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
      ssn: client.ssn,
      email: client.email,
      phone: client.phone,
      secondary_phone: '',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        zip_code: client.address?.zipCode || '',
        country: client.address?.country || 'US'
      },
      previous_address: {
        street: client.previous_address?.street || '',
        city: client.previous_address?.city || '',
        state: client.previous_address?.state || '',
        zip_code: client.previous_address?.zipCode || '',
        country: client.previous_address?.country || 'US'
      },
      employment: {
        employer_name: client.employment?.employer_name || '',
        job_title: client.employment?.job_title || '',
        work_phone: client.employment?.work_phone || '',
        monthly_income: client.employment?.monthly_income || 0,
        employment_length: client.employment?.employment_length || ''
      },
      preferred_contact_method: client.preferredContactMethod || 'email',
      notes: client.notes || '',
      status: client.status || 'active'
    });
  }

  onSubmit(): void {
    if (this.clientForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.error = null;
      
      const formData = this.clientForm.value;
      
      // Convert date_of_birth to proper format
      if (formData.date_of_birth) {
        formData.date_of_birth = new Date(formData.date_of_birth).toISOString();
      }
      
      // Clean up empty previous address
      if (!formData.previous_address.street) {
        formData.previous_address = null;
      }
      
      // Clean up empty employment info
      if (!formData.employment.employer_name) {
        formData.employment = null;
      }
      
      this.clientsService.updateClient(this.clientId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedClient) => {
            this.toastr.success('Client updated successfully');
            this.router.navigate(['/clients/view', updatedClient.id]);
          },
          error: (error) => {
            console.error('Error updating client:', error);
            this.error = error.error?.message || 'Failed to update client';
            this.isSubmitting = false;
            this.toastr.error(this.error || 'An error occurred');
          }
        });
    } else {
      this.markFormGroupTouched();
      this.toastr.warning('Please fill in all required fields correctly');
    }
  }

  onCancel(): void {
    if (this.clientForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.navigateBack();
      }
    } else {
      this.navigateBack();
    }
  }

  private navigateBack(): void {
    if (this.client) {
      this.router.navigate(['/clients/view', this.client.id]);
    } else {
      this.router.navigate(['/clients']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      if (control) {
        control.markAsTouched();
        
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(nestedKey => {
            control.get(nestedKey)?.markAsTouched();
          });
        }
      }
    });
  }

  // Utility methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.clientForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isNestedFieldInvalid(groupName: string, fieldName: string): boolean {
    const field = this.clientForm.get(`${groupName}.${fieldName}`);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.clientForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['pattern']) return `Please enter a valid ${fieldName.replace('_', ' ')}`;
      if (field.errors['minlength']) return `${fieldName.replace('_', ' ')} is too short`;
      if (field.errors['maxlength']) return `${fieldName.replace('_', ' ')} is too long`;
      if (field.errors['min']) return `${fieldName.replace('_', ' ')} must be greater than 0`;
    }
    return '';
  }

  getNestedFieldError(groupName: string, fieldName: string): string {
    const field = this.clientForm.get(`${groupName}.${fieldName}`);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName.replace('_', ' ')} is required`;
      if (field.errors['pattern']) return `Please enter a valid ${fieldName.replace('_', ' ')}`;
      if (field.errors['minlength']) return `${fieldName.replace('_', ' ')} is too short`;
      if (field.errors['maxlength']) return `${fieldName.replace('_', ' ')} is too long`;
      if (field.errors['min']) return `${fieldName.replace('_', ' ')} must be greater than 0`;
    }
    return '';
  }

  // Format SSN as user types
  onSsnInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = value.substring(0, 3) + '-' + value.substring(3, 5) + '-' + value.substring(5, 9);
    } else if (value.length >= 3) {
      value = value.substring(0, 3) + '-' + value.substring(3);
    }
    this.clientForm.patchValue({ ssn: value });
  }

  // Format phone as user types
  onPhoneInput(event: any, fieldName: string): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = '(' + value.substring(0, 3) + ') ' + value.substring(3, 6) + '-' + value.substring(6, 10);
    } else if (value.length >= 3) {
      value = '(' + value.substring(0, 3) + ') ' + value.substring(3);
    }
    
    if (fieldName.includes('.')) {
      const [group, field] = fieldName.split('.');
      this.clientForm.get(group)?.patchValue({ [field]: value });
    } else {
      this.clientForm.patchValue({ [fieldName]: value });
    }
  }
}