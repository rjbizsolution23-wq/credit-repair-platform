import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-comparison.component.html',
  styleUrls: ['./report-comparison.component.scss']
})
export class ReportComparisonComponent {
  reports: any[] = [];
  selectedReports: any[] = [];

  constructor() {
    // Initialize with sample data
    this.reports = [
      {
        id: 1,
        date: new Date('2024-01-01'),
        bureau: 'TransUnion',
        score: 720,
        accounts: 15,
        inquiries: 2
      },
      {
        id: 2,
        date: new Date('2024-02-01'),
        bureau: 'Equifax',
        score: 715,
        accounts: 14,
        inquiries: 1
      },
      {
        id: 3,
        date: new Date('2024-03-01'),
        bureau: 'Experian',
        score: 725,
        accounts: 16,
        inquiries: 3
      }
    ];
  }

  selectReport(report: any): void {
    if (this.selectedReports.length < 2) {
      this.selectedReports.push(report);
    }
  }

  removeReport(index: number): void {
    this.selectedReports.splice(index, 1);
  }

  clearSelection(): void {
    this.selectedReports = [];
  }

  getScoreColor(score: number): string {
    if (score >= 750) return 'success';
    if (score >= 700) return 'primary';
    if (score >= 650) return 'warning';
    return 'danger';
  }
}