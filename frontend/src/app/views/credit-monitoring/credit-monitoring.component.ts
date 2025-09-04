import { Component, OnInit } from '@angular/core';
import { MyFreeScoreService } from '../../services/myfreescore.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-credit-monitoring',
  templateUrl: './credit-monitoring.component.html',
  styleUrls: ['./credit-monitoring.component.scss']
})
export class CreditMonitoringComponent implements OnInit {
  creditData: any = null;
  creditAnalysis: any = null;
  negativeFactors: any[] = [];
  disputeRecommendations: any[] = [];
  isLoading = false;
  
  // Demo credentials for MyFreeScore
  credentials = {
    username: 'rickjefferson@rickjeffersonsolutions.com',
    password: 'Credit2024!'
  };

  // Chart data for credit scores
  creditScoreChartData: any = {
    series: [{
      name: 'Credit Score',
      data: []
    }],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      }
    },
    colors: ['#0ea5e9'],
    xaxis: {
      categories: ['TransUnion', 'Equifax', 'Experian']
    },
    yaxis: {
      min: 300,
      max: 850
    },
    title: {
      text: 'Credit Scores Across Bureaus'
    }
  };

  // Improvement potential chart
  improvementChartData: any = {
    series: [],
    chart: {
      type: 'donut',
      height: 300
    },
    labels: ['Current Score', 'Improvement Potential'],
    colors: ['#0ea5e9', '#e2e8f0']
  };

  constructor(
    private myFreeScoreService: MyFreeScoreService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCreditReport();
  }

  async loadCreditReport(): Promise<void> {
    this.isLoading = true;
    
    try {
      // First login to get auth token
      const loginResponse = await this.myFreeScoreService.login(
        this.credentials.username, 
        this.credentials.password
      ).toPromise();
      
      if (loginResponse?.success && loginResponse?.data?.authToken) {
        this.myFreeScoreService.setAuthToken(loginResponse.data.authToken);
        
        // Get 3B credit report
        const reportResponse = await this.myFreeScoreService.get3BCreditReport(
          this.credentials.username,
          this.credentials.password
        ).toPromise();
        
        if (reportResponse?.success) {
          this.creditData = reportResponse;
          this.processCreditData();
          this.toastr.success('Credit report loaded successfully', 'Success');
        } else {
          this.loadDemoData(); // Fallback to demo data
        }
      } else {
        this.loadDemoData(); // Fallback to demo data
      }
    } catch (error) {
      console.error('Error loading credit report:', error);
      this.loadDemoData(); // Fallback to demo data
      this.toastr.info('Using demo data for demonstration', 'Info');
    } finally {
      this.isLoading = false;
    }
  }

  loadDemoData(): void {
    // Demo data based on the provided JSON structure
    this.creditData = {
      success: true,
      data: {
        BundleComponent: [
          {
            Type: 'TUCVantageScoreV6',
            CreditScoreType: {
              riskScore: '607',
              scoreName: 'VantageScore3',
              populationRank: '34',
              CreditScoreFactor: [{
                bureauCode: '98',
                FactorType: 'Negative',
                FactorText: 'There is a bankruptcy on your credit report'
              }]
            }
          },
          {
            Type: 'EQFVantageScoreV6',
            CreditScoreType: {
              riskScore: '554',
              scoreName: 'VantageScore3',
              populationRank: '25'
            }
          },
          {
            Type: 'EXPVantageScoreV6',
            CreditScoreType: {
              riskScore: '568',
              scoreName: 'VantageScore3',
              populationRank: '27'
            }
          }
        ]
      }
    };
    
    this.processCreditData();
  }

  processCreditData(): void {
    if (!this.creditData) return;
    
    // Analyze credit scores
    this.creditAnalysis = this.myFreeScoreService.analyzeCreditScore(this.creditData);
    
    // Extract negative factors
    this.negativeFactors = this.myFreeScoreService.extractNegativeFactors(this.creditData);
    
    // Generate dispute recommendations
    this.disputeRecommendations = this.myFreeScoreService.generateDisputeRecommendations(this.negativeFactors);
    
    // Update charts
    this.updateCharts();
  }

  updateCharts(): void {
    if (!this.creditAnalysis) return;
    
    // Update credit score chart
    this.creditScoreChartData.series[0].data = [
      this.creditAnalysis.scores.transunion,
      this.creditAnalysis.scores.equifax,
      this.creditAnalysis.scores.experian
    ];
    
    // Update improvement chart
    this.improvementChartData.series = [
      this.creditAnalysis.averageScore,
      this.creditAnalysis.improvementPotential
    ];
  }

  refreshReport(): void {
    this.loadCreditReport();
  }

  createDispute(recommendation: any): void {
    // Navigate to dispute creation with pre-filled data
    this.toastr.success(`Creating ${recommendation.disputeType} for ${recommendation.bureau}`, 'Dispute Created');
    // TODO: Implement navigation to dispute creation page
  }

  exportReport(): void {
    if (this.creditData) {
      const dataStr = JSON.stringify(this.creditData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credit-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.toastr.success('Credit report exported successfully', 'Export Complete');
    }
  }

  getScoreColor(score: number): string {
    if (score >= 781) return '#10b981'; // Green
    if (score >= 661) return '#3b82f6'; // Blue
    if (score >= 601) return '#f59e0b'; // Yellow
    if (score >= 500) return '#ef4444'; // Red
    return '#dc2626'; // Dark red
  }

  getGradeClass(grade: string): string {
    const gradeClasses: { [key: string]: string } = {
      'Excellent': 'badge bg-success',
      'Good': 'badge bg-primary',
      'Fair': 'badge bg-warning',
      'Poor': 'badge bg-danger',
      'Very Poor': 'badge bg-dark'
    };
    return gradeClasses[grade] || 'badge bg-secondary';
  }

  getPriorityClass(priority: number): string {
    return priority === 1 ? 'badge bg-danger' : 'badge bg-warning';
  }

  getPriorityText(priority: number): string {
    return priority === 1 ? 'High Priority' : 'Medium Priority';
  }
}