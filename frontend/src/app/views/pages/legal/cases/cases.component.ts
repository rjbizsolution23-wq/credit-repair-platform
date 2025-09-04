import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cases.component.html',
  styleUrls: ['./cases.component.scss']
})
export class CasesComponent implements OnInit {
  mode: string = 'list';
  caseId: string | null = null;
  cases: any[] = [];
  selectedCase: any = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    // Get mode from route data
    this.route.data.subscribe(data => {
      this.mode = data['mode'] || 'list';
    });

    // Get case ID from route params
    this.route.params.subscribe(params => {
      this.caseId = params['id'] || null;
    });

    this.loadCases();
  }

  loadCases(): void {
    // Mock data for now
    this.cases = [
      {
        id: '1',
        caseNumber: 'CASE-2024-001',
        clientName: 'John Smith',
        caseType: 'Credit Dispute',
        status: 'Active',
        priority: 'High',
        createdDate: new Date('2024-01-15'),
        lastActivity: new Date('2024-01-20'),
        description: 'Dispute of inaccurate credit report items'
      },
      {
        id: '2',
        caseNumber: 'CASE-2024-002',
        clientName: 'Jane Doe',
        caseType: 'FCRA Violation',
        status: 'Under Review',
        priority: 'Medium',
        createdDate: new Date('2024-01-10'),
        lastActivity: new Date('2024-01-18'),
        description: 'Potential FCRA violation by credit bureau'
      },
      {
        id: '3',
        caseNumber: 'CASE-2024-003',
        clientName: 'Mike Johnson',
        caseType: 'Identity Theft',
        status: 'Resolved',
        priority: 'High',
        createdDate: new Date('2024-01-05'),
        lastActivity: new Date('2024-01-25'),
        description: 'Identity theft case with fraudulent accounts'
      }
    ];

    if (this.caseId) {
      this.selectedCase = this.cases.find(c => c.id === this.caseId);
    }
  }

  createCase(): void {
    this.router.navigate(['/legal/cases/create']);
  }

  editCase(id: string): void {
    this.router.navigate(['/legal/cases', id, 'edit']);
  }

  viewCase(id: string): void {
    this.router.navigate(['/legal/cases', id]);
  }

  deleteCase(id: string): void {
    if (confirm('Are you sure you want to delete this case?')) {
      this.cases = this.cases.filter(c => c.id !== id);
    }
  }

  saveCase(): void {
    // Implementation for saving case
    console.log('Saving case...');
    this.router.navigate(['/legal/cases']);
  }

  cancelEdit(): void {
    this.router.navigate(['/legal/cases']);
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-danger';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-primary';
      case 'under review': return 'bg-warning';
      case 'resolved': return 'bg-success';
      case 'closed': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}