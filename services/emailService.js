const nodemailer = require('nodemailer');
const { Pool } = require('pg');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

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
    new winston.transports.File({ filename: 'logs/email.log' })
  ]
});

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      // Get email configuration from database
      const configResult = await pool.query(
        `SELECT key, value FROM system_settings 
         WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 
                      'smtp_secure', 'email_from_address', 'email_from_name')`
      );

      const config = configResult.rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      // Check if all required config is present
      const requiredFields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'email_from_address'];
      const missingFields = requiredFields.filter(field => !config[field]);

      if (missingFields.length > 0) {
        logger.warn('Email service not initialized - missing configuration:', { missingFields });
        return false;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port),
        secure: config.smtp_secure === 'true',
        auth: {
          user: config.smtp_user,
          pass: config.smtp_password
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Store from address and name
      this.fromAddress = config.email_from_address;
      this.fromName = config.email_from_name || 'Elite Credit Repair';

      // Verify connection
      await this.transporter.verify();

      // Load email templates
      await this.loadTemplates();

      this.initialized = true;
      logger.info('Email service initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      return false;
    }
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      
      // Create templates directory if it doesn't exist
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        await this.createDefaultTemplates(templatesDir);
      }

      const templateFiles = await fs.readdir(templatesDir);
      
      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templateContent = await fs.readFile(path.join(templatesDir, file), 'utf8');
          this.templates.set(templateName, handlebars.compile(templateContent));
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);

    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  async createDefaultTemplates(templatesDir) {
    const defaultTemplates = {
      'welcome': {
        subject: 'Welcome to Elite Credit Repair',
        content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Elite Credit Repair</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Elite Credit Repair</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>Welcome to Elite Credit Repair! We're excited to help you on your journey to better credit.</p>
            <p>Your account has been successfully created with the email: <strong>{{email}}</strong></p>
            <p>Here's what you can expect:</p>
            <ul>
                <li>Professional credit analysis and dispute management</li>
                <li>Personalized credit improvement strategies</li>
                <li>Regular progress updates and reports</li>
                <li>Expert support from our credit specialists</li>
            </ul>
            <p>To get started, please log in to your account and complete your profile.</p>
            <a href="{{loginUrl}}" class="button">Login to Your Account</a>
        </div>
        <div class="footer">
            <p>© 2025 RJ BUSINESS SOLUTIONS - Rick Jefferson Credit Solutions. All rights reserved.</p>
            <p>If you have any questions, please contact us at {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`
      },
      'password-reset': {
        subject: 'Password Reset Request',
        content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {{firstName}}!</h2>
            <p>We received a request to reset your password for your Elite Credit Repair account.</p>
            <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            <p>To reset your password, click the button below:</p>
            <a href="{{resetUrl}}" class="button">Reset Your Password</a>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
        </div>
        <div class="footer">
            <p>© 2025 RJ BUSINESS SOLUTIONS - Rick Jefferson Credit Solutions. All rights reserved.</p>
            <p>If you have any questions, please contact us at {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`
      },
      'dispute-update': {
        subject: 'Dispute Status Update',
        content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dispute Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .status { padding: 15px; border-radius: 4px; margin: 15px 0; font-weight: bold; }
        .status.pending { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .status.in-progress { background: #cce5ff; border: 1px solid #99ccff; color: #004085; }
        .status.resolved { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .status.rejected { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .button { display: inline-block; padding: 12px 24px; background: #27ae60; color: white; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Dispute Status Update</h1>
        </div>
        <div class="content">
            <h2>Hello {{clientName}}!</h2>
            <p>We have an update on your credit dispute:</p>
            <div class="status {{statusClass}}">
                Status: {{status}}
            </div>
            <h3>Dispute Details:</h3>
            <ul>
                <li><strong>Item:</strong> {{disputeItem}}</li>
                <li><strong>Bureau:</strong> {{bureau}}</li>
                <li><strong>Date Filed:</strong> {{dateCreated}}</li>
                <li><strong>Reference:</strong> {{disputeId}}</li>
            </ul>
            {{#if notes}}
            <h3>Update Notes:</h3>
            <p>{{notes}}</p>
            {{/if}}
            <p>You can view the full details of this dispute in your client portal:</p>
            <a href="{{portalUrl}}" class="button">View Dispute Details</a>
        </div>
        <div class="footer">
            <p>© 2025 RJ BUSINESS SOLUTIONS - Rick Jefferson Credit Solutions. All rights reserved.</p>
            <p>If you have any questions, please contact us at {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`
      },
      'notification': {
        subject: '{{subject}}',
        content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .priority { padding: 10px; border-radius: 4px; margin: 10px 0; font-weight: bold; }
        .priority.high { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .priority.medium { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .priority.low { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{subject}}</h1>
        </div>
        <div class="content">
            <h2>Hello {{recipientName}}!</h2>
            {{#if priority}}
            <div class="priority {{priority}}">
                Priority: {{priority}}
            </div>
            {{/if}}
            <div>{{{message}}}</div>
            {{#if actionUrl}}
            <p><a href="{{actionUrl}}" style="display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">Take Action</a></p>
            {{/if}}
        </div>
        <div class="footer">
            <p>© 2025 RJ BUSINESS SOLUTIONS - Rick Jefferson Credit Solutions. All rights reserved.</p>
            <p>If you have any questions, please contact us at {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`
      }
    };

    for (const [templateName, template] of Object.entries(defaultTemplates)) {
      await fs.writeFile(
        path.join(templatesDir, `${templateName}.hbs`),
        template.content,
        'utf8'
      );
    }

    logger.info('Created default email templates');
  }

  async sendEmail(options) {
    try {
      if (!this.initialized || !this.transporter) {
        throw new Error('Email service not initialized');
      }

      const {
        to,
        subject,
        template,
        data = {},
        attachments = [],
        priority = 'normal'
      } = options;

      let html, text;

      if (template && this.templates.has(template)) {
        // Use template
        const templateFn = this.templates.get(template);
        html = templateFn({
          ...data,
          supportEmail: process.env.SUPPORT_EMAIL || this.fromAddress,
          loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : '#',
          portalUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : '#'
        });
      } else if (data.html) {
        html = data.html;
      } else {
        throw new Error('No template or HTML content provided');
      }

      if (data.text) {
        text = data.text;
      }

      const mailOptions = {
        from: `${this.fromName} <${this.fromAddress}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
        attachments,
        priority: priority === 'high' ? 'high' : 'normal'
      };

      const result = await this.transporter.sendMail(mailOptions);

      // Log email sent
      await pool.query(
        `INSERT INTO activities (activity_type, description, metadata) 
         VALUES ($1, $2, $3)`,
        [
          'email_sent',
          `Email sent: ${subject}`,
          JSON.stringify({
            to: Array.isArray(to) ? to : [to],
            subject,
            template,
            messageId: result.messageId,
            priority
          })
        ]
      );

      logger.info('Email sent successfully', {
        to: Array.isArray(to) ? to : [to],
        subject,
        template,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      logger.error('Failed to send email:', error);
      
      // Log failed email attempt
      try {
        await pool.query(
          `INSERT INTO activities (activity_type, description, metadata) 
           VALUES ($1, $2, $3)`,
          [
            'email_failed',
            `Failed to send email: ${options.subject || 'Unknown'}`,
            JSON.stringify({
              to: options.to,
              subject: options.subject,
              template: options.template,
              error: error.message
            })
          ]
        );
      } catch (logError) {
        logger.error('Failed to log email error:', logError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendWelcomeEmail(user) {
    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Elite Credit Repair',
      template: 'welcome',
      data: {
        firstName: user.firstName || user.first_name,
        email: user.email
      }
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      : `#reset-password?token=${resetToken}`;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: {
        firstName: user.firstName || user.first_name,
        resetUrl
      },
      priority: 'high'
    });
  }

  async sendDisputeUpdateEmail(client, dispute) {
    const statusClasses = {
      'pending': 'pending',
      'in-progress': 'in-progress',
      'resolved': 'resolved',
      'rejected': 'rejected'
    };

    return await this.sendEmail({
      to: client.email,
      subject: `Dispute Status Update - ${dispute.item}`,
      template: 'dispute-update',
      data: {
        clientName: `${client.first_name} ${client.last_name}`,
        disputeItem: dispute.item,
        bureau: dispute.bureau,
        status: dispute.status,
        statusClass: statusClasses[dispute.status] || 'pending',
        dateCreated: new Date(dispute.created_at).toLocaleDateString(),
        disputeId: dispute.id,
        notes: dispute.notes
      }
    });
  }

  async sendNotificationEmail(user, notification) {
    return await this.sendEmail({
      to: user.email,
      subject: notification.title,
      template: 'notification',
      data: {
        subject: notification.title,
        recipientName: `${user.first_name} ${user.last_name}`,
        message: notification.message,
        priority: notification.priority,
        actionUrl: notification.action_url
      },
      priority: notification.priority === 'urgent' ? 'high' : 'normal'
    });
  }

  async sendBulkEmails(emails) {
    const results = [];
    const batchSize = 10; // Send in batches to avoid overwhelming the SMTP server

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.sendEmail(email));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map((result, index) => ({
          email: batch[index],
          success: result.status === 'fulfilled' && result.value.success,
          result: result.status === 'fulfilled' ? result.value : { error: result.reason }
        })));

        // Add delay between batches
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error('Batch email error:', error);
        results.push(...batch.map(email => ({
          email,
          success: false,
          result: { error: error.message }
        })));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info('Bulk email completed', {
      total: results.length,
      successful: successCount,
      failed: failureCount
    });

    return {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results
    };
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      await this.transporter.verify();
      return { success: true, message: 'Email connection test successful' };
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getEmailStats() {
    try {
      const statsQuery = `
        SELECT 
          activity_type,
          COUNT(*) as count,
          DATE_TRUNC('day', created_at) as date
        FROM activities 
        WHERE activity_type IN ('email_sent', 'email_failed')
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY activity_type, DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `;

      const result = await pool.query(statsQuery);
      
      const stats = result.rows.reduce((acc, row) => {
        const dateStr = row.date.toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = { sent: 0, failed: 0 };
        }
        if (row.activity_type === 'email_sent') {
          acc[dateStr].sent = parseInt(row.count);
        } else if (row.activity_type === 'email_failed') {
          acc[dateStr].failed = parseInt(row.count);
        }
        return acc;
      }, {});

      return stats;
    } catch (error) {
      logger.error('Failed to get email stats:', error);
      return {};
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;