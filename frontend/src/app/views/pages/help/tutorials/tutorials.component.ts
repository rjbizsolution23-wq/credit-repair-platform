import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tutorials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorials.component.html',
  styleUrls: ['./tutorials.component.scss']
})
export class TutorialsComponent implements OnInit {
  tutorials = [
    {
      id: 1,
      title: 'Getting Started with Your Credit Repair Journey',
      description: 'Learn the basics of credit repair and how to use our platform effectively',
      duration: '15 min',
      difficulty: 'Beginner',
      category: 'Getting Started',
      steps: [
        'Create your account and complete profile',
        'Upload your credit reports',
        'Review your credit analysis',
        'Understand your dispute strategy'
      ]
    },
    {
      id: 2,
      title: 'Understanding the 10 Step Total Enforcement Chain™',
      description: 'Deep dive into our proprietary credit repair methodology',
      duration: '25 min',
      difficulty: 'Intermediate',
      category: 'Methodology',
      steps: [
        'Credit report analysis overview',
        'Dispute letter creation process',
        'Bureau communication strategies',
        'Progress tracking and follow-up'
      ]
    },
    {
      id: 3,
      title: 'Navigating Your Client Dashboard',
      description: 'Master your dashboard to track progress and manage your case',
      duration: '12 min',
      difficulty: 'Beginner',
      category: 'Platform Usage',
      steps: [
        'Dashboard overview and navigation',
        'Reading your credit score trends',
        'Managing documents and communications',
        'Setting up notifications and alerts'
      ]
    },
    {
      id: 4,
      title: 'Legal Rights and FCRA Compliance',
      description: 'Understand your rights under federal credit reporting laws',
      duration: '20 min',
      difficulty: 'Advanced',
      category: 'Legal Education',
      steps: [
        'FCRA basics and consumer rights',
        'Dispute process legal framework',
        'Understanding bureau obligations',
        'When to escalate disputes'
      ]
    }
  ];

  selectedTutorial: any = null;
  currentStep: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  selectTutorial(tutorial: any): void {
    this.selectedTutorial = tutorial;
    this.currentStep = 0;
  }

  nextStep(): void {
    if (this.currentStep < this.selectedTutorial.steps.length - 1) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'badge-success';
      case 'intermediate': return 'badge-warning';
      case 'advanced': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Getting Started': return '🚀';
      case 'Methodology': return '📋';
      case 'Platform Usage': return '💻';
      case 'Legal Education': return '⚖️';
      default: return '📚';
    }
  }
}