import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DateUtils, StringUtils, NumberUtils, ValidationUtils, CONSTANTS } from '../utils/shared.utils';

// Truncate text pipe
@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, length: number = 50, suffix: string = '...'): string {
    if (!value) return '';
    return StringUtils.truncate(value, length, suffix);
  }
}

// Safe HTML pipe
@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

// Currency formatting pipe
@Pipe({ name: 'currency' })
export class CurrencyPipe implements PipeTransform {
  transform(value: number, currency: string = 'USD'): string {
    if (value == null || isNaN(value)) return '$0.00';
    return NumberUtils.formatCurrency(value, currency);
  }
}

// Time ago pipe
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    if (!value) return '';
    return DateUtils.getTimeAgo(value);
  }
}

// Highlight search terms pipe
@Pipe({ name: 'highlight' })
export class HighlightPipe implements PipeTransform {
  transform(value: string, search: string): string {
    if (!value || !search) return value;
    return StringUtils.highlight(value, search);
  }
}

// Phone number formatting pipe
@Pipe({ name: 'phoneFormat' })
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return value;
  }
}

// SSN formatting pipe
@Pipe({ name: 'ssnFormat' })
export class SsnFormatPipe implements PipeTransform {
  transform(value: string, mask: boolean = true): string {
    if (!value) return '';
    
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 9) {
      if (mask) {
        return `XXX-XX-${cleaned.slice(5)}`;
      } else {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
      }
    }
    
    return value;
  }
}

// Credit score color pipe
@Pipe({ name: 'creditScoreColor' })
export class CreditScoreColorPipe implements PipeTransform {
  transform(score: number): string {
    if (!score || score < 300 || score > 850) return 'secondary';
    
    const ranges = CONSTANTS.CREDIT_SCORE_RANGES;
    
    if (score >= ranges.EXCELLENT.min) return ranges.EXCELLENT.color;
    if (score >= ranges.VERY_GOOD.min) return ranges.VERY_GOOD.color;
    if (score >= ranges.GOOD.min) return ranges.GOOD.color;
    if (score >= ranges.FAIR.min) return ranges.FAIR.color;
    return ranges.POOR.color;
  }
}

// Credit score label pipe
@Pipe({ name: 'creditScoreLabel' })
export class CreditScoreLabelPipe implements PipeTransform {
  transform(score: number): string {
    if (!score || score < 300 || score > 850) return 'Unknown';
    
    const ranges = CONSTANTS.CREDIT_SCORE_RANGES;
    
    if (score >= ranges.EXCELLENT.min) return ranges.EXCELLENT.label;
    if (score >= ranges.VERY_GOOD.min) return ranges.VERY_GOOD.label;
    if (score >= ranges.GOOD.min) return ranges.GOOD.label;
    if (score >= ranges.FAIR.min) return ranges.FAIR.label;
    return ranges.POOR.label;
  }
}

// File size formatting pipe
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Percentage pipe
@Pipe({ name: 'percentage' })
export class PercentagePipe implements PipeTransform {
  transform(value: number, decimals: number = 1): string {
    if (value == null || isNaN(value)) return '0%';
    return NumberUtils.formatPercentage(value, decimals);
  }
}

// Capitalize pipe
@Pipe({ name: 'capitalize' })
export class CapitalizePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.capitalize(value);
  }
}

// Title case pipe
@Pipe({ name: 'titleCase' })
export class TitleCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.titleCase(value);
  }
}

// Kebab case pipe
@Pipe({ name: 'kebabCase' })
export class KebabCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.kebabCase(value);
  }
}

// Snake case pipe
@Pipe({ name: 'snakeCase' })
export class SnakeCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.snakeCase(value);
  }
}

// Camel case pipe
@Pipe({ name: 'camelCase' })
export class CamelCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.camelCase(value);
  }
}

// Slugify pipe
@Pipe({ name: 'slugify' })
export class SlugifyPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.slugify(value);
  }
}

// Strip HTML pipe
@Pipe({ name: 'stripHtml' })
export class StripHtmlPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return StringUtils.stripHtml(value);
  }
}

// Abbreviate number pipe
@Pipe({ name: 'abbreviateNumber' })
export class AbbreviateNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value == null || isNaN(value)) return '0';
    return NumberUtils.abbreviateNumber(value);
  }
}

// Status badge pipe
@Pipe({ name: 'statusBadge' })
export class StatusBadgePipe implements PipeTransform {
  transform(status: string, type: 'dispute' | 'client' = 'dispute'): { color: string; label: string } {
    if (!status) return { color: 'secondary', label: 'Unknown' };
    
    const upperStatus = status.toUpperCase();
    
    if (type === 'dispute') {
      return CONSTANTS.DISPUTE_STATUSES[upperStatus as keyof typeof CONSTANTS.DISPUTE_STATUSES] || 
             { color: 'secondary', label: status };
    } else {
      return CONSTANTS.CLIENT_STATUSES[upperStatus as keyof typeof CONSTANTS.CLIENT_STATUSES] || 
             { color: 'secondary', label: status };
    }
  }
}

// Array join pipe
@Pipe({ name: 'join' })
export class JoinPipe implements PipeTransform {
  transform(value: any[], separator: string = ', '): string {
    if (!Array.isArray(value)) return '';
    return value.join(separator);
  }
}

// Object keys pipe
@Pipe({ name: 'keys' })
export class KeysPipe implements PipeTransform {
  transform(value: any): string[] {
    if (!value || typeof value !== 'object') return [];
    return Object.keys(value);
  }
}

// Object values pipe
@Pipe({ name: 'values' })
export class ValuesPipe implements PipeTransform {
  transform(value: any): any[] {
    if (!value || typeof value !== 'object') return [];
    return Object.values(value);
  }
}

// Filter array pipe
@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, property?: string): any[] {
    if (!items || !searchText) return items;
    
    searchText = searchText.toLowerCase();
    
    return items.filter(item => {
      if (property) {
        return item[property]?.toString().toLowerCase().includes(searchText);
      } else {
        return JSON.stringify(item).toLowerCase().includes(searchText);
      }
    });
  }
}

// Sort array pipe
@Pipe({ name: 'sort' })
export class SortPipe implements PipeTransform {
  transform(items: any[], property: string, direction: 'asc' | 'desc' = 'asc'): any[] {
    if (!items || !property) return items;
    
    return items.sort((a, b) => {
      const aVal = a[property];
      const bVal = b[property];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

// Reverse array pipe
@Pipe({ name: 'reverse' })
export class ReversePipe implements PipeTransform {
  transform(items: any[]): any[] {
    if (!Array.isArray(items)) return items;
    return [...items].reverse();
  }
}

// Slice array pipe
@Pipe({ name: 'slice' })
export class SlicePipe implements PipeTransform {
  transform(items: any[], start: number, end?: number): any[] {
    if (!Array.isArray(items)) return items;
    return items.slice(start, end);
  }
}

// Default value pipe
@Pipe({ name: 'default' })
export class DefaultPipe implements PipeTransform {
  transform(value: any, defaultValue: any = 'N/A'): any {
    return value != null && value !== '' ? value : defaultValue;
  }
}

// Export all pipes
export const SHARED_PIPES = [
  TruncatePipe,
  SafeHtmlPipe,
  CurrencyPipe,
  TimeAgoPipe,
  HighlightPipe,
  PhoneFormatPipe,
  SsnFormatPipe,
  CreditScoreColorPipe,
  CreditScoreLabelPipe,
  FileSizePipe,
  PercentagePipe,
  CapitalizePipe,
  TitleCasePipe,
  KebabCasePipe,
  SnakeCasePipe,
  CamelCasePipe,
  SlugifyPipe,
  StripHtmlPipe,
  AbbreviateNumberPipe,
  StatusBadgePipe,
  JoinPipe,
  KeysPipe,
  ValuesPipe,
  FilterPipe,
  SortPipe,
  ReversePipe,
  SlicePipe,
  DefaultPipe
];