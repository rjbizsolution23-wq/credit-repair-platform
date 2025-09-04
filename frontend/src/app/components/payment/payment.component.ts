/**
 * Rick Jefferson Solutions - Payment Component
 * Angular component for subscription management and payment processing
 * Provides secure Stripe integration with Rick Jefferson Solutions branding
 * 
 * Features:
 * - Subscription plan selection
 * - Secure payment processing
 * - Billing history management
 * - Payment method management
 * - Real-time payment status updates
 * 
 * @author Rick Jefferson Solutions Development Team
 * @version 1.0.0
 * @since 2024
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { StripeCardElement } from '@stripe/stripe-js';
import { PaymentService, SubscriptionPlan, Subscription, BillingHistory, Customer } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardElement', { static: false }) cardElementRef!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private cardElement: StripeCardElement | null = null;
  
  // Component state
  currentStep: 'plans' | 'payment' | 'confirmation' = 'plans';
  loading = false;
  processing = false;
  
  // Data
  subscriptionPlans: SubscriptionPlan[] = [];
  selectedPlan: SubscriptionPlan | null = null;
  currentSubscription: Subscription | null = null;
  billingHistory: BillingHistory | null = null;
  customer: Customer | null = null;
  
  // Forms
  paymentForm: FormGroup;
  billingForm: FormGroup;
  
  // UI state
  showBillingHistory = false;
  showPaymentMethods = false;
  cardErrors: string | null = null;
  paymentSuccess = false;
  
  // Plan features for display
  planFeatures = {
    basic: [
      'Credit Report Analysis',
      'Basic Dispute Letters',
      'Monthly Progress Reports',
      'Email Support',
      'Educational Resources'
    ],
    professional: [
      'Everything in Basic',
      'Advanced Dispute Strategies',
      'Furnisher Direct Disputes',
      'Goodwill Letter Templates',
      'Phone Support',
      'Bi-weekly Progress Reports'
    ],
    premium: [
      'Everything in Professional',
      'Personal Credit Specialist',
      'Wealth Building Strategies',
      'Business Credit Setup',
      'Priority Support',
      'Weekly Progress Reports',
      'Custom Letter Templates'
    ],
    enterprise: [
      'Everything in Premium',
      'Dedicated Account Manager',
      'White-label Solutions',
      'API Access',
      'Custom Integrations',
      'Advanced Analytics',
      '24/7 Priority Support'
    ]
  };

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.subscribeToPaymentUpdates();
  }

  ngAfterViewInit(): void {
    this.initializeStripeElements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  /**
   * Initialize reactive forms
   */
  private initializeForms(): void {
    this.paymentForm = this.fb.group({
      couponCode: [''],
      acceptTerms: [false, Validators.requiredTrue]
    });

    this.billingForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      address: this.fb.group({
        line1: ['', Validators.required],
        line2: [''],
        city: ['', Validators.required],
        state: ['', Validators.required],
        postal_code: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
        country: ['US', Validators.required]
      })
    });
  }

  /**
   * Load initial component data
   */
  private async loadInitialData(): Promise<void> {
    this.loading = true;
    
    try {
      // Load subscription plans
      this.paymentService.getSubscriptionPlans()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (plans) => {
            this.subscriptionPlans = plans;
          },
          error: (error) => {
            console.error('Error loading subscription plans:', error);
            this.showError('Failed to load subscription plans');
          }
        });

      // Load current user data
      const user = this.authService.getCurrentUser();
      if (user) {
        this.billingForm.patchValue({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone
        });
      }

      // Load current subscription if exists
      this.paymentService.subscription$
        .pipe(takeUntil(this.destroy$))
        .subscribe(subscription => {
          this.currentSubscription = subscription;
        });

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load payment information');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Subscribe to payment service updates
   */
  private subscribeToPaymentUpdates(): void {
    this.paymentService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.processing = loading;
      });
  }

  /**
   * Initialize Stripe Elements
   */
  private async initializeStripeElements(): Promise<void> {
    try {
      this.cardElement = await this.paymentService.createCardElement();
      
      if (this.cardElementRef?.nativeElement) {
        this.cardElement.mount(this.cardElementRef.nativeElement);
        
        // Listen for card element changes
        this.cardElement.on('change', (event) => {
          this.cardErrors = event.error ? event.error.message : null;
        });
      }
    } catch (error) {
      console.error('Error initializing Stripe elements:', error);
      this.showError('Failed to initialize payment form');
    }
  }

  /**
   * Select a subscription plan
   */
  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.currentStep = 'payment';
  }

  /**
   * Go back to plan selection
   */
  goBackToPlans(): void {
    this.currentStep = 'plans';
    this.selectedPlan = null;
  }

  /**
   * Process subscription payment
   */
  async processSubscription(): Promise<void> {
    if (!this.selectedPlan || !this.cardElement || !this.billingForm.valid || !this.paymentForm.valid) {
      this.showError('Please complete all required fields');
      return;
    }

    this.processing = true;
    
    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await this.paymentService.createPaymentMethod(
        this.cardElement,
        {
          name: this.billingForm.get('name')?.value,
          email: this.billingForm.get('email')?.value,
          phone: this.billingForm.get('phone')?.value,
          address: this.billingForm.get('address')?.value
        }
      );

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create customer if needed
      const customerData = {
        email: this.billingForm.get('email')?.value,
        name: this.billingForm.get('name')?.value,
        phone: this.billingForm.get('phone')?.value,
        address: this.billingForm.get('address')?.value
      };

      const customer = await this.paymentService.createCustomer(customerData).toPromise();
      this.customer = customer;

      // Create subscription
      const subscriptionData = {
        customerId: customer.id,
        planType: this.selectedPlan.id,
        paymentMethodId: paymentMethod.id,
        couponCode: this.paymentForm.get('couponCode')?.value || undefined
      };

      const { subscription, clientSecret } = await this.paymentService.createSubscription(subscriptionData);

      // Confirm payment if needed
      if (clientSecret) {
        const { error: confirmError } = await this.paymentService.confirmPayment(clientSecret, paymentMethod);
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Success
      this.currentSubscription = subscription;
      this.currentStep = 'confirmation';
      this.paymentSuccess = true;
      
      this.showSuccess('Subscription created successfully! Welcome to Rick Jefferson Solutions.');
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 3000);

    } catch (error) {
      console.error('Error processing subscription:', error);
      this.showError(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      this.processing = false;
    }
  }

  /**
   * Load billing history
   */
  loadBillingHistory(): void {
    if (!this.customer) {
      this.showError('Customer information not available');
      return;
    }

    this.loading = true;
    
    this.paymentService.getBillingHistory(this.customer.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.billingHistory = history;
          this.showBillingHistory = true;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading billing history:', error);
          this.showError('Failed to load billing history');
          this.loading = false;
        }
      });
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(newPlan: SubscriptionPlan): Promise<void> {
    if (!this.currentSubscription) {
      this.showError('No active subscription found');
      return;
    }

    this.processing = true;
    
    try {
      const updateData = {
        planType: newPlan.id,
        prorationBehavior: 'create_prorations'
      };

      await this.paymentService.updateSubscription(this.currentSubscription.id, updateData).toPromise();
      
      this.showSuccess('Subscription updated successfully!');
      
    } catch (error) {
      console.error('Error updating subscription:', error);
      this.showError('Failed to update subscription');
    } finally {
      this.processing = false;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<void> {
    if (!this.currentSubscription) {
      this.showError('No active subscription found');
      return;
    }

    const confirmed = confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.');
    
    if (!confirmed) {
      return;
    }

    this.processing = true;
    
    try {
      const cancellationData = {
        cancelAtPeriodEnd: true,
        reason: 'user_requested'
      };

      await this.paymentService.cancelSubscription(this.currentSubscription.id, cancellationData).toPromise();
      
      this.showSuccess('Subscription cancelled. You will continue to have access until the end of your current billing period.');
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      this.showError('Failed to cancel subscription');
    } finally {
      this.processing = false;
    }
  }

  /**
   * Download invoice
   */
  downloadInvoice(invoiceUrl: string): void {
    window.open(invoiceUrl, '_blank');
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return this.paymentService.formatCurrency(amount, currency);
  }

  /**
   * Get plan display information
   */
  getPlanDisplayInfo(planType: string) {
    return this.paymentService.getPlanDisplayInfo(planType);
  }

  /**
   * Get subscription status display information
   */
  getStatusDisplayInfo(status: string) {
    return this.paymentService.getStatusDisplayInfo(status);
  }

  /**
   * Get plan features for display
   */
  getPlanFeatures(planId: string): string[] {
    return this.planFeatures[planId as keyof typeof this.planFeatures] || [];
  }

  /**
   * Check if plan is popular
   */
  isPlanPopular(plan: SubscriptionPlan): boolean {
    return plan.popular || plan.id === 'professional';
  }

  /**
   * Get plan savings text
   */
  getPlanSavings(plan: SubscriptionPlan): string {
    if (plan.interval === 'year') {
      return 'Save 20%';
    }
    return '';
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.billingForm.valid && this.paymentForm.valid && !this.cardErrors;
  }

  /**
   * Get form field error message
   */
  getFieldError(fieldName: string): string {
    const field = this.billingForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['pattern']) {
        return `Please enter a valid ${fieldName}`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  /**
   * Handle step navigation
   */
  canProceedToPayment(): boolean {
    return !!this.selectedPlan;
  }

  canProcessPayment(): boolean {
    return this.isFormValid() && !!this.selectedPlan && !this.processing;
  }
}

/**
 * Rick Jefferson Solutions - Payment Component
 * Comprehensive Angular component for subscription and payment management
 * 
 * Key Features:
 * - Multi-step payment flow
 * - Stripe Elements integration
 * - Real-time form validation
 * - Subscription management
 * - Billing history display
 * - Rick Jefferson Solutions branding
 * 
 * Security Features:
 * - Secure payment processing
 * - Form validation and sanitization
 * - Error handling and logging
 * - PCI compliance through Stripe
 * 
 * UI/UX Features:
 * - Responsive design
 * - Loading states
 * - Error messaging
 * - Success confirmations
 * - Professional styling
 */