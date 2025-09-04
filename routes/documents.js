const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, param, query, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const { authenticateToken, requireStaff } = require('../middleware/auth');
const encryptionService = require('../services/encryption');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, images, Word documents, and text files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Validation rules
const uploadValidation = [
  body('clientId')
    .optional()
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  body('disputeId')
    .optional()
    .isUUID()
    .withMessage('Dispute ID must be a valid UUID'),
  body('documentType')
    .isIn(['credit_report', 'dispute_letter', 'response_letter', 'supporting_document', 'identification', 'other'])
    .withMessage('Invalid document type'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('isConfidential')
    .optional()
    .isBoolean()
    .withMessage('isConfidential must be a boolean')
];

const getDocumentsValidation = [
  query('clientId')
    .optional()
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  query('disputeId')
    .optional()
    .isUUID()
    .withMessage('Dispute ID must be a valid UUID'),
  query('documentType')
    .optional()
    .isIn(['credit_report', 'dispute_letter', 'response_letter', 'supporting_document', 'identification', 'other'])
    .withMessage('Invalid document type'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * @route POST /api/documents/upload
 * @desc Upload documents
 * @access Private (Staff)
 */
router.post('/upload', 
  authenticateToken,
  requireStaff,
  upload.array('files', 5),
  uploadValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              logger.error('Failed to clean up file after validation error', {
                file: file.path,
                error: unlinkError.message
              });
            }
          }
        }
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const {
        clientId,
        disputeId,
        documentType,
        description,
        isConfidential = false
      } = req.body;

      // Verify client exists if clientId provided
      if (clientId) {
        const clientCheck = await pool.query(
          'SELECT id FROM clients WHERE id = $1 AND status != $2',
          [clientId, 'deleted']
        );
        
        if (clientCheck.rows.length === 0) {
          // Clean up uploaded files
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              logger.error('Failed to clean up file after client check', {
                file: file.path,
                error: unlinkError.message
              });
            }
          }
          return res.status(404).json({
            success: false,
            message: 'Client not found'
          });
        }
      }

      // Verify dispute exists if disputeId provided
      if (disputeId) {
        const disputeCheck = await pool.query(
          'SELECT id FROM disputes WHERE id = $1',
          [disputeId]
        );
        
        if (disputeCheck.rows.length === 0) {
          // Clean up uploaded files
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              logger.error('Failed to clean up file after dispute check', {
                file: file.path,
                error: unlinkError.message
              });
            }
          }
          return res.status(404).json({
            success: false,
            message: 'Dispute not found'
          });
        }
      }

      const uploadedDocuments = [];
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (const file of req.files) {
          // Calculate file hash for deduplication
          const fileBuffer = await fs.readFile(file.path);
          const fileHash = encryptionService.createHash(fileBuffer.toString('base64'));

          // Check for duplicate files
          const duplicateCheck = await client.query(
            'SELECT id, original_name FROM documents WHERE file_hash = $1',
            [fileHash]
          );

          if (duplicateCheck.rows.length > 0) {
            // Remove the uploaded file since it's a duplicate
            await fs.unlink(file.path);
            
            logger.warn('Duplicate file upload attempted', {
              originalName: file.originalname,
              existingDocument: duplicateCheck.rows[0],
              uploadedBy: req.user.id
            });
            
            continue; // Skip this file
          }

          // Insert document record
          const insertQuery = `
            INSERT INTO documents (
              client_id, dispute_id, document_type, original_name, 
              file_name, file_path, file_size, mime_type, 
              file_hash, description, is_confidential, uploaded_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
          `;

          const result = await client.query(insertQuery, [
            clientId || null,
            disputeId || null,
            documentType,
            file.originalname,
            file.filename,
            file.path,
            file.size,
            file.mimetype,
            fileHash,
            description || null,
            isConfidential,
            req.user.id
          ]);

          uploadedDocuments.push(result.rows[0]);

          // Log activity
          if (clientId) {
            await client.query(
              `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                clientId,
                req.user.id,
                'document_uploaded',
                `Document uploaded: ${file.originalname}`,
                JSON.stringify({
                  documentId: result.rows[0].id,
                  documentType,
                  fileName: file.originalname,
                  fileSize: file.size
                })
              ]
            );
          }
        }

        await client.query('COMMIT');

        logger.info('Documents uploaded successfully', {
          count: uploadedDocuments.length,
          clientId,
          disputeId,
          documentType,
          uploadedBy: req.user.id
        });

        res.status(201).json({
          success: true,
          message: `${uploadedDocuments.length} document(s) uploaded successfully`,
          data: {
            documents: uploadedDocuments.map(doc => ({
              id: doc.id,
              originalName: doc.original_name,
              documentType: doc.document_type,
              fileSize: doc.file_size,
              mimeType: doc.mime_type,
              description: doc.description,
              isConfidential: doc.is_confidential,
              uploadedAt: doc.created_at
            }))
          }
        });

      } catch (dbError) {
        await client.query('ROLLBACK');
        
        // Clean up uploaded files on database error
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            logger.error('Failed to clean up file after database error', {
              file: file.path,
              error: unlinkError.message
            });
          }
        }
        
        throw dbError;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Document upload error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to upload documents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/documents
 * @desc Get documents with filtering and pagination
 * @access Private (Staff)
 */
router.get('/',
  authenticateToken,
  requireStaff,
  getDocumentsValidation,
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
        clientId,
        disputeId,
        documentType,
        page = 1,
        limit = 20,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (clientId) {
        whereConditions.push(`d.client_id = $${paramIndex}`);
        queryParams.push(clientId);
        paramIndex++;
      }

      if (disputeId) {
        whereConditions.push(`d.dispute_id = $${paramIndex}`);
        queryParams.push(disputeId);
        paramIndex++;
      }

      if (documentType) {
        whereConditions.push(`d.document_type = $${paramIndex}`);
        queryParams.push(documentType);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(
          d.original_name ILIKE $${paramIndex} OR 
          d.description ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM documents d
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const totalDocuments = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalDocuments / limit);

      // Get documents
      const documentsQuery = `
        SELECT 
          d.*,
          c.first_name,
          c.last_name,
          c.email as client_email,
          u.first_name as uploader_first_name,
          u.last_name as uploader_last_name
        FROM documents d
        LEFT JOIN clients c ON d.client_id = c.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const documentsResult = await pool.query(documentsQuery, queryParams);

      const documents = documentsResult.rows.map(doc => ({
        id: doc.id,
        clientId: doc.client_id,
        disputeId: doc.dispute_id,
        documentType: doc.document_type,
        originalName: doc.original_name,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        description: doc.description,
        isConfidential: doc.is_confidential,
        uploadedAt: doc.created_at,
        client: doc.client_id ? {
          name: `${doc.first_name} ${doc.last_name}`,
          email: doc.client_email
        } : null,
        uploadedBy: {
          name: `${doc.uploader_first_name} ${doc.uploader_last_name}`
        }
      }));

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalDocuments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get documents error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/documents/:id
 * @desc Get specific document details
 * @access Private (Staff)
 */
router.get('/:id',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
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

      const query = `
        SELECT 
          d.*,
          c.first_name,
          c.last_name,
          c.email as client_email,
          u.first_name as uploader_first_name,
          u.last_name as uploader_last_name,
          disp.account_name as dispute_account
        FROM documents d
        LEFT JOIN clients c ON d.client_id = c.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN disputes disp ON d.dispute_id = disp.id
        WHERE d.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const doc = result.rows[0];

      const document = {
        id: doc.id,
        clientId: doc.client_id,
        disputeId: doc.dispute_id,
        documentType: doc.document_type,
        originalName: doc.original_name,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        description: doc.description,
        isConfidential: doc.is_confidential,
        uploadedAt: doc.created_at,
        updatedAt: doc.updated_at,
        client: doc.client_id ? {
          name: `${doc.first_name} ${doc.last_name}`,
          email: doc.client_email
        } : null,
        dispute: doc.dispute_id ? {
          accountName: doc.dispute_account
        } : null,
        uploadedBy: {
          name: `${doc.uploader_first_name} ${doc.uploader_last_name}`
        }
      };

      res.json({
        success: true,
        data: { document }
      });

    } catch (error) {
      logger.error('Get document details error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        documentId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/documents/:id/download
 * @desc Download document file
 * @access Private (Staff)
 */
router.get('/:id/download',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
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

      const query = `
        SELECT original_name, file_path, mime_type, is_confidential
        FROM documents 
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const doc = result.rows[0];

      // Check if file exists
      try {
        await fs.access(doc.file_path);
      } catch (fileError) {
        logger.error('Document file not found on disk', {
          documentId: id,
          filePath: doc.file_path,
          error: fileError.message
        });
        
        return res.status(404).json({
          success: false,
          message: 'Document file not found'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', doc.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
      
      // Log download activity
      try {
        await pool.query(
          `INSERT INTO activities (user_id, activity_type, description, metadata)
           VALUES ($1, $2, $3, $4)`,
          [
            req.user.id,
            'document_downloaded',
            `Downloaded document: ${doc.original_name}`,
            JSON.stringify({
              documentId: id,
              fileName: doc.original_name,
              isConfidential: doc.is_confidential
            })
          ]
        );
      } catch (logError) {
        logger.error('Failed to log download activity', {
          error: logError.message,
          documentId: id,
          userId: req.user.id
        });
      }

      // Send file
      res.sendFile(path.resolve(doc.file_path));

    } catch (error) {
      logger.error('Document download error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        documentId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route PUT /api/documents/:id
 * @desc Update document metadata
 * @access Private (Staff)
 */
router.put('/:id',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('isConfidential')
      .optional()
      .isBoolean()
      .withMessage('isConfidential must be a boolean'),
    body('documentType')
      .optional()
      .isIn(['credit_report', 'dispute_letter', 'response_letter', 'supporting_document', 'identification', 'other'])
      .withMessage('Invalid document type')
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
      const { description, isConfidential, documentType } = req.body;

      // Check if document exists
      const existingDoc = await pool.query(
        'SELECT * FROM documents WHERE id = $1',
        [id]
      );

      if (existingDoc.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateValues.push(description);
        paramIndex++;
      }

      if (isConfidential !== undefined) {
        updateFields.push(`is_confidential = $${paramIndex}`);
        updateValues.push(isConfidential);
        paramIndex++;
      }

      if (documentType !== undefined) {
        updateFields.push(`document_type = $${paramIndex}`);
        updateValues.push(documentType);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const updateQuery = `
        UPDATE documents 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, updateValues);
      const updatedDoc = result.rows[0];

      // Log activity
      if (updatedDoc.client_id) {
        await pool.query(
          `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            updatedDoc.client_id,
            req.user.id,
            'document_updated',
            `Document updated: ${updatedDoc.original_name}`,
            JSON.stringify({
              documentId: id,
              updatedFields: Object.keys(req.body)
            })
          ]
        );
      }

      logger.info('Document updated successfully', {
        documentId: id,
        updatedFields: Object.keys(req.body),
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: {
          document: {
            id: updatedDoc.id,
            documentType: updatedDoc.document_type,
            originalName: updatedDoc.original_name,
            description: updatedDoc.description,
            isConfidential: updatedDoc.is_confidential,
            updatedAt: updatedDoc.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Update document error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        documentId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route DELETE /api/documents/:id
 * @desc Delete document
 * @access Private (Staff)
 */
router.delete('/:id',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Document ID must be a valid UUID')
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

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Get document details before deletion
        const docResult = await client.query(
          'SELECT * FROM documents WHERE id = $1',
          [id]
        );

        if (docResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Document not found'
          });
        }

        const doc = docResult.rows[0];

        // Delete from database
        await client.query('DELETE FROM documents WHERE id = $1', [id]);

        // Delete physical file
        try {
          await fs.unlink(doc.file_path);
        } catch (fileError) {
          logger.warn('Failed to delete physical file', {
            documentId: id,
            filePath: doc.file_path,
            error: fileError.message
          });
        }

        // Log activity
        if (doc.client_id) {
          await client.query(
            `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              doc.client_id,
              req.user.id,
              'document_deleted',
              `Document deleted: ${doc.original_name}`,
              JSON.stringify({
                documentId: id,
                documentType: doc.document_type,
                fileName: doc.original_name
              })
            ]
          );
        }

        await client.query('COMMIT');

        logger.info('Document deleted successfully', {
          documentId: id,
          fileName: doc.original_name,
          deletedBy: req.user.id
        });

        res.json({
          success: true,
          message: 'Document deleted successfully'
        });

      } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Delete document error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        documentId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/documents/stats
 * @desc Get document statistics
 * @access Private (Staff)
 */
router.get('/stats/overview',
  authenticateToken,
  requireStaff,
  async (req, res) => {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN document_type = 'credit_report' THEN 1 END) as credit_reports,
          COUNT(CASE WHEN document_type = 'dispute_letter' THEN 1 END) as dispute_letters,
          COUNT(CASE WHEN document_type = 'response_letter' THEN 1 END) as response_letters,
          COUNT(CASE WHEN document_type = 'supporting_document' THEN 1 END) as supporting_documents,
          COUNT(CASE WHEN document_type = 'identification' THEN 1 END) as identification_docs,
          COUNT(CASE WHEN is_confidential = true THEN 1 END) as confidential_documents,
          SUM(file_size) as total_storage_bytes,
          AVG(file_size) as avg_file_size
        FROM documents
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      // Convert bytes to MB for readability
      const totalStorageMB = Math.round((stats.total_storage_bytes || 0) / (1024 * 1024) * 100) / 100;
      const avgFileSizeMB = Math.round((stats.avg_file_size || 0) / (1024 * 1024) * 100) / 100;

      res.json({
        success: true,
        data: {
          totalDocuments: parseInt(stats.total_documents),
          documentsByType: {
            creditReports: parseInt(stats.credit_reports),
            disputeLetters: parseInt(stats.dispute_letters),
            responseLetters: parseInt(stats.response_letters),
            supportingDocuments: parseInt(stats.supporting_documents),
            identificationDocs: parseInt(stats.identification_docs)
          },
          confidentialDocuments: parseInt(stats.confidential_documents),
          storage: {
            totalMB: totalStorageMB,
            avgFileSizeMB: avgFileSizeMB
          }
        }
      });

    } catch (error) {
      logger.error('Get document stats error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;