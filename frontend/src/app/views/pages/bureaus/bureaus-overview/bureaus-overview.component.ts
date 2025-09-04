import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { BureausService } from '../bureaus.service';
import {
  BureauDispute,
  BureauCommunication,
  BureauResponse,
  BureauAnalytics,
  CreditBureau,
  DisputeStatus,
  CommunicationStatus,
  getCreditBureauLabel,
  getCreditBureauColor,
  getDisputeStatusLabel,
  getDisputeStatusColor,
  getCommunicationStatusLabel,
  getCommunicationStatusColor,
  isDisputeOverdue,
  calculateDisputeAge,
  getDaysUntilDeadline
} from '../bureaus.model';

interface StatCard {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
  route?: string;
}

interface RecentActivity {
  id: string;
  type: 'dispute' | 'communication' | 'response';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  statusColor: string;
  route?: string;
}

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-bureaus-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, TitleCasePipe],
  templateUrl: './bureaus-overview.component.html',
  styleUrls: ['./bureaus-overview.component.scss']
})
export class BureausOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  loading = true;
  error: string | null = null;

  // Data
  analytics: BureauAnalytics | null = null;
  recentDisputes: BureauDispute[] = [];
  recentCommunications: BureauCommunication[] = [];
  recentResponses: BureauResponse[] = [];
  overdueDisputes: BureauDispute[] = [];
  urgentResponses: BureauResponse[] = [];

  // Computed data
  statCards: StatCard[] = [];
  recentActivity: RecentActivity[] = [];
  disputesByBureauChart: ChartData | null = null;
  disputesByTypeChart: ChartData | null = null;
  successRateChart: ChartData | null = null;

  // Enums for template
  CreditBureau = CreditBureau;
  DisputeStatus = DisputeStatus;

  constructor(
    private bureausService: BureausService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Load analytics
    this.bureausService.getAnalytics()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (analytics) => {
          this.analytics = analytics;
          this.processAnalytics();
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.error = 'Failed to load analytics data';
        }
      });

    // Load recent disputes
    this.bureausService.getDisputes({}, 1, 5, 'createdAt', 'desc')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentDisputes = response.data;
          this.processRecentActivity();
        },
        error: (error) => {
          console.error('Error loading recent disputes:', error);
        }
      });

    // Load recent communications
    this.bureausService.getCommunications({}, 1, 5, 'createdAt', 'desc')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentCommunications = response.data;
          this.processRecentActivity();
        },
        error: (error) => {
          console.error('Error loading recent communications:', error);
        }
      });

    // Load recent responses
    this.bureausService.getResponses({}, 1, 5, 'receivedAt', 'desc')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentResponses = response.data;
          this.processRecentActivity();
        },
        error: (error) => {
          console.error('Error loading recent responses:', error);
        }
      });

    // Load overdue disputes
    this.bureausService.getDisputes({ overdue: true }, 1, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.overdueDisputes = response.data;
        },
        error: (error) => {
          console.error('Error loading overdue disputes:', error);
        }
      });

    // Load urgent responses
    this.bureausService.getResponses({ actionRequired: true }, 1, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.urgentResponses = response.data;
        },
        error: (error) => {
          console.error('Error loading urgent responses:', error);
        }
      });
  }

  private processAnalytics(): void {
    if (!this.analytics) return;

    // Create stat cards
    this.statCards = [
      {
        title: 'Total Disputes',
        value: this.analytics.totalDisputes,
        change: 12, // This would come from analytics comparison
        changeType: 'increase',
        icon: 'fas fa-file-alt',
        color: 'primary',
        route: '/bureaus/disputes'
      },
      {
        title: 'Active Disputes',
        value: this.analytics.activeDisputes,
        change: 5,
        changeType: 'increase',
        icon: 'fas fa-clock',
        color: 'warning',
        route: '/bureaus/disputes?status=in_progress'
      },
      {
        title: 'Resolved Disputes',
        value: this.analytics.resolvedDisputes,
        change: 8,
        changeType: 'increase',
        icon: 'fas fa-check-circle',
        color: 'success',
        route: '/bureaus/disputes?status=resolved'
      },
      {
        title: 'Success Rate',
        value: Math.round(this.analytics.successRate),
        change: 3,
        changeType: 'increase',
        icon: 'fas fa-chart-line',
        color: 'info'
      }
    ];

    // Create chart data
    this.createChartData();
  }

  private createChartData(): void {
    if (!this.analytics) return;

    // Disputes by Bureau Chart
    this.disputesByBureauChart = {
      labels: this.analytics.disputesByBureau.map(item => getCreditBureauLabel(item.bureau)),
      datasets: [{
        label: 'Total Disputes',
        data: this.analytics.disputesByBureau.map(item => item.total),
        backgroundColor: this.analytics.disputesByBureau.map(item => 
          this.getBureauChartColor(item.bureau)
        ),
        borderWidth: 0
      }]
    };

    // Disputes by Type Chart
    this.disputesByTypeChart = {
      labels: this.analytics.disputesByType.map(item => item.type.replace(/_/g, ' ')),
      datasets: [{
        label: 'Count',
        data: this.analytics.disputesByType.map(item => item.count),
        backgroundColor: [
          '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
          '#fd7e14', '#20c997', '#6c757d', '#e83e8c', '#17a2b8'
        ],
        borderWidth: 0
      }]
    };

    // Success Rate Trends Chart
    this.successRateChart = {
      labels: this.analytics.monthlyTrends.map(item => item.month),
      datasets: [{
        label: 'Success Rate (%)',
        data: this.analytics.monthlyTrends.map(item => item.successRate),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }

  private processRecentActivity(): void {
    const activities: RecentActivity[] = [];

    // Add recent disputes
    this.recentDisputes.forEach(dispute => {
      activities.push({
        id: dispute.id,
        type: 'dispute',
        title: `Dispute Created: ${dispute.title}`,
        description: `${getCreditBureauLabel(dispute.bureau)} - ${dispute.type.replace(/_/g, ' ')}`,
        timestamp: dispute.createdAt,
        status: getDisputeStatusLabel(dispute.status),
        statusColor: getDisputeStatusColor(dispute.status),
        route: `/bureaus/disputes/${dispute.id}`
      });
    });

    // Add recent communications
    this.recentCommunications.forEach(communication => {
      activities.push({
        id: communication.id,
        type: 'communication',
        title: `Communication: ${communication.subject}`,
        description: `${getCreditBureauLabel(communication.bureau)} - ${communication.type.replace(/_/g, ' ')}`,
        timestamp: communication.createdAt,
        status: getCommunicationStatusLabel(communication.status),
        statusColor: getCommunicationStatusColor(communication.status),
        route: `/bureaus/communications/${communication.id}`
      });
    });

    // Add recent responses
    this.recentResponses.forEach(response => {
      activities.push({
        id: response.id,
        type: 'response',
        title: `Response Received: ${response.type.replace(/_/g, ' ')}`,
        description: `${getCreditBureauLabel(response.bureau)} - ${response.changes.length} changes`,
        timestamp: response.receivedAt,
        status: response.actionRequired ? 'Action Required' : 'Processed',
        statusColor: response.actionRequired ? 'warning' : 'success',
        route: `/bureaus/responses/${response.id}`
      });
    });

    // Sort by timestamp and take the most recent
    this.recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  getBureauChartColor(bureau: CreditBureau): string {
    const colors = {
      [CreditBureau.EXPERIAN]: '#007bff',
      [CreditBureau.EQUIFAX]: '#28a745',
      [CreditBureau.TRANSUNION]: '#17a2b8'
    };
    return colors[bureau] || '#6c757d';
  }

  // Event handlers
  onRefresh(): void {
    this.loadData();
  }

  onCreateDispute(): void {
    this.router.navigate(['/bureaus/disputes/create']);
  }

  onViewAllDisputes(): void {
    this.router.navigate(['/bureaus/disputes']);
  }

  onViewAllCommunications(): void {
    this.router.navigate(['/bureaus/communications']);
  }

  onViewAllResponses(): void {
    this.router.navigate(['/bureaus/responses']);
  }

  onViewAnalytics(): void {
    this.router.navigate(['/bureaus/analytics']);
  }

  onNavigateToActivity(activity: RecentActivity): void {
    if (activity.route) {
      this.router.navigate([activity.route]);
    }
  }

  onNavigateToDispute(dispute: BureauDispute): void {
    this.router.navigate(['/bureaus/disputes', dispute.id]);
  }

  onNavigateToResponse(response: BureauResponse): void {
    this.router.navigate(['/bureaus/responses', response.id]);
  }

  // Utility methods
  getCreditBureauLabel = getCreditBureauLabel;
  getCreditBureauColor = getCreditBureauColor;
  getDisputeStatusLabel = getDisputeStatusLabel;
  getDisputeStatusColor = getDisputeStatusColor;
  isDisputeOverdue = isDisputeOverdue;
  calculateDisputeAge = calculateDisputeAge;
  getDaysUntilDeadline = getDaysUntilDeadline;

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString();
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'dispute':
        return 'fas fa-file-alt';
      case 'communication':
        return 'fas fa-envelope';
      case 'response':
        return 'fas fa-reply';
      default:
        return 'fas fa-circle';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'dispute':
        return 'primary';
      case 'communication':
        return 'info';
      case 'response':
        return 'success';
      default:
        return 'secondary';
    }
  }
}