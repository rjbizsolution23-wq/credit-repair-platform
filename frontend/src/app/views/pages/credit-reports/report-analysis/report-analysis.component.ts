import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { CreditReportService } from '../../../../core/services/credit-report.service';
import { CreditReport, CreditBureau, AccountType, PaymentStatus, InquiryType, PublicRecordType, CollectionStatus, ScoreImpact, ReportSummary } from '../../../../core/models/credit-report.model';

@Component({
  selector: 'app-report-analysis',
  standalone: true,
  imports: [TitleCasePipe],
  templateUrl: './report-analysis.component.html',
  styleUrls: ['./report-analysis.component.scss']
})
export class ReportAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  reportId: string = '';
  report: CreditReport | null = null;
  summary: ReportSummary | null = null;
  loading = true;
  error: string | null = null;
  
  // Analysis data
  negativeItems: any[] = [];
  positiveItems: any[] = [];
  recommendations: any[] = [];
  scoreFactors: any[] = [];
  
  // UI state
  activeTab = 'overview';
  expandedSections: { [key: string]: boolean } = {
    personalInfo: true,
    creditScore: true,
    accounts: false,
    inquiries: false,
    publicRecords: false,
    collections: false
  };
  
  // Enums for template
  CreditBureau = CreditBureau;
  AccountType = AccountType;
  PaymentStatus = PaymentStatus;
  InquiryType = InquiryType;
  PublicRecordType = PublicRecordType;
  CollectionStatus = CollectionStatus;
  ScoreImpact = ScoreImpact;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creditReportService: CreditReportService
  ) {}

  ngOnInit(): void {
    this.reportId = this.route.snapshot.params['id'];
    if (this.reportId) {
      this.loadReportData();
    } else {
      this.error = 'Report ID not found';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReportData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      report: this.creditReportService.getReport(this.reportId),
      analysis: this.creditReportService.analyzeReport(this.reportId)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any) => {
        this.report = data.report;
        this.processAnalysisData(data.analysis);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading report data:', error);
        this.error = 'Failed to load report data. Please try again.';
        this.loading = false;
      }
    });
  }

  private processAnalysisData(analysis: any): void {
    this.summary = analysis.summary;
    this.negativeItems = analysis.negativeItems || [];
    this.positiveItems = analysis.positiveItems || [];
    this.recommendations = analysis.recommendations || [];
    this.scoreFactors = analysis.scoreFactors || [];
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  toggleSection(section: string): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  onEditReport(): void {
    this.router.navigate(['/credit-reports/edit', this.reportId]);
  }

  onDeleteReport(): void {
    if (confirm('Are you sure you want to delete this credit report?')) {
      this.creditReportService.deleteReport(this.reportId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/credit-reports']);
          },
          error: (error: any) => {
            console.error('Error deleting report:', error);
            this.error = 'Failed to delete report. Please try again.';
          }
        });
    }
  }

  onReprocessReport(): void {
    if (confirm('Are you sure you want to reprocess this credit report?')) {
      this.creditReportService.reprocessReport(this.reportId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadReportData(); // Reload data after reprocessing
          },
          error: (error: any) => {
            console.error('Error reprocessing report:', error);
            this.error = 'Failed to reprocess report. Please try again.';
          }
        });
    }
  }

  onExportReport(): void {
    this.creditReportService.exportReports({ clientId: this.reportId }, 'pdf')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: any) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `credit-report-${this.reportId}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error exporting report:', error);
          this.error = 'Failed to export report. Please try again.';
        }
      });
  }

  onCreateDispute(item: any): void {
    // Navigate to create dispute with pre-filled data
    this.router.navigate(['/disputes/create'], {
      queryParams: {
        reportId: this.reportId,
        itemId: item.id,
        itemType: item.type
      }
    });
  }

  onGenerateLetter(item: any): void {
    // Navigate to letter generation with pre-filled data
    this.router.navigate(['/letters/generate'], {
      queryParams: {
        reportId: this.reportId,
        itemId: item.id,
        itemType: item.type
      }
    });
  }

  // Utility methods
  getBureauIcon(bureau: CreditBureau | undefined): string {
    if (!bureau) return 'file-text';
    switch (bureau) {
      case CreditBureau.EXPERIAN:
        return 'trending-up';
      case CreditBureau.EQUIFAX:
        return 'bar-chart';
      case CreditBureau.TRANSUNION:
        return 'activity';
      default:
        return 'file-text';
    }
  }

  getBureauColor(bureau: CreditBureau | undefined): string {
    if (!bureau) return 'secondary';
    switch (bureau) {
      case CreditBureau.EXPERIAN:
        return 'success';
      case CreditBureau.EQUIFAX:
        return 'primary';
      case CreditBureau.TRANSUNION:
        return 'info';
      default:
        return 'secondary';
    }
  }

  getScoreColor(score: number | undefined): string {
    if (!score) return 'secondary';
    if (score >= 750) return 'success';
    if (score >= 700) return 'info';
    if (score >= 650) return 'warning';
    return 'danger';
  }

  getScoreGrade(score: number | undefined): string {
    if (!score) return 'N/A';
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Poor';
    return 'Very Poor';
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.CURRENT:
        return 'success';
      case PaymentStatus.LATE_30:
      case PaymentStatus.LATE_60:
        return 'warning';
      case PaymentStatus.LATE_90:
      case PaymentStatus.LATE_120:
      case PaymentStatus.CHARGE_OFF:
      case PaymentStatus.COLLECTION:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getAccountTypeIcon(type: AccountType): string {
    switch (type) {
      case AccountType.CREDIT_CARD:
        return 'credit-card';
      case AccountType.MORTGAGE:
        return 'home';
      case AccountType.AUTO_LOAN:
        return 'truck';
      case AccountType.STUDENT_LOAN:
        return 'book';
      case AccountType.PERSONAL_LOAN:
        return 'user';
      default:
        return 'file-text';
    }
  }

  getImpactColor(impact: ScoreImpact): string {
    switch (impact) {
      case ScoreImpact.VERY_POSITIVE:
      case ScoreImpact.POSITIVE:
        return 'success';
      case ScoreImpact.NEUTRAL:
        return 'secondary';
      case ScoreImpact.NEGATIVE:
        return 'warning';
      case ScoreImpact.VERY_NEGATIVE:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getUtilizationColor(utilization: number): string {
    if (utilization <= 10) return 'success';
    if (utilization <= 30) return 'info';
    if (utilization <= 50) return 'warning';
    return 'danger';
  }

  getAgeColor(months: number): string {
    if (months >= 120) return 'success'; // 10+ years
    if (months >= 60) return 'info';     // 5+ years
    if (months >= 24) return 'warning';  // 2+ years
    return 'danger';                     // Less than 2 years
  }

  onBack(): void {
    this.router.navigate(['/credit-reports']);
  }

  onRefresh(): void {
    this.loadReportData();
  }

  navigateToLetterGenerate(): void {
    this.router.navigate(['/letters/generate'], {
      queryParams: { reportId: this.reportId }
    });
  }

  navigateToComparison(): void {
    this.router.navigate(['/credit-reports/comparison'], {
      queryParams: { reportId: this.reportId }
    });
  }

  navigateToCreateDispute(): void {
    this.router.navigate(['/disputes/create'], {
      queryParams: { reportId: this.reportId }
    });
  }
}