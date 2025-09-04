export const environment = {
  production: true,
  apiUrl: 'https://api.creditrepairplatform.com/api',
  wsUrl: 'wss://api.creditrepairplatform.com',
  clientPortalUrl: 'https://portal.creditrepairplatform.com',
  appName: 'Credit Repair Platform',
  version: '1.0.0',
  enablePerformanceMonitoring: false, // Disabled in production to avoid overhead
  enableServiceWorker: true,
  features: {
    analytics: true,
    notifications: true,
    offlineMode: true
  },
  cache: {
    maxAge: 3600000, // 1 hour
    maxSize: 500 // 500 items
  },
  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: true
  }
};