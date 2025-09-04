const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const { authenticateToken, requireStaff } = require('../middleware/auth');
const letterService = require('../services/letterService');
const aiService = require('../services/aiService');
const fs = require('fs').promises;
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const router = express.Router();

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Validation rules
const generateLetterValidation = [
  body('disputeId')
    .isUUID()
    .withMessage('Dispute ID must be a valid UUID'),
  body('letterType')
    .isIn(['initial', 'follow_up', 'escalation', 'final', 'custom'])
    .withMessage('Invalid letter type'),
  body('customContent')
    .optional()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Custom content must be between 10 and 5000 characters'),
  body('enhanceWithAI')
    .optional()
    .isBoolean()
    .withMessage('Enhance with AI must be a boolean'),
  body('sendImmediately')
    .optional()
    .isBoolean()
    .withMessage('Send immediately must be a boolean')
];

const sendLetterValidation = [
  body('letterId')
    .isUUID()
    .withMessage('Letter ID must be a valid UUID'),
  body('sendMethod')
    .isIn(['email', 'mail', 'fax'])
    .withMessage('Invalid send method'),
  body('recipientEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
  body('recipientAddress')
    .optional()
    .isObject()
    .withMessage('Recipient address must be an object')
];

const createTemplateValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name is required and must be less than 100 characters'),
  body('disputeType')
    .isLength({ min: 1, max: 50 })
    .withMessage('Dispute type is required'),
  body('letterType')
    .isIn(['initial', 'follow_up', 'escalation', 'final'])
    .withMessage('Invalid letter type'),
  body('content')
    .isLength({ min: 50, max: 10000 })
    .withMessage('Content must be between 50 and 10000 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean')
];

/**
 * @route GET /api/letters
 * @desc Get letters with filtering
 * @access Private (Staff)
 */
router.get('/',
  authenticateToken,
  requireStaff,
  [
    query('disputeId')
      .optional()
      .isUUID()
      .withMessage('Dispute ID must be a valid UUID'),
    query('clientId')
      .optional()
      .isUUID()
      .withMessage('Client ID must be a valid UUID'),
    query('letterType')
      .optional()
      .isIn(['initial', 'follow_up', 'escalation', 'final', 'custom'])
      .withMessage('Invalid letter type'),
    query('status')
      .optional()
      .isIn(['draft', 'generated', 'sent', 'delivered', 'failed'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        disputeId,
        clientId,
        letterType,
        status,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (disputeId) {
        whereConditions.push(`l.dispute_id = $${paramIndex}`);
        queryParams.push(disputeId);
        paramIndex++;
      }

      if (clientId) {
        whereConditions.push(`d.client_id = $${paramIndex}`);
        queryParams.push(clientId);
        paramIndex++;
      }

      if (letterType) {
        whereConditions.push(`l.letter_type = $${paramIndex}`);
        queryParams.push(letterType);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`l.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM letters l
        LEFT JOIN disputes d ON l.dispute_id = d.id
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const totalLetters = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalLetters / limit);

      // Get letters
      const lettersQuery = `
        SELECT 
          l.*,
          d.account_name,
          d.dispute_reason,
          d.bureau,
          c.first_name,
          c.last_name,
          c.email
        FROM letters l
        LEFT JOIN disputes d ON l.dispute_id = d.id
        LEFT JOIN clients c ON d.client_id = c.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const lettersResult = await pool.query(lettersQuery, queryParams);

      const letters = lettersResult.rows.map(letter => ({
        id: letter.id,
        disputeId: letter.dispute_id,
        letterType: letter.letter_type,
        status: letter.status,
        subject: letter.subject,
        recipientName: letter.recipient_name,
        recipientAddress: letter.recipient_address,
        sentAt: letter.sent_at,
        deliveredAt: letter.delivered_at,
        createdAt: letter.created_at,
        dispute: {
          accountName: letter.account_name,
          disputeReason: letter.dispute_reason,
          bureau: letter.bureau
        },
        client: letter.first_name ? {
          name: `${letter.first_name} ${letter.last_name}`,
          email: letter.email
        } : null
      }));

      res.json({
        success: true,
        data: {
          letters,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalLetters,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get letters error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve letters',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/letters/:id
 * @desc Get specific letter details
 * @access Private (Staff)
 */
router.get('/:id',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Letter ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      const letterQuery = `
        SELECT 
          l.*,
          d.account_name,
          d.dispute_reason,
          d.dispute_type,
          d.bureau,
          d.account_number,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.address
        FROM letters l
        LEFT JOIN disputes d ON l.dispute_id = d.id
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE l.id = $1
      `;

      const result = await pool.query(letterQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      const letter = result.rows[0];

      // Get letter tracking history
      const trackingQuery = `
        SELECT *
        FROM letter_tracking
        WHERE letter_id = $1
        ORDER BY created_at ASC
      `;

      const trackingResult = await pool.query(trackingQuery, [id]);
      const tracking = trackingResult.rows;

      res.json({
        success: true,
        data: {
          letter: {
            id: letter.id,
            disputeId: letter.dispute_id,
            letterType: letter.letter_type,
            status: letter.status,
            subject: letter.subject,
            content: letter.content,
            recipientName: letter.recipient_name,
            recipientAddress: letter.recipient_address,
            recipientEmail: letter.recipient_email,
            sentAt: letter.sent_at,
            deliveredAt: letter.delivered_at,
            createdAt: letter.created_at,
            updatedAt: letter.updated_at,
            dispute: {
              accountName: letter.account_name,
              disputeReason: letter.dispute_reason,
              disputeType: letter.dispute_type,
              bureau: letter.bureau,
              accountNumber: letter.account_number
            },
            client: {
              name: `${letter.first_name} ${letter.last_name}`,
              email: letter.email,
              phone: letter.phone,
              address: letter.address
            },
            tracking
          }
        }
      });

    } catch (error) {
      logger.error('Get letter details error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        letterId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve letter details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/letters/generate
 * @desc Generate new dispute letter
 * @access Private (Staff)
 */
router.post('/generate',
  authenticateToken,
  requireStaff,
  generateLetterValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        disputeId,
        letterType,
        customContent,
        enhanceWithAI = false,
        sendImmediately = false
      } = req.body;

      // Get dispute details
      const disputeQuery = `
        SELECT 
          d.*,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.address,
          c.ssn
        FROM disputes d
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE d.id = $1
      `;

      const disputeResult = await pool.query(disputeQuery, [disputeId]);

      if (disputeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      const dispute = disputeResult.rows[0];

      // Check if this letter type already exists for this dispute
      const existingLetterCheck = await pool.query(
        'SELECT id FROM letters WHERE dispute_id = $1 AND letter_type = $2',
        [disputeId, letterType]
      );

      if (existingLetterCheck.rows.length > 0 && letterType !== 'custom') {
        return res.status(400).json({
          success: false,
          message: `${letterType} letter already exists for this dispute`
        });
      }

      let letterContent;
      let subject;

      if (letterType === 'custom' && customContent) {
        letterContent = customContent;
        subject = `Custom Dispute Letter - ${dispute.account_name}`;
      } else {
        // Generate letter using letter service
        const generatedLetter = await letterService.generateLetter(
          dispute.dispute_type,
          letterType,
          {
            clientName: `${dispute.first_name} ${dispute.last_name}`,
            clientAddress: dispute.address,
            accountName: dispute.account_name,
            accountNumber: dispute.account_number,
            disputeReason: dispute.dispute_reason,
            bureau: dispute.bureau,
            instructions: dispute.instructions
          }
        );

        letterContent = generatedLetter.content;
        subject = generatedLetter.subject;
      }

      // Enhance with AI if requested
      if (enhanceWithAI && letterContent) {
        try {
          const enhancedContent = await aiService.enhanceLetterContent(
            letterContent,
            dispute.bureau,
            dispute.dispute_type
          );
          letterContent = enhancedContent;
        } catch (aiError) {
          logger.warn('AI enhancement failed, using original content', {
            error: aiError.message,
            disputeId
          });
        }
      }

      // Get bureau address
      const bureauAddress = letterService.getBureauAddress(dispute.bureau);

      const dbClient = await pool.connect();

      try {
        await dbClient.query('BEGIN');

        // Create letter record
        const letterQuery = `
          INSERT INTO letters (
            dispute_id, letter_type, status, subject, content,
            recipient_name, recipient_address, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const letterResult = await dbClient.query(letterQuery, [
          disputeId,
          letterType,
          'generated',
          subject,
          letterContent,
          `${dispute.bureau} Credit Bureau`,
          JSON.stringify(bureauAddress),
          req.user.id
        ]);

        const letter = letterResult.rows[0];

        // Create initial tracking entry
        await dbClient.query(
          `INSERT INTO letter_tracking (letter_id, status, description, created_by)
           VALUES ($1, $2, $3, $4)`,
          [
            letter.id,
            'generated',
            `Letter generated by ${req.user.firstName} ${req.user.lastName}`,
            req.user.id
          ]
        );

        // Log activity
        await dbClient.query(
          `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            dispute.client_id,
            req.user.id,
            'letter_generated',
            `${letterType} letter generated for ${dispute.account_name}`,
            JSON.stringify({
              letterId: letter.id,
              disputeId,
              letterType,
              enhancedWithAI: enhanceWithAI
            })
          ]
        );

        await dbClient.query('COMMIT');

        // Send immediately if requested
        if (sendImmediately) {
          try {
            await sendLetterByMail(letter.id, bureauAddress);
          } catch (sendError) {
            logger.error('Failed to send letter immediately', {
              error: sendError.message,
              letterId: letter.id
            });
          }
        }

        logger.info('Letter generated successfully', {
          letterId: letter.id,
          disputeId,
          letterType,
          enhancedWithAI: enhanceWithAI,
          sentImmediately: sendImmediately,
          createdBy: req.user.id
        });

        res.status(201).json({
          success: true,
          message: 'Letter generated successfully',
          data: {
            letter: {
              id: letter.id,
              disputeId: letter.dispute_id,
              letterType: letter.letter_type,
              status: letter.status,
              subject: letter.subject,
              content: letter.content,
              recipientName: letter.recipient_name,
              recipientAddress: letter.recipient_address,
              createdAt: letter.created_at
            }
          }
        });

      } catch (dbError) {
        await dbClient.query('ROLLBACK');
        throw dbError;
      } finally {
        dbClient.release();
      }

    } catch (error) {
      logger.error('Generate letter error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate letter',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/letters/:id/send
 * @desc Send letter via specified method
 * @access Private (Staff)
 */
router.post('/:id/send',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Letter ID must be a valid UUID'),
    ...sendLetterValidation
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { sendMethod, recipientEmail, recipientAddress } = req.body;

      // Get letter details
      const letterQuery = `
        SELECT 
          l.*,
          d.client_id,
          c.first_name,
          c.last_name,
          c.email
        FROM letters l
        LEFT JOIN disputes d ON l.dispute_id = d.id
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE l.id = $1
      `;

      const letterResult = await pool.query(letterQuery, [id]);

      if (letterResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      const letter = letterResult.rows[0];

      if (letter.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Letter has already been sent'
        });
      }

      let sendResult;

      try {
        switch (sendMethod) {
          case 'email':
            if (!recipientEmail) {
              return res.status(400).json({
                success: false,
                message: 'Recipient email is required for email sending'
              });
            }
            sendResult = await sendLetterByEmail(letter, recipientEmail);
            break;

          case 'mail':
            const address = recipientAddress || JSON.parse(letter.recipient_address);
            sendResult = await sendLetterByMail(letter, address);
            break;

          case 'fax':
            sendResult = await sendLetterByFax(letter);
            break;

          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid send method'
            });
        }

        // Update letter status
        await pool.query(
          `UPDATE letters 
           SET status = 'sent', sent_at = CURRENT_TIMESTAMP, 
               recipient_email = $1, send_method = $2
           WHERE id = $3`,
          [recipientEmail, sendMethod, id]
        );

        // Add tracking entry
        await pool.query(
          `INSERT INTO letter_tracking (letter_id, status, description, metadata, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            'sent',
            `Letter sent via ${sendMethod}`,
            JSON.stringify({ sendMethod, sendResult }),
            req.user.id
          ]
        );

        // Log activity
        await pool.query(
          `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            letter.client_id,
            req.user.id,
            'letter_sent',
            `Letter sent via ${sendMethod} for ${letter.subject}`,
            JSON.stringify({
              letterId: id,
              sendMethod,
              recipientEmail,
              sendResult
            })
          ]
        );

        logger.info('Letter sent successfully', {
          letterId: id,
          sendMethod,
          recipientEmail,
          sentBy: req.user.id
        });

        res.json({
          success: true,
          message: `Letter sent successfully via ${sendMethod}`,
          data: {
            sendResult,
            sentAt: new Date().toISOString()
          }
        });

      } catch (sendError) {
        // Update letter status to failed
        await pool.query(
          `UPDATE letters SET status = 'failed' WHERE id = $1`,
          [id]
        );

        // Add tracking entry for failure
        await pool.query(
          `INSERT INTO letter_tracking (letter_id, status, description, metadata, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            'failed',
            `Failed to send letter via ${sendMethod}: ${sendError.message}`,
            JSON.stringify({ sendMethod, error: sendError.message }),
            req.user.id
          ]
        );

        throw sendError;
      }

    } catch (error) {
      logger.error('Send letter error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        letterId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send letter',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/letters/:id/pdf
 * @desc Generate and download letter as PDF
 * @access Private (Staff)
 */
router.get('/:id/pdf',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Letter ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;

      // Get letter details
      const letterQuery = `
        SELECT 
          l.*,
          d.account_name,
          d.dispute_reason,
          c.first_name,
          c.last_name,
          c.address
        FROM letters l
        LEFT JOIN disputes d ON l.dispute_id = d.id
        LEFT JOIN clients c ON d.client_id = c.id
        WHERE l.id = $1
      `;

      const letterResult = await pool.query(letterQuery, [id]);

      if (letterResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Letter not found'
        });
      }

      const letter = letterResult.rows[0];

      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="letter-${id}.pdf"`);
      
      // Pipe PDF to response
      doc.pipe(res);

      // Add letterhead
      doc.fontSize(16)
         .text('Credit Repair Services', 50, 50)
         .fontSize(10)
         .text('Professional Credit Dispute Letter', 50, 70)
         .moveDown();

      // Add date
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 100)
         .moveDown();

      // Add recipient address
      const recipientAddress = JSON.parse(letter.recipient_address);
      doc.text('To:', 50, 130)
         .text(letter.recipient_name, 50, 145)
         .text(recipientAddress.street, 50, 160)
         .text(`${recipientAddress.city}, ${recipientAddress.state} ${recipientAddress.zipCode}`, 50, 175)
         .moveDown();

      // Add sender address
      const senderAddress = JSON.parse(letter.address || '{}');
      doc.text('From:', 350, 130)
         .text(`${letter.first_name} ${letter.last_name}`, 350, 145)
         .text(senderAddress.street || '', 350, 160)
         .text(`${senderAddress.city || ''}, ${senderAddress.state || ''} ${senderAddress.zipCode || ''}`, 350, 175)
         .moveDown();

      // Add subject
      doc.fontSize(12)
         .text(`Subject: ${letter.subject}`, 50, 220)
         .moveDown();

      // Add content
      doc.fontSize(10)
         .text(letter.content, 50, 250, {
           width: 500,
           align: 'left'
         });

      // Add signature line
      doc.moveDown(3)
         .text('Sincerely,', 50)
         .moveDown(2)
         .text(`${letter.first_name} ${letter.last_name}`, 50)
         .text('Date: _______________', 50);

      // Finalize PDF
      doc.end();

      logger.info('Letter PDF generated', {
        letterId: id,
        userId: req.user.id
      });

    } catch (error) {
      logger.error('Generate letter PDF error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        letterId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/letters/templates
 * @desc Get letter templates
 * @access Private (Staff)
 */
router.get('/templates',
  authenticateToken,
  requireStaff,
  [
    query('disputeType')
      .optional()
      .isLength({ min: 1 })
      .withMessage('Dispute type must not be empty'),
    query('letterType')
      .optional()
      .isIn(['initial', 'follow_up', 'escalation', 'final'])
      .withMessage('Invalid letter type'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('Is active must be a boolean')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { disputeType, letterType, isActive } = req.query;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (disputeType) {
        whereConditions.push(`dispute_type = $${paramIndex}`);
        queryParams.push(disputeType);
        paramIndex++;
      }

      if (letterType) {
        whereConditions.push(`letter_type = $${paramIndex}`);
        queryParams.push(letterType);
        paramIndex++;
      }

      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(isActive === 'true');
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const templatesQuery = `
        SELECT *
        FROM letter_templates
        ${whereClause}
        ORDER BY dispute_type, letter_type, created_at DESC
      `;

      const result = await pool.query(templatesQuery, queryParams);
      const templates = result.rows;

      res.json({
        success: true,
        data: { templates }
      });

    } catch (error) {
      logger.error('Get letter templates error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve letter templates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/letters/templates
 * @desc Create new letter template
 * @access Private (Staff)
 */
router.post('/templates',
  authenticateToken,
  requireStaff,
  createTemplateValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        disputeType,
        letterType,
        content,
        isActive = true
      } = req.body;

      // Check for duplicate template
      const duplicateCheck = await pool.query(
        'SELECT id FROM letter_templates WHERE name = $1 AND dispute_type = $2 AND letter_type = $3',
        [name, disputeType, letterType]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Template with this name, dispute type, and letter type already exists'
        });
      }

      // Create template
      const templateQuery = `
        INSERT INTO letter_templates (
          name, dispute_type, letter_type, content, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await pool.query(templateQuery, [
        name,
        disputeType,
        letterType,
        content,
        isActive,
        req.user.id
      ]);

      const template = result.rows[0];

      logger.info('Letter template created', {
        templateId: template.id,
        name,
        disputeType,
        letterType,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Letter template created successfully',
        data: { template }
      });

    } catch (error) {
      logger.error('Create letter template error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create letter template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Helper functions for sending letters
async function sendLetterByEmail(letter, recipientEmail) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@creditrepair.com',
    to: recipientEmail,
    subject: letter.subject,
    text: letter.content,
    html: `<pre>${letter.content}</pre>`
  };

  const result = await emailTransporter.sendMail(mailOptions);
  return {
    messageId: result.messageId,
    method: 'email',
    recipient: recipientEmail
  };
}

async function sendLetterByMail(letter, address) {
  // In a real implementation, this would integrate with a mail service API
  // For now, we'll simulate the process
  
  logger.info('Letter queued for postal mail', {
    letterId: letter.id,
    address
  });

  return {
    trackingNumber: `MAIL-${Date.now()}`,
    method: 'mail',
    address,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
  };
}

async function sendLetterByFax(letter) {
  // In a real implementation, this would integrate with a fax service API
  // For now, we'll simulate the process
  
  logger.info('Letter queued for fax', {
    letterId: letter.id
  });

  return {
    faxId: `FAX-${Date.now()}`,
    method: 'fax',
    status: 'queued'
  };
}

module.exports = router;