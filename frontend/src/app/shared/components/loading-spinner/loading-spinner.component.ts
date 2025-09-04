import { Component, Input } from '@angular/core';
import { SpinnerType, SpinnerSize } from '../../models/shared.models';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  @Input() type: SpinnerType = 'border';
  @Input() size: SpinnerSize = 'md';
  @Input() color: string = 'primary';
  @Input() text: string = '';
  @Input() overlay: boolean = false;
  @Input() fullscreen: boolean = false;
  @Input() transparent: boolean = false;
  @Input() customClass: string = '';
  @Input() show: boolean = true;
  @Input() delay: number = 0;
  @Input() minDuration: number = 0;

  private showTimeout?: number;
  private hideTimeout?: number;
  private startTime?: number;
  
  isVisible: boolean = false;

  ngOnInit(): void {
    if (this.show) {
      this.showSpinner();
    }
  }

  ngOnChanges(changes: any): void {
    if (changes['show']) {
      if (changes['show'].currentValue) {
        this.showSpinner();
      } else {
        this.hideSpinner();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  private showSpinner(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }

    if (this.delay > 0) {
      this.showTimeout = window.setTimeout(() => {
        this.isVisible = true;
        this.startTime = Date.now();
      }, this.delay);
    } else {
      this.isVisible = true;
      this.startTime = Date.now();
    }
  }

  private hideSpinner(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = undefined;
    }

    if (this.minDuration > 0 && this.startTime) {
      const elapsed = Date.now() - this.startTime;
      const remaining = this.minDuration - elapsed;
      
      if (remaining > 0) {
        this.hideTimeout = window.setTimeout(() => {
          this.isVisible = false;
        }, remaining);
        return;
      }
    }

    this.isVisible = false;
  }

  getSpinnerClasses(): string {
    const classes = ['spinner'];
    
    // Type classes
    classes.push(`spinner-${this.type}`);
    
    // Size classes
    classes.push(`spinner-${this.size}`);
    
    // Color classes
    classes.push(`text-${this.color}`);
    
    // Custom classes
    if (this.customClass) {
      classes.push(this.customClass);
    }
    
    return classes.join(' ');
  }

  getContainerClasses(): string {
    const classes = ['spinner-container'];
    
    if (this.overlay) {
      classes.push('spinner-overlay');
    }
    
    if (this.fullscreen) {
      classes.push('spinner-fullscreen');
    }
    
    if (this.transparent) {
      classes.push('spinner-transparent');
    }
    
    return classes.join(' ');
  }

  getAriaLabel(): string {
    return this.text || 'Loading...';
  }
}