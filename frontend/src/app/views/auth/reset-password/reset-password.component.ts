import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  token: string | null = null;
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength = 0;
  
  private destroy$ = new Subject<void>();

  // Password requirements
  passwordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.createForm();
  }

  ngOnInit(): void {
    // Get token from URL
    this.token = this.route.snapshot.queryParams['token'];
    
    if (!this.token) {
      this.error = 'Invalid or missing reset token. Please request a new password reset.';
      return;
    }

    // Validate token
    this.validateToken();

    // Check if user is already authenticated
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });

    // Watch password changes for strength calculation
    this.resetForm.get('password')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(password => {
      this.calculatePasswordStrength(password);
      this.updatePasswordRequirements(password);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordStrengthValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.value;
    if (!password) return null;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const minLength = password.length >= 8;

    const validConditions = [hasUppercase, hasLowercase, hasNumber, hasSpecial, minLength];
    const validCount = validConditions.filter(condition => condition).length;

    if (validCount < 4) {
      return { weakPassword: true };
    }

    return null;
  }

  private passwordMatchValidator(group: AbstractControl): {[key: string]: any} | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  private validateToken(): void {
    if (!this.token) return;

    this.loading = true;
    this.authService.validateResetToken(this.token).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.valid) {
          this.error = 'This reset link has expired or is invalid. Please request a new password reset.';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Unable to validate reset token. Please try again.';
      }
    });
  }

  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      return;
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;
    
    // Bonus for very long passwords
    if (password.length >= 16) strength += 10;
    
    this.passwordStrength = Math.min(strength, 100);
  }

  private updatePasswordRequirements(password: string): void {
    this.passwordRequirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength === 0) return '';
    if (this.passwordStrength < 30) return 'Weak';
    if (this.passwordStrength < 60) return 'Fair';
    if (this.passwordStrength < 80) return 'Good';
    return 'Strong';
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength === 0) return '';
    if (this.passwordStrength < 30) return 'weak';
    if (this.passwordStrength < 60) return 'fair';
    if (this.passwordStrength < 80) return 'good';
    return 'strong';
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const { password } = this.resetForm.value;

    this.authService.resetPassword({
      token: this.token,
      password: password
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { message: 'Password reset successful. Please log in with your new password.' }
          });
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;

    if (fieldName === 'password') {
      if (errors['required']) return 'Password is required';
      if (errors['minlength']) return 'Password must be at least 8 characters long';
      if (errors['weakPassword']) return 'Password does not meet strength requirements';
    }

    if (fieldName === 'confirmPassword') {
      if (errors['required']) return 'Please confirm your password';
    }

    // Form-level errors
    if (this.resetForm.errors?.['passwordMismatch'] && fieldName === 'confirmPassword') {
      return 'Passwords do not match';
    }

    return 'Invalid input';
  }
}