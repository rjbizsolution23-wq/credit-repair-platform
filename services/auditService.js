const { Pool } = require('pg');
const winston = require('winston');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

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
    new winston.transports.File({ filename: 'logs/audit.log' })
  ]
});

class AuditService {
  constructor() {
    this.initialized = false;
    this.auditPath = process.env.AUDIT_PATH || './audit_logs';
    
    this.actionTypes = {
      CREATE: 'create',
      READ: 'read',
      UPDATE: 'update',
      DELETE: 'delete',
      LOGIN: 'login',
      LOGOUT: 'logout',
      EXPORT: 'export',
      IMPORT: 'import',
      PAYMENT: 'payment',
      REFUND: 'refund',
      DISPUTE_CREATE: 'dispute_create',
      DISPUTE_UPDATE: 'dispute_update',
      LETTER_SEND: 'letter_send',
      DOCUMENT_UPLOAD: 'document_upload',
      DOCUMENT_DELETE: 'document_delete',
      CREDIT_REPORT_PULL: 'credit_report_pull',
      USER_CREATE: 'user_create',
      USER_UPDATE: 'user_update',
      USER_DELETE: 'user_delete',
      ROLE_CHANGE: 'role_change',
      SETTINGS_UPDATE: 'settings_update',
      BACKUP_CREATE: 'backup_create',
      BACKUP_RESTORE: 'backup_restore',
      SYSTEM_MAINTENANCE: 'system_maintenance'
    };

    this.riskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    this.entityTypes = {
      USER: 'user',
      CLIENT: 'client',
      DISPUTE: 'dispute',
      PAYMENT: 'payment',
      DOCUMENT: 'document',
      LETTER: 'letter',
      CREDIT_REPORT: 'credit_report',
      SUBSCRIPTION: 'subscription',
      SYSTEM: 'system'
    };
  }

  async initialize() {
    try {
      // Create audit logs directory
      await this.createAuditDirectory();
      
      // Initialize audit tables if they don't exist
      await this.initializeAuditTables();
      
      this.initialized = true;
      logger.info('Audit service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize audit service:', error);
      return false;
    }
  }

  async createAuditDirectory() {
    try {
      await fs.access(this.auditPath);
    } catch {
      await fs.mkdir(this.auditPath, { recursive: true });
      logger.info(`Created audit directory: ${this.auditPath}`);
    }
  }

  async initializeAuditTables() {
    const createAuditTableQuery = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        description TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        risk_level VARCHAR(20) DEFAULT 'low',
        session_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (action_type),
        INDEX (entity_type),
        INDEX (created_at),
        INDEX (risk_level)
      )
    `;

    const createComplianceTableQuery = `
      CREATE TABLE IF NOT EXISTS compliance_logs (
        id SERIAL PRIMARY KEY,
        regulation_type VARCHAR(100) NOT NULL,
        compliance_check VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        details JSONB,
        remediation_required BOOLEAN DEFAULT FALSE,
        remediation_notes TEXT,
        checked_by INTEGER REFERENCES users(id),
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        next_check_due TIMESTAMP,
        INDEX (regulation_type),
        INDEX (status),
        INDEX (checked_at)
      )
    `;

    await pool.query(createAuditTableQuery);
    await pool.query(createComplianceTableQuery);
    
    logger.info('Audit tables initialized');
  }

  async logAction(actionData) {
    try {
      const {
        userId = null,
        actionType,
        entityType,
        entityId = null,
        description,
        oldValues = null,
        newValues = null,
        ipAddress = null,
        userAgent = null,
        sessionId = null,
        metadata = null,
        riskLevel = this.riskLevels.LOW
      } = actionData;

      // Validate required fields
      if (!actionType || !entityType) {
        throw new Error('Action type and entity type are required');
      }

      // Generate audit ID
      const auditId = crypto.randomUUID();

      const query = `
        INSERT INTO audit_logs (
          user_id, action_type, entity_type, entity_id, description,
          old_values, new_values, ip_address, user_agent, risk_level,
          session_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, created_at
      `;

      const values = [
        userId,
        actionType,
        entityType,
        entityId,
        description,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
        riskLevel,
        sessionId,
        metadata ? JSON.stringify(metadata) : null
      ];

      const result = await pool.query(query, values);
      const auditLogId = result.rows[0].id;

      // Log to file for backup
      await this.logToFile({
        id: auditLogId,
        auditId,
        ...actionData,
        timestamp: result.rows[0].created_at
      });

      // Check for suspicious activity
      if (riskLevel === this.riskLevels.HIGH || riskLevel === this.riskLevels.CRITICAL) {
        await this.handleHighRiskActivity(auditLogId, actionData);
      }

      logger.info('Audit log created', {
        auditLogId,
        userId,
        actionType,
        entityType,
        riskLevel
      });

      return {
        success: true,
        auditLogId,
        auditId
      };

    } catch (error) {
      logger.error('Failed to log audit action:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logToFile(auditData) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `audit_${date}.log`;
      const filepath = path.join(this.auditPath, filename);
      
      const logEntry = `${new Date().toISOString()} - ${JSON.stringify(auditData)}\n`;
      
      await fs.appendFile(filepath, logEntry);
    } catch (error) {
      logger.error('Failed to write audit log to file:', error);
    }
  }

  async handleHighRiskActivity(auditLogId, actionData) {
    try {
      // Send alert to administrators
      const alertQuery = `
        INSERT INTO notifications (user_id, type, title, message, priority, metadata)
        SELECT 
          u.id,
          'SECURITY_ALERT',
          'High Risk Activity Detected',
          $1,
          'urgent',
          $2
        FROM users u
        WHERE u.role IN ('admin', 'manager') AND u.status = 'active'
      `;

      const alertMessage = `High risk activity detected: ${actionData.actionType} on ${actionData.entityType} by user ${actionData.userId}`;
      const alertMetadata = JSON.stringify({
        auditLogId,
        actionType: actionData.actionType,
        entityType: actionData.entityType,
        riskLevel: actionData.riskLevel
      });

      await pool.query(alertQuery, [alertMessage, alertMetadata]);

      logger.warn('High risk activity alert sent', {
        auditLogId,
        actionType: actionData.actionType,
        userId: actionData.userId
      });

    } catch (error) {
      logger.error('Failed to handle high risk activity:', error);
    }
  }

  async getAuditLogs(options = {}) {
    try {
      const {
        userId = null,
        actionType = null,
        entityType = null,
        entityId = null,
        riskLevel = null,
        startDate = null,
        endDate = null,
        limit = 100,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      let query = `
        SELECT 
          al.*,
          u.username,
          u.email,
          u.first_name,
          u.last_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        params.push(userId);
      }

      if (actionType) {
        paramCount++;
        query += ` AND al.action_type = $${paramCount}`;
        params.push(actionType);
      }

      if (entityType) {
        paramCount++;
        query += ` AND al.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      if (entityId) {
        paramCount++;
        query += ` AND al.entity_id = $${paramCount}`;
        params.push(entityId);
      }

      if (riskLevel) {
        paramCount++;
        query += ` AND al.risk_level = $${paramCount}`;
        params.push(riskLevel);
      }

      if (startDate) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY al.${sortBy} ${sortOrder} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        WHERE 1=1
      `;

      const countParams = [];
      let countParamCount = 0;

      if (userId) {
        countParamCount++;
        countQuery += ` AND al.user_id = $${countParamCount}`;
        countParams.push(userId);
      }

      if (actionType) {
        countParamCount++;
        countQuery += ` AND al.action_type = $${countParamCount}`;
        countParams.push(actionType);
      }

      if (entityType) {
        countParamCount++;
        countQuery += ` AND al.entity_type = $${countParamCount}`;
        countParams.push(entityType);
      }

      if (entityId) {
        countParamCount++;
        countQuery += ` AND al.entity_id = $${countParamCount}`;
        countParams.push(entityId);
      }

      if (riskLevel) {
        countParamCount++;
        countQuery += ` AND al.risk_level = $${countParamCount}`;
        countParams.push(riskLevel);
      }

      if (startDate) {
        countParamCount++;
        countQuery += ` AND al.created_at >= $${countParamCount}`;
        countParams.push(startDate);
      }

      if (endDate) {
        countParamCount++;
        countQuery += ` AND al.created_at <= $${countParamCount}`;
        countParams.push(endDate);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return {
        success: true,
        logs: result.rows,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      return {
        success: false,
        error: error.message,
        logs: []
      };
    }
  }

  async getAuditStatistics(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date()
      } = options;

      const queries = {
        totalLogs: `
          SELECT COUNT(*) as count
          FROM audit_logs
          WHERE created_at >= $1 AND created_at <= $2
        `,
        logsByAction: `
          SELECT action_type, COUNT(*) as count
          FROM audit_logs
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY action_type
          ORDER BY count DESC
        `,
        logsByEntity: `
          SELECT entity_type, COUNT(*) as count
          FROM audit_logs
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY entity_type
          ORDER BY count DESC
        `,
        logsByRisk: `
          SELECT risk_level, COUNT(*) as count
          FROM audit_logs
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY risk_level
          ORDER BY 
            CASE risk_level
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END
        `,
        logsByUser: `
          SELECT 
            u.username,
            u.first_name,
            u.last_name,
            COUNT(al.*) as count
          FROM audit_logs al
          JOIN users u ON al.user_id = u.id
          WHERE al.created_at >= $1 AND al.created_at <= $2
          GROUP BY u.id, u.username, u.first_name, u.last_name
          ORDER BY count DESC
          LIMIT 10
        `,
        dailyActivity: `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM audit_logs
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY DATE(created_at)
          ORDER BY date
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await pool.query(query, [startDate, endDate]);
        results[key] = result.rows;
      }

      return {
        success: true,
        statistics: results,
        dateRange: { startDate, endDate }
      };

    } catch (error) {
      logger.error('Failed to get audit statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async logComplianceCheck(checkData) {
    try {
      const {
        regulationType,
        complianceCheck,
        status,
        details = null,
        remediationRequired = false,
        remediationNotes = null,
        checkedBy,
        nextCheckDue = null
      } = checkData;

      const query = `
        INSERT INTO compliance_logs (
          regulation_type, compliance_check, status, details,
          remediation_required, remediation_notes, checked_by, next_check_due
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, checked_at
      `;

      const values = [
        regulationType,
        complianceCheck,
        status,
        details ? JSON.stringify(details) : null,
        remediationRequired,
        remediationNotes,
        checkedBy,
        nextCheckDue
      ];

      const result = await pool.query(query, values);
      const complianceLogId = result.rows[0].id;

      // Log the compliance check as an audit action
      await this.logAction({
        userId: checkedBy,
        actionType: 'COMPLIANCE_CHECK',
        entityType: this.entityTypes.SYSTEM,
        description: `Compliance check: ${complianceCheck} for ${regulationType}`,
        metadata: {
          complianceLogId,
          regulationType,
          status,
          remediationRequired
        },
        riskLevel: remediationRequired ? this.riskLevels.HIGH : this.riskLevels.LOW
      });

      logger.info('Compliance check logged', {
        complianceLogId,
        regulationType,
        status,
        checkedBy
      });

      return {
        success: true,
        complianceLogId
      };

    } catch (error) {
      logger.error('Failed to log compliance check:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getComplianceLogs(options = {}) {
    try {
      const {
        regulationType = null,
        status = null,
        remediationRequired = null,
        startDate = null,
        endDate = null,
        limit = 50,
        offset = 0
      } = options;

      let query = `
        SELECT 
          cl.*,
          u.username,
          u.first_name,
          u.last_name
        FROM compliance_logs cl
        LEFT JOIN users u ON cl.checked_by = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (regulationType) {
        paramCount++;
        query += ` AND cl.regulation_type = $${paramCount}`;
        params.push(regulationType);
      }

      if (status) {
        paramCount++;
        query += ` AND cl.status = $${paramCount}`;
        params.push(status);
      }

      if (remediationRequired !== null) {
        paramCount++;
        query += ` AND cl.remediation_required = $${paramCount}`;
        params.push(remediationRequired);
      }

      if (startDate) {
        paramCount++;
        query += ` AND cl.checked_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND cl.checked_at <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY cl.checked_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return {
        success: true,
        logs: result.rows
      };

    } catch (error) {
      logger.error('Failed to get compliance logs:', error);
      return {
        success: false,
        error: error.message,
        logs: []
      };
    }
  }

  async exportAuditLogs(options = {}) {
    try {
      const {
        format = 'json',
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        userId = null
      } = options;

      // Get audit logs
      const logsResult = await this.getAuditLogs({
        startDate,
        endDate,
        userId,
        limit: 10000 // Large limit for export
      });

      if (!logsResult.success) {
        throw new Error(logsResult.error);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit_export_${timestamp}.${format}`;
      const filepath = path.join(this.auditPath, filename);

      let content;
      switch (format.toLowerCase()) {
        case 'json':
          content = JSON.stringify({
            exportedAt: new Date().toISOString(),
            dateRange: { startDate, endDate },
            totalRecords: logsResult.logs.length,
            logs: logsResult.logs
          }, null, 2);
          break;
        case 'csv':
          content = this.convertToCSV(logsResult.logs);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      await fs.writeFile(filepath, content);

      // Log the export action
      await this.logAction({
        userId,
        actionType: this.actionTypes.EXPORT,
        entityType: this.entityTypes.SYSTEM,
        description: `Exported ${logsResult.logs.length} audit logs`,
        metadata: {
          filename,
          format,
          recordCount: logsResult.logs.length,
          dateRange: { startDate, endDate }
        },
        riskLevel: this.riskLevels.MEDIUM
      });

      logger.info('Audit logs exported', {
        filename,
        format,
        recordCount: logsResult.logs.length
      });

      return {
        success: true,
        filename,
        recordCount: logsResult.logs.length
      };

    } catch (error) {
      logger.error('Failed to export audit logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  convertToCSV(data) {
    if (data.length === 0) return 'No data available';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          if (typeof value === 'object' && value !== null) {
            value = JSON.stringify(value);
          }
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  async cleanupOldAuditLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Archive old logs before deletion
      const archiveResult = await this.archiveOldLogs(cutoffDate);
      
      // Delete old audit logs
      const deleteQuery = `
        DELETE FROM audit_logs
        WHERE created_at < $1
      `;

      const result = await pool.query(deleteQuery, [cutoffDate]);
      const deletedCount = result.rowCount;

      // Delete old compliance logs
      const deleteComplianceQuery = `
        DELETE FROM compliance_logs
        WHERE checked_at < $1
      `;

      const complianceResult = await pool.query(deleteComplianceQuery, [cutoffDate]);
      const deletedComplianceCount = complianceResult.rowCount;

      logger.info('Old audit logs cleaned up', {
        deletedAuditLogs: deletedCount,
        deletedComplianceLogs: deletedComplianceCount,
        cutoffDate,
        archived: archiveResult.success
      });

      return {
        success: true,
        deletedAuditLogs: deletedCount,
        deletedComplianceLogs: deletedComplianceCount,
        archived: archiveResult.success
      };

    } catch (error) {
      logger.error('Failed to cleanup old audit logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async archiveOldLogs(cutoffDate) {
    try {
      // Get logs to archive
      const query = `
        SELECT * FROM audit_logs
        WHERE created_at < $1
        ORDER BY created_at
      `;

      const result = await pool.query(query, [cutoffDate]);
      
      if (result.rows.length === 0) {
        return { success: true, archivedCount: 0 };
      }

      // Create archive file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audit_archive_${timestamp}.json`;
      const filepath = path.join(this.auditPath, filename);

      const archiveData = {
        archivedAt: new Date().toISOString(),
        cutoffDate,
        recordCount: result.rows.length,
        logs: result.rows
      };

      await fs.writeFile(filepath, JSON.stringify(archiveData, null, 2));

      logger.info('Audit logs archived', {
        filename,
        recordCount: result.rows.length
      });

      return {
        success: true,
        archivedCount: result.rows.length,
        filename
      };

    } catch (error) {
      logger.error('Failed to archive old logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const auditService = new AuditService();

module.exports = auditService;