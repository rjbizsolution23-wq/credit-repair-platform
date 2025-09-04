import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Interfaces
export interface CreditTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  type: ToolType;
  status: ToolStatus;
  icon: string;
  features: string[];
  pricing: ToolPricing;
  integrations: string[];
  lastUpdated: Date;
  usageCount: number;
  rating: number;
  tags: string[];
  screenshots: string[];
  documentation: string;
  supportLevel: SupportLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolPricing {
  type: 'free' | 'paid' | 'freemium' | 'subscription';
  price?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly' | 'one-time';
  trialDays?: number;
}

export interface ToolUsage {
  id: string;
  toolId: string;
  userId: string;
  usedAt: Date;
  duration: number;
  result: string;
  satisfaction: number;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ToolReview {
  id: string;
  toolId: string;
  userId: string;
  rating: number;
  comment: string;
  pros: string[];
  cons: string[];
  createdAt: Date;
}

export enum ToolType {
  CALCULATOR = 'calculator',
  ANALYZER = 'analyzer',
  GENERATOR = 'generator',
  TRACKER = 'tracker',
  SIMULATOR = 'simulator',
  VALIDATOR = 'validator',
  OPTIMIZER = 'optimizer',
  REPORTER = 'reporter'
}

export enum ToolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DEPRECATED = 'deprecated',
  BETA = 'beta',
  COMING_SOON = 'coming_soon'
}

export enum SupportLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  // Enums for template
  ToolType = ToolType;
  ToolStatus = ToolStatus;
  SupportLevel = SupportLevel;
  Math = Math;

  // State variables
  tools: CreditTool[] = [];
  filteredTools: CreditTool[] = [];
  categories: ToolCategory[] = [];
  selectedTool: CreditTool | null = null;
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  selectedCategory = '';
  selectedType = '';
  selectedStatus = '';
  selectedPricing = '';
  minRating = 0;
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // View modes
  viewMode: 'grid' | 'list' = 'grid';

  // Modal states
  showToolModal = false;
  showReviewModal = false;
  showUsageModal = false;
  modalMode: 'view' | 'create' | 'edit' = 'view';

  // Forms
  toolForm: Partial<CreditTool> = {};
  reviewForm = {
    rating: 5,
    comment: '',
    pros: [''],
    cons: ['']
  };

  // Stats
  stats = {
    totalTools: 0,
    activeTools: 0,
    freeTools: 0,
    averageRating: 0
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadTools();
    this.loadCategories();
    this.calculateStats();
  }

  loadTools(): void {
    this.loading = true;
    this.error = null;

    // Simulate API call
    setTimeout(() => {
      this.tools = this.getMockTools();
      this.applyFilters();
      this.calculateStats();
      this.loading = false;
    }, 1000);
  }

  loadCategories(): void {
    this.categories = [
      {
        id: 'analysis',
        name: 'Credit Analysis',
        description: 'Tools for analyzing credit reports and scores',
        icon: 'fa-chart-line',
        color: '#14B8A6'
      },
      {
        id: 'calculation',
        name: 'Calculators',
        description: 'Financial and credit calculators',
        icon: 'fa-calculator',
        color: '#1E3A8A'
      },
      {
        id: 'tracking',
        name: 'Progress Tracking',
        description: 'Tools for monitoring credit improvement',
        icon: 'fa-chart-bar',
        color: '#059669'
      },
      {
        id: 'simulation',
        name: 'Simulations',
        description: 'What-if scenarios and projections',
        icon: 'fa-project-diagram',
        color: '#D97706'
      },
      {
        id: 'validation',
        name: 'Validation',
        description: 'Data verification and compliance tools',
        icon: 'fa-check-circle',
        color: '#DC2626'
      },
      {
        id: 'reporting',
        name: 'Reporting',
        description: 'Generate reports and documentation',
        icon: 'fa-file-alt',
        color: '#0F766E'
      }
    ];
  }

  applyFilters(): void {
    let filtered = [...this.tools];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term) ||
        tool.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(tool => tool.category.id === this.selectedCategory);
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(tool => tool.type === this.selectedType);
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(tool => tool.status === this.selectedStatus);
    }

    // Pricing filter
    if (this.selectedPricing) {
      filtered = filtered.filter(tool => tool.pricing.type === this.selectedPricing);
    }

    // Rating filter
    if (this.minRating > 0) {
      filtered = filtered.filter(tool => tool.rating >= this.minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof CreditTool];
      let bValue: any = b[this.sortBy as keyof CreditTool];

      if (this.sortBy === 'category') {
        aValue = a.category.name;
        bValue = b.category.name;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredTools = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  getPaginatedTools(): CreditTool[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTools.slice(startIndex, endIndex);
  }

  calculateStats(): void {
    this.stats = {
      totalTools: this.tools.length,
      activeTools: this.tools.filter(t => t.status === ToolStatus.ACTIVE).length,
      freeTools: this.tools.filter(t => t.pricing.type === 'free').length,
      averageRating: this.tools.length > 0 ? 
        this.tools.reduce((sum, t) => sum + t.rating, 0) / this.tools.length : 0
    };
  }

  // Filter methods
  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedPricing = '';
    this.minRating = 0;
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Sorting methods
  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Modal methods
  openToolModal(tool?: CreditTool, mode: 'view' | 'create' | 'edit' = 'view'): void {
    this.modalMode = mode;
    this.selectedTool = tool || null;
    
    if (mode === 'create') {
      this.toolForm = {
        name: '',
        description: '',
        category: this.categories[0],
        type: ToolType.CALCULATOR,
        status: ToolStatus.ACTIVE,
        icon: 'fa-tool',
        features: [''],
        pricing: { type: 'free' },
        integrations: [''],
        tags: [''],
        screenshots: [''],
        documentation: '',
        supportLevel: SupportLevel.BASIC
      };
    } else if (mode === 'edit' && tool) {
      this.toolForm = { ...tool };
    }
    
    this.showToolModal = true;
  }

  closeToolModal(): void {
    this.showToolModal = false;
    this.selectedTool = null;
    this.toolForm = {};
  }

  openReviewModal(tool: CreditTool): void {
    this.selectedTool = tool;
    this.reviewForm = {
      rating: 5,
      comment: '',
      pros: [''],
      cons: ['']
    };
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedTool = null;
    this.reviewForm = {
      rating: 5,
      comment: '',
      pros: [''],
      cons: ['']
    };
  }

  openUsageModal(tool: CreditTool): void {
    this.selectedTool = tool;
    this.showUsageModal = true;
  }

  closeUsageModal(): void {
    this.showUsageModal = false;
    this.selectedTool = null;
  }

  // CRUD operations
  saveTool(): void {
    if (this.modalMode === 'create') {
      const newTool: CreditTool = {
        id: 'tool-' + Date.now(),
        ...this.toolForm,
        rating: 0,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as CreditTool;
      
      this.tools.push(newTool);
    } else if (this.modalMode === 'edit' && this.selectedTool) {
      const index = this.tools.findIndex(t => t.id === this.selectedTool!.id);
      if (index !== -1) {
        this.tools[index] = {
          ...this.tools[index],
          ...this.toolForm,
          updatedAt: new Date()
        } as CreditTool;
      }
    }
    
    this.applyFilters();
    this.calculateStats();
    this.closeToolModal();
  }

  deleteTool(tool: CreditTool): void {
    if (confirm(`Are you sure you want to delete "${tool.name}"?`)) {
      this.tools = this.tools.filter(t => t.id !== tool.id);
      this.applyFilters();
      this.calculateStats();
    }
  }

  // Tool actions
  useTool(tool: CreditTool): void {
    // Increment usage count
    tool.usageCount++;
    tool.lastUpdated = new Date();
    
    // Navigate to tool or open in modal
    console.log('Using tool:', tool.name);
    // this.router.navigate(['/tools', tool.id]);
  }

  favoriteTool(tool: CreditTool): void {
    console.log('Favoriting tool:', tool.name);
    // Implement favorite functionality
  }

  shareTool(tool: CreditTool): void {
    console.log('Sharing tool:', tool.name);
    // Implement share functionality
  }

  // Utility methods
  getStatusClass(status: ToolStatus): string {
    const statusClasses = {
      [ToolStatus.ACTIVE]: 'text-green-600',
      [ToolStatus.INACTIVE]: 'text-gray-600',
      [ToolStatus.MAINTENANCE]: 'text-yellow-600',
      [ToolStatus.DEPRECATED]: 'text-red-600',
      [ToolStatus.BETA]: 'text-blue-600',
      [ToolStatus.COMING_SOON]: 'text-purple-600'
    };
    return statusClasses[status] || 'text-gray-600';
  }

  getPricingLabel(pricing: ToolPricing): string {
    switch (pricing.type) {
      case 'free': return 'Free';
      case 'paid': return `$${pricing.price}`;
      case 'freemium': return 'Freemium';
      case 'subscription': return `$${pricing.price}/${pricing.billingCycle}`;
      default: return 'Unknown';
    }
  }

  getRatingStars(rating: number): string[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('fa-star');
      } else if (i - 0.5 <= rating) {
        stars.push('fa-star-half-alt');
      } else {
        stars.push('fa-star-o');
      }
    }
    return stars;
  }

  // Mock data
  private getMockTools(): CreditTool[] {
    return [
      {
        id: 'tool-1',
        name: 'Credit Score Calculator',
        description: 'Calculate estimated credit scores based on various factors',
        category: this.categories.find(c => c.id === 'calculation')!,
        type: ToolType.CALCULATOR,
        status: ToolStatus.ACTIVE,
        icon: 'fa-calculator',
        features: ['FICO Score Estimation', 'VantageScore Calculation', 'Factor Analysis', 'Improvement Suggestions'],
        pricing: { type: 'free' },
        integrations: ['Experian', 'Equifax', 'TransUnion'],
        lastUpdated: new Date('2024-01-15'),
        usageCount: 1250,
        rating: 4.8,
        tags: ['credit-score', 'calculator', 'fico', 'vantagescore'],
        screenshots: ['/assets/tools/credit-calculator-1.png'],
        documentation: '/docs/credit-calculator',
        supportLevel: SupportLevel.STANDARD,
        createdAt: new Date('2023-06-01'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'tool-2',
        name: 'Debt-to-Income Analyzer',
        description: 'Analyze your debt-to-income ratio and get recommendations',
        category: this.categories.find(c => c.id === 'analysis')!,
        type: ToolType.ANALYZER,
        status: ToolStatus.ACTIVE,
        icon: 'fa-chart-pie',
        features: ['DTI Calculation', 'Ratio Analysis', 'Improvement Plan', 'Lender Requirements'],
        pricing: { type: 'freemium', trialDays: 14 },
        integrations: ['Bank APIs', 'Credit Reports'],
        lastUpdated: new Date('2024-01-10'),
        usageCount: 890,
        rating: 4.6,
        tags: ['debt', 'income', 'ratio', 'analysis'],
        screenshots: ['/assets/tools/dti-analyzer-1.png'],
        documentation: '/docs/dti-analyzer',
        supportLevel: SupportLevel.PREMIUM,
        createdAt: new Date('2023-07-15'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: 'tool-3',
        name: 'Credit Utilization Optimizer',
        description: 'Optimize credit card utilization for maximum score impact',
        category: this.categories.find(c => c.id === 'analysis')!,
        type: ToolType.OPTIMIZER,
        status: ToolStatus.ACTIVE,
        icon: 'fa-credit-card',
        features: ['Utilization Analysis', 'Payment Strategies', 'Score Impact Prediction', 'Balance Recommendations'],
        pricing: { type: 'paid', price: 29.99, currency: 'USD', billingCycle: 'monthly' },
        integrations: ['Credit Cards', 'Banking APIs'],
        lastUpdated: new Date('2024-01-20'),
        usageCount: 567,
        rating: 4.9,
        tags: ['utilization', 'credit-cards', 'optimization', 'score'],
        screenshots: ['/assets/tools/utilization-optimizer-1.png'],
        documentation: '/docs/utilization-optimizer',
        supportLevel: SupportLevel.PREMIUM,
        createdAt: new Date('2023-08-01'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 'tool-4',
        name: 'Dispute Letter Generator',
        description: 'Generate compliant dispute letters for credit report errors',
        category: this.categories.find(c => c.id === 'validation')!,
        type: ToolType.GENERATOR,
        status: ToolStatus.ACTIVE,
        icon: 'fa-file-alt',
        features: ['FCRA Compliance', 'Custom Templates', 'Automated Generation', 'Tracking System'],
        pricing: { type: 'subscription', price: 19.99, currency: 'USD', billingCycle: 'monthly' },
        integrations: ['Credit Reports', 'Mail Services'],
        lastUpdated: new Date('2024-01-25'),
        usageCount: 2340,
        rating: 4.7,
        tags: ['disputes', 'letters', 'fcra', 'compliance'],
        screenshots: ['/assets/tools/dispute-generator-1.png'],
        documentation: '/docs/dispute-generator',
        supportLevel: SupportLevel.ENTERPRISE,
        createdAt: new Date('2023-05-15'),
        updatedAt: new Date('2024-01-25')
      },
      {
        id: 'tool-5',
        name: 'Credit Mix Simulator',
        description: 'Simulate different credit mix scenarios and their impact',
        category: this.categories.find(c => c.id === 'simulation')!,
        type: ToolType.SIMULATOR,
        status: ToolStatus.BETA,
        icon: 'fa-project-diagram',
        features: ['Mix Analysis', 'Scenario Testing', 'Impact Prediction', 'Recommendations'],
        pricing: { type: 'free' },
        integrations: ['Credit Reports'],
        lastUpdated: new Date('2024-01-05'),
        usageCount: 234,
        rating: 4.3,
        tags: ['credit-mix', 'simulation', 'scenarios', 'beta'],
        screenshots: ['/assets/tools/credit-mix-simulator-1.png'],
        documentation: '/docs/credit-mix-simulator',
        supportLevel: SupportLevel.BASIC,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-05')
      },
      {
        id: 'tool-6',
        name: 'Payment History Tracker',
        description: 'Track and analyze payment history patterns',
        category: this.categories.find(c => c.id === 'tracking')!,
        type: ToolType.TRACKER,
        status: ToolStatus.ACTIVE,
        icon: 'fa-history',
        features: ['Payment Tracking', 'Pattern Analysis', 'Alerts', 'Reporting'],
        pricing: { type: 'freemium', trialDays: 30 },
        integrations: ['Bank APIs', 'Credit Cards'],
        lastUpdated: new Date('2024-01-18'),
        usageCount: 1456,
        rating: 4.5,
        tags: ['payments', 'history', 'tracking', 'analysis'],
        screenshots: ['/assets/tools/payment-tracker-1.png'],
        documentation: '/docs/payment-tracker',
        supportLevel: SupportLevel.STANDARD,
        createdAt: new Date('2023-09-01'),
        updatedAt: new Date('2024-01-18')
      }
    ];
  }
}