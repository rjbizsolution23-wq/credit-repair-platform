import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StatsCardConfig, TrendDirection } from '../../models/shared.models';

@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.scss']
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() color: string = 'primary';
  @Input() trend: {
    value: number;
    direction: TrendDirection;
    label?: string;
  } | null = null;
  @Input() config: StatsCardConfig = {
    showIcon: true,
    showTrend: true,
    showSubtitle: true,
    clickable: false,
    loading: false,
    animated: true,
    bordered: true,
    compact: false
  };
  @Input() customClass: string = '';
  @Input() loading: boolean = false;
  @Input() error: string = '';
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() format: 'number' | 'currency' | 'percentage' | 'text' = 'text';
  @Input() precision: number = 0;
  @Input() locale: string = 'en-US';
  @Input() currency: string = 'USD';

  @Output() cardClick = new EventEmitter<Event>();
  @Output() iconClick = new EventEmitter<Event>();

  onCardClick(event: Event): void {
    if (this.config.clickable && !this.loading) {
      this.cardClick.emit(event);
    }
  }

  onIconClick(event: Event): void {
    event.stopPropagation();
    this.iconClick.emit(event);
  }

  getCardClasses(): string {
    const classes = ['stats-card'];

    // Color variant
    classes.push(`stats-card-${this.color}`);

    // Configuration classes
    if (this.config.clickable) {
      classes.push('stats-card-clickable');
    }

    if (this.config.bordered) {
      classes.push('stats-card-bordered');
    }

    if (this.config.compact) {
      classes.push('stats-card-compact');
    }

    if (this.config.animated) {
      classes.push('stats-card-animated');
    }

    if (this.loading || this.config.loading) {
      classes.push('stats-card-loading');
    }

    if (this.error) {
      classes.push('stats-card-error');
    }

    // Custom classes
    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  getIconClasses(): string {
    const classes = ['stats-icon'];

    if (this.icon) {
      classes.push(this.icon);
    }

    return classes.join(' ');
  }

  getTrendClasses(): string {
    const classes = ['stats-trend'];

    if (this.trend) {
      classes.push(`trend-${this.trend.direction}`);
    }

    return classes.join(' ');
  }

  getTrendIcon(): string {
    if (!this.trend) {
      return '';
    }

    switch (this.trend.direction) {
      case 'up':
        return 'feather icon-trending-up';
      case 'down':
        return 'feather icon-trending-down';
      case 'neutral':
        return 'feather icon-minus';
      default:
        return '';
    }
  }

  getFormattedValue(): string {
    if (this.loading || this.config.loading) {
      return '--';
    }

    if (this.error) {
      return 'Error';
    }

    if (!this.value && this.value !== 0) {
      return '--';
    }

    let formattedValue = '';
    const numericValue = typeof this.value === 'string' ? parseFloat(this.value) : this.value;

    switch (this.format) {
      case 'number':
        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
          formattedValue = new Intl.NumberFormat(this.locale, {
            minimumFractionDigits: this.precision,
            maximumFractionDigits: this.precision
          }).format(numericValue);
        } else {
          formattedValue = String(this.value);
        }
        break;

      case 'currency':
        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
          formattedValue = new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: this.precision,
            maximumFractionDigits: this.precision
          }).format(numericValue);
        } else {
          formattedValue = String(this.value);
        }
        break;

      case 'percentage':
        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
          formattedValue = new Intl.NumberFormat(this.locale, {
            style: 'percent',
            minimumFractionDigits: this.precision,
            maximumFractionDigits: this.precision
          }).format(numericValue / 100);
        } else {
          formattedValue = String(this.value);
        }
        break;

      default:
        formattedValue = String(this.value);
        break;
    }

    return `${this.prefix}${formattedValue}${this.suffix}`;
  }

  getFormattedTrend(): string {
    if (!this.trend) {
      return '';
    }

    const value = Math.abs(this.trend.value);
    const sign = this.trend.direction === 'up' ? '+' : this.trend.direction === 'down' ? '-' : '';
    
    return `${sign}${value}%`;
  }

  getTrendLabel(): string {
    if (!this.trend) {
      return '';
    }

    if (this.trend.label) {
      return this.trend.label;
    }

    switch (this.trend.direction) {
      case 'up':
        return 'vs last period';
      case 'down':
        return 'vs last period';
      case 'neutral':
        return 'no change';
      default:
        return '';
    }
  }

  shouldShowIcon(): boolean {
    return this.config.showIcon && !!this.icon;
  }

  shouldShowTrend(): boolean {
    return this.config.showTrend && !!this.trend;
  }

  shouldShowSubtitle(): boolean {
    return this.config.showSubtitle && !!this.subtitle;
  }

  isLoading(): boolean {
    return this.loading || this.config.loading;
  }

  hasError(): boolean {
    return !!this.error;
  }

  getAriaLabel(): string {
    let label = this.title;
    
    if (this.getFormattedValue() !== '--' && this.getFormattedValue() !== 'Error') {
      label += `: ${this.getFormattedValue()}`;
    }
    
    if (this.shouldShowTrend() && this.trend) {
      label += `, trend: ${this.getFormattedTrend()} ${this.getTrendLabel()}`;
    }
    
    if (this.shouldShowSubtitle()) {
      label += `, ${this.subtitle}`;
    }
    
    return label;
  }
}