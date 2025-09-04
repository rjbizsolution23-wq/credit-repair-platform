import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface AuthResponse {
  success: boolean;
  token?: string;
  trackingToken?: string;
  customerToken?: string;
  message?: string;
}

interface CreditScoreType {
  riskScore: string;
  scoreName: string;
  populationRank: string;
  inquiriesAffectedScore?: string;
  CreditScoreFactor: {
    bureauCode: string;
    FactorType: 'Positive' | 'Negative';
    Factor: {
      abbreviation: string;
      description: string;
      symbol: string;
      rank: string;
    };
    FactorText: string | {
      FactorText: string;
    }[];
  }[];
  CreditScoreModel: {
    abbreviation: string;
    description: string;
    symbol: string;
    rank: string;
  };
  Source: {
    BorrowerKey: string;
    Bureau: {
      abbreviation: string;
      description: string;
      symbol: string;
      rank: string;
    };
    InquiryDate: string;
    Reference: string;
  };
}

interface BundleComponent {
  Type: string;
  CreditScoreType?: CreditScoreType;
}

interface CreditReport {
  success: boolean;
  data?: {
    BundleComponent: BundleComponent[];
    scores?: {
      transunion: number;
      equifax: number;
      experian: number;
      average: number;
    };
    negativeFactors?: string[];
    positiveFactors?: string[];
    recommendations?: string[];
  };
  message?: string;
}

interface EnrollmentData {
  trackingToken: string;
  customerToken: string;
  creditCard: string;
  name: string;
  cvv: string;
  cardMonth: string;
  cardYear: string;
  isConfirmedTerms: boolean;
  billAddress: string;
  billzip: string;
}

interface IDVerificationData {
  trackingToken: string;
  customerToken: string;
  ssn: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface SecurityQuestionsData {
  trackingToken: string;
  customerToken: string;
  questions: {
    questionId: string;
    answer: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class MyFreeScoreService {
  private baseUrl = 'https://api.myfreescorenow.com/api';
  private authToken: string | null = null;
  private trackingToken: string | null = null;
  private customerToken: string | null = null;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Demo credentials
  private demoCredentials = {
    username: 'rickjefferson@rickjeffersonsolutions.com',
    password: 'Credit2024!'
  };

  constructor(private http: HttpClient) {}

  // Authentication methods
  login(username: string, password: string): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {
      username,
      password
    }, { headers }).pipe(
      map(response => {
        if (response.success && response.token) {
          this.setAuthToken(response.token);
          if (response.trackingToken) this.trackingToken = response.trackingToken;
          if (response.customerToken) this.customerToken = response.customerToken;
          this.isAuthenticatedSubject.next(true);
        }
        return response;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of({ success: false, message: 'Login failed' });
      })
    );
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('mfs_auth_token', token);
  }

  private clearAuth(): void {
    this.authToken = null;
    this.trackingToken = null;
    this.customerToken = null;
    localStorage.removeItem('mfs_auth_token');
    localStorage.removeItem('mfs_tracking_token');
    localStorage.removeItem('mfs_customer_token');
    this.isAuthenticatedSubject.next(false);
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    });
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Enrollment methods
  startEnrollment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/enroll/start`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.trackingToken) this.trackingToken = response.trackingToken;
        if (response.customerToken) this.customerToken = response.customerToken;
        return response;
      }),
      catchError(error => {
        console.error('Start enrollment error:', error);
        return of({ success: false, message: 'Enrollment start failed' });
      })
    );
  }

  idVerification(data: IDVerificationData): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/enroll/idverification`, {
      ...data,
      trackingToken: this.trackingToken,
      customerToken: this.customerToken
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('ID verification error:', error);
        return of({ success: false, message: 'ID verification failed' });
      })
    );
  }

  updateCreditCard(data: EnrollmentData): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/enroll/updatecard`, {
      ...data,
      trackingToken: this.trackingToken || data.trackingToken,
      customerToken: this.customerToken || data.customerToken
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Update credit card error:', error);
        return of({ success: false, message: 'Credit card update failed' });
      })
    );
  }

  updateSecurityQuestions(data: SecurityQuestionsData): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/enroll/securityquestions`, {
      ...data,
      trackingToken: this.trackingToken || data.trackingToken,
      customerToken: this.customerToken || data.customerToken
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Update security questions error:', error);
        return of({ success: false, message: 'Security questions update failed' });
      })
    );
  }

  // Credit report methods
  get3BCreditReport(username?: string, password?: string): Observable<CreditReport> {
    const credentials = {
      username: username || this.demoCredentials.username,
      password: password || this.demoCredentials.password
    };

    return this.http.post<any>(`${this.baseUrl}/auth/3B/report.json`, credentials, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response && response.BundleComponent) {
          const processedData = this.processCreditReportData(response);
          return {
            success: true,
            data: processedData
          };
        }
        return { success: false, message: 'No credit report data available' };
      }),
      catchError(error => {
        console.error('Credit report error:', error);
        return of({ success: false, message: 'Failed to retrieve credit report' });
      })
    );
  }

  private processCreditReportData(rawData: any): any {
    const bundleComponents = rawData.BundleComponent || [];
    const scores = this.extractScores(bundleComponents);
    const factors = this.extractFactors(bundleComponents);
    
    return {
      BundleComponent: bundleComponents,
      scores,
      negativeFactors: factors.negative,
      positiveFactors: factors.positive,
      recommendations: this.generateRecommendations(factors.negative),
      reportDate: new Date().toISOString(),
      bureauData: this.extractBureauData(bundleComponents)
    };
  }

  private extractScores(bundleComponents: any[]): any {
    const scores = { transunion: 0, equifax: 0, experian: 0, average: 0 };
    
    bundleComponents.forEach(component => {
      if (component.CreditScoreType && component.CreditScoreType.riskScore) {
        const score = parseInt(component.CreditScoreType.riskScore);
        const bureau = component.CreditScoreType.Source?.Bureau?.abbreviation;
        
        switch (bureau) {
          case 'TUC':
            scores.transunion = score;
            break;
          case 'EQF':
            scores.equifax = score;
            break;
          case 'EXP':
            scores.experian = score;
            break;
        }
      }
    });
    
    const validScores = [scores.transunion, scores.equifax, scores.experian].filter(s => s > 0);
    scores.average = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
    return scores;
  }

  private extractBureauData(bundleComponents: any[]): any {
    const bureauData: any = {};
    
    bundleComponents.forEach(component => {
      if (component.CreditScoreType && component.CreditScoreType.Source) {
        const bureau = component.CreditScoreType.Source.Bureau.abbreviation;
        bureauData[bureau] = {
          score: parseInt(component.CreditScoreType.riskScore),
          scoreName: component.CreditScoreType.scoreName,
          populationRank: component.CreditScoreType.populationRank,
          inquiryDate: component.CreditScoreType.Source.InquiryDate,
          factors: component.CreditScoreType.CreditScoreFactor || []
        };
      }
    });
    
    return bureauData;
  }

  private extractFactors(bundleComponents: any[]): { negative: string[], positive: string[] } {
    const negative: string[] = [];
    const positive: string[] = [];
    
    bundleComponents.forEach(component => {
      if (component.CreditScoreType && component.CreditScoreType.CreditScoreFactor) {
        component.CreditScoreType.CreditScoreFactor.forEach((factor: any) => {
          let factorText = '';
          
          if (typeof factor.FactorText === 'string') {
            factorText = factor.FactorText;
          } else if (Array.isArray(factor.FactorText)) {
            factorText = factor.FactorText.map(f => f.FactorText || f).join(' ');
          }
            
          if (factor.FactorType === 'Negative' && factorText) {
            negative.push(factorText);
          } else if (factor.FactorType === 'Positive' && factorText) {
            positive.push(factorText);
          }
        });
      }
    });
    
    return { negative: [...new Set(negative)], positive: [...new Set(positive)] };
  }

  private generateRecommendations(negativeFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    negativeFactors.forEach(factor => {
      const lowerFactor = factor.toLowerCase();
      
      if (lowerFactor.includes('payment') || lowerFactor.includes('late')) {
        recommendations.push('Set up automatic payments to ensure on-time payments');
      }
      if (lowerFactor.includes('utilization') || lowerFactor.includes('balance') || lowerFactor.includes('high')) {
        recommendations.push('Pay down credit card balances to reduce utilization below 30%');
      }
      if (lowerFactor.includes('bankruptcy')) {
        recommendations.push('Focus on rebuilding credit with secured cards and consistent on-time payments');
      }
      if (lowerFactor.includes('inquiry') || lowerFactor.includes('inquiries')) {
        recommendations.push('Limit new credit applications to reduce hard inquiries');
      }
      if (lowerFactor.includes('derogatory') || lowerFactor.includes('negative')) {
        recommendations.push('Consider disputing inaccurate negative items on your credit report');
      }
      if (lowerFactor.includes('length') || lowerFactor.includes('history')) {
        recommendations.push('Keep older accounts open to maintain credit history length');
      }
    });
    
    if (recommendations.length === 0) {
      recommendations.push('Continue maintaining good credit habits and monitor your credit regularly');
    }
    
    return [...new Set(recommendations)];
  }

  logout(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/logout`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(() => {
        this.clearAuth();
        return { success: true };
      }),
      catchError(error => {
        console.error('Logout error:', error);
        this.clearAuth();
        return of({ success: true });
      })
    );
  }

  // Credit Score Analysis
  analyzeCreditScore(reportData: any): any {
    const scores = {
      transunion: 0,
      equifax: 0,
      experian: 0
    };

    if (reportData?.data?.BundleComponent) {
      reportData.data.BundleComponent.forEach((component: any) => {
        if (component.Type === 'TUCVantageScoreV6') {
          scores.transunion = parseInt(component.CreditScoreType?.riskScore || '0');
        } else if (component.Type === 'EQFVantageScoreV6') {
          scores.equifax = parseInt(component.CreditScoreType?.riskScore || '0');
        } else if (component.Type === 'EXPVantageScoreV6') {
          scores.experian = parseInt(component.CreditScoreType?.riskScore || '0');
        }
      });
    }

    const averageScore = Math.round((scores.transunion + scores.equifax + scores.experian) / 3);
    
    return {
      scores,
      averageScore,
      creditGrade: this.getCreditGrade(averageScore),
      improvementPotential: this.calculateImprovementPotential(scores)
    };
  }

  // Get credit grade based on score
  private getCreditGrade(score: number): string {
    if (score >= 781) return 'Excellent';
    if (score >= 661) return 'Good';
    if (score >= 601) return 'Fair';
    if (score >= 500) return 'Poor';
    return 'Very Poor';
  }

  // Calculate improvement potential
  private calculateImprovementPotential(scores: any): number {
    const maxPossible = 850;
    const currentAverage = (scores.transunion + scores.equifax + scores.experian) / 3;
    return Math.round(maxPossible - currentAverage);
  }

  // Extract negative factors for dispute recommendations
  extractNegativeFactors(reportData: any): any[] {
    const negativeFactors: any[] = [];
    
    if (reportData?.data?.BundleComponent) {
      reportData.data.BundleComponent.forEach((component: any) => {
        if (component.CreditScoreType?.CreditScoreFactor) {
          component.CreditScoreType.CreditScoreFactor.forEach((factor: any) => {
            if (factor.FactorType === 'Negative') {
              negativeFactors.push({
                bureau: component.Type.includes('TUC') ? 'TransUnion' : 
                       component.Type.includes('EQF') ? 'Equifax' : 'Experian',
                factorCode: factor.bureauCode,
                description: factor.FactorText || factor.Factor?.description,
                impact: 'High' // Default impact level
              });
            }
          });
        }
      });
    }
    
    return negativeFactors;
  }

  // Generate dispute recommendations
  generateDisputeRecommendations(negativeFactors: any[]): any[] {
    return negativeFactors.map(factor => {
      let disputeType = 'General Dispute';
      let template = 'standard_dispute';
      
      if (factor.factorCode === '98') {
        disputeType = 'Bankruptcy Dispute';
        template = 'bankruptcy_dispute';
      } else if (factor.description?.toLowerCase().includes('payment')) {
        disputeType = 'Payment History Dispute';
        template = 'payment_dispute';
      } else if (factor.description?.toLowerCase().includes('balance')) {
        disputeType = 'Balance Dispute';
        template = 'balance_dispute';
      }
      
      return {
        bureau: factor.bureau,
        disputeType,
        template,
        priority: factor.impact === 'High' ? 1 : 2,
        estimatedImpact: this.estimateScoreImpact(factor.factorCode)
      };
    });
  }

  // Estimate score impact of removing negative item
  private estimateScoreImpact(factorCode: string): number {
    const impactMap: { [key: string]: number } = {
      '98': 50, // Bankruptcy
      '40': 30, // Late payments
      '14': 25, // High balances
      '10': 20, // Too many inquiries
    };
    
    return impactMap[factorCode] || 15;
  }

  // Analysis methods
  calculateAverageScore(scores: any): number {
    const validScores = Object.values(scores).filter(score => typeof score === 'number' && score > 0) as number[];
    return validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  }

  getCreditGradeColor(score: number): string {
    if (score >= 800) return '#28a745'; // Green
    if (score >= 740) return '#20c997'; // Teal
    if (score >= 670) return '#ffc107'; // Yellow
    if (score >= 580) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  }

  getImprovementPotential(currentScore: number): { potential: number, timeframe: string, actions: string[] } {
    if (currentScore < 580) {
      return { 
        potential: 100, 
        timeframe: '12-18 months',
        actions: ['Pay all bills on time', 'Reduce credit utilization', 'Consider secured credit cards']
      };
    } else if (currentScore < 670) {
      return { 
        potential: 70, 
        timeframe: '6-12 months',
        actions: ['Maintain on-time payments', 'Pay down existing debt', 'Avoid new credit inquiries']
      };
    } else if (currentScore < 740) {
      return { 
        potential: 50, 
        timeframe: '3-6 months',
        actions: ['Optimize credit utilization', 'Keep old accounts open', 'Monitor credit reports']
      };
    } else {
      return { 
        potential: 20, 
        timeframe: '1-3 months',
        actions: ['Maintain excellent habits', 'Consider credit limit increases', 'Monitor for errors']
      };
    }
  }

  private getEstimatedTimeframe(factor: string): string {
    const lowerFactor = factor.toLowerCase();
    if (lowerFactor.includes('utilization') || lowerFactor.includes('balance')) return '1-2 months';
    if (lowerFactor.includes('payment') || lowerFactor.includes('late')) return '2-4 months';
    if (lowerFactor.includes('inquiry')) return '1-3 months';
    if (lowerFactor.includes('bankruptcy') || lowerFactor.includes('foreclosure')) return '6-12 months';
    return '3-6 months';
  }

  private getDifficultyLevel(factor: string): 'Easy' | 'Medium' | 'Hard' {
    const lowerFactor = factor.toLowerCase();
    if (lowerFactor.includes('utilization') || lowerFactor.includes('balance')) return 'Easy';
    if (lowerFactor.includes('inquiry')) return 'Easy';
    if (lowerFactor.includes('payment') || lowerFactor.includes('late')) return 'Medium';
    if (lowerFactor.includes('bankruptcy') || lowerFactor.includes('foreclosure')) return 'Hard';
    return 'Medium';
  }

  // Utility methods for demo data
  getDemoData(): Observable<CreditReport> {
    const demoReport = {
      success: true,
      data: {
        BundleComponent: [],
        scores: {
          transunion: 650,
          equifax: 645,
          experian: 655,
          average: 650
        },
        negativeFactors: [
          'High credit card utilization',
          'Recent late payment on credit card',
          'Too many recent credit inquiries'
        ],
        positiveFactors: [
          'Good payment history overall',
          'Mix of credit types',
          'Established credit history'
        ],
        recommendations: [
          'Pay down credit card balances to reduce utilization below 30%',
          'Set up automatic payments to ensure on-time payments',
          'Limit new credit applications to reduce hard inquiries'
        ],
        reportDate: new Date().toISOString(),
        bureauData: {
          TUC: { score: 650, scoreName: 'VantageScore3', populationRank: '45' },
          EQF: { score: 645, scoreName: 'VantageScore3', populationRank: '43' },
          EXP: { score: 655, scoreName: 'VantageScore3', populationRank: '47' }
        }
      }
    };
    
    return of(demoReport);
  }
}