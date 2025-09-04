/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { PerformanceService } from './app/core/services/performance.service';
import { environment } from './environments/environment';

// Register service worker for caching and offline functionality
if ('serviceWorker' in navigator && environment.enableServiceWorker && location.protocol === 'https:') {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('SW registered: ', registration);
    })
    .catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
}

bootstrapApplication(AppComponent, appConfig)
  .then((appRef) => {
    // Initialize performance monitoring
    const performanceService = appRef.injector.get(PerformanceService);
    performanceService.preloadCriticalResources();
    performanceService.setupLazyLoading();
    
    // Log performance metrics in development
    if (!environment.production && environment.enablePerformanceMonitoring) {
      setTimeout(() => {
        performanceService.analyzeBundleSize();
        const memoryUsage = performanceService.getMemoryUsage();
        if (memoryUsage) {
          console.log('Memory Usage:', memoryUsage);
        }
      }, 3000);
    }
  })
  .catch((err) => console.error(err));
