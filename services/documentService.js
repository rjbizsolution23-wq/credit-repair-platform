const { Pool } = require('pg');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const pdf = require('pdf-parse');

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
    new winston.transports.File({ filename: 'logs/documents.log' })
  ]
});

class DocumentService {
  constructor() {
    this.initialized = false;
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
    };

    this.documentTypes = {
      CREDIT_REPORT: 'credit_report',
      DISPUTE_LETTER: 'dispute_letter',
      IDENTITY_DOCUMENT: 'identity_document',
      PROOF_OF_ADDRESS: 'proof_of_address',
      BANK_STATEMENT: 'bank_statement',
      INCOME_VERIFICATION: 'income_verification',
      CORRESPONDENCE: 'correspondence',
      LEGAL_DOCUMENT: 'legal_document',
      OTHER: 'other'
    };

    this.documentStatuses = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      PROCESSED: 'processed',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      ARCHIVED: 'archived'
    };
  }

  async initialize() {
    try {
      // Create upload directories
      await this.createUploadDirectories();
      
      this.initialized = true;
      logger.info('Document service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize document service:', error);
      return false;
    }
  }

  async createUploadDirectories() {
    const directories = [
      this.uploadPath,
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'documents', 'originals'),
      path.join(this.uploadPath, 'documents', 'thumbnails'),
      path.join(this.uploadPath, 'documents', 'processed'),
      path.join(this.uploadPath, 'temp')
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    }
  }

  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.uploadPath, 'temp'));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = this.allowedTypes[file.mimetype] || path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedTypes[file.mimetype]) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 10 // Maximum 10 files per upload
      }
    });
  }

  async uploadDocument(options) {
    try {
      const {
        file,
        clientId,
        userId,
        documentType,
        description = '',
        metadata = {},
        autoProcess = true
      } = options;

      // Validate inputs
      if (!file || !clientId || !userId || !documentType) {
        throw new Error('Missing required parameters');
      }

      if (!Object.values(this.documentTypes).includes(documentType)) {
        throw new Error(`Invalid document type: ${documentType}`);
      }

      // Generate unique filename
      const fileHash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex');
      const fileExtension = this.allowedTypes[file.mimetype] || path.extname(file.originalname);
      const filename = `${fileHash}${fileExtension}`;
      const originalPath = path.join(this.uploadPath, 'documents', 'originals', filename);

      // Move file from temp to permanent location
      await fs.rename(file.path, originalPath);

      // Get file stats
      const stats = await fs.stat(originalPath);
      const fileSize = stats.size;

      // Create document record
      const result = await pool.query(
        `INSERT INTO documents 
         (client_id, user_id, filename, original_filename, file_path, file_size, mime_type, 
          document_type, description, status, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
         RETURNING id, created_at`,
        [
          clientId,
          userId,
          filename,
          file.originalname,
          originalPath,
          fileSize,
          file.mimetype,
          documentType,
          description,
          this.documentStatuses.PENDING,
          JSON.stringify(metadata)
        ]
      );

      const documentId = result.rows[0].id;
      const createdAt = result.rows[0].created_at;

      // Process document if auto-processing is enabled
      if (autoProcess) {
        this.processDocument(documentId).catch(error => {
          logger.error('Auto-processing failed:', error);
        });
      }

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          clientId,
          'document_uploaded',
          `Document uploaded: ${file.originalname}`,
          JSON.stringify({
            documentId,
            filename,
            documentType,
            fileSize
          })
        ]
      );

      logger.info('Document uploaded successfully', {
        documentId,
        clientId,
        userId,
        filename,
        documentType,
        fileSize
      });

      return {
        success: true,
        documentId,
        filename,
        createdAt
      };

    } catch (error) {
      // Clean up temp file if it exists
      if (options.file?.path) {
        try {
          await fs.unlink(options.file.path);
        } catch (cleanupError) {
          logger.error('Failed to cleanup temp file:', cleanupError);
        }
      }

      logger.error('Failed to upload document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processDocument(documentId) {
    try {
      // Get document details
      const documentResult = await pool.query(
        'SELECT * FROM documents WHERE id = $1',
        [documentId]
      );

      if (documentResult.rows.length === 0) {
        throw new Error('Document not found');
      }

      const document = documentResult.rows[0];

      // Update status to processing
      await pool.query(
        'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [this.documentStatuses.PROCESSING, documentId]
      );

      const processingResults = {
        thumbnailGenerated: false,
        textExtracted: false,
        metadata: {},
        errors: []
      };

      // Generate thumbnail for images and PDFs
      if (document.mime_type.startsWith('image/') || document.mime_type === 'application/pdf') {
        try {
          await this.generateThumbnail(document);
          processingResults.thumbnailGenerated = true;
        } catch (error) {
          processingResults.errors.push(`Thumbnail generation failed: ${error.message}`);
        }
      }

      // Extract text content
      try {
        const extractedText = await this.extractText(document);
        if (extractedText) {
          processingResults.textExtracted = true;
          processingResults.metadata.extractedText = extractedText.substring(0, 5000); // Limit text length
          processingResults.metadata.textLength = extractedText.length;
        }
      } catch (error) {
        processingResults.errors.push(`Text extraction failed: ${error.message}`);
      }

      // Analyze document content based on type
      try {
        const analysis = await this.analyzeDocument(document, processingResults.metadata.extractedText);
        processingResults.metadata.analysis = analysis;
      } catch (error) {
        processingResults.errors.push(`Document analysis failed: ${error.message}`);
      }

      // Update document with processing results
      const finalStatus = processingResults.errors.length > 0 
        ? this.documentStatuses.PROCESSED 
        : this.documentStatuses.PROCESSED;

      await pool.query(
        `UPDATE documents 
         SET status = $1, processing_results = $2, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [finalStatus, JSON.stringify(processingResults), documentId]
      );

      logger.info('Document processed successfully', {
        documentId,
        thumbnailGenerated: processingResults.thumbnailGenerated,
        textExtracted: processingResults.textExtracted,
        errorsCount: processingResults.errors.length
      });

      return {
        success: true,
        processingResults
      };

    } catch (error) {
      // Update status to indicate processing failed
      await pool.query(
        'UPDATE documents SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [this.documentStatuses.PENDING, error.message, documentId]
      );

      logger.error('Document processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateThumbnail(document) {
    const thumbnailPath = path.join(
      this.uploadPath, 
      'documents', 
      'thumbnails', 
      `thumb_${document.filename.replace(path.extname(document.filename), '.jpg')}`
    );

    if (document.mime_type.startsWith('image/')) {
      // Generate thumbnail for images
      await sharp(document.file_path)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } else if (document.mime_type === 'application/pdf') {
      // For PDFs, we would need a PDF-to-image library like pdf-poppler
      // This is a placeholder implementation
      logger.info('PDF thumbnail generation not implemented yet');
      return;
    }

    // Update document with thumbnail path
    await pool.query(
      'UPDATE documents SET thumbnail_path = $1 WHERE id = $2',
      [thumbnailPath, document.id]
    );
  }

  async extractText(document) {
    let extractedText = '';

    try {
      if (document.mime_type === 'application/pdf') {
        // Extract text from PDF
        const dataBuffer = await fs.readFile(document.file_path);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } else if (document.mime_type === 'text/plain') {
        // Read text file
        extractedText = await fs.readFile(document.file_path, 'utf8');
      } else if (document.mime_type.startsWith('image/')) {
        // OCR for images would go here (using tesseract.js or similar)
        logger.info('OCR for images not implemented yet');
      }

      return extractedText;
    } catch (error) {
      logger.error('Text extraction failed:', error);
      return null;
    }
  }

  async analyzeDocument(document, extractedText) {
    const analysis = {
      documentType: document.document_type,
      confidence: 0,
      detectedElements: [],
      suggestions: []
    };

    if (!extractedText) {
      return analysis;
    }

    const text = extractedText.toLowerCase();

    // Analyze based on document type
    switch (document.document_type) {
      case this.documentTypes.CREDIT_REPORT:
        analysis.detectedElements = this.analyzeCreditReport(text);
        break;
      case this.documentTypes.BANK_STATEMENT:
        analysis.detectedElements = this.analyzeBankStatement(text);
        break;
      case this.documentTypes.IDENTITY_DOCUMENT:
        analysis.detectedElements = this.analyzeIdentityDocument(text);
        break;
      default:
        analysis.detectedElements = this.analyzeGenericDocument(text);
    }

    // Calculate confidence based on detected elements
    analysis.confidence = Math.min(analysis.detectedElements.length * 0.2, 1.0);

    return analysis;
  }

  analyzeCreditReport(text) {
    const elements = [];
    
    // Look for credit bureau names
    const bureaus = ['experian', 'equifax', 'transunion'];
    bureaus.forEach(bureau => {
      if (text.includes(bureau)) {
        elements.push({ type: 'bureau', value: bureau });
      }
    });

    // Look for credit score patterns
    const scorePattern = /\b(\d{3})\b/g;
    const scores = text.match(scorePattern);
    if (scores) {
      scores.forEach(score => {
        const numScore = parseInt(score);
        if (numScore >= 300 && numScore <= 850) {
          elements.push({ type: 'credit_score', value: numScore });
        }
      });
    }

    // Look for account information
    if (text.includes('account') || text.includes('balance')) {
      elements.push({ type: 'account_info', value: 'detected' });
    }

    return elements;
  }

  analyzeBankStatement(text) {
    const elements = [];
    
    // Look for bank names
    const banks = ['bank of america', 'chase', 'wells fargo', 'citibank', 'capital one'];
    banks.forEach(bank => {
      if (text.includes(bank)) {
        elements.push({ type: 'bank_name', value: bank });
      }
    });

    // Look for monetary amounts
    const amountPattern = /\$[\d,]+\.\d{2}/g;
    const amounts = text.match(amountPattern);
    if (amounts && amounts.length > 0) {
      elements.push({ type: 'monetary_amounts', value: amounts.length });
    }

    // Look for dates
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/g;
    const dates = text.match(datePattern);
    if (dates && dates.length > 0) {
      elements.push({ type: 'transaction_dates', value: dates.length });
    }

    return elements;
  }

  analyzeIdentityDocument(text) {
    const elements = [];
    
    // Look for ID-related keywords
    const idKeywords = ['driver', 'license', 'passport', 'social security', 'ssn'];
    idKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        elements.push({ type: 'id_type', value: keyword });
      }
    });

    // Look for SSN pattern
    const ssnPattern = /\d{3}-\d{2}-\d{4}/g;
    if (text.match(ssnPattern)) {
      elements.push({ type: 'ssn_detected', value: 'yes' });
    }

    return elements;
  }

  analyzeGenericDocument(text) {
    const elements = [];
    
    // Basic document analysis
    elements.push({ type: 'word_count', value: text.split(' ').length });
    elements.push({ type: 'character_count', value: text.length });

    // Look for common financial terms
    const financialTerms = ['payment', 'balance', 'account', 'credit', 'debt', 'dispute'];
    const foundTerms = financialTerms.filter(term => text.includes(term));
    if (foundTerms.length > 0) {
      elements.push({ type: 'financial_terms', value: foundTerms });
    }

    return elements;
  }

  async getDocument(documentId, userId = null) {
    try {
      let query = 'SELECT * FROM documents WHERE id = $1';
      const params = [documentId];

      // Add user restriction if provided
      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Document not found or access denied'
        };
      }

      const document = result.rows[0];

      return {
        success: true,
        document: {
          id: document.id,
          clientId: document.client_id,
          userId: document.user_id,
          filename: document.filename,
          originalFilename: document.original_filename,
          fileSize: document.file_size,
          mimeType: document.mime_type,
          documentType: document.document_type,
          description: document.description,
          status: document.status,
          metadata: document.metadata,
          processingResults: document.processing_results,
          thumbnailPath: document.thumbnail_path,
          createdAt: document.created_at,
          updatedAt: document.updated_at,
          processedAt: document.processed_at
        }
      };

    } catch (error) {
      logger.error('Failed to get document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDocumentFile(documentId, userId = null) {
    try {
      const documentResult = await this.getDocument(documentId, userId);
      
      if (!documentResult.success) {
        return documentResult;
      }

      const document = documentResult.document;
      
      // Check if file exists
      try {
        await fs.access(document.filePath || document.file_path);
      } catch {
        return {
          success: false,
          error: 'File not found on disk'
        };
      }

      return {
        success: true,
        filePath: document.filePath || document.file_path,
        filename: document.originalFilename,
        mimeType: document.mimeType
      };

    } catch (error) {
      logger.error('Failed to get document file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteDocument(documentId, userId = null) {
    try {
      // Get document first
      const documentResult = await this.getDocument(documentId, userId);
      
      if (!documentResult.success) {
        return documentResult;
      }

      const document = documentResult.document;

      // Delete physical files
      const filesToDelete = [
        document.filePath || document.file_path,
        document.thumbnailPath
      ].filter(Boolean);

      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          logger.warn(`Failed to delete file ${filePath}:`, error);
        }
      }

      // Delete database record
      await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          document.clientId,
          'document_deleted',
          `Document deleted: ${document.originalFilename}`,
          JSON.stringify({
            documentId,
            filename: document.filename,
            documentType: document.documentType
          })
        ]
      );

      logger.info('Document deleted successfully', {
        documentId,
        filename: document.filename
      });

      return {
        success: true,
        message: 'Document deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getClientDocuments(clientId, options = {}) {
    try {
      const {
        documentType = null,
        status = null,
        limit = 50,
        offset = 0
      } = options;

      let query = `
        SELECT 
          d.*,
          u.first_name || ' ' || u.last_name as uploaded_by
        FROM documents d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.client_id = $1
      `;

      const params = [clientId];
      let paramCount = 1;

      if (documentType) {
        paramCount++;
        query += ` AND d.document_type = $${paramCount}`;
        params.push(documentType);
      }

      if (status) {
        paramCount++;
        query += ` AND d.status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY d.created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
      }

      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);
      }

      const result = await pool.query(query, params);

      return {
        success: true,
        documents: result.rows.map(row => ({
          id: row.id,
          filename: row.filename,
          originalFilename: row.original_filename,
          fileSize: row.file_size,
          mimeType: row.mime_type,
          documentType: row.document_type,
          description: row.description,
          status: row.status,
          uploadedBy: row.uploaded_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          processedAt: row.processed_at,
          hasThumbnail: !!row.thumbnail_path
        }))
      };

    } catch (error) {
      logger.error('Failed to get client documents:', error);
      return {
        success: false,
        error: error.message,
        documents: []
      };
    }
  }

  async getDocumentStats() {
    try {
      const statsQuery = `
        SELECT 
          document_type,
          status,
          COUNT(*) as count,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size,
          DATE_TRUNC('day', created_at) as date
        FROM documents 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY document_type, status, DATE_TRUNC('day', created_at)
        ORDER BY date DESC, document_type, status
      `;

      const result = await pool.query(statsQuery);

      return {
        success: true,
        stats: result.rows
      };

    } catch (error) {
      logger.error('Failed to get document stats:', error);
      return {
        success: false,
        error: error.message,
        stats: []
      };
    }
  }

  async cleanupOldDocuments(daysToKeep = 365) {
    try {
      // Get documents to delete
      const documentsResult = await pool.query(
        'SELECT id, file_path, thumbnail_path FROM documents WHERE created_at < CURRENT_DATE - INTERVAL $1 DAY',
        [daysToKeep]
      );

      const documentsToDelete = documentsResult.rows;
      let deletedCount = 0;
      let errorCount = 0;

      for (const document of documentsToDelete) {
        try {
          // Delete physical files
          const filesToDelete = [document.file_path, document.thumbnail_path].filter(Boolean);
          
          for (const filePath of filesToDelete) {
            try {
              await fs.unlink(filePath);
            } catch (error) {
              logger.warn(`Failed to delete file ${filePath}:`, error);
            }
          }

          // Delete database record
          await pool.query('DELETE FROM documents WHERE id = $1', [document.id]);
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete document ${document.id}:`, error);
          errorCount++;
        }
      }

      logger.info('Document cleanup completed', {
        totalFound: documentsToDelete.length,
        deletedCount,
        errorCount,
        daysToKeep
      });

      return {
        success: true,
        deletedCount,
        errorCount
      };

    } catch (error) {
      logger.error('Failed to cleanup old documents:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const documentService = new DocumentService();

module.exports = documentService;