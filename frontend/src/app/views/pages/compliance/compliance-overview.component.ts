import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { ComplianceService } from './compliance.service';
import {
  ComplianceAudit,
  CompliancePolicy,
  ComplianceViolation,
  ComplianceTraining,
  ComplianceAlert,
  ComplianceAnalytics,
  AuditStatus,
  PolicyStatus,
  ViolationStatus,
  TrainingStatus,
  AlertSeverity,
  AlertStatus,
  getComplianceAreaLabel,
  getAuditStatusColor,
  getPolicyStatusColor,
  getViolationSeverityColor,
  getTrainingStatusColor,
  getAlertSeverityColor,
  calculateComplianceScore,
  isOverdue,
  getDaysUntilDue,
  formatCurrency,
  formatDate,
  getTimeAgo
} from './compliance.model';

export interface ComplianceStatistics {
  totalAudits: number;
  activeAudits: number;
  completedAudits: number;
  overdueAudits: number;
  totalPolicies: number;
  activePolicies: number;
  draftPolicies: number;
  expiredPolicies: number;
  totalViolations: number;
  openViolations: number;
  resolvedViolations: number;
  criticalViolations: number;
  totalTrainings: number;
  activeTrainings: number;
  completedTrainings: number;
  overdueTrainings: number;
  totalAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  complianceScore: number;
  riskLevel: string;
}

export interface RecentActivity {
  id: string;
  type: 'audit' | 'policy' | 'violation' | 'training' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  status: string;
  priority?: string;
  user?: string;
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

@Component({
  selector: 'app-compliance-overview',
  templateUrl: './compliance-overview.component.html',
  styleUrls: ['./compliance-overview.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ComplianceOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading and error states
  loading = true;
  error: string | null = null;

  // Data
  statistics: ComplianceStatistics = {
    totalAudits: 0,
    activeAudits: 0,
    completedAudits: 0,
    overdueAudits: 0,
    totalPolicies: 0,
    activePolicies: 0,
    draftPolicies: 0,
    expiredPolicies: 0,
    totalViolations: 0,
    openViolations: 0,
    resolvedViolations: 0,
    criticalViolations: 0,
    totalTrainings: 0,
    activeTrainings: 0,
    completedTrainings: 0,
    overdueTrainings: 0,
    totalAlerts: 0,
    unreadAlerts: 0,
    criticalAlerts: 0,
    resolvedAlerts: 0,
    complianceScore: 0,
    riskLevel: 'Low'
  };

  recentActivity: RecentActivity[] = [];
  analytics: ComplianceAnalytics | null = null;

  // Chart data
  auditStatusChart: ChartData = { labels: [], datasets: [] };
  violationTrendChart: ChartData = { labels: [], datasets: [] };
  complianceScoreChart: ChartData = { labels: [], datasets: [] };

  // Recent items
  recentAudits: ComplianceAudit[] = [];
  recentPolicies: CompliancePolicy[] = [];
  recentViolations: ComplianceViolation[] = [];
  recentTrainings: ComplianceTraining[] = [];
  criticalAlerts: ComplianceAlert[] = [];

  constructor(private complianceService: ComplianceService) {}

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

    combineLatest([
      this.complianceService.getAudits({ }, { page: 1, limit: 10 }),
      this.complianceService.getPolicies({ }, { page: 1, limit: 10 }),
      this.complianceService.getViolations({ }, { page: 1, limit: 10 }),
      this.complianceService.getTrainings({ }, { page: 1, limit: 10 }),
      this.complianceService.getAlerts({ severity: AlertSeverity.CRITICAL }, { page: 1, limit: 5 }),
      this.complianceService.getAnalytics()
    ])
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: ([audits, policies, violations, trainings, alerts, analytics]) => {
        this.processData(audits.data, policies.data, violations.data, trainings.data, alerts.data);
        this.analytics = analytics;
        this.calculateStatistics();
        this.generateRecentActivity();
        this.prepareChartData();
      },
      error: (error) => {
        this.error = 'Failed to load compliance data. Please try again.';
        console.error('Error loading compliance data:', error);
      }
    });
  }

  private processData(
    audits: ComplianceAudit[],
    policies: CompliancePolicy[],
    violations: ComplianceViolation[],
    trainings: ComplianceTraining[],
    alerts: ComplianceAlert[]
  ): void {
    this.recentAudits = audits.slice(0, 5);
    this.recentPolicies = policies.slice(0, 5);
    this.recentViolations = violations.slice(0, 5);
    this.recentTrainings = trainings.slice(0, 5);
    this.criticalAlerts = alerts.slice(0, 5);
  }

  private calculateStatistics(): void {
    // Calculate audit statistics
    this.statistics.totalAudits = this.recentAudits.length;
    this.statistics.activeAudits = this.recentAudits.filter(a => a.status === AuditStatus.IN_PROGRESS).length;
    this.statistics.completedAudits = this.recentAudits.filter(a => a.status === AuditStatus.COMPLETED).length;
    this.statistics.overdueAudits = this.recentAudits.filter(a => a.endDate && isOverdue(a.endDate)).length;

    // Calculate policy statistics
    this.statistics.totalPolicies = this.recentPolicies.length;
    this.statistics.activePolicies = this.recentPolicies.filter(p => p.status === PolicyStatus.ACTIVE).length;
    this.statistics.draftPolicies = this.recentPolicies.filter(p => p.status === PolicyStatus.DRAFT).length;
    this.statistics.expiredPolicies = this.recentPolicies.filter(p => p.status === PolicyStatus.EXPIRED).length;

    // Calculate violation statistics
    this.statistics.totalViolations = this.recentViolations.length;
    this.statistics.openViolations = this.recentViolations.filter(v => v.status === ViolationStatus.REPORTED).length;
    this.statistics.resolvedViolations = this.recentViolations.filter(v => v.status === ViolationStatus.RESOLVED).length;
    this.statistics.criticalViolations = this.recentViolations.filter(v => v.riskAssessment.riskLevel === 'critical').length;

    // Calculate training statistics
    this.statistics.totalTrainings = this.recentTrainings.length;
    this.statistics.activeTrainings = this.recentTrainings.filter(t => t.status === TrainingStatus.IN_PROGRESS).length;
    this.statistics.completedTrainings = this.recentTrainings.filter(t => t.status === TrainingStatus.COMPLETED).length;
    this.statistics.overdueTrainings = this.recentTrainings.filter(t => t.schedule && t.schedule.endDate && isOverdue(t.schedule.endDate)).length;

    // Calculate alert statistics
    this.statistics.totalAlerts = this.criticalAlerts.length;
    this.statistics.unreadAlerts = this.criticalAlerts.filter(a => a.status === AlertStatus.ACTIVE).length;
    this.statistics.criticalAlerts = this.criticalAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    this.statistics.resolvedAlerts = this.criticalAlerts.filter(a => a.status === AlertStatus.RESOLVED).length;

    // Calculate compliance score and risk level
    this.statistics.complianceScore = calculateComplianceScore(this.recentAudits);
    
    this.statistics.riskLevel = this.getRiskLevel(this.statistics.complianceScore);
  }

  private getRiskLevel(score: number): string {
    if (score >= 90) return 'Low';
    if (score >= 70) return 'Medium';
    if (score >= 50) return 'High';
    return 'Critical';
  }

  private generateRecentActivity(): void {
    const activities: RecentActivity[] = [];

    // Add audit activities
    this.recentAudits.forEach(audit => {
      activities.push({
        id: audit.id,
        type: 'audit',
        title: `Audit: ${audit.title}`,
        description: `${audit.status} - ${audit.complianceAreas.map(area => getComplianceAreaLabel(area)).join(', ')}`,
        timestamp: audit.metadata.updatedAt,
        status: audit.status,
        user: audit.metadata.updatedBy,
        icon: 'fas fa-clipboard-check',
        color: getAuditStatusColor(audit.status)
      });
    });

    // Add violation activities
    this.recentViolations.forEach(violation => {
      activities.push({
        id: violation.id,
        type: 'violation',
        title: `Violation: ${violation.title}`,
        description: `${violation.status} - ${violation.type}`,
        timestamp: violation.metadata.updatedAt,
        status: violation.status,
        priority: violation.riskAssessment.riskLevel,
        user: violation.metadata.updatedBy,
        icon: 'fas fa-exclamation-triangle',
        color: getViolationSeverityColor(violation.riskAssessment.riskLevel)
      });
    });

    // Add policy activities
    this.recentPolicies.forEach(policy => {
      activities.push({
        id: policy.id,
        type: 'policy',
        title: `Policy: ${policy.title}`,
        description: `${policy.status} - ${policy.type}`,
        timestamp: policy.metadata.updatedAt,
        status: policy.status,
        user: policy.metadata.updatedBy,
        icon: 'fas fa-file-contract',
        color: getPolicyStatusColor(policy.status)
      });
    });

    // Add training activities
    this.recentTrainings.forEach(training => {
      activities.push({
        id: training.id,
        type: 'training',
        title: `Training: ${training.title}`,
        description: `${training.status} - ${training.type}`,
        timestamp: training.metadata.updatedAt,
        status: training.status,
        user: training.metadata.updatedBy,
        icon: 'fas fa-graduation-cap',
        color: getTrainingStatusColor(training.status)
      });
    });

    // Add alert activities
    this.criticalAlerts.forEach(alert => {
      activities.push({
        id: alert.id,
        type: 'alert',
        title: `Alert: ${alert.title}`,
        description: `${alert.status} - ${alert.severity}`,
        timestamp: alert.metadata.createdAt,
        status: alert.status,
        priority: alert.severity,
        user: alert.metadata.createdBy,
        icon: 'fas fa-bell',
        color: getAlertSeverityColor(alert.severity)
      });
    });

    // Sort by timestamp (most recent first) and take top 10
    this.recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  private prepareChartData(): void {
    this.prepareAuditStatusChart();
    this.prepareViolationTrendChart();
    this.prepareComplianceScoreChart();
  }

  private prepareAuditStatusChart(): void {
    const statusCounts = {
      [AuditStatus.PLANNED]: 0,
      [AuditStatus.IN_PROGRESS]: 0,
      [AuditStatus.COMPLETED]: 0,
      [AuditStatus.CANCELLED]: 0,
      [AuditStatus.ON_HOLD]: 0
    };

    this.recentAudits.forEach(audit => {
      statusCounts[audit.status]++;
    });

    this.auditStatusChart = {
      labels: Object.keys(statusCounts).map(status => status),
      datasets: [{
        label: 'Audits by Status',
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(status => getAuditStatusColor(status as AuditStatus))
      }]
    };
  }

  private prepareViolationTrendChart(): void {
    // Mock data for violation trends over the last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const openViolations = [12, 15, 8, 10, 6, 9];
    const resolvedViolations = [8, 12, 15, 14, 18, 16];

    this.violationTrendChart = {
      labels: months,
      datasets: [
        {
          label: 'Open Violations',
          data: openViolations,
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderWidth: 2
        },
        {
          label: 'Resolved Violations',
          data: resolvedViolations,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderWidth: 2
        }
      ]
    };
  }

  private prepareComplianceScoreChart(): void {
    // Mock data for compliance score trends over the last 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const scores = [75, 78, 82, 85, 88, 90, 87, 89, 91, 93, 95, 92];

    this.complianceScoreChart = {
      labels: months,
      datasets: [{
        label: 'Compliance Score',
        data: scores,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 2
      }]
    };
  }

  // Action methods
  onRefresh(): void {
    this.loadData();
  }

  onCreateAudit(): void {
    // Navigate to create audit page
    console.log('Navigate to create audit');
  }

  onCreatePolicy(): void {
    // Navigate to create policy page
    console.log('Navigate to create policy');
  }

  onReportViolation(): void {
    // Navigate to report violation page
    console.log('Navigate to report violation');
  }

  onCreateTraining(): void {
    // Navigate to create training page
    console.log('Navigate to create training');
  }

  onViewReports(): void {
    // Navigate to reports page
    console.log('Navigate to reports');
  }

  onViewMonitoring(): void {
    // Navigate to monitoring page
    console.log('Navigate to monitoring');
  }

  onViewAudits(): void {
    // Navigate to audits page
    console.log('Navigate to audits');
  }

  onViewPolicies(): void {
    // Navigate to policies page
    console.log('Navigate to policies');
  }

  onViewViolations(): void {
    // Navigate to violations page
    console.log('Navigate to violations');
  }

  onViewTrainings(): void {
    // Navigate to trainings page
    console.log('Navigate to trainings');
  }

  onViewAlerts(): void {
    // Navigate to alerts page
    console.log('Navigate to alerts');
  }

  onActivityClick(activity: RecentActivity): void {
    // Navigate to specific item based on type and id
    console.log('Navigate to activity:', activity);
  }

  // Utility methods
  formatDate(date: Date): string {
    return formatDate(date);
  }

  getRiskLevelBadgeClass(violation: ComplianceViolation): string {
    const riskLevel = violation.riskAssessment?.riskLevel || 'low';
    return `badge-${riskLevel.toLowerCase()}`;
  }

  getTimeAgo(date: Date): string {
    return getTimeAgo(date);
  }

  getDaysUntilDeadline(date: Date): number {
    return getDaysUntilDue(date);
  }

  isOverdue(date: Date): boolean {
    return isOverdue(date);
  }

  getProgressColor(score: number): string {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  }

  getRiskLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'danger';
      default: return 'secondary';
    }
  }
}