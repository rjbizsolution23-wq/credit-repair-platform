import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CreditBuildingService } from './credit-building.service';
import {
  CreditBuildingStrategy,
  CreditRecommendation,
  CreditGoal,
  CreditBuildingAnalytics,
  StrategyStatus,
  RecommendationPriority,
  GoalStatus,
  getStrategyStatusColor,
  getRecommendationPriorityColor,
  getGoalStatusColor,
  formatCurrency,
  formatDate,
  getTimeAgo,
  calculateSuccessRate
} from './credit-building.model';

export interface OverviewStats {
  totalStrategies: number;
  activeStrategies: number;
  completedStrategies: number;
  averageProgress: number;
  totalRecommendations: number;
  pendingRecommendations: number;
  totalGoals: number;
  achievedGoals: number;
  averageCreditScoreImprovement: number;
  successRate: number;
}

export interface RecentActivity {
  id: string;
  type: 'strategy' | 'recommendation' | 'goal' | 'progress';
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  clientName?: string;
  impact?: number;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-credit-building-overview',
  templateUrl: './credit-building-overview.component.html',
  styleUrls: ['./credit-building-overview.component.scss']
})
export class CreditBuildingOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Loading and Error States
  isLoading = false;
  error: string | null = null;
  
  // Data
  stats: OverviewStats = {
    totalStrategies: 0,
    activeStrategies: 0,
    completedStrategies: 0,
    averageProgress: 0,
    totalRecommendations: 0,
    pendingRecommendations: 0,
    totalGoals: 0,
    achievedGoals: 0,
    averageCreditScoreImprovement: 0,
    successRate: 0
  };
  
  strategies: CreditBuildingStrategy[] = [];
  recommendations: CreditRecommendation[] = [];
  goals: CreditGoal[] = [];
  analytics: CreditBuildingAnalytics | null = null;
  recentActivity: RecentActivity[] = [];
  
  // Chart Data
  strategiesByTypeChart: ChartData = { labels: [], datasets: [] };
  recommendationsByPriorityChart: ChartData = { labels: [], datasets: [] };
  progressTrendChart: ChartData = { labels: [], datasets: [] };
  
  // Quick Actions
  quickActions = [
    {
      title: 'Create Strategy',
      description: 'Design a new credit building strategy',
      icon: 'fas fa-plus-circle',
      color: 'primary',
      route: '/credit-building/strategies/create'
    },
    {
      title: 'Set Goal',
      description: 'Define a new credit building goal',
      icon: 'fas fa-target',
      color: 'success',
      route: '/credit-building/goals/create'
    },
    {
      title: 'View Recommendations',
      description: 'Review AI-generated recommendations',
      icon: 'fas fa-lightbulb',
      color: 'warning',
      route: '/credit-building/recommendations'
    },
    {
      title: 'Track Progress',
      description: 'Monitor credit building progress',
      icon: 'fas fa-chart-line',
      color: 'info',
      route: '/credit-building/progress'
    },
    {
      title: 'Education Center',
      description: 'Access credit education resources',
      icon: 'fas fa-graduation-cap',
      color: 'secondary',
      route: '/credit-building/education'
    },
    {
      title: 'Credit Tools',
      description: 'Use credit building calculators and tools',
      icon: 'fas fa-tools',
      color: 'dark',
      route: '/credit-building/tools'
    }
  ];
  
  constructor(
    private creditBuildingService: CreditBuildingService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    this.isLoading = true;
    this.error = null;
    
    combineLatest([
      this.creditBuildingService.getStrategies({ }, { page: 1, limit: 100 }),
      this.creditBuildingService.getRecommendations({ }, { page: 1, limit: 100 }),
      this.creditBuildingService.getGoals({ }, { page: 1, limit: 100 }),
      this.creditBuildingService.getAnalytics()
    ])
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    )
    .subscribe({
      next: ([strategiesResponse, recommendationsResponse, goalsResponse, analytics]) => {
        this.strategies = strategiesResponse.data;
        this.recommendations = recommendationsResponse.data;
        this.goals = goalsResponse.data;
        this.analytics = analytics;
        
        this.calculateStats();
        this.generateRecentActivity();
        this.prepareChartData();
      },
      error: (error) => {
        console.error('Error loading credit building overview data:', error);
        this.error = 'Failed to load overview data. Please try again.';
      }
    });
  }
  
  private calculateStats(): void {
    // Strategy stats
    this.stats.totalStrategies = this.strategies.length;
    this.stats.activeStrategies = this.strategies.filter(s => s.status === StrategyStatus.ACTIVE).length;
    this.stats.completedStrategies = this.strategies.filter(s => s.status === StrategyStatus.COMPLETED).length;
    this.stats.averageProgress = this.strategies.length > 0 
      ? Math.round(this.strategies.reduce((sum, s) => sum + s.progress, 0) / this.strategies.length)
      : 0;
    
    // Recommendation stats
    this.stats.totalRecommendations = this.recommendations.length;
    this.stats.pendingRecommendations = this.recommendations.filter(r => 
      r.status === 'pending' || r.status === 'in_progress'
    ).length;
    
    // Goal stats
    this.stats.totalGoals = this.goals.length;
    this.stats.achievedGoals = this.goals.filter(g => g.status === GoalStatus.COMPLETED).length;
    
    // Calculate average credit score improvement
    const completedStrategies = this.strategies.filter(s => s.status === StrategyStatus.COMPLETED);
    this.stats.averageCreditScoreImprovement = completedStrategies.length > 0
      ? Math.round(completedStrategies.reduce((sum, s) => sum + s.estimatedImpact, 0) / completedStrategies.length)
      : 0;
    
    // Calculate success rate
    this.stats.successRate = calculateSuccessRate(this.stats.completedStrategies, this.stats.totalStrategies);
  }
  
  private generateRecentActivity(): void {
    const activities: RecentActivity[] = [];
    
    // Add recent strategies
    this.strategies
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach(strategy => {
        activities.push({
          id: strategy.id,
          type: 'strategy',
          title: `Strategy: ${strategy.title}`,
          description: `${strategy.status} - ${strategy.progress}% complete`,
          timestamp: new Date(strategy.updatedAt),
          status: strategy.status,
          impact: strategy.estimatedImpact
        });
      });
    
    // Add recent recommendations
    this.recommendations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach(recommendation => {
        activities.push({
          id: recommendation.id,
          type: 'recommendation',
          title: `Recommendation: ${recommendation.title}`,
          description: `${recommendation.priority} priority - ${recommendation.status}`,
          timestamp: new Date(recommendation.updatedAt),
          status: recommendation.status,
          impact: recommendation.expectedImpact
        });
      });
    
    // Add recent goals
    this.goals
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .forEach(goal => {
        activities.push({
          id: goal.id,
          type: 'goal',
          title: `Goal: ${goal.title}`,
          description: `${goal.progress}% complete - Target: ${goal.targetValue}`,
          timestamp: new Date(goal.updatedAt),
          status: goal.status
        });
      });
    
    // Sort by timestamp and take the most recent 10
    this.recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }
  
  private prepareChartData(): void {
    this.prepareStrategiesByTypeChart();
    this.prepareRecommendationsByPriorityChart();
    this.prepareProgressTrendChart();
  }
  
  private prepareStrategiesByTypeChart(): void {
    const typeCount = new Map<string, number>();
    
    this.strategies.forEach(strategy => {
      const count = typeCount.get(strategy.type) || 0;
      typeCount.set(strategy.type, count + 1);
    });
    
    this.strategiesByTypeChart = {
      labels: Array.from(typeCount.keys()),
      datasets: [{
        data: Array.from(typeCount.values()),
        backgroundColor: [
          '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
          '#fd7e14', '#20c997', '#6c757d', '#e83e8c', '#17a2b8'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
  
  private prepareRecommendationsByPriorityChart(): void {
    const priorityCount = new Map<string, number>();
    
    this.recommendations.forEach(recommendation => {
      const count = priorityCount.get(recommendation.priority) || 0;
      priorityCount.set(recommendation.priority, count + 1);
    });
    
    const priorityColors: Record<string, string> = {
      'low': '#28a745',
      'medium': '#ffc107',
      'high': '#fd7e14',
      'critical': '#dc3545'
    };
    
    this.recommendationsByPriorityChart = {
      labels: Array.from(priorityCount.keys()),
      datasets: [{
        data: Array.from(priorityCount.values()),
        backgroundColor: Array.from(priorityCount.keys()).map(priority => 
          priorityColors[priority] || '#6c757d'
        ),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
  
  private prepareProgressTrendChart(): void {
    // Generate sample progress trend data
    const last6Months = [];
    const progressData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      
      // Calculate average progress for the month (mock data)
      const monthProgress = Math.max(0, Math.min(100, 60 + (Math.random() - 0.5) * 20 + i * 5));
      progressData.push(Math.round(monthProgress));
    }
    
    this.progressTrendChart = {
      labels: last6Months,
      datasets: [{
        label: 'Average Progress (%)',
        data: progressData,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    };
  }
  
  // Event Handlers
  onRefresh(): void {
    this.loadData();
  }
  
  onQuickAction(action: any): void {
    this.router.navigate([action.route]);
  }
  
  onViewStrategy(strategy: CreditBuildingStrategy): void {
    this.router.navigate(['/credit-building/strategies', strategy.id]);
  }
  
  onViewRecommendation(recommendation: CreditRecommendation): void {
    this.router.navigate(['/credit-building/recommendations', recommendation.id]);
  }
  
  onViewGoal(goal: CreditGoal): void {
    this.router.navigate(['/credit-building/goals', goal.id]);
  }
  
  onViewAllStrategies(): void {
    this.router.navigate(['/credit-building/strategies']);
  }
  
  onViewAllRecommendations(): void {
    this.router.navigate(['/credit-building/recommendations']);
  }
  
  onViewAllGoals(): void {
    this.router.navigate(['/credit-building/goals']);
  }
  
  onViewReports(): void {
    this.router.navigate(['/credit-building/reports']);
  }
  
  // Utility Methods
  getStrategyStatusColor = getStrategyStatusColor;
  getRecommendationPriorityColor = getRecommendationPriorityColor;
  getGoalStatusColor = getGoalStatusColor;
  formatCurrency = formatCurrency;
  formatDate = formatDate;
  getTimeAgo = getTimeAgo;
  
  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'strategy': 'fas fa-chess-knight',
      'recommendation': 'fas fa-lightbulb',
      'goal': 'fas fa-target',
      'progress': 'fas fa-chart-line'
    };
    return icons[type] || 'fas fa-circle';
  }
  
  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      'strategy': 'primary',
      'recommendation': 'warning',
      'goal': 'success',
      'progress': 'info'
    };
    return colors[type] || 'secondary';
  }
  
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'info';
    if (progress >= 40) return 'warning';
    return 'danger';
  }
  
  getImpactBadge(impact: number): { text: string; color: string } {
    if (impact >= 50) {
      return { text: 'High Impact', color: 'success' };
    } else if (impact >= 25) {
      return { text: 'Medium Impact', color: 'warning' };
    } else {
      return { text: 'Low Impact', color: 'secondary' };
    }
  }
}