import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-credit-scores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-scores.component.html',
  styleUrls: ['./credit-scores.component.scss']
})
export class CreditScoresComponent {
  scores = {
    transunion: 720,
    equifax: 715,
    experian: 725,
    average: 720
  };

  scoreHistory = [
    { date: '2024-01-01', score: 680 },
    { date: '2024-02-01', score: 690 },
    { date: '2024-03-01', score: 705 },
    { date: '2024-04-01', score: 720 }
  ];

  constructor() {}

  getScoreColor(score: number): string {
    if (score >= 750) return 'success';
    if (score >= 700) return 'primary';
    if (score >= 650) return 'warning';
    return 'danger';
  }

  getScoreGrade(score: number): string {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Poor';
  }
}