import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  mode: string = 'list';
  documentId: string | null = null;
  documents: any[] = [];
  selectedDocument: any = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    // Get mode from route data
    this.route.data.subscribe(data => {
      this.mode = data['mode'] || 'list';
    });

    // Get document ID from route params
    this.route.params.subscribe(params => {
      this.documentId = params['id'] || null;
    });

    this.loadDocuments();
  }

  loadDocuments(): void {
    // Mock data for now
    this.documents = [
      {
        id: '1',
        title: 'Privacy Policy',
        type: 'Policy',
        status: 'Active',
        lastModified: new Date('2024-01-15'),
        description: 'Company privacy policy document'
      },
      {
        id: '2',
        title: 'Terms of Service',
        type: 'Agreement',
        status: 'Active',
        lastModified: new Date('2024-01-10'),
        description: 'Terms of service agreement'
      },
      {
        id: '3',
        title: 'FCRA Compliance Guide',
        type: 'Compliance',
        status: 'Draft',
        lastModified: new Date('2024-01-20'),
        description: 'Fair Credit Reporting Act compliance guidelines'
      }
    ];

    if (this.documentId) {
      this.selectedDocument = this.documents.find(doc => doc.id === this.documentId);
    }
  }

  createDocument(): void {
    this.router.navigate(['/legal/documents/create']);
  }

  editDocument(id: string): void {
    this.router.navigate(['/legal/documents', id, 'edit']);
  }

  viewDocument(id: string): void {
    this.router.navigate(['/legal/documents', id]);
  }

  deleteDocument(id: string): void {
    if (confirm('Are you sure you want to delete this document?')) {
      this.documents = this.documents.filter(doc => doc.id !== id);
    }
  }

  saveDocument(): void {
    // Implementation for saving document
    console.log('Saving document...');
    this.router.navigate(['/legal/documents']);
  }

  cancelEdit(): void {
    this.router.navigate(['/legal/documents']);
  }
}