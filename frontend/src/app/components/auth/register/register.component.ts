// Rick Jefferson Solutions - Registration Component
// Secure client registration with comprehensive validation and compliance
// Implements TCPA consent, email verification, and role-based onboarding

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

// Interfaces
interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  ssn: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  tcpaConsent: boolean;
  emailConsent: boolean;
  privacyPolicy: boolean;
  termsOfService: boolean;
  referralCode?: string;
  marketingSource?: string;
}

interface RegistrationStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  field?: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form Management
  registrationForm: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  isLoading = false;
  isSubmitting = false;
  
  // UI State
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  passwordStrengthText = '';
  
  // Validation
  validationMessages: ValidationMessage[] = [];
  fieldErrors: { [key: string]: string } = {};
  
  // Steps Configuration
  steps: RegistrationStep[] = [
    {
      id: 1,
      title: 'Personal Information',
      description: 'Basic details and contact information',
      isCompleted: false,
      isActive: true
    },
    {
      id: 2,
      title: 'Address & Identity',
      description: 'Address verification and identity confirmation',
      isCompleted: false,
      isActive: false
    },
    {
      id: 3,
      title: 'Security Setup',
      description: 'Password creation and security preferences',
      isCompleted: false,
      isActive: false
    },
    {
      id: 4,
      title: 'Consent & Verification',
      description: 'Legal agreements and account verification',
      isCompleted: false,
      isActive: false
    }
  ];
  
  // Data Lists
  states = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];
  
  marketingSources = [
    'Google Search',
    'Facebook',
    'Instagram',
    'YouTube',
    'Referral',
    'Radio',
    'TV',
    'Print Ad',
    'Direct Mail',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadReferralCode();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Form Initialization
  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      // Step 1: Personal Information
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, this.businessEmailValidator]],
      phone: ['', [Validators.required, this.phoneValidator]],
      
      // Step 2: Address & Identity
      dateOfBirth: ['', [Validators.required, this.ageValidator]],
      ssn: ['', [Validators.required, this.ssnValidator]],
      street: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, this.zipCodeValidator]],
      
      // Step 3: Security Setup
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      
      // Step 4: Consent & Verification
      tcpaConsent: [false, [Validators.requiredTrue]],
      emailConsent: [false],
      privacyPolicy: [false, [Validators.requiredTrue]],
      termsOfService: [false, [Validators.requiredTrue]],
      
      // Optional
      referralCode: [''],
      marketingSource: ['']
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  private setupFormValidation(): void {
    // Password strength monitoring
    this.registrationForm.get('password')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(password => {
        this.updatePasswordStrength(password);
      });

    // Real-time validation
    this.registrationForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateValidationMessages();
      });
  }

  private loadReferralCode(): void {
    const referralCode = this.route.snapshot.queryParams['ref'];
    if (referralCode) {
      this.registrationForm.patchValue({ referralCode });
    }
  }

  // Custom Validators
  private businessEmailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const email = control.value.toLowerCase();
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = email.split('@')[1];
    
    if (commonDomains.includes(domain)) {
      return { businessEmail: true };
    }
    
    return null;
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const phone = control.value.replace(/\D/g, '');
    if (phone.length !== 10) {
      return { invalidPhone: true };
    }
    
    return null;
  }

  private ageValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const birthDate = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 18) {
      return { underage: true };
    }
    
    if (age > 120) {
      return { invalidAge: true };
    }
    
    return null;
  }

  private ssnValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const ssn = control.value.replace(/\D/g, '');
    if (ssn.length !== 9) {
      return { invalidSSN: true };
    }
    
    // Check for invalid SSN patterns
    if (ssn === '000000000' || ssn === '123456789' || /^(\d)\1{8}$/.test(ssn)) {
      return { invalidSSN: true };
    }
    
    return null;
  }

  private zipCodeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const zipCode = control.value.replace(/\D/g, '');
    if (zipCode.length !== 5 && zipCode.length !== 9) {
      return { invalidZipCode: true };
    }
    
    return null;
  }

  private passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const password = control.value;
    const errors: ValidationErrors = {};
    
    if (password.length < 8) {
      errors['minLength'] = true;
    }
    
    if (!/[A-Z]/.test(password)) {
      errors['uppercase'] = true;
    }
    
    if (!/[a-z]/.test(password)) {
      errors['lowercase'] = true;
    }
    
    if (!/\d/.test(password)) {
      errors['number'] = true;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors['specialChar'] = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Password Strength Calculation
  private updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      return;
    }
    
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      password.length >= 12
    ];
    
    strength = checks.filter(check => check).length;
    this.passwordStrength = Math.min(strength * 20, 100);
    
    if (this.passwordStrength < 40) {
      this.passwordStrengthText = 'Weak';
    } else if (this.passwordStrength < 70) {
      this.passwordStrengthText = 'Fair';
    } else if (this.passwordStrength < 90) {
      this.passwordStrengthText = 'Good';
    } else {
      this.passwordStrengthText = 'Strong';
    }
  }

  // Validation Messages
  private updateValidationMessages(): void {
    this.validationMessages = [];
    this.fieldErrors = {};
    
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      if (control && control.errors && (control.dirty || control.touched)) {
        this.fieldErrors[key] = this.getErrorMessage(key, control.errors);
      }
    });
    
    // Form-level errors
    if (this.registrationForm.errors?.['passwordMismatch']) {
      this.validationMessages.push({
        type: 'error',
        message: 'Passwords do not match',
        field: 'confirmPassword'
      });
    }
  }

  private getErrorMessage(fieldName: string, errors: ValidationErrors): string {
    const fieldDisplayNames: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      dateOfBirth: 'Date of Birth',
      ssn: 'SSN',
      street: 'Street Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    };
    
    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    if (errors['required']) {
      return `${displayName} is required`;
    }
    
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    
    if (errors['businessEmail']) {
      return 'Business email preferred for professional services';
    }
    
    if (errors['invalidPhone']) {
      return 'Please enter a valid 10-digit phone number';
    }
    
    if (errors['underage']) {
      return 'You must be 18 or older to register';
    }
    
    if (errors['invalidAge']) {
      return 'Please enter a valid date of birth';
    }
    
    if (errors['invalidSSN']) {
      return 'Please enter a valid 9-digit SSN';
    }
    
    if (errors['invalidZipCode']) {
      return 'Please enter a valid ZIP code';
    }
    
    if (errors['minLength']) {
      return 'Password must be at least 8 characters';
    }
    
    if (errors['uppercase']) {
      return 'Password must contain an uppercase letter';
    }
    
    if (errors['lowercase']) {
      return 'Password must contain a lowercase letter';
    }
    
    if (errors['number']) {
      return 'Password must contain a number';
    }
    
    if (errors['specialChar']) {
      return 'Password must contain a special character';
    }
    
    return `${displayName} is invalid`;
  }

  // Step Navigation
  nextStep(): void {
    if (this.isStepValid(this.currentStep)) {
      this.steps[this.currentStep - 1].isCompleted = true;
      this.steps[this.currentStep - 1].isActive = false;
      
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.steps[this.currentStep - 1].isActive = true;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 1].isActive = false;
      this.currentStep--;
      this.steps[this.currentStep - 1].isActive = true;
      this.steps[this.currentStep - 1].isCompleted = false;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.steps[step - 1].isCompleted) {
      this.steps[this.currentStep - 1].isActive = false;
      this.currentStep = step;
      this.steps[this.currentStep - 1].isActive = true;
    }
  }

  private isStepValid(step: number): boolean {
    const stepFields: { [key: number]: string[] } = {
      1: ['firstName', 'lastName', 'email', 'phone'],
      2: ['dateOfBirth', 'ssn', 'street', 'city', 'state', 'zipCode'],
      3: ['password', 'confirmPassword'],
      4: ['tcpaConsent', 'privacyPolicy', 'termsOfService']
    };
    
    const fields = stepFields[step] || [];
    return fields.every(field => {
      const control = this.registrationForm.get(field);
      return control && control.valid;
    }) && !this.registrationForm.errors?.['passwordMismatch'];
  }

  // Form Submission
  async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid || this.isSubmitting) {
      this.markAllFieldsAsTouched();
      return;
    }
    
    this.isSubmitting = true;
    
    try {
      const formData = this.registrationForm.value;
      const registrationData: RegistrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        dateOfBirth: formData.dateOfBirth,
        ssn: formData.ssn,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        tcpaConsent: formData.tcpaConsent,
        emailConsent: formData.emailConsent,
        privacyPolicy: formData.privacyPolicy,
        termsOfService: formData.termsOfService,
        referralCode: formData.referralCode,
        marketingSource: formData.marketingSource
      };
      
      const result = await this.authService.register(registrationData).toPromise();
      
      if (result.success) {
        this.validationMessages.push({
          type: 'success',
          message: 'Registration successful! Please check your email to verify your account.'
        });
        
        // Redirect to email verification page
        setTimeout(() => {
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: registrationData.email }
          });
        }, 2000);
      }
    } catch (error: any) {
      this.validationMessages.push({
        type: 'error',
        message: error.message || 'Registration failed. Please try again.'
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      this.registrationForm.get(key)?.markAsTouched();
    });
    this.updateValidationMessages();
  }

  // UI Helpers
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    this.registrationForm.patchValue({ phone: value });
  }

  formatSSN(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 5) {
      value = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5, 9)}`;
    } else if (value.length >= 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    this.registrationForm.patchValue({ ssn: value });
  }

  formatZipCode(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5, 9)}`;
    }
    this.registrationForm.patchValue({ zipCode: value });
  }

  // Navigation
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  // Getters for template
  get currentStepData(): RegistrationStep {
    return this.steps[this.currentStep - 1];
  }

  get progressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get canProceed(): boolean {
    return this.isStepValid(this.currentStep);
  }

  get isLastStep(): boolean {
    return this.currentStep === this.totalSteps;
  }

  get passwordStrengthClass(): string {
    if (this.passwordStrength < 40) return 'weak';
    if (this.passwordStrength < 70) return 'fair';
    if (this.passwordStrength < 90) return 'good';
    return 'strong';
  }
}

// Rick Jefferson Solutions - Registration Component
// Comprehensive client onboarding with legal compliance
// Implements multi-step validation and security standards