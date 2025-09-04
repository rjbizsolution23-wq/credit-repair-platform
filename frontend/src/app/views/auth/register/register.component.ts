import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  acceptTerms = false;
  acceptPrivacy = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkAuthStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptPrivacy: [false, [Validators.requiredTrue]]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  private checkAuthStatus(): void {
    this.authService.isAuthenticated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        if (isAuth) {
          this.router.navigate(['/dashboard']);
        }
      });
  }

  // Custom validators
  private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);

    const valid = hasNumber && hasUpper && hasLower && hasSpecial;
    if (!valid) {
      return { passwordStrength: true };
    }
    return null;
  }

  private passwordMatchValidator(group: AbstractControl): { [key: string]: any } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Clear the error if passwords match
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

  // Form control getters
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get terms() { return this.registerForm.get('acceptTerms'); }
  get privacy() { return this.registerForm.get('acceptPrivacy'); }

  // Password visibility toggles
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Password strength calculation
  getPasswordStrength(): { score: number; label: string; color: string } {
    const password = this.password?.value || '';
    let score = 0;
    let label = 'Very Weak';
    let color = '#dc3545';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[#?!@$%^&*-]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        label = 'Very Weak';
        color = '#dc3545';
        break;
      case 2:
        label = 'Weak';
        color = '#fd7e14';
        break;
      case 3:
        label = 'Fair';
        color = '#ffc107';
        break;
      case 4:
        label = 'Good';
        color = '#20c997';
        break;
      case 5:
        label = 'Strong';
        color = '#28a745';
        break;
    }

    return { score, label, color };
  }

  // Form submission
  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = this.registerForm.value;
      const registerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        password: formData.password
      };

      this.authService.register(registerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            // Registration successful - redirect to login or dashboard
            if (response.requiresEmailVerification) {
              this.router.navigate(['/auth/verify-email'], {
                queryParams: { email: registerData.email }
              });
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Registration failed. Please try again.';
            
            // Handle specific validation errors
            if (error.validationErrors) {
              this.handleValidationErrors(error.validationErrors);
            }
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleValidationErrors(errors: any): void {
    Object.keys(errors).forEach(field => {
      const control = this.registerForm.get(field);
      if (control) {
        control.setErrors({ server: errors[field] });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Navigation methods
  navigateToLogin(): void {
    if (!this.isLoading) {
      this.router.navigate(['/auth/login']);
    }
  }

  // Error message helpers
  getFieldErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    // Server validation errors
    if (errors['server']) {
      return errors['server'];
    }

    // Client validation errors
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        if (errors['required']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
        if (errors['minlength']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
        if (errors['maxlength']) return `${fieldName === 'firstName' ? 'First' : 'Last'} name cannot exceed 50 characters`;
        break;

      case 'email':
        if (errors['required']) return 'Email address is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;

      case 'phone':
        if (errors['pattern']) return 'Please enter a valid phone number';
        break;

      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters';
        if (errors['maxlength']) return 'Password cannot exceed 128 characters';
        if (errors['passwordStrength']) return 'Password must contain uppercase, lowercase, number, and special character';
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        break;

      case 'acceptTerms':
        if (errors['required']) return 'You must accept the Terms of Service';
        break;

      case 'acceptPrivacy':
        if (errors['required']) return 'You must accept the Privacy Policy';
        break;
    }

    return 'Invalid input';
  }

  // Utility methods
  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  isFieldValid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.valid && control.touched);
  }

  dismissError(): void {
    this.errorMessage = '';
  }

  // Social registration methods (placeholder for future implementation)
  registerWithGoogle(): void {
    if (!this.isLoading) {
      // TODO: Implement Google OAuth registration
      console.log('Google registration not implemented yet');
    }
  }

  registerWithMicrosoft(): void {
    if (!this.isLoading) {
      // TODO: Implement Microsoft OAuth registration
      console.log('Microsoft registration not implemented yet');
    }
  }
}