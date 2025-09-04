import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload modules based on priority
    if (route.data && route.data['preload']) {
      const delayTime = route.data['priority'] === 'high' ? 0 : 2000;
      return of(true).pipe(
        delay(delayTime),
        () => load()
      );
    }
    return of(null);
  }
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initPerformanceMonitoring();
  }

  private initPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.logNavigationTiming(entry as PerformanceNavigationTiming);
          } else if (entry.entryType === 'largest-contentful-paint') {
            this.logLCP(entry);
          } else if (entry.entryType === 'first-input') {
            this.logFID(entry);
          }
        });
      });

      this.performanceObserver.observe({
        entryTypes: ['navigation', 'largest-contentful-paint', 'first-input']
      });
    }
  }

  private logNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connection': entry.connectEnd - entry.connectStart,
      'Request': entry.responseStart - entry.requestStart,
      'Response': entry.responseEnd - entry.responseStart,
      'DOM Processing': entry.domComplete - entry.domContentLoadedEventStart,
      'Load Complete': entry.loadEventEnd - entry.loadEventStart
    };

    console.group('🚀 Navigation Performance Metrics');
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`${key}: ${Math.round(value)}ms`);
    });
    console.groupEnd();
  }

  private logLCP(entry: PerformanceEntry): void {
    console.log(`🎯 Largest Contentful Paint: ${Math.round(entry.startTime)}ms`);
  }

  private logFID(entry: PerformanceEntry): void {
    console.log(`⚡ First Input Delay: ${Math.round(entry.startTime)}ms`);
  }

  // Lazy load images
  setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset['src']) {
              img.src = img.dataset['src'];
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  }

  // Preload critical resources
  preloadCriticalResources(): void {
    const criticalResources = [
      '/assets/fonts/primary-font.woff2',
      '/assets/css/critical.css'
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.includes('.woff') ? 'font' : 'style';
      if (resource.includes('.woff')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  // Memory usage monitoring
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Bundle size analysis
  analyzeBundleSize(): void {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalSize = scripts.reduce((total, script) => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('main') || src.includes('vendor') || src.includes('polyfills')) {
        // This is a rough estimation - in production you'd use webpack-bundle-analyzer
        return total + 1;
      }
      return total;
    }, 0);

    console.log(`📦 Estimated bundle count: ${totalSize} chunks`);
  }

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}