import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PageHeaderConfig, BreadcrumbItem, ActionButton } from '../../models/shared.models';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() description: string = '';
  @Input() icon: string = '';
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() actions: ActionButton[] = [];
  @Input() config: PageHeaderConfig = {
    showBreadcrumbs: true,
    showActions: true,
    showBackButton: false,
    showRefreshButton: false,
    showHelpButton: false,
    sticky: false,
    bordered: true,
    compact: false
  };
  @Input() customClass: string = '';
  @Input() loading: boolean = false;
  @Input() backUrl: string = '';
  @Input() helpUrl: string = '';

  @Output() actionClick = new EventEmitter<{ action: ActionButton; event: Event }>();
  @Output() breadcrumbClick = new EventEmitter<{ breadcrumb: BreadcrumbItem; event: Event }>();
  @Output() backClick = new EventEmitter<Event>();
  @Output() refreshClick = new EventEmitter<Event>();
  @Output() helpClick = new EventEmitter<Event>();

  onActionClick(action: ActionButton, event: Event): void {
    if (action.disabled || this.loading) {
      event.preventDefault();
      return;
    }

    this.actionClick.emit({ action, event });

    if (action.handler) {
      action.handler(event);
    }
  }

  onBreadcrumbClick(breadcrumb: BreadcrumbItem, event: Event): void {
    if (breadcrumb.disabled || !breadcrumb.url) {
      event.preventDefault();
      return;
    }

    this.breadcrumbClick.emit({ breadcrumb, event });

    if (breadcrumb.handler) {
      breadcrumb.handler(event);
    }
  }

  onBackClick(event: Event): void {
    this.backClick.emit(event);
  }

  onRefreshClick(event: Event): void {
    this.refreshClick.emit(event);
  }

  onHelpClick(event: Event): void {
    this.helpClick.emit(event);
  }

  getHeaderClasses(): string {
    const classes = ['page-header'];

    if (this.config.sticky) {
      classes.push('page-header-sticky');
    }

    if (this.config.bordered) {
      classes.push('page-header-bordered');
    }

    if (this.config.compact) {
      classes.push('page-header-compact');
    }

    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  getActionClasses(action: ActionButton): string {
    const classes = ['btn'];

    // Button variant
    if (action.variant) {
      classes.push(`btn-${action.variant}`);
    } else {
      classes.push('btn-primary');
    }

    // Button size
    if (action.size) {
      classes.push(`btn-${action.size}`);
    }

    // Button state
    if (action.disabled || this.loading) {
      classes.push('disabled');
    }

    if (action.loading) {
      classes.push('btn-loading');
    }

    // Custom classes
    if (action.class) {
      classes.push(action.class);
    }

    return classes.join(' ');
  }

  getBreadcrumbClasses(breadcrumb: BreadcrumbItem): string {
    const classes = ['breadcrumb-item'];

    if (breadcrumb.active) {
      classes.push('active');
    }

    if (breadcrumb.disabled) {
      classes.push('disabled');
    }

    return classes.join(' ');
  }

  hasActions(): boolean {
    return this.config.showActions && this.actions.length > 0;
  }

  hasBreadcrumbs(): boolean {
    return this.config.showBreadcrumbs && this.breadcrumbs.length > 0;
  }

  hasNavigation(): boolean {
    return this.config.showBackButton || this.config.showRefreshButton || this.config.showHelpButton;
  }

  getActionTooltip(action: ActionButton): string {
    if (action.disabled && action.disabledTooltip) {
      return action.disabledTooltip;
    }
    return action.tooltip || '';
  }

  isActionVisible(action: ActionButton): boolean {
    if (action.visible === false) {
      return false;
    }

    if (action.permission && !this.hasPermission(action.permission)) {
      return false;
    }

    return true;
  }

  private hasPermission(permission: string): boolean {
    // This would integrate with your permission service
    // For now, return true
    return true;
  }

  trackByAction(index: number, action: ActionButton): any {
    return action.id || action.label || index;
  }

  trackByBreadcrumb(index: number, breadcrumb: BreadcrumbItem): any {
    return breadcrumb.url || breadcrumb.label || index;
  }

  hasCustomContent(): boolean {
    // This would need to be implemented based on content projection
    // For now, return false
    return false;
  }
}