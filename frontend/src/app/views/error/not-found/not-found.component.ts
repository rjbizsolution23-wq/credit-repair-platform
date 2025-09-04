import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {
  currentUrl: string = '';
  suggestedRoutes: Array<{label: string, route: string, icon: string}> = [
    { label: 'Dashboard', route: '/dashboard', icon: 'fas fa-tachometer-alt' },
    { label: 'Clients', route: '/clients', icon: 'fas fa-users' },
    { label: 'Credit Reports', route: '/credit-reports', icon: 'fas fa-file-alt' },
    { label: 'Disputes', route: '/disputes', icon: 'fas fa-gavel' },
    { label: 'Documents', route: '/documents', icon: 'fas fa-folder' },
    { label: 'Settings', route: '/settings', icon: 'fas fa-cog' }
  ];

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUrl = this.router.url;
  }

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  reportIssue(): void {
    // In a real application, this would open a support ticket or feedback form
    console.log('Report issue for URL:', this.currentUrl);
    // For now, navigate to a contact or support page
    this.router.navigate(['/support']);
  }

  searchSite(): void {
    // In a real application, this would open a site search
    console.log('Search site functionality');
    // For now, navigate to dashboard
    this.router.navigate(['/dashboard']);
  }
}