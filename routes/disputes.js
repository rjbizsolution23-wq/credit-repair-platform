const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const { requireStaff } = require('../middleware/auth');
const letterService = require('../services/letterService');
const aiService = require('../services/aiService');

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
const disputeValidation = [
  body('clientId')
    .isUUID()
    .withMessage('Valid client ID is required'),
  body('bureau')
    .isIn(['Experian', 'Equifax', 'TransUnion'])
    .withMessage('Bureau must be Experian, Equifax, or TransUnion'),
  body('accountName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Account name must be between 2 and 100 characters'),
  body('accountNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Account number must be less than 50 characters'),
  body('disputeReason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Dispute reason must be between 10 and 500 characters'),
  body('disputeType')
    .isIn([
      'not_mine',
      'paid_in_full',
      'incorrect_amount',
      'incorrect_date',
      'duplicate',
      'identity_theft',
      'mixed_file',
      'outdated',
      'other'
    ])
    .withMessage('Invalid dispute type'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Instructions must be less than 1000 characters')
];

// GET /api/disputes - Get all disputes with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('clientId').optional().isUUID().withMessage('Invalid client ID'),
  query('bureau').optional().isIn(['Experian', 'Equifax', 'TransUnion']).withMessage('Invalid bureau'),
  query('status').optional().isIn(['pending', 'submitted', 'investigating', 'resolved', 'rejected']).withMessage('Invalid status'),
  query('disputeType').optional().isIn(['not_mine', 'paid_in_full', 'incorrect_amount', 'incorrect_date', 'duplicate', 'identity_theft', 'mixed_file', 'outdated', 'other']).withMessage('Invalid dispute type'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'bureau', 'status', 'accountName']).withMessage('Invalid sort field'),
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
      clientId,
      bureau,
      status,
      disputeType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramIndex = 1;

    if (clientId) {
      whereConditions.push(`d.client_id = $${paramIndex}`);
      queryParams.push(clientId);
      paramIndex++;
    }

    if (bureau) {
      whereConditions.push(`d.bureau = $${paramIndex}`);
      queryParams.push(bureau);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`d.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (disputeType) {
      whereConditions.push(`d.dispute_type = $${paramIndex}`);
      queryParams.push(disputeType);
      paramIndex++;
    }

    // Main query
    const disputesQuery = `
      SELECT 
        d.id, d.client_id, d.bureau, d.account_name, d.account_number,
        d.dispute_reason, d.dispute_type, d.status, d.instructions,
        d.success_probability, d.created_at, d.updated_at, d.submitted_at,
        d.response_date, d.response_notes,
        c.first_name, c.last_name, c.email,
        COUNT(dl.id) as letter_count
      FROM disputes d
      INNER JOIN clients c ON d.client_id = c.id
      LEFT JOIN dispute_letters dl ON d.id = dl.dispute_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY d.id, c.first_name, c.last_name, c.email
      ORDER BY d.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM disputes d
      INNER JOIN clients c ON d.client_id = c.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [disputesResult, countResult] = await Promise.all([
      pool.query(disputesQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const disputes = disputesResult.rows.map(dispute => ({
      id: dispute.id,
      clientId: dispute.client_id,
      client: {
        firstName: dispute.first_name,
        lastName: dispute.last_name,
        email: dispute.email
      },
      bureau: dispute.bureau,
      accountName: dispute.account_name,
      accountNumber: dispute.account_number,
      disputeReason: dispute.dispute_reason,
      disputeType: dispute.dispute_type,
      status: dispute.status,
      instructions: dispute.instructions,
      successProbability: dispute.success_probability,
      letterCount: parseInt(dispute.letter_count),
      createdAt: dispute.created_at,
      updatedAt: dispute.updated_at,
      submittedAt: dispute.submitted_at,
      responseDate: dispute.response_date,
      responseNotes: dispute.response_notes
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      disputes,
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
    logger.error('Get disputes error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve disputes'
    });
  }
});

// GET /api/disputes/:id - Get specific dispute with full details
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid dispute ID')
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

    // Get dispute details
    const disputeQuery = `
      SELECT 
        d.*, 
        c.first_name, c.last_name, c.email, c.phone, c.address
      FROM disputes d
      INNER JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `;

    const disputeResult = await pool.query(disputeQuery, [id]);

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Dispute not found'
      });
    }

    const dispute = disputeResult.rows[0];

    // Get dispute letters
    const lettersQuery = `
      SELECT 
        id, letter_type, content, status, sent_date, created_at
      FROM dispute_letters 
      WHERE dispute_id = $1
      ORDER BY created_at DESC
    `;

    const lettersResult = await pool.query(lettersQuery, [id]);

    // Get dispute history/timeline
    const historyQuery = `
      SELECT 
        id, action, description, metadata, created_at,
        u.first_name as user_first_name, u.last_name as user_last_name
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.dispute_id = $1
      ORDER BY a.created_at DESC
    `;

    const historyResult = await pool.query(historyQuery, [id]);

    const disputeData = {
      id: dispute.id,
      clientId: dispute.client_id,
      client: {
        firstName: dispute.first_name,
        lastName: dispute.last_name,
        email: dispute.email,
        phone: dispute.phone,
        address: dispute.address
      },
      bureau: dispute.bureau,
      accountName: dispute.account_name,
      accountNumber: dispute.account_number,
      disputeReason: dispute.dispute_reason,
      disputeType: dispute.dispute_type,
      status: dispute.status,
      instructions: dispute.instructions,
      successProbability: dispute.success_probability,
      createdAt: dispute.created_at,
      updatedAt: dispute.updated_at,
      submittedAt: dispute.submitted_at,
      responseDate: dispute.response_date,
      responseNotes: dispute.response_notes,
      letters: lettersResult.rows.map(letter => ({
        id: letter.id,
        letterType: letter.letter_type,
        content: letter.content,
        status: letter.status,
        sentDate: letter.sent_date,
        createdAt: letter.created_at
      })),
      history: historyResult.rows.map(item => ({
        id: item.id,
        action: item.action,
        description: item.description,
        metadata: item.metadata,
        createdAt: item.created_at,
        user: item.user_first_name ? {
          firstName: item.user_first_name,
          lastName: item.user_last_name
        } : null
      }))
    };

    res.json({ dispute: disputeData });

  } catch (error) {
    logger.error('Get dispute error', {
      error: error.message,
      stack: error.stack,
      disputeId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve dispute'
    });
  }
});

// POST /api/disputes - Create new dispute
router.post('/', disputeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      clientId,
      bureau,
      accountName,
      accountNumber,
      disputeReason,
      disputeType,
      instructions = ''
    } = req.body;

    // Verify client exists
    const clientResult = await pool.query(
      'SELECT id, first_name, last_name FROM clients WHERE id = $1 AND status = $2',
      [clientId, 'active']
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Client not found or inactive'
      });
    }

    // Check for duplicate disputes
    const duplicateCheck = await pool.query(
      'SELECT id FROM disputes WHERE client_id = $1 AND bureau = $2 AND account_name = $3 AND status NOT IN ($4, $5)',
      [clientId, bureau, accountName, 'resolved', 'rejected']
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'Duplicate dispute',
        message: 'An active dispute for this account already exists'
      });
    }

    // Calculate success probability using AI service
    let successProbability = null;
    try {
      successProbability = await aiService.predictDisputeSuccess({
        bureau,
        disputeType,
        disputeReason,
        accountName
      });
    } catch (aiError) {
      logger.warn('AI prediction failed', {
        error: aiError.message,
        clientId,
        bureau,
        disputeType
      });
    }

    // Create dispute
    const disputeQuery = `
      INSERT INTO disputes (
        client_id, bureau, account_name, account_number, dispute_reason,
        dispute_type, instructions, status, success_probability, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
      RETURNING id, client_id, bureau, account_name, dispute_reason, dispute_type, 
                status, success_probability, created_at
    `;

    const newDispute = await pool.query(disputeQuery, [
      clientId,
      bureau,
      accountName,
      accountNumber,
      disputeReason,
      disputeType,
      instructions,
      successProbability
    ]);

    const dispute = newDispute.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (client_id, dispute_id, user_id, action, description, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        clientId,
        dispute.id,
        req.user.id,
        'dispute_created',
        `Dispute created for ${accountName} with ${bureau}`
      ]
    );

    // Generate initial dispute letter
    try {
      const letterContent = await letterService.generateDisputeLetter({
        client: clientResult.rows[0],
        dispute: {
          bureau,
          accountName,
          accountNumber,
          disputeReason,
          disputeType
        }
      });

      await pool.query(
        'INSERT INTO dispute_letters (dispute_id, letter_type, content, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [dispute.id, 'initial', letterContent, 'draft']
      );
    } catch (letterError) {
      logger.warn('Failed to generate initial letter', {
        error: letterError.message,
        disputeId: dispute.id
      });
    }

    logger.info('Dispute created successfully', {
      disputeId: dispute.id,
      clientId: clientId,
      bureau: bureau,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Dispute created successfully',
      dispute: {
        id: dispute.id,
        clientId: dispute.client_id,
        bureau: dispute.bureau,
        accountName: dispute.account_name,
        disputeReason: dispute.dispute_reason,
        disputeType: dispute.dispute_type,
        status: dispute.status,
        successProbability: dispute.success_probability,
        createdAt: dispute.created_at
      }
    });

  } catch (error) {
    logger.error('Create dispute error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to create dispute'
    });
  }
});

// PUT /api/disputes/:id/status - Update dispute status
router.put('/:id/status', [
  param('id').isUUID().withMessage('Invalid dispute ID'),
  body('status').isIn(['pending', 'submitted', 'investigating', 'resolved', 'rejected']).withMessage('Invalid status'),
  body('responseNotes').optional().trim().isLength({ max: 1000 }).withMessage('Response notes must be less than 1000 characters'),
  body('responseDate').optional().isISO8601().withMessage('Invalid response date')
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
    const { status, responseNotes, responseDate } = req.body;

    // Get current dispute
    const currentDispute = await pool.query(
      'SELECT id, client_id, status, bureau, account_name FROM disputes WHERE id = $1',
      [id]
    );

    if (currentDispute.rows.length === 0) {
      return res.status(404).json({
        error: 'Dispute not found'
      });
    }

    const dispute = currentDispute.rows[0];
    const oldStatus = dispute.status;

    // Update dispute status
    const updateQuery = `
      UPDATE disputes SET
        status = $1,
        response_notes = COALESCE($2, response_notes),
        response_date = COALESCE($3, response_date),
        updated_at = NOW()
      WHERE id = $4
      RETURNING status, response_notes, response_date, updated_at
    `;

    const updatedDispute = await pool.query(updateQuery, [
      status,
      responseNotes,
      responseDate,
      id
    ]);

    // Log status change activity
    await pool.query(
      'INSERT INTO activities (client_id, dispute_id, user_id, action, description, metadata, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [
        dispute.client_id,
        id,
        req.user.id,
        'status_changed',
        `Dispute status changed from ${oldStatus} to ${status}`,
        JSON.stringify({ oldStatus, newStatus: status, responseNotes })
      ]
    );

    logger.info('Dispute status updated', {
      disputeId: id,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.id
    });

    res.json({
      message: 'Dispute status updated successfully',
      dispute: {
        id,
        status: updatedDispute.rows[0].status,
        responseNotes: updatedDispute.rows[0].response_notes,
        responseDate: updatedDispute.rows[0].response_date,
        updatedAt: updatedDispute.rows[0].updated_at
      }
    });

  } catch (error) {
    logger.error('Update dispute status error', {
      error: error.message,
      stack: error.stack,
      disputeId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to update dispute status'
    });
  }
});

// POST /api/disputes/:id/letters - Generate and send dispute letter
router.post('/:id/letters', [
  param('id').isUUID().withMessage('Invalid dispute ID'),
  body('letterType').isIn(['initial', 'follow_up', 'escalation', 'final']).withMessage('Invalid letter type'),
  body('customContent').optional().trim().isLength({ max: 2000 }).withMessage('Custom content must be less than 2000 characters')
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
    const { letterType, customContent } = req.body;

    // Get dispute and client details
    const disputeQuery = `
      SELECT 
        d.*, 
        c.first_name, c.last_name, c.email, c.phone, c.address
      FROM disputes d
      INNER JOIN clients c ON d.client_id = c.id
      WHERE d.id = $1
    `;

    const disputeResult = await pool.query(disputeQuery, [id]);

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Dispute not found'
      });
    }

    const dispute = disputeResult.rows[0];

    // Generate letter content
    const letterContent = customContent || await letterService.generateDisputeLetter({
      client: {
        firstName: dispute.first_name,
        lastName: dispute.last_name,
        address: dispute.address
      },
      dispute: {
        bureau: dispute.bureau,
        accountName: dispute.account_name,
        accountNumber: dispute.account_number,
        disputeReason: dispute.dispute_reason,
        disputeType: dispute.dispute_type
      },
      letterType
    });

    // Save letter
    const letterQuery = `
      INSERT INTO dispute_letters (dispute_id, letter_type, content, status, created_at)
      VALUES ($1, $2, $3, 'draft', NOW())
      RETURNING id, letter_type, content, status, created_at
    `;

    const newLetter = await pool.query(letterQuery, [
      id,
      letterType,
      letterContent
    ]);

    const letter = newLetter.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (client_id, dispute_id, user_id, action, description, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [
        dispute.client_id,
        id,
        req.user.id,
        'letter_generated',
        `${letterType} letter generated for dispute`
      ]
    );

    logger.info('Dispute letter generated', {
      disputeId: id,
      letterId: letter.id,
      letterType,
      generatedBy: req.user.id
    });

    res.status(201).json({
      message: 'Dispute letter generated successfully',
      letter: {
        id: letter.id,
        letterType: letter.letter_type,
        content: letter.content,
        status: letter.status,
        createdAt: letter.created_at
      }
    });

  } catch (error) {
    logger.error('Generate dispute letter error', {
      error: error.message,
      stack: error.stack,
      disputeId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to generate dispute letter'
    });
  }
});

// GET /api/disputes/analytics/summary - Get dispute analytics summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_disputes,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_disputes,
        COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_disputes,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_disputes,
        ROUND(AVG(success_probability), 2) as avg_success_probability,
        COUNT(CASE WHEN bureau = 'Experian' THEN 1 END) as experian_disputes,
        COUNT(CASE WHEN bureau = 'Equifax' THEN 1 END) as equifax_disputes,
        COUNT(CASE WHEN bureau = 'TransUnion' THEN 1 END) as transunion_disputes
      FROM disputes
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const result = await pool.query(analyticsQuery);
    const analytics = result.rows[0];

    // Calculate success rate
    const totalCompleted = parseInt(analytics.resolved_disputes) + parseInt(analytics.rejected_disputes);
    const successRate = totalCompleted > 0 
      ? Math.round((parseInt(analytics.resolved_disputes) / totalCompleted) * 100)
      : 0;

    res.json({
      summary: {
        totalDisputes: parseInt(analytics.total_disputes),
        pendingDisputes: parseInt(analytics.pending_disputes),
        submittedDisputes: parseInt(analytics.submitted_disputes),
        investigatingDisputes: parseInt(analytics.investigating_disputes),
        resolvedDisputes: parseInt(analytics.resolved_disputes),
        rejectedDisputes: parseInt(analytics.rejected_disputes),
        successRate,
        avgSuccessProbability: parseFloat(analytics.avg_success_probability) || 0,
        bureauBreakdown: {
          experian: parseInt(analytics.experian_disputes),
          equifax: parseInt(analytics.equifax_disputes),
          transunion: parseInt(analytics.transunion_disputes)
        }
      }
    });

  } catch (error) {
    logger.error('Get dispute analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve dispute analytics'
    });
  }
});

module.exports = router;