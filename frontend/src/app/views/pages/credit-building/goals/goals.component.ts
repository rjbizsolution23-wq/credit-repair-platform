import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface CreditGoal {
  id: string;
  title: string;
  description: string;
  category: 'credit_score' | 'debt_reduction' | 'credit_building' | 'financial_health' | 'homeownership' | 'business_credit';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., 'points', 'dollars', 'accounts', 'months'
  targetDate: Date;
  createdDate: Date;
  completedDate?: Date;
  milestones: GoalMilestone[];
  actions: GoalAction[];
  notes: string;
  isPublic: boolean;
  tags: string[];
  relatedGoals: string[]; // IDs of related goals
  progress: number; // 0-100 percentage
  estimatedCompletion: Date;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description: string;
  targetValue: number;
  targetDate: Date;
  isCompleted: boolean;
  completedDate?: Date;
  order: number;
}

export interface GoalAction {
  id: string;
  goalId: string;
  title: string;
  description: string;
  actionType: 'dispute' | 'payment' | 'application' | 'monitoring' | 'education' | 'consultation';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate: Date;
  completedDate?: Date;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number; // 1-10 scale
  actualImpact?: number;
  notes: string;
}

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultTargetValue: number;
  defaultUnit: string;
  defaultTimeframe: number; // in months
  milestoneTemplates: MilestoneTemplate[];
  actionTemplates: ActionTemplate[];
  isPopular: boolean;
}

export interface MilestoneTemplate {
  title: string;
  description: string;
  targetPercentage: number; // percentage of main goal
  timePercentage: number; // percentage of total timeframe
}

export interface ActionTemplate {
  title: string;
  description: string;
  actionType: string;
  priority: string;
  estimatedImpact: number;
  timeOffset: number; // days from goal start
}

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  // State variables
  goals: CreditGoal[] = [];
  goalTemplates: GoalTemplate[] = [];
  filteredGoals: CreditGoal[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;

  // Sorting
  sortField = 'createdDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Filters
  filters = {
    category: '',
    status: '',
    priority: '',
    search: '',
    tags: '',
    dueDate: ''
  };

  // Modal states
  showGoalModal = false;
  showTemplateModal = false;
  showMilestoneModal = false;
  showActionModal = false;
  showDeleteModal = false;
  showGoalViewer = false;
  editingGoal: CreditGoal | null = null;
  viewingGoal: CreditGoal | null = null;
  deletingGoal: CreditGoal | null = null;
  editingMilestone: GoalMilestone | null = null;
  editingAction: GoalAction | null = null;

  // Forms
  goalForm: FormGroup;
  milestoneForm: FormGroup;
  actionForm: FormGroup;

  // View modes
  viewMode: string = 'grid';
  selectedCategory = '';

  // Dashboard stats
  stats = {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    averageProgress: 0,
    upcomingDeadlines: 0
  };

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.goalForm = this.createGoalForm();
    this.milestoneForm = this.createMilestoneForm();
    this.actionForm = this.createActionForm();
  }

  ngOnInit(): void {
    this.loadMockData();
    this.loadGoalTemplates();
    this.applyFilters();
    this.calculateStats();
  }

  private createGoalForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      priority: ['medium', Validators.required],
      targetValue: [0, [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      targetDate: ['', Validators.required],
      notes: [''],
      tags: [''],
      isPublic: [false]
    });
  }

  private createMilestoneForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      targetValue: [0, [Validators.required, Validators.min(0)]],
      targetDate: ['', Validators.required]
    });
  }

  private createActionForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      actionType: ['', Validators.required],
      priority: ['medium', Validators.required],
      dueDate: ['', Validators.required],
      estimatedImpact: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      notes: ['']
    });
  }

  private loadMockData(): void {
    this.goals = [
      {
        id: 'GOAL-001',
        title: 'Increase Credit Score to 750',
        description: 'Improve credit score from current 650 to target 750 through strategic credit repair and building activities.',
        category: 'credit_score',
        priority: 'high',
        status: 'in_progress',
        targetValue: 750,
        currentValue: 680,
        unit: 'points',
        targetDate: new Date('2025-12-31'),
        createdDate: new Date('2025-01-01'),
        milestones: [
          {
            id: 'MS-001',
            goalId: 'GOAL-001',
            title: 'Reach 700 Credit Score',
            description: 'First milestone towards 750 target',
            targetValue: 700,
            targetDate: new Date('2025-06-30'),
            isCompleted: false,
            order: 1
          },
          {
            id: 'MS-002',
            goalId: 'GOAL-001',
            title: 'Reach 725 Credit Score',
            description: 'Second milestone towards 750 target',
            targetValue: 725,
            targetDate: new Date('2025-09-30'),
            isCompleted: false,
            order: 2
          }
        ],
        actions: [
          {
            id: 'ACT-001',
            goalId: 'GOAL-001',
            title: 'Dispute Inaccurate Items',
            description: 'File disputes for 3 inaccurate items on credit report',
            actionType: 'dispute',
            status: 'in_progress',
            dueDate: new Date('2025-02-15'),
            priority: 'high',
            estimatedImpact: 8,
            notes: 'Focus on charge-offs and late payments'
          }
        ],
        notes: 'Primary goal for homeownership qualification',
        isPublic: false,
        tags: ['credit score', 'homeownership', 'primary'],
        relatedGoals: ['GOAL-003'],
        progress: 43,
        estimatedCompletion: new Date('2025-11-15')
      },
      {
        id: 'GOAL-002',
        title: 'Pay Down Credit Card Debt',
        description: 'Reduce total credit card debt from $15,000 to $5,000 to improve credit utilization ratio.',
        category: 'debt_reduction',
        priority: 'high',
        status: 'in_progress',
        targetValue: 5000,
        currentValue: 12000,
        unit: 'dollars',
        targetDate: new Date('2025-08-31'),
        createdDate: new Date('2025-01-01'),
        milestones: [
          {
            id: 'MS-003',
            goalId: 'GOAL-002',
            title: 'Reduce to $10,000',
            description: 'First milestone in debt reduction',
            targetValue: 10000,
            targetDate: new Date('2025-04-30'),
            isCompleted: true,
            completedDate: new Date('2025-04-15'),
            order: 1
          }
        ],
        actions: [],
        notes: 'Focus on highest interest rate cards first',
        isPublic: false,
        tags: ['debt reduction', 'credit utilization', 'high priority'],
        relatedGoals: ['GOAL-001'],
        progress: 30,
        estimatedCompletion: new Date('2025-09-15')
      },
      {
        id: 'GOAL-003',
        title: 'Qualify for Mortgage',
        description: 'Meet all requirements for conventional mortgage approval including credit score, debt-to-income ratio, and down payment.',
        category: 'homeownership',
        priority: 'critical',
        status: 'in_progress',
        targetValue: 1,
        currentValue: 0,
        unit: 'approval',
        targetDate: new Date('2026-01-31'),
        createdDate: new Date('2025-01-01'),
        milestones: [],
        actions: [],
        notes: 'Dependent on credit score and debt reduction goals',
        isPublic: false,
        tags: ['mortgage', 'homeownership', 'long-term'],
        relatedGoals: ['GOAL-001', 'GOAL-002'],
        progress: 25,
        estimatedCompletion: new Date('2026-02-28')
      },
      {
        id: 'GOAL-004',
        title: 'Build Business Credit',
        description: 'Establish and build business credit profile with target of 80+ business credit score.',
        category: 'business_credit',
        priority: 'medium',
        status: 'not_started',
        targetValue: 80,
        currentValue: 0,
        unit: 'points',
        targetDate: new Date('2025-12-31'),
        createdDate: new Date('2025-01-15'),
        milestones: [],
        actions: [],
        notes: 'For business expansion and equipment financing',
        isPublic: false,
        tags: ['business credit', 'expansion', 'financing'],
        relatedGoals: [],
        progress: 0,
        estimatedCompletion: new Date('2026-01-31')
      }
    ];

    this.totalItems = this.goals.length;
    this.calculatePagination();
  }

  private loadGoalTemplates(): void {
    this.goalTemplates = [
      {
        id: 'TMPL-001',
        name: 'Improve Credit Score',
        description: 'Standard template for credit score improvement goals',
        category: 'credit_score',
        defaultTargetValue: 750,
        defaultUnit: 'points',
        defaultTimeframe: 12,
        milestoneTemplates: [
          {
            title: 'First Score Increase',
            description: 'Initial improvement milestone',
            targetPercentage: 40,
            timePercentage: 30
          },
          {
            title: 'Significant Progress',
            description: 'Major progress milestone',
            targetPercentage: 70,
            timePercentage: 60
          }
        ],
        actionTemplates: [
          {
            title: 'Review Credit Reports',
            description: 'Obtain and review all three credit reports',
            actionType: 'monitoring',
            priority: 'high',
            estimatedImpact: 7,
            timeOffset: 0
          },
          {
            title: 'Dispute Inaccuracies',
            description: 'File disputes for any inaccurate information',
            actionType: 'dispute',
            priority: 'high',
            estimatedImpact: 9,
            timeOffset: 7
          }
        ],
        isPopular: true
      },
      {
        id: 'TMPL-002',
        name: 'Debt Reduction Plan',
        description: 'Template for systematic debt reduction',
        category: 'debt_reduction',
        defaultTargetValue: 0,
        defaultUnit: 'dollars',
        defaultTimeframe: 18,
        milestoneTemplates: [
          {
            title: '25% Debt Reduction',
            description: 'First quarter of debt eliminated',
            targetPercentage: 25,
            timePercentage: 25
          },
          {
            title: '50% Debt Reduction',
            description: 'Half of debt eliminated',
            targetPercentage: 50,
            timePercentage: 50
          },
          {
            title: '75% Debt Reduction',
            description: 'Three quarters of debt eliminated',
            targetPercentage: 75,
            timePercentage: 75
          }
        ],
        actionTemplates: [
          {
            title: 'Create Debt Inventory',
            description: 'List all debts with balances and interest rates',
            actionType: 'education',
            priority: 'high',
            estimatedImpact: 6,
            timeOffset: 0
          },
          {
            title: 'Negotiate Payment Plans',
            description: 'Contact creditors to negotiate better terms',
            actionType: 'consultation',
            priority: 'medium',
            estimatedImpact: 7,
            timeOffset: 14
          }
        ],
        isPopular: true
      }
    ];
  }

  // Filtering and sorting
  applyFilters(): void {
    let filtered = [...this.goals];

    if (this.filters.category) {
      filtered = filtered.filter(g => g.category === this.filters.category);
    }

    if (this.filters.status) {
      filtered = filtered.filter(g => g.status === this.filters.status);
    }

    if (this.filters.priority) {
      filtered = filtered.filter(g => g.priority === this.filters.priority);
    }

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(g => 
        g.title.toLowerCase().includes(search) ||
        g.description.toLowerCase().includes(search) ||
        g.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (this.filters.dueDate) {
      const filterDate = new Date(this.filters.dueDate);
      filtered = filtered.filter(g => g.targetDate <= filterDate);
    }

    this.filteredGoals = filtered;
    this.totalItems = filtered.length;
    this.calculatePagination();
  }

  clearFilters(): void {
    this.filters = {
      category: '',
      status: '',
      priority: '',
      search: '',
      tags: '',
      dueDate: ''
    };
    this.applyFilters();
  }

  // Sorting
  sort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredGoals.sort((a, b) => {
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

  get paginatedGoals(): CreditGoal[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredGoals.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Modal operations
  openGoalModal(goal?: CreditGoal): void {
    this.editingGoal = goal || null;
    if (goal) {
      this.goalForm.patchValue({
        ...goal,
        targetDate: this.formatDateForInput(goal.targetDate),
        tags: goal.tags.join(', ')
      });
    } else {
      this.goalForm.reset();
      this.goalForm.patchValue({
        priority: 'medium',
        isPublic: false
      });
    }
    this.showGoalModal = true;
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  openGoalViewer(goal: CreditGoal): void {
    this.viewingGoal = goal;
    this.showGoalViewer = true;
  }

  closeModal(): void {
    this.showGoalModal = false;
    this.showTemplateModal = false;
    this.showMilestoneModal = false;
    this.showActionModal = false;
    this.showDeleteModal = false;
    this.showGoalViewer = false;
    this.editingGoal = null;
    this.viewingGoal = null;
    this.deletingGoal = null;
    this.editingMilestone = null;
    this.editingAction = null;
  }

  // CRUD operations
  saveGoal(): void {
    if (this.goalForm.valid) {
      const formValue = this.goalForm.value;
      const goal: CreditGoal = {
        ...formValue,
        id: this.editingGoal?.id || `GOAL-${Date.now()}`,
        targetDate: new Date(formValue.targetDate),
        tags: formValue.tags ? 
          formValue.tags.split(',').map((t: string) => t.trim()) : [],
        currentValue: this.editingGoal?.currentValue || 0,
        status: this.editingGoal?.status || 'not_started',
        createdDate: this.editingGoal?.createdDate || new Date(),
        milestones: this.editingGoal?.milestones || [],
        actions: this.editingGoal?.actions || [],
        relatedGoals: this.editingGoal?.relatedGoals || [],
        progress: this.editingGoal?.progress || 0,
        estimatedCompletion: this.editingGoal?.estimatedCompletion || new Date(formValue.targetDate)
      };

      if (this.editingGoal) {
        const index = this.goals.findIndex(g => g.id === this.editingGoal!.id);
        this.goals[index] = goal;
      } else {
        this.goals.unshift(goal);
      }

      this.applyFilters();
      this.calculateStats();
      this.closeModal();
    }
  }

  createFromTemplate(template: GoalTemplate): void {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + template.defaultTimeframe);

    const newGoal: CreditGoal = {
      id: `GOAL-${Date.now()}`,
      title: template.name,
      description: template.description,
      category: template.category as any,
      priority: 'medium',
      status: 'not_started',
      targetValue: template.defaultTargetValue,
      currentValue: 0,
      unit: template.defaultUnit,
      targetDate: targetDate,
      createdDate: new Date(),
      milestones: template.milestoneTemplates.map((mt, index) => ({
        id: `MS-${Date.now()}-${index}`,
        goalId: `GOAL-${Date.now()}`,
        title: mt.title,
        description: mt.description,
        targetValue: Math.round(template.defaultTargetValue * (mt.targetPercentage / 100)),
        targetDate: new Date(Date.now() + (template.defaultTimeframe * 30 * 24 * 60 * 60 * 1000 * (mt.timePercentage / 100))),
        isCompleted: false,
        order: index + 1
      })),
      actions: template.actionTemplates.map((at, index) => ({
        id: `ACT-${Date.now()}-${index}`,
        goalId: `GOAL-${Date.now()}`,
        title: at.title,
        description: at.description,
        actionType: at.actionType as any,
        status: 'pending',
        dueDate: new Date(Date.now() + (at.timeOffset * 24 * 60 * 60 * 1000)),
        priority: at.priority as any,
        estimatedImpact: at.estimatedImpact,
        notes: ''
      })),
      notes: '',
      isPublic: false,
      tags: [template.category],
      relatedGoals: [],
      progress: 0,
      estimatedCompletion: targetDate
    };

    this.goals.unshift(newGoal);
    this.applyFilters();
    this.calculateStats();
    this.closeModal();
  }

  confirmDelete(goal: CreditGoal): void {
    this.deletingGoal = goal;
    this.showDeleteModal = true;
  }

  deleteGoal(): void {
    if (this.deletingGoal) {
      this.goals = this.goals.filter(g => g.id !== this.deletingGoal!.id);
      this.applyFilters();
      this.calculateStats();
    }
    this.closeModal();
  }

  // Goal actions
  updateGoalProgress(goal: CreditGoal, newValue: number): void {
    goal.currentValue = newValue;
    goal.progress = Math.round((newValue / goal.targetValue) * 100);
    
    if (goal.progress >= 100) {
      goal.status = 'completed';
      goal.completedDate = new Date();
    } else if (goal.progress > 0 && goal.status === 'not_started') {
      goal.status = 'in_progress';
    }
    
    this.calculateStats();
  }

  toggleGoalStatus(goal: CreditGoal): void {
    const statusOrder = ['not_started', 'in_progress', 'paused', 'completed', 'cancelled'];
    const currentIndex = statusOrder.indexOf(goal.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    goal.status = statusOrder[nextIndex] as any;
    
    if (goal.status === 'completed') {
      goal.completedDate = new Date();
      goal.progress = 100;
    }
    
    this.calculateStats();
  }

  duplicateGoal(goal: CreditGoal): void {
    const duplicate: CreditGoal = {
      ...goal,
      id: `GOAL-${Date.now()}`,
      title: `${goal.title} (Copy)`,
      status: 'not_started',
      currentValue: 0,
      progress: 0,
      createdDate: new Date(),
      completedDate: undefined,
      milestones: goal.milestones.map(m => ({
        ...m,
        id: `MS-${Date.now()}-${m.order}`,
        goalId: `GOAL-${Date.now()}`,
        isCompleted: false,
        completedDate: undefined
      })),
      actions: goal.actions.map(a => ({
        ...a,
        id: `ACT-${Date.now()}-${a.priority}`,
        goalId: `GOAL-${Date.now()}`,
        status: 'pending',
        completedDate: undefined
      }))
    };
    this.goals.unshift(duplicate);
    this.applyFilters();
  }

  // Statistics
  calculateStats(): void {
    this.stats = {
      totalGoals: this.goals.length,
      activeGoals: this.goals.filter(g => g.status === 'in_progress').length,
      completedGoals: this.goals.filter(g => g.status === 'completed').length,
      averageProgress: this.goals.length > 0 ? 
        Math.round(this.goals.reduce((sum, g) => sum + g.progress, 0) / this.goals.length) : 0,
      upcomingDeadlines: this.goals.filter(g => {
        const daysUntilDue = Math.ceil((g.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 30 && daysUntilDue >= 0 && g.status !== 'completed';
      }).length
    };
  }

  // Utility methods
  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'credit_score': 'Credit Score',
      'debt_reduction': 'Debt Reduction',
      'credit_building': 'Credit Building',
      'financial_health': 'Financial Health',
      'homeownership': 'Homeownership',
      'business_credit': 'Business Credit'
    };
    return labels[category] || category;
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'low': 'text-green-600 bg-green-100',
      'medium': 'text-yellow-600 bg-yellow-100',
      'high': 'text-orange-600 bg-orange-100',
      'critical': 'text-red-600 bg-red-100'
    };
    return classes[priority] || 'text-gray-600 bg-gray-100';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'not_started': 'text-gray-600 bg-gray-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'paused': 'text-yellow-600 bg-yellow-100',
      'cancelled': 'text-red-600 bg-red-100'
    };
    return classes[status] || 'text-gray-600 bg-gray-100';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  getDaysUntilDue(targetDate: Date): number {
    return Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#059669'; // success green
    if (progress >= 60) return '#14B8A6'; // primary teal
    if (progress >= 40) return '#D97706'; // warning orange
    return '#DC2626'; // error red
  }

  exportGoals(): void {
    // Implementation for exporting goals data
    console.log('Exporting goals data...');
  }

  generateReport(): void {
    // Implementation for generating progress report
    console.log('Generating progress report...');
  }

  getCompletedMilestonesCount(milestones: GoalMilestone[]): number {
    return milestones.filter(m => m.isCompleted).length;
  }

  getCompletedActionsCount(actions: GoalAction[]): number {
    return actions.filter(a => a.status === 'completed').length;
  }

  getGoalsByStatus(status: string): CreditGoal[] {
    return this.filteredGoals.filter(goal => goal.status === status);
  }

  getEndItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  isListView(): boolean {
    return this.viewMode === 'list';
  }

  isKanbanView(): boolean {
    return this.viewMode === 'kanban';
  }

  isGridView(): boolean {
    return this.viewMode === 'grid';
  }
}