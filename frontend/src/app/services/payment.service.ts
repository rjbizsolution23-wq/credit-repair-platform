/**
 * Rick Jefferson Solutions - Payment Service
 * Angular service for handling Stripe payment processing and subscription management
 * Implements secure frontend payment handling with comprehensive error management
 * 
 * Features:
 * - Stripe Elements integration
 * - Subscription management
 * - Payment processing
 * - Billing history retrieval
 * - Real-time payment status updates
 * 
 * @author Rick Jefferson Solutions Development Team
 * @version 1.0.0
 * @since 2024
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap, retry } from 'rxjs/operators';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Interfaces
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  amount: number;
  interval: string;
  features: string[];
  popular: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface Subscription {
  id: string;
  customerId: string;
  status: string;
  planName: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  amount: number;
  currency: string;
}

export interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  clientSecret?: string;
}

export interface BillingHistory {
  invoices: Invoice[];
  subscriptions: Subscription[];
  hasMore: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface UsageReport {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalRevenue: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    trialSubscriptions: number;
    averageRevenuePerUser: number;
    churnRate: number;
  };
  planBreakdown: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  
  // State management
  private subscriptionSubject = new BehaviorSubject<Subscription | null>(null);
  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public subscription$ = this.subscriptionSubject.asObservable();
  public paymentMethods$ = this.paymentMethodsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeStripe();
  }

  /**
   * Initialize Stripe with publishable key
   */
  private async initializeStripe(): Promise<void> {
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);
      if (!this.stripe) {
        throw new Error('Failed to load Stripe');
      }
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }

  /**
   * Get Stripe instance
   */
  public async getStripe(): Promise<Stripe> {
    if (!this.stripe) {
      await this.initializeStripe();
    }
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    return this.stripe;
  }

  /**
   * Create Stripe Elements
   */
  public async createElements(): Promise<StripeElements> {
    const stripe = await this.getStripe();
    this.elements = stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#14B8A6', // Rick Jefferson Solutions teal
          colorBackground: '#ffffff',
          colorText: '#1E3A8A', // Navy blue
          colorDanger: '#DC2626',
          fontFamily: 'Open Sans, Arial, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px'
        }
      }
    });
    return this.elements;
  }

  /**
   * Create a card element
   */
  public async createCardElement(): Promise<StripeCardElement> {
    const elements = await this.createElements();
    return elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#1E3A8A',
          fontFamily: 'Open Sans, Arial, sans-serif',
          '::placeholder': {
            color: '#6B7280'
          }
        },
        invalid: {
          color: '#DC2626',
          iconColor: '#DC2626'
        }
      },
      hidePostalCode: false
    });
  }

  /**
   * Get available subscription plans
   */
  public getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<any>(`${this.apiUrl}/plans`).pipe(
      map(response => {
        if (response.success) {
          return Object.keys(response.data).map(key => ({
            id: key,
            ...response.data[key]
          }));
        }
        throw new Error(response.message || 'Failed to load plans');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a new customer
   */
  public createCustomer(customerData: Partial<Customer>): Observable<Customer> {
    this.loadingSubject.next(true);
    
    return this.http.post<any>(`${this.apiUrl}/customers`, customerData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create customer');
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Create a subscription
   */
  public async createSubscription(subscriptionData: {
    customerId: string;
    planType: string;
    paymentMethodId: string;
    trialDays?: number;
    couponCode?: string;
  }): Promise<{ subscription: Subscription; clientSecret: string }> {
    this.loadingSubject.next(true);
    
    try {
      const response = await this.http.post<any>(`${this.apiUrl}/subscriptions`, subscriptionData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        const subscription: Subscription = {
          id: response.data.subscriptionId,
          customerId: subscriptionData.customerId,
          status: response.data.status,
          planName: response.data.plan.name,
          currentPeriodStart: new Date(response.data.currentPeriodStart * 1000),
          currentPeriodEnd: new Date(response.data.currentPeriodEnd * 1000),
          cancelAtPeriodEnd: false,
          amount: response.data.plan.amount,
          currency: 'usd'
        };
        
        this.subscriptionSubject.next(subscription);
        this.loadingSubject.next(false);
        
        return {
          subscription,
          clientSecret: response.data.clientSecret
        };
      }
      
      throw new Error(response.message || 'Failed to create subscription');
    } catch (error) {
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Update a subscription
   */
  public updateSubscription(subscriptionId: string, updateData: {
    planType?: string;
    prorationBehavior?: string;
  }): Observable<Subscription> {
    this.loadingSubject.next(true);
    
    return this.http.put<any>(`${this.apiUrl}/subscriptions/${subscriptionId}`, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const subscription: Subscription = {
            id: response.data.subscriptionId,
            customerId: '', // Will be populated from current subscription
            status: response.data.status,
            planName: response.data.plan,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(response.data.currentPeriodEnd * 1000),
            cancelAtPeriodEnd: false,
            amount: 0, // Will be updated
            currency: 'usd'
          };
          
          this.subscriptionSubject.next(subscription);
          return subscription;
        }
        throw new Error(response.message || 'Failed to update subscription');
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Cancel a subscription
   */
  public cancelSubscription(subscriptionId: string, cancellationData: {
    cancelAtPeriodEnd?: boolean;
    reason?: string;
    feedback?: string;
  } = {}): Observable<Subscription> {
    this.loadingSubject.next(true);
    
    return this.http.delete<any>(`${this.apiUrl}/subscriptions/${subscriptionId}`, {
      headers: this.getAuthHeaders(),
      body: cancellationData
    }).pipe(
      map(response => {
        if (response.success) {
          const subscription: Subscription = {
            id: response.data.subscriptionId,
            customerId: '',
            status: response.data.status,
            planName: '',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(),
            cancelAtPeriodEnd: response.data.cancelAtPeriodEnd,
            amount: 0,
            currency: 'usd'
          };
          
          this.subscriptionSubject.next(subscription);
          return subscription;
        }
        throw new Error(response.message || 'Failed to cancel subscription');
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Process a one-time payment
   */
  public async processPayment(paymentData: {
    amount: number;
    currency?: string;
    customerId: string;
    paymentMethodId: string;
    description: string;
  }): Promise<PaymentIntent> {
    this.loadingSubject.next(true);
    
    try {
      const response = await this.http.post<any>(`${this.apiUrl}/process`, paymentData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        this.loadingSubject.next(false);
        return {
          id: response.data.paymentIntentId,
          status: response.data.status,
          amount: response.data.amount,
          currency: response.data.currency
        };
      }
      
      throw new Error(response.message || 'Failed to process payment');
    } catch (error) {
      this.loadingSubject.next(false);
      throw error;
    }
  }

  /**
   * Confirm payment with Stripe
   */
  public async confirmPayment(clientSecret: string, paymentMethod: any): Promise<any> {
    const stripe = await this.getStripe();
    
    return stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });
  }

  /**
   * Create payment method
   */
  public async createPaymentMethod(cardElement: StripeCardElement, billingDetails: any): Promise<any> {
    const stripe = await this.getStripe();
    
    return stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails
    });
  }

  /**
   * Get billing history for a customer
   */
  public getBillingHistory(customerId: string, options: {
    limit?: number;
    startingAfter?: string;
  } = {}): Observable<BillingHistory> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.startingAfter) params.append('startingAfter', options.startingAfter);
    
    return this.http.get<any>(`${this.apiUrl}/billing-history/${customerId}?${params.toString()}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return {
            invoices: response.data.invoices.map((invoice: any) => ({
              id: invoice.id,
              number: invoice.number,
              status: invoice.status,
              amount: invoice.amount_paid || invoice.amount_due,
              currency: invoice.currency,
              created: new Date(invoice.created * 1000),
              paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : undefined,
              hostedInvoiceUrl: invoice.hosted_invoice_url,
              invoicePdf: invoice.invoice_pdf
            })),
            subscriptions: response.data.subscriptions.map((sub: any) => ({
              id: sub.id,
              customerId: sub.customer,
              status: sub.status,
              planName: sub.metadata?.plan_name || 'Unknown',
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
              amount: sub.items?.data[0]?.price?.unit_amount || 0,
              currency: sub.items?.data[0]?.price?.currency || 'usd'
            })),
            hasMore: response.data.hasMore
          };
        }
        throw new Error(response.message || 'Failed to retrieve billing history');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Generate usage report (Admin only)
   */
  public generateUsageReport(options: {
    startDate?: string;
    endDate?: string;
  } = {}): Observable<UsageReport> {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    
    return this.http.get<any>(`${this.apiUrl}/usage-report?${params.toString()}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to generate usage report');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check payment service health
   */
  public checkServiceHealth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/health`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Service health check failed');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Format currency amount
   */
  public formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount / 100); // Stripe amounts are in cents
  }

  /**
   * Get plan display information
   */
  public getPlanDisplayInfo(planType: string): { name: string; color: string; icon: string } {
    const planInfo = {
      basic: {
        name: 'Basic Credit Repair',
        color: '#059669', // Success green
        icon: 'credit_card'
      },
      professional: {
        name: 'Professional Credit Repair',
        color: '#14B8A6', // Teal
        icon: 'verified'
      },
      premium: {
        name: 'Premium Credit + Wealth',
        color: '#D97706', // Warning orange
        icon: 'diamond'
      },
      enterprise: {
        name: 'Enterprise Solutions',
        color: '#1E3A8A', // Navy blue
        icon: 'business'
      }
    };
    
    return planInfo[planType as keyof typeof planInfo] || planInfo.basic;
  }

  /**
   * Get subscription status display information
   */
  public getStatusDisplayInfo(status: string): { label: string; color: string; icon: string } {
    const statusInfo = {
      active: {
        label: 'Active',
        color: '#059669', // Success green
        icon: 'check_circle'
      },
      trialing: {
        label: 'Trial',
        color: '#14B8A6', // Teal
        icon: 'schedule'
      },
      past_due: {
        label: 'Past Due',
        color: '#D97706', // Warning orange
        icon: 'warning'
      },
      canceled: {
        label: 'Canceled',
        color: '#DC2626', // Error red
        icon: 'cancel'
      },
      unpaid: {
        label: 'Unpaid',
        color: '#DC2626', // Error red
        icon: 'error'
      },
      incomplete: {
        label: 'Incomplete',
        color: '#6B7280', // Gray
        icon: 'hourglass_empty'
      }
    };
    
    return statusInfo[status as keyof typeof statusInfo] || statusInfo.incomplete;
  }

  // Private helper methods

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errors) {
        errorMessage = error.error.errors.map((e: any) => e.msg).join(', ');
      } else {
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in.';
            break;
          case 403:
            errorMessage = 'Access denied. Insufficient permissions.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Error ${error.status}: ${error.statusText}`;
        }
      }
    }
    
    console.error('Payment service error:', error);
    return throwError(errorMessage);
  }
}

/**
 * Rick Jefferson Solutions - Payment Service
 * Comprehensive Angular service for Stripe payment processing
 * 
 * Key Features:
 * - Stripe Elements integration with custom styling
 * - Subscription lifecycle management
 * - Secure payment processing
 * - Real-time state management
 * - Comprehensive error handling
 * - Billing history and analytics
 * 
 * Security Features:
 * - JWT token authentication
 * - Secure API communication
 * - Client-side validation
 * - Error logging and monitoring
 * 
 * UI/UX Features:
 * - Rick Jefferson Solutions branding
 * - Responsive design support
 * - Loading states management
 * - User-friendly error messages
 * - Currency formatting
 * - Status indicators
 */