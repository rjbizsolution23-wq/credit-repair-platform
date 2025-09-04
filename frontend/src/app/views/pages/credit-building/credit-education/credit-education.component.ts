import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface EducationModule {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'credit_reports' | 'credit_scores' | 'debt_management' | 'building_credit' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  content: string;
  videoUrl?: string;
  downloadableResources: string[];
  quiz?: EducationQuiz;
  completionRate: number;
  enrolledUsers: number;
  averageRating: number;
  tags: string[];
  createdDate: Date;
  lastUpdated: Date;
  isPublished: boolean;
  prerequisites: string[];
}

export interface EducationQuiz {
  id: string;
  moduleId: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progressPercentage: number;
  timeSpent: number; // in minutes
  quizScore?: number;
  completedDate?: Date;
  lastAccessDate: Date;
  bookmarked: boolean;
}

@Component({
  selector: 'app-credit-education',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './credit-education.component.html',
  styleUrls: ['./credit-education.component.scss']
})
export class CreditEducationComponent implements OnInit {
  // State variables
  modules: EducationModule[] = [];
  userProgress: UserProgress[] = [];
  filteredModules: EducationModule[] = [];
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
    difficulty: '',
    search: '',
    status: '',
    tags: ''
  };

  // Modal states
  showModuleModal = false;
  showQuizModal = false;
  showDeleteModal = false;
  showModuleViewer = false;
  editingModule: EducationModule | null = null;
  viewingModule: EducationModule | null = null;
  deletingModule: EducationModule | null = null;

  // Forms
  moduleForm: FormGroup;
  quizForm: FormGroup;

  // View modes
  viewMode: 'grid' | 'list' = 'grid';
  selectedCategory = '';

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.moduleForm = this.createModuleForm();
    this.quizForm = this.createQuizForm();
  }

  ngOnInit(): void {
    this.loadMockData();
    this.applyFilters();
  }

  private createModuleForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      difficulty: ['', Validators.required],
      estimatedTime: [30, [Validators.required, Validators.min(1)]],
      content: ['', Validators.required],
      videoUrl: [''],
      downloadableResources: [''],
      tags: [''],
      prerequisites: ['']
    });
  }

  private createQuizForm(): FormGroup {
    return this.fb.group({
      passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      timeLimit: [15, Validators.min(1)],
      questions: this.fb.array([])
    });
  }

  private loadMockData(): void {
    this.modules = [
      {
        id: 'EDU-001',
        title: 'Credit Report Basics',
        description: 'Learn how to read and understand your credit report, including all sections and what they mean.',
        category: 'credit_reports',
        difficulty: 'beginner',
        estimatedTime: 45,
        content: 'Comprehensive guide to understanding credit reports...',
        videoUrl: 'https://example.com/video1',
        downloadableResources: ['Credit Report Sample.pdf', 'Checklist.pdf'],
        completionRate: 85,
        enrolledUsers: 1250,
        averageRating: 4.7,
        tags: ['credit report', 'basics', 'FCRA'],
        createdDate: new Date('2024-12-01'),
        lastUpdated: new Date('2025-01-15'),
        isPublished: true,
        prerequisites: [],
        quiz: {
          id: 'QUIZ-001',
          moduleId: 'EDU-001',
          questions: [
            {
              id: 'Q1',
              question: 'How often can you get a free credit report?',
              type: 'multiple_choice',
              options: ['Once per year', 'Twice per year', 'Monthly', 'Weekly'],
              correctAnswer: 'Once per year',
              explanation: 'Under FCRA, you are entitled to one free credit report per year from each bureau.',
              points: 10
            }
          ],
          passingScore: 70,
          timeLimit: 15
        }
      },
      {
        id: 'EDU-002',
        title: 'Understanding Credit Scores',
        description: 'Deep dive into credit scoring models, factors that affect your score, and how to improve it.',
        category: 'credit_scores',
        difficulty: 'intermediate',
        estimatedTime: 60,
        content: 'Detailed explanation of FICO and VantageScore models...',
        videoUrl: 'https://example.com/video2',
        downloadableResources: ['Score Factors Guide.pdf', 'Improvement Plan Template.xlsx'],
        completionRate: 78,
        enrolledUsers: 980,
        averageRating: 4.5,
        tags: ['credit score', 'FICO', 'VantageScore', 'improvement'],
        createdDate: new Date('2024-12-15'),
        lastUpdated: new Date('2025-01-10'),
        isPublished: true,
        prerequisites: ['EDU-001']
      },
      {
        id: 'EDU-003',
        title: 'Debt Management Strategies',
        description: 'Learn effective strategies for managing and paying down debt while building credit.',
        category: 'debt_management',
        difficulty: 'intermediate',
        estimatedTime: 75,
        content: 'Comprehensive debt management strategies...',
        downloadableResources: ['Debt Snowball Calculator.xlsx', 'Budget Template.pdf'],
        completionRate: 72,
        enrolledUsers: 756,
        averageRating: 4.6,
        tags: ['debt management', 'budgeting', 'payoff strategies'],
        createdDate: new Date('2025-01-01'),
        lastUpdated: new Date('2025-01-20'),
        isPublished: true,
        prerequisites: ['EDU-001', 'EDU-002']
      },
      {
        id: 'EDU-004',
        title: 'Building Credit from Scratch',
        description: 'Step-by-step guide for establishing credit history and building a strong credit profile.',
        category: 'building_credit',
        difficulty: 'beginner',
        estimatedTime: 50,
        content: 'Complete guide to building credit from zero...',
        videoUrl: 'https://example.com/video4',
        downloadableResources: ['Credit Building Checklist.pdf', 'Secured Card Comparison.xlsx'],
        completionRate: 88,
        enrolledUsers: 1450,
        averageRating: 4.8,
        tags: ['building credit', 'secured cards', 'credit history'],
        createdDate: new Date('2024-11-15'),
        lastUpdated: new Date('2025-01-05'),
        isPublished: true,
        prerequisites: []
      }
    ];

    this.userProgress = [
      {
        id: 'UP-001',
        userId: 'USER-001',
        moduleId: 'EDU-001',
        status: 'completed',
        progressPercentage: 100,
        timeSpent: 42,
        quizScore: 85,
        completedDate: new Date('2025-01-10'),
        lastAccessDate: new Date('2025-01-10'),
        bookmarked: false
      },
      {
        id: 'UP-002',
        userId: 'USER-001',
        moduleId: 'EDU-002',
        status: 'in_progress',
        progressPercentage: 65,
        timeSpent: 35,
        lastAccessDate: new Date('2025-01-20'),
        bookmarked: true
      }
    ];

    this.totalItems = this.modules.length;
    this.calculatePagination();
  }

  // Filtering and sorting
  applyFilters(): void {
    let filtered = [...this.modules];

    if (this.filters.category) {
      filtered = filtered.filter(m => m.category === this.filters.category);
    }

    if (this.filters.difficulty) {
      filtered = filtered.filter(m => m.difficulty === this.filters.difficulty);
    }

    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search) ||
        m.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (this.filters.status) {
      filtered = filtered.filter(m => {
        const progress = this.getUserProgress(m.id);
        return progress?.status === this.filters.status || 
               (this.filters.status === 'not_started' && !progress);
      });
    }

    this.filteredModules = filtered;
    this.totalItems = filtered.length;
    this.calculatePagination();
  }

  clearFilters(): void {
    this.filters = {
      category: '',
      difficulty: '',
      search: '',
      status: '',
      tags: ''
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

    this.filteredModules.sort((a, b) => {
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

  get paginatedModules(): EducationModule[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredModules.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Modal operations
  openModuleModal(module?: EducationModule): void {
    this.editingModule = module || null;
    if (module) {
      this.moduleForm.patchValue({
        ...module,
        downloadableResources: module.downloadableResources.join(', '),
        tags: module.tags.join(', '),
        prerequisites: module.prerequisites.join(', ')
      });
    } else {
      this.moduleForm.reset();
      this.moduleForm.patchValue({
        difficulty: 'beginner',
        estimatedTime: 30
      });
    }
    this.showModuleModal = true;
  }

  openModuleViewer(module: EducationModule): void {
    this.viewingModule = module;
    this.showModuleViewer = true;
  }

  closeModal(): void {
    this.showModuleModal = false;
    this.showQuizModal = false;
    this.showDeleteModal = false;
    this.showModuleViewer = false;
    this.editingModule = null;
    this.viewingModule = null;
    this.deletingModule = null;
  }

  // CRUD operations
  saveModule(): void {
    if (this.moduleForm.valid) {
      const formValue = this.moduleForm.value;
      const module: EducationModule = {
        ...formValue,
        id: this.editingModule?.id || `EDU-${Date.now()}`,
        downloadableResources: formValue.downloadableResources ? 
          formValue.downloadableResources.split(',').map((r: string) => r.trim()) : [],
        tags: formValue.tags ? 
          formValue.tags.split(',').map((t: string) => t.trim()) : [],
        prerequisites: formValue.prerequisites ? 
          formValue.prerequisites.split(',').map((p: string) => p.trim()) : [],
        completionRate: this.editingModule?.completionRate || 0,
        enrolledUsers: this.editingModule?.enrolledUsers || 0,
        averageRating: this.editingModule?.averageRating || 0,
        createdDate: this.editingModule?.createdDate || new Date(),
        lastUpdated: new Date(),
        isPublished: this.editingModule?.isPublished || false
      };

      if (this.editingModule) {
        const index = this.modules.findIndex(m => m.id === this.editingModule!.id);
        this.modules[index] = module;
      } else {
        this.modules.unshift(module);
      }

      this.applyFilters();
      this.closeModal();
    }
  }

  confirmDelete(module: EducationModule): void {
    this.deletingModule = module;
    this.showDeleteModal = true;
  }

  deleteModule(): void {
    if (this.deletingModule) {
      this.modules = this.modules.filter(m => m.id !== this.deletingModule!.id);
      this.applyFilters();
    }
    this.closeModal();
  }

  // Module actions
  togglePublished(module: EducationModule): void {
    module.isPublished = !module.isPublished;
    module.lastUpdated = new Date();
  }

  duplicateModule(module: EducationModule): void {
    const duplicate: EducationModule = {
      ...module,
      id: `EDU-${Date.now()}`,
      title: `${module.title} (Copy)`,
      createdDate: new Date(),
      lastUpdated: new Date(),
      isPublished: false,
      completionRate: 0,
      enrolledUsers: 0,
      averageRating: 0
    };
    this.modules.unshift(duplicate);
    this.applyFilters();
  }

  startModule(module: EducationModule): void {
    // Implementation for starting a module
    console.log('Starting module:', module.title);
    // Navigate to module content or update progress
  }

  bookmarkModule(module: EducationModule): void {
    const progress = this.getUserProgress(module.id);
    if (progress) {
      progress.bookmarked = !progress.bookmarked;
    } else {
      // Create new progress entry
      const newProgress: UserProgress = {
        id: `UP-${Date.now()}`,
        userId: 'USER-001', // Current user
        moduleId: module.id,
        status: 'not_started',
        progressPercentage: 0,
        timeSpent: 0,
        lastAccessDate: new Date(),
        bookmarked: true
      };
      this.userProgress.push(newProgress);
    }
  }

  // Utility methods
  getUserProgress(moduleId: string): UserProgress | undefined {
    return this.userProgress.find(p => p.moduleId === moduleId && p.userId === 'USER-001');
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'basics': 'Credit Basics',
      'credit_reports': 'Credit Reports',
      'credit_scores': 'Credit Scores',
      'debt_management': 'Debt Management',
      'building_credit': 'Building Credit',
      'advanced': 'Advanced Topics'
    };
    return labels[category] || category;
  }

  getTotalEnrolledUsers(): number {
    return this.modules.reduce((sum, m) => sum + m.enrolledUsers, 0);
  }

  getAverageCompletionRate(): number {
    return this.modules.length > 0 ? 
      (this.modules.reduce((sum, m) => sum + m.completionRate, 0) / this.modules.length) : 0;
  }

  getAverageRating(): number {
    return this.modules.length > 0 ? 
      (this.modules.reduce((sum, m) => sum + m.averageRating, 0) / this.modules.length) : 0;
  }

  getDifficultyClass(difficulty: string): string {
    const classes: { [key: string]: string } = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-yellow-600 bg-yellow-100',
      'advanced': 'text-red-600 bg-red-100'
    };
    return classes[difficulty] || 'text-gray-600 bg-gray-100';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'not_started': 'text-gray-600 bg-gray-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100'
    };
    return classes[status] || 'text-gray-600 bg-gray-100';
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  generateStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }

  exportProgress(): void {
    // Implementation for exporting user progress
    console.log('Exporting progress data...');
  }

  generateCertificate(moduleId: string): void {
    // Implementation for generating completion certificate
    console.log('Generating certificate for module:', moduleId);
  }

  // Helper method for template calculations
  getDisplayedItemsCount(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}