export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  clientPortalUrl: 'http://localhost:4200',
  appName: 'Credit Repair Platform',
  version: '1.0.0',
  enablePerformanceMonitoring: true,
  enableServiceWorker: false, // Disabled in development
  features: {
    analytics: true,
    notifications: true,
    offlineMode: false
  },
  cache: {
    maxAge: 300000, // 5 minutes
    maxSize: 100 // 100 items
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false
  }
};