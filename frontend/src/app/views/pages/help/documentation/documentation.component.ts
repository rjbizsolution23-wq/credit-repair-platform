import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent implements OnInit {
  documentationSections = [
    {
      title: 'Platform Overview',
      items: [
        {
          title: 'Getting Started with Rick Jefferson Solutions',
          description: 'Complete guide to using our credit repair platform',
          content: 'Learn how to navigate the platform, understand the dashboard, and access key features.'
        },
        {
          title: 'Dashboard Navigation',
          description: 'Understanding your main dashboard and key metrics',
          content: 'Your dashboard provides real-time insights into your credit repair progress and case status.'
        }
      ]
    },
    {
      title: '10 Step Total Enforcement Chain™',
      items: [
        {
          title: 'Step 1: Credit Report Analysis',
          description: 'Comprehensive review of all three credit bureaus',
          content: 'We analyze your credit reports from Experian, Equifax, and TransUnion to identify inaccuracies.'
        },
        {
          title: 'Step 2: Dispute Letter Creation',
          description: 'Professional dispute letters based on FCRA guidelines',
          content: 'Our system generates legally compliant dispute letters targeting specific inaccuracies.'
        },
        {
          title: 'Step 3: Bureau Communication',
          description: 'Direct communication with credit bureaus',
          content: 'We handle all correspondence with credit bureaus on your behalf.'
        }
      ]
    },
    {
      title: 'Legal Compliance',
      items: [
        {
          title: 'FCRA Compliance Guidelines',
          description: 'Fair Credit Reporting Act requirements and procedures',
          content: 'Understanding your rights under FCRA and how we ensure compliance in all our processes.'
        },
        {
          title: 'FDCPA Protection',
          description: 'Fair Debt Collection Practices Act protections',
          content: 'How we protect you from unfair debt collection practices and ensure your rights are respected.'
        }
      ]
    },
    {
      title: 'Client Portal Features',
      items: [
        {
          title: 'Document Management',
          description: 'Upload, view, and manage your credit-related documents',
          content: 'Securely store and access all your credit repair documents in one place.'
        },
        {
          title: 'Progress Tracking',
          description: 'Monitor your credit repair progress in real-time',
          content: 'Track dispute status, score improvements, and milestone achievements.'
        }
      ]
    }
  ];

  selectedSection: any = null;
  selectedItem: any = null;

  constructor() { }

  ngOnInit(): void {
    // Select first section and item by default
    if (this.documentationSections.length > 0) {
      this.selectedSection = this.documentationSections[0];
      if (this.selectedSection.items.length > 0) {
        this.selectedItem = this.selectedSection.items[0];
      }
    }
  }

  selectSection(section: any): void {
    this.selectedSection = section;
    if (section.items.length > 0) {
      this.selectedItem = section.items[0];
    }
  }

  selectItem(item: any): void {
    this.selectedItem = item;
  }
}