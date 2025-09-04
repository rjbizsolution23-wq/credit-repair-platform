import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="events-list-container">
      <div class="header">
        <h2>Community Events</h2>
        <button class="btn btn-primary" [routerLink]="['../create']">
          <i class="fas fa-plus"></i> Create Event
        </button>
      </div>

      <div class="filters">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="Search events..."
            class="form-control"
          >
        </div>
        <div class="filter-options">
          <select [(ngModel)]="selectedCategory" class="form-select">
            <option value="">All Categories</option>
            <option value="webinar">Webinars</option>
            <option value="workshop">Workshops</option>
            <option value="networking">Networking</option>
            <option value="conference">Conferences</option>
          </select>
        </div>
      </div>

      <div class="events-grid">
        <div class="event-card" *ngFor="let event of filteredEvents">
          <div class="event-image">
            <img [src]="event.image || '/assets/default-event.jpg'" [alt]="event.title">
            <div class="event-date">
              <span class="month">{{ getMonth(event.date) }}</span>
              <span class="day">{{ getDay(event.date) }}</span>
            </div>
          </div>
          <div class="event-content">
            <h3>{{ event.title }}</h3>
            <p class="event-description">{{ event.description }}</p>
            <div class="event-meta">
              <span class="category">{{ event.category }}</span>
              <span class="attendees">{{ event.attendees }} attending</span>
            </div>
            <div class="event-actions">
              <button class="btn btn-outline-primary" [routerLink]="[event.id]">
                View Details
              </button>
              <button class="btn btn-primary" (click)="joinEvent(event.id)">
                Join Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="filteredEvents.length === 0">
        <i class="fas fa-calendar-alt"></i>
        <h3>No Events Found</h3>
        <p>No events match your current filters.</p>
      </div>
    </div>
  `,
  styles: [`
    .events-list-container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .filters {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }

    .search-box {
      flex: 1;
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .event-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s;
    }

    .event-card:hover {
      transform: translateY(-2px);
    }

    .event-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .event-date {
      position: absolute;
      top: 15px;
      right: 15px;
      background: white;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .event-date .month {
      display: block;
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    .event-date .day {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .event-content {
      padding: 20px;
    }

    .event-content h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .event-description {
      color: #666;
      margin-bottom: 15px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .event-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      font-size: 14px;
    }

    .category {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .attendees {
      color: #666;
    }

    .event-actions {
      display: flex;
      gap: 10px;
    }

    .event-actions button {
      flex: 1;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 20px;
      color: #ddd;
    }
  `]
})
export class EventsListComponent implements OnInit {
  searchTerm = '';
  selectedCategory = '';
  events: any[] = [];

  ngOnInit() {
    this.loadEvents();
  }

  get filteredEvents() {
    return this.events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = !this.selectedCategory || event.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  loadEvents() {
    // Mock data - replace with actual API call
    this.events = [
      {
        id: 1,
        title: 'Credit Repair Workshop',
        description: 'Learn the fundamentals of credit repair and improvement strategies.',
        category: 'workshop',
        date: new Date('2024-02-15'),
        attendees: 45,
        image: '/assets/workshop.jpg'
      },
      {
        id: 2,
        title: 'Financial Planning Webinar',
        description: 'Expert insights on personal financial planning and budgeting.',
        category: 'webinar',
        date: new Date('2024-02-20'),
        attendees: 120,
        image: '/assets/webinar.jpg'
      },
      {
        id: 3,
        title: 'Credit Industry Networking',
        description: 'Connect with professionals in the credit repair industry.',
        category: 'networking',
        date: new Date('2024-02-25'),
        attendees: 75,
        image: '/assets/networking.jpg'
      }
    ];
  }

  getMonth(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  getDay(date: Date): string {
    return date.getDate().toString();
  }

  joinEvent(eventId: number) {
    // Implement event joining logic
    console.log('Joining event:', eventId);
  }
}