import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface ProgressMetric {
  id: string;
  clientId: string;
  metricType: 'credit_score' | 'accounts_removed' | 'positive_accounts' | 'utilization' | 'payment_history';
  currentValue: number;
  previousValue: number;
  targetValue: number;
  changeAmount: number;
  changePercentage: number;
  recordedDate: Date;
  notes?: string;
  status: 'improving' | 'declining' | 'stable';
}

export interface ProgressGoal {
  id: string;
  clientId: string;
  goalType: 'credit_score' | 'debt_reduction' | 'account_removal' | 'utilization_target';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  targetDate: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

@Component({
  selector: 'app-progress-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './progress-tracking.component.html',
  styleUrls: ['./progress-tracking.component.scss']
})
export class ProgressTrackingComponent implements OnInit {
  // State variables
  metrics: ProgressMetric[] = [];
  goals: ProgressGoal[] = [];
  filteredMetrics: ProgressMetric[] = [];
  filteredGoals: ProgressGoal[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'recordedDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filters
  filters = {
    metricType: '',
    status: '',
    dateRange: '',
    clientId: ''
  };

  goalFilters = {
    goalType: '',
    status: '',
    priority: ''
  };

  // Modal states
  showMetricModal = false;
  showGoalModal = false;
  showDeleteModal = false;
  editingMetric: ProgressMetric | null = null;
  editingGoal: ProgressGoal | null = null;
  deletingItem: any = null;

  // Forms
  metricForm: FormGroup;
  goalForm: FormGroup;

  // Chart data
  chartData: any = null;
  chartOptions: any = {};

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.metricForm = this.createMetricForm();
    this.goalForm = this.createGoalForm();
  }

  ngOnInit(): void {
    this.loadMockData();
    this.applyFilters();
    this.setupChartData();
  }

  // Helper methods for template
  getActiveGoalsCount(): number {
    return this.goals.filter(g => g.status === 'active').length;
  }

  getCompletedGoalsCount(): number {
    return this.goals.filter(g => g.status === 'completed').length;
  }

  getImprovingMetricsCount(): number {
    return this.metrics.filter(m => m.status === 'improving').length;
  }

  private createMetricForm(): FormGroup {
    return this.fb.group({
      clientId: ['', Validators.required],
      metricType: ['', Validators.required],
      currentValue: [0, [Validators.required, Validators.min(0)]],
      previousValue: [0, [Validators.required, Validators.min(0)]],
      targetValue: [0, [Validators.required, Validators.min(0)]],
      recordedDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });
  }

  private createGoalForm(): FormGroup {
    return this.fb.group({
      clientId: ['', Validators.required],
      goalType: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
      targetValue: [0, [Validators.required, Validators.min(0)]],
      currentValue: [0, [Validators.required, Validators.min(0)]],
      startDate: [new Date().toISOString().split('T')[0], Validators.required],
      targetDate: ['', Validators.required],
      priority: ['medium', Validators.required]
    });
  }

  private loadMockData(): void {
    this.metrics = [
      {
        id: 'PM-001',
        clientId: 'CL-1834',
        metricType: 'credit_score',
        currentValue: 720,
        previousValue: 680,
        targetValue: 750,
        changeAmount: 40,
        changePercentage: 5.9,
        recordedDate: new Date('2025-01-15'),
        notes: 'Significant improvement after dispute resolution',
        status: 'improving'
      },
      {
        id: 'PM-002',
        clientId: 'CL-1834',
        metricType: 'utilization',
        currentValue: 15,
        previousValue: 35,
        targetValue: 10,
        changeAmount: -20,
        changePercentage: -57.1,
        recordedDate: new Date('2025-01-15'),
        notes: 'Client paid down credit card balances',
        status: 'improving'
      },
      {
        id: 'PM-003',
        clientId: 'CL-1835',
        metricType: 'accounts_removed',
        currentValue: 3,
        previousValue: 1,
        targetValue: 5,
        changeAmount: 2,
        changePercentage: 200,
        recordedDate: new Date('2025-01-10'),
        notes: 'Successfully removed 2 inaccurate accounts',
        status: 'improving'
      }
    ];

    this.goals = [
      {
        id: 'PG-001',
        clientId: 'CL-1834',
        goalType: 'credit_score',
        title: 'Reach 750 Credit Score',
        description: 'Achieve excellent credit score for mortgage qualification',
        targetValue: 750,
        currentValue: 720,
        startDate: new Date('2024-12-01'),
        targetDate: new Date('2025-06-01'),
        status: 'active',
        priority: 'high'
      },
      {
        id: 'PG-002',
        clientId: 'CL-1834',
        goalType: 'utilization_target',
        title: 'Reduce Credit Utilization',
        description: 'Lower utilization to under 10% across all cards',
        targetValue: 10,
        currentValue: 15,
        startDate: new Date('2025-01-01'),
        targetDate: new Date('2025-03-01'),
        status: 'active',
        priority: 'medium'
      }
    ];

    this.totalItems = this.metrics.length;
    this.calculatePagination();
  }

  private setupChartData(): void {
    // Setup chart data for progress visualization
    this.chartData = {
      labels: ['Dec 2024', 'Jan 2025'],
      datasets: [
        {
          label: 'Credit Score',
          data: [680, 720],
          borderColor: '#14B8A6',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Credit Score Progress'
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 600,
          max: 800
        }
      }
    };
  }

  // Filtering and sorting
  applyFilters(): void {
    let filtered = [...this.metrics];

    if (this.filters.metricType) {
      filtered = filtered.filter(m => m.metricType === this.filters.metricType);
    }

    if (this.filters.status) {
      filtered = filtered.filter(m => m.status === this.filters.status);
    }

    if (this.filters.clientId) {
      filtered = filtered.filter(m => m.clientId.toLowerCase().includes(this.filters.clientId.toLowerCase()));
    }

    this.filteredMetrics = filtered;
    this.totalItems = filtered.length;
    this.calculatePagination();
  }

  applyGoalFilters(): void {
    let filtered = [...this.goals];

    if (this.goalFilters.goalType) {
      filtered = filtered.filter(g => g.goalType === this.goalFilters.goalType);
    }

    if (this.goalFilters.status) {
      filtered = filtered.filter(g => g.status === this.goalFilters.status);
    }

    if (this.goalFilters.priority) {
      filtered = filtered.filter(g => g.priority === this.goalFilters.priority);
    }

    this.filteredGoals = filtered;
  }

  clearFilters(): void {
    this.filters = {
      metricType: '',
      status: '',
      dateRange: '',
      clientId: ''
    };
    this.applyFilters();
  }

  clearGoalFilters(): void {
    this.goalFilters = {
      goalType: '',
      status: '',
      priority: ''
    };
    this.applyGoalFilters();
  }

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredMetrics.sort((a, b) => {
      const aVal = (a as any)[field];
      const bVal = (b as any)[field];
      const modifier = this.sortDirection === 'asc' ? 1 : -1;

      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    });
  }

  // Pagination
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedMetrics(): ProgressMetric[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredMetrics.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Modal operations
  openMetricModal(metric?: ProgressMetric): void {
    this.editingMetric = metric || null;
    if (metric) {
      this.metricForm.patchValue({
        ...metric,
        recordedDate: new Date(metric.recordedDate).toISOString().split('T')[0]
      });
    } else {
      this.metricForm.reset();
      this.metricForm.patchValue({
        recordedDate: new Date().toISOString().split('T')[0]
      });
    }
    this.showMetricModal = true;
  }

  openGoalModal(goal?: ProgressGoal): void {
    this.editingGoal = goal || null;
    if (goal) {
      this.goalForm.patchValue({
        ...goal,
        startDate: new Date(goal.startDate).toISOString().split('T')[0],
        targetDate: new Date(goal.targetDate).toISOString().split('T')[0]
      });
    } else {
      this.goalForm.reset();
      this.goalForm.patchValue({
        startDate: new Date().toISOString().split('T')[0],
        priority: 'medium'
      });
    }
    this.showGoalModal = true;
  }

  closeModal(): void {
    this.showMetricModal = false;
    this.showGoalModal = false;
    this.showDeleteModal = false;
    this.editingMetric = null;
    this.editingGoal = null;
    this.deletingItem = null;
  }

  // CRUD operations
  saveMetric(): void {
    if (this.metricForm.valid) {
      const formValue = this.metricForm.value;
      const changeAmount = formValue.currentValue - formValue.previousValue;
      const changePercentage = formValue.previousValue > 0 ? 
        ((changeAmount / formValue.previousValue) * 100) : 0;
      
      let status: 'improving' | 'declining' | 'stable' = 'stable';
      if (changeAmount > 0) status = 'improving';
      else if (changeAmount < 0) status = 'declining';

      const metric: ProgressMetric = {
        ...formValue,
        id: this.editingMetric?.id || `PM-${Date.now()}`,
        recordedDate: new Date(formValue.recordedDate),
        changeAmount,
        changePercentage: Math.round(changePercentage * 10) / 10,
        status
      };

      if (this.editingMetric) {
        const index = this.metrics.findIndex(m => m.id === this.editingMetric!.id);
        this.metrics[index] = metric;
      } else {
        this.metrics.unshift(metric);
      }

      this.applyFilters();
      this.closeModal();
    }
  }

  saveGoal(): void {
    if (this.goalForm.valid) {
      const formValue = this.goalForm.value;
      const goal: ProgressGoal = {
        ...formValue,
        id: this.editingGoal?.id || `PG-${Date.now()}`,
        startDate: new Date(formValue.startDate),
        targetDate: new Date(formValue.targetDate),
        status: this.editingGoal?.status || 'active'
      };

      if (this.editingGoal) {
        const index = this.goals.findIndex(g => g.id === this.editingGoal!.id);
        this.goals[index] = goal;
      } else {
        this.goals.unshift(goal);
      }

      this.applyGoalFilters();
      this.closeModal();
    }
  }

  confirmDelete(item: ProgressMetric | ProgressGoal, type: 'metric' | 'goal'): void {
    this.deletingItem = { item, type };
    this.showDeleteModal = true;
  }

  deleteItem(): void {
    if (this.deletingItem) {
      if (this.deletingItem.type === 'metric') {
        this.metrics = this.metrics.filter(m => m.id !== this.deletingItem.item.id);
        this.applyFilters();
      } else {
        this.goals = this.goals.filter(g => g.id !== this.deletingItem.item.id);
        this.applyGoalFilters();
      }
    }
    this.closeModal();
  }

  // Utility methods
  getMetricTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'credit_score': 'Credit Score',
      'accounts_removed': 'Accounts Removed',
      'positive_accounts': 'Positive Accounts',
      'utilization': 'Credit Utilization',
      'payment_history': 'Payment History'
    };
    return labels[type] || type;
  }

  getGoalTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'credit_score': 'Credit Score',
      'debt_reduction': 'Debt Reduction',
      'account_removal': 'Account Removal',
      'utilization_target': 'Utilization Target'
    };
    return labels[type] || type;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'improving': 'text-green-600 bg-green-100',
      'declining': 'text-red-600 bg-red-100',
      'stable': 'text-gray-600 bg-gray-100',
      'active': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'paused': 'text-yellow-600 bg-yellow-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return classes[status] || 'text-gray-600 bg-gray-100';
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'high': 'text-red-600 bg-red-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'low': 'text-green-600 bg-green-100'
    };
    return classes[priority] || 'text-gray-600 bg-gray-100';
  }

  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(100, Math.max(0, (current / target) * 100));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  exportData(): void {
    // Implementation for exporting progress data
    console.log('Exporting progress data...');
  }

  generateReport(): void {
    // Implementation for generating progress report
    console.log('Generating progress report...');
  }
}