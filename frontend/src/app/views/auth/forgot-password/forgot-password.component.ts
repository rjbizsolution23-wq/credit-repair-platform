import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailSent = false;
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
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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

  // Form control getters
  get email() { return this.forgotPasswordForm.get('email'); }

  // Form submission
  onSubmit(): void {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const email = this.email?.value.trim().toLowerCase();

      this.authService.requestPasswordReset({ email })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.emailSent = true;
            this.successMessage = response.message || 
              'Password reset instructions have been sent to your email address.';
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 
              'Failed to send password reset email. Please try again.';
            
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
      const control = this.forgotPasswordForm.get(field);
      if (control) {
        control.setErrors({ server: errors[field] });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
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

  navigateToRegister(): void {
    if (!this.isLoading) {
      this.router.navigate(['/auth/register']);
    }
  }

  // Resend email
  resendEmail(): void {
    if (!this.isLoading && this.email?.valid) {
      this.emailSent = false;
      this.onSubmit();
    }
  }

  // Reset form
  resetForm(): void {
    if (!this.isLoading) {
      this.emailSent = false;
      this.successMessage = '';
      this.errorMessage = '';
      this.forgotPasswordForm.reset();
    }
  }

  // Error message helpers
  getFieldErrorMessage(fieldName: string): string {
    const control = this.forgotPasswordForm.get(fieldName);
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
      case 'email':
        if (errors['required']) return 'Email address is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;
    }

    return 'Invalid input';
  }

  // Utility methods
  isFieldInvalid(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  isFieldValid(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.valid && control.touched);
  }

  dismissError(): void {
    this.errorMessage = '';
  }

  dismissSuccess(): void {
    this.successMessage = '';
  }
}