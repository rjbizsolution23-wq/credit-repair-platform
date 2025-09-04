import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CommonModule } from '@angular/common';

import { LegalService } from '../legal.service';
import {
  LegalAnalytics,
  LegalDocument,
  LegalCase,
  ComplianceItem,
  DocumentStatus,
  CaseStatus,
  ComplianceStatus,
  CasePriority,
  RiskLevel,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPriorityColor,
  getRiskLevelColor,
  calculateCaseAge,
  isDocumentExpiring,
  getDaysUntilDeadline
} from '../legal.model';

interface QuickStats {
  totalDocuments: number;
  activeDocuments: number;
  expiringDocuments: number;
  totalCases: number;
  openCases: number;
  urgentCases: number;
  totalCompliance: number;
  compliantItems: number;
  highRiskItems: number;
  totalBillableHours: number;
  totalRevenue: number;
  complianceRate: number;
}

interface RecentActivity {
  id: string;
  type: 'document' | 'case' | 'compliance';
  action: string;
  title: string;
  user: string;
  timestamp: Date;
  status?: string;
  priority?: string;
}

@Component({
  selector: 'app-legal-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './legal-overview.component.html',
  styleUrls: ['./legal-overview.component.scss'],
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
})
export class LegalOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  error: string | null = null;
  
  analytics: LegalAnalytics | null = null;
  quickStats: QuickStats = {
    totalDocuments: 0,
    activeDocuments: 0,
    expiringDocuments: 0,
    totalCases: 0,
    openCases: 0,
    urgentCases: 0,
    totalCompliance: 0,
    compliantItems: 0,
    highRiskItems: 0,
    totalBillableHours: 0,
    totalRevenue: 0,
    complianceRate: 0
  };
  
  recentDocuments: LegalDocument[] = [];
  urgentCases: LegalCase[] = [];
  highRiskCompliance: ComplianceItem[] = [];
  recentActivity: RecentActivity[] = [];
  
  // Chart configurations
  casesByTypeChart: ChartConfiguration = {
    type: 'doughnut' as ChartType,
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#007bff',
          '#28a745',
          '#ffc107',
          '#dc3545',
          '#6f42c1',
          '#fd7e14',
          '#20c997',
          '#6c757d'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  };
  
  complianceByAreaChart: ChartConfiguration = {
    type: 'bar' as ChartType,
    data: {
      labels: [],
      datasets: [{
        label: 'Compliant',
        data: [],
        backgroundColor: '#28a745'
      }, {
        label: 'Non-Compliant',
        data: [],
        backgroundColor: '#dc3545'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  };
  
  financialTrendChart: ChartConfiguration = {
    type: 'line' as ChartType,
    data: {
      labels: [],
      datasets: [{
        label: 'Revenue',
        data: [],
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        tension: 0.4
      }, {
        label: 'Billable Hours',
        data: [],
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left'
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  };

  constructor(
    private legalService: LegalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    
    const dateRange = {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
      end: new Date()
    };

    this.legalService.getAnalytics(dateRange)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (analytics) => {
          this.analytics = analytics;
          this.processAnalytics(analytics);
          this.loadRecentData();
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
        }
      });
  }

  private processAnalytics(analytics: LegalAnalytics): void {
    // Calculate quick stats
    this.quickStats = {
      totalDocuments: analytics.documentStats.totalDocuments,
      activeDocuments: analytics.documentStats.documentsByStatus
        .find(s => s.status === DocumentStatus.ACTIVE)?.count || 0,
      expiringDocuments: analytics.documentStats.expiringDocuments,
      totalCases: analytics.caseStats.totalCases,
      openCases: analytics.caseStats.openCases,
      urgentCases: analytics.caseStats.casesByPriority
        .filter(p => p.priority === CasePriority.URGENT || p.priority === CasePriority.CRITICAL)
        .reduce((sum, p) => sum + p.count, 0),
      totalCompliance: analytics.complianceStats.totalRequirements,
      compliantItems: analytics.complianceStats.compliantItems,
      highRiskItems: analytics.complianceStats.highRiskItems,
      totalBillableHours: analytics.financialStats.totalBillableHours,
      totalRevenue: analytics.financialStats.totalRevenue,
      complianceRate: analytics.complianceStats.complianceRate
    };

    // Update charts
    this.updateCasesByTypeChart(analytics.caseStats.casesByType);
    this.updateComplianceByAreaChart(analytics.complianceStats.areaBreakdown);
    this.updateFinancialTrendChart(analytics.trends.financialTrend);
  }

  private updateCasesByTypeChart(casesByType: any[]): void {
    this.casesByTypeChart.data.labels = casesByType.map(item => item.type);
    this.casesByTypeChart.data.datasets[0].data = casesByType.map(item => item.count);
  }

  private updateComplianceByAreaChart(areaBreakdown: any[]): void {
    this.complianceByAreaChart.data.labels = areaBreakdown.map(item => item.area);
    this.complianceByAreaChart.data.datasets[0].data = areaBreakdown.map(item => item.compliant);
    this.complianceByAreaChart.data.datasets[1].data = areaBreakdown.map(item => item.nonCompliant);
  }

  private updateFinancialTrendChart(financialTrend: any[]): void {
    this.financialTrendChart.data.labels = financialTrend.map(item => item.month);
    this.financialTrendChart.data.datasets[0].data = financialTrend.map(item => item.value);
    // Note: You might need to adjust this based on your actual data structure
  }

  private loadRecentData(): void {
    // Load recent documents
    this.legalService.getDocuments({}, { page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentDocuments = response.data;
        },
        error: (error) => console.error('Error loading recent documents:', error)
      });

    // Load urgent cases
    this.legalService.getCases(
      { priority: CasePriority.URGENT, status: CaseStatus.OPEN },
      { page: 1, limit: 5, sortBy: 'openedDate', sortOrder: 'desc' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.urgentCases = response.data;
        },
        error: (error) => console.error('Error loading urgent cases:', error)
      });

    // Load high-risk compliance items
    this.legalService.getComplianceItems(
      { riskLevel: RiskLevel.HIGH, status: ComplianceStatus.NON_COMPLIANT },
      { page: 1, limit: 5, sortBy: 'lastReviewDate', sortOrder: 'desc' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.highRiskCompliance = response.data;
        },
        error: (error) => console.error('Error loading high-risk compliance:', error)
      });

    // Generate recent activity (this would typically come from an activity log API)
    this.generateRecentActivity();
  }

  private generateRecentActivity(): void {
    // This is mock data - in a real app, this would come from an API
    this.recentActivity = [
      {
        id: '1',
        type: 'document',
        action: 'created',
        title: 'Service Agreement Template',
        user: 'John Smith',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'draft'
      },
      {
        id: '2',
        type: 'case',
        action: 'updated',
        title: 'Consumer Protection Case #2024-001',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'in_progress',
        priority: 'high'
      },
      {
        id: '3',
        type: 'compliance',
        action: 'reviewed',
        title: 'FCRA Compliance Check',
        user: 'Mike Davis',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'compliant'
      },
      {
        id: '4',
        type: 'document',
        action: 'approved',
        title: 'Privacy Policy Update',
        user: 'Lisa Wilson',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        status: 'approved'
      },
      {
        id: '5',
        type: 'case',
        action: 'closed',
        title: 'Contract Dispute #2024-015',
        user: 'David Brown',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        status: 'settled'
      }
    ];
  }

  // Navigation methods
  navigateToDocuments(): void {
    this.router.navigate(['/legal/documents']);
  }

  navigateToCases(): void {
    this.router.navigate(['/legal/cases']);
  }

  navigateToCompliance(): void {
    this.router.navigate(['/legal/compliance']);
  }

  navigateToDocument(id: string): void {
    this.router.navigate(['/legal/documents', id]);
  }

  navigateToCase(id: string): void {
    this.router.navigate(['/legal/cases', id]);
  }

  navigateToComplianceItem(id: string): void {
    this.router.navigate(['/legal/compliance', id]);
  }

  // Quick actions
  createDocument(): void {
    this.router.navigate(['/legal/documents/create']);
  }

  createCase(): void {
    this.router.navigate(['/legal/cases/create']);
  }

  runComplianceAudit(): void {
    this.router.navigate(['/legal/compliance/audit']);
  }

  viewReports(): void {
    this.router.navigate(['/legal/compliance/reports']);
  }

  // Utility methods
  getStatusColor = getStatusColor;
  getPriorityColor = getPriorityColor;
  getRiskLevelColor = getRiskLevelColor;
  formatDate = formatDate;
  formatCurrency = formatCurrency;
  calculateCaseAge = calculateCaseAge;
  isDocumentExpiring = isDocumentExpiring;
  getDaysUntilDeadline = getDaysUntilDeadline;

  getActivityIcon(type: string): string {
    const icons = {
      document: 'fas fa-file-alt',
      case: 'fas fa-gavel',
      compliance: 'fas fa-shield-alt'
    };
    return icons[type as keyof typeof icons] || 'fas fa-circle';
  }

  getActivityColor(type: string): string {
    const colors = {
      document: 'primary',
      case: 'warning',
      compliance: 'success'
    };
    return colors[type as keyof typeof colors] || 'secondary';
  }

  getActivityPriorityColor(priority: string): string {
    // Convert string priority to CasePriority enum for color mapping
    const priorityMap: { [key: string]: CasePriority } = {
      'low': CasePriority.LOW,
      'medium': CasePriority.MEDIUM,
      'high': CasePriority.HIGH,
      'urgent': CasePriority.URGENT
    };
    const casePriority = priorityMap[priority.toLowerCase()] || CasePriority.MEDIUM;
    return getPriorityColor(casePriority);
  }

  getActivityStatusColor(status: string): string {
    // Convert string status to appropriate enum for color mapping
    const statusMap: { [key: string]: any } = {
      'draft': DocumentStatus.DRAFT,
      'active': DocumentStatus.ACTIVE,
      'approved': DocumentStatus.APPROVED,
      'in_progress': CaseStatus.OPEN,
      'compliant': ComplianceStatus.COMPLIANT,
      'settled': CaseStatus.CLOSED
    };
    const mappedStatus = statusMap[status.toLowerCase()];
    return mappedStatus ? getStatusColor(mappedStatus) : 'secondary';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return this.formatDate(date);
    }
  }

  refresh(): void {
    this.loadDashboardData();
  }
}