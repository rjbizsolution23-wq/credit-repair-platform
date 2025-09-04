const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { requireRole } = require('../middleware/auth');

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
  transports: [
    new winston.transports.File({ filename: 'logs/credit-reports.log' })
  ]
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'credit-reports');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 3 // Max 3 files (one per bureau)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and TXT files are allowed.'));
    }
  }
});

// Validation rules
const createReportValidation = [
  body('clientId').isUUID().withMessage('Valid client ID is required'),
  body('bureau').isIn(['experian', 'equifax', 'transunion']).withMessage('Valid bureau is required'),
  body('reportDate').isISO8601().withMessage('Valid report date is required'),
  body('creditScore').optional().isInt({ min: 300, max: 850 }).withMessage('Credit score must be between 300 and 850'),
  body('reportData').optional().isObject().withMessage('Report data must be an object')
];

const updateReportValidation = [
  body('creditScore').optional().isInt({ min: 300, max: 850 }).withMessage('Credit score must be between 300 and 850'),
  body('reportData').optional().isObject().withMessage('Report data must be an object'),
  body('status').optional().isIn(['pending', 'processed', 'error']).withMessage('Valid status is required')
];

// Get credit reports
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      clientId = '',
      bureau = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['created_at', 'report_date', 'credit_score', 'bureau'];
    const validSortOrders = ['ASC', 'DESC'];

    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Client filter
    if (clientId) {
      paramCount++;
      whereConditions.push(`cr.client_id = $${paramCount}`);
      queryParams.push(clientId);
    }

    // Bureau filter
    if (bureau) {
      paramCount++;
      whereConditions.push(`cr.bureau = $${paramCount}`);
      queryParams.push(bureau);
    }

    // Status filter
    if (status) {
      paramCount++;
      whereConditions.push(`cr.status = $${paramCount}`);
      queryParams.push(status);
    }

    // Date range filter
    if (dateFrom) {
      paramCount++;
      whereConditions.push(`cr.report_date >= $${paramCount}`);
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      whereConditions.push(`cr.report_date <= $${paramCount}`);
      queryParams.push(dateTo);
    }

    // Role-based access control
    if (req.user.role === 'user') {
      paramCount++;
      whereConditions.push(`c.assigned_user_id = $${paramCount}`);
      queryParams.push(req.user.id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM credit_reports cr
      JOIN clients c ON cr.client_id = c.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalReports = parseInt(countResult.rows[0].total);

    // Get credit reports with pagination
    const reportsQuery = `
      SELECT 
        cr.id,
        cr.client_id,
        cr.bureau,
        cr.report_date,
        cr.credit_score,
        cr.status,
        cr.file_path,
        cr.created_at,
        cr.updated_at,
        c.first_name,
        c.last_name,
        c.email,
        u.first_name as assigned_user_first_name,
        u.last_name as assigned_user_last_name
      FROM credit_reports cr
      JOIN clients c ON cr.client_id = c.id
      LEFT JOIN users u ON c.assigned_user_id = u.id
      ${whereClause}
      ORDER BY cr.${orderBy} ${order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const reportsResult = await pool.query(reportsQuery, queryParams);

    const totalPages = Math.ceil(totalReports / limit);

    res.json({
      reports: reportsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReports,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

    logger.info('Credit reports retrieved', {
      userId: req.user.id,
      filters: { clientId, bureau, status, dateFrom, dateTo },
      resultCount: reportsResult.rows.length
    });

  } catch (error) {
    logger.error('Error retrieving credit reports:', error);
    res.status(500).json({ error: 'Failed to retrieve credit reports' });
  }
});

// Get credit report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let reportQuery = `
      SELECT 
        cr.id,
        cr.client_id,
        cr.bureau,
        cr.report_date,
        cr.credit_score,
        cr.status,
        cr.file_path,
        cr.report_data,
        cr.created_at,
        cr.updated_at,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.date_of_birth,
        c.ssn_last_four,
        u.first_name as assigned_user_first_name,
        u.last_name as assigned_user_last_name
      FROM credit_reports cr
      JOIN clients c ON cr.client_id = c.id
      LEFT JOIN users u ON c.assigned_user_id = u.id
      WHERE cr.id = $1
    `;

    const queryParams = [id];

    // Role-based access control
    if (req.user.role === 'user') {
      reportQuery += ' AND c.assigned_user_id = $2';
      queryParams.push(req.user.id);
    }

    const result = await pool.query(reportQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credit report not found' });
    }

    const report = result.rows[0];

    // Get related disputes
    const disputesQuery = `
      SELECT 
        id,
        item_name,
        dispute_reason,
        status,
        created_at
      FROM disputes
      WHERE client_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const disputesResult = await pool.query(disputesQuery, [report.client_id]);

    // Get AI insights for this report
    const insightsQuery = `
      SELECT 
        insight_type,
        content,
        confidence_score,
        created_at
      FROM ai_insights
      WHERE credit_report_id = $1
      ORDER BY created_at DESC
    `;
    const insightsResult = await pool.query(insightsQuery, [id]);

    res.json({
      report,
      relatedDisputes: disputesResult.rows,
      aiInsights: insightsResult.rows
    });

    logger.info('Credit report retrieved', {
      userId: req.user.id,
      reportId: id,
      clientId: report.client_id
    });

  } catch (error) {
    logger.error('Error retrieving credit report:', error);
    res.status(500).json({ error: 'Failed to retrieve credit report' });
  }
});

// Upload and create credit report
router.post('/', upload.single('reportFile'), createReportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientId,
      bureau,
      reportDate,
      creditScore,
      reportData = {}
    } = req.body;

    // Validate client exists and user has access
    let clientQuery = 'SELECT id, first_name, last_name FROM clients WHERE id = $1';
    const clientParams = [clientId];

    if (req.user.role === 'user') {
      clientQuery += ' AND assigned_user_id = $2';
      clientParams.push(req.user.id);
    }

    const clientResult = await pool.query(clientQuery, clientParams);
    if (clientResult.rows.length === 0) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ error: 'Client not found or access denied' });
    }

    const client = clientResult.rows[0];

    // Check for existing report for same client and bureau on same date
    const existingReportQuery = `
      SELECT id FROM credit_reports 
      WHERE client_id = $1 AND bureau = $2 AND report_date = $3
    `;
    const existingResult = await pool.query(existingReportQuery, [clientId, bureau, reportDate]);
    
    if (existingResult.rows.length > 0) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ 
        error: 'Credit report already exists for this client, bureau, and date' 
      });
    }

    const client_db = await pool.connect();
    
    try {
      await client_db.query('BEGIN');

      // Create credit report record
      const createReportQuery = `
        INSERT INTO credit_reports (
          client_id, bureau, report_date, credit_score, file_path, report_data, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, client_id, bureau, report_date, credit_score, status, created_at
      `;

      const reportResult = await client_db.query(createReportQuery, [
        clientId,
        bureau,
        reportDate,
        creditScore || null,
        req.file ? req.file.path : null,
        JSON.stringify(reportData),
        'pending'
      ]);

      const report = reportResult.rows[0];

      // Log activity
      await client_db.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          req.user.id,
          clientId,
          'credit_report_uploaded',
          `Uploaded ${bureau} credit report for ${client.first_name} ${client.last_name}`,
          JSON.stringify({ 
            reportId: report.id, 
            bureau, 
            reportDate,
            hasFile: !!req.file
          })
        ]
      );

      await client_db.query('COMMIT');

      res.status(201).json({
        message: 'Credit report uploaded successfully',
        report
      });

      logger.info('Credit report created', {
        userId: req.user.id,
        reportId: report.id,
        clientId,
        bureau,
        hasFile: !!req.file
      });

    } catch (error) {
      await client_db.query('ROLLBACK');
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      throw error;
    } finally {
      client_db.release();
    }

  } catch (error) {
    logger.error('Error creating credit report:', error);
    res.status(500).json({ error: 'Failed to create credit report' });
  }
});

// Update credit report
router.put('/:id', updateReportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { creditScore, reportData, status } = req.body;

    // Check if report exists and user has access
    let reportQuery = `
      SELECT cr.id, cr.client_id, c.first_name, c.last_name
      FROM credit_reports cr
      JOIN clients c ON cr.client_id = c.id
      WHERE cr.id = $1
    `;
    const queryParams = [id];

    if (req.user.role === 'user') {
      reportQuery += ' AND c.assigned_user_id = $2';
      queryParams.push(req.user.id);
    }

    const reportResult = await pool.query(reportQuery, queryParams);
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit report not found or access denied' });
    }

    const report = reportResult.rows[0];

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;

    if (creditScore !== undefined) {
      paramCount++;
      updateFields.push(`credit_score = $${paramCount}`);
      updateParams.push(creditScore);
    }

    if (reportData !== undefined) {
      paramCount++;
      updateFields.push(`report_data = $${paramCount}`);
      updateParams.push(JSON.stringify(reportData));
    }

    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(id);

    const updateQuery = `
      UPDATE credit_reports 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING id, client_id, bureau, report_date, credit_score, status, updated_at
    `;

    const updateResult = await pool.query(updateQuery, updateParams);
    const updatedReport = updateResult.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
      [
        req.user.id,
        report.client_id,
        'credit_report_updated',
        `Updated credit report for ${report.first_name} ${report.last_name}`,
        JSON.stringify({ 
          reportId: id,
          updatedFields: Object.keys(req.body)
        })
      ]
    );

    res.json({
      message: 'Credit report updated successfully',
      report: updatedReport
    });

    logger.info('Credit report updated', {
      userId: req.user.id,
      reportId: id,
      updatedFields: Object.keys(req.body)
    });

  } catch (error) {
    logger.error('Error updating credit report:', error);
    res.status(500).json({ error: 'Failed to update credit report' });
  }
});

// Delete credit report
router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    // Get report details before deletion
    const reportQuery = `
      SELECT cr.id, cr.file_path, cr.client_id, c.first_name, c.last_name
      FROM credit_reports cr
      JOIN clients c ON cr.client_id = c.id
      WHERE cr.id = $1
    `;
    const reportResult = await pool.query(reportQuery, [id]);

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit report not found' });
    }

    const report = reportResult.rows[0];
    const client_db = await pool.connect();

    try {
      await client_db.query('BEGIN');

      // Delete related AI insights
      await client_db.query('DELETE FROM ai_insights WHERE credit_report_id = $1', [id]);

      // Delete credit report
      await client_db.query('DELETE FROM credit_reports WHERE id = $1', [id]);

      // Log activity
      await client_db.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          req.user.id,
          report.client_id,
          'credit_report_deleted',
          `Deleted credit report for ${report.first_name} ${report.last_name}`,
          JSON.stringify({ reportId: id })
        ]
      );

      await client_db.query('COMMIT');

      // Delete physical file if exists
      if (report.file_path) {
        await fs.unlink(report.file_path).catch(error => {
          logger.warn('Failed to delete credit report file:', { 
            filePath: report.file_path, 
            error: error.message 
          });
        });
      }

      res.json({ message: 'Credit report deleted successfully' });

      logger.info('Credit report deleted', {
        userId: req.user.id,
        reportId: id,
        clientId: report.client_id
      });

    } catch (error) {
      await client_db.query('ROLLBACK');
      throw error;
    } finally {
      client_db.release();
    }

  } catch (error) {
    logger.error('Error deleting credit report:', error);
    res.status(500).json({ error: 'Failed to delete credit report' });
  }
});

// Download credit report file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    // Get report file path with access control
    let reportQuery = `
      SELECT cr.file_path, cr.bureau, c.first_name, c.last_name
      FROM credit_reports cr
      JOIN clients c ON cr.client_id = c.id
      WHERE cr.id = $1
    `;
    const queryParams = [id];

    if (req.user.role === 'user') {
      reportQuery += ' AND c.assigned_user_id = $2';
      queryParams.push(req.user.id);
    }

    const result = await pool.query(reportQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Credit report not found or access denied' });
    }

    const report = result.rows[0];

    if (!report.file_path) {
      return res.status(404).json({ error: 'No file associated with this credit report' });
    }

    // Check if file exists
    try {
      await fs.access(report.file_path);
    } catch (error) {
      return res.status(404).json({ error: 'Credit report file not found on server' });
    }

    // Set appropriate headers
    const fileName = `${report.first_name}_${report.last_name}_${report.bureau}_credit_report${path.extname(report.file_path)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Stream the file
    const fileStream = require('fs').createReadStream(report.file_path);
    fileStream.pipe(res);

    // Log download activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'credit_report_downloaded',
        `Downloaded credit report for ${report.first_name} ${report.last_name}`,
        JSON.stringify({ reportId: id, bureau: report.bureau })
      ]
    );

    logger.info('Credit report downloaded', {
      userId: req.user.id,
      reportId: id,
      fileName
    });

  } catch (error) {
    logger.error('Error downloading credit report:', error);
    res.status(500).json({ error: 'Failed to download credit report' });
  }
});

// Get credit report analytics
router.get('/analytics/summary', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // Basic statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN bureau = 'experian' THEN 1 END) as experian_reports,
        COUNT(CASE WHEN bureau = 'equifax' THEN 1 END) as equifax_reports,
        COUNT(CASE WHEN bureau = 'transunion' THEN 1 END) as transunion_reports,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '${days} days' THEN 1 END) as recent_reports,
        AVG(CASE WHEN credit_score IS NOT NULL THEN credit_score END) as avg_credit_score,
        MIN(CASE WHEN credit_score IS NOT NULL THEN credit_score END) as min_credit_score,
        MAX(CASE WHEN credit_score IS NOT NULL THEN credit_score END) as max_credit_score
      FROM credit_reports
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Credit score distribution
    const distributionQuery = `
      SELECT 
        CASE 
          WHEN credit_score >= 800 THEN 'Excellent (800+)'
          WHEN credit_score >= 740 THEN 'Very Good (740-799)'
          WHEN credit_score >= 670 THEN 'Good (670-739)'
          WHEN credit_score >= 580 THEN 'Fair (580-669)'
          WHEN credit_score < 580 THEN 'Poor (<580)'
          ELSE 'Unknown'
        END as score_range,
        COUNT(*) as count
      FROM credit_reports
      WHERE credit_score IS NOT NULL
      GROUP BY score_range
      ORDER BY MIN(COALESCE(credit_score, 0)) DESC
    `;

    const distributionResult = await pool.query(distributionQuery);

    // Monthly trends
    const trendsQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as report_count,
        AVG(CASE WHEN credit_score IS NOT NULL THEN credit_score END) as avg_score
      FROM credit_reports
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    const trendsResult = await pool.query(trendsQuery);

    // Bureau comparison
    const bureauQuery = `
      SELECT 
        bureau,
        COUNT(*) as total_reports,
        AVG(CASE WHEN credit_score IS NOT NULL THEN credit_score END) as avg_score,
        COUNT(CASE WHEN status = 'processed' THEN 1 END) as processed_count
      FROM credit_reports
      GROUP BY bureau
      ORDER BY total_reports DESC
    `;

    const bureauResult = await pool.query(bureauQuery);

    res.json({
      summary: {
        totalReports: parseInt(stats.total_reports),
        experianReports: parseInt(stats.experian_reports),
        equifaxReports: parseInt(stats.equifax_reports),
        transunionReports: parseInt(stats.transunion_reports),
        processedReports: parseInt(stats.processed_reports),
        pendingReports: parseInt(stats.pending_reports),
        recentReports: parseInt(stats.recent_reports),
        avgCreditScore: stats.avg_credit_score ? parseFloat(stats.avg_credit_score).toFixed(1) : null,
        minCreditScore: stats.min_credit_score ? parseInt(stats.min_credit_score) : null,
        maxCreditScore: stats.max_credit_score ? parseInt(stats.max_credit_score) : null
      },
      scoreDistribution: distributionResult.rows.map(row => ({
        range: row.score_range,
        count: parseInt(row.count)
      })),
      monthlyTrends: trendsResult.rows.map(row => ({
        month: row.month,
        reportCount: parseInt(row.report_count),
        avgScore: row.avg_score ? parseFloat(row.avg_score).toFixed(1) : null
      })),
      bureauComparison: bureauResult.rows.map(row => ({
        bureau: row.bureau,
        totalReports: parseInt(row.total_reports),
        avgScore: row.avg_score ? parseFloat(row.avg_score).toFixed(1) : null,
        processedCount: parseInt(row.processed_count)
      }))
    });

    logger.info('Credit report analytics retrieved', {
      userId: req.user.id,
      period: days
    });

  } catch (error) {
    logger.error('Error retrieving credit report analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve credit report analytics' });
  }
});

// Bulk upload credit reports
router.post('/bulk', upload.array('reportFiles', 10), requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { reports } = req.body;

    if (!Array.isArray(reports) || reports.length === 0) {
      // Clean up uploaded files
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ error: 'Reports array is required' });
    }

    if (reports.length > 10) {
      // Clean up uploaded files
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
      return res.status(400).json({ error: 'Maximum 10 reports allowed per bulk operation' });
    }

    const client_db = await pool.connect();
    const createdReports = [];
    const errors = [];

    try {
      await client_db.query('BEGIN');

      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        const file = req.files ? req.files[i] : null;

        try {
          const { clientId, bureau, reportDate, creditScore, reportData = {} } = report;

          // Validate required fields
          if (!clientId || !bureau || !reportDate) {
            errors.push({
              index: i,
              error: 'Client ID, bureau, and report date are required'
            });
            continue;
          }

          // Validate client exists
          const clientResult = await client_db.query(
            'SELECT id, first_name, last_name FROM clients WHERE id = $1',
            [clientId]
          );

          if (clientResult.rows.length === 0) {
            errors.push({
              index: i,
              error: 'Client not found'
            });
            continue;
          }

          // Check for duplicate
          const duplicateResult = await client_db.query(
            'SELECT id FROM credit_reports WHERE client_id = $1 AND bureau = $2 AND report_date = $3',
            [clientId, bureau, reportDate]
          );

          if (duplicateResult.rows.length > 0) {
            errors.push({
              index: i,
              error: 'Duplicate report for this client, bureau, and date'
            });
            continue;
          }

          // Create report
          const createResult = await client_db.query(
            `INSERT INTO credit_reports (
              client_id, bureau, report_date, credit_score, file_path, report_data, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, client_id, bureau, report_date, credit_score, status, created_at`,
            [
              clientId,
              bureau,
              reportDate,
              creditScore || null,
              file ? file.path : null,
              JSON.stringify(reportData),
              'pending'
            ]
          );

          createdReports.push(createResult.rows[0]);

        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      await client_db.query('COMMIT');

      // Log activity
      if (createdReports.length > 0) {
        await pool.query(
          'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
          [
            req.user.id,
            'bulk_credit_reports_uploaded',
            `Bulk uploaded ${createdReports.length} credit reports`,
            JSON.stringify({ 
              successCount: createdReports.length,
              errorCount: errors.length
            })
          ]
        );
      }

      res.status(201).json({
        message: `Bulk upload completed. ${createdReports.length} reports created, ${errors.length} errors.`,
        createdReports,
        errors
      });

      logger.info('Bulk credit reports uploaded', {
        userId: req.user.id,
        successCount: createdReports.length,
        errorCount: errors.length
      });

    } catch (error) {
      await client_db.query('ROLLBACK');
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
      throw error;
    } finally {
      client_db.release();
    }

  } catch (error) {
    logger.error('Error in bulk credit report upload:', error);
    res.status(500).json({ error: 'Failed to process bulk credit report upload' });
  }
});

module.exports = router;