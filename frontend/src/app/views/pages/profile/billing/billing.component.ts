import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="billing-container">
      <div class="card">
        <div class="card-header">
          <h3>Billing & Subscription</h3>
          <p>Manage your subscription and billing information</p>
        </div>
        <div class="card-body">
          <div class="subscription-section">
            <div class="current-plan">
              <h4>Current Plan</h4>
              <div class="plan-details">
                <div class="plan-info">
                  <h5>Professional Plan</h5>
                  <p class="plan-price">$29.99/month</p>
                  <p class="plan-description">Full access to all credit repair tools and features</p>
                </div>
                <div class="plan-actions">
                  <button class="btn btn-outline">Change Plan</button>
                  <button class="btn btn-danger">Cancel Subscription</button>
                </div>
              </div>
            </div>
            
            <div class="billing-info">
              <h4>Billing Information</h4>
              <div class="billing-details">
                <div class="payment-method">
                  <h5>Payment Method</h5>
                  <div class="card-info">
                    <i class="fas fa-credit-card"></i>
                    <span>**** **** **** 4242</span>
                    <span class="card-type">Visa</span>
                    <button class="btn btn-sm btn-outline">Update</button>
                  </div>
                </div>
                
                <div class="billing-address">
                  <h5>Billing Address</h5>
                  <div class="address-info">
                    <p>123 Main Street</p>
                    <p>New York, NY 10001</p>
                    <p>United States</p>
                    <button class="btn btn-sm btn-outline">Edit</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="billing-history">
              <h4>Billing History</h4>
              <div class="invoice-list">
                <div class="invoice-item">
                  <div class="invoice-info">
                    <span class="invoice-date">Jan 15, 2024</span>
                    <span class="invoice-amount">$29.99</span>
                    <span class="invoice-status paid">Paid</span>
                  </div>
                  <button class="btn btn-sm btn-outline">Download</button>
                </div>
                
                <div class="invoice-item">
                  <div class="invoice-info">
                    <span class="invoice-date">Dec 15, 2023</span>
                    <span class="invoice-amount">$29.99</span>
                    <span class="invoice-status paid">Paid</span>
                  </div>
                  <button class="btn btn-sm btn-outline">Download</button>
                </div>
                
                <div class="invoice-item">
                  <div class="invoice-info">
                    <span class="invoice-date">Nov 15, 2023</span>
                    <span class="invoice-amount">$29.99</span>
                    <span class="invoice-status paid">Paid</span>
                  </div>
                  <button class="btn btn-sm btn-outline">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .billing-container {
      padding: 20px;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .card-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    
    .card-header h3 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .card-header p {
      margin: 0;
      color: #6b7280;
    }
    
    .card-body {
      padding: 20px;
    }
    
    .subscription-section > div {
      margin-bottom: 30px;
    }
    
    .subscription-section > div:last-child {
      margin-bottom: 0;
    }
    
    .current-plan h4,
    .billing-info h4,
    .billing-history h4 {
      margin: 0 0 16px 0;
      color: #111827;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .plan-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: #f3f4f6;
      border-radius: 8px;
    }
    
    .plan-info h5 {
      margin: 0 0 8px 0;
      color: #111827;
      font-size: 1.125rem;
      font-weight: 600;
    }
    
    .plan-price {
      margin: 0 0 8px 0;
      color: #059669;
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .plan-description {
      margin: 0;
      color: #6b7280;
    }
    
    .plan-actions {
      display: flex;
      gap: 12px;
    }
    
    .billing-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    
    .payment-method h5,
    .billing-address h5 {
      margin: 0 0 12px 0;
      color: #111827;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .card-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .card-info i {
      color: #6b7280;
    }
    
    .card-type {
      margin-left: auto;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    .address-info {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .address-info p {
      margin: 0 0 4px 0;
      color: #374151;
    }
    
    .address-info p:last-of-type {
      margin-bottom: 12px;
    }
    
    .invoice-list {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .invoice-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .invoice-item:last-child {
      border-bottom: none;
    }
    
    .invoice-info {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    
    .invoice-date {
      color: #374151;
      font-weight: 500;
    }
    
    .invoice-amount {
      color: #111827;
      font-weight: 600;
    }
    
    .invoice-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .invoice-status.paid {
      background: #d1fae5;
      color: #065f46;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-outline {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .btn-outline:hover {
      background: #f9fafb;
    }
    
    .btn-danger {
      background: #dc2626;
      color: white;
    }
    
    .btn-danger:hover {
      background: #b91c1c;
    }
    
    .btn-sm {
      padding: 6px 12px;
      font-size: 0.875rem;
    }
    
    @media (max-width: 768px) {
      .billing-container {
        padding: 16px;
      }
      
      .plan-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      
      .billing-details {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .invoice-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class BillingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}