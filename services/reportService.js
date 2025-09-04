const { Pool } = require('pg');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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
    new winston.transports.File({ filename: 'logs/reports.log' })
  ]
});

class ReportService {
  constructor() {
    this.initialized = false;
    this.reportsPath = process.env.REPORTS_PATH || './reports';
    
    this.reportTypes = {
      CLIENT_SUMMARY: 'client_summary',
      DISPUTE_ANALYSIS: 'dispute_analysis',
      PAYMENT_REPORT: 'payment_report',
      CREDIT_SCORE_TRENDS: 'credit_score_trends',
      BUSINESS_ANALYTICS: 'business_analytics',
      USER_ACTIVITY: 'user_activity',
      DOCUMENT_SUMMARY: 'document_summary',
      SUBSCRIPTION_REPORT: 'subscription_report'
    };

    this.formats = {
      PDF: 'pdf',
      EXCEL: 'excel',
      CSV: 'csv',
      JSON: 'json'
    };
  }

  async initialize() {
    try {
      // Create reports directory
      await this.createReportsDirectory();
      
      this.initialized = true;
      logger.info('Report service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize report service:', error);
      return false;
    }
  }

  async createReportsDirectory() {
    try {
      await fs.access(this.reportsPath);
    } catch {
      await fs.mkdir(this.reportsPath, { recursive: true });
      logger.info(`Created reports directory: ${this.reportsPath}`);
    }
  }

  async generateClientSummaryReport(options = {}) {
    try {
      const {
        clientId = null,
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        format = this.formats.JSON
      } = options;

      let query = `
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.status,
          c.created_at,
          COUNT(DISTINCT d.id) as total_disputes,
          COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes,
          COUNT(DISTINCT CASE WHEN d.status = 'pending' THEN d.id END) as pending_disputes,
          COUNT(DISTINCT p.id) as total_payments,
          COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0) as total_paid,
          COUNT(DISTINCT doc.id) as total_documents,
          AVG(cr.credit_score) as avg_credit_score,
          MAX(cr.credit_score) as max_credit_score,
          MIN(cr.credit_score) as min_credit_score
        FROM clients c
        LEFT JOIN disputes d ON c.id = d.client_id
        LEFT JOIN payments p ON c.id = p.client_id
        LEFT JOIN documents doc ON c.id = doc.client_id
        LEFT JOIN credit_reports cr ON c.id = cr.client_id
        WHERE c.created_at >= $1 AND c.created_at <= $2
      `;

      const params = [startDate, endDate];
      let paramCount = 2;

      if (clientId) {
        paramCount++;
        query += ` AND c.id = $${paramCount}`;
        params.push(clientId);
      }

      query += `
        GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.status, c.created_at
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, params);
      const reportData = result.rows;

      // Add summary statistics
      const summary = {
        totalClients: reportData.length,
        totalDisputes: reportData.reduce((sum, client) => sum + parseInt(client.total_disputes), 0),
        totalResolvedDisputes: reportData.reduce((sum, client) => sum + parseInt(client.resolved_disputes), 0),
        totalRevenue: reportData.reduce((sum, client) => sum + parseFloat(client.total_paid || 0), 0),
        averageCreditScore: reportData.reduce((sum, client, index, array) => {
          const score = parseFloat(client.avg_credit_score || 0);
          return sum + score / array.length;
        }, 0),
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate }
      };

      const report = {
        type: this.reportTypes.CLIENT_SUMMARY,
        summary,
        data: reportData
      };

      // Generate file based on format
      const filename = await this.saveReport(report, format, 'client_summary');

      logger.info('Client summary report generated', {
        clientCount: reportData.length,
        format,
        filename
      });

      return {
        success: true,
        report,
        filename,
        summary
      };

    } catch (error) {
      logger.error('Failed to generate client summary report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateDisputeAnalysisReport(options = {}) {
    try {
      const {
        clientId = null,
        bureau = null,
        status = null,
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        format = this.formats.JSON
      } = options;

      let query = `
        SELECT 
          d.id,
          d.client_id,
          c.first_name || ' ' || c.last_name as client_name,
          d.bureau,
          d.item,
          d.status,
          d.dispute_reason,
          d.created_at,
          d.updated_at,
          d.resolved_at,
          CASE 
            WHEN d.resolved_at IS NOT NULL 
            THEN EXTRACT(DAYS FROM (d.resolved_at - d.created_at))
            ELSE EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - d.created_at))
          END as days_to_resolution,
          COUNT(l.id) as letters_sent,
          COUNT(DISTINCT cr.id) as credit_reports_count
        FROM disputes d
        JOIN clients c ON d.client_id = c.id
        LEFT JOIN letters l ON d.id = l.dispute_id
        LEFT JOIN credit_reports cr ON d.client_id = cr.client_id AND cr.bureau = d.bureau
        WHERE d.created_at >= $1 AND d.created_at <= $2
      `;

      const params = [startDate, endDate];
      let paramCount = 2;

      if (clientId) {
        paramCount++;
        query += ` AND d.client_id = $${paramCount}`;
        params.push(clientId);
      }

      if (bureau) {
        paramCount++;
        query += ` AND d.bureau = $${paramCount}`;
        params.push(bureau);
      }

      if (status) {
        paramCount++;
        query += ` AND d.status = $${paramCount}`;
        params.push(status);
      }

      query += `
        GROUP BY d.id, d.client_id, c.first_name, c.last_name, d.bureau, d.item, 
                 d.status, d.dispute_reason, d.created_at, d.updated_at, d.resolved_at
        ORDER BY d.created_at DESC
      `;

      const result = await pool.query(query, params);
      const reportData = result.rows;

      // Calculate analytics
      const analytics = {
        totalDisputes: reportData.length,
        disputesByStatus: this.groupBy(reportData, 'status'),
        disputesByBureau: this.groupBy(reportData, 'bureau'),
        averageResolutionTime: this.calculateAverage(reportData, 'days_to_resolution'),
        successRate: reportData.filter(d => d.status === 'resolved').length / reportData.length * 100,
        monthlyTrends: this.calculateMonthlyTrends(reportData, 'created_at')
      };

      const report = {
        type: this.reportTypes.DISPUTE_ANALYSIS,
        analytics,
        data: reportData,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate }
      };

      const filename = await this.saveReport(report, format, 'dispute_analysis');

      logger.info('Dispute analysis report generated', {
        disputeCount: reportData.length,
        format,
        filename
      });

      return {
        success: true,
        report,
        filename,
        analytics
      };

    } catch (error) {
      logger.error('Failed to generate dispute analysis report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generatePaymentReport(options = {}) {
    try {
      const {
        clientId = null,
        paymentMethod = null,
        status = null,
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        format = this.formats.JSON
      } = options;

      let query = `
        SELECT 
          p.id,
          p.client_id,
          c.first_name || ' ' || c.last_name as client_name,
          p.amount,
          p.currency,
          p.payment_method,
          p.status,
          p.transaction_id,
          p.description,
          p.created_at,
          p.processed_at,
          r.amount as refunded_amount,
          r.reason as refund_reason
        FROM payments p
        JOIN clients c ON p.client_id = c.id
        LEFT JOIN refunds r ON p.id = r.payment_id
        WHERE p.created_at >= $1 AND p.created_at <= $2
      `;

      const params = [startDate, endDate];
      let paramCount = 2;

      if (clientId) {
        paramCount++;
        query += ` AND p.client_id = $${paramCount}`;
        params.push(clientId);
      }

      if (paymentMethod) {
        paramCount++;
        query += ` AND p.payment_method = $${paramCount}`;
        params.push(paymentMethod);
      }

      if (status) {
        paramCount++;
        query += ` AND p.status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY p.created_at DESC';

      const result = await pool.query(query, params);
      const reportData = result.rows;

      // Calculate financial metrics
      const metrics = {
        totalPayments: reportData.length,
        totalRevenue: reportData.reduce((sum, p) => sum + (p.status === 'completed' ? parseFloat(p.amount) : 0), 0),
        totalRefunds: reportData.reduce((sum, p) => sum + parseFloat(p.refunded_amount || 0), 0),
        netRevenue: 0,
        paymentsByMethod: this.groupBy(reportData, 'payment_method'),
        paymentsByStatus: this.groupBy(reportData, 'status'),
        averagePayment: this.calculateAverage(reportData.filter(p => p.status === 'completed'), 'amount'),
        monthlyRevenue: this.calculateMonthlyRevenue(reportData)
      };

      metrics.netRevenue = metrics.totalRevenue - metrics.totalRefunds;

      const report = {
        type: this.reportTypes.PAYMENT_REPORT,
        metrics,
        data: reportData,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate }
      };

      const filename = await this.saveReport(report, format, 'payment_report');

      logger.info('Payment report generated', {
        paymentCount: reportData.length,
        totalRevenue: metrics.totalRevenue,
        format,
        filename
      });

      return {
        success: true,
        report,
        filename,
        metrics
      };

    } catch (error) {
      logger.error('Failed to generate payment report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateCreditScoreTrendsReport(options = {}) {
    try {
      const {
        clientId = null,
        bureau = null,
        startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        format = this.formats.JSON
      } = options;

      let query = `
        SELECT 
          cr.id,
          cr.client_id,
          c.first_name || ' ' || c.last_name as client_name,
          cr.bureau,
          cr.credit_score,
          cr.report_date,
          cr.created_at,
          LAG(cr.credit_score) OVER (PARTITION BY cr.client_id, cr.bureau ORDER BY cr.report_date) as previous_score,
          cr.credit_score - LAG(cr.credit_score) OVER (PARTITION BY cr.client_id, cr.bureau ORDER BY cr.report_date) as score_change
        FROM credit_reports cr
        JOIN clients c ON cr.client_id = c.id
        WHERE cr.report_date >= $1 AND cr.report_date <= $2
      `;

      const params = [startDate, endDate];
      let paramCount = 2;

      if (clientId) {
        paramCount++;
        query += ` AND cr.client_id = $${paramCount}`;
        params.push(clientId);
      }

      if (bureau) {
        paramCount++;
        query += ` AND cr.bureau = $${paramCount}`;
        params.push(bureau);
      }

      query += ' ORDER BY cr.client_id, cr.bureau, cr.report_date';

      const result = await pool.query(query, params);
      const reportData = result.rows;

      // Calculate trends
      const trends = {
        totalReports: reportData.length,
        averageScore: this.calculateAverage(reportData, 'credit_score'),
        scoreDistribution: this.calculateScoreDistribution(reportData),
        improvementRate: this.calculateImprovementRate(reportData),
        averageImprovement: this.calculateAverage(reportData.filter(r => r.score_change > 0), 'score_change'),
        trendsByBureau: this.calculateTrendsByBureau(reportData),
        monthlyAverages: this.calculateMonthlyScoreAverages(reportData)
      };

      const report = {
        type: this.reportTypes.CREDIT_SCORE_TRENDS,
        trends,
        data: reportData,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate }
      };

      const filename = await this.saveReport(report, format, 'credit_score_trends');

      logger.info('Credit score trends report generated', {
        reportCount: reportData.length,
        averageScore: trends.averageScore,
        format,
        filename
      });

      return {
        success: true,
        report,
        filename,
        trends
      };

    } catch (error) {
      logger.error('Failed to generate credit score trends report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateBusinessAnalyticsReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        format = this.formats.JSON
      } = options;

      // Get comprehensive business metrics
      const queries = {
        clients: `
          SELECT 
            COUNT(*) as total_clients,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
            COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_clients
          FROM clients
        `,
        disputes: `
          SELECT 
            COUNT(*) as total_disputes,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
            COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_disputes,
            AVG(EXTRACT(DAYS FROM (COALESCE(resolved_at, CURRENT_TIMESTAMP) - created_at))) as avg_resolution_days
          FROM disputes
        `,
        payments: `
          SELECT 
            COUNT(*) as total_payments,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
            COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_payments,
            AVG(CASE WHEN status = 'completed' THEN amount END) as avg_payment
          FROM payments
        `,
        subscriptions: `
          SELECT 
            COUNT(*) as total_subscriptions,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
            COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_subscriptions,
            SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END) as monthly_recurring_revenue
          FROM subscriptions
        `,
        users: `
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
            COUNT(CASE WHEN last_login >= $1 THEN 1 END) as recent_active_users
          FROM users
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await pool.query(query, [startDate]);
        results[key] = result.rows[0];
      }

      // Calculate KPIs
      const kpis = {
        customerAcquisitionRate: (parseInt(results.clients.new_clients) / parseInt(results.clients.total_clients)) * 100,
        disputeSuccessRate: (parseInt(results.disputes.resolved_disputes) / parseInt(results.disputes.total_disputes)) * 100,
        averageRevenuePerClient: parseFloat(results.payments.total_revenue) / parseInt(results.clients.active_clients),
        subscriptionGrowthRate: (parseInt(results.subscriptions.new_subscriptions) / parseInt(results.subscriptions.total_subscriptions)) * 100,
        userEngagementRate: (parseInt(results.users.recent_active_users) / parseInt(results.users.active_users)) * 100
      };

      const report = {
        type: this.reportTypes.BUSINESS_ANALYTICS,
        kpis,
        metrics: results,
        generatedAt: new Date().toISOString(),
        dateRange: { startDate, endDate }
      };

      const filename = await this.saveReport(report, format, 'business_analytics');

      logger.info('Business analytics report generated', {
        totalRevenue: results.payments.total_revenue,
        activeClients: results.clients.active_clients,
        format,
        filename
      });

      return {
        success: true,
        report,
        filename,
        kpis
      };

    } catch (error) {
      logger.error('Failed to generate business analytics report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveReport(report, format, reportName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportName}_${timestamp}.${format}`;
    const filepath = path.join(this.reportsPath, filename);

    try {
      switch (format) {
        case this.formats.JSON:
          await fs.writeFile(filepath, JSON.stringify(report, null, 2));
          break;
        case this.formats.CSV:
          await this.saveAsCSV(report, filepath);
          break;
        case this.formats.EXCEL:
          await this.saveAsExcel(report, filepath);
          break;
        case this.formats.PDF:
          await this.saveAsPDF(report, filepath);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return filename;
    } catch (error) {
      logger.error('Failed to save report:', error);
      throw error;
    }
  }

  async saveAsCSV(report, filepath) {
    if (!report.data || !Array.isArray(report.data)) {
      throw new Error('Report data must be an array for CSV export');
    }

    const data = report.data;
    if (data.length === 0) {
      await fs.writeFile(filepath, 'No data available');
      return;
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    await fs.writeFile(filepath, csvContent);
  }

  async saveAsExcel(report, filepath) {
    const workbook = new ExcelJS.Workbook();
    
    // Add summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Report Type', report.type]);
    summarySheet.addRow(['Generated At', report.generatedAt]);
    
    if (report.summary) {
      summarySheet.addRow([]);
      summarySheet.addRow(['Summary']);
      Object.entries(report.summary).forEach(([key, value]) => {
        summarySheet.addRow([key, value]);
      });
    }

    // Add data sheet
    if (report.data && Array.isArray(report.data) && report.data.length > 0) {
      const dataSheet = workbook.addWorksheet('Data');
      const headers = Object.keys(report.data[0]);
      dataSheet.addRow(headers);
      
      report.data.forEach(row => {
        dataSheet.addRow(headers.map(header => row[header]));
      });
    }

    await workbook.xlsx.writeFile(filepath);
  }

  async saveAsPDF(report, filepath) {
    const doc = new PDFDocument();
    doc.pipe(require('fs').createWriteStream(filepath));

    // Add title
    doc.fontSize(20).text(report.type.replace(/_/g, ' ').toUpperCase(), 50, 50);
    doc.fontSize(12).text(`Generated: ${report.generatedAt}`, 50, 80);

    let yPosition = 120;

    // Add summary if available
    if (report.summary) {
      doc.fontSize(16).text('Summary', 50, yPosition);
      yPosition += 30;
      
      Object.entries(report.summary).forEach(([key, value]) => {
        doc.fontSize(10).text(`${key}: ${value}`, 50, yPosition);
        yPosition += 15;
      });
      yPosition += 20;
    }

    // Add data preview (first 20 rows)
    if (report.data && Array.isArray(report.data) && report.data.length > 0) {
      doc.fontSize(16).text('Data Preview', 50, yPosition);
      yPosition += 30;
      
      const previewData = report.data.slice(0, 20);
      previewData.forEach((row, index) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.fontSize(8).text(`Row ${index + 1}: ${JSON.stringify(row)}`, 50, yPosition, {
          width: 500,
          ellipsis: true
        });
        yPosition += 20;
      });
    }

    doc.end();
  }

  // Helper methods for calculations
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'Unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  calculateAverage(array, key) {
    if (array.length === 0) return 0;
    const sum = array.reduce((total, item) => total + (parseFloat(item[key]) || 0), 0);
    return sum / array.length;
  }

  calculateMonthlyTrends(array, dateKey) {
    const monthlyData = {};
    array.forEach(item => {
      const date = new Date(item[dateKey]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    return monthlyData;
  }

  calculateMonthlyRevenue(payments) {
    const monthlyRevenue = {};
    payments.forEach(payment => {
      if (payment.status === 'completed') {
        const date = new Date(payment.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + parseFloat(payment.amount);
      }
    });
    return monthlyRevenue;
  }

  calculateScoreDistribution(reports) {
    const distribution = {
      'Poor (300-579)': 0,
      'Fair (580-669)': 0,
      'Good (670-739)': 0,
      'Very Good (740-799)': 0,
      'Excellent (800-850)': 0
    };

    reports.forEach(report => {
      const score = parseInt(report.credit_score);
      if (score >= 300 && score <= 579) distribution['Poor (300-579)']++;
      else if (score >= 580 && score <= 669) distribution['Fair (580-669)']++;
      else if (score >= 670 && score <= 739) distribution['Good (670-739)']++;
      else if (score >= 740 && score <= 799) distribution['Very Good (740-799)']++;
      else if (score >= 800 && score <= 850) distribution['Excellent (800-850)']++;
    });

    return distribution;
  }

  calculateImprovementRate(reports) {
    const reportsWithChange = reports.filter(r => r.score_change !== null);
    if (reportsWithChange.length === 0) return 0;
    
    const improved = reportsWithChange.filter(r => r.score_change > 0).length;
    return (improved / reportsWithChange.length) * 100;
  }

  calculateTrendsByBureau(reports) {
    const bureauTrends = {};
    reports.forEach(report => {
      const bureau = report.bureau;
      if (!bureauTrends[bureau]) {
        bureauTrends[bureau] = {
          totalReports: 0,
          averageScore: 0,
          averageChange: 0,
          scores: []
        };
      }
      
      bureauTrends[bureau].totalReports++;
      bureauTrends[bureau].scores.push(parseInt(report.credit_score));
      if (report.score_change !== null) {
        bureauTrends[bureau].averageChange += parseInt(report.score_change);
      }
    });

    // Calculate averages
    Object.keys(bureauTrends).forEach(bureau => {
      const trend = bureauTrends[bureau];
      trend.averageScore = trend.scores.reduce((sum, score) => sum + score, 0) / trend.scores.length;
      trend.averageChange = trend.averageChange / trend.totalReports;
      delete trend.scores; // Remove raw scores to save space
    });

    return bureauTrends;
  }

  calculateMonthlyScoreAverages(reports) {
    const monthlyAverages = {};
    reports.forEach(report => {
      const date = new Date(report.report_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyAverages[monthKey]) {
        monthlyAverages[monthKey] = {
          totalScore: 0,
          count: 0
        };
      }
      
      monthlyAverages[monthKey].totalScore += parseInt(report.credit_score);
      monthlyAverages[monthKey].count++;
    });

    // Calculate averages
    Object.keys(monthlyAverages).forEach(month => {
      const data = monthlyAverages[month];
      monthlyAverages[month] = data.totalScore / data.count;
    });

    return monthlyAverages;
  }

  async getReportHistory(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0
      } = options;

      // Get list of generated reports from filesystem
      const files = await fs.readdir(this.reportsPath);
      const reports = [];

      for (const file of files) {
        const filepath = path.join(this.reportsPath, file);
        const stats = await fs.stat(filepath);
        
        reports.push({
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          format: path.extname(file).substring(1)
        });
      }

      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const paginatedReports = reports.slice(offset, offset + limit);

      return {
        success: true,
        reports: paginatedReports,
        total: reports.length
      };

    } catch (error) {
      logger.error('Failed to get report history:', error);
      return {
        success: false,
        error: error.message,
        reports: []
      };
    }
  }

  async deleteReport(filename) {
    try {
      const filepath = path.join(this.reportsPath, filename);
      await fs.unlink(filepath);
      
      logger.info('Report deleted', { filename });
      
      return {
        success: true,
        message: 'Report deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const reportService = new ReportService();

module.exports = reportService;