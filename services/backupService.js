const { Pool } = require('pg');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
const extract = require('extract-zip');
const crypto = require('crypto');
const cron = require('node-cron');

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
    new winston.transports.File({ filename: 'logs/backup.log' })
  ]
});

class BackupService {
  constructor() {
    this.initialized = false;
    this.backupPath = process.env.BACKUP_PATH || './backups';
    this.uploadsPath = process.env.UPLOADS_PATH || './uploads';
    this.documentsPath = process.env.DOCUMENTS_PATH || './documents';
    this.reportsPath = process.env.REPORTS_PATH || './reports';
    this.auditPath = process.env.AUDIT_PATH || './audit_logs';
    
    this.backupTypes = {
      FULL: 'full',
      DATABASE: 'database',
      FILES: 'files',
      INCREMENTAL: 'incremental'
    };

    this.backupStatus = {
      PENDING: 'pending',
      RUNNING: 'running',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled'
    };

    this.scheduledJobs = new Map();
    this.activeBackups = new Map();
  }

  async initialize() {
    try {
      // Create backup directory
      await this.createBackupDirectory();
      
      // Initialize backup tables
      await this.initializeBackupTables();
      
      // Setup scheduled backups
      await this.setupScheduledBackups();
      
      this.initialized = true;
      logger.info('Backup service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize backup service:', error);
      return false;
    }
  }

  async createBackupDirectory() {
    try {
      await fs.access(this.backupPath);
    } catch {
      await fs.mkdir(this.backupPath, { recursive: true });
      logger.info(`Created backup directory: ${this.backupPath}`);
    }
  }

  async initializeBackupTables() {
    const createBackupTableQuery = `
      CREATE TABLE IF NOT EXISTS backups (
        id SERIAL PRIMARY KEY,
        backup_id VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        filename VARCHAR(255),
        file_path TEXT,
        file_size BIGINT,
        checksum VARCHAR(255),
        compression_ratio DECIMAL(5,2),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration_seconds INTEGER,
        created_by INTEGER REFERENCES users(id),
        metadata JSONB,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (backup_id),
        INDEX (type),
        INDEX (status),
        INDEX (created_at)
      )
    `;

    const createScheduleTableQuery = `
      CREATE TABLE IF NOT EXISTS backup_schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        cron_expression VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        retention_days INTEGER DEFAULT 30,
        compression_enabled BOOLEAN DEFAULT TRUE,
        encryption_enabled BOOLEAN DEFAULT FALSE,
        notification_enabled BOOLEAN DEFAULT TRUE,
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createBackupTableQuery);
    await pool.query(createScheduleTableQuery);
    
    logger.info('Backup tables initialized');
  }

  async createBackup(options = {}) {
    try {
      const {
        type = this.backupTypes.FULL,
        userId = null,
        description = null,
        compression = true,
        encryption = false,
        encryptionKey = null
      } = options;

      const backupId = crypto.randomUUID();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${type}_${timestamp}.zip`;
      const filepath = path.join(this.backupPath, filename);

      // Create backup record
      const createQuery = `
        INSERT INTO backups (
          backup_id, type, status, filename, file_path, 
          started_at, created_by, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;

      const metadata = {
        description,
        compression,
        encryption,
        options
      };

      const result = await pool.query(createQuery, [
        backupId,
        type,
        this.backupStatus.RUNNING,
        filename,
        filepath,
        new Date(),
        userId,
        JSON.stringify(metadata)
      ]);

      const dbBackupId = result.rows[0].id;
      this.activeBackups.set(backupId, { id: dbBackupId, type, status: this.backupStatus.RUNNING });

      logger.info('Backup started', {
        backupId,
        type,
        filename,
        userId
      });

      // Start backup process
      this.performBackup(backupId, type, filepath, compression, encryption, encryptionKey)
        .then(async (result) => {
          await this.updateBackupStatus(dbBackupId, this.backupStatus.COMPLETED, result);
          this.activeBackups.delete(backupId);
        })
        .catch(async (error) => {
          await this.updateBackupStatus(dbBackupId, this.backupStatus.FAILED, { error: error.message });
          this.activeBackups.delete(backupId);
        });

      return {
        success: true,
        backupId,
        filename,
        status: this.backupStatus.RUNNING
      };

    } catch (error) {
      logger.error('Failed to create backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async performBackup(backupId, type, filepath, compression, encryption, encryptionKey) {
    const startTime = Date.now();
    let originalSize = 0;
    let compressedSize = 0;

    try {
      switch (type) {
        case this.backupTypes.FULL:
          await this.createFullBackup(filepath, compression);
          break;
        case this.backupTypes.DATABASE:
          await this.createDatabaseBackup(filepath, compression);
          break;
        case this.backupTypes.FILES:
          await this.createFilesBackup(filepath, compression);
          break;
        case this.backupTypes.INCREMENTAL:
          await this.createIncrementalBackup(filepath, compression);
          break;
        default:
          throw new Error(`Unsupported backup type: ${type}`);
      }

      // Get file stats
      const stats = await fs.stat(filepath);
      compressedSize = stats.size;

      // Calculate checksum
      const checksum = await this.calculateChecksum(filepath);

      // Encrypt if requested
      if (encryption && encryptionKey) {
        await this.encryptBackup(filepath, encryptionKey);
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;

      logger.info('Backup completed', {
        backupId,
        type,
        duration,
        compressedSize,
        compressionRatio,
        checksum
      });

      return {
        fileSize: compressedSize,
        checksum,
        duration,
        compressionRatio
      };

    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  async createFullBackup(filepath, compression) {
    const output = require('fs').createWriteStream(filepath);
    const archive = archiver('zip', {
      zlib: { level: compression ? 9 : 0 }
    });

    archive.pipe(output);

    // Add database dump
    const dbDumpPath = await this.createDatabaseDump();
    archive.file(dbDumpPath, { name: 'database.sql' });

    // Add file directories
    const directories = [
      { path: this.uploadsPath, name: 'uploads' },
      { path: this.documentsPath, name: 'documents' },
      { path: this.reportsPath, name: 'reports' },
      { path: this.auditPath, name: 'audit_logs' }
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir.path);
        archive.directory(dir.path, dir.name);
      } catch (error) {
        logger.warn(`Directory not found, skipping: ${dir.path}`);
      }
    }

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Clean up temporary database dump
        fs.unlink(dbDumpPath).catch(() => {});
        resolve();
      });
      archive.on('error', reject);
    });
  }

  async createDatabaseBackup(filepath, compression) {
    const dbDumpPath = await this.createDatabaseDump();
    
    if (compression) {
      const output = require('fs').createWriteStream(filepath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      archive.pipe(output);
      archive.file(dbDumpPath, { name: 'database.sql' });
      await archive.finalize();
      
      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
      });
    } else {
      await fs.copyFile(dbDumpPath, filepath);
    }

    // Clean up temporary dump
    await fs.unlink(dbDumpPath);
  }

  async createFilesBackup(filepath, compression) {
    const output = require('fs').createWriteStream(filepath);
    const archive = archiver('zip', {
      zlib: { level: compression ? 9 : 0 }
    });

    archive.pipe(output);

    const directories = [
      { path: this.uploadsPath, name: 'uploads' },
      { path: this.documentsPath, name: 'documents' },
      { path: this.reportsPath, name: 'reports' },
      { path: this.auditPath, name: 'audit_logs' }
    ];

    for (const dir of directories) {
      try {
        await fs.access(dir.path);
        archive.directory(dir.path, dir.name);
      } catch (error) {
        logger.warn(`Directory not found, skipping: ${dir.path}`);
      }
    }

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });
  }

  async createIncrementalBackup(filepath, compression) {
    // Get last backup date
    const lastBackupQuery = `
      SELECT completed_at
      FROM backups
      WHERE type IN ('full', 'incremental') AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    `;

    const result = await pool.query(lastBackupQuery);
    const lastBackupDate = result.rows.length > 0 ? result.rows[0].completed_at : new Date(0);

    const output = require('fs').createWriteStream(filepath);
    const archive = archiver('zip', {
      zlib: { level: compression ? 9 : 0 }
    });

    archive.pipe(output);

    // Add changed files since last backup
    const directories = [this.uploadsPath, this.documentsPath, this.reportsPath, this.auditPath];

    for (const dirPath of directories) {
      try {
        await this.addChangedFiles(archive, dirPath, lastBackupDate);
      } catch (error) {
        logger.warn(`Error processing directory ${dirPath}:`, error);
      }
    }

    // Add database changes (simplified - in practice, you'd use transaction logs)
    const dbDumpPath = await this.createDatabaseDump();
    archive.file(dbDumpPath, { name: 'database_incremental.sql' });

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        fs.unlink(dbDumpPath).catch(() => {});
        resolve();
      });
      archive.on('error', reject);
    });
  }

  async addChangedFiles(archive, dirPath, lastBackupDate) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          await this.addChangedFiles(archive, fullPath, lastBackupDate);
        } else {
          const stats = await fs.stat(fullPath);
          if (stats.mtime > lastBackupDate) {
            const relativePath = path.relative(process.cwd(), fullPath);
            archive.file(fullPath, { name: relativePath });
          }
        }
      }
    } catch (error) {
      // Directory might not exist, skip silently
    }
  }

  async createDatabaseDump() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpPath = path.join(this.backupPath, `temp_dump_${timestamp}.sql`);

    return new Promise((resolve, reject) => {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const pgDump = spawn('pg_dump', [
        '-h', dbUrl.hostname,
        '-p', dbUrl.port || '5432',
        '-U', dbUrl.username,
        '-d', dbUrl.pathname.substring(1),
        '-f', dumpPath,
        '--no-password',
        '--verbose'
      ], {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        }
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          resolve(dumpPath);
        } else {
          reject(new Error(`pg_dump exited with code ${code}`));
        }
      });

      pgDump.on('error', reject);
    });
  }

  async calculateChecksum(filepath) {
    const hash = crypto.createHash('sha256');
    const stream = require('fs').createReadStream(filepath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async encryptBackup(filepath, encryptionKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, encryptionKey);
    
    const input = require('fs').createReadStream(filepath);
    const output = require('fs').createWriteStream(`${filepath}.encrypted`);
    
    return new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output);
      output.on('finish', async () => {
        await fs.unlink(filepath); // Remove unencrypted file
        await fs.rename(`${filepath}.encrypted`, filepath);
        resolve();
      });
      output.on('error', reject);
    });
  }

  async updateBackupStatus(backupId, status, result = {}) {
    try {
      const updateQuery = `
        UPDATE backups
        SET 
          status = $1,
          completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END,
          duration_seconds = CASE WHEN $1 IN ('completed', 'failed') THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)) ELSE duration_seconds END,
          file_size = COALESCE($2, file_size),
          checksum = COALESCE($3, checksum),
          compression_ratio = COALESCE($4, compression_ratio),
          error_message = COALESCE($5, error_message)
        WHERE id = $6
      `;

      await pool.query(updateQuery, [
        status,
        result.fileSize || null,
        result.checksum || null,
        result.compressionRatio || null,
        result.error || null,
        backupId
      ]);

      logger.info('Backup status updated', {
        backupId,
        status,
        result
      });

    } catch (error) {
      logger.error('Failed to update backup status:', error);
    }
  }

  async restoreBackup(backupId, options = {}) {
    try {
      const {
        userId = null,
        restoreDatabase = true,
        restoreFiles = true,
        targetPath = null
      } = options;

      // Get backup details
      const backupQuery = `
        SELECT * FROM backups
        WHERE backup_id = $1 AND status = 'completed'
      `;

      const result = await pool.query(backupQuery, [backupId]);
      
      if (result.rows.length === 0) {
        throw new Error('Backup not found or not completed');
      }

      const backup = result.rows[0];
      const restoreId = crypto.randomUUID();
      
      logger.info('Starting backup restore', {
        backupId,
        restoreId,
        userId,
        restoreDatabase,
        restoreFiles
      });

      // Extract backup
      const extractPath = targetPath || path.join(this.backupPath, `restore_${restoreId}`);
      await fs.mkdir(extractPath, { recursive: true });
      
      await extract(backup.file_path, { dir: path.resolve(extractPath) });

      // Restore database if requested
      if (restoreDatabase) {
        const dbFile = path.join(extractPath, 'database.sql');
        try {
          await fs.access(dbFile);
          await this.restoreDatabase(dbFile);
          logger.info('Database restored successfully');
        } catch (error) {
          logger.warn('Database file not found in backup or restore failed:', error);
        }
      }

      // Restore files if requested
      if (restoreFiles) {
        await this.restoreFiles(extractPath);
        logger.info('Files restored successfully');
      }

      // Clean up extraction directory
      if (!targetPath) {
        await fs.rmdir(extractPath, { recursive: true });
      }

      logger.info('Backup restore completed', {
        backupId,
        restoreId
      });

      return {
        success: true,
        restoreId,
        message: 'Backup restored successfully'
      };

    } catch (error) {
      logger.error('Failed to restore backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async restoreDatabase(sqlFile) {
    return new Promise((resolve, reject) => {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const psql = spawn('psql', [
        '-h', dbUrl.hostname,
        '-p', dbUrl.port || '5432',
        '-U', dbUrl.username,
        '-d', dbUrl.pathname.substring(1),
        '-f', sqlFile
      ], {
        env: {
          ...process.env,
          PGPASSWORD: dbUrl.password
        }
      });

      psql.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`psql exited with code ${code}`));
        }
      });

      psql.on('error', reject);
    });
  }

  async restoreFiles(extractPath) {
    const directories = [
      { source: 'uploads', target: this.uploadsPath },
      { source: 'documents', target: this.documentsPath },
      { source: 'reports', target: this.reportsPath },
      { source: 'audit_logs', target: this.auditPath }
    ];

    for (const dir of directories) {
      const sourcePath = path.join(extractPath, dir.source);
      try {
        await fs.access(sourcePath);
        await fs.mkdir(dir.target, { recursive: true });
        await this.copyDirectory(sourcePath, dir.target);
      } catch (error) {
        logger.warn(`Failed to restore directory ${dir.source}:`, error);
      }
    }
  }

  async copyDirectory(source, target) {
    const files = await fs.readdir(source, { withFileTypes: true });
    
    for (const file of files) {
      const sourcePath = path.join(source, file.name);
      const targetPath = path.join(target, file.name);
      
      if (file.isDirectory()) {
        await fs.mkdir(targetPath, { recursive: true });
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  async getBackups(options = {}) {
    try {
      const {
        type = null,
        status = null,
        limit = 50,
        offset = 0
      } = options;

      let query = `
        SELECT 
          b.*,
          u.username,
          u.first_name,
          u.last_name
        FROM backups b
        LEFT JOIN users u ON b.created_by = u.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (type) {
        paramCount++;
        query += ` AND b.type = $${paramCount}`;
        params.push(type);
      }

      if (status) {
        paramCount++;
        query += ` AND b.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY b.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      return {
        success: true,
        backups: result.rows
      };

    } catch (error) {
      logger.error('Failed to get backups:', error);
      return {
        success: false,
        error: error.message,
        backups: []
      };
    }
  }

  async deleteBackup(backupId) {
    try {
      // Get backup details
      const backupQuery = `
        SELECT * FROM backups
        WHERE backup_id = $1
      `;

      const result = await pool.query(backupQuery, [backupId]);
      
      if (result.rows.length === 0) {
        throw new Error('Backup not found');
      }

      const backup = result.rows[0];

      // Delete physical file
      try {
        await fs.unlink(backup.file_path);
      } catch (error) {
        logger.warn('Failed to delete backup file:', error);
      }

      // Delete database record
      const deleteQuery = `
        DELETE FROM backups
        WHERE backup_id = $1
      `;

      await pool.query(deleteQuery, [backupId]);

      logger.info('Backup deleted', {
        backupId,
        filename: backup.filename
      });

      return {
        success: true,
        message: 'Backup deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setupScheduledBackups() {
    try {
      // Get active schedules
      const schedulesQuery = `
        SELECT * FROM backup_schedules
        WHERE enabled = TRUE
      `;

      const result = await pool.query(schedulesQuery);
      
      for (const schedule of result.rows) {
        this.scheduleBackup(schedule);
      }

      logger.info('Scheduled backups setup completed', {
        scheduleCount: result.rows.length
      });

    } catch (error) {
      logger.error('Failed to setup scheduled backups:', error);
    }
  }

  scheduleBackup(schedule) {
    try {
      const job = cron.schedule(schedule.cron_expression, async () => {
        logger.info('Running scheduled backup', {
          scheduleId: schedule.id,
          name: schedule.name,
          type: schedule.type
        });

        const result = await this.createBackup({
          type: schedule.type,
          userId: schedule.created_by,
          description: `Scheduled backup: ${schedule.name}`,
          compression: schedule.compression_enabled,
          encryption: schedule.encryption_enabled
        });

        // Update last run time
        await pool.query(
          'UPDATE backup_schedules SET last_run = CURRENT_TIMESTAMP WHERE id = $1',
          [schedule.id]
        );

        // Clean up old backups based on retention
        if (schedule.retention_days > 0) {
          await this.cleanupOldBackups(schedule.type, schedule.retention_days);
        }

        if (result.success) {
          logger.info('Scheduled backup completed', {
            scheduleId: schedule.id,
            backupId: result.backupId
          });
        } else {
          logger.error('Scheduled backup failed', {
            scheduleId: schedule.id,
            error: result.error
          });
        }
      }, {
        scheduled: false
      });

      job.start();
      this.scheduledJobs.set(schedule.id, job);

      logger.info('Backup scheduled', {
        scheduleId: schedule.id,
        name: schedule.name,
        cronExpression: schedule.cron_expression
      });

    } catch (error) {
      logger.error('Failed to schedule backup:', error);
    }
  }

  async cleanupOldBackups(type, retentionDays) {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      const oldBackupsQuery = `
        SELECT backup_id FROM backups
        WHERE type = $1 AND created_at < $2 AND status = 'completed'
      `;

      const result = await pool.query(oldBackupsQuery, [type, cutoffDate]);
      
      for (const backup of result.rows) {
        await this.deleteBackup(backup.backup_id);
      }

      logger.info('Old backups cleaned up', {
        type,
        retentionDays,
        deletedCount: result.rows.length
      });

    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
    }
  }

  async getBackupStatistics() {
    try {
      const queries = {
        totalBackups: 'SELECT COUNT(*) as count FROM backups',
        completedBackups: "SELECT COUNT(*) as count FROM backups WHERE status = 'completed'",
        failedBackups: "SELECT COUNT(*) as count FROM backups WHERE status = 'failed'",
        totalSize: "SELECT SUM(file_size) as size FROM backups WHERE status = 'completed'",
        averageSize: "SELECT AVG(file_size) as size FROM backups WHERE status = 'completed'",
        backupsByType: `
          SELECT type, COUNT(*) as count
          FROM backups
          GROUP BY type
          ORDER BY count DESC
        `,
        recentBackups: `
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM backups
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await pool.query(query);
        results[key] = result.rows;
      }

      return {
        success: true,
        statistics: results
      };

    } catch (error) {
      logger.error('Failed to get backup statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const backupService = new BackupService();

module.exports = backupService;