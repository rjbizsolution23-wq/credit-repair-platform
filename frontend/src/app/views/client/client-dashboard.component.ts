import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';

// Services
import { AuthService } from '../../services/auth.service';
import { DisputesService } from '../pages/disputes/disputes.service';
import { CreditReportService } from '../../services/credit-report.service';
import { NotificationService } from '../../services/notification.service';

// Interfaces
interface CreditScore {
  bureau: string;
  score: number;
  date: Date;
  change: number;
  model: string;
}

interface DisputeItem {
  id: string;
  creditor: string;
  accountNumber: string;
  disputeReason: string;
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  dateSent: Date;
  responseDate?: Date;
  outcome?: string;
  nextAction?: string;
}

interface CreditAccount {
  id: string;
  creditor: string;
  accountType: string;
  balance: number;
  paymentStatus: string;
  dateOpened: Date;
  lastActivity: Date;
  status: 'open' | 'closed' | 'disputed';
  impact: 'positive' | 'negative' | 'neutral';
}

interface ProgressStep {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  completedDate?: Date;
  estimatedCompletion?: Date;
}

interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enrollmentDate: Date;
  assignedCro: string;
  subscriptionPlan: string;
  nextPaymentDate: Date;
}

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Loading States
  loading = true;
  loadingScores = false;
  loadingDisputes = false;
  loadingAccounts = false;
  
  // Client Data
  clientProfile: ClientProfile | null = null;
  creditScores: CreditScore[] = [];
  disputes: DisputeItem[] = [];
  creditAccounts: CreditAccount[] = [];
  progressSteps: ProgressStep[] = [];
  
  // Dashboard Stats
  dashboardStats = {
    totalDisputes: 0,
    activeDisputes: 0,
    resolvedDisputes: 0,
    averageScoreIncrease: 0,
    accountsImproved: 0,
    daysInProgram: 0,
    nextMilestone: '',
    complianceScore: 98
  };
  
  // Charts
  scoreChart: Chart | null = null;
  progressChart: Chart | null = null;
  
  // UI State
  activeTab = 'overview';
  showUploadModal = false;
  showDisputeModal = false;
  selectedAccount: CreditAccount | null = null;
  
  // Filters
  disputeFilter = 'all';
  accountFilter = 'all';
  
  constructor(
    private authService: AuthService,
    private disputesService: DisputesService,
    private creditReportService: CreditReportService,
    private notificationService: NotificationService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.initializeProgressSteps();
    this.loadClientData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.scoreChart) {
      this.scoreChart.destroy();
    }
    if (this.progressChart) {
      this.progressChart.destroy();
    }
  }
  
  private async loadClientData(): Promise<void> {
    try {
      this.loading = true;
      
      // Load client profile
      await this.loadClientProfile();
      
      // Load all dashboard data in parallel
      await Promise.all([
        this.loadCreditScores(),
        this.loadDisputes(),
        this.loadCreditAccounts(),
        this.calculateDashboardStats()
      ]);
      
      // Initialize charts after data is loaded
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
      
    } catch (error) {
      console.error('Error loading client data:', error);
      this.notificationService.showError('Failed to load dashboard data');
    } finally {
      this.loading = false;
    }
  }
  
  private async loadClientProfile(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.clientProfile = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          enrollmentDate: new Date(user.enrollmentDate),
          assignedCro: user.assignedCro || 'Rick Jefferson',
          subscriptionPlan: user.subscriptionPlan || 'Premium',
          nextPaymentDate: new Date(user.nextPaymentDate)
        };
      }
    } catch (error) {
      console.error('Error loading client profile:', error);
    }
  }
  
  private async loadCreditScores(): Promise<void> {
    try {
      this.loadingScores = true;
      
      // Simulate credit score data - replace with actual API call
      this.creditScores = [
        {
          bureau: 'Experian',
          score: 720,
          date: new Date(),
          change: +45,
          model: 'FICO 8'
        },
        {
          bureau: 'Equifax',
          score: 715,
          date: new Date(),
          change: +38,
          model: 'FICO 8'
        },
        {
          bureau: 'TransUnion',
          score: 725,
          date: new Date(),
          change: +52,
          model: 'FICO 8'
        }
      ];
      
    } catch (error) {
      console.error('Error loading credit scores:', error);
    } finally {
      this.loadingScores = false;
    }
  }
  
  private async loadDisputes(): Promise<void> {
    try {
      this.loadingDisputes = true;
      
      const response = await this.disputesService.getDisputes({
        page: 1,
        limit: 50,
        status: 'all'
      }).toPromise();
      
      this.disputes = response.disputes.map((dispute: any) => ({
        id: dispute.id,
        creditor: dispute.creditor,
        accountNumber: dispute.account_number,
        disputeReason: dispute.dispute_reason,
        status: dispute.status,
        dateSent: new Date(dispute.date_sent),
        responseDate: dispute.response_date ? new Date(dispute.response_date) : undefined,
        outcome: dispute.outcome,
        nextAction: dispute.next_action
      }));
      
    } catch (error) {
      console.error('Error loading disputes:', error);
      // Fallback to mock data
      this.disputes = this.getMockDisputes();
    } finally {
      this.loadingDisputes = false;
    }
  }
  
  private async loadCreditAccounts(): Promise<void> {
    try {
      this.loadingAccounts = true;
      
      // Simulate credit account data - replace with actual API call
      this.creditAccounts = [
        {
          id: '1',
          creditor: 'Chase Bank',
          accountType: 'Credit Card',
          balance: 2500,
          paymentStatus: 'Current',
          dateOpened: new Date('2020-03-15'),
          lastActivity: new Date('2024-01-15'),
          status: 'open',
          impact: 'positive'
        },
        {
          id: '2',
          creditor: 'Capital One',
          accountType: 'Credit Card',
          balance: 0,
          paymentStatus: '30 Days Late',
          dateOpened: new Date('2019-08-22'),
          lastActivity: new Date('2023-12-10'),
          status: 'disputed',
          impact: 'negative'
        },
        {
          id: '3',
          creditor: 'Wells Fargo',
          accountType: 'Auto Loan',
          balance: 15000,
          paymentStatus: 'Current',
          dateOpened: new Date('2022-01-10'),
          lastActivity: new Date('2024-01-01'),
          status: 'open',
          impact: 'positive'
        }
      ];
      
    } catch (error) {
      console.error('Error loading credit accounts:', error);
    } finally {
      this.loadingAccounts = false;
    }
  }
  
  private async calculateDashboardStats(): Promise<void> {
    try {
      const totalDisputes = this.disputes.length;
      const activeDisputes = this.disputes.filter(d => 
        ['pending', 'investigating'].includes(d.status)
      ).length;
      const resolvedDisputes = this.disputes.filter(d => 
        d.status === 'resolved'
      ).length;
      
      const averageScoreIncrease = this.creditScores.length > 0 
        ? Math.round(this.creditScores.reduce((sum, score) => sum + score.change, 0) / this.creditScores.length)
        : 0;
      
      const accountsImproved = this.creditAccounts.filter(a => 
        a.impact === 'positive'
      ).length;
      
      const enrollmentDate = this.clientProfile?.enrollmentDate || new Date();
      const daysInProgram = Math.floor(
        (new Date().getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      this.dashboardStats = {
        totalDisputes,
        activeDisputes,
        resolvedDisputes,
        averageScoreIncrease,
        accountsImproved,
        daysInProgram,
        nextMilestone: this.getNextMilestone(),
        complianceScore: 98
      };
      
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
    }
  }
  
  private initializeProgressSteps(): void {
    this.progressSteps = [
      {
        step: 1,
        title: 'Credit Report Analysis',
        description: 'Comprehensive review of all three credit reports',
        status: 'completed',
        completedDate: new Date('2024-01-05')
      },
      {
        step: 2,
        title: 'Dispute Strategy Development',
        description: 'Metro 2® compliant dispute plan creation',
        status: 'completed',
        completedDate: new Date('2024-01-08')
      },
      {
        step: 3,
        title: 'Initial Dispute Letters',
        description: 'First round of dispute letters sent to bureaus',
        status: 'completed',
        completedDate: new Date('2024-01-10')
      },
      {
        step: 4,
        title: 'Bureau Investigation',
        description: 'Credit bureaus investigating disputed items',
        status: 'current'
      },
      {
        step: 5,
        title: 'Furnisher Disputes',
        description: 'Direct disputes with data furnishers',
        status: 'pending',
        estimatedCompletion: new Date('2024-02-15')
      },
      {
        step: 6,
        title: 'Verification Challenges',
        description: 'Method of verification challenges',
        status: 'pending',
        estimatedCompletion: new Date('2024-03-01')
      },
      {
        step: 7,
        title: 'Escalation & Legal',
        description: 'Advanced dispute strategies and legal notices',
        status: 'pending',
        estimatedCompletion: new Date('2024-03-15')
      },
      {
        step: 8,
        title: 'Credit Optimization',
        description: 'Score optimization and positive credit building',
        status: 'pending',
        estimatedCompletion: new Date('2024-04-01')
      },
      {
        step: 9,
        title: 'Monitoring & Maintenance',
        description: 'Ongoing credit monitoring and protection',
        status: 'pending',
        estimatedCompletion: new Date('2024-04-15')
      },
      {
        step: 10,
        title: 'Financial Freedom',
        description: 'Credit goals achieved and wealth building begins',
        status: 'pending',
        estimatedCompletion: new Date('2024-05-01')
      }
    ];
  }
  
  private initializeCharts(): void {
    this.createScoreChart();
    this.createProgressChart();
  }
  
  private createScoreChart(): void {
    const ctx = document.getElementById('scoreChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Mock historical data for demonstration
    const months = ['Oct', 'Nov', 'Dec', 'Jan'];
    const experianData = [675, 690, 705, 720];
    const equifaxData = [677, 692, 707, 715];
    const transUnionData = [673, 688, 710, 725];
    
    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: months,
        datasets: [
          {
            label: 'Experian',
            data: experianData,
            borderColor: '#14B8A6',
            backgroundColor: 'rgba(20, 184, 166, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Equifax',
            data: equifaxData,
            borderColor: '#1E3A8A',
            backgroundColor: 'rgba(30, 58, 138, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'TransUnion',
            data: transUnionData,
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Credit Score Progress'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 600,
            max: 800
          }
        }
      }
    };
    
    this.scoreChart = new Chart(ctx, config);
  }
  
  private createProgressChart(): void {
    const ctx = document.getElementById('progressChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const completedSteps = this.progressSteps.filter(s => s.status === 'completed').length;
    const totalSteps = this.progressSteps.length;
    const progressPercentage = (completedSteps / totalSteps) * 100;
    
    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [progressPercentage, 100 - progressPercentage],
          backgroundColor: ['#14B8A6', '#E2E8F0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        cutout: '70%'
      }
    };
    
    this.progressChart = new Chart(ctx, config);
  }
  
  // UI Methods
  switchTab(tab: string): void {
    this.activeTab = tab;
  }
  
  uploadCreditReport(): void {
    this.showUploadModal = true;
  }
  
  createDispute(account?: CreditAccount): void {
    this.selectedAccount = account || null;
    this.showDisputeModal = true;
  }
  
  closeModal(): void {
    this.showUploadModal = false;
    this.showDisputeModal = false;
    this.selectedAccount = null;
  }
  
  viewDisputeDetails(dispute: DisputeItem): void {
    this.router.navigate(['/disputes', dispute.id]);
  }
  
  downloadDisputeLetter(dispute: DisputeItem): void {
    // Implement letter download
    this.notificationService.showSuccess('Dispute letter downloaded');
  }
  
  // Utility Methods
  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'badge-warning',
      'investigating': 'badge-primary',
      'resolved': 'badge-success',
      'rejected': 'badge-danger',
      'current': 'badge-success',
      'open': 'badge-success',
      'closed': 'badge-secondary',
      'disputed': 'badge-warning'
    };
    return statusClasses[status] || 'badge-secondary';
  }
  
  getImpactClass(impact: string): string {
    const impactClasses: { [key: string]: string } = {
      'positive': 'text-success',
      'negative': 'text-danger',
      'neutral': 'text-muted'
    };
    return impactClasses[impact] || 'text-muted';
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
  
  private getNextMilestone(): string {
    const currentStep = this.progressSteps.find(s => s.status === 'current');
    return currentStep ? currentStep.title : 'Program Complete';
  }
  
  private getMockDisputes(): DisputeItem[] {
    return [
      {
        id: '1',
        creditor: 'Capital One',
        accountNumber: '****1234',
        disputeReason: 'Inaccurate payment history',
        status: 'investigating',
        dateSent: new Date('2024-01-10'),
        nextAction: 'Await bureau response'
      },
      {
        id: '2',
        creditor: 'Discover',
        accountNumber: '****5678',
        disputeReason: 'Account not mine',
        status: 'resolved',
        dateSent: new Date('2024-01-05'),
        responseDate: new Date('2024-01-20'),
        outcome: 'Account removed'
      },
      {
        id: '3',
        creditor: 'Synchrony Bank',
        accountNumber: '****9012',
        disputeReason: 'Incorrect balance',
        status: 'pending',
        dateSent: new Date('2024-01-15'),
        nextAction: 'Follow up with bureau'
      }
    ];
  }
  
  // Filter Methods
  get filteredDisputes(): DisputeItem[] {
    if (this.disputeFilter === 'all') {
      return this.disputes;
    }
    return this.disputes.filter(dispute => dispute.status === this.disputeFilter);
  }
  
  get filteredAccounts(): CreditAccount[] {
    if (this.accountFilter === 'all') {
      return this.creditAccounts;
    }
    return this.creditAccounts.filter(account => account.status === this.accountFilter);
  }
  
  // Progress Calculation
  get overallProgress(): number {
    const completedSteps = this.progressSteps.filter(s => s.status === 'completed').length;
    return Math.round((completedSteps / this.progressSteps.length) * 100);
  }
  
  get currentStepNumber(): number {
    const currentStep = this.progressSteps.find(s => s.status === 'current');
    return currentStep ? currentStep.step : this.progressSteps.length;
  }
}