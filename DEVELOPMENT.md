# Development Guide

This guide provides detailed instructions for setting up and developing the Elite Credit Repair Platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Database Management](#database-management)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [API Development](#api-development)
- [Service Development](#service-development)
- [Frontend Integration](#frontend-integration)
- [Debugging](#debugging)
- [Performance](#performance)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **PostgreSQL** (v13.0 or higher)
- **Redis** (v6.0 or higher)
- **Git**

### Optional Tools

- **Docker** (for containerized development)
- **Postman** (for API testing)
- **pgAdmin** (for database management)
- **Redis Commander** (for Redis management)

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd credit-repair-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=credit_repair_platform
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Other configurations...
```

### 4. Database Setup

Create the database:

```sql
CREATE DATABASE credit_repair_platform;
CREATE DATABASE credit_repair_platform_test;
```

Run migrations and seed data:

```bash
npm run db:setup
```

## Database Management

### Available Commands

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (WARNING: Deletes all data)
npm run db:reset -- --force

# Fresh setup (reset + migrate + seed)
npm run db:fresh

# Complete setup (migrate + seed)
npm run db:setup
```

### Creating Migrations

1. Add your migration to `scripts/migrate.js`
2. Follow the existing pattern:

```javascript
const migration_004_new_feature = {
  id: '004_new_feature',
  description: 'Add new feature tables',
  up: async (client) => {
    await client.query(`
      CREATE TABLE new_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};
```

### Database Schema

Key tables:
- `users` - System users (admins, managers, agents)
- `clients` - Credit repair clients
- `disputes` - Credit disputes
- `documents` - Uploaded documents
- `payments` - Payment records
- `credit_reports` - Credit report data
- `notifications` - System notifications
- `audit_logs` - Audit trail
- `settings` - Application settings

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with nodemon for auto-reloading.

### Production Mode

```bash
npm start
```

### Environment-Specific Commands

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
tests/
├── setup.js              # Test configuration
├── routes/               # Route tests
│   ├── auth.test.js
│   ├── clients.test.js
│   └── disputes.test.js
├── services/             # Service tests
│   ├── emailService.test.js
│   └── aiService.test.js
└── utils/                # Utility tests
```

### Writing Tests

```javascript
const { testUtils } = require('../setup');

describe('Feature Tests', () => {
  let testUser, testClient;

  beforeEach(async () => {
    testUser = await testUtils.createTestUser();
    testClient = await testUtils.createTestClient(testUser.id);
  });

  it('should perform expected behavior', async () => {
    // Test implementation
  });
});
```

## Code Quality

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Code Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:
- Linting
- Formatting
- Test execution

## API Development

### Route Structure

```
routes/
├── auth.js               # Authentication
├── users.js              # User management
├── clients.js            # Client management
├── disputes.js           # Dispute management
├── documents.js          # Document handling
├── payments.js           # Payment processing
├── creditReports.js      # Credit reports
├── notifications.js      # Notifications
└── settings.js           # Settings
```

### Creating New Routes

1. Create route file in `routes/` directory
2. Follow existing patterns:

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/resource
router.get('/', authenticate, async (req, res) => {
  try {
    // Implementation
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

3. Register route in `app.js`:

```javascript
app.use('/api/resource', require('./routes/resource'));
```

### API Standards

- Use RESTful conventions
- Return consistent JSON responses
- Include proper HTTP status codes
- Implement proper error handling
- Add input validation
- Use middleware for common functionality

## Service Development

### Service Structure

```
services/
├── emailService.js       # Email functionality
├── aiService.js          # AI/ML features
├── paymentService.js     # Payment processing
├── documentService.js    # Document handling
├── notificationService.js # Notifications
├── reportService.js      # Report generation
├── auditService.js       # Audit logging
└── backupService.js      # Backup management
```

### Creating Services

```javascript
class NewService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    // Setup logic
    this.initialized = true;
  }

  async performAction(params) {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }
    // Implementation
  }
}

module.exports = new NewService();
```

## Frontend Integration

### API Endpoints

The backend provides RESTful APIs for frontend consumption:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Clients**: `/api/clients/*`
- **Disputes**: `/api/disputes/*`
- **Documents**: `/api/documents/*`
- **Payments**: `/api/payments/*`
- **Reports**: `/api/credit-reports/*`

### CORS Configuration

CORS is configured in `app.js` to allow frontend origins:

```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
};
```

### Authentication

Frontend should include JWT token in requests:

```javascript
fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Debugging

### Logging

The application uses Winston for logging:

```javascript
const logger = require('./utils/logger');

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message', { error });
```

### Debug Mode

Enable debug mode in `.env`:

```env
DEBUG_MODE=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### Database Debugging

Enable query logging:

```env
DB_LOGGING=true
```

## Performance

### Monitoring

```bash
# Performance testing
npm run perf:test

# CPU profiling
npm run perf:profile

# Flame graph generation
npm run perf:flame
```

### Optimization Tips

1. Use database indexes appropriately
2. Implement caching with Redis
3. Use connection pooling
4. Optimize database queries
5. Implement rate limiting
6. Use compression middleware

## Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring

### Build Process

```bash
npm run build
```

### Health Checks

The application provides health check endpoints:
- `/health` - Basic health check
- `/health/detailed` - Detailed system status

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d credit_repair_platform
```

#### Redis Connection Issues

```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Permission Issues

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Fix file permissions
chmod -R 755 .
```

### Logs Location

- Application logs: `./logs/`
- Audit logs: `./audit_logs/`
- Test logs: `./logs/test.log`

### Getting Help

1. Check this documentation
2. Review error logs
3. Check GitHub issues
4. Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run quality checks
6. Submit a pull request

### Code Style

- Use ESLint configuration
- Follow Prettier formatting
- Write meaningful commit messages
- Add JSDoc comments for functions
- Include tests for new features

### Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add changelog entry
4. Request code review
5. Address feedback
6. Merge after approval