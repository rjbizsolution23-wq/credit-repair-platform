import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video-guides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-guides.component.html',
  styleUrls: ['./video-guides.component.scss']
})
export class VideoGuidesComponent implements OnInit {
  selectedCategory = 'all';
  selectedVideo: any = null;
  searchTerm = '';
  isLoading = false;

  categories = [
    { id: 'all', name: 'All Videos', count: 24 },
    { id: 'getting-started', name: 'Getting Started', count: 6 },
    { id: 'dispute-process', name: 'Dispute Process', count: 8 },
    { id: 'credit-monitoring', name: 'Credit Monitoring', count: 4 },
    { id: 'account-management', name: 'Account Management', count: 3 },
    { id: 'advanced-features', name: 'Advanced Features', count: 3 }
  ];

  videos = [
    {
      id: 1,
      title: 'Platform Overview - Getting Started',
      description: 'Learn the basics of navigating the Rick Jefferson Solutions platform and accessing key features.',
      duration: '8:45',
      category: 'getting-started',
      difficulty: 'Beginner',
      thumbnail: '/assets/images/video-thumbnails/platform-overview.jpg',
      videoUrl: 'https://example.com/videos/platform-overview',
      views: 1250,
      publishedDate: '2024-01-15',
      tags: ['overview', 'navigation', 'basics']
    },
    {
      id: 2,
      title: 'Creating Your First Dispute Letter',
      description: 'Step-by-step guide to creating effective dispute letters using our 10 Step Total Enforcement Chain™.',
      duration: '12:30',
      category: 'dispute-process',
      difficulty: 'Beginner',
      thumbnail: '/assets/images/video-thumbnails/first-dispute.jpg',
      videoUrl: 'https://example.com/videos/first-dispute',
      views: 2100,
      publishedDate: '2024-01-20',
      tags: ['dispute', 'letters', '10-step-tec']
    },
    {
      id: 3,
      title: 'Understanding Credit Reports',
      description: 'Learn how to read and analyze credit reports to identify inaccurate or unverifiable information.',
      duration: '15:20',
      category: 'credit-monitoring',
      difficulty: 'Intermediate',
      thumbnail: '/assets/images/video-thumbnails/credit-reports.jpg',
      videoUrl: 'https://example.com/videos/credit-reports',
      views: 1800,
      publishedDate: '2024-01-25',
      tags: ['credit-reports', 'analysis', 'monitoring']
    },
    {
      id: 4,
      title: 'Advanced Dispute Strategies',
      description: 'Master advanced techniques for challenging complex credit report errors and building stronger cases.',
      duration: '18:45',
      category: 'dispute-process',
      difficulty: 'Advanced',
      thumbnail: '/assets/images/video-thumbnails/advanced-disputes.jpg',
      videoUrl: 'https://example.com/videos/advanced-disputes',
      views: 950,
      publishedDate: '2024-02-01',
      tags: ['advanced', 'strategies', 'complex-cases']
    },
    {
      id: 5,
      title: 'Setting Up Credit Monitoring',
      description: 'Configure automated credit monitoring to track changes and receive alerts about your credit profile.',
      duration: '10:15',
      category: 'credit-monitoring',
      difficulty: 'Beginner',
      thumbnail: '/assets/images/video-thumbnails/credit-monitoring.jpg',
      videoUrl: 'https://example.com/videos/credit-monitoring',
      views: 1400,
      publishedDate: '2024-02-05',
      tags: ['monitoring', 'alerts', 'automation']
    },
    {
      id: 6,
      title: 'Managing Your Account Settings',
      description: 'Customize your account preferences, notification settings, and security options.',
      duration: '7:30',
      category: 'account-management',
      difficulty: 'Beginner',
      thumbnail: '/assets/images/video-thumbnails/account-settings.jpg',
      videoUrl: 'https://example.com/videos/account-settings',
      views: 800,
      publishedDate: '2024-02-10',
      tags: ['account', 'settings', 'preferences']
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // Component initialization
  }

  get filteredVideos() {
    let filtered = this.videos;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(video => video.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(term) ||
        video.description.toLowerCase().includes(term) ||
        video.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.selectedVideo = null;
  }

  selectVideo(video: any): void {
    this.selectedVideo = video;
    this.isLoading = true;
    
    // Simulate video loading
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  closeVideo(): void {
    this.selectedVideo = null;
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '#059669';
      case 'intermediate':
        return '#D97706';
      case 'advanced':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  }

  formatDuration(duration: string): string {
    return duration;
  }

  formatViews(views: number): string {
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onSearch(): void {
    // Search is handled by the getter filteredVideos
    this.selectedVideo = null;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedVideo = null;
  }

  getCategoryName(): string {
    if (this.selectedCategory === 'all') {
      return 'All Videos';
    }
    const category = this.categories.find(c => c.id === this.selectedCategory);
    return category ? category.name : 'Unknown Category';
  }
}