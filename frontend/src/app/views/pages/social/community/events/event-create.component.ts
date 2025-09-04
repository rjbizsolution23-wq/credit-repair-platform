import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="event-create-container">
      <div class="header">
        <button class="btn btn-outline-secondary" [routerLink]="['../']">
          <i class="fas fa-arrow-left"></i> Back to Events
        </button>
        <h2>Create New Event</h2>
      </div>

      <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" class="event-form">
        <div class="form-section">
          <h3>Basic Information</h3>
          
          <div class="form-group">
            <label for="title">Event Title *</label>
            <input 
              type="text" 
              id="title"
              formControlName="title"
              class="form-control"
              placeholder="Enter event title"
            >
            <div class="error-message" *ngIf="eventForm.get('title')?.invalid && eventForm.get('title')?.touched">
              Event title is required
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea 
              id="description"
              formControlName="description"
              class="form-control"
              rows="4"
              placeholder="Describe your event"
            ></textarea>
            <div class="error-message" *ngIf="eventForm.get('description')?.invalid && eventForm.get('description')?.touched">
              Event description is required
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category *</label>
              <select id="category" formControlName="category" class="form-select">
                <option value="">Select category</option>
                <option value="webinar">Webinar</option>
                <option value="workshop">Workshop</option>
                <option value="networking">Networking</option>
                <option value="conference">Conference</option>
                <option value="seminar">Seminar</option>
              </select>
              <div class="error-message" *ngIf="eventForm.get('category')?.invalid && eventForm.get('category')?.touched">
                Please select a category
              </div>
            </div>

            <div class="form-group">
              <label for="type">Event Type *</label>
              <select id="type" formControlName="type" class="form-select">
                <option value="">Select type</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <div class="error-message" *ngIf="eventForm.get('type')?.invalid && eventForm.get('type')?.touched">
                Please select event type
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Date & Time</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Start Date *</label>
              <input 
                type="datetime-local" 
                id="startDate"
                formControlName="startDate"
                class="form-control"
              >
              <div class="error-message" *ngIf="eventForm.get('startDate')?.invalid && eventForm.get('startDate')?.touched">
                Start date is required
              </div>
            </div>

            <div class="form-group">
              <label for="endDate">End Date *</label>
              <input 
                type="datetime-local" 
                id="endDate"
                formControlName="endDate"
                class="form-control"
              >
              <div class="error-message" *ngIf="eventForm.get('endDate')?.invalid && eventForm.get('endDate')?.touched">
                End date is required
              </div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Location & Access</h3>
          
          <div class="form-group" *ngIf="eventForm.get('type')?.value !== 'online'">
            <label for="location">Venue/Location</label>
            <input 
              type="text" 
              id="location"
              formControlName="location"
              class="form-control"
              placeholder="Enter venue or address"
            >
          </div>

          <div class="form-group" *ngIf="eventForm.get('type')?.value !== 'in-person'">
            <label for="meetingLink">Meeting Link</label>
            <input 
              type="url" 
              id="meetingLink"
              formControlName="meetingLink"
              class="form-control"
              placeholder="https://zoom.us/j/..."
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="maxAttendees">Max Attendees</label>
              <input 
                type="number" 
                id="maxAttendees"
                formControlName="maxAttendees"
                class="form-control"
                placeholder="Leave empty for unlimited"
                min="1"
              >
            </div>

            <div class="form-group">
              <label for="registrationDeadline">Registration Deadline</label>
              <input 
                type="datetime-local" 
                id="registrationDeadline"
                formControlName="registrationDeadline"
                class="form-control"
              >
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Additional Settings</h3>
          
          <div class="form-group">
            <label for="tags">Tags</label>
            <input 
              type="text" 
              id="tags"
              formControlName="tags"
              class="form-control"
              placeholder="Enter tags separated by commas"
            >
            <small class="form-text">e.g., credit repair, financial planning, education</small>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="requiresApproval">
              <span class="checkmark"></span>
              Require approval for registration
            </label>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="isPublic">
              <span class="checkmark"></span>
              Make event public
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline-secondary" [routerLink]="['../']">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="eventForm.invalid || isSubmitting">
            <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
            {{ isSubmitting ? 'Creating...' : 'Create Event' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .event-create-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
    }

    .event-form {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .form-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .form-control, .form-select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .form-text {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .checkbox-group {
      margin-bottom: 15px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      width: auto;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: flex-end;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      text-decoration: none;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-outline-secondary {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-border {
      width: 1rem;
      height: 1rem;
      border: 0.125em solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
    }

    @keyframes spinner-border {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class EventCreateComponent implements OnInit {
  eventForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      type: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      location: [''],
      meetingLink: [''],
      maxAttendees: [''],
      registrationDeadline: [''],
      tags: [''],
      requiresApproval: [false],
      isPublic: [true]
    });
  }

  ngOnInit() {
    // Set default registration deadline to 1 day before event
    this.eventForm.get('startDate')?.valueChanges.subscribe(startDate => {
      if (startDate) {
        const deadline = new Date(startDate);
        deadline.setDate(deadline.getDate() - 1);
        this.eventForm.patchValue({
          registrationDeadline: deadline.toISOString().slice(0, 16)
        });
      }
    });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.eventForm.value;
      
      // Process tags
      if (formData.tags) {
        formData.tags = formData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      }
      
      // Simulate API call
      setTimeout(() => {
        console.log('Creating event:', formData);
        this.isSubmitting = false;
        this.router.navigate(['../'], { relativeTo: this.router.routerState.root });
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.eventForm.controls).forEach(key => {
        this.eventForm.get(key)?.markAsTouched();
      });
    }
  }
}