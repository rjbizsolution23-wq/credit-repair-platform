import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

// Models
import {
  DisputeStatus,
  DisputeType,
  CreditBureau,
  getDisputeStatusLabel,
  getDisputeStatusColor,
  getDisputeTypeLabel,
  getCreditBureauLabel
} from '../disputes.model';

// Services
import { DisputesService } from '../disputes.service';

interface DisputeStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  success_rate: number;
}

interface RecentDispute {
  id: string;
  client_name: string;
  type: DisputeType;
  bureau: CreditBureau;
  status: DisputeStatus;
  created_date: Date;
  due_date: Date;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-disputes-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule, FeatherIconDirective],
  templateUrl: './disputes-overview.component.html',
  styleUrls: ['./disputes-overview.component.scss']
})
export class DisputesOverviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = false;
  error: string | null = null;
  
  // Make Math available in template
  Math = Math;
  
  // Data
  stats: DisputeStats = {
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
    success_rate: 0
  };
  
  recentDisputes: RecentDispute[] = [];
  chartData: any = null;
  
  // Quick Actions
  quickActions: QuickAction[] = [
    {
      title: 'Generate Dispute',
      description: 'Create new dispute letters',
      icon: 'file-plus',
      route: '/disputes/generator',
      color: 'primary'
    },
    {
      title: 'Active Disputes',
      description: 'View ongoing disputes',
      icon: 'clock',
      route: '/disputes/active',
      color: 'warning'
    },
    {
      title: 'Templates',
      description: 'Manage letter templates',
      icon: 'file-text',
      route: '/disputes/templates',
      color: 'info'
    },
    {
      title: 'Analytics',
      description: 'View dispute analytics',
      icon: 'bar-chart-2',
      route: '/disputes/analytics',
      color: 'success'
    }
  ];
  
  constructor(
    private disputesService: DisputesService
  ) {}
  
  ngOnInit(): void {
    this.loadOverviewData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadOverviewData(): void {
    this.loading = true;
    this.error = null;
    
    // Load statistics
    this.disputesService.getDisputeStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading dispute stats:', error);
          this.error = 'Failed to load dispute statistics';
        }
      });
    
    // Load recent disputes
    this.disputesService.getRecentDisputes(5)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (disputes) => {
          this.recentDisputes = disputes;
        },
        error: (error) => {
          console.error('Error loading recent disputes:', error);
        }
      });
    
    // Load chart data
    this.disputesService.getDisputeChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chartData) => {
          this.chartData = chartData;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading chart data:', error);
          this.loading = false;
        }
      });
  }
  
  onRefresh(): void {
    this.loadOverviewData();
  }
  
  // Helper methods for templates
  getDisputeStatusLabel = getDisputeStatusLabel;
  getDisputeStatusColor = getDisputeStatusColor;
  getDisputeTypeLabel = getDisputeTypeLabel;
  getCreditBureauLabel = getCreditBureauLabel;
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
  
  getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  isOverdue(dueDate: Date): boolean {
    return this.getDaysUntilDue(dueDate) < 0;
  }
}