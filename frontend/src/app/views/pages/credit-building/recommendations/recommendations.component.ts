import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { 
  CreditRecommendation, 
  RecommendationType, 
  RecommendationPriority, 
  RecommendationStatus,
  StrategyType,
  GoalType
} from '../credit-building.model';
import { CreditBuildingService } from '../credit-building.service';

interface RecommendationFilters {
  search: string;
  type: RecommendationType | '';
  priority: RecommendationPriority | '';
  status: RecommendationStatus | '';
  clientId: string;
}

interface RecommendationStats {
  total: number;
  pending: number;
  completed: number;
  avgExpectedImpact: number;
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.scss']
})
export class RecommendationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  recommendations: CreditRecommendation[] = [];
  filteredRecommendations: CreditRecommendation[] = [];
  selectedRecommendations: string[] = [];
  stats: RecommendationStats = {
    total: 0,
    pending: 0,
    completed: 0,
    avgExpectedImpact: 0
  };

  // UI State
  loading = false;
  error: string | null = null;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showDetailsModal = false;
  editingRecommendation: CreditRecommendation | null = null;
  mode: 'list' | 'create' | 'edit' | 'view' = 'list';

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'priority';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filters
  filters: RecommendationFilters = {
    search: '',
    type: '',
    priority: '',
    status: '',
    clientId: ''
  };

  // Forms
  recommendationForm: FormGroup;
  filterForm: FormGroup;

  // Enums for template
  RecommendationType = RecommendationType;
  RecommendationPriority = RecommendationPriority;
  RecommendationStatus = RecommendationStatus;
  StrategyType = StrategyType;
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
    this.loadRecommendations();
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
        const recommendationId = this.route.snapshot.params['id'];
        if (recommendationId) {
          this.loadRecommendation(recommendationId);
        }
      }
    }
  }

  private initializeForms(): void {
    this.recommendationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['', Validators.required],
      priority: ['', Validators.required],
      clientId: ['', Validators.required],
      reasoning: ['', Validators.required],
       expectedImpact: ['', [Validators.min(1), Validators.max(100)]],
       timeframe: ['', [Validators.required, Validators.min(1)]],
       effort: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
       cost: ['', [Validators.min(0)]],
       isActive: [true]
    });

    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      priority: [''],
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

  private loadRecommendations(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortField,
      sortOrder: this.sortDirection,
      search: this.filters.search || undefined,
      type: this.filters.type || undefined,
      priority: this.filters.priority || undefined,
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
    this.recommendations = this.getMockRecommendations();
    this.totalItems = this.recommendations.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.applyFilters();
    this.loading = false;
  }

  private loadRecommendation(id: string): void {
    this.loading = true;
    this.error = null;

    // Mock data for now
    const recommendation = this.getMockRecommendations().find(r => r.id === id);
    if (recommendation) {
      this.editingRecommendation = recommendation;
      if (this.mode === 'edit') {
        this.populateForm(recommendation);
      }
    }
    this.loading = false;
  }

  private loadStats(): void {
    const recommendations = this.getMockRecommendations();
    this.stats = {
      total: recommendations.length,
      pending: recommendations.filter(r => r.status === RecommendationStatus.PENDING).length,
      completed: recommendations.filter(r => r.status === RecommendationStatus.COMPLETED).length,
      avgExpectedImpact: Math.round(recommendations.reduce((sum, r) => sum + (r.expectedImpact || 0), 0) / recommendations.length)
    };
  }

  private applyFilters(): void {
    let filtered = [...this.recommendations];

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(recommendation => 
        recommendation.title.toLowerCase().includes(search) ||
        recommendation.description.toLowerCase().includes(search)
      );
    }

    if (this.filters.type) {
      filtered = filtered.filter(recommendation => recommendation.type === this.filters.type);
    }

    if (this.filters.priority) {
      filtered = filtered.filter(recommendation => recommendation.priority === this.filters.priority);
    }

    if (this.filters.status) {
      filtered = filtered.filter(recommendation => recommendation.status === this.filters.status);
    }

    if (this.filters.clientId) {
      filtered = filtered.filter(recommendation => recommendation.clientId === this.filters.clientId);
    }

    this.filteredRecommendations = filtered;
  }

  private populateForm(recommendation: CreditRecommendation): void {
    this.recommendationForm.patchValue({
      title: recommendation.title,
      description: recommendation.description,
      type: recommendation.type,
      priority: recommendation.priority,
      clientId: recommendation.clientId,
      reasoning: recommendation.reasoning,
       expectedImpact: recommendation.expectedImpact,
       timeframe: recommendation.timeframe,
       effort: recommendation.effort,
       cost: recommendation.cost,

      isActive: recommendation.status !== RecommendationStatus.DISMISSED
    });
  }

  private getMockRecommendations(): CreditRecommendation[] {
    return [
      {
        id: 'rec-001',
        title: 'Apply for Secured Credit Card',
        description: 'Establish credit history with a secured credit card to build positive payment history',
        type: RecommendationType.IMMEDIATE,
        priority: RecommendationPriority.HIGH,
        status: RecommendationStatus.PENDING,
        clientId: 'client-001',
        reasoning: 'Client has no credit history and needs to establish positive payment patterns',
        expectedImpact: 75,
        timeframe: 30,
        effort: 2,
        
        cost: 200,
        relatedStrategies: [],
        actionItems: [
          {
            id: 'action-1',
            title: 'Research secured credit card options',
            description: 'Compare different secured card offerings',
            isCompleted: false,
            dueDate: new Date('2025-08-25')
          }
        ],
        createdAt: new Date('2025-08-15'),
        updatedAt: new Date('2025-08-20'),

        metadata: {
          source: 'AI',
          confidence: 85,
          basedOn: ['credit_history', 'payment_patterns'],
          alternatives: ['authorized_user'],
          risks: ['annual_fees'],
          benefits: ['credit_building', 'payment_history']
        }
      },
      {
        id: 'rec-002',
        title: 'Dispute Inaccurate Late Payment',
        description: 'Challenge incorrect late payment entry on Experian credit report',
        type: RecommendationType.SHORT_TERM,
        priority: RecommendationPriority.CRITICAL,
        status: RecommendationStatus.IN_PROGRESS,
        clientId: 'client-001',
        reasoning: 'Inaccurate information is negatively impacting credit score',
        expectedImpact: 50,
        timeframe: 45,
        effort: 2,
        
        cost: 0,
        relatedStrategies: [],
        actionItems: [
          {
            id: 'action-2',
            title: 'Gather payment records and documentation',
            description: 'Collect bank statements and payment confirmations',
            isCompleted: false,
            dueDate: new Date('2025-08-25')
          }
        ],
        createdAt: new Date('2025-07-20'),
        updatedAt: new Date('2025-08-10'),

        metadata: {
          source: 'Manual',
          confidence: 92,
          basedOn: ['payment_records', 'credit_report'],
          alternatives: ['goodwill_letter'],
          risks: ['investigation_time'],
          benefits: ['score_improvement', 'accurate_reporting']
        }
      },
      {
        id: 'rec-003',
        title: 'Reduce Credit Utilization',
        description: 'Pay down credit card balances to achieve optimal utilization ratio',
        type: RecommendationType.LONG_TERM,
        priority: RecommendationPriority.HIGH,
        status: RecommendationStatus.COMPLETED,
        clientId: 'client-002',
        reasoning: 'High credit utilization is significantly impacting credit score',
        expectedImpact: 60,
        timeframe: 60,
        effort: 3,
        
        cost: 0,
        relatedStrategies: [],
        actionItems: [
          {
            id: 'action-3',
            title: 'Calculate current utilization ratios',
            description: 'Review all credit card balances and limits',
            isCompleted: true,
            dueDate: new Date('2025-06-20')
          }
        ],
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-08-01'),
        completedDate: new Date('2025-07-30'),

        metadata: {
          source: 'AI',
          confidence: 88,
          basedOn: ['utilization_ratio', 'payment_capacity'],
          alternatives: ['balance_transfer', 'credit_limit_increase'],
          risks: ['payment_burden'],
          benefits: ['score_improvement', 'lower_utilization']
        }
      },
      {
        id: 'rec-004',
        title: 'Add Authorized User Account',
        description: 'Become authorized user on family member\'s account with excellent payment history',
        type: RecommendationType.IMMEDIATE,
        priority: RecommendationPriority.MEDIUM,
        status: RecommendationStatus.PENDING,
        clientId: 'client-003',
        reasoning: 'Client needs to establish credit history and improve credit age',
        expectedImpact: 45,
        timeframe: 42,
        effort: 1,
        
        cost: 0,
        relatedStrategies: [],
        actionItems: [
          {
            id: 'action-4',
            title: 'Identify family member with good credit',
            description: 'Contact family members to discuss arrangement',
            isCompleted: false,
            dueDate: new Date('2025-08-30')
          }
        ],
        createdAt: new Date('2025-08-10'),
        updatedAt: new Date('2025-08-15'),

        metadata: {
          source: 'AI',
          confidence: 78,
          basedOn: ['credit_history', 'family_situation'],
          alternatives: ['secured_card', 'credit_builder_loan'],
          risks: ['family_relationship', 'account_misuse'],
          benefits: ['credit_age', 'payment_history']
        }
      },
      {
        id: 'rec-005',
        title: 'Negotiate Payment Plan',
        description: 'Establish payment arrangement for outstanding collection account',
        type: RecommendationType.MAINTENANCE,
        priority: RecommendationPriority.HIGH,
        status: RecommendationStatus.DISMISSED,
        clientId: 'client-004',
        reasoning: 'Outstanding collection account is negatively impacting credit score',
        expectedImpact: 40,
        timeframe: 28,
        effort: 3,
        
        cost: 1500,
        relatedStrategies: [],
        actionItems: [
          {
            id: 'action-5',
            title: 'Contact collection agency',
            description: 'Initiate contact to discuss payment options',
            isCompleted: false,
            dueDate: new Date('2025-07-15')
          }
        ],
        createdAt: new Date('2025-07-01'),
        updatedAt: new Date('2025-08-05'),

        metadata: {
          source: 'Manual',
          confidence: 65,
          basedOn: ['collection_account', 'payment_capacity'],
          alternatives: ['debt_validation', 'settlement'],
          risks: ['payment_burden', 'collection_activity'],
          benefits: ['account_resolution', 'score_improvement']
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
      priority: '',
      status: '',
      clientId: ''
    };
    this.applyFilters();
  }

  onCreateRecommendation(): void {
    this.mode = 'create';
    this.editingRecommendation = null;
    this.recommendationForm.reset();
    this.showCreateModal = true;
  }

  onEditRecommendation(recommendation: CreditRecommendation): void {
    this.mode = 'edit';
    this.editingRecommendation = recommendation;
    this.populateForm(recommendation);
    this.showEditModal = true;
  }

  onViewRecommendation(recommendation: CreditRecommendation): void {
    this.editingRecommendation = recommendation;
    this.showDetailsModal = true;
  }

  onDeleteRecommendation(recommendation: CreditRecommendation): void {
    this.editingRecommendation = recommendation;
    this.showDeleteModal = true;
  }

  onImplementRecommendation(recommendation: CreditRecommendation): void {
    console.log('Implementing recommendation:', recommendation.id);
    // Update status to completed
    recommendation.status = RecommendationStatus.COMPLETED;
    recommendation.completedDate = new Date();
    this.loadStats();
  }

  onDismissRecommendation(recommendation: CreditRecommendation): void {
    console.log('Dismissing recommendation:', recommendation.id);
    // Update status to dismissed
    recommendation.status = RecommendationStatus.DISMISSED;
    recommendation.updatedAt = new Date();
    this.loadStats();
  }

  onSaveRecommendation(): void {
    if (this.recommendationForm.valid) {
      const formData = this.recommendationForm.value;
      
      if (this.mode === 'create') {
        // Create new recommendation
        console.log('Creating recommendation:', formData);
      } else if (this.mode === 'edit') {
        // Update existing recommendation
        console.log('Updating recommendation:', this.editingRecommendation?.id, formData);
      }
      
      this.showCreateModal = false;
      this.showEditModal = false;
      this.loadRecommendations();
    }
  }

  onConfirmDelete(): void {
    if (this.editingRecommendation) {
      console.log('Deleting recommendation:', this.editingRecommendation.id);
      this.showDeleteModal = false;
      this.loadRecommendations();
    }
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadRecommendations();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRecommendations();
  }

  onSelectRecommendation(recommendationId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedRecommendations.push(recommendationId);
    } else {
      this.selectedRecommendations = this.selectedRecommendations.filter(id => id !== recommendationId);
    }
  }

  onSelectAllRecommendations(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedRecommendations = this.filteredRecommendations.map(r => r.id);
    } else {
      this.selectedRecommendations = [];
    }
  }

  // Utility Methods
  getRecommendationTypeLabel(type: RecommendationType): string {
    const labels: Record<RecommendationType, string> = {
      [RecommendationType.IMMEDIATE]: 'Immediate',
      [RecommendationType.SHORT_TERM]: 'Short Term',
      [RecommendationType.LONG_TERM]: 'Long Term',
      [RecommendationType.MAINTENANCE]: 'Maintenance'
    };
    return labels[type] || type;
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

  getStatusColor(status: RecommendationStatus): string {
    const colors: Record<RecommendationStatus, string> = {
      [RecommendationStatus.PENDING]: 'warning',
      [RecommendationStatus.IN_PROGRESS]: 'primary',
      [RecommendationStatus.COMPLETED]: 'success',
      [RecommendationStatus.DISMISSED]: 'secondary'
    };
    return colors[status] || 'secondary';
  }

  formatTimeframe(timeframe: number): string {
    return `${timeframe} days`;
  }

  formatCost(cost: number): string {
    return cost > 0 ? `$${cost.toLocaleString()}` : 'Free';
  }

  formatExpectedImpact(impact: number): string {
    return `${impact}%`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.recommendationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.recommendationForm.get(fieldName);
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

  canImplement(recommendation: CreditRecommendation): boolean {
    return recommendation.status === RecommendationStatus.PENDING || 
           recommendation.status === RecommendationStatus.IN_PROGRESS;
  }

  canDismiss(recommendation: CreditRecommendation): boolean {
    return recommendation.status !== RecommendationStatus.COMPLETED && 
           recommendation.status !== RecommendationStatus.DISMISSED;
  }
}