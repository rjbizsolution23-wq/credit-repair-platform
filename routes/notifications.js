const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
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
    new winston.transports.File({ filename: 'logs/notifications.log' })
  ]
});

// Validation rules
const createNotificationValidation = [
  body('userId').optional().isUUID().withMessage('Valid user ID is required'),
  body('clientId').optional().isUUID().withMessage('Valid client ID is required'),
  body('type').notEmpty().withMessage('Notification type is required'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be less than 255 characters'),
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Valid priority is required'),
  body('actionUrl').optional().isURL().withMessage('Valid URL is required')
];

// Get notifications for current user
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = '',
      priority = '',
      isRead = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['created_at', 'priority', 'type', 'title'];
    const validSortOrders = ['ASC', 'DESC'];

    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereConditions = ['user_id = $1'];
    let queryParams = [req.user.id];
    let paramCount = 1;

    // Type filter
    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }

    // Priority filter
    if (priority) {
      paramCount++;
      whereConditions.push(`priority = $${paramCount}`);
      queryParams.push(priority);
    }

    // Read status filter
    if (isRead !== '') {
      paramCount++;
      whereConditions.push(`is_read = $${paramCount}`);
      queryParams.push(isRead === 'true');
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalNotifications = parseInt(countResult.rows[0].total);

    // Get notifications with pagination
    const notificationsQuery = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.priority,
        n.action_url,
        n.metadata,
        n.created_at,
        c.first_name as client_first_name,
        c.last_name as client_last_name
      FROM notifications n
      LEFT JOIN clients c ON n.client_id = c.id
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const notificationsResult = await pool.query(notificationsQuery, queryParams);

    const totalPages = Math.ceil(totalNotifications / limit);

    // Get unread count
    const unreadCountQuery = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    const unreadResult = await pool.query(unreadCountQuery, [req.user.id]);
    const unreadCount = parseInt(unreadResult.rows[0].unread_count);

    res.json({
      notifications: notificationsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalNotifications,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      unreadCount
    });

    logger.info('Notifications retrieved', {
      userId: req.user.id,
      filters: { type, priority, isRead },
      resultCount: notificationsResult.rows.length
    });

  } catch (error) {
    logger.error('Error retrieving notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// Get notification by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notificationQuery = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.priority,
        n.action_url,
        n.metadata,
        n.created_at,
        c.first_name as client_first_name,
        c.last_name as client_last_name
      FROM notifications n
      LEFT JOIN clients c ON n.client_id = c.id
      WHERE n.id = $1 AND n.user_id = $2
    `;

    const result = await pool.query(notificationQuery, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = result.rows[0];

    // Mark as read if not already read
    if (!notification.is_read) {
      await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = $1',
        [id]
      );
      notification.is_read = true;
    }

    res.json({ notification });

    logger.info('Notification retrieved and marked as read', {
      userId: req.user.id,
      notificationId: id
    });

  } catch (error) {
    logger.error('Error retrieving notification:', error);
    res.status(500).json({ error: 'Failed to retrieve notification' });
  }
});

// Create notification (admin/manager only)
router.post('/', requireRole(['admin', 'manager']), createNotificationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      userId,
      clientId,
      type,
      title,
      message,
      priority = 'normal',
      actionUrl,
      metadata = {}
    } = req.body;

    // Validate user exists if userId provided
    if (userId) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return res.status(400).json({ error: 'User not found' });
      }
    }

    // Validate client exists if clientId provided
    if (clientId) {
      const clientCheck = await pool.query('SELECT id FROM clients WHERE id = $1', [clientId]);
      if (clientCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Client not found' });
      }
    }

    const createNotificationQuery = `
      INSERT INTO notifications (
        user_id, client_id, type, title, message, priority, action_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, type, title, message, priority, action_url, created_at
    `;

    const result = await pool.query(createNotificationQuery, [
      userId,
      clientId || null,
      type,
      title,
      message,
      priority,
      actionUrl || null,
      JSON.stringify(metadata)
    ]);

    const notification = result.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'notification_created',
        `Created notification: ${title}`,
        JSON.stringify({ notificationId: notification.id, type, targetUserId: userId })
      ]
    );

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });

    logger.info('Notification created', {
      createdBy: req.user.id,
      notificationId: notification.id,
      type,
      targetUserId: userId
    });

  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });

    logger.info('Notification marked as read', {
      userId: req.user.id,
      notificationId: id
    });

  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/read/all', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.rowCount
    });

    logger.info('All notifications marked as read', {
      userId: req.user.id,
      updatedCount: result.rowCount
    });

  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });

    logger.info('Notification deleted', {
      userId: req.user.id,
      notificationId: id
    });

  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_notifications,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_notifications,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_notifications,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_notifications
      FROM notifications
      WHERE user_id = $1
    `;

    const statsResult = await pool.query(statsQuery, [req.user.id]);
    const stats = statsResult.rows[0];

    // Get notification types breakdown
    const typesQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM notifications
      WHERE user_id = $1
      GROUP BY type
      ORDER BY count DESC
    `;

    const typesResult = await pool.query(typesQuery, [req.user.id]);

    // Get recent activity (last 7 days)
    const activityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const activityResult = await pool.query(activityQuery, [req.user.id]);

    res.json({
      summary: {
        totalNotifications: parseInt(stats.total_notifications),
        unreadNotifications: parseInt(stats.unread_notifications),
        urgentNotifications: parseInt(stats.urgent_notifications),
        highPriorityNotifications: parseInt(stats.high_priority_notifications),
        todayNotifications: parseInt(stats.today_notifications),
        weekNotifications: parseInt(stats.week_notifications)
      },
      typeBreakdown: typesResult.rows.map(row => ({
        type: row.type,
        total: parseInt(row.count),
        unread: parseInt(row.unread_count)
      })),
      recentActivity: activityResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      }))
    });

    logger.info('Notification statistics retrieved', {
      userId: req.user.id
    });

  } catch (error) {
    logger.error('Error retrieving notification statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve notification statistics' });
  }
});

// Bulk create notifications (admin only)
router.post('/bulk', requireRole(['admin']), async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ error: 'Notifications array is required' });
    }

    if (notifications.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 notifications allowed per bulk operation' });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const createdNotifications = [];

      for (const notification of notifications) {
        const {
          userId,
          clientId,
          type,
          title,
          message,
          priority = 'normal',
          actionUrl,
          metadata = {}
        } = notification;

        // Validate required fields
        if (!type || !title || !message) {
          throw new Error('Type, title, and message are required for each notification');
        }

        const result = await client.query(
          `INSERT INTO notifications (
            user_id, client_id, type, title, message, priority, action_url, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, type, title, created_at`,
          [
            userId || null,
            clientId || null,
            type,
            title,
            message,
            priority,
            actionUrl || null,
            JSON.stringify(metadata)
          ]
        );

        createdNotifications.push(result.rows[0]);
      }

      await client.query('COMMIT');

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
        [
          req.user.id,
          'bulk_notifications_created',
          `Created ${createdNotifications.length} notifications in bulk`,
          JSON.stringify({ count: createdNotifications.length })
        ]
      );

      res.status(201).json({
        message: `${createdNotifications.length} notifications created successfully`,
        notifications: createdNotifications
      });

      logger.info('Bulk notifications created', {
        createdBy: req.user.id,
        count: createdNotifications.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Error creating bulk notifications:', error);
    res.status(500).json({ error: 'Failed to create bulk notifications' });
  }
});

// Get notification preferences (placeholder for future implementation)
router.get('/preferences/me', async (req, res) => {
  try {
    // This would typically come from a user_preferences table
    // For now, return default preferences
    const preferences = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationTypes: {
        dispute_updates: true,
        payment_reminders: true,
        system_alerts: true,
        marketing: false
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    res.json({ preferences });

  } catch (error) {
    logger.error('Error retrieving notification preferences:', error);
    res.status(500).json({ error: 'Failed to retrieve notification preferences' });
  }
});

// Update notification preferences (placeholder for future implementation)
router.put('/preferences/me', async (req, res) => {
  try {
    const { preferences } = req.body;

    // This would typically update a user_preferences table
    // For now, just return success
    
    res.json({ 
      message: 'Notification preferences updated successfully',
      preferences
    });

    logger.info('Notification preferences updated', {
      userId: req.user.id,
      preferences
    });

  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

module.exports = router;