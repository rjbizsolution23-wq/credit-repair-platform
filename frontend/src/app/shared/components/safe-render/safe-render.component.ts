import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-safe-render',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [innerHTML]="safeContent"></span>
  `,
  styleUrls: ['./safe-render.component.scss']
})
export class SafeRenderComponent implements OnInit {
  @Input() data: any;
  safeContent: string = '';

  ngOnInit(): void {
    this.safeContent = this.sanitizeData(this.data);
  }

  ngOnChanges(): void {
    this.safeContent = this.sanitizeData(this.data);
  }

  private sanitizeData(data: any): string {
    try {
      // Handle null or undefined
      if (data === null || data === undefined) {
        return '';
      }

      // Handle primitive types
      if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
      }

      // Handle Error objects
      if (data instanceof Error) {
        return data.message || 'An error occurred';
      }

      // Handle objects with message and title properties
      if (typeof data === 'object') {
        if (data.message && data.title) {
          return `${data.title}: ${data.message}`;
        }
        if (data.message) {
          return data.message;
        }
        if (data.error) {
          return this.sanitizeData(data.error);
        }
        
        // Safely stringify objects
        try {
          return JSON.stringify(data, null, 2);
        } catch (stringifyError) {
          return '[Object - Cannot display]';
        }
      }

      // Fallback
      return String(data);
    } catch (error) {
      console.error('SafeRender error:', error);
      return '[Error rendering data]';
    }
  }
}