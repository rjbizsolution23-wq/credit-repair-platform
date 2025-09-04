import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ModalConfig, ModalSize } from '../../models/shared.models';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: ModalSize = 'md';
  @Input() config: ModalConfig = {
    backdrop: true,
    keyboard: true,
    focus: true,
    show: true,
    centered: false,
    scrollable: false,
    fullscreen: false,
    animation: true
  };
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() showCloseButton: boolean = true;
  @Input() customClass: string = '';
  @Input() zIndex: number = 1050;

  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();
  @Output() beforeClose = new EventEmitter<void>();
  @Output() afterClose = new EventEmitter<void>();

  @ViewChild('modalElement', { static: true }) modalElement!: ElementRef;
  @ViewChild('modalDialog', { static: true }) modalDialog!: ElementRef;

  private isAnimating: boolean = false;
  private originalBodyOverflow: string = '';
  private originalBodyPaddingRight: string = '';
  private scrollbarWidth: number = 0;

  ngOnInit(): void {
    if (this.isOpen) {
      this.show();
    }
  }

  ngOnDestroy(): void {
    this.restoreBodyStyles();
    this.removeEventListeners();
  }

  ngOnChanges(changes: any): void {
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  show(): void {
    if (this.isAnimating || this.isOpen) {
      return;
    }

    this.isAnimating = true;
    this.isOpen = true;

    // Calculate scrollbar width
    this.scrollbarWidth = this.getScrollbarWidth();

    // Store original body styles
    this.originalBodyOverflow = document.body.style.overflow;
    this.originalBodyPaddingRight = document.body.style.paddingRight;

    // Prevent body scroll and adjust for scrollbar
    document.body.style.overflow = 'hidden';
    if (this.scrollbarWidth > 0) {
      document.body.style.paddingRight = `${this.scrollbarWidth}px`;
    }

    // Add modal to DOM
    document.body.appendChild(this.modalElement.nativeElement);

    // Add event listeners
    this.addEventListeners();

    // Show modal with animation
    if (this.config.animation) {
      setTimeout(() => {
        this.modalElement.nativeElement.classList.add('show');
        this.isAnimating = false;
        this.opened.emit();
        
        if (this.config.focus) {
          this.focusModal();
        }
      }, 10);
    } else {
      this.modalElement.nativeElement.classList.add('show');
      this.isAnimating = false;
      this.opened.emit();
      
      if (this.config.focus) {
        this.focusModal();
      }
    }
  }

  hide(): void {
    if (this.isAnimating || !this.isOpen) {
      return;
    }

    this.beforeClose.emit();
    this.isAnimating = true;

    if (this.config.animation) {
      this.modalElement.nativeElement.classList.remove('show');
      
      setTimeout(() => {
        this.completeHide();
      }, 300); // Match CSS transition duration
    } else {
      this.completeHide();
    }
  }

  private completeHide(): void {
    this.isOpen = false;
    this.isAnimating = false;

    // Remove modal from DOM
    if (this.modalElement.nativeElement.parentNode) {
      this.modalElement.nativeElement.parentNode.removeChild(this.modalElement.nativeElement);
    }

    // Restore body styles
    this.restoreBodyStyles();

    // Remove event listeners
    this.removeEventListeners();

    this.closed.emit();
    this.afterClose.emit();
  }

  dismiss(): void {
    this.dismissed.emit();
    this.hide();
  }

  close(): void {
    this.hide();
  }

  private addEventListeners(): void {
    if (this.config.keyboard) {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    if (this.config.backdrop) {
      this.modalElement.nativeElement.addEventListener('click', this.handleBackdropClick.bind(this));
    }
  }

  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    this.modalElement.nativeElement.removeEventListener('click', this.handleBackdropClick.bind(this));
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.config.keyboard) {
      this.dismiss();
    }
  }

  private handleBackdropClick(event: MouseEvent): void {
    if (event.target === this.modalElement.nativeElement && this.config.backdrop) {
      this.dismiss();
    }
  }

  private focusModal(): void {
    const focusableElements = this.modalDialog.nativeElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    } else {
      this.modalDialog.nativeElement.focus();
    }
  }

  private restoreBodyStyles(): void {
    document.body.style.overflow = this.originalBodyOverflow;
    document.body.style.paddingRight = this.originalBodyPaddingRight;
  }

  private getScrollbarWidth(): number {
    const scrollDiv = document.createElement('div');
    scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  getModalClasses(): string {
    const classes = ['modal'];
    
    if (this.config.animation) {
      classes.push('fade');
    }
    
    if (this.customClass) {
      classes.push(this.customClass);
    }
    
    return classes.join(' ');
  }

  getDialogClasses(): string {
    const classes = ['modal-dialog'];
    
    // Size classes
    switch (this.size) {
      case 'sm':
        classes.push('modal-sm');
        break;
      case 'lg':
        classes.push('modal-lg');
        break;
      case 'xl':
        classes.push('modal-xl');
        break;
      default:
        // 'md' is default, no additional class needed
        break;
    }
    
    // Configuration classes
    if (this.config.centered) {
      classes.push('modal-dialog-centered');
    }
    
    if (this.config.scrollable) {
      classes.push('modal-dialog-scrollable');
    }
    
    if (this.config.fullscreen) {
      if (typeof this.config.fullscreen === 'string') {
        classes.push(`modal-fullscreen-${this.config.fullscreen}-down`);
      } else {
        classes.push('modal-fullscreen');
      }
    }
    
    return classes.join(' ');
  }

  getModalStyles(): any {
    return {
      'z-index': this.zIndex,
      'display': this.isOpen ? 'block' : 'none'
    };
  }

  onDialogClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onCloseClick(): void {
    this.close();
  }

  hasCustomFooter(): boolean {
    // This would need to be implemented based on content projection
    // For now, return false to show default footer
    return false;
  }

  // Public methods for external control
  toggle(): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  isAnimationInProgress(): boolean {
    return this.isAnimating;
  }
}