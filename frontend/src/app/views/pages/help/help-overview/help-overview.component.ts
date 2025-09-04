import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-help-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './help-overview.component.html',
  styleUrls: ['./help-overview.component.scss']
})
export class HelpOverviewComponent implements OnInit {
  helpCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using Rick Jefferson Solutions platform',
      icon: '🚀',
      links: [
        { title: 'Platform Overview', route: '/help/documentation' },
        { title: 'Quick Start Guide', route: '/help/tutorials' },
        { title: 'Account Setup', route: '/help/tutorials' }
      ]
    },
    {
      title: 'Credit Repair Process',
      description: 'Understand our 10 Step Total Enforcement Chain™',
      icon: '📊',
      links: [
        { title: 'Dispute Process', route: '/help/documentation' },
        { title: 'Letter Templates', route: '/help/documentation' },
        { title: 'Timeline & Expectations', route: '/help/faq' }
      ]
    },
    {
      title: 'Legal Compliance',
      description: 'FCRA, FDCPA, and other regulatory information',
      icon: '⚖️',
      links: [
        { title: 'FCRA Guidelines', route: '/help/documentation' },
        { title: 'Compliance Best Practices', route: '/help/documentation' },
        { title: 'Legal Resources', route: '/help/documentation' }
      ]
    },
    {
      title: 'Technical Support',
      description: 'Get help with technical issues and platform features',
      icon: '🔧',
      links: [
        { title: 'Troubleshooting', route: '/help/faq' },
        { title: 'Contact Support', route: '/help/contact-support' },
        { title: 'System Status', route: '/help/system-status' }
      ]
    }
  ];

  quickLinks = [
    { title: 'Frequently Asked Questions', route: '/help/faq', icon: '❓' },
    { title: 'Video Tutorials', route: '/help/video-guides', icon: '🎥' },
    { title: 'Contact Support', route: '/help/contact-support', icon: '📞' },
    { title: 'Release Notes', route: '/help/release-notes', icon: '📝' }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}