import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EnforcementService } from '../enforcement.service';
import { EnforcementAction, ActionType, AlertPriority, ActionStatus, ActionComment } from '../enforcement.model';

@Component({
  selector: 'app-view-action',
  standalone: true,
  imports: [CommonModule, NgbModule, ReactiveFormsModule],
  templateUrl: './view-action.component.html',
  styleUrls: ['./view-action.component.scss']
})
export class ViewActionComponent implements OnInit {
  // State variables
  action: EnforcementAction | null = null;
  loading = false;
  error: string | null = null;
  actionId: string | null = null;
  
  // Edit mode
  isEditing = false;
  editForm: FormGroup;
  
  // Comments
  comments: ActionComment[] = [];
  commentForm: FormGroup;
  addingComment = false;
  
  // Enums for template
  ActionType = ActionType;
  AlertPriority = AlertPriority;
  ActionStatus = ActionStatus;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private enforcementService: EnforcementService
  ) {
    this.editForm = this.createEditForm();
    this.commentForm = this.createCommentForm();
  }
  
  ngOnInit(): void {
    this.actionId = this.route.snapshot.paramMap.get('id');
    if (this.actionId) {
      this.loadAction();
      this.loadComments();
    } else {
      this.error = 'Action ID not provided';
    }
  }
  
  private createEditForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      type: ['', Validators.required],
      priority: ['', Validators.required],
      status: ['', Validators.required],
      assignedTo: [''],
      dueDate: [''],
      estimatedHours: ['', [Validators.min(0), Validators.max(1000)]],
      relatedViolationId: [''],
      tags: [[]]
    });
  }
  
  private createCommentForm(): FormGroup {
    return this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }
  
  loadAction(): void {
    if (!this.actionId) return;
    
    this.loading = true;
    this.error = null;
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Mock data - replace with actual service call
        this.action = {
          id: this.actionId!,
          title: 'Investigate Credit Report Discrepancy',
          description: 'Client reported unauthorized account on credit report. Need to investigate and initiate dispute process.',
          type: ActionType.INVESTIGATION,
          priority: AlertPriority.HIGH,
          status: ActionStatus.IN_PROGRESS,
          assignedTo: 'John Smith',
          assignedBy: 'Admin User',
          assignedAt: new Date('2024-01-15T10:00:00Z'),
          createdBy: 'Admin User',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-16T14:30:00Z'),
          dueDate: new Date('2024-01-20T17:00:00Z'),
          estimatedCost: 8,
          actualCost: 4,
          violationId: 'violation-456',
          tags: ['credit-report', 'dispute', 'unauthorized'],
          requirements: [
            {
              id: 'req-1',
              description: 'Gather documentation',
              completed: false
            },
            {
              id: 'req-2',
              description: 'Contact credit bureau',
              completed: false
            }
          ],
          dependencies: [],
          attachments: [
            {
              id: 'att-1',
              name: 'credit_report.pdf',
              url: '/api/files/credit_report.pdf',
              size: 2048576,
              type: 'application/pdf',
              uploadedAt: new Date('2024-01-15T10:30:00Z'),
              uploadedBy: 'Rick Jefferson'
            }
          ],
          progress: [
            {
              id: 'progress-1',
              date: new Date('2024-01-15T10:00:00Z'),
              description: 'Investigation started',
              percentage: 25,
              updatedBy: 'John Smith'
            },
            {
              id: 'progress-2',
              date: new Date('2024-01-16T14:30:00Z'),
              description: 'Credit bureau contacted',
              percentage: 50,
              updatedBy: 'John Smith'
            }
          ],

        };
        
        // Populate edit form
        this.editForm.patchValue({
          title: this.action?.title || '',
          description: this.action?.description || '',
          type: this.action?.type || '',
          priority: this.action?.priority || '',
          status: this.action?.status || '',
          assignedTo: this.action?.assignedTo || '',
          dueDate: this.action?.dueDate ? this.formatDateForInput(this.action.dueDate) : '',
          estimatedCost: this.action?.estimatedCost || 0,
          relatedViolationId: this.action?.violationId || '',
          tags: this.action?.tags || []
        });
        
        this.loading = false;
      } catch (error) {
        this.error = 'Failed to load action details';
        this.loading = false;
      }
    }, 1000);
  }
  
  loadComments(): void {
    if (!this.actionId) return;
    
    // Simulate API call
    setTimeout(() => {
      this.comments = [
        {
          id: 'comment-1',
          actionId: this.actionId!,
          content: 'Started investigation. Contacted credit bureau for additional information.',
          authorId: 'user-123',
          authorName: 'John Smith',
          createdAt: new Date('2024-01-15T11:00:00Z'),
          updatedAt: new Date('2024-01-15T11:00:00Z')
        },
        {
          id: 'comment-2',
          actionId: this.actionId!,
          content: 'Received response from Experian. Account appears to be fraudulent.',
          authorId: 'user-123',
          authorName: 'John Smith',
          createdAt: new Date('2024-01-16T09:30:00Z'),
          updatedAt: new Date('2024-01-16T09:30:00Z')
        }
      ];
    }, 500);
  }
  
  onEdit(): void {
    this.isEditing = true;
  }
  
  onCancelEdit(): void {
    this.isEditing = false;
    if (this.action) {
      this.editForm.patchValue({
        title: this.action?.title || '',
        description: this.action?.description || '',
        type: this.action?.type || '',
        priority: this.action?.priority || '',
        status: this.action?.status || '',
        assignedTo: this.action?.assignedTo || '',
        dueDate: this.action?.dueDate ? this.formatDateForInput(this.action.dueDate) : '',
        estimatedCost: this.action?.estimatedCost || 0,
         relatedViolationId: this.action?.violationId || '',
        tags: this.action?.tags || []
      });
    }
  }
  
  onSaveEdit(): void {
    if (this.editForm.valid && this.action) {
      this.loading = true;
      
      const formData = this.editForm.value;
      const updatedAction: Partial<EnforcementAction> = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        updatedAt: new Date()
      };
      
      // Simulate API call
      setTimeout(() => {
        if (this.action) {
          Object.assign(this.action, updatedAction);
          this.isEditing = false;
          this.loading = false;
        }
      }, 1000);
    }
  }
  
  onAddComment(): void {
    if (this.commentForm.valid && this.actionId) {
      this.addingComment = true;
      
      const newComment: ActionComment = {
        id: `comment-${Date.now()}`,
        actionId: this.actionId,
        content: this.commentForm.value.content,
        authorId: 'current-user',
        authorName: 'Current User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Simulate API call
      setTimeout(() => {
        this.comments.unshift(newComment);
        this.commentForm.reset();
        this.addingComment = false;
      }, 500);
    }
  }
  
  onDeleteAction(): void {
    if (confirm('Are you sure you want to delete this action? This action cannot be undone.')) {
      this.loading = true;
      
      // Simulate API call
      setTimeout(() => {
        this.router.navigate(['/enforcement/actions']);
      }, 1000);
    }
  }
  
  onBack(): void {
    this.router.navigate(['/enforcement/actions']);
  }
  
  onViewViolation(): void {
    if (this.action?.violationId) {
       this.router.navigate(['/enforcement/violations', this.action.violationId]);
    }
  }
  
  onDownloadAttachment(attachment: any): void {
    // Simulate file download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  }
  
  // Utility methods
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  getStatusClass(status: ActionStatus): string {
    switch (status) {
      case ActionStatus.PLANNED:
        return 'status-pending';
      case ActionStatus.IN_PROGRESS:
        return 'status-in-progress';
      case ActionStatus.COMPLETED:
        return 'status-completed';
      case ActionStatus.CANCELLED:
        return 'status-cancelled';
      case ActionStatus.OVERDUE:
        return 'status-overdue';
      case ActionStatus.ON_HOLD:
        return 'status-on-hold';
      default:
        return 'status-pending';
    }
  }
  
  getPriorityClass(priority: AlertPriority): string {
    switch (priority) {
      case AlertPriority.LOW:
        return 'priority-low';
      case AlertPriority.MEDIUM:
        return 'priority-medium';
      case AlertPriority.HIGH:
        return 'priority-high';
      case AlertPriority.URGENT:
        return 'priority-urgent';
      default:
        return 'priority-medium';
    }
  }
  
  getProgressColor(): string {
    if (!this.action) return '#e5e7eb';
    
    const progressArray = this.action.progress || [];
    const latestProgress = progressArray.length > 0 ? progressArray[progressArray.length - 1].percentage : 0;
    if (latestProgress < 25) return '#ef4444';
    if (latestProgress < 50) return '#f59e0b';
    if (latestProgress < 75) return '#3b82f6';
    return '#10b981';
  }
}