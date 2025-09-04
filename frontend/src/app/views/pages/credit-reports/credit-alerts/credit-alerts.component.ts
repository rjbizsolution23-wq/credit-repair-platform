import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credit-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-alerts.component.html',
  styleUrls: ['./credit-alerts.component.scss']
})
export class CreditAlertsComponent {
  alerts: any[] = [];

  constructor() {
    // Initialize with sample data or load from service
    this.alerts = [
      {
        id: 1,
        type: 'warning',
        title: 'Credit Score Change',
        message: 'Your credit score has decreased by 15 points',
        date: new Date(),
        read: false
      },
      {
        id: 2,
        type: 'info',
        title: 'New Account Opened',
        message: 'A new credit account was opened in your name',
        date: new Date(),
        read: false
      }
    ];
  }

  markAsRead(alertId: number): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
    }
  }

  deleteAlert(alertId: number): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
  }
}