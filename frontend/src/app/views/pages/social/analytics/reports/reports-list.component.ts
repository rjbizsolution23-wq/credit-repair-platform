import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    FormsModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="card-title">Analytics Reports</h6>
              <a routerLink="./generate" class="btn btn-primary btn-sm">
                <i data-feather="plus" appFeatherIcon class="btn-icon-prepend"></i>
                Generate New Report
              </a>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-4">
                <div class="input-group">
                  <input type="text" class="form-control" placeholder="Search reports..." [(ngModel)]="searchTerm">
                  <button class="btn btn-outline-secondary" type="button">
                    <i data-feather="search" appFeatherIcon></i>
                  </button>
                </div>
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="filterType">
                  <option value="">All Types</option>
                  <option value="engagement">Engagement</option>
                  <option value="reach">Reach & Impressions</option>
                  <option value="demographics">Demographics</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="filterStatus">
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Type</th>
                    <th>Date Range</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let report of filteredReports">
                    <td>
                      <div class="d-flex align-items-center">
                        <i data-feather="file-text" appFeatherIcon class="me-2 text-muted"></i>
                        <div>
                          <h6 class="mb-0">{{ report.name }}</h6>
                          <small class="text-muted">{{ report.description }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getTypeBadgeClass(report.type)">
                        {{ report.type | titlecase }}
                      </span>
                    </td>
                    <td>{{ report.dateRange }}</td>
                    <td>
                      <span class="badge" [ngClass]="getStatusBadgeClass(report.status)">
                        {{ report.status | titlecase }}
                      </span>
                    </td>
                    <td>{{ report.createdAt | date:'short' }}</td>
                    <td>
                      <div class="dropdown">
                        <button class="btn btn-link p-0" type="button" data-bs-toggle="dropdown">
                          <i data-feather="more-horizontal" appFeatherIcon></i>
                        </button>
                        <ul class="dropdown-menu">
                          <li>
                            <a class="dropdown-item" [routerLink]="['./', report.id]">
                              <i data-feather="eye" appFeatherIcon class="me-2"></i>
                              View
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#" (click)="downloadReport(report)">
                              <i data-feather="download" appFeatherIcon class="me-2"></i>
                              Download
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#" (click)="shareReport(report)">
                              <i data-feather="share-2" appFeatherIcon class="me-2"></i>
                              Share
                            </a>
                          </li>
                          <li><hr class="dropdown-divider"></li>
                          <li>
                            <a class="dropdown-item text-danger" href="#" (click)="deleteReport(report)">
                              <i data-feather="trash-2" appFeatherIcon class="me-2"></i>
                              Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <nav *ngIf="totalPages > 1">
              <ngb-pagination
                [(page)]="currentPage"
                [pageSize]="pageSize"
                [collectionSize]="totalReports"
                [maxSize]="5"
                [rotate]="true"
                [boundaryLinks]="true">
              </ngb-pagination>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsListComponent implements OnInit {
  searchTerm: string = '';
  filterType: string = '';
  filterStatus: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalReports: number = 0;
  totalPages: number = 0;
  
  reports = [
    {
      id: '1',
      name: 'Monthly Engagement Report',
      description: 'Comprehensive engagement analysis for January 2024',
      type: 'engagement',
      dateRange: 'Jan 1 - Jan 31, 2024',
      status: 'completed',
      createdAt: new Date('2024-01-31T10:30:00')
    },
    {
      id: '2',
      name: 'Q4 Performance Summary',
      description: 'Quarterly performance overview and insights',
      type: 'performance',
      dateRange: 'Oct 1 - Dec 31, 2023',
      status: 'completed',
      createdAt: new Date('2024-01-05T14:15:00')
    },
    {
      id: '3',
      name: 'Audience Demographics Analysis',
      description: 'Detailed audience breakdown and demographics',
      type: 'demographics',
      dateRange: 'Dec 1 - Dec 31, 2023',
      status: 'processing',
      createdAt: new Date('2024-01-15T09:45:00')
    },
    {
      id: '4',
      name: 'Reach & Impressions Report',
      description: 'Content reach and impression metrics',
      type: 'reach',
      dateRange: 'Jan 15 - Jan 29, 2024',
      status: 'completed',
      createdAt: new Date('2024-01-30T16:20:00')
    }
  ];
  
  filteredReports = [...this.reports];

  ngOnInit(): void {
    this.updateFilteredReports();
  }
  
  updateFilteredReports(): void {
    this.filteredReports = this.reports.filter(report => {
      const matchesSearch = !this.searchTerm || 
        report.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesType = !this.filterType || report.type === this.filterType;
      const matchesStatus = !this.filterStatus || report.status === this.filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    this.totalReports = this.filteredReports.length;
    this.totalPages = Math.ceil(this.totalReports / this.pageSize);
  }
  
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'engagement': return 'bg-primary';
      case 'reach': return 'bg-success';
      case 'demographics': return 'bg-info';
      case 'performance': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'processing': return 'bg-warning';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
  
  downloadReport(report: any): void {
    console.log('Downloading report:', report.name);
    // Implement download logic
  }
  
  shareReport(report: any): void {
    console.log('Sharing report:', report.name);
    // Implement share logic
  }
  
  deleteReport(report: any): void {
    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      console.log('Deleting report:', report.name);
      // Implement delete logic
    }
  }
}