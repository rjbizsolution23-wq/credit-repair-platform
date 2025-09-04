import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AuthService, LoginRequest } from '../../../services/auth.service';

// Login Component for Rick Jefferson Solutions
// Secure authentication interface with 2FA support
// Implements brand-compliant design and user experience

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  twoFactorForm: FormGroup;
  isLoading = false;
  showTwoFactor = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';
  redirectUrl = '';
  rememberMe = false;
  twoFactorMethod: 'sms' | 'email' | 'authenticator' | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
    this.twoFactorForm = this.createTwoFactorForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.redirectAfterLogin();
        }
      });

    // Get redirect URL from query params or session storage
    this.redirectUrl = this.route.snapshot.queryParams['returnUrl'] || 
                     sessionStorage.getItem('rjs_redirect_url') || 
                     this.getDefaultRedirectUrl();

    // Clear any existing error messages
    this.clearMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  private createTwoFactorForm(): FormGroup {
    return this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe
    };

    this.authService.login(loginData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.requiresTwoFactor) {
            this.showTwoFactor = true;
            this.twoFactorMethod = response.twoFactorMethod || 'sms';
            this.successMessage = `Verification code sent to your ${this.getTwoFactorMethodDisplay()}`;
          } else {
            this.handleSuccessfulLogin();
          }
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      });
  }

  onTwoFactorSubmit(): void {
    if (this.twoFactorForm.invalid) {
      this.markFormGroupTouched(this.twoFactorForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const email = this.loginForm.value.email;
    const code = this.twoFactorForm.value.code;

    this.authService.verifyTwoFactor(email, code)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.handleSuccessfulLogin();
        },
        error: (error) => {
          this.handleTwoFactorError(error);
        }
      });
  }

  resendTwoFactorCode(): void {
    this.isLoading = true;
    this.clearMessages();

    // Resend by attempting login again
    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.successMessage = `New verification code sent to your ${this.getTwoFactorMethodDisplay()}`;
        },
        error: (error) => {
          this.errorMessage = 'Failed to resend verification code. Please try again.';
        }
      });
  }

  backToLogin(): void {
    this.showTwoFactor = false;
    this.twoFactorForm.reset();
    this.clearMessages();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  private handleSuccessfulLogin(): void {
    this.successMessage = 'Login successful! Redirecting...';
    
    // Clear stored redirect URL
    sessionStorage.removeItem('rjs_redirect_url');
    
    // Small delay to show success message
    setTimeout(() => {
      this.redirectAfterLogin();
    }, 1000);
  }

  private redirectAfterLogin(): void {
    if (this.redirectUrl && this.redirectUrl !== '/login') {
      this.router.navigateByUrl(this.redirectUrl);
    } else {
      this.router.navigate([this.getDefaultRedirectUrl()]);
    }
  }

  private getDefaultRedirectUrl(): string {
    // This will be determined by the user's role after authentication
    // For now, default to dashboard
    return '/dashboard';
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    
    if (error.status === 401) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.status === 423) {
      this.errorMessage = 'Account is locked. Please contact support.';
    } else if (error.status === 403) {
      this.errorMessage = 'Account is suspended. Please contact support.';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'Login failed. Please try again later.';
    }
  }

  private handleTwoFactorError(error: any): void {
    console.error('Two-factor authentication error:', error);
    
    if (error.status === 401) {
      this.errorMessage = 'Invalid verification code. Please try again.';
    } else if (error.status === 429) {
      this.errorMessage = 'Too many attempts. Please wait before trying again.';
    } else if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'Verification failed. Please try again.';
    }
  }

  private getTwoFactorMethodDisplay(): string {
    switch (this.twoFactorMethod) {
      case 'sms':
        return 'phone';
      case 'email':
        return 'email';
      case 'authenticator':
        return 'authenticator app';
      default:
        return 'device';
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

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string, formGroup: FormGroup = this.loginForm): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string, formGroup: FormGroup = this.loginForm): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    
    if (errors['minlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    }
    
    if (errors['pattern']) {
      if (fieldName === 'code') {
        return 'Verification code must be 6 digits';
      }
    }
    
    return 'Invalid input';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      code: 'Verification code'
    };
    
    return displayNames[fieldName] || fieldName;
  }

  // Accessibility helpers
  getAriaDescribedBy(fieldName: string): string {
    return this.isFieldInvalid(fieldName) ? `${fieldName}-error` : '';
  }

  // Rick Jefferson Solutions branding
  readonly brandInfo = {
    companyName: 'Rick Jefferson Solutions',
    tagline: 'Your Credit Freedom Starts Here',
    phone: '877-763-8587',
    email: 'info@rickjeffersonsolutions.com',
    website: 'rickjeffersonsolutions.com'
  };
}

// Rick Jefferson Solutions - Login Component
// Secure authentication with comprehensive error handling
// Implements 2FA support and brand-compliant design
// Built for credit repair platform user experience