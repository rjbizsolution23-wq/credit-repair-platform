const { Pool } = require('pg');
const winston = require('winston');
const emailService = require('./emailService');

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

class NotificationService {
  constructor() {
    this.initialized = false;
    this.notificationTypes = {
      DISPUTE_UPDATE: 'dispute_update',
      PAYMENT_DUE: 'payment_due',
      PAYMENT_RECEIVED: 'payment_received',
      DOCUMENT_UPLOADED: 'document_uploaded',
      LETTER_SENT: 'letter_sent',
      CREDIT_REPORT_UPDATED: 'credit_report_updated',
      SYSTEM_ALERT: 'system_alert',
      USER_ACTIVITY: 'user_activity',
      SUBSCRIPTION_EXPIRING: 'subscription_expiring',
      TASK_REMINDER: 'task_reminder'
    };

    this.priorities = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      URGENT: 'urgent'
    };
  }

  async initialize() {
    try {
      this.initialized = true;
      logger.info('Notification service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  async createNotification(options) {
    try {
      const {
        userId,
        clientId = null,
        type,
        title,
        message,
        priority = this.priorities.MEDIUM,
        actionUrl = null,
        metadata = {},
        sendEmail = false,
        emailTemplate = null
      } = options;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        throw new Error('Missing required notification fields');
      }

      // Validate type
      if (!Object.values(this.notificationTypes).includes(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Validate priority
      if (!Object.values(this.priorities).includes(priority)) {
        throw new Error(`Invalid priority: ${priority}`);
      }

      // Create notification in database
      const result = await pool.query(
        `INSERT INTO notifications 
         (user_id, client_id, type, title, message, priority, action_url, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING id, created_at`,
        [userId, clientId, type, title, message, priority, actionUrl, JSON.stringify(metadata)]
      );

      const notification = result.rows[0];

      // Send email notification if requested
      if (sendEmail) {
        await this.sendEmailNotification({
          userId,
          notification: {
            id: notification.id,
            title,
            message,
            priority,
            action_url: actionUrl,
            created_at: notification.created_at
          },
          template: emailTemplate
        });
      }

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          clientId,
          'notification_created',
          `Notification created: ${title}`,
          JSON.stringify({
            notificationId: notification.id,
            type,
            priority,
            emailSent: sendEmail
          })
        ]
      );

      logger.info('Notification created', {
        notificationId: notification.id,
        userId,
        clientId,
        type,
        priority,
        emailSent: sendEmail
      });

      return {
        success: true,
        notificationId: notification.id,
        createdAt: notification.created_at
      };

    } catch (error) {
      logger.error('Failed to create notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendEmailNotification(options) {
    try {
      const { userId, notification, template } = options;

      // Get user details
      const userResult = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Send email using email service
      const emailResult = await emailService.sendNotificationEmail(user, notification);

      if (!emailResult.success) {
        throw new Error(emailResult.error);
      }

      logger.info('Email notification sent', {
        userId,
        notificationId: notification.id,
        email: user.email
      });

      return emailResult;

    } catch (error) {
      logger.error('Failed to send email notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createDisputeUpdateNotification(dispute, client, user) {
    const statusMessages = {
      'pending': 'Your dispute has been submitted and is pending review.',
      'in-progress': 'Your dispute is currently being processed.',
      'resolved': 'Great news! Your dispute has been resolved successfully.',
      'rejected': 'Your dispute has been rejected. Please review the details.'
    };

    const priority = dispute.status === 'resolved' ? this.priorities.HIGH : this.priorities.MEDIUM;

    return await this.createNotification({
      userId: user.id,
      clientId: client.id,
      type: this.notificationTypes.DISPUTE_UPDATE,
      title: `Dispute Update: ${dispute.item}`,
      message: statusMessages[dispute.status] || 'Your dispute status has been updated.',
      priority,
      actionUrl: `/disputes/${dispute.id}`,
      metadata: {
        disputeId: dispute.id,
        bureau: dispute.bureau,
        previousStatus: dispute.previous_status,
        newStatus: dispute.status
      },
      sendEmail: true
    });
  }

  async createPaymentNotification(payment, client, user, type = 'received') {
    const isReceived = type === 'received';
    const title = isReceived 
      ? `Payment Received - $${payment.amount}`
      : `Payment Due - $${payment.amount}`;
    
    const message = isReceived
      ? `We have received your payment of $${payment.amount}. Thank you!`
      : `You have a payment of $${payment.amount} due on ${new Date(payment.due_date).toLocaleDateString()}.`;

    return await this.createNotification({
      userId: user.id,
      clientId: client.id,
      type: isReceived ? this.notificationTypes.PAYMENT_RECEIVED : this.notificationTypes.PAYMENT_DUE,
      title,
      message,
      priority: isReceived ? this.priorities.MEDIUM : this.priorities.HIGH,
      actionUrl: `/billing/payments/${payment.id}`,
      metadata: {
        paymentId: payment.id,
        amount: payment.amount,
        dueDate: payment.due_date,
        paymentType: type
      },
      sendEmail: true
    });
  }

  async createDocumentNotification(document, client, user) {
    return await this.createNotification({
      userId: user.id,
      clientId: client.id,
      type: this.notificationTypes.DOCUMENT_UPLOADED,
      title: 'New Document Uploaded',
      message: `A new document "${document.filename}" has been uploaded to your account.`,
      priority: this.priorities.MEDIUM,
      actionUrl: `/documents/${document.id}`,
      metadata: {
        documentId: document.id,
        filename: document.filename,
        documentType: document.document_type
      },
      sendEmail: false // Usually not urgent enough for email
    });
  }

  async createLetterNotification(letter, client, user) {
    return await this.createNotification({
      userId: user.id,
      clientId: client.id,
      type: this.notificationTypes.LETTER_SENT,
      title: 'Dispute Letter Sent',
      message: `A dispute letter has been sent to ${letter.bureau} regarding "${letter.dispute_item}".`,
      priority: this.priorities.MEDIUM,
      actionUrl: `/letters/${letter.id}`,
      metadata: {
        letterId: letter.id,
        bureau: letter.bureau,
        disputeItem: letter.dispute_item,
        templateUsed: letter.template_id
      },
      sendEmail: true
    });
  }

  async createCreditReportNotification(report, client, user) {
    return await this.createNotification({
      userId: user.id,
      clientId: client.id,
      type: this.notificationTypes.CREDIT_REPORT_UPDATED,
      title: 'Credit Report Updated',
      message: `Your ${report.bureau} credit report has been updated. New score: ${report.credit_score}.`,
      priority: this.priorities.HIGH,
      actionUrl: `/credit-reports/${report.id}`,
      metadata: {
        reportId: report.id,
        bureau: report.bureau,
        creditScore: report.credit_score,
        previousScore: report.previous_score
      },
      sendEmail: true
    });
  }

  async createSystemAlert(title, message, priority = this.priorities.MEDIUM, targetUsers = []) {
    const results = [];

    // If no target users specified, send to all admin/manager users
    if (targetUsers.length === 0) {
      const usersResult = await pool.query(
        "SELECT id FROM users WHERE role IN ('admin', 'manager') AND status = 'active'"
      );
      targetUsers = usersResult.rows.map(row => row.id);
    }

    for (const userId of targetUsers) {
      const result = await this.createNotification({
        userId,
        type: this.notificationTypes.SYSTEM_ALERT,
        title,
        message,
        priority,
        metadata: {
          systemAlert: true,
          timestamp: new Date().toISOString()
        },
        sendEmail: priority === this.priorities.URGENT
      });
      results.push(result);
    }

    return {
      success: true,
      notificationsSent: results.filter(r => r.success).length,
      totalTargets: targetUsers.length,
      results
    };
  }

  async createSubscriptionExpiringNotification(subscription, client, user) {
    const daysUntilExpiry = Math.ceil(
      (new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return await this.createNotification({
      userId: user.id,
      clientId: client.id,
      type: this.notificationTypes.SUBSCRIPTION_EXPIRING,
      title: 'Subscription Expiring Soon',
      message: `Your subscription will expire in ${daysUntilExpiry} days. Please renew to continue service.`,
      priority: daysUntilExpiry <= 3 ? this.priorities.URGENT : this.priorities.HIGH,
      actionUrl: '/billing/subscription',
      metadata: {
        subscriptionId: subscription.id,
        expiryDate: subscription.end_date,
        daysUntilExpiry,
        planName: subscription.plan_name
      },
      sendEmail: true
    });
  }

  async createTaskReminder(task, user) {
    return await this.createNotification({
      userId: user.id,
      type: this.notificationTypes.TASK_REMINDER,
      title: 'Task Reminder',
      message: `Reminder: ${task.description} is due ${task.due_date ? `on ${new Date(task.due_date).toLocaleDateString()}` : 'soon'}.`,
      priority: this.priorities.MEDIUM,
      actionUrl: `/tasks/${task.id}`,
      metadata: {
        taskId: task.id,
        dueDate: task.due_date,
        taskType: task.type
      },
      sendEmail: false
    });
  }

  async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.info('Notification marked as read', {
        notificationId,
        userId
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      logger.info('All notifications marked as read', {
        userId,
        count: result.rowCount
      });

      return {
        success: true,
        markedCount: result.rowCount
      };

    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found or access denied');
      }

      logger.info('Notification deleted', {
        notificationId,
        userId
      });

      return { success: true };

    } catch (error) {
      logger.error('Failed to delete notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      return parseInt(result.rows[0].count);

    } catch (error) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type = null,
        priority = null,
        isRead = null,
        includeRead = true
      } = options;

      let query = `
        SELECT 
          id,
          client_id,
          type,
          title,
          message,
          priority,
          action_url,
          metadata,
          is_read,
          read_at,
          created_at
        FROM notifications
        WHERE user_id = $1
      `;

      const queryParams = [userId];
      let paramCount = 1;

      if (type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        queryParams.push(type);
      }

      if (priority) {
        paramCount++;
        query += ` AND priority = $${paramCount}`;
        queryParams.push(priority);
      }

      if (isRead !== null) {
        paramCount++;
        query += ` AND is_read = $${paramCount}`;
        queryParams.push(isRead);
      } else if (!includeRead) {
        query += ' AND is_read = false';
      }

      query += ' ORDER BY created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        queryParams.push(limit);
      }

      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        queryParams.push(offset);
      }

      const result = await pool.query(query, queryParams);

      return {
        success: true,
        notifications: result.rows.map(row => ({
          id: row.id,
          clientId: row.client_id,
          type: row.type,
          title: row.title,
          message: row.message,
          priority: row.priority,
          actionUrl: row.action_url,
          metadata: row.metadata,
          isRead: row.is_read,
          readAt: row.read_at,
          createdAt: row.created_at
        }))
      };

    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      return {
        success: false,
        error: error.message,
        notifications: []
      };
    }
  }

  async cleanupOldNotifications(daysToKeep = 90) {
    try {
      const result = await pool.query(
        'DELETE FROM notifications WHERE created_at < CURRENT_DATE - INTERVAL $1 DAY',
        [daysToKeep]
      );

      logger.info('Old notifications cleaned up', {
        deletedCount: result.rowCount,
        daysToKeep
      });

      return {
        success: true,
        deletedCount: result.rowCount
      };

    } catch (error) {
      logger.error('Failed to cleanup old notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getNotificationStats() {
    try {
      const statsQuery = `
        SELECT 
          type,
          priority,
          COUNT(*) as count,
          COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
          DATE_TRUNC('day', created_at) as date
        FROM notifications 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY type, priority, DATE_TRUNC('day', created_at)
        ORDER BY date DESC, type, priority
      `;

      const result = await pool.query(statsQuery);
      
      return {
        success: true,
        stats: result.rows
      };

    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      return {
        success: false,
        error: error.message,
        stats: []
      };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;