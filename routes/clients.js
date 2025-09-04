const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const { requireStaff, requireAdmin } = require('../middleware/auth');
const encryptionService = require('../services/encryption');

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Validation rules
const clientValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('ssn')
    .matches(/^\d{3}-\d{2}-\d{4}$/)
    .withMessage('SSN must be in format XXX-XX-XXXX'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('address.street')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  body('address.city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('address.state')
    .trim()
    .isLength({ min: 2, max: 2 })
    .withMessage('State must be 2 characters'),
  body('address.zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('ZIP code must be in format XXXXX or XXXXX-XXXX')
];

// GET /api/clients - Get all clients with pagination and search
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),
  query('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['firstName', 'lastName', 'email', 'createdAt', 'lastActivity']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        first_name ILIKE $${paramIndex} OR 
        last_name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        phone ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Main query
    const clientsQuery = `
      SELECT 
        c.id, c.first_name, c.last_name, c.email, c.phone,
        c.status, c.created_at, c.updated_at,
        COUNT(d.id) as dispute_count,
        MAX(d.created_at) as last_dispute_date
      FROM clients c
      LEFT JOIN disputes d ON c.id = d.client_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.status, c.created_at, c.updated_at
      ORDER BY ${sortBy === 'lastActivity' ? 'COALESCE(MAX(d.created_at), c.created_at)' : `c.${sortBy}`} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM clients c
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [clientsResult, countResult] = await Promise.all([
      pool.query(clientsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const clients = clientsResult.rows.map(client => ({
      id: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      disputeCount: parseInt(client.dispute_count),
      lastDisputeDate: client.last_dispute_date,
      createdAt: client.created_at,
      updatedAt: client.updated_at
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Get clients error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve clients'
    });
  }
});

// GET /api/clients/:id - Get specific client with full details
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid client ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    // Get client details
    const clientQuery = `
      SELECT 
        id, first_name, last_name, email, phone, ssn_encrypted,
        date_of_birth, address, status, notes, created_at, updated_at
      FROM clients 
      WHERE id = $1
    `;

    const clientResult = await pool.query(clientQuery, [id]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    const client = clientResult.rows[0];

    // Get client's disputes
    const disputesQuery = `
      SELECT 
        id, bureau, account_name, account_number, dispute_reason,
        dispute_type, status, created_at, updated_at
      FROM disputes 
      WHERE client_id = $1
      ORDER BY created_at DESC
    `;

    const disputesResult = await pool.query(disputesQuery, [id]);

    // Get client's credit reports
    const reportsQuery = `
      SELECT 
        id, bureau, report_date, credit_score, status, created_at
      FROM credit_reports 
      WHERE client_id = $1
      ORDER BY report_date DESC
    `;

    const reportsResult = await pool.query(reportsQuery, [id]);

    // Decrypt sensitive data
    let decryptedSSN = null;
    if (client.ssn_encrypted) {
      try {
        decryptedSSN = encryptionService.decrypt(JSON.parse(client.ssn_encrypted));
      } catch (decryptError) {
        logger.warn('Failed to decrypt SSN', { clientId: id, error: decryptError.message });
      }
    }

    const clientData = {
      id: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
      email: client.email,
      phone: client.phone,
      ssn: decryptedSSN,
      dateOfBirth: client.date_of_birth,
      address: client.address,
      status: client.status,
      notes: client.notes,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
      disputes: disputesResult.rows.map(dispute => ({
        id: dispute.id,
        bureau: dispute.bureau,
        accountName: dispute.account_name,
        accountNumber: dispute.account_number,
        disputeReason: dispute.dispute_reason,
        disputeType: dispute.dispute_type,
        status: dispute.status,
        createdAt: dispute.created_at,
        updatedAt: dispute.updated_at
      })),
      creditReports: reportsResult.rows.map(report => ({
        id: report.id,
        bureau: report.bureau,
        reportDate: report.report_date,
        creditScore: report.credit_score,
        status: report.status,
        createdAt: report.created_at
      }))
    };

    res.json({ client: clientData });

  } catch (error) {
    logger.error('Get client error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve client'
    });
  }
});

// POST /api/clients - Create new client
router.post('/', clientValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      ssn,
      dateOfBirth,
      address,
      notes = ''
    } = req.body;

    // Check if client already exists
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE email = $1 OR ssn_encrypted IS NOT NULL',
      [email]
    );

    if (existingClient.rows.length > 0) {
      return res.status(409).json({
        error: 'Client already exists',
        message: 'A client with this email already exists'
      });
    }

    // Encrypt sensitive data
    const encryptedSSN = encryptionService.encrypt(ssn);

    // Create client
    const clientQuery = `
      INSERT INTO clients (
        first_name, last_name, email, phone, ssn_encrypted,
        date_of_birth, address, notes, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
      RETURNING id, first_name, last_name, email, phone, date_of_birth, address, status, created_at
    `;

    const newClient = await pool.query(clientQuery, [
      firstName,
      lastName,
      email,
      phone,
      JSON.stringify(encryptedSSN),
      dateOfBirth,
      JSON.stringify(address),
      notes
    ]);

    const client = newClient.rows[0];

    // Log client creation
    logger.info('Client created successfully', {
      clientId: client.id,
      email: client.email,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Client created successfully',
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.date_of_birth,
        address: JSON.parse(client.address),
        status: client.status,
        createdAt: client.created_at
      }
    });

  } catch (error) {
    logger.error('Create client error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to create client'
    });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', [
  param('id').isUUID().withMessage('Invalid client ID'),
  ...clientValidation
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      ssn,
      dateOfBirth,
      address,
      notes,
      status
    } = req.body;

    // Check if client exists
    const existingClient = await pool.query(
      'SELECT id FROM clients WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    // Encrypt SSN if provided
    let encryptedSSN = null;
    if (ssn) {
      encryptedSSN = JSON.stringify(encryptionService.encrypt(ssn));
    }

    // Update client
    const updateQuery = `
      UPDATE clients SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        ssn_encrypted = COALESCE($5, ssn_encrypted),
        date_of_birth = $6,
        address = $7,
        notes = $8,
        status = COALESCE($9, status),
        updated_at = NOW()
      WHERE id = $10
      RETURNING id, first_name, last_name, email, phone, date_of_birth, address, status, updated_at
    `;

    const updatedClient = await pool.query(updateQuery, [
      firstName,
      lastName,
      email,
      phone,
      encryptedSSN,
      dateOfBirth,
      JSON.stringify(address),
      notes,
      status,
      id
    ]);

    const client = updatedClient.rows[0];

    // Log client update
    logger.info('Client updated successfully', {
      clientId: id,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Client updated successfully',
      client: {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.date_of_birth,
        address: JSON.parse(client.address),
        status: client.status,
        updatedAt: client.updated_at
      }
    });

  } catch (error) {
    logger.error('Update client error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to update client'
    });
  }
});

// DELETE /api/clients/:id - Delete client (admin only)
router.delete('/:id', requireAdmin, [
  param('id').isUUID().withMessage('Invalid client ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;

    // Check if client exists
    const existingClient = await pool.query(
      'SELECT id, first_name, last_name, email FROM clients WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        error: 'Client not found'
      });
    }

    const client = existingClient.rows[0];

    // Soft delete - update status instead of actual deletion
    await pool.query(
      'UPDATE clients SET status = $1, updated_at = NOW() WHERE id = $2',
      ['deleted', id]
    );

    // Log client deletion
    logger.info('Client deleted successfully', {
      clientId: id,
      clientEmail: client.email,
      deletedBy: req.user.id
    });

    res.json({
      message: 'Client deleted successfully'
    });

  } catch (error) {
    logger.error('Delete client error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to delete client'
    });
  }
});

// GET /api/clients/:id/activity - Get client activity log
router.get('/:id/activity', [
  param('id').isUUID().withMessage('Invalid client ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get activity log
    const activityQuery = `
      SELECT 
        a.id, a.action, a.description, a.metadata, a.created_at,
        u.first_name, u.last_name, u.email as user_email
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.client_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM activities
      WHERE client_id = $1
    `;

    const [activityResult, countResult] = await Promise.all([
      pool.query(activityQuery, [id, limit, offset]),
      pool.query(countQuery, [id])
    ]);

    const activities = activityResult.rows.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.created_at,
      user: activity.user_email ? {
        firstName: activity.first_name,
        lastName: activity.last_name,
        email: activity.user_email
      } : null
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Get client activity error', {
      error: error.message,
      stack: error.stack,
      clientId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve client activity'
    });
  }
});

module.exports = router;