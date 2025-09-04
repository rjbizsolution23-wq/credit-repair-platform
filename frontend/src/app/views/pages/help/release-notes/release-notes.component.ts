import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-release-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.scss']
})
export class ReleaseNotesComponent implements OnInit {
  selectedVersion: any = null;
  filterType = 'all';
  searchTerm = '';

  releaseTypes = [
    { id: 'all', name: 'All Updates', count: 15 },
    { id: 'major', name: 'Major Releases', count: 3 },
    { id: 'minor', name: 'Minor Updates', count: 8 },
    { id: 'patch', name: 'Bug Fixes', count: 4 }
  ];

  releases = [
    {
      version: '2.1.0',
      type: 'major',
      releaseDate: '2024-02-15',
      title: 'Enhanced Dispute Management & AI Integration',
      description: 'Major update introducing AI-powered dispute letter generation and enhanced case management features.',
      highlights: [
        'AI-powered dispute letter generation using Rick Jefferson\'s 10 Step Total Enforcement Chain™',
        'Enhanced case management dashboard with real-time status tracking',
        'New client portal with improved user experience',
        'Advanced credit report analysis tools',
        'Automated follow-up scheduling system'
      ],
      changes: {
        new: [
          'AI Dispute Letter Generator with FCRA compliance checks',
          'Real-time case status dashboard',
          'Client communication portal',
          'Advanced credit report parsing',
          'Automated reminder system'
        ],
        improved: [
          'Faster document processing (50% speed improvement)',
          'Enhanced security with multi-factor authentication',
          'Improved mobile responsiveness',
          'Better error handling and user feedback'
        ],
        fixed: [
          'Fixed issue with PDF generation on certain browsers',
          'Resolved email notification delivery problems',
          'Fixed date formatting inconsistencies',
          'Corrected calculation errors in credit score tracking'
        ]
      },
      breaking: [],
      migration: 'No migration required. All existing data will be automatically upgraded.',
      downloads: 1250,
      isStable: true
    },
    {
      version: '2.0.3',
      type: 'patch',
      releaseDate: '2024-02-01',
      title: 'Security Updates & Bug Fixes',
      description: 'Important security updates and critical bug fixes for improved stability.',
      highlights: [
        'Critical security vulnerability patches',
        'Performance improvements for large datasets',
        'Fixed authentication issues',
        'Improved error logging'
      ],
      changes: {
        new: [],
        improved: [
          'Enhanced security protocols',
          'Better performance for large client databases',
          'Improved error logging and monitoring'
        ],
        fixed: [
          'Fixed critical security vulnerability in user authentication',
          'Resolved memory leak in document processing',
          'Fixed timezone handling in scheduling system',
          'Corrected display issues in Safari browser'
        ]
      },
      breaking: [],
      migration: 'Automatic update. No action required.',
      downloads: 890,
      isStable: true
    },
    {
      version: '2.0.2',
      type: 'minor',
      releaseDate: '2024-01-20',
      title: 'Enhanced Reporting & Analytics',
      description: 'New reporting features and improved analytics dashboard for better insights.',
      highlights: [
        'New comprehensive reporting dashboard',
        'Advanced analytics and insights',
        'Export capabilities for all reports',
        'Custom report builder'
      ],
      changes: {
        new: [
          'Comprehensive reporting dashboard',
          'Advanced analytics with charts and graphs',
          'Custom report builder',
          'Export functionality (PDF, Excel, CSV)'
        ],
        improved: [
          'Faster data loading in analytics',
          'Better visualization of credit score trends',
          'Enhanced filtering options'
        ],
        fixed: [
          'Fixed chart rendering issues',
          'Resolved data export formatting problems',
          'Fixed date range selection bugs'
        ]
      },
      breaking: [],
      migration: 'No migration required.',
      downloads: 1100,
      isStable: true
    },
    {
      version: '2.0.1',
      type: 'patch',
      releaseDate: '2024-01-10',
      title: 'Performance Improvements',
      description: 'Various performance improvements and minor bug fixes.',
      highlights: [
        'Improved application loading speed',
        'Better memory management',
        'Enhanced user interface responsiveness'
      ],
      changes: {
        new: [],
        improved: [
          'Application startup time reduced by 40%',
          'Better memory management',
          'Enhanced UI responsiveness',
          'Optimized database queries'
        ],
        fixed: [
          'Fixed slow loading on dashboard',
          'Resolved UI freezing issues',
          'Fixed memory leaks in document viewer'
        ]
      },
      breaking: [],
      migration: 'Automatic update.',
      downloads: 750,
      isStable: true
    },
    {
      version: '2.0.0',
      type: 'major',
      releaseDate: '2024-01-01',
      title: 'Rick Jefferson Solutions Platform Launch',
      description: 'Complete platform redesign with new features, improved performance, and enhanced user experience.',
      highlights: [
        'Complete platform redesign',
        'New Rick Jefferson branding and identity',
        'Enhanced dispute management system',
        'Improved client portal',
        'Advanced compliance features'
      ],
      changes: {
        new: [
          'Complete platform redesign',
          'New Rick Jefferson Solutions branding',
          'Enhanced dispute management system',
          'Advanced client portal',
          'Comprehensive compliance features',
          'Mobile-first responsive design'
        ],
        improved: [
          'Complete UI/UX overhaul',
          'Better performance and reliability',
          'Enhanced security measures',
          'Improved accessibility'
        ],
        fixed: [
          'All legacy bugs resolved',
          'Improved browser compatibility',
          'Fixed mobile display issues'
        ]
      },
      breaking: [
        'Legacy API endpoints deprecated',
        'Old client portal URLs no longer supported',
        'Previous authentication method replaced'
      ],
      migration: 'Migration guide available. Contact support for assistance.',
      downloads: 2100,
      isStable: true
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Set the latest release as selected by default
    if (this.releases.length > 0) {
      this.selectedVersion = this.releases[0];
    }
  }

  get filteredReleases() {
    let filtered = this.releases;

    // Filter by type
    if (this.filterType !== 'all') {
      filtered = filtered.filter(release => release.type === this.filterType);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(release => 
        release.version.toLowerCase().includes(term) ||
        release.title.toLowerCase().includes(term) ||
        release.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  selectRelease(release: any): void {
    this.selectedVersion = release;
  }

  selectFilter(filterType: string): void {
    this.filterType = filterType;
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'major':
        return '#DC2626';
      case 'minor':
        return '#D97706';
      case 'patch':
        return '#059669';
      default:
        return '#6B7280';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'major':
        return 'badge-major';
      case 'minor':
        return 'badge-minor';
      case 'patch':
        return 'badge-patch';
      default:
        return 'badge-default';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDownloads(downloads: number): string {
    if (downloads >= 1000) {
      return (downloads / 1000).toFixed(1) + 'K';
    }
    return downloads.toString();
  }

  onSearch(): void {
    // Search is handled by the getter filteredReleases
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  downloadRelease(version: string): void {
    // In a real implementation, this would trigger a download
    console.log(`Downloading version ${version}`);
  }
}