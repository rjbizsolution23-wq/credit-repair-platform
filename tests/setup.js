const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.test' });

// Test database configuration
const testPool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'credit_repair_platform_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD,
  ssl: process.env.TEST_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Global test utilities
global.testUtils = {
  pool: testPool,
  
  // Create test user
  async createTestUser(userData = {}) {
    const defaultUser = {
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'agent',
      isActive: true,
      emailVerified: true
    };
    
    const user = { ...defaultUser, ...userData };
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const { rows } = await testPool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.email, hashedPassword, user.firstName, user.lastName, user.role, user.isActive, user.emailVerified]
    );
    
    return { ...rows[0], password: user.password };
  },
  
  // Create test client
  async createTestClient(userId, clientData = {}) {
    const defaultClient = {
      firstName: 'John',
      lastName: 'Doe',
      email: `client${Date.now()}@example.com`,
      phone: '(555) 123-4567',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      dateOfBirth: '1990-01-01',
      ssnLastFour: '1234',
      status: 'active'
    };
    
    const client = { ...defaultClient, ...clientData };
    
    const { rows } = await testPool.query(
      `INSERT INTO clients (user_id, first_name, last_name, email, phone, address, city, state, zip_code, date_of_birth, ssn_last_four, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        userId, client.firstName, client.lastName, client.email,
        client.phone, client.address, client.city, client.state,
        client.zipCode, client.dateOfBirth, client.ssnLastFour, client.status
      ]
    );
    
    return rows[0];
  },
  
  // Create test dispute
  async createTestDispute(clientId, userId, disputeData = {}) {
    const defaultDispute = {
      bureau: 'Experian',
      accountName: 'Test Account',
      accountNumber: '****1234',
      disputeReason: 'Test dispute reason',
      status: 'pending',
      dateFiled: new Date().toISOString().split('T')[0],
      expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const dispute = { ...defaultDispute, ...disputeData };
    
    const { rows } = await testPool.query(
      `INSERT INTO disputes (client_id, user_id, bureau, account_name, account_number, dispute_reason, status, date_filed, expected_completion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        clientId, userId, dispute.bureau, dispute.accountName, dispute.accountNumber,
        dispute.disputeReason, dispute.status, dispute.dateFiled, dispute.expectedCompletion
      ]
    );
    
    return rows[0];
  },
  
  // Create test payment
  async createTestPayment(clientId, userId, paymentData = {}) {
    const defaultPayment = {
      amount: 99.99,
      currency: 'USD',
      paymentMethod: 'credit_card',
      status: 'completed',
      description: 'Test payment',
      processedAt: new Date()
    };
    
    const payment = { ...defaultPayment, ...paymentData };
    
    const { rows } = await testPool.query(
      `INSERT INTO payments (client_id, user_id, amount, currency, payment_method, status, description, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [clientId, userId, payment.amount, payment.currency, payment.paymentMethod, payment.status, payment.description, payment.processedAt]
    );
    
    return rows[0];
  },
  
  // Clean test data
  async cleanTestData() {
    const tables = [
      'audit_logs',
      'compliance_logs',
      'notifications',
      'credit_reports',
      'payments',
      'letters',
      'documents',
      'disputes',
      'clients',
      'users'
    ];
    
    for (const table of tables) {
      await testPool.query(`DELETE FROM ${table} WHERE id > 0`);
    }
  },
  
  // Generate JWT token for testing
  generateTestToken(userId, role = 'agent') {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  // Mock request object
  mockRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: null,
      ...overrides
    };
  },
  
  // Mock response object
  mockResponse() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    };
    return res;
  },
  
  // Wait for async operations
  async wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Setup test database
beforeAll(async () => {
  try {
    // Test database connection
    await testPool.query('SELECT 1');
    console.log('✅ Test database connected');
    
    // Run migrations if needed
    const { runMigrations } = require('../scripts/migrate');
    await runMigrations(testPool);
    console.log('✅ Test database migrations completed');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

// Clean up after each test
afterEach(async () => {
  await global.testUtils.cleanTestData();
});

// Close database connection after all tests
afterAll(async () => {
  await testPool.end();
  console.log('✅ Test database connection closed');
});

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock external services
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendDisputeUpdateEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../services/aiService', () => ({
  generateDisputeLetter: jest.fn().mockResolvedValue({
    content: 'Mock dispute letter content',
    confidence: 0.95
  }),
  analyzeCreditReport: jest.fn().mockResolvedValue({
    score: 750,
    recommendations: ['Mock recommendation']
  })
}));

jest.mock('../services/notificationService', () => ({
  sendNotification: jest.fn().mockResolvedValue({ success: true }),
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

// Export for use in tests
module.exports = global.testUtils;