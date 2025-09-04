import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';

@Component({
  selector: 'app-report-generate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    FeatherIconDirective
  ],
  template: `
    <div class="row">
      <div class="col-md-12 grid-margin stretch-card">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">Generate Social Analytics Report</h6>
            <p class="text-muted mb-3">Create comprehensive social media analytics reports</p>
            
            <form>
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Report Type</label>
                    <select class="form-select" [(ngModel)]="reportConfig.type" name="reportType">
                      <option value="engagement">Engagement Report</option>
                      <option value="reach">Reach & Impressions</option>
                      <option value="demographics">Demographics Analysis</option>
                      <option value="performance">Performance Summary</option>
                    </select>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Date Range</label>
                    <select class="form-select" [(ngModel)]="reportConfig.dateRange" name="dateRange">
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Social Platforms</label>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="facebook" [(ngModel)]="reportConfig.platforms.facebook" name="facebook">
                      <label class="form-check-label" for="facebook">Facebook</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="twitter" [(ngModel)]="reportConfig.platforms.twitter" name="twitter">
                      <label class="form-check-label" for="twitter">Twitter</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="linkedin" [(ngModel)]="reportConfig.platforms.linkedin" name="linkedin">
                      <label class="form-check-label" for="linkedin">LinkedIn</label>
                    </div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="mb-3">
                    <label class="form-label">Report Format</label>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="pdf" value="pdf" [(ngModel)]="reportConfig.format" name="format">
                      <label class="form-check-label" for="pdf">PDF</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="excel" value="excel" [(ngModel)]="reportConfig.format" name="format">
                      <label class="form-check-label" for="excel">Excel</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="csv" value="csv" [(ngModel)]="reportConfig.format" name="format">
                      <label class="form-check-label" for="csv">CSV</label>
                    </div>
                  </div>
                </div>
              </div>
              
              <button type="submit" class="btn btn-primary me-2" (click)="generateReport()">
                <i data-feather="file-text" appFeatherIcon class="btn-icon-prepend"></i>
                Generate Report
              </button>
              <button type="button" class="btn btn-secondary">
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportGenerateComponent {
  reportConfig = {
    type: 'engagement',
    dateRange: '30days',
    platforms: {
      facebook: true,
      twitter: true,
      linkedin: false
    },
    format: 'pdf'
  };

  generateReport() {
    console.log('Generating report with config:', this.reportConfig);
    // Implement report generation logic here
  }
}