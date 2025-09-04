const express = require('express');
const { query, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const { requireStaff } = require('../middleware/auth');

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
  transports: [new winston.transports.Console()]
});

// GET /api/analytics/dashboard - Main dashboard analytics
router.get('/dashboard', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d' } = req.query;
    
    // Convert period to days
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    // Main dashboard metrics
    const dashboardQuery = `
      WITH date_range AS (
        SELECT CURRENT_DATE - INTERVAL '${periodDays} days' as start_date,
               CURRENT_DATE as end_date
      ),
      client_metrics AS (
        SELECT 
          COUNT(*) as total_clients,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
          COUNT(CASE WHEN created_at >= (SELECT start_date FROM date_range) THEN 1 END) as new_clients
        FROM clients
      ),
      dispute_metrics AS (
        SELECT 
          COUNT(*) as total_disputes,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_disputes,
          COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_disputes,
          COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_disputes,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_disputes,
          COUNT(CASE WHEN created_at >= (SELECT start_date FROM date_range) THEN 1 END) as new_disputes,
          ROUND(AVG(CASE WHEN success_probability IS NOT NULL THEN success_probability END), 2) as avg_success_probability
        FROM disputes
      ),
      revenue_metrics AS (
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at >= (SELECT start_date FROM date_range) THEN amount ELSE 0 END), 0) as period_revenue,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
        FROM payments
        WHERE created_at >= (SELECT start_date FROM date_range)
      )
      SELECT 
        cm.*,
        dm.*,
        rm.*
      FROM client_metrics cm, dispute_metrics dm, revenue_metrics rm
    `;

    const dashboardResult = await pool.query(dashboardQuery);
    const metrics = dashboardResult.rows[0];

    // Calculate success rate
    const totalCompleted = parseInt(metrics.resolved_disputes) + parseInt(metrics.rejected_disputes);
    const successRate = totalCompleted > 0 
      ? Math.round((parseInt(metrics.resolved_disputes) / totalCompleted) * 100)
      : 0;

    // Get daily activity for the period
    const activityQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN action = 'client_created' THEN 1 END) as new_clients,
        COUNT(CASE WHEN action = 'dispute_created' THEN 1 END) as new_disputes,
        COUNT(CASE WHEN action = 'status_changed' AND description LIKE '%resolved%' THEN 1 END) as resolved_disputes
      FROM activities
      WHERE created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const activityResult = await pool.query(activityQuery);

    res.json({
      period,
      metrics: {
        clients: {
          total: parseInt(metrics.total_clients),
          active: parseInt(metrics.active_clients),
          new: parseInt(metrics.new_clients)
        },
        disputes: {
          total: parseInt(metrics.total_disputes),
          pending: parseInt(metrics.pending_disputes),
          submitted: parseInt(metrics.submitted_disputes),
          investigating: parseInt(metrics.investigating_disputes),
          resolved: parseInt(metrics.resolved_disputes),
          rejected: parseInt(metrics.rejected_disputes),
          new: parseInt(metrics.new_disputes),
          successRate,
          avgSuccessProbability: parseFloat(metrics.avg_success_probability) || 0
        },
        revenue: {
          total: parseFloat(metrics.total_revenue),
          period: parseFloat(metrics.period_revenue),
          completedPayments: parseInt(metrics.completed_payments),
          pendingPayments: parseInt(metrics.pending_payments)
        }
      },
      dailyActivity: activityResult.rows.map(row => ({
        date: row.date,
        newClients: parseInt(row.new_clients),
        newDisputes: parseInt(row.new_disputes),
        resolvedDisputes: parseInt(row.resolved_disputes)
      }))
    });

  } catch (error) {
    logger.error('Dashboard analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve dashboard analytics'
    });
  }
});

// GET /api/analytics/disputes - Detailed dispute analytics
router.get('/disputes', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
  query('bureau').optional().isIn(['Experian', 'Equifax', 'TransUnion']).withMessage('Invalid bureau')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d', bureau } = req.query;
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    let whereClause = `WHERE created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'`;
    let queryParams = [];
    
    if (bureau) {
      whereClause += ' AND bureau = $1';
      queryParams.push(bureau);
    }

    // Dispute breakdown by status
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM disputes
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `;

    // Dispute breakdown by bureau
    const bureauQuery = `
      SELECT 
        bureau,
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_disputes,
        ROUND(AVG(success_probability), 2) as avg_success_probability
      FROM disputes
      ${whereClause}
      GROUP BY bureau
      ORDER BY total_disputes DESC
    `;

    // Dispute breakdown by type
    const typeQuery = `
      SELECT 
        dispute_type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
        ROUND(COUNT(CASE WHEN status = 'resolved' THEN 1 END) * 100.0 / 
              NULLIF(COUNT(CASE WHEN status IN ('resolved', 'rejected') THEN 1 END), 0), 2) as success_rate
      FROM disputes
      ${whereClause}
      GROUP BY dispute_type
      ORDER BY count DESC
    `;

    // Monthly trend
    const trendQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
        ROUND(AVG(success_probability), 2) as avg_success_probability
      FROM disputes
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      ${bureau ? 'AND bureau = $1' : ''}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    const [statusResult, bureauResult, typeResult, trendResult] = await Promise.all([
      pool.query(statusQuery, queryParams),
      pool.query(bureauQuery, queryParams),
      pool.query(typeQuery, queryParams),
      pool.query(trendQuery, bureau ? [bureau] : [])
    ]);

    res.json({
      period,
      bureau: bureau || 'all',
      statusBreakdown: statusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage)
      })),
      bureauBreakdown: bureauResult.rows.map(row => {
        const totalCompleted = parseInt(row.resolved_disputes) + parseInt(row.rejected_disputes);
        const successRate = totalCompleted > 0 
          ? Math.round((parseInt(row.resolved_disputes) / totalCompleted) * 100)
          : 0;
        
        return {
          bureau: row.bureau,
          totalDisputes: parseInt(row.total_disputes),
          resolvedDisputes: parseInt(row.resolved_disputes),
          rejectedDisputes: parseInt(row.rejected_disputes),
          successRate,
          avgSuccessProbability: parseFloat(row.avg_success_probability) || 0
        };
      }),
      typeBreakdown: typeResult.rows.map(row => ({
        disputeType: row.dispute_type,
        count: parseInt(row.count),
        resolvedCount: parseInt(row.resolved_count),
        successRate: parseFloat(row.success_rate) || 0
      })),
      monthlyTrend: trendResult.rows.map(row => ({
        month: row.month,
        totalDisputes: parseInt(row.total_disputes),
        resolvedDisputes: parseInt(row.resolved_disputes),
        avgSuccessProbability: parseFloat(row.avg_success_probability) || 0
      }))
    });

  } catch (error) {
    logger.error('Dispute analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve dispute analytics'
    });
  }
});

// GET /api/analytics/clients - Client analytics
router.get('/clients', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d' } = req.query;
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    // Client acquisition and retention metrics
    const clientMetricsQuery = `
      WITH client_stats AS (
        SELECT 
          c.id,
          c.created_at,
          c.status,
          COUNT(d.id) as total_disputes,
          COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes,
          MAX(d.created_at) as last_dispute_date,
          COALESCE(SUM(p.amount), 0) as total_paid
        FROM clients c
        LEFT JOIN disputes d ON c.id = d.client_id
        LEFT JOIN payments p ON c.id = p.client_id AND p.status = 'completed'
        WHERE c.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
        GROUP BY c.id, c.created_at, c.status
      )
      SELECT 
        COUNT(*) as total_new_clients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
        COUNT(CASE WHEN total_disputes > 0 THEN 1 END) as clients_with_disputes,
        ROUND(AVG(total_disputes), 2) as avg_disputes_per_client,
        ROUND(AVG(total_paid), 2) as avg_revenue_per_client,
        COUNT(CASE WHEN last_dispute_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recently_active_clients
      FROM client_stats
    `;

    // Client acquisition by month
    const acquisitionQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_clients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients
      FROM clients
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    // Top clients by disputes and revenue
    const topClientsQuery = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(d.id) as total_disputes,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM clients c
      LEFT JOIN disputes d ON c.id = d.client_id
      LEFT JOIN payments p ON c.id = p.client_id AND p.status = 'completed'
      WHERE c.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
      GROUP BY c.id, c.first_name, c.last_name, c.email
      HAVING COUNT(d.id) > 0
      ORDER BY total_revenue DESC, total_disputes DESC
      LIMIT 10
    `;

    const [metricsResult, acquisitionResult, topClientsResult] = await Promise.all([
      pool.query(clientMetricsQuery),
      pool.query(acquisitionQuery),
      pool.query(topClientsQuery)
    ]);

    const metrics = metricsResult.rows[0];

    res.json({
      period,
      metrics: {
        totalNewClients: parseInt(metrics.total_new_clients),
        activeClients: parseInt(metrics.active_clients),
        clientsWithDisputes: parseInt(metrics.clients_with_disputes),
        avgDisputesPerClient: parseFloat(metrics.avg_disputes_per_client),
        avgRevenuePerClient: parseFloat(metrics.avg_revenue_per_client),
        recentlyActiveClients: parseInt(metrics.recently_active_clients)
      },
      monthlyAcquisition: acquisitionResult.rows.map(row => ({
        month: row.month,
        newClients: parseInt(row.new_clients),
        activeClients: parseInt(row.active_clients)
      })),
      topClients: topClientsResult.rows.map(row => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        totalDisputes: parseInt(row.total_disputes),
        resolvedDisputes: parseInt(row.resolved_disputes),
        totalRevenue: parseFloat(row.total_revenue)
      }))
    });

  } catch (error) {
    logger.error('Client analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve client analytics'
    });
  }
});

// GET /api/analytics/revenue - Revenue analytics
router.get('/revenue', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d' } = req.query;
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    // Revenue metrics
    const revenueMetricsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END), 0) as failed_revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        ROUND(AVG(CASE WHEN status = 'completed' THEN amount END), 2) as avg_payment_amount
      FROM payments
      WHERE created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
    `;

    // Monthly revenue trend
    const monthlyRevenueQuery = `
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as payment_count
      FROM payments
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
      LIMIT 12
    `;

    // Revenue by subscription plan
    const subscriptionRevenueQuery = `
      SELECT 
        s.plan_name,
        COUNT(s.id) as active_subscriptions,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM subscriptions s
      LEFT JOIN payments p ON s.client_id = p.client_id 
        AND p.status = 'completed'
        AND p.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
      WHERE s.status = 'active'
      GROUP BY s.plan_name
      ORDER BY total_revenue DESC
    `;

    const [metricsResult, monthlyResult, subscriptionResult] = await Promise.all([
      pool.query(revenueMetricsQuery),
      pool.query(monthlyRevenueQuery),
      pool.query(subscriptionRevenueQuery)
    ]);

    const metrics = metricsResult.rows[0];

    res.json({
      period,
      metrics: {
        totalRevenue: parseFloat(metrics.total_revenue),
        pendingRevenue: parseFloat(metrics.pending_revenue),
        failedRevenue: parseFloat(metrics.failed_revenue),
        completedPayments: parseInt(metrics.completed_payments),
        pendingPayments: parseInt(metrics.pending_payments),
        failedPayments: parseInt(metrics.failed_payments),
        avgPaymentAmount: parseFloat(metrics.avg_payment_amount) || 0
      },
      monthlyRevenue: monthlyResult.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        paymentCount: parseInt(row.payment_count)
      })),
      subscriptionRevenue: subscriptionResult.rows.map(row => ({
        planName: row.plan_name,
        activeSubscriptions: parseInt(row.active_subscriptions),
        totalRevenue: parseFloat(row.total_revenue)
      }))
    });

  } catch (error) {
    logger.error('Revenue analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve revenue analytics'
    });
  }
});

// GET /api/analytics/performance - Performance metrics
router.get('/performance', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { period = '30d' } = req.query;
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    // Performance metrics
    const performanceQuery = `
      WITH dispute_performance AS (
        SELECT 
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_resolution_days,
          COUNT(CASE WHEN status = 'resolved' AND updated_at - created_at <= INTERVAL '30 days' THEN 1 END) as quick_resolutions,
          COUNT(CASE WHEN status IN ('resolved', 'rejected') THEN 1 END) as total_completed
        FROM disputes
        WHERE created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
      ),
      user_performance AS (
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          COUNT(a.id) as total_activities,
          COUNT(CASE WHEN a.action = 'dispute_created' THEN 1 END) as disputes_created,
          COUNT(CASE WHEN a.action = 'status_changed' AND a.description LIKE '%resolved%' THEN 1 END) as disputes_resolved
        FROM users u
        LEFT JOIN activities a ON u.id = a.user_id
          AND a.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
        WHERE u.role IN ('admin', 'manager', 'staff')
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY disputes_resolved DESC, total_activities DESC
        LIMIT 10
      )
      SELECT 
        dp.*,
        (SELECT json_agg(up.*) FROM user_performance up) as user_performance
      FROM dispute_performance dp
    `;

    const result = await pool.query(performanceQuery);
    const data = result.rows[0];

    const quickResolutionRate = data.total_completed > 0 
      ? Math.round((data.quick_resolutions / data.total_completed) * 100)
      : 0;

    res.json({
      period,
      performance: {
        avgResolutionDays: Math.round(parseFloat(data.avg_resolution_days) || 0),
        quickResolutions: parseInt(data.quick_resolutions),
        totalCompleted: parseInt(data.total_completed),
        quickResolutionRate
      },
      userPerformance: (data.user_performance || []).map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        totalActivities: parseInt(user.total_activities),
        disputesCreated: parseInt(user.disputes_created),
        disputesResolved: parseInt(user.disputes_resolved)
      }))
    });

  } catch (error) {
    logger.error('Performance analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to retrieve performance analytics'
    });
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', [
  query('type').isIn(['disputes', 'clients', 'revenue', 'performance']).withMessage('Invalid export type'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type, format = 'json', period = '30d' } = req.query;
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period];

    let query, filename;

    switch (type) {
      case 'disputes':
        query = `
          SELECT 
            d.id, d.bureau, d.account_name, d.dispute_type, d.status,
            d.success_probability, d.created_at, d.updated_at,
            c.first_name, c.last_name, c.email
          FROM disputes d
          INNER JOIN clients c ON d.client_id = c.id
          WHERE d.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
          ORDER BY d.created_at DESC
        `;
        filename = `disputes_${period}_${Date.now()}`;
        break;

      case 'clients':
        query = `
          SELECT 
            c.id, c.first_name, c.last_name, c.email, c.phone, c.status,
            c.created_at, COUNT(d.id) as total_disputes,
            COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes
          FROM clients c
          LEFT JOIN disputes d ON c.id = d.client_id
          WHERE c.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
          GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.status, c.created_at
          ORDER BY c.created_at DESC
        `;
        filename = `clients_${period}_${Date.now()}`;
        break;

      case 'revenue':
        query = `
          SELECT 
            p.id, p.amount, p.status, p.payment_method, p.created_at,
            c.first_name, c.last_name, c.email
          FROM payments p
          INNER JOIN clients c ON p.client_id = c.id
          WHERE p.created_at >= CURRENT_DATE - INTERVAL '${periodDays} days'
          ORDER BY p.created_at DESC
        `;
        filename = `revenue_${period}_${Date.now()}`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const result = await pool.query(query);
    const data = result.rows;

    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return res.status(404).json({ error: 'No data found for export' });
      }

      const headers = Object.keys(data[0]).join(',');
      const csvData = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      ).join('\n');

      const csv = `${headers}\n${csvData}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        exportType: type,
        period,
        exportedAt: new Date().toISOString(),
        totalRecords: data.length,
        data
      });
    }

    logger.info('Analytics data exported', {
      type,
      format,
      period,
      recordCount: data.length,
      userId: req.user?.id
    });

  } catch (error) {
    logger.error('Export analytics error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to export analytics data'
    });
  }
});

module.exports = router;