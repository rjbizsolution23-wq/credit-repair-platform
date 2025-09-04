const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { Pool } = require('pg');
const winston = require('winston');
const { authenticateToken, requireStaff, requireAdmin } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 99.00,
    maxDisputes: 10,
    features: ['Basic dispute letters', 'Email support', 'Credit monitoring']
  },
  professional: {
    name: 'Professional Plan',
    price: 199.00,
    maxDisputes: 50,
    features: ['Advanced dispute letters', 'Priority support', 'Credit monitoring', 'AI insights']
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 399.00,
    maxDisputes: -1, // Unlimited
    features: ['All features', '24/7 support', 'Custom integrations', 'White-label options']
  }
};

// Validation rules
const createSubscriptionValidation = [
  body('clientId')
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  body('planType')
    .isIn(['basic', 'professional', 'enterprise'])
    .withMessage('Invalid plan type'),
  body('billingCycle')
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid billing cycle'),
  body('paymentMethodId')
    .optional()
    .isString()
    .withMessage('Payment method ID must be a string')
];

const createPaymentValidation = [
  body('clientId')
    .isUUID()
    .withMessage('Client ID must be a valid UUID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .isLength({ min: 1, max: 255 })
    .withMessage('Description is required and must be less than 255 characters'),
  body('paymentMethodId')
    .optional()
    .isString()
    .withMessage('Payment method ID must be a string')
];

/**
 * @route GET /api/billing/subscriptions
 * @desc Get all subscriptions with filtering
 * @access Private (Staff)
 */
router.get('/subscriptions',
  authenticateToken,
  requireStaff,
  [
    query('clientId')
      .optional()
      .isUUID()
      .withMessage('Client ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['active', 'cancelled', 'past_due', 'paused'])
      .withMessage('Invalid status'),
    query('planType')
      .optional()
      .isIn(['basic', 'professional', 'enterprise'])
      .withMessage('Invalid plan type'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
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

      const {
        clientId,
        status,
        planType,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (clientId) {
        whereConditions.push(`s.client_id = $${paramIndex}`);
        queryParams.push(clientId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`s.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (planType) {
        whereConditions.push(`s.plan_type = $${paramIndex}`);
        queryParams.push(planType);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM subscriptions s
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const totalSubscriptions = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalSubscriptions / limit);

      // Get subscriptions
      const subscriptionsQuery = `
        SELECT 
          s.*,
          c.first_name,
          c.last_name,
          c.email,
          COUNT(p.id) as payment_count,
          SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_paid
        FROM subscriptions s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN payments p ON s.client_id = p.client_id
        ${whereClause}
        GROUP BY s.id, c.first_name, c.last_name, c.email
        ORDER BY s.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const subscriptionsResult = await pool.query(subscriptionsQuery, queryParams);

      const subscriptions = subscriptionsResult.rows.map(sub => ({
        id: sub.id,
        clientId: sub.client_id,
        planType: sub.plan_type,
        planName: SUBSCRIPTION_PLANS[sub.plan_type]?.name || sub.plan_type,
        status: sub.status,
        billingCycle: sub.billing_cycle,
        amount: parseFloat(sub.amount),
        nextBillingDate: sub.next_billing_date,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
        client: {
          name: `${sub.first_name} ${sub.last_name}`,
          email: sub.email
        },
        paymentStats: {
          paymentCount: parseInt(sub.payment_count),
          totalPaid: parseFloat(sub.total_paid || 0)
        }
      }));

      res.json({
        success: true,
        data: {
          subscriptions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalSubscriptions,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get subscriptions error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscriptions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/billing/subscriptions
 * @desc Create new subscription
 * @access Private (Staff)
 */
router.post('/subscriptions',
  authenticateToken,
  requireStaff,
  createSubscriptionValidation,
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
        planType,
        billingCycle,
        paymentMethodId
      } = req.body;

      // Verify client exists
      const clientCheck = await pool.query(
        'SELECT id, first_name, last_name, email FROM clients WHERE id = $1 AND status != $2',
        [clientId, 'deleted']
      );
      
      if (clientCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const client = clientCheck.rows[0];

      // Check for existing active subscription
      const existingSubscription = await pool.query(
        'SELECT id FROM subscriptions WHERE client_id = $1 AND status = $2',
        [clientId, 'active']
      );

      if (existingSubscription.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Client already has an active subscription'
        });
      }

      // Calculate amount based on plan and billing cycle
      const basePlan = SUBSCRIPTION_PLANS[planType];
      if (!basePlan) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan type'
        });
      }

      let amount = basePlan.price;
      let nextBillingDate = new Date();

      // Apply billing cycle multipliers and calculate next billing date
      switch (billingCycle) {
        case 'monthly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case 'quarterly':
          amount *= 3 * 0.95; // 5% discount for quarterly
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'yearly':
          amount *= 12 * 0.85; // 15% discount for yearly
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }

      const dbClient = await pool.connect();

      try {
        await dbClient.query('BEGIN');

        // Create subscription
        const subscriptionQuery = `
          INSERT INTO subscriptions (
            client_id, plan_type, status, billing_cycle, 
            amount, next_billing_date, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const subscriptionResult = await dbClient.query(subscriptionQuery, [
          clientId,
          planType,
          'active',
          billingCycle,
          amount,
          nextBillingDate,
          req.user.id
        ]);

        const subscription = subscriptionResult.rows[0];

        // Create Stripe customer if payment method provided
        let stripeCustomerId = null;
        if (paymentMethodId) {
          try {
            const stripeCustomer = await stripe.customers.create({
              email: client.email,
              name: `${client.first_name} ${client.last_name}`,
              payment_method: paymentMethodId,
              invoice_settings: {
                default_payment_method: paymentMethodId
              },
              metadata: {
                clientId: clientId,
                subscriptionId: subscription.id
              }
            });

            stripeCustomerId = stripeCustomer.id;

            // Update subscription with Stripe customer ID
            await dbClient.query(
              'UPDATE subscriptions SET stripe_customer_id = $1 WHERE id = $2',
              [stripeCustomerId, subscription.id]
            );

          } catch (stripeError) {
            logger.error('Stripe customer creation error', {
              error: stripeError.message,
              clientId,
              subscriptionId: subscription.id
            });
            // Continue without Stripe integration
          }
        }

        // Log activity
        await dbClient.query(
          `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            clientId,
            req.user.id,
            'subscription_created',
            `Subscription created: ${basePlan.name} (${billingCycle})`,
            JSON.stringify({
              subscriptionId: subscription.id,
              planType,
              billingCycle,
              amount,
              stripeCustomerId
            })
          ]
        );

        await dbClient.query('COMMIT');

        logger.info('Subscription created successfully', {
          subscriptionId: subscription.id,
          clientId,
          planType,
          billingCycle,
          amount,
          createdBy: req.user.id
        });

        res.status(201).json({
          success: true,
          message: 'Subscription created successfully',
          data: {
            subscription: {
              id: subscription.id,
              clientId: subscription.client_id,
              planType: subscription.plan_type,
              planName: basePlan.name,
              status: subscription.status,
              billingCycle: subscription.billing_cycle,
              amount: parseFloat(subscription.amount),
              nextBillingDate: subscription.next_billing_date,
              createdAt: subscription.created_at,
              features: basePlan.features
            }
          }
        });

      } catch (dbError) {
        await dbClient.query('ROLLBACK');
        throw dbError;
      } finally {
        dbClient.release();
      }

    } catch (error) {
      logger.error('Create subscription error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route PUT /api/billing/subscriptions/:id/status
 * @desc Update subscription status
 * @access Private (Staff)
 */
router.put('/subscriptions/:id/status',
  authenticateToken,
  requireStaff,
  [
    param('id')
      .isUUID()
      .withMessage('Subscription ID must be a valid UUID'),
    body('status')
      .isIn(['active', 'cancelled', 'past_due', 'paused'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Reason must be less than 255 characters')
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
      const { status, reason } = req.body;

      // Check if subscription exists
      const existingSubscription = await pool.query(
        'SELECT * FROM subscriptions WHERE id = $1',
        [id]
      );

      if (existingSubscription.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }

      const subscription = existingSubscription.rows[0];

      // Update subscription status
      const updateQuery = `
        UPDATE subscriptions 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [status, id]);
      const updatedSubscription = result.rows[0];

      // Log activity
      await pool.query(
        `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          subscription.client_id,
          req.user.id,
          'subscription_status_changed',
          `Subscription status changed from ${subscription.status} to ${status}${reason ? `: ${reason}` : ''}`,
          JSON.stringify({
            subscriptionId: id,
            oldStatus: subscription.status,
            newStatus: status,
            reason
          })
        ]
      );

      logger.info('Subscription status updated', {
        subscriptionId: id,
        oldStatus: subscription.status,
        newStatus: status,
        reason,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Subscription status updated successfully',
        data: {
          subscription: {
            id: updatedSubscription.id,
            status: updatedSubscription.status,
            updatedAt: updatedSubscription.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Update subscription status error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        subscriptionId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update subscription status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/billing/payments
 * @desc Get payments with filtering
 * @access Private (Staff)
 */
router.get('/payments',
  authenticateToken,
  requireStaff,
  [
    query('clientId')
      .optional()
      .isUUID()
      .withMessage('Client ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['pending', 'completed', 'failed', 'refunded'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
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

      const {
        clientId,
        status,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (clientId) {
        whereConditions.push(`p.client_id = $${paramIndex}`);
        queryParams.push(clientId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`p.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM payments p
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, queryParams);
      const totalPayments = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalPayments / limit);

      // Get payments
      const paymentsQuery = `
        SELECT 
          p.*,
          c.first_name,
          c.last_name,
          c.email
        FROM payments p
        LEFT JOIN clients c ON p.client_id = c.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      const paymentsResult = await pool.query(paymentsQuery, queryParams);

      const payments = paymentsResult.rows.map(payment => ({
        id: payment.id,
        clientId: payment.client_id,
        amount: parseFloat(payment.amount),
        status: payment.status,
        paymentMethod: payment.payment_method,
        transactionId: payment.transaction_id,
        description: payment.description,
        processedAt: payment.processed_at,
        createdAt: payment.created_at,
        client: payment.client_id ? {
          name: `${payment.first_name} ${payment.last_name}`,
          email: payment.email
        } : null
      }));

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalPayments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Get payments error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve payments',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/billing/payments
 * @desc Process new payment
 * @access Private (Staff)
 */
router.post('/payments',
  authenticateToken,
  requireStaff,
  createPaymentValidation,
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
        amount,
        description,
        paymentMethodId
      } = req.body;

      // Verify client exists
      const clientCheck = await pool.query(
        'SELECT id, first_name, last_name, email FROM clients WHERE id = $1 AND status != $2',
        [clientId, 'deleted']
      );
      
      if (clientCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      const client = clientCheck.rows[0];
      let paymentStatus = 'pending';
      let transactionId = null;
      let paymentMethod = 'manual';

      // Process payment through Stripe if payment method provided
      if (paymentMethodId) {
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirm: true,
            description: description,
            metadata: {
              clientId: clientId,
              processedBy: req.user.id
            }
          });

          if (paymentIntent.status === 'succeeded') {
            paymentStatus = 'completed';
            transactionId = paymentIntent.id;
            paymentMethod = 'stripe';
          } else {
            paymentStatus = 'failed';
          }

        } catch (stripeError) {
          logger.error('Stripe payment processing error', {
            error: stripeError.message,
            clientId,
            amount,
            paymentMethodId
          });
          
          paymentStatus = 'failed';
        }
      }

      const dbClient = await pool.connect();

      try {
        await dbClient.query('BEGIN');

        // Create payment record
        const paymentQuery = `
          INSERT INTO payments (
            client_id, amount, status, payment_method, 
            transaction_id, description, processed_at, processed_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const paymentResult = await dbClient.query(paymentQuery, [
          clientId,
          amount,
          paymentStatus,
          paymentMethod,
          transactionId,
          description,
          paymentStatus === 'completed' ? new Date() : null,
          req.user.id
        ]);

        const payment = paymentResult.rows[0];

        // Log activity
        await dbClient.query(
          `INSERT INTO activities (client_id, user_id, activity_type, description, metadata)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            clientId,
            req.user.id,
            'payment_processed',
            `Payment ${paymentStatus}: $${amount} - ${description}`,
            JSON.stringify({
              paymentId: payment.id,
              amount,
              status: paymentStatus,
              paymentMethod,
              transactionId
            })
          ]
        );

        await dbClient.query('COMMIT');

        logger.info('Payment processed', {
          paymentId: payment.id,
          clientId,
          amount,
          status: paymentStatus,
          paymentMethod,
          processedBy: req.user.id
        });

        res.status(201).json({
          success: true,
          message: `Payment ${paymentStatus} successfully`,
          data: {
            payment: {
              id: payment.id,
              clientId: payment.client_id,
              amount: parseFloat(payment.amount),
              status: payment.status,
              paymentMethod: payment.payment_method,
              transactionId: payment.transaction_id,
              description: payment.description,
              processedAt: payment.processed_at,
              createdAt: payment.created_at
            }
          }
        });

      } catch (dbError) {
        await dbClient.query('ROLLBACK');
        throw dbError;
      } finally {
        dbClient.release();
      }

    } catch (error) {
      logger.error('Process payment error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/billing/plans
 * @desc Get available subscription plans
 * @access Private (Staff)
 */
router.get('/plans',
  authenticateToken,
  requireStaff,
  async (req, res) => {
    try {
      const plans = Object.keys(SUBSCRIPTION_PLANS).map(key => ({
        type: key,
        ...SUBSCRIPTION_PLANS[key],
        pricing: {
          monthly: SUBSCRIPTION_PLANS[key].price,
          quarterly: Math.round(SUBSCRIPTION_PLANS[key].price * 3 * 0.95 * 100) / 100,
          yearly: Math.round(SUBSCRIPTION_PLANS[key].price * 12 * 0.85 * 100) / 100
        }
      }));

      res.json({
        success: true,
        data: { plans }
      });

    } catch (error) {
      logger.error('Get plans error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve plans',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/billing/analytics
 * @desc Get billing analytics
 * @access Private (Admin)
 */
router.get('/analytics',
  authenticateToken,
  requireAdmin,
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Invalid period')
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

      const { period = '30d' } = req.query;
      
      // Convert period to SQL interval
      const intervalMap = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
        '1y': '1 year'
      };
      
      const interval = intervalMap[period];

      // Revenue analytics
      const revenueQuery = `
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
          AVG(CASE WHEN status = 'completed' THEN amount END) as avg_payment_amount
        FROM payments 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
      `;

      const revenueResult = await pool.query(revenueQuery);
      const revenueStats = revenueResult.rows[0];

      // Subscription analytics
      const subscriptionQuery = `
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
          COUNT(CASE WHEN plan_type = 'basic' THEN 1 END) as basic_plans,
          COUNT(CASE WHEN plan_type = 'professional' THEN 1 END) as professional_plans,
          COUNT(CASE WHEN plan_type = 'enterprise' THEN 1 END) as enterprise_plans
        FROM subscriptions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
      `;

      const subscriptionResult = await pool.query(subscriptionQuery);
      const subscriptionStats = subscriptionResult.rows[0];

      // Monthly revenue trend
      const trendQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as payment_count
        FROM payments 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `;

      const trendResult = await pool.query(trendQuery);
      const monthlyTrend = trendResult.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue || 0),
        paymentCount: parseInt(row.payment_count)
      }));

      res.json({
        success: true,
        data: {
          revenue: {
            totalRevenue: parseFloat(revenueStats.total_revenue || 0),
            pendingRevenue: parseFloat(revenueStats.pending_revenue || 0),
            completedPayments: parseInt(revenueStats.completed_payments),
            pendingPayments: parseInt(revenueStats.pending_payments),
            failedPayments: parseInt(revenueStats.failed_payments),
            avgPaymentAmount: parseFloat(revenueStats.avg_payment_amount || 0)
          },
          subscriptions: {
            total: parseInt(subscriptionStats.total_subscriptions),
            active: parseInt(subscriptionStats.active_subscriptions),
            cancelled: parseInt(subscriptionStats.cancelled_subscriptions),
            byPlan: {
              basic: parseInt(subscriptionStats.basic_plans),
              professional: parseInt(subscriptionStats.professional_plans),
              enterprise: parseInt(subscriptionStats.enterprise_plans)
            }
          },
          trends: {
            monthly: monthlyTrend
          },
          period
        }
      });

    } catch (error) {
      logger.error('Get billing analytics error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve billing analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/billing/webhooks/stripe
 * @desc Handle Stripe webhooks
 * @access Public (Stripe)
 */
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        logger.error('Stripe webhook signature verification failed', {
          error: err.message
        });
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await handlePaymentSuccess(paymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          await handlePaymentFailure(failedPayment);
          break;
        
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          await handleInvoicePayment(invoice);
          break;
        
        default:
          logger.info('Unhandled Stripe webhook event', { type: event.type });
      }

      res.json({ received: true });

    } catch (error) {
      logger.error('Stripe webhook error', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }
);

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
  try {
    await pool.query(
      `UPDATE payments 
       SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
       WHERE transaction_id = $1`,
      [paymentIntent.id]
    );

    logger.info('Payment marked as completed via webhook', {
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    });
  } catch (error) {
    logger.error('Handle payment success error', {
      error: error.message,
      transactionId: paymentIntent.id
    });
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    await pool.query(
      `UPDATE payments 
       SET status = 'failed' 
       WHERE transaction_id = $1`,
      [paymentIntent.id]
    );

    logger.info('Payment marked as failed via webhook', {
      transactionId: paymentIntent.id,
      amount: paymentIntent.amount / 100
    });
  } catch (error) {
    logger.error('Handle payment failure error', {
      error: error.message,
      transactionId: paymentIntent.id
    });
  }
}

async function handleInvoicePayment(invoice) {
  try {
    // Handle subscription invoice payments
    const customerId = invoice.customer;
    
    // Update subscription status if needed
    await pool.query(
      `UPDATE subscriptions 
       SET status = 'active', next_billing_date = $1 
       WHERE stripe_customer_id = $2`,
      [new Date(invoice.period_end * 1000), customerId]
    );

    logger.info('Subscription updated via invoice webhook', {
      customerId,
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100
    });
  } catch (error) {
    logger.error('Handle invoice payment error', {
      error: error.message,
      invoiceId: invoice.id
    });
  }
}

module.exports = router;