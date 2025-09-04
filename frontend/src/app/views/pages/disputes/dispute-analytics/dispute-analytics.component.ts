import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DisputesService } from '../disputes.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CommonModule } from '@angular/common';

interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
    preset: string;
  };
  status: string[];
  priority: string[];
  type: string[];
  creditBureau: string[];
  client: string;
}

interface AnalyticsData {
  overview: {
    totalDisputes: number;
    activeDisputes: number;
    resolvedDisputes: number;
    successRate: number;
    averageResolutionTime: number;
    totalClientsAffected: number;
  };
  statusDistribution: {
    label: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  priorityDistribution: {
    label: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  typeDistribution: {
    label: string;
    value: number;
    percentage: number;
  }[];
  monthlyTrends: {
    month: string;
    created: number;
    resolved: number;
    successRate: number;
  }[];
  bureauPerformance: {
    bureau: string;
    total: number;
    resolved: number;
    successRate: number;
    averageTime: number;
  }[];
  topClients: {
    clientId: string;
    clientName: string;
    totalDisputes: number;
    resolvedDisputes: number;
    successRate: number;
  }[];
  resolutionTimeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

@Component({
  selector: 'app-dispute-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective],
  templateUrl: './dispute-analytics.component.html',
  styleUrls: ['./dispute-analytics.component.scss'],
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
})
export class DisputeAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component State
  loading = false;
  error: string | null = null;
  
  // Forms
  filtersForm: FormGroup;
  
  // Data
  analyticsData: AnalyticsData | null = null;
  
  // UI State
  activeTab = 'overview';
  showFilters = false;
  exportLoading = false;
  
  // Filter Options
  datePresets = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'last6months', label: 'Last 6 Months' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];
  
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];
  
  priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  typeOptions = [
    { value: 'inaccurate_info', label: 'Inaccurate Information' },
    { value: 'identity_theft', label: 'Identity Theft' },
    { value: 'mixed_files', label: 'Mixed Files' },
    { value: 'outdated_info', label: 'Outdated Information' },
    { value: 'duplicate_accounts', label: 'Duplicate Accounts' }
  ];
  
  creditBureauOptions = [
    { value: 'experian', label: 'Experian' },
    { value: 'equifax', label: 'Equifax' },
    { value: 'transunion', label: 'TransUnion' }
  ];
  
  // Chart Options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };
  
  constructor(
    private fb: FormBuilder,
    private disputesService: DisputesService
  ) {
    this.initializeForm();
  }
  
  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.loadAnalytics();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForm(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    this.filtersForm = this.fb.group({
      dateRange: this.fb.group({
        start: [this.formatDate(startDate)],
        end: [this.formatDate(endDate)],
        preset: ['last30days']
      }),
      status: [[]],
      priority: [[]],
      type: [[]],
      creditBureau: [[]],
      client: ['']
    });
  }
  
  private setupFormSubscriptions(): void {
    // Watch for date preset changes
    this.filtersForm.get('dateRange.preset')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(preset => {
        if (preset !== 'custom') {
          const dates = this.getPresetDates(preset);
          this.filtersForm.patchValue({
            dateRange: {
              start: this.formatDate(dates.start),
              end: this.formatDate(dates.end),
              preset
            }
          }, { emitEvent: false });
        }
      });
    
    // Watch for filter changes
    this.filtersForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loadAnalytics();
      });
  }
  
  private getPresetDates(preset: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (preset) {
      case 'last7days':
        start.setDate(end.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'last90days':
        start.setDate(end.getDate() - 90);
        break;
      case 'last6months':
        start.setMonth(end.getMonth() - 6);
        break;
      case 'lastyear':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  loadAnalytics(): void {
    this.loading = true;
    this.error = null;
    
    const filters = this.getFilters();
    
    this.disputesService.getAnalytics(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.loading = false;
        },
        error: (error: any) => {
          this.error = 'Failed to load analytics data. Please try again.';
          this.loading = false;
          console.error('Analytics loading error:', error);
        }
      });
  }
  
  private getFilters(): AnalyticsFilters {
    const formValue = this.filtersForm.value;
    return {
      dateRange: formValue.dateRange,
      status: formValue.status || [],
      priority: formValue.priority || [],
      type: formValue.type || [],
      creditBureau: formValue.creditBureau || [],
      client: formValue.client || ''
    };
  }
  
  // Tab Management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  // Filter Management
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters(): void {
    this.initializeForm();
  }
  
  onStatusChange(status: string, checked: boolean): void {
    const currentStatuses = this.filtersForm.get('status')?.value || [];
    if (checked) {
      if (!currentStatuses.includes(status)) {
        this.filtersForm.patchValue({
          status: [...currentStatuses, status]
        });
      }
    } else {
      this.filtersForm.patchValue({
        status: currentStatuses.filter((s: string) => s !== status)
      });
    }
  }
  
  onPriorityChange(priority: string, checked: boolean): void {
    const currentPriorities = this.filtersForm.get('priority')?.value || [];
    if (checked) {
      if (!currentPriorities.includes(priority)) {
        this.filtersForm.patchValue({
          priority: [...currentPriorities, priority]
        });
      }
    } else {
      this.filtersForm.patchValue({
        priority: currentPriorities.filter((p: string) => p !== priority)
      });
    }
  }
  
  onTypeChange(type: string, checked: boolean): void {
    const currentTypes = this.filtersForm.get('type')?.value || [];
    if (checked) {
      if (!currentTypes.includes(type)) {
        this.filtersForm.patchValue({
          type: [...currentTypes, type]
        });
      }
    } else {
      this.filtersForm.patchValue({
        type: currentTypes.filter((t: string) => t !== type)
      });
    }
  }
  
  onCreditBureauChange(bureau: string, checked: boolean): void {
    const currentBureaus = this.filtersForm.get('creditBureau')?.value || [];
    if (checked) {
      if (!currentBureaus.includes(bureau)) {
        this.filtersForm.patchValue({
          creditBureau: [...currentBureaus, bureau]
        });
      }
    } else {
      this.filtersForm.patchValue({
        creditBureau: currentBureaus.filter((b: string) => b !== bureau)
      });
    }
  }
  
  // Export Functions
  exportData(format: 'pdf' | 'excel' | 'csv'): void {
    this.exportLoading = true;
    
    const filters = this.getFilters();
    
    this.disputesService.exportAnalytics(filters, format)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `dispute-analytics.${format}`);
          this.exportLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to export data. Please try again.';
          this.exportLoading = false;
          console.error('Export error:', error);
        }
      });
  }
  
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
  
  // Utility Functions
  formatNumber(value: number): string {
    return new Intl.NumberFormat().format(value);
  }
  
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
  
  formatDuration(days: number): string {
    if (days < 1) {
      return '< 1 day';
    } else if (days === 1) {
      return '1 day';
    } else {
      return `${Math.round(days)} days`;
    }
  }
  
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: '#ffc107',
      submitted: '#17a2b8',
      in_review: '#fd7e14',
      resolved: '#28a745',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  }
  
  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  }
  
  // Chart Data Preparation
  getStatusChartData(): any {
    if (!this.analyticsData?.statusDistribution) {
      return null;
    }
    
    return {
      labels: this.analyticsData.statusDistribution.map(item => item.label),
      datasets: [{
        data: this.analyticsData.statusDistribution.map(item => item.value),
        backgroundColor: this.analyticsData.statusDistribution.map(item => item.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
  
  getPriorityChartData(): any {
    if (!this.analyticsData?.priorityDistribution) {
      return null;
    }
    
    return {
      labels: this.analyticsData.priorityDistribution.map(item => item.label),
      datasets: [{
        data: this.analyticsData.priorityDistribution.map(item => item.value),
        backgroundColor: this.analyticsData.priorityDistribution.map(item => item.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
  
  getTrendsChartData(): any {
    if (!this.analyticsData?.monthlyTrends) {
      return null;
    }
    
    return {
      labels: this.analyticsData.monthlyTrends.map(item => item.month),
      datasets: [
        {
          label: 'Created',
          data: this.analyticsData.monthlyTrends.map(item => item.created),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4
        },
        {
          label: 'Resolved',
          data: this.analyticsData.monthlyTrends.map(item => item.resolved),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4
        }
      ]
    };
  }
  
  getResolutionTimeChartData(): any {
    if (!this.analyticsData?.resolutionTimeDistribution) {
      return null;
    }
    
    return {
      labels: this.analyticsData.resolutionTimeDistribution.map(item => item.range),
      datasets: [{
        label: 'Number of Disputes',
        data: this.analyticsData.resolutionTimeDistribution.map(item => item.count),
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        borderColor: '#007bff',
        borderWidth: 1
      }]
    };
  }
  
  // Helper method to get badge class based on success rate
  getBadgeClass(successRate: number): string {
    if (successRate >= 80) {
      return 'badge bg-success';
    } else if (successRate >= 60) {
      return 'badge bg-warning';
    } else {
      return 'badge bg-danger';
    }
  }

  // Helper method to convert text to title case
  toTitleCase(text: string): string {
    if (!text) return '';
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  // Refresh
  refresh(): void {
    this.loadAnalytics();
  }
}