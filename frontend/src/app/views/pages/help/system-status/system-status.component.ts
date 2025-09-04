import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-system-status',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.scss']
})
export class SystemStatusComponent implements OnInit {
  systemStatus: any = {
    overall: 'operational',
    services: [
      {
        name: 'API Gateway',
        status: 'operational',
        uptime: '99.9%',
        responseTime: '120ms'
      },
      {
        name: 'Database',
        status: 'operational',
        uptime: '99.8%',
        responseTime: '45ms'
      },
      {
        name: 'Credit Bureau Integration',
        status: 'operational',
        uptime: '99.7%',
        responseTime: '250ms'
      },
      {
        name: 'Email Service',
        status: 'operational',
        uptime: '99.9%',
        responseTime: '80ms'
      },
      {
        name: 'SMS Service',
        status: 'operational',
        uptime: '99.8%',
        responseTime: '150ms'
      }
    ],
    incidents: [
      {
        id: 1,
        title: 'Scheduled Maintenance',
        status: 'resolved',
        date: new Date('2024-01-20T02:00:00Z'),
        description: 'Routine database maintenance completed successfully.'
      }
    ]
  };

  constructor() { }

  ngOnInit(): void {
    // Load system status data
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'operational': return 'text-success';
      case 'degraded': return 'text-warning';
      case 'outage': return 'text-danger';
      default: return 'text-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'operational': return 'fas fa-check-circle';
      case 'degraded': return 'fas fa-exclamation-triangle';
      case 'outage': return 'fas fa-times-circle';
      default: return 'fas fa-question-circle';
    }
  }

  formatTitle(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}