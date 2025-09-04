const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const authRoutes = require('../../routes/auth');
const { testUtils } = require('../setup');

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Authentication Routes', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'agent'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toMatchObject({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      });
      expect(response.body.user.password_hash).toBeUndefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password, firstName, lastName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });

    it('should return 409 for duplicate email', async () => {
      // Create a user first
      await testUtils.createTestUser({
        email: 'existing@example.com'
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.first_name,
        lastName: testUser.last_name,
        role: testUser.role
      });
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 401 for inactive user', async () => {
      // Create inactive user
      await testUtils.createTestUser({
        email: 'inactive@example.com',
        password: 'password123',
        isActive: false
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inactive');
    });
  });

  describe('POST /auth/forgot-password', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'forgot@example.com'
      });
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'forgot@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');
    });

    it('should return 200 even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset link');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /auth/reset-password', () => {
    let testUser;
    let resetToken;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'reset@example.com'
      });
      
      // Generate a valid reset token
      const jwt = require('jsonwebtoken');
      resetToken = jwt.sign(
        { userId: testUser.id, type: 'password_reset' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';
      
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset successfully');

      // Verify password was actually changed
      const { rows } = await testUtils.pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [testUser.id]
      );
      
      const isValidPassword = await bcrypt.compare(newPassword, rows[0].password_hash);
      expect(isValidPassword).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 400 for expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: testUser.id, type: 'password_reset' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired
      );

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: expiredToken,
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: '123' // Too weak
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /auth/verify-email', () => {
    let testUser;
    let verificationToken;

    beforeEach(async () => {
      testUser = await testUtils.createTestUser({
        email: 'verify@example.com',
        emailVerified: false
      });
      
      const jwt = require('jsonwebtoken');
      verificationToken = jwt.sign(
        { userId: testUser.id, type: 'email_verification' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          token: verificationToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');

      // Verify email_verified was updated
      const { rows } = await testUtils.pool.query(
        'SELECT email_verified FROM users WHERE id = $1',
        [testUser.id]
      );
      
      expect(rows[0].email_verified).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/auth/verify-email')
        .send({
          token: 'invalid-token'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });
  });
});