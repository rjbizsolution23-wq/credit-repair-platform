import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  EnforcementAction, 
  ActionType, 
  ActionStatus, 
  ActionPriority,
  ViolationType 
} from '../enforcement.model';
import { EnforcementService } from '../enforcement.service';

@Component({
  selector: 'app-create-action',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './create-action.component.html',
  styleUrls: ['./create-action.component.scss']
})
export class CreateActionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  actionForm: FormGroup;
  loading = false;
  error: string | null = null;

  // Enums for template
  ActionType = ActionType;
  ActionStatus = ActionStatus;
  ActionPriority = ActionPriority;
  ViolationType = ViolationType;

  constructor(
    private fb: FormBuilder,
    private enforcementService: EnforcementService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.actionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['', Validators.required],
      priority: [ActionPriority.MEDIUM, Validators.required],
      violationId: [''],
      assignedTo: [''],
      dueDate: ['', Validators.required],
      estimatedHours: [''],
      tags: ['']
    });
  }

  onSubmit(): void {
    if (this.actionForm.valid) {
      this.loading = true;
      this.error = null;

      const formValue = this.actionForm.value;
      const actionData: Partial<EnforcementAction> = {
        ...formValue,
        status: ActionStatus.PLANNED,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.enforcementService.createAction(actionData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (action) => {
            this.router.navigate(['/enforcement/actions', action.id]);
          },
          error: (error) => {
            this.error = 'Failed to create enforcement action';
            this.loading = false;
            console.error('Error creating action:', error);
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/enforcement/actions']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.actionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.actionForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }
}