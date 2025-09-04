import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  EnforcementService,
  ViolationFilters,
  ActionFilters,
  ComplianceFilters,
  AlertFilters
} from '../enforcement.service';
import {
  Violation,
  EnforcementAction,
  ComplianceItem,
  EnforcementAlert,
  EnforcementAnalytics,
  ViolationType,
  ViolationSeverity,
  ViolationStatus,
  ActionStatus,
  ComplianceStatus,
  AlertPriority,
  getViolationSeverityColor,
  getViolationStatusColor,
  getActionStatusColor,
  getComplianceStatusColor,
  getAlertPriorityColor,
  calculateComplianceScore,
  calculateRiskLevel,
  getOverdueActions,
  formatCurrency,
  formatDate
} from '../enforcement.model';

interface DashboardStats {
  violations: {
    total: number;
    critical: number;
    unresolved: number;
    thisMonth: number;
  };
  actions: {
    total: number;
    overdue: number;
    inProgress: number;
    completed: number;
  };
  compliance: {
    score: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
  };
  alerts: {
    total: number;
    urgent: number;
    unacknowledged: number;
    unresolved: number;
  };
}

interface RecentActivity {
  type: 'violation' | 'action' | 'compliance' | 'alert';
  id: string;
  title: string;
  description: string;
  date: Date;
  priority?: string;
  status?: string;
  user?: string;
}

@Component({
  selector: 'app-enforcement-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgbModule
  ],
  templateUrl: './enforcement-overview.component.html',
  styleUrls: ['./enforcement-overview.component.scss']
})
export class EnforcementOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  loading = true;
  refreshing = false;

  // Data
  stats: DashboardStats = {
    violations: { total: 0, critical: 0, unresolved: 0, thisMonth: 0 },
    actions: { total: 0, overdue: 0, inProgress: 0, completed: 0 },
    compliance: { score: 0, compliant: 0, nonCompliant: 0, pending: 0 },
    alerts: { total: 0, urgent: 0, unacknowledged: 0, unresolved: 0 }
  };

  recentViolations: Violation[] = [];
  overdueActions: EnforcementAction[] = [];
  urgentAlerts: EnforcementAlert[] = [];
  complianceItems: ComplianceItem[] = [];
  recentActivity: RecentActivity[] = [];
  analytics: EnforcementAnalytics | null = null;

  // Chart data
  violationTrendData: any[] = [];
  complianceScoreData: any[] = [];
  actionStatusData: any[] = [];

  // Date range for analytics
  dateRange = {
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1),
    end: new Date()
  };

  // Utility functions
  getViolationSeverityColor = getViolationSeverityColor;
  getViolationStatusColor = getViolationStatusColor;
  getActionStatusColor = getActionStatusColor;
  getComplianceStatusColor = getComplianceStatusColor;
  getAlertPriorityColor = getAlertPriorityColor;
  formatCurrency = formatCurrency;
  formatDate = formatDate;

  constructor(private enforcementService: EnforcementService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;

    const violationFilters: ViolationFilters = {};
    const actionFilters: ActionFilters = {};
    const complianceFilters: ComplianceFilters = {};
    const alertFilters: AlertFilters = {};

    forkJoin({
      violations: this.enforcementService.getViolations(violationFilters, 1, 100),
      actions: this.enforcementService.getActions(actionFilters, 1, 100),
      compliance: this.enforcementService.getComplianceItems(complianceFilters, 1, 100),
      alerts: this.enforcementService.getAlerts(alertFilters, 1, 100),
      analytics: this.enforcementService.getAnalytics(this.dateRange.start, this.dateRange.end)
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: (data) => {
        this.processViolations(data.violations.data);
        this.processActions(data.actions.data);
        this.processCompliance(data.compliance.data);
        this.processAlerts(data.alerts.data);
        this.analytics = data.analytics;
        this.calculateStats();
        this.generateRecentActivity();
        this.prepareChartData();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  refreshData(): void {
    this.refreshing = true;
    this.loadDashboardData();
    setTimeout(() => this.refreshing = false, 1000);
  }

  private processViolations(violations: Violation[]): void {
    this.recentViolations = violations
      .sort((a, b) => new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime())
      .slice(0, 5);
  }

  private processActions(actions: EnforcementAction[]): void {
    this.overdueActions = getOverdueActions(actions).slice(0, 5);
  }

  private processCompliance(items: ComplianceItem[]): void {
    this.complianceItems = items
      .filter(item => item.status !== ComplianceStatus.COMPLIANT)
      .sort((a, b) => b.riskLevel - a.riskLevel)
      .slice(0, 5);
  }

  private processAlerts(alerts: EnforcementAlert[]): void {
    this.urgentAlerts = alerts
      .filter(alert => alert.priority === AlertPriority.URGENT && !alert.resolved)
      .slice(0, 5);
  }

  private calculateStats(): void {
    // Violation stats
    const allViolations = this.recentViolations; // In real app, this would be all violations
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    this.stats.violations = {
      total: allViolations.length,
      critical: allViolations.filter(v => v.severity === ViolationSeverity.CRITICAL).length,
      unresolved: allViolations.filter(v => v.status !== ViolationStatus.RESOLVED).length,
      thisMonth: allViolations.filter(v => new Date(v.reportedDate) >= thisMonth).length
    };

    // Action stats
    const allActions = this.overdueActions; // In real app, this would be all actions
    this.stats.actions = {
      total: allActions.length,
      overdue: this.overdueActions.length,
      inProgress: allActions.filter(a => a.status === ActionStatus.IN_PROGRESS).length,
      completed: allActions.filter(a => a.status === ActionStatus.COMPLETED).length
    };

    // Compliance stats
    const allCompliance = this.complianceItems; // In real app, this would be all compliance items
    this.stats.compliance = {
      score: calculateComplianceScore(allCompliance),
      compliant: allCompliance.filter(c => c.status === ComplianceStatus.COMPLIANT).length,
      nonCompliant: allCompliance.filter(c => c.status === ComplianceStatus.NON_COMPLIANT).length,
      pending: allCompliance.filter(c => c.status === ComplianceStatus.PENDING).length
    };

    // Alert stats
    const allAlerts = this.urgentAlerts; // In real app, this would be all alerts
    this.stats.alerts = {
      total: allAlerts.length,
      urgent: allAlerts.filter(a => a.priority === AlertPriority.URGENT).length,
      unacknowledged: allAlerts.filter(a => !a.acknowledged).length,
      unresolved: allAlerts.filter(a => !a.resolved).length
    };
  }

  private generateRecentActivity(): void {
    const activities: RecentActivity[] = [];

    // Add recent violations
    this.recentViolations.slice(0, 3).forEach(violation => {
      activities.push({
        type: 'violation',
        id: violation.id,
        title: `Violation Reported: ${violation.title}`,
        description: `${violation.type} violation reported by ${violation.reportedBy}`,
        date: violation.reportedDate,
        priority: violation.severity,
        status: violation.status
      });
    });

    // Add recent actions
    this.overdueActions.slice(0, 2).forEach(action => {
      activities.push({
        type: 'action',
        id: action.id,
        title: `Action ${action.status}: ${action.title}`,
        description: `Enforcement action assigned to ${action.assignedTo}`,
        date: action.assignedAt,
        priority: action.priority,
        status: action.status
      });
    });

    // Add urgent alerts
    this.urgentAlerts.slice(0, 2).forEach(alert => {
      activities.push({
        type: 'alert',
        id: alert.id,
        title: `Alert: ${alert.title}`,
        description: alert.message,
        date: alert.createdAt,
        priority: alert.priority,
        status: alert.resolved ? 'resolved' : 'active'
      });
    });

    // Sort by date and take most recent
    this.recentActivity = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  private prepareChartData(): void {
    if (!this.analytics) return;

    // Violation trend data
    this.violationTrendData = this.analytics.violations.trends.map(trend => ({
      name: this.formatDate(trend.date),
      value: trend.value
    }));

    // Compliance score data
    this.complianceScoreData = [
      { name: 'Compliant', value: this.stats.compliance.compliant },
      { name: 'Non-Compliant', value: this.stats.compliance.nonCompliant },
      { name: 'Pending', value: this.stats.compliance.pending }
    ];

    // Action status data
    this.actionStatusData = [
      { name: 'Completed', value: this.stats.actions.completed },
      { name: 'In Progress', value: this.stats.actions.inProgress },
      { name: 'Overdue', value: this.stats.actions.overdue }
    ];
  }

  // Navigation methods
  navigateToViolations(): void {
    // Navigation logic
  }

  navigateToActions(): void {
    // Navigation logic
  }

  navigateToCompliance(): void {
    // Navigation logic
  }

  navigateToAlerts(): void {
    // Navigation logic
  }

  // Quick actions
  acknowledgeAlert(alert: EnforcementAlert): void {
    this.enforcementService.acknowledgeAlert(alert.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert.acknowledged = true;
          alert.acknowledgedAt = new Date();
        },
        error: (error) => {
          console.error('Error acknowledging alert:', error);
        }
      });
  }

  resolveAlert(alert: EnforcementAlert): void {
    this.enforcementService.resolveAlert(alert.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert.resolved = true;
          alert.resolvedAt = new Date();
        },
        error: (error) => {
          console.error('Error resolving alert:', error);
        }
      });
  }

  updateActionProgress(action: EnforcementAction, progress: number): void {
    this.enforcementService.updateActionProgress(action.id, progress)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAction) => {
          const index = this.overdueActions.findIndex(a => a.id === action.id);
          if (index !== -1) {
            this.overdueActions[index] = updatedAction;
          }
        },
        error: (error) => {
          console.error('Error updating action progress:', error);
        }
      });
  }

  // Utility methods
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      violation: 'exclamation-triangle',
      action: 'tools',
      compliance: 'shield-alt',
      alert: 'bell'
    };
    return icons[type] || 'circle';
  }

  getActivityColor(type: string, priority?: string): string {
    if (priority) {
      return this.getAlertPriorityColor(priority as AlertPriority);
    }
    
    const colors: { [key: string]: string } = {
      violation: 'danger',
      action: 'warning',
      compliance: 'info',
      alert: 'primary'
    };
    return colors[type] || 'secondary';
  }

  getRiskLevelColor(level: number): string {
    if (level >= 80) return 'danger';
    if (level >= 60) return 'warning';
    if (level >= 40) return 'info';
    return 'success';
  }

  getComplianceScoreColor(score: number): string {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return this.formatDate(date);
  }
}