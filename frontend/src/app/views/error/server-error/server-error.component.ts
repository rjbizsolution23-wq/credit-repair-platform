import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss']
})
export class ServerErrorComponent implements OnInit {
  errorId: string = '';
  retryCount: number = 0;
  maxRetries: number = 3;
  isRetrying: boolean = false;

  constructor(
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.generateErrorId();
  }

  private generateErrorId(): void {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    this.errorId = `ERR-${timestamp}-${random}`.toUpperCase();
  }

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  retryPage(): void {
    if (this.retryCount >= this.maxRetries) {
      return;
    }

    this.isRetrying = true;
    this.retryCount++;

    // Simulate retry delay
    setTimeout(() => {
      this.isRetrying = false;
      // In a real application, you would reload the current route or retry the failed request
      window.location.reload();
    }, 2000);
  }

  reportError(): void {
    // In a real application, this would send error details to a logging service
    const errorDetails = {
      errorId: this.errorId,
      timestamp: new Date().toISOString(),
      url: this.router.url,
      userAgent: navigator.userAgent,
      retryCount: this.retryCount
    };
    
    console.log('Error reported:', errorDetails);
    
    // For now, navigate to a contact or support page
    this.router.navigate(['/support'], { 
      queryParams: { errorId: this.errorId } 
    });
  }

  refreshPage(): void {
    window.location.reload();
  }

  checkStatus(): void {
    // In a real application, this would check system status
    window.open('https://status.example.com', '_blank');
  }

  get canRetry(): boolean {
    return this.retryCount < this.maxRetries && !this.isRetrying;
  }

  get retryButtonText(): string {
    if (this.isRetrying) {
      return 'Retrying...';
    }
    if (this.retryCount >= this.maxRetries) {
      return 'Max Retries Reached';
    }
    return `Retry (${this.retryCount}/${this.maxRetries})`;
  }

  getCurrentTime(): string {
    return new Date().toLocaleString();
  }

  copyErrorId(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.errorId).then(() => {
        console.log('Error ID copied to clipboard');
        // In a real application, you might show a toast notification
      }).catch(err => {
        console.error('Failed to copy error ID:', err);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.errorId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}