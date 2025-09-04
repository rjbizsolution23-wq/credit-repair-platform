import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  CreditBuildingStrategy, 
  StrategyType, 
  StrategyStatus, 
  RecommendationType,
  RecommendationPriority,
  GoalType
} from '../credit-building.model';
import { CreditBuildingService } from '../credit-building.service';

interface StrategyFilters {
  search: string;
  type: StrategyType | '';
  status: StrategyStatus | '';
  clientId: string;
}

interface StrategyStats {
  total: number;
  active: number;
  completed: number;
  effectiveness: number;
}

@Component({
  selector: 'app-strategies',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './strategies.component.html',
  styleUrls: ['./strategies.component.scss']
})
export class StrategiesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  strategies: CreditBuildingStrategy[] = [];
  filteredStrategies: CreditBuildingStrategy[] = [];
  selectedStrategies: string[] = [];
  stats: StrategyStats = {
    total: 0,
    active: 0,
    completed: 0,
    effectiveness: 0
  };

  // UI State
  loading = false;
  error: string | null = null;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  editingStrategy: CreditBuildingStrategy | null = null;
  mode: 'list' | 'create' | 'edit' | 'view' = 'list';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'title';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filters
  filters: StrategyFilters = {
    search: '',
    type: '',
    status: '',
    clientId: ''
  };

  // Forms
  strategyForm: FormGroup;
  filterForm: FormGroup;

  // Enums for template
  StrategyType = StrategyType;
  StrategyStatus = StrategyStatus;
  RecommendationType = RecommendationType;
  RecommendationPriority = RecommendationPriority;
  GoalType = GoalType;
  
  // Math utility for template
  Math = Math;

  constructor(
    private creditBuildingService: CreditBuildingService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.checkRouteMode();
    this.loadStrategies();
    this.loadStats();
    this.setupFilterSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkRouteMode(): void {
    const routeData = this.route.snapshot.data;
    if (routeData['mode']) {
      this.mode = routeData['mode'];
      if (this.mode === 'edit' || this.mode === 'view') {
        const strategyId = this.route.snapshot.params['id'];
        if (strategyId) {
          this.loadStrategy(strategyId);
        }
      }
    }
  }

  private initializeForms(): void {
    this.strategyForm = this.fb.group({
      id: [''],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['', Validators.required],
      clientId: ['', Validators.required],
      timeframe: ['', Validators.required],
      priority: ['', Validators.required],
      estimatedImpact: [''],
      cost: [''],
      difficulty: [''],
      requirements: [''],
      steps: [''],
      progress: [''],
      assignedTo: [''],
      isActive: [true]
    });

    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: [''],
      clientId: ['']
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(filters => {
        this.filters = { ...filters };
        this.applyFilters();
      });
  }

  private loadStrategies(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortDirection,
      search: this.filters.search || undefined,
      type: this.filters.type || undefined,
      status: this.filters.status || undefined,
      clientId: this.filters.clientId || undefined
    };
    
    // Remove empty string values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === undefined) {
        delete params[key];
      }
    });

    // Mock data for now
    this.strategies = this.getMockStrategies();
    this.totalItems = this.strategies.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.applyFilters();
    this.loading = false;
  }

  private loadStrategy(id: string): void {
    this.loading = true;
    this.error = null;

    // Mock data for now
    const strategy = this.getMockStrategies().find(s => s.id === id);
    if (strategy) {
      this.editingStrategy = strategy;
      if (this.mode === 'edit') {
        this.populateForm(strategy);
      }
    }
    this.loading = false;
  }

  private loadStats(): void {
    const strategies = this.getMockStrategies();
    this.stats = {
      total: strategies.length,
      active: strategies.filter(s => s.status === StrategyStatus.ACTIVE).length,
      completed: strategies.filter(s => s.status === StrategyStatus.COMPLETED).length,
      effectiveness: Math.round(strategies.reduce((sum, s) => sum + (s.estimatedImpact || 0), 0) / strategies.length)
    };
  }

  private applyFilters(): void {
    let filtered = [...this.strategies];

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(strategy => 
        strategy.title.toLowerCase().includes(search) ||
        strategy.description.toLowerCase().includes(search)
      );
    }

    if (this.filters.type) {
      filtered = filtered.filter(strategy => strategy.type === this.filters.type);
    }

    if (this.filters.status) {
      filtered = filtered.filter(strategy => strategy.status === this.filters.status);
    }

    if (this.filters.clientId) {
      filtered = filtered.filter(strategy => strategy.clientId === this.filters.clientId);
    }

    this.filteredStrategies = filtered;
  }

  private populateForm(strategy: CreditBuildingStrategy): void {
    this.strategyForm.patchValue({
      id: strategy.id,
      title: strategy.title,
      description: strategy.description,
      type: strategy.type,
      clientId: strategy.clientId,
      timeframe: strategy.timeframe,
      priority: strategy.priority,
      estimatedImpact: strategy.estimatedImpact,
      cost: strategy.cost,
      difficulty: strategy.difficulty,
      requirements: strategy.requirements?.join('\n'),
      steps: strategy.steps?.map((s: any) => `${s.title}: ${s.description}`).join('\n'),
      progress: strategy.progress,
      assignedTo: strategy.assignedTo,
      isActive: strategy.status === StrategyStatus.ACTIVE
    });
  }

  private getMockStrategies(): CreditBuildingStrategy[] {
    return [
      {
        id: 'str-001',
        title: 'Secured Credit Card Strategy',
        description: 'Build credit history using secured credit cards with responsible usage',
        type: StrategyType.SECURED_CARD,
        clientId: 'client-001',
        status: StrategyStatus.ACTIVE,
        priority: RecommendationPriority.HIGH,
        estimatedImpact: 70,
        timeframe: 180, // 6 months
        cost: 200,
        difficulty: 2,
        requirements: [
          'Valid ID and SSN',
          'Minimum $200 security deposit',
          'Bank account for payments'
        ],
        steps: [
           {
             id: 'step-001',
             title: 'Apply for secured credit card',
             description: 'Research and apply for a secured credit card with good terms',
             order: 1,
             isCompleted: false,
             dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
             estimatedDuration: 7,
             resources: ['Credit card comparison websites', 'Bank applications']
           },
           {
             id: 'step-002',
             title: 'Make small purchases monthly',
             description: 'Use card for small purchases to build payment history',
             order: 2,
             isCompleted: false,
             dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
             estimatedDuration: 30,
             resources: ['Monthly budget tracker', 'Payment reminders']
           }
         ],
         progress: 25,
         assignedTo: 'client-001',
         createdBy: 'advisor-001',
         createdAt: new Date('2025-08-15'),
         updatedAt: new Date('2025-08-20'),
         metadata: {
           tags: ['credit-building', 'secured-card'],
           category: 'Credit Cards',
           targetAudience: ['new-credit', 'rebuilding-credit'],
           successRate: 85,
           averageImpact: 70,
           riskLevel: 'Low',
           prerequisites: ['Valid ID', 'Bank account', 'Security deposit']
         }
      },
      {
        id: 'str-002',
        title: 'Authorized User Strategy',
        description: 'Become authorized user on family member\'s account with good payment history',
        type: StrategyType.AUTHORIZED_USER,
        clientId: 'client-002',
        status: StrategyStatus.COMPLETED,
        priority: RecommendationPriority.MEDIUM,
        estimatedImpact: 45,
        timeframe: 90, // 3 months
        cost: 0,
        difficulty: 1,
        requirements: [
          'Family member with good credit',
          'Willing family member to add you',
          'Valid identification'
        ],
        steps: [
           {
             id: 'step-003',
             title: 'Identify family member with good credit',
             description: 'Find a family member with excellent payment history',
             order: 1,
             isCompleted: true,
             dueDate: new Date('2025-06-20'),
             estimatedDuration: 3,
             resources: ['Family contact list', 'Credit score discussion guide']
           },
           {
             id: 'step-004',
             title: 'Request to be added as authorized user',
             description: 'Ask family member to add you to their account',
             order: 2,
             isCompleted: true,
             dueDate: new Date('2025-07-01'),
             estimatedDuration: 1,
             resources: ['Authorization forms', 'ID documentation']
           }
         ],
         progress: 100,
         assignedTo: 'client-002',
         createdBy: 'advisor-002',
         createdAt: new Date('2025-06-15'),
         updatedAt: new Date('2025-08-01'),
         metadata: {
           tags: ['credit-building', 'authorized-user'],
           category: 'Account Management',
           targetAudience: ['new-credit', 'young-adults'],
           successRate: 92,
           averageImpact: 45,
           riskLevel: 'Very Low',
           prerequisites: ['Family member with good credit', 'Valid identification']
         }
      }
    ];
  }

  // Event Handlers
  onToggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onClearFilters(): void {
    this.filterForm.reset();
    this.filters = {
      search: '',
      type: '',
      status: '',
      clientId: ''
    };
    this.applyFilters();
  }

  onCreateStrategy(): void {
    this.mode = 'create';
    this.editingStrategy = null;
    this.strategyForm.reset();
    this.showCreateModal = true;
  }

  onEditStrategy(strategy: CreditBuildingStrategy): void {
    this.mode = 'edit';
    this.editingStrategy = strategy;
    this.populateForm(strategy);
    this.showEditModal = true;
  }

  onViewStrategy(strategy: CreditBuildingStrategy): void {
    this.router.navigate(['/credit-building/strategies', strategy.id]);
  }

  onDeleteStrategy(strategy: CreditBuildingStrategy): void {
    this.editingStrategy = strategy;
    this.showDeleteModal = true;
  }

  onSaveStrategy(): void {
    if (this.strategyForm.valid) {
      const formData = this.strategyForm.value;
      
      if (this.mode === 'create') {
        // Create new strategy
        console.log('Creating strategy:', formData);
      } else if (this.mode === 'edit') {
        // Update existing strategy
        console.log('Updating strategy:', this.editingStrategy?.id, formData);
      }
      
      this.showCreateModal = false;
      this.showEditModal = false;
      this.loadStrategies();
    }
  }

  onConfirmDelete(): void {
    if (this.editingStrategy) {
      console.log('Deleting strategy:', this.editingStrategy.id);
      this.showDeleteModal = false;
      this.loadStrategies();
    }
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadStrategies();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStrategies();
  }

  onSelectStrategy(strategyId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedStrategies.push(strategyId);
    } else {
      this.selectedStrategies = this.selectedStrategies.filter(id => id !== strategyId);
    }
  }

  onSelectAllStrategies(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedStrategies = this.filteredStrategies.map(s => s.id);
    } else {
      this.selectedStrategies = [];
    }
  }

  // Utility Methods
  getStrategyTypeLabel(type: StrategyType): string {
    const labels: Record<StrategyType, string> = {
      [StrategyType.SECURED_CARD]: 'Secured Card',
      [StrategyType.AUTHORIZED_USER]: 'Authorized User',
      [StrategyType.CREDIT_BUILDER_LOAN]: 'Credit Builder Loan',
      [StrategyType.RENT_REPORTING]: 'Rent Reporting',
      [StrategyType.UTILITY_REPORTING]: 'Utility Reporting',
      [StrategyType.DEBT_CONSOLIDATION]: 'Debt Consolidation',
      [StrategyType.PAYMENT_HISTORY]: 'Payment History',
      [StrategyType.CREDIT_MIX]: 'Credit Mix',
      [StrategyType.LENGTH_OF_HISTORY]: 'Length of History',
      [StrategyType.CREDIT_UTILIZATION]: 'Credit Utilization'
    };
    return labels[type] || type;
  }

  getStrategyStatusColor(status: StrategyStatus): string {
    const colors: Record<StrategyStatus, string> = {
      [StrategyStatus.DRAFT]: 'secondary',
      [StrategyStatus.ACTIVE]: 'primary',
      [StrategyStatus.COMPLETED]: 'success',
      [StrategyStatus.PAUSED]: 'warning',
      [StrategyStatus.CANCELLED]: 'danger'
    };
    return colors[status] || 'secondary';
  }

  getPriorityColor(priority: RecommendationPriority): string {
    const colors: Record<RecommendationPriority, string> = {
      [RecommendationPriority.LOW]: 'success',
      [RecommendationPriority.MEDIUM]: 'warning',
      [RecommendationPriority.HIGH]: 'danger',
      [RecommendationPriority.CRITICAL]: 'dark'
    };
    return colors[priority] || 'secondary';
  }

  formatTimeframe(timeframe: number): string {
    if (timeframe >= 365) {
      const years = Math.floor(timeframe / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (timeframe >= 30) {
      const months = Math.floor(timeframe / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${timeframe} day${timeframe > 1 ? 's' : ''}`;
    }
  }

  formatEffectiveness(effectiveness: number): string {
    return `${effectiveness}%`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.strategyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.strategyForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${fieldName} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldName} must be at most ${field.errors['max'].max}`;
      }
    }
    return '';
  }
}