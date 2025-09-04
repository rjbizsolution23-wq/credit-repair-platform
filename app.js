const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const disputeRoutes = require('./routes/disputes');
const letterRoutes = require('./routes/letters');
const documentRoutes = require('./routes/documents');
const billingRoutes = require('./routes/billing');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const creditReportRoutes = require('./routes/credit-reports');
const settingsRoutes = require('./routes/settings');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import services
const aiService = require('./services/aiService');
const emailService = require('./services/emailService');
const notificationService = require('./services/notificationService');
const paymentService = require('./services/paymentService');
const documentService = require('./services/documentService');
const reportService = require('./services/reportService');
const auditService = require('./services/auditService');
const backupService = require('./services/backupService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'credit-repair-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'https://your-domain.com',
      'https://www.your-domain.com'
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:8080');
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/disputes', authenticateToken, disputeRoutes);
app.use('/api/letters', authenticateToken, letterRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/credit-reports', authenticateToken, creditReportRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Elite Credit Repair API',
    version: '1.0.0',
    description: 'Comprehensive credit repair platform API',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      disputes: '/api/disputes',
      letters: '/api/letters',
      documents: '/api/documents',
      billing: '/api/billing',
      analytics: '/api/analytics',
      users: '/api/users',
      notifications: '/api/notifications',
      creditReports: '/api/credit-reports',
      settings: '/api/settings'
    },
    documentation: 'https://docs.your-domain.com/api'
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Initialize services in order
    const services = [
      { name: 'Email Service', service: emailService, condition: process.env.EMAIL_ENABLED === 'true' },
      { name: 'Notification Service', service: notificationService, condition: true },
      { name: 'Payment Service', service: paymentService, condition: true },
      { name: 'Document Service', service: documentService, condition: true },
      { name: 'Report Service', service: reportService, condition: true },
      { name: 'Audit Service', service: auditService, condition: true },
      { name: 'Backup Service', service: backupService, condition: true },
      { name: 'AI Service', service: aiService, condition: process.env.AI_ENABLED === 'true' }
    ];
    
    for (const { name, service, condition } of services) {
      if (!condition) {
        logger.info(`${name} disabled by configuration`);
        continue;
      }
      
      try {
        if (service.initialize) {
          const result = await service.initialize();
          if (result !== false) {
            logger.info(`${name} initialized successfully`);
          } else {
            logger.warn(`${name} initialization returned false`);
          }
        } else if (service.initializeModel) {
          // For AI service
          await service.initializeModel();
          logger.info(`${name} initialized successfully`);
        }
      } catch (error) {
        logger.error(`Failed to initialize ${name}:`, error);
        // Continue with other services even if one fails
      }
    }
    
    logger.info('Service initialization completed');
  } catch (error) {
    logger.error('Service initialization failed:', error);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`Elite Credit Repair API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info(`API documentation: http://localhost:${PORT}/api`);
  }
  
  // Initialize services after server starts
  await initializeServices();
  
  logger.info('Application ready to accept connections');
});

// Export app for testing
module.exports = app;