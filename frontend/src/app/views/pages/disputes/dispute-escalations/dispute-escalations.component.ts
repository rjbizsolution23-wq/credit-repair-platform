import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { DisputesService } from '../disputes.service';

interface EscalationItem {
  id: string;
  disputeId: string;
  disputeReference: string;
  clientId: string;
  clientName: string;
  creditorName: string;
  accountNumber: string;
  originalDispute: {
    type: string;
    reason: string;
    submittedDate: Date;
    creditBureau: string;
  };
  escalation: {
    level: 'supervisor' | 'manager' | 'legal' | 'regulatory';
    reason: string;
    escalatedDate: Date;
    escalatedBy: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string;
    dueDate: Date;
    notes: string;
  };
  timeline: {
    date: Date;
    action: string;
    user: string;
    details: string;
  }[];
  attachments: {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }[];
  resolution?: {
    outcome: 'resolved' | 'escalated_further' | 'legal_action' | 'closed';
    resolvedDate: Date;
    resolvedBy: string;
    resolution: string;
    followUpRequired: boolean;
    followUpDate?: Date;
  };
}

@Component({
  selector: 'app-dispute-escalations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dispute-escalations.component.html',
  styleUrls: ['./dispute-escalations.component.scss']
})
export class DisputeEscalationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  escalations: EscalationItem[] = [];
  filteredEscalations: EscalationItem[] = [];
  selectedEscalation: EscalationItem | null = null;
  selectedEscalations: string[] = [];
  
  // UI State
  loading = false;
  error: string | null = null;
  activeView: 'list' | 'detail' = 'list';
  showFilters = false;
  showBulkActions = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  
  // Forms
  filtersForm: FormGroup;
  escalationForm: FormGroup;
  
  // Filter Options
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];
  
  priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  levelOptions = [
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'manager', label: 'Manager' },
    { value: 'legal', label: 'Legal Department' },
    { value: 'regulatory', label: 'Regulatory Body' }
  ];
  
  creditBureauOptions = [
    { value: 'experian', label: 'Experian' },
    { value: 'equifax', label: 'Equifax' },
    { value: 'transunion', label: 'TransUnion' }
  ];
  
  datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];
  
  outcomeOptions = [
    { value: 'resolved', label: 'Resolved' },
    { value: 'escalated_further', label: 'Escalated Further' },
    { value: 'legal_action', label: 'Legal Action Required' },
    { value: 'closed', label: 'Closed' }
  ];

  constructor(
    private fb: FormBuilder,
    private disputesService: DisputesService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadEscalations();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      search: [''],
      dateRange: this.fb.group({
        preset: ['last_30_days'],
        start: [''],
        end: ['']
      }),
      status: [[]],
      priority: [[]],
      level: [[]],
      creditBureau: [[]],
      assignedTo: ['']
    });
    
    this.escalationForm = this.fb.group({
      level: [''],
      priority: [''],
      status: [''],
      assignedTo: [''],
      dueDate: [''],
      notes: [''],
      resolution: this.fb.group({
        outcome: [''],
        resolution: [''],
        followUpRequired: [false],
        followUpDate: ['']
      })
    });
  }

  private setupFormSubscriptions(): void {
    // Search filter
    this.filtersForm.get('search')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
    
    // Other filters
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  loadEscalations(): void {
    this.loading = true;
    this.error = null;
    
    // Simulate API call
    setTimeout(() => {
      try {
        this.escalations = this.generateMockEscalations();
        this.applyFilters();
        this.loading = false;
      } catch (error) {
        this.error = 'Failed to load escalations. Please try again.';
        this.loading = false;
      }
    }, 1000);
  }

  private generateMockEscalations(): EscalationItem[] {
    const escalations: EscalationItem[] = [];
    const levels = ['supervisor', 'manager', 'legal', 'regulatory'] as const;
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    const statuses = ['pending', 'in_progress', 'resolved', 'closed'] as const;
    const bureaus = ['experian', 'equifax', 'transunion'];
    const reasons = [
      'No response from credit bureau',
      'Inadequate investigation',
      'Dispute rejected without proper review',
      'Failure to remove verified inaccurate information',
      'Violation of FCRA procedures'
    ];
    
    for (let i = 1; i <= 50; i++) {
      const escalatedDate = new Date();
      escalatedDate.setDate(escalatedDate.getDate() - Math.floor(Math.random() * 90));
      
      const dueDate = new Date(escalatedDate);
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 7);
      
      escalations.push({
        id: `esc-${i.toString().padStart(3, '0')}`,
        disputeId: `disp-${i.toString().padStart(3, '0')}`,
        disputeReference: `DR${(1000 + i).toString()}`,
        clientId: `client-${Math.floor(Math.random() * 100) + 1}`,
        clientName: `Client ${i}`,
        creditorName: `Creditor ${Math.floor(Math.random() * 20) + 1}`,
        accountNumber: `****${Math.floor(Math.random() * 9000) + 1000}`,
        originalDispute: {
          type: ['Inaccurate Information', 'Identity Theft', 'Paid Account', 'Duplicate Account'][Math.floor(Math.random() * 4)],
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          submittedDate: new Date(escalatedDate.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          creditBureau: bureaus[Math.floor(Math.random() * bureaus.length)]
        },
        escalation: {
          level: levels[Math.floor(Math.random() * levels.length)],
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          escalatedDate,
          escalatedBy: `User ${Math.floor(Math.random() * 10) + 1}`,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          assignedTo: Math.random() > 0.3 ? `Specialist ${Math.floor(Math.random() * 5) + 1}` : undefined,
          dueDate,
          notes: `Escalation notes for dispute ${i}. Requires immediate attention due to regulatory compliance issues.`
        },
        timeline: this.generateTimeline(escalatedDate),
        attachments: this.generateAttachments(),
        resolution: Math.random() > 0.6 ? {
          outcome: ['resolved', 'escalated_further', 'legal_action', 'closed'][Math.floor(Math.random() * 4)] as any,
          resolvedDate: new Date(),
          resolvedBy: `Specialist ${Math.floor(Math.random() * 5) + 1}`,
          resolution: 'Escalation resolved through direct communication with credit bureau supervisor.',
          followUpRequired: Math.random() > 0.5,
          followUpDate: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined
        } : undefined
      });
    }
    
    return escalations;
  }

  private generateTimeline(startDate: Date): any[] {
    const timeline = [];
    const actions = [
      'Escalation created',
      'Assigned to specialist',
      'Contact attempted',
      'Documentation reviewed',
      'Follow-up scheduled',
      'Status updated'
    ];
    
    for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * Math.floor(Math.random() * 3) + 1);
      
      timeline.push({
        date,
        action: actions[Math.floor(Math.random() * actions.length)],
        user: `User ${Math.floor(Math.random() * 10) + 1}`,
        details: `Timeline entry ${i + 1} details`
      });
    }
    
    return timeline;
  }

  private generateAttachments(): any[] {
    const attachments = [];
    const fileTypes = ['pdf', 'doc', 'jpg', 'png'];
    const fileNames = [
      'escalation_letter',
      'bureau_response',
      'supporting_documentation',
      'legal_notice',
      'compliance_report'
    ];
    
    for (let i = 0; i < Math.floor(Math.random() * 3); i++) {
      const type = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      const name = fileNames[Math.floor(Math.random() * fileNames.length)];
      
      attachments.push({
        id: `att-${Date.now()}-${i}`,
        name: `${name}.${type}`,
        type,
        size: Math.floor(Math.random() * 1000000) + 50000,
        uploadedAt: new Date(),
        uploadedBy: `User ${Math.floor(Math.random() * 10) + 1}`
      });
    }
    
    return attachments;
  }

  applyFilters(): void {
    let filtered = [...this.escalations];
    const filters = this.filtersForm.value;
    
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(escalation =>
        escalation.disputeReference.toLowerCase().includes(searchTerm) ||
        escalation.clientName.toLowerCase().includes(searchTerm) ||
        escalation.creditorName.toLowerCase().includes(searchTerm) ||
        escalation.escalation.reason.toLowerCase().includes(searchTerm)
      );
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(escalation =>
        filters.status.includes(escalation.escalation.status)
      );
    }
    
    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(escalation =>
        filters.priority.includes(escalation.escalation.priority)
      );
    }
    
    // Level filter
    if (filters.level && filters.level.length > 0) {
      filtered = filtered.filter(escalation =>
        filters.level.includes(escalation.escalation.level)
      );
    }
    
    // Credit Bureau filter
    if (filters.creditBureau && filters.creditBureau.length > 0) {
      filtered = filtered.filter(escalation =>
        filters.creditBureau.includes(escalation.originalDispute.creditBureau)
      );
    }
    
    // Assigned To filter
    if (filters.assignedTo) {
      const assignedTo = filters.assignedTo.toLowerCase();
      filtered = filtered.filter(escalation =>
        escalation.escalation.assignedTo?.toLowerCase().includes(assignedTo)
      );
    }
    
    // Date range filter
    if (filters.dateRange.preset !== 'custom') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange.preset) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case 'last_7_days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_30_days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last_90_days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(escalation =>
        escalation.escalation.escalatedDate >= startDate
      );
    } else if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(escalation =>
        escalation.escalation.escalatedDate >= startDate &&
        escalation.escalation.escalatedDate <= endDate
      );
    }
    
    this.filteredEscalations = filtered;
    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = 1;
  }

  // Filter Methods
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filtersForm.reset({
      search: '',
      dateRange: {
        preset: 'last_30_days',
        start: '',
        end: ''
      },
      status: [],
      priority: [],
      level: [],
      creditBureau: [],
      assignedTo: ''
    });
  }

  onStatusChange(status: string, checked: boolean): void {
    const statusArray = this.filtersForm.get('status')?.value || [];
    if (checked) {
      statusArray.push(status);
    } else {
      const index = statusArray.indexOf(status);
      if (index > -1) {
        statusArray.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ status: statusArray });
  }

  onPriorityChange(priority: string, checked: boolean): void {
    const priorityArray = this.filtersForm.get('priority')?.value || [];
    if (checked) {
      priorityArray.push(priority);
    } else {
      const index = priorityArray.indexOf(priority);
      if (index > -1) {
        priorityArray.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ priority: priorityArray });
  }

  onLevelChange(level: string, checked: boolean): void {
    const levelArray = this.filtersForm.get('level')?.value || [];
    if (checked) {
      levelArray.push(level);
    } else {
      const index = levelArray.indexOf(level);
      if (index > -1) {
        levelArray.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ level: levelArray });
  }

  onCreditBureauChange(bureau: string, checked: boolean): void {
    const bureauArray = this.filtersForm.get('creditBureau')?.value || [];
    if (checked) {
      bureauArray.push(bureau);
    } else {
      const index = bureauArray.indexOf(bureau);
      if (index > -1) {
        bureauArray.splice(index, 1);
      }
    }
    this.filtersForm.patchValue({ creditBureau: bureauArray });
  }

  // Selection Methods
  isEscalationSelected(id: string): boolean {
    return this.selectedEscalations.includes(id);
  }

  toggleEscalationSelection(id: string): void {
    const index = this.selectedEscalations.indexOf(id);
    if (index > -1) {
      this.selectedEscalations.splice(index, 1);
    } else {
      this.selectedEscalations.push(id);
    }
    this.showBulkActions = this.selectedEscalations.length > 0;
  }

  selectAllEscalations(): void {
    if (this.selectedEscalations.length === this.filteredEscalations.length) {
      this.selectedEscalations = [];
      this.showBulkActions = false;
    } else {
      this.selectedEscalations = this.filteredEscalations.map(e => e.id);
      this.showBulkActions = true;
    }
  }

  // Bulk Actions
  bulkUpdateStatus(status: string): void {
    console.log('Bulk update status:', status, this.selectedEscalations);
    // Implement bulk status update
    this.selectedEscalations = [];
    this.showBulkActions = false;
  }

  bulkAssign(assignee: string): void {
    console.log('Bulk assign:', assignee, this.selectedEscalations);
    // Implement bulk assignment
    this.selectedEscalations = [];
    this.showBulkActions = false;
  }

  // View Methods
  viewEscalation(escalation: EscalationItem): void {
    this.selectedEscalation = escalation;
    this.escalationForm.patchValue({
      level: escalation.escalation.level,
      priority: escalation.escalation.priority,
      status: escalation.escalation.status,
      assignedTo: escalation.escalation.assignedTo || '',
      dueDate: this.formatDateForInput(escalation.escalation.dueDate),
      notes: escalation.escalation.notes,
      resolution: {
        outcome: escalation.resolution?.outcome || '',
        resolution: escalation.resolution?.resolution || '',
        followUpRequired: escalation.resolution?.followUpRequired || false,
        followUpDate: escalation.resolution?.followUpDate ? this.formatDateForInput(escalation.resolution.followUpDate) : ''
      }
    });
    this.activeView = 'detail';
  }

  backToList(): void {
    this.activeView = 'list';
    this.selectedEscalation = null;
  }

  editEscalation(escalation: EscalationItem): void {
    this.viewEscalation(escalation);
  }

  // Action Methods
  saveEscalation(): void {
    if (this.escalationForm.valid && this.selectedEscalation) {
      const formValue = this.escalationForm.value;
      console.log('Save escalation:', formValue);
      // Implement save logic
    }
  }

  resolveEscalation(escalation: EscalationItem): void {
    console.log('Resolve escalation:', escalation.id);
    // Implement resolve logic
  }

  escalateFurther(escalation: EscalationItem): void {
    console.log('Escalate further:', escalation.id);
    // Implement further escalation logic
  }

  // Navigation Methods
  goToDispute(disputeId: string): void {
    this.router.navigate(['/disputes/view', disputeId]);
  }

  goToClient(clientId: string): void {
    this.router.navigate(['/clients/view', clientId]);
  }

  // Pagination
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Utility Methods
  refresh(): void {
    this.loadEscalations();
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-warning',
      'in_progress': 'bg-info',
      'resolved': 'bg-success',
      'closed': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'low': 'bg-success',
      'medium': 'bg-warning',
      'high': 'bg-danger',
      'urgent': 'bg-danger'
    };
    return classes[priority] || 'bg-secondary';
  }

  getLevelBadgeClass(level: string): string {
    const classes: { [key: string]: string } = {
      'supervisor': 'bg-info',
      'manager': 'bg-warning',
      'legal': 'bg-danger',
      'regulatory': 'bg-dark'
    };
    return classes[level] || 'bg-secondary';
  }

  getOutcomeBadgeClass(outcome: string): string {
    const classes: { [key: string]: string } = {
      'resolved': 'bg-success',
      'escalated_further': 'bg-warning',
      'legal_action': 'bg-danger',
      'closed': 'bg-secondary'
    };
    return classes[outcome] || 'bg-secondary';
  }

  downloadAttachment(attachment: any): void {
    console.log('Download attachment:', attachment.name);
    // Implement download logic
  }
}