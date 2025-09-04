import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="event-detail-container" *ngIf="event">
      <div class="header">
        <button class="btn btn-outline-secondary" [routerLink]="['../']">
          <i class="fas fa-arrow-left"></i> Back to Events
        </button>
        <div class="header-actions">
          <button class="btn btn-outline-primary" (click)="shareEvent()">
            <i class="fas fa-share"></i> Share
          </button>
          <button class="btn btn-primary" (click)="joinEvent()" [disabled]="isRegistered">
            <i class="fas fa-calendar-plus"></i> 
            {{ isRegistered ? 'Registered' : 'Join Event' }}
          </button>
        </div>
      </div>

      <div class="event-hero">
        <div class="event-image">
          <img [src]="event.image || '/assets/default-event.jpg'" [alt]="event.title">
          <div class="event-status" [class]="event.status">
            {{ event.status | titlecase }}
          </div>
        </div>
        <div class="event-info">
          <div class="event-category">{{ event.category | titlecase }}</div>
          <h1>{{ event.title }}</h1>
          <p class="event-description">{{ event.description }}</p>
          
          <div class="event-meta">
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <div>
                <strong>{{ formatDate(event.startDate) }}</strong>
                <small>{{ formatTime(event.startDate) }} - {{ formatTime(event.endDate) }}</small>
              </div>
            </div>
            
            <div class="meta-item" *ngIf="event.location">
              <i class="fas fa-map-marker-alt"></i>
              <div>
                <strong>{{ event.location }}</strong>
                <small>{{ event.type | titlecase }} Event</small>
              </div>
            </div>
            
            <div class="meta-item" *ngIf="event.meetingLink">
              <i class="fas fa-video"></i>
              <div>
                <strong>Online Meeting</strong>
                <small>Link will be shared upon registration</small>
              </div>
            </div>
            
            <div class="meta-item">
              <i class="fas fa-users"></i>
              <div>
                <strong>{{ event.attendees }} Registered</strong>
                <small *ngIf="event.maxAttendees">{{ event.maxAttendees - event.attendees }} spots left</small>
                <small *ngIf="!event.maxAttendees">Unlimited capacity</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="event-content">
        <div class="main-content">
          <div class="content-section">
            <h2>About This Event</h2>
            <div class="event-details" [innerHTML]="event.fullDescription || event.description"></div>
          </div>

          <div class="content-section" *ngIf="event.agenda && event.agenda.length > 0">
            <h2>Agenda</h2>
            <div class="agenda-list">
              <div class="agenda-item" *ngFor="let item of event.agenda">
                <div class="agenda-time">{{ item.time }}</div>
                <div class="agenda-content">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.description }}</p>
                  <span class="speaker" *ngIf="item.speaker">Speaker: {{ item.speaker }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="content-section" *ngIf="event.speakers && event.speakers.length > 0">
            <h2>Speakers</h2>
            <div class="speakers-grid">
              <div class="speaker-card" *ngFor="let speaker of event.speakers">
                <img [src]="speaker.avatar || '/assets/default-avatar.jpg'" [alt]="speaker.name">
                <div class="speaker-info">
                  <h4>{{ speaker.name }}</h4>
                  <p class="speaker-title">{{ speaker.title }}</p>
                  <p class="speaker-bio">{{ speaker.bio }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="content-section" *ngIf="event.requirements && event.requirements.length > 0">
            <h2>Requirements</h2>
            <ul class="requirements-list">
              <li *ngFor="let requirement of event.requirements">{{ requirement }}</li>
            </ul>
          </div>
        </div>

        <div class="sidebar">
          <div class="registration-card">
            <h3>Registration</h3>
            <div class="registration-info">
              <div class="info-item">
                <span class="label">Registration Deadline:</span>
                <span class="value">{{ formatDate(event.registrationDeadline) }}</span>
              </div>
              <div class="info-item" *ngIf="event.price">
                <span class="label">Price:</span>
                <span class="value">{{ event.price }}</span>
              </div>
              <div class="info-item" *ngIf="!event.price">
                <span class="label">Price:</span>
                <span class="value">Free</span>
              </div>
            </div>
            
            <button class="btn btn-primary btn-block" (click)="joinEvent()" [disabled]="isRegistered || isRegistrationClosed">
              <span *ngIf="isRegistered">✓ Registered</span>
              <span *ngIf="!isRegistered && !isRegistrationClosed">Register Now</span>
              <span *ngIf="!isRegistered && isRegistrationClosed">Registration Closed</span>
            </button>
            
            <div class="registration-note" *ngIf="event.requiresApproval">
              <i class="fas fa-info-circle"></i>
              Registration requires approval
            </div>
          </div>

          <div class="organizer-card">
            <h3>Organizer</h3>
            <div class="organizer-info">
              <img [src]="event.organizer?.avatar || '/assets/default-avatar.jpg'" [alt]="event.organizer?.name">
              <div>
                <h4>{{ event.organizer?.name || 'Credit Repair Platform' }}</h4>
                <p>{{ event.organizer?.title || 'Event Organizer' }}</p>
                <button class="btn btn-outline-primary btn-sm" (click)="contactOrganizer()">
                  Contact
                </button>
              </div>
            </div>
          </div>

          <div class="tags-card" *ngIf="event.tags && event.tags.length > 0">
            <h3>Tags</h3>
            <div class="tags">
              <span class="tag" *ngFor="let tag of event.tags">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="!event">
      <div class="spinner"></div>
      <p>Loading event details...</p>
    </div>
  `,
  styles: [`
    .event-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .event-hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }

    .event-image {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
    }

    .event-image img {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }

    .event-status {
      position: absolute;
      top: 15px;
      right: 15px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .event-status.upcoming {
      background: #e3f2fd;
      color: #1976d2;
    }

    .event-status.live {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .event-status.completed {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .event-info {
      padding: 20px 0;
    }

    .event-category {
      color: #1976d2;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .event-info h1 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 32px;
    }

    .event-description {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 25px;
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .meta-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .meta-item i {
      color: #1976d2;
      margin-top: 2px;
      width: 16px;
    }

    .meta-item strong {
      display: block;
      color: #333;
    }

    .meta-item small {
      color: #666;
      font-size: 14px;
    }

    .event-content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 40px;
    }

    .content-section {
      margin-bottom: 40px;
    }

    .content-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 24px;
    }

    .event-details {
      color: #666;
      line-height: 1.6;
    }

    .agenda-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .agenda-item {
      display: flex;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .agenda-time {
      font-weight: 600;
      color: #1976d2;
      min-width: 80px;
    }

    .agenda-content h4 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .agenda-content p {
      margin: 0 0 8px 0;
      color: #666;
    }

    .speaker {
      font-size: 14px;
      color: #1976d2;
      font-weight: 500;
    }

    .speakers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .speaker-card {
      display: flex;
      gap: 15px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .speaker-card img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
    }

    .speaker-info h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .speaker-title {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 14px;
      font-weight: 500;
    }

    .speaker-bio {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .requirements-list {
      color: #666;
      line-height: 1.6;
    }

    .sidebar > div {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .sidebar h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
    }

    .registration-info {
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .info-item .label {
      color: #666;
    }

    .info-item .value {
      font-weight: 600;
      color: #333;
    }

    .btn-block {
      width: 100%;
    }

    .registration-note {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 15px;
      padding: 10px;
      background: #fff3cd;
      color: #856404;
      border-radius: 6px;
      font-size: 14px;
    }

    .organizer-info {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .organizer-info img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .organizer-info h4 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .organizer-info p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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

    .btn-outline-primary {
      background: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }

    .btn-outline-secondary {
      background: transparent;
      color: #6c757d;
      border: 1px solid #6c757d;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 14px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .event-hero {
        grid-template-columns: 1fr;
      }
      
      .event-content {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      
      .header-actions {
        justify-content: center;
      }
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event: any = null;
  isRegistered = false;
  isRegistrationClosed = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    this.loadEvent(eventId);
  }

  loadEvent(eventId: string | null) {
    // Mock data - replace with actual API call
    setTimeout(() => {
      this.event = {
        id: eventId,
        title: 'Advanced Credit Repair Strategies Workshop',
        description: 'Learn advanced techniques for credit repair and score improvement from industry experts.',
        fullDescription: `
          <p>Join us for an intensive workshop covering the most effective credit repair strategies used by professionals in the industry. This comprehensive session will provide you with practical tools and techniques to help your clients achieve significant credit score improvements.</p>
          
          <h3>What You'll Learn:</h3>
          <ul>
            <li>Advanced dispute letter techniques</li>
            <li>Credit utilization optimization strategies</li>
            <li>Debt validation processes</li>
            <li>Credit monitoring and maintenance</li>
            <li>Legal compliance and best practices</li>
          </ul>
          
          <p>This workshop is perfect for credit repair professionals, financial advisors, and anyone looking to deepen their understanding of credit repair processes.</p>
        `,
        category: 'workshop',
        type: 'hybrid',
        status: 'upcoming',
        startDate: new Date('2024-02-15T14:00:00'),
        endDate: new Date('2024-02-15T17:00:00'),
        location: 'Financial Education Center, Downtown',
        meetingLink: 'https://zoom.us/j/123456789',
        attendees: 45,
        maxAttendees: 100,
        registrationDeadline: new Date('2024-02-14T23:59:59'),
        price: null, // Free event
        requiresApproval: false,
        image: '/assets/workshop-hero.jpg',
        organizer: {
          name: 'Sarah Johnson',
          title: 'Senior Credit Analyst',
          avatar: '/assets/organizer-avatar.jpg'
        },
        speakers: [
          {
            name: 'Michael Chen',
            title: 'Credit Repair Expert',
            bio: '15+ years experience in credit repair and financial consulting.',
            avatar: '/assets/speaker1.jpg'
          },
          {
            name: 'Lisa Rodriguez',
            title: 'Legal Compliance Specialist',
            bio: 'Specializes in FCRA and FDCPA compliance for credit repair businesses.',
            avatar: '/assets/speaker2.jpg'
          }
        ],
        agenda: [
          {
            time: '2:00 PM',
            title: 'Welcome & Introduction',
            description: 'Overview of workshop objectives and introductions',
            speaker: 'Sarah Johnson'
          },
          {
            time: '2:15 PM',
            title: 'Advanced Dispute Strategies',
            description: 'Deep dive into effective dispute letter techniques',
            speaker: 'Michael Chen'
          },
          {
            time: '3:00 PM',
            title: 'Legal Compliance',
            description: 'Understanding FCRA, FDCPA, and state regulations',
            speaker: 'Lisa Rodriguez'
          },
          {
            time: '3:45 PM',
            title: 'Break',
            description: '15-minute networking break'
          },
          {
            time: '4:00 PM',
            title: 'Case Studies & Q&A',
            description: 'Real-world examples and interactive discussion',
            speaker: 'All Speakers'
          }
        ],
        requirements: [
          'Basic understanding of credit reports',
          'Laptop or tablet for note-taking',
          'Credit repair business license (if applicable)'
        ],
        tags: ['credit repair', 'workshop', 'professional development', 'FCRA', 'dispute letters']
      };
      
      // Check if registration is closed
      this.isRegistrationClosed = new Date() > this.event.registrationDeadline;
    }, 1000);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  joinEvent() {
    if (!this.isRegistered && !this.isRegistrationClosed) {
      // Implement registration logic
      console.log('Registering for event:', this.event.id);
      this.isRegistered = true;
    }
  }

  shareEvent() {
    // Implement sharing logic
    if (navigator.share) {
      navigator.share({
        title: this.event.title,
        text: this.event.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      console.log('Event link copied to clipboard');
    }
  }

  contactOrganizer() {
    // Implement contact organizer logic
    console.log('Contacting organizer:', this.event.organizer.name);
  }
}