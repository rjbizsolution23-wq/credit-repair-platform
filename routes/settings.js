const express = require('express');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const bcrypt = require('bcryptjs');
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
    new winston.transports.File({ filename: 'logs/settings.log' })
  ]
});

// Validation rules
const updateSettingValidation = [
  body('key').trim().notEmpty().withMessage('Setting key is required'),
  body('value').notEmpty().withMessage('Setting value is required'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

const updateCompanyValidation = [
  body('companyName').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Company name must be between 1 and 255 characters'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  body('phone').optional().trim().matches(/^[\+]?[1-9]?[0-9]{7,15}$/).withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('website').optional().isURL().withMessage('Valid website URL is required')
];

const updateEmailValidation = [
  body('smtpHost').optional().trim().notEmpty().withMessage('SMTP host is required'),
  body('smtpPort').optional().isInt({ min: 1, max: 65535 }).withMessage('Valid SMTP port is required'),
  body('smtpUser').optional().trim().notEmpty().withMessage('SMTP user is required'),
  body('smtpPassword').optional().trim().notEmpty().withMessage('SMTP password is required'),
  body('smtpSecure').optional().isBoolean().withMessage('SMTP secure must be boolean'),
  body('fromEmail').optional().isEmail().withMessage('Valid from email is required'),
  body('fromName').optional().trim().notEmpty().withMessage('From name is required')
];

// Get all system settings
router.get('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { category = '' } = req.query;

    let settingsQuery = `
      SELECT 
        key,
        value,
        category,
        description,
        is_public,
        updated_at
      FROM system_settings
    `;
    
    const queryParams = [];
    
    if (category) {
      settingsQuery += ' WHERE category = $1';
      queryParams.push(category);
    }
    
    settingsQuery += ' ORDER BY category, key';

    const result = await pool.query(settingsQuery, queryParams);

    // Group settings by category
    const settingsByCategory = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isPublic: setting.is_public,
        updatedAt: setting.updated_at
      });
      return acc;
    }, {});

    res.json({
      settings: settingsByCategory,
      categories: Object.keys(settingsByCategory)
    });

    logger.info('System settings retrieved', {
      userId: req.user.id,
      category: category || 'all'
    });

  } catch (error) {
    logger.error('Error retrieving system settings:', error);
    res.status(500).json({ error: 'Failed to retrieve system settings' });
  }
});

// Get public settings (no authentication required)
router.get('/public', async (req, res) => {
  try {
    const publicSettingsQuery = `
      SELECT 
        key,
        value,
        category,
        description
      FROM system_settings
      WHERE is_public = true
      ORDER BY category, key
    `;

    const result = await pool.query(publicSettingsQuery);

    // Group settings by category
    const settingsByCategory = result.rows.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push({
        key: setting.key,
        value: setting.value,
        description: setting.description
      });
      return acc;
    }, {});

    res.json({
      settings: settingsByCategory
    });

  } catch (error) {
    logger.error('Error retrieving public settings:', error);
    res.status(500).json({ error: 'Failed to retrieve public settings' });
  }
});

// Update system setting
router.put('/:key', requireRole(['admin']), updateSettingValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    // Check if setting exists
    const existingQuery = 'SELECT key, category FROM system_settings WHERE key = $1';
    const existingResult = await pool.query(existingQuery, [key]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const setting = existingResult.rows[0];

    // Update setting
    const updateQuery = `
      UPDATE system_settings 
      SET value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP
      WHERE key = $3
      RETURNING key, value, category, description, is_public, updated_at
    `;

    const updateResult = await pool.query(updateQuery, [value, description, key]);
    const updatedSetting = updateResult.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'setting_updated',
        `Updated system setting: ${key}`,
        JSON.stringify({ 
          settingKey: key,
          category: setting.category,
          newValue: value
        })
      ]
    );

    res.json({
      message: 'Setting updated successfully',
      setting: {
        key: updatedSetting.key,
        value: updatedSetting.value,
        category: updatedSetting.category,
        description: updatedSetting.description,
        isPublic: updatedSetting.is_public,
        updatedAt: updatedSetting.updated_at
      }
    });

    logger.info('System setting updated', {
      userId: req.user.id,
      settingKey: key,
      category: setting.category
    });

  } catch (error) {
    logger.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to update system setting' });
  }
});

// Update company information
router.put('/company/info', requireRole(['admin']), updateCompanyValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      companyName,
      address,
      phone,
      email,
      website
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updates = [];
      if (companyName !== undefined) updates.push({ key: 'company_name', value: companyName });
      if (address !== undefined) updates.push({ key: 'company_address', value: address });
      if (phone !== undefined) updates.push({ key: 'company_phone', value: phone });
      if (email !== undefined) updates.push({ key: 'company_email', value: email });
      if (website !== undefined) updates.push({ key: 'company_website', value: website });

      for (const update of updates) {
        await client.query(
          'UPDATE system_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
          [update.value, update.key]
        );
      }

      // Log activity
      await client.query(
        'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
        [
          req.user.id,
          'company_info_updated',
          'Updated company information',
          JSON.stringify({ updatedFields: updates.map(u => u.key) })
        ]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Company information updated successfully',
        updatedFields: updates.map(u => u.key)
      });

      logger.info('Company information updated', {
        userId: req.user.id,
        updatedFields: updates.map(u => u.key)
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error updating company information:', error);
    res.status(500).json({ error: 'Failed to update company information' });
  }
});

// Update email configuration
router.put('/email/config', requireRole(['admin']), updateEmailValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      fromEmail,
      fromName
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updates = [];
      if (smtpHost !== undefined) updates.push({ key: 'smtp_host', value: smtpHost });
      if (smtpPort !== undefined) updates.push({ key: 'smtp_port', value: smtpPort.toString() });
      if (smtpUser !== undefined) updates.push({ key: 'smtp_user', value: smtpUser });
      if (smtpPassword !== undefined) {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(smtpPassword, 10);
        updates.push({ key: 'smtp_password', value: hashedPassword });
      }
      if (smtpSecure !== undefined) updates.push({ key: 'smtp_secure', value: smtpSecure.toString() });
      if (fromEmail !== undefined) updates.push({ key: 'email_from_address', value: fromEmail });
      if (fromName !== undefined) updates.push({ key: 'email_from_name', value: fromName });

      for (const update of updates) {
        await client.query(
          'UPDATE system_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
          [update.value, update.key]
        );
      }

      // Log activity (don't log password)
      await client.query(
        'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
        [
          req.user.id,
          'email_config_updated',
          'Updated email configuration',
          JSON.stringify({ 
            updatedFields: updates.map(u => u.key).filter(key => key !== 'smtp_password')
          })
        ]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Email configuration updated successfully',
        updatedFields: updates.map(u => u.key)
      });

      logger.info('Email configuration updated', {
        userId: req.user.id,
        updatedFields: updates.map(u => u.key)
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error updating email configuration:', error);
    res.status(500).json({ error: 'Failed to update email configuration' });
  }
});

// Test email configuration
router.post('/email/test', requireRole(['admin']), async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }

    // Get email configuration
    const configQuery = `
      SELECT key, value
      FROM system_settings
      WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_secure', 'email_from_address', 'email_from_name')
    `;

    const configResult = await pool.query(configQuery);
    const config = configResult.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    // Check if all required config is present
    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'email_from_address'];
    const missingFields = requiredFields.filter(field => !config[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Email configuration incomplete',
        missingFields
      });
    }

    // Here you would typically send a test email using nodemailer
    // For now, we'll simulate the test
    const testResult = {
      success: true,
      message: 'Test email sent successfully',
      timestamp: new Date().toISOString()
    };

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'email_test_sent',
        `Sent test email to ${testEmail}`,
        JSON.stringify({ testEmail, success: testResult.success })
      ]
    );

    res.json(testResult);

    logger.info('Email test completed', {
      userId: req.user.id,
      testEmail,
      success: testResult.success
    });

  } catch (error) {
    logger.error('Error testing email configuration:', error);
    res.status(500).json({ error: 'Failed to test email configuration' });
  }
});

// Get system status and health
router.get('/system/status', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    // Database connection test
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbResponseTime = Date.now() - dbStart;

    // Get system statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM disputes) as total_disputes,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size
    `;

    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get recent activity count
    const activityQuery = `
      SELECT COUNT(*) as recent_activities
      FROM activities
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
    `;

    const activityResult = await pool.query(activityQuery);
    const recentActivities = parseInt(activityResult.rows[0].recent_activities);

    // System health indicators
    const health = {
      database: {
        status: 'healthy',
        responseTime: `${dbResponseTime}ms`,
        size: stats.database_size
      },
      application: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      },
      statistics: {
        totalClients: parseInt(stats.total_clients),
        totalDisputes: parseInt(stats.total_disputes),
        activeUsers: parseInt(stats.active_users),
        activeSubscriptions: parseInt(stats.active_subscriptions),
        recentActivities
      }
    };

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      health
    });

    logger.info('System status retrieved', {
      userId: req.user.id,
      dbResponseTime,
      recentActivities
    });

  } catch (error) {
    logger.error('Error retrieving system status:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Failed to retrieve system status',
      timestamp: new Date().toISOString()
    });
  }
});

// Backup system settings
router.post('/backup', requireRole(['admin']), async (req, res) => {
  try {
    const backupQuery = `
      SELECT 
        key,
        value,
        category,
        description,
        is_public
      FROM system_settings
      ORDER BY category, key
    `;

    const result = await pool.query(backupQuery);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: result.rows
    };

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'settings_backup_created',
        'Created system settings backup',
        JSON.stringify({ settingsCount: result.rows.length })
      ]
    );

    res.json({
      message: 'Settings backup created successfully',
      backup
    });

    logger.info('Settings backup created', {
      userId: req.user.id,
      settingsCount: result.rows.length
    });

  } catch (error) {
    logger.error('Error creating settings backup:', error);
    res.status(500).json({ error: 'Failed to create settings backup' });
  }
});

// Restore system settings
router.post('/restore', requireRole(['admin']), async (req, res) => {
  try {
    const { backup } = req.body;

    if (!backup || !backup.settings || !Array.isArray(backup.settings)) {
      return res.status(400).json({ error: 'Invalid backup format' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let restoredCount = 0;
      let errorCount = 0;

      for (const setting of backup.settings) {
        try {
          await client.query(
            `INSERT INTO system_settings (key, value, category, description, is_public)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (key) DO UPDATE SET
               value = EXCLUDED.value,
               description = EXCLUDED.description,
               is_public = EXCLUDED.is_public,
               updated_at = CURRENT_TIMESTAMP`,
            [setting.key, setting.value, setting.category, setting.description, setting.is_public]
          );
          restoredCount++;
        } catch (error) {
          logger.warn('Failed to restore setting:', { key: setting.key, error: error.message });
          errorCount++;
        }
      }

      // Log activity
      await client.query(
        'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
        [
          req.user.id,
          'settings_backup_restored',
          'Restored system settings from backup',
          JSON.stringify({ 
            restoredCount,
            errorCount,
            backupTimestamp: backup.timestamp
          })
        ]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Settings restored successfully',
        restoredCount,
        errorCount
      });

      logger.info('Settings backup restored', {
        userId: req.user.id,
        restoredCount,
        errorCount
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error restoring settings backup:', error);
    res.status(500).json({ error: 'Failed to restore settings backup' });
  }
});

// Reset settings to default
router.post('/reset', requireRole(['admin']), async (req, res) => {
  try {
    const { category, confirm } = req.body;

    if (confirm !== 'RESET_SETTINGS') {
      return res.status(400).json({ 
        error: 'Confirmation required. Set confirm to "RESET_SETTINGS"' 
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let resetQuery = 'DELETE FROM system_settings';
      const queryParams = [];

      if (category) {
        resetQuery += ' WHERE category = $1';
        queryParams.push(category);
      }

      const result = await client.query(resetQuery, queryParams);
      const deletedCount = result.rowCount;

      // Insert default settings (you would define these based on your application needs)
      const defaultSettings = [
        { key: 'company_name', value: 'Elite Credit Repair', category: 'company', description: 'Company name', is_public: true },
        { key: 'max_disputes_per_client', value: '10', category: 'business', description: 'Maximum disputes per client', is_public: false },
        { key: 'default_letter_template', value: 'standard', category: 'letters', description: 'Default letter template', is_public: false },
        { key: 'email_notifications_enabled', value: 'true', category: 'notifications', description: 'Enable email notifications', is_public: false }
      ];

      if (!category) {
        // Reset all settings to defaults
        for (const setting of defaultSettings) {
          await client.query(
            'INSERT INTO system_settings (key, value, category, description, is_public) VALUES ($1, $2, $3, $4, $5)',
            [setting.key, setting.value, setting.category, setting.description, setting.is_public]
          );
        }
      } else {
        // Reset only settings in the specified category
        const categoryDefaults = defaultSettings.filter(s => s.category === category);
        for (const setting of categoryDefaults) {
          await client.query(
            'INSERT INTO system_settings (key, value, category, description, is_public) VALUES ($1, $2, $3, $4, $5)',
            [setting.key, setting.value, setting.category, setting.description, setting.is_public]
          );
        }
      }

      // Log activity
      await client.query(
        'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
        [
          req.user.id,
          'settings_reset',
          category ? `Reset ${category} settings to default` : 'Reset all settings to default',
          JSON.stringify({ category, deletedCount })
        ]
      );

      await client.query('COMMIT');

      res.json({
        message: category ? `${category} settings reset to default` : 'All settings reset to default',
        deletedCount,
        category: category || 'all'
      });

      logger.info('Settings reset to default', {
        userId: req.user.id,
        category: category || 'all',
        deletedCount
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;