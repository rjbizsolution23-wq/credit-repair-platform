import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaces
export interface CreditReport {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  status: ReportStatus;
  createdDate: Date;
  lastGenerated: Date;
  parameters: ReportParameters;
  schedule?: ReportSchedule;
  recipients: string[];
  format: ReportFormat[];
  size: number; // in KB
  downloadUrl?: string;
  isAutomated: boolean;
  tags: string[];
  metadata: ReportMetadata;
}

export interface ReportParameters {
  dateRange: {
    start: Date;
    end: Date;
  };
  clientIds?: string[];
  includeCharts: boolean;
  includeDetails: boolean;
  groupBy?: string;
  filters: { [key: string]: any };
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  timezone: string;
  isActive: boolean;
  nextRun: Date;
}

export interface ReportMetadata {
  generationTime: number; // in seconds
  recordCount: number;
  fileSize: string;
  version: string;
  author: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  defaultParameters: ReportParameters;
  isCustomizable: boolean;
  previewUrl?: string;
}

// Enums
export enum ReportType {
  CREDIT_ANALYSIS = 'credit_analysis',
  DISPUTE_SUMMARY = 'dispute_summary',
  PROGRESS_TRACKING = 'progress_tracking',
  CLIENT_OVERVIEW = 'client_overview',
  FINANCIAL_SUMMARY = 'financial_summary',
  COMPLIANCE_AUDIT = 'compliance_audit',
  PERFORMANCE_METRICS = 'performance_metrics',
  CUSTOM = 'custom'
}

export enum ReportStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html'
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  // Enums for template
  ReportType = ReportType;
  ReportStatus = ReportStatus;
  ReportFormat = ReportFormat;
  Math = Math;

  // State variables
  reports: CreditReport[] = [];
  filteredReports: CreditReport[] = [];
  categories: ReportCategory[] = [];
  templates: ReportTemplate[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;
  totalPages = 0;

  // Filters and search
  searchTerm = '';
  selectedCategory = '';
  selectedType = '';
  selectedStatus = '';
  selectedFormat = '';
  dateRange = {
    start: '',
    end: ''
  };

  // Sorting
  sortBy = 'createdDate';
  sortOrder: 'asc' | 'desc' = 'desc';

  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  // Modal states
  showReportModal = false;
  showTemplateModal = false;
  showScheduleModal = false;
  modalMode: 'view' | 'create' | 'edit' = 'view';
  selectedReport: CreditReport | null = null;
  selectedTemplate: ReportTemplate | null = null;

  // Forms
  reportForm: Partial<CreditReport> = {
    title: '',
    description: '',
    type: ReportType.CREDIT_ANALYSIS,
    status: ReportStatus.DRAFT,
    parameters: {
      dateRange: {
        start: new Date(),
        end: new Date()
      },
      includeCharts: true,
      includeDetails: true,
      filters: {}
    },
    recipients: [],
    format: [ReportFormat.PDF],
    isAutomated: false,
    tags: []
  };

  scheduleForm: Partial<ReportSchedule> = {
    frequency: 'monthly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    timezone: 'America/Chicago',
    isActive: true
  };

  // Stats
  stats = {
    totalReports: 0,
    completedReports: 0,
    scheduledReports: 0,
    totalSize: 0
  };

  constructor() {}

  ngOnInit(): void {
    this.loadReports();
    this.loadCategories();
    this.loadTemplates();
    this.calculateStats();
  }

  // Data loading methods
  loadReports(): void {
    this.loading = true;
    this.error = null;

    // Simulate API call
    setTimeout(() => {
      this.reports = this.getMockReports();
      this.applyFilters();
      this.loading = false;
    }, 1000);
  }

  loadCategories(): void {
    this.categories = [
      {
        id: 'credit',
        name: 'Credit Analysis',
        description: 'Credit score and report analysis',
        color: '#14B8A6',
        icon: 'fa-chart-line'
      },
      {
        id: 'disputes',
        name: 'Dispute Management',
        description: 'Dispute tracking and outcomes',
        color: '#059669',
        icon: 'fa-gavel'
      },
      {
        id: 'progress',
        name: 'Progress Tracking',
        description: 'Client progress and milestones',
        color: '#0F766E',
        icon: 'fa-chart-bar'
      },
      {
        id: 'financial',
        name: 'Financial Summary',
        description: 'Financial health and metrics',
        color: '#1E3A8A',
        icon: 'fa-dollar-sign'
      },
      {
        id: 'compliance',
        name: 'Compliance',
        description: 'Regulatory compliance reports',
        color: '#DC2626',
        icon: 'fa-shield-alt'
      }
    ];
  }

  loadTemplates(): void {
    this.templates = [
      {
        id: 'template-1',
        name: 'Monthly Credit Analysis',
        description: 'Comprehensive monthly credit report with trends and recommendations',
        type: ReportType.CREDIT_ANALYSIS,
        category: this.categories[0],
        defaultParameters: {
          dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            end: new Date(new Date().getFullYear(), new Date().getMonth(), 0)
          },
          includeCharts: true,
          includeDetails: true,
          filters: {}
        },
        isCustomizable: true
      },
      {
        id: 'template-2',
        name: 'Dispute Progress Report',
        description: 'Track dispute status and outcomes across all clients',
        type: ReportType.DISPUTE_SUMMARY,
        category: this.categories[1],
        defaultParameters: {
          dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            end: new Date()
          },
          includeCharts: true,
          includeDetails: false,
          filters: { status: 'active' }
        },
        isCustomizable: true
      }
    ];
  }

  calculateStats(): void {
    this.stats = {
      totalReports: this.reports.length,
      completedReports: this.reports.filter(r => r.status === ReportStatus.COMPLETED).length,
      scheduledReports: this.reports.filter(r => r.isAutomated && r.schedule?.isActive).length,
      totalSize: this.reports.reduce((sum, r) => sum + r.size, 0)
    };
  }

  // Filter and search methods
  applyFilters(): void {
    let filtered = [...this.reports];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term) ||
        report.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(report => report.category.id === this.selectedCategory);
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(report => report.type === this.selectedType);
    }

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(report => report.status === this.selectedStatus);
    }

    // Format filter
    if (this.selectedFormat) {
      filtered = filtered.filter(report => report.format.includes(this.selectedFormat as ReportFormat));
    }

    // Date range filter
    if (this.dateRange.start && this.dateRange.end) {
      const startDate = new Date(this.dateRange.start);
      const endDate = new Date(this.dateRange.end);
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdDate);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[this.sortBy as keyof CreditReport];
      let bValue = b[this.sortBy as keyof CreditReport];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return this.sortOrder === 'asc' ? 1 : -1;
      if (bValue === undefined) return this.sortOrder === 'asc' ? -1 : 1;

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredReports = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.selectedFormat = '';
    this.dateRange = { start: '', end: '' };
    this.currentPage = 1;
    this.applyFilters();
  }

  // Pagination methods
  getPaginatedReports(): CreditReport[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredReports.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Modal methods
  openReportModal(report?: CreditReport, mode: 'view' | 'create' | 'edit' = 'view'): void {
    this.selectedReport = report || null;
    this.modalMode = mode;
    
    if (mode === 'create') {
      this.resetReportForm();
    } else if (mode === 'edit' && report) {
      this.reportForm = { ...report };
    }
    
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.selectedReport = null;
    this.resetReportForm();
  }

  openTemplateModal(): void {
    this.showTemplateModal = true;
  }

  closeTemplateModal(): void {
    this.showTemplateModal = false;
    this.selectedTemplate = null;
  }

  openScheduleModal(report: CreditReport): void {
    this.selectedReport = report;
    if (report.schedule) {
      this.scheduleForm = { ...report.schedule };
    }
    this.showScheduleModal = true;
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.selectedReport = null;
  }

  // Form methods
  resetReportForm(): void {
    this.reportForm = {
      title: '',
      description: '',
      type: ReportType.CREDIT_ANALYSIS,
      status: ReportStatus.DRAFT,
      parameters: {
        dateRange: {
          start: new Date(),
          end: new Date()
        },
        includeCharts: true,
        includeDetails: true,
        filters: {}
      },
      recipients: [],
      format: [ReportFormat.PDF],
      isAutomated: false,
      tags: []
    };
  }

  saveReport(): void {
    if (this.modalMode === 'create') {
      // Create new report logic
      console.log('Creating report:', this.reportForm);
    } else if (this.modalMode === 'edit') {
      // Update existing report logic
      console.log('Updating report:', this.reportForm);
    }
    this.closeReportModal();
    this.loadReports();
  }

  saveSchedule(): void {
    console.log('Saving schedule:', this.scheduleForm);
    this.closeScheduleModal();
    this.loadReports();
  }

  // Action methods
  generateReport(report: CreditReport): void {
    console.log('Generating report:', report.id);
    // Update report status to generating
    report.status = ReportStatus.GENERATING;
  }

  downloadReport(report: CreditReport): void {
    console.log('Downloading report:', report.id);
    // Implement download logic
  }

  duplicateReport(report: CreditReport): void {
    console.log('Duplicating report:', report.id);
    this.reportForm = { ...report, title: `${report.title} (Copy)` };
    this.openReportModal(undefined, 'create');
  }

  deleteReport(report: CreditReport): void {
    if (confirm(`Are you sure you want to delete "${report.title}"?`)) {
      console.log('Deleting report:', report.id);
      this.loadReports();
    }
  }

  useTemplate(template: ReportTemplate): void {
    this.reportForm = {
      title: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      status: ReportStatus.DRAFT,
      parameters: { ...template.defaultParameters },
      recipients: [],
      format: [ReportFormat.PDF],
      isAutomated: false,
      tags: []
    };
    this.closeTemplateModal();
    this.openReportModal(undefined, 'create');
  }

  // Utility methods
  getStatusClass(status: ReportStatus): string {
    const statusClasses = {
      [ReportStatus.DRAFT]: 'draft',
      [ReportStatus.GENERATING]: 'generating',
      [ReportStatus.COMPLETED]: 'completed',
      [ReportStatus.FAILED]: 'failed',
      [ReportStatus.SCHEDULED]: 'scheduled',
      [ReportStatus.ARCHIVED]: 'archived'
    };
    return statusClasses[status] || 'draft';
  }

  getFormatIcon(format: ReportFormat): string {
    const formatIcons = {
      [ReportFormat.PDF]: 'fa-file-pdf',
      [ReportFormat.EXCEL]: 'fa-file-excel',
      [ReportFormat.CSV]: 'fa-file-csv',
      [ReportFormat.JSON]: 'fa-file-code',
      [ReportFormat.HTML]: 'fa-file-alt'
    };
    return formatIcons[format] || 'fa-file';
  }

  formatFileSize(sizeInKB: number): string {
    if (sizeInKB < 1024) {
      return `${sizeInKB} KB`;
    } else if (sizeInKB < 1024 * 1024) {
      return `${(sizeInKB / 1024).toFixed(1)} MB`;
    } else {
      return `${(sizeInKB / (1024 * 1024)).toFixed(1)} GB`;
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Mock data
  private getMockReports(): CreditReport[] {
    return [
      {
        id: 'report-1',
        title: 'Monthly Credit Analysis - January 2024',
        description: 'Comprehensive credit analysis for all active clients',
        type: ReportType.CREDIT_ANALYSIS,
        category: this.categories[0],
        status: ReportStatus.COMPLETED,
        createdDate: new Date('2024-01-31'),
        lastGenerated: new Date('2024-01-31T09:00:00'),
        parameters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          },
          includeCharts: true,
          includeDetails: true,
          filters: {}
        },
        recipients: ['manager@rickjeffersonsolutions.com'],
        format: [ReportFormat.PDF, ReportFormat.EXCEL],
        size: 2048,
        downloadUrl: '/reports/monthly-credit-jan-2024.pdf',
        isAutomated: true,
        tags: ['monthly', 'credit', 'analysis'],
        metadata: {
          generationTime: 45,
          recordCount: 150,
          fileSize: '2.0 MB',
          version: '1.0',
          author: 'System'
        },
        schedule: {
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '09:00',
          timezone: 'America/Chicago',
          isActive: true,
          nextRun: new Date('2024-02-01T09:00:00')
        }
      },
      {
        id: 'report-2',
        title: 'Dispute Progress Summary',
        description: 'Weekly summary of dispute activities and outcomes',
        type: ReportType.DISPUTE_SUMMARY,
        category: this.categories[1],
        status: ReportStatus.GENERATING,
        createdDate: new Date('2024-01-29'),
        lastGenerated: new Date('2024-01-29T10:30:00'),
        parameters: {
          dateRange: {
            start: new Date('2024-01-22'),
            end: new Date('2024-01-29')
          },
          includeCharts: false,
          includeDetails: true,
          filters: { status: 'active' }
        },
        recipients: ['disputes@rickjeffersonsolutions.com'],
        format: [ReportFormat.PDF],
        size: 512,
        isAutomated: true,
        tags: ['weekly', 'disputes', 'progress'],
        metadata: {
          generationTime: 15,
          recordCount: 45,
          fileSize: '512 KB',
          version: '1.0',
          author: 'System'
        },
        schedule: {
          frequency: 'weekly',
          dayOfWeek: 1,
          time: '10:30',
          timezone: 'America/Chicago',
          isActive: true,
          nextRun: new Date('2024-02-05T10:30:00')
        }
      },
      {
        id: 'report-3',
        title: 'Client Progress Dashboard',
        description: 'Individual client progress tracking and milestones',
        type: ReportType.PROGRESS_TRACKING,
        category: this.categories[2],
        status: ReportStatus.COMPLETED,
        createdDate: new Date('2024-01-28'),
        lastGenerated: new Date('2024-01-28T14:15:00'),
        parameters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-28')
          },
          clientIds: ['client-123', 'client-456'],
          includeCharts: true,
          includeDetails: true,
          filters: {}
        },
        recipients: ['info@rickjeffersonsolutions.com'],
        format: [ReportFormat.PDF, ReportFormat.HTML],
        size: 1536,
        downloadUrl: '/reports/client-progress-jan-2024.pdf',
        isAutomated: false,
        tags: ['client', 'progress', 'tracking'],
        metadata: {
          generationTime: 30,
          recordCount: 75,
          fileSize: '1.5 MB',
          version: '1.0',
          author: 'Rick Jefferson'
        }
      }
    ];
  }
}