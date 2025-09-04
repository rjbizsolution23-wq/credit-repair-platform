import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Click outside directive
@Directive({
  selector: '[appClickOutside]'
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  public onClick(target: any): void {
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}

// Auto focus directive
@Directive({
  selector: '[appAutoFocus]'
})
export class AutoFocusDirective implements OnInit {
  @Input() appAutoFocus: boolean = true;
  @Input() delay: number = 0;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    if (this.appAutoFocus) {
      setTimeout(() => {
        this.elementRef.nativeElement.focus();
      }, this.delay);
    }
  }
}

// Tooltip directive
@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input() appTooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDelay: number = 500;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: any;
  private hideTimeout: any;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.renderer.setAttribute(this.elementRef.nativeElement, 'data-tooltip', this.appTooltip);
  }

  ngOnDestroy(): void {
    this.hideTooltip();
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.showTimeout = setTimeout(() => {
      this.showTooltip();
    }, this.tooltipDelay);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 100);
  }

  private showTooltip(): void {
    if (!this.appTooltip || this.tooltipElement) return;

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);
    this.renderer.setProperty(this.tooltipElement, 'textContent', this.appTooltip);

    // Add tooltip styles
    this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipElement, 'background-color', '#333');
    this.renderer.setStyle(this.tooltipElement, 'color', 'white');
    this.renderer.setStyle(this.tooltipElement, 'padding', '8px 12px');
    this.renderer.setStyle(this.tooltipElement, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipElement, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipElement, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltipElement, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipElement, 'opacity', '0');
    this.renderer.setStyle(this.tooltipElement, 'transition', 'opacity 0.2s');

    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position tooltip
    this.positionTooltip();

    // Show tooltip with animation
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.setStyle(this.tooltipElement, 'opacity', '1');
      }
    }, 10);
  }

  private hideTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top: number;
    let left: number;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top + scrollTop - tooltipRect.height - 8;
        left = hostRect.left + scrollLeft + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + scrollTop + 8;
        left = hostRect.left + scrollLeft + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + scrollTop + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left + scrollLeft - tooltipRect.width - 8;
        break;
      case 'right':
        top = hostRect.top + scrollTop + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + scrollLeft + 8;
        break;
      default:
        top = hostRect.top + scrollTop - tooltipRect.height - 8;
        left = hostRect.left + scrollLeft + (hostRect.width - tooltipRect.width) / 2;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }
}

// Permission directive
@Directive({
  selector: '[appPermission]'
})
export class PermissionDirective implements OnInit {
  @Input() appPermission: string | string[] = '';
  @Input() permissionMode: 'any' | 'all' = 'any';

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // This would typically check against a permission service
    // For now, we'll just show the element
    const hasPermission = this.checkPermission();
    
    if (!hasPermission) {
      this.renderer.setStyle(this.elementRef.nativeElement, 'display', 'none');
    }
  }

  private checkPermission(): boolean {
    // TODO: Implement actual permission checking logic
    // This would integrate with your authentication/authorization service
    return true;
  }
}

// Debounce click directive
@Directive({
  selector: '[appDebounceClick]'
})
export class DebounceClickDirective implements OnInit, OnDestroy {
  @Input() debounceTime: number = 500;
  @Output() debounceClick = new EventEmitter();
  
  private clicks = new Subject();
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.clicks.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(e => this.debounceClick.emit(e));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('click', ['$event'])
  clickEvent(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}

// Lazy load directive
@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad: string = '';
  @Input() placeholder: string = '';
  @Output() loaded = new EventEmitter<void>();

  private observer: IntersectionObserver | null = null;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(this.elementRef.nativeElement);
          }
        });
      });

      this.observer.observe(this.elementRef.nativeElement);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
    }

    // Set placeholder if provided
    if (this.placeholder) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'src', this.placeholder);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadImage(): void {
    if (this.appLazyLoad) {
      this.renderer.setAttribute(this.elementRef.nativeElement, 'src', this.appLazyLoad);
      this.loaded.emit();
    }
  }
}

// Highlight directive
@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {
  @Input() appHighlight: string = '';
  @Input() highlightColor: string = 'yellow';

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.highlight(this.highlightColor);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.highlight('');
  }

  private highlight(color: string): void {
    this.renderer.setStyle(this.elementRef.nativeElement, 'backgroundColor', color);
  }
}

// Ripple effect directive
@Directive({
  selector: '[appRipple]'
})
export class RippleDirective {
  @Input() rippleColor: string = 'rgba(255, 255, 255, 0.5)';
  @Input() rippleDuration: number = 600;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    const radius = Math.max(rect.width, rect.height);
    const left = event.clientX - rect.left - radius / 2;
    const top = event.clientY - rect.top - radius / 2;

    const ripple = this.renderer.createElement('span');
    this.renderer.addClass(ripple, 'ripple');
    this.renderer.setStyle(ripple, 'position', 'absolute');
    this.renderer.setStyle(ripple, 'border-radius', '50%');
    this.renderer.setStyle(ripple, 'background-color', this.rippleColor);
    this.renderer.setStyle(ripple, 'transform', 'scale(0)');
    this.renderer.setStyle(ripple, 'animation', `ripple ${this.rippleDuration}ms linear`);
    this.renderer.setStyle(ripple, 'left', `${left}px`);
    this.renderer.setStyle(ripple, 'top', `${top}px`);
    this.renderer.setStyle(ripple, 'width', `${radius}px`);
    this.renderer.setStyle(ripple, 'height', `${radius}px`);

    // Ensure parent element has relative positioning
    const position = window.getComputedStyle(element).position;
    if (position === 'static') {
      this.renderer.setStyle(element, 'position', 'relative');
    }

    this.renderer.appendChild(element, ripple);

    // Remove ripple after animation
    setTimeout(() => {
      this.renderer.removeChild(element, ripple);
    }, this.rippleDuration);
  }
}

// Infinite scroll directive
@Directive({
  selector: '[appInfiniteScroll]'
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() threshold: number = 100;
  @Input() throttle: number = 300;
  @Output() scrolled = new EventEmitter<void>();

  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.createSentinel();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.sentinel) {
      this.renderer.removeChild(this.elementRef.nativeElement, this.sentinel);
    }
  }

  private createSentinel(): void {
    this.sentinel = this.renderer.createElement('div');
    this.renderer.setStyle(this.sentinel, 'height', '1px');
    this.renderer.setStyle(this.sentinel, 'width', '100%');
    this.renderer.appendChild(this.elementRef.nativeElement, this.sentinel);
  }

  private setupIntersectionObserver(): void {
    if ('IntersectionObserver' in window && this.sentinel) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.scrolled.emit();
            }
          });
        },
        {
          rootMargin: `${this.threshold}px`
        }
      );

      this.observer.observe(this.sentinel);
    }
  }
}

// Copy to clipboard directive
@Directive({
  selector: '[appCopyToClipboard]'
})
export class CopyToClipboardDirective {
  @Input() appCopyToClipboard: string = '';
  @Output() copied = new EventEmitter<boolean>();

  @HostListener('click')
  onClick(): void {
    this.copyToClipboard(this.appCopyToClipboard);
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.copied.emit(true);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        this.copied.emit(successful);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      this.copied.emit(false);
    }
  }
}

// Export all directives
export const SHARED_DIRECTIVES = [
  ClickOutsideDirective,
  AutoFocusDirective,
  TooltipDirective,
  PermissionDirective,
  DebounceClickDirective,
  LazyLoadDirective,
  HighlightDirective,
  RippleDirective,
  InfiniteScrollDirective,
  CopyToClipboardDirective
];