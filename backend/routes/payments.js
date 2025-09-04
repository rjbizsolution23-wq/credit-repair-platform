/**
 * Rick Jefferson Solutions - Payment Routes
 * Express routes for Stripe payment processing and subscription management
 * Implements secure payment endpoints with role-based access control
 * 
 * Features:
 * - Subscription management endpoints
 * - Payment processing routes
 * - Webhook handling for Stripe events
 * - Billing history and analytics
 * - Secure authentication and authorization
 * 
 * @author Rick Jefferson Solutions Development Team
 * @version 1.0.0
 * @since 2024
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const paymentService = require('../services/paymentService');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Rate limiting for payment endpoints
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: {
    error: 'Too many payment requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Webhook rate limiting (more permissive for Stripe)
const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Allow more webhook requests
  message: {
    error: 'Webhook rate limit exceeded',
    code: 'WEBHOOK_RATE_LIMIT'
  }
});

/**
 * @route   POST /api/payments/customers
 * @desc    Create a new Stripe customer
 * @access  Private (Client, CRO, Admin)
 */
router.post('/customers',
  authMiddleware,
  roleMiddleware(['client', 'cro', 'admin']),
  paymentRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone('en-US')
      .withMessage('Valid US phone number required'),
    body('address')
      .optional()
      .isObject()
      .withMessage('Address must be an object'),
    body('address.line1')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Address line 1 is required'),
    body('address.city')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('City is required'),
    body('address.state')
      .optional()
      .trim()
      .isLength({ min: 2, max: 2 })
      .withMessage('State must be 2 characters'),
    body('address.postal_code')
      .optional()
      .isPostalCode('US')
      .withMessage('Valid US postal code required'),
    body('address.country')
      .optional()
      .equals('US')
      .withMessage('Only US addresses supported')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, name, phone, address } = req.body;
      
      // Add user context to metadata
      const metadata = {
        user_id: req.user.id,
        user_role: req.user.role,
        created_via: 'Rick Jefferson Solutions Platform',
        compliance_verified: 'true'
      };

      const customer = await paymentService.createCustomer({
        email,
        name,
        phone,
        address,
        metadata
      });

      // Log customer creation
      logger.info('Customer created via API', {
        customerId: customer.id,
        userId: req.user.id,
        email,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: {
          customerId: customer.id,
          email: customer.email,
          name: customer.name,
          created: customer.created
        }
      });
    } catch (error) {
      logger.error('Error in create customer endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/payments/subscriptions
 * @desc    Create a new subscription
 * @access  Private (Client, CRO, Admin)
 */
router.post('/subscriptions',
  authMiddleware,
  roleMiddleware(['client', 'cro', 'admin']),
  paymentRateLimit,
  [
    body('customerId')
      .trim()
      .matches(/^cus_[a-zA-Z0-9]+$/)
      .withMessage('Valid Stripe customer ID required'),
    body('planType')
      .isIn(['basic', 'professional', 'premium', 'enterprise'])
      .withMessage('Valid plan type required'),
    body('paymentMethodId')
      .trim()
      .matches(/^pm_[a-zA-Z0-9]+$/)
      .withMessage('Valid payment method ID required'),
    body('trialDays')
      .optional()
      .isInt({ min: 0, max: 30 })
      .withMessage('Trial days must be between 0 and 30'),
    body('couponCode')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invalid coupon code')
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

      const { customerId, planType, paymentMethodId, trialDays, couponCode } = req.body;
      
      // Add user context to metadata
      const metadata = {
        user_id: req.user.id,
        user_role: req.user.role,
        created_via: 'Rick Jefferson Solutions Platform',
        plan_selected: planType
      };

      const result = await paymentService.createSubscription({
        customerId,
        planType,
        paymentMethodId,
        trialDays,
        couponCode,
        metadata
      });

      logger.info('Subscription created via API', {
        subscriptionId: result.subscription.id,
        customerId,
        planType,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscriptionId: result.subscription.id,
          clientSecret: result.clientSecret,
          plan: result.plan,
          status: result.subscription.status,
          currentPeriodEnd: result.subscription.current_period_end
        }
      });
    } catch (error) {
      logger.error('Error in create subscription endpoint', {
        error: error.message,
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
 * @route   PUT /api/payments/subscriptions/:subscriptionId
 * @desc    Update an existing subscription
 * @access  Private (Client, CRO, Admin)
 */
router.put('/subscriptions/:subscriptionId',
  authMiddleware,
  roleMiddleware(['client', 'cro', 'admin']),
  paymentRateLimit,
  [
    param('subscriptionId')
      .matches(/^sub_[a-zA-Z0-9]+$/)
      .withMessage('Valid subscription ID required'),
    body('planType')
      .optional()
      .isIn(['basic', 'professional', 'premium', 'enterprise'])
      .withMessage('Valid plan type required'),
    body('prorationBehavior')
      .optional()
      .isIn(['create_prorations', 'none', 'always_invoice'])
      .withMessage('Valid proration behavior required')
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

      const { subscriptionId } = req.params;
      const updateData = req.body;

      const updatedSubscription = await paymentService.updateSubscription(
        subscriptionId,
        updateData
      );

      logger.info('Subscription updated via API', {
        subscriptionId,
        updateData,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Subscription updated successfully',
        data: {
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          currentPeriodEnd: updatedSubscription.current_period_end,
          plan: updatedSubscription.metadata.plan_name
        }
      });
    } catch (error) {
      logger.error('Error in update subscription endpoint', {
        error: error.message,
        subscriptionId: req.params.subscriptionId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   DELETE /api/payments/subscriptions/:subscriptionId
 * @desc    Cancel a subscription
 * @access  Private (Client, CRO, Admin)
 */
router.delete('/subscriptions/:subscriptionId',
  authMiddleware,
  roleMiddleware(['client', 'cro', 'admin']),
  paymentRateLimit,
  [
    param('subscriptionId')
      .matches(/^sub_[a-zA-Z0-9]+$/)
      .withMessage('Valid subscription ID required'),
    body('cancelAtPeriodEnd')
      .optional()
      .isBoolean()
      .withMessage('cancelAtPeriodEnd must be boolean'),
    body('reason')
      .optional()
      .isIn(['customer_request', 'payment_failed', 'fraud', 'other'])
      .withMessage('Valid cancellation reason required'),
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Feedback must be less than 500 characters')
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

      const { subscriptionId } = req.params;
      const cancellationData = req.body;

      const cancelledSubscription = await paymentService.cancelSubscription(
        subscriptionId,
        cancellationData
      );

      logger.info('Subscription cancelled via API', {
        subscriptionId,
        cancellationData,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscriptionId: cancelledSubscription.id,
          status: cancelledSubscription.status,
          cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
          canceledAt: cancelledSubscription.canceled_at
        }
      });
    } catch (error) {
      logger.error('Error in cancel subscription endpoint', {
        error: error.message,
        subscriptionId: req.params.subscriptionId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/payments/process
 * @desc    Process a one-time payment
 * @access  Private (Client, CRO, Admin)
 */
router.post('/process',
  authMiddleware,
  roleMiddleware(['client', 'cro', 'admin']),
  paymentRateLimit,
  [
    body('amount')
      .isInt({ min: 50, max: 1000000 }) // $0.50 to $10,000
      .withMessage('Amount must be between $0.50 and $10,000'),
    body('currency')
      .optional()
      .equals('usd')
      .withMessage('Only USD currency supported'),
    body('customerId')
      .trim()
      .matches(/^cus_[a-zA-Z0-9]+$/)
      .withMessage('Valid Stripe customer ID required'),
    body('paymentMethodId')
      .trim()
      .matches(/^pm_[a-zA-Z0-9]+$/)
      .withMessage('Valid payment method ID required'),
    body('description')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Description is required and must be less than 200 characters')
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

      const paymentData = {
        ...req.body,
        metadata: {
          user_id: req.user.id,
          user_role: req.user.role,
          processed_via: 'Rick Jefferson Solutions Platform'
        }
      };

      const paymentIntent = await paymentService.processPayment(paymentData);

      logger.info('Payment processed via API', {
        paymentIntentId: paymentIntent.id,
        amount: paymentData.amount,
        customerId: paymentData.customerId,
        userId: req.user.id
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    } catch (error) {
      logger.error('Error in process payment endpoint', {
        error: error.message,
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
 * @route   GET /api/payments/billing-history/:customerId
 * @desc    Get customer billing history
 * @access  Private (Client, CRO, Admin)
 */
router.get('/billing-history/:customerId',
  authMiddleware,
  roleMiddleware(['client', 'cro', 'admin']),
  [
    param('customerId')
      .matches(/^cus_[a-zA-Z0-9]+$/)
      .withMessage('Valid Stripe customer ID required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('startingAfter')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Invalid startingAfter parameter')
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

      const { customerId } = req.params;
      const { limit, startingAfter } = req.query;

      const billingHistory = await paymentService.getBillingHistory(customerId, {
        limit: parseInt(limit) || 10,
        startingAfter
      });

      res.json({
        success: true,
        message: 'Billing history retrieved successfully',
        data: billingHistory
      });
    } catch (error) {
      logger.error('Error in billing history endpoint', {
        error: error.message,
        customerId: req.params.customerId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve billing history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/payments/plans
 * @desc    Get available subscription plans
 * @access  Public
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = {
      basic: {
        name: 'Basic Credit Repair',
        price: '$99/month',
        amount: 9900,
        interval: 'month',
        features: [
          'Credit report analysis',
          'Basic dispute letters',
          'Monthly credit monitoring',
          'Email support'
        ],
        popular: false
      },
      professional: {
        name: 'Professional Credit Repair',
        price: '$149/month',
        amount: 14900,
        interval: 'month',
        features: [
          'Everything in Basic',
          'Advanced dispute strategies',
          '10 Step Total Enforcement Chain™',
          'Phone support',
          'Goodwill letter campaigns'
        ],
        popular: true
      },
      premium: {
        name: 'Premium Credit Repair + Wealth Management',
        price: '$249/month',
        amount: 24900,
        interval: 'month',
        features: [
          'Everything in Professional',
          'Personal CRO assignment',
          'Business credit building',
          'Wealth management consultation',
          'Priority support'
        ],
        popular: false
      },
      enterprise: {
        name: 'Enterprise Credit Solutions',
        price: '$499/month',
        amount: 49900,
        interval: 'month',
        features: [
          'Everything in Premium',
          'White-label solutions',
          'API access',
          'Custom integrations',
          'Dedicated account manager'
        ],
        popular: false
      }
    };

    res.json({
      success: true,
      message: 'Subscription plans retrieved successfully',
      data: plans
    });
  } catch (error) {
    logger.error('Error in plans endpoint', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plans',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/payments/usage-report
 * @desc    Generate usage and analytics report
 * @access  Private (Admin only)
 */
router.get('/usage-report',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Valid start date required'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Valid end date required')
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

      const { startDate, endDate } = req.query;
      const options = {};

      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const report = await paymentService.generateUsageReport(options);

      logger.info('Usage report generated', {
        userId: req.user.id,
        options
      });

      res.json({
        success: true,
        message: 'Usage report generated successfully',
        data: report
      });
    } catch (error) {
      logger.error('Error in usage report endpoint', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to generate usage report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Stripe webhooks
 * @access  Public (Stripe only)
 */
router.post('/webhook',
  webhookRateLimit,
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.get('stripe-signature');
      
      if (!signature) {
        logger.warn('Webhook received without signature', {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(400).json({
          success: false,
          message: 'Missing Stripe signature'
        });
      }

      const result = await paymentService.handleWebhook(req.body, signature);

      logger.info('Webhook processed successfully', {
        type: result.type,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Webhook processing error', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(400).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      });
    }
  }
);

/**
 * @route   GET /api/payments/health
 * @desc    Health check for payment service
 * @access  Private (Admin only)
 */
router.get('/health',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      // Basic health check - verify Stripe connection
      const account = await paymentService.stripe.accounts.retrieve();
      
      res.json({
        success: true,
        message: 'Payment service is healthy',
        data: {
          stripeConnected: true,
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Payment service health check failed', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(503).json({
        success: false,
        message: 'Payment service is unhealthy',
        error: error.message
      });
    }
  }
);

// Error handling middleware for payment routes
router.use((error, req, res, next) => {
  logger.error('Payment route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  res.status(500).json({
    success: false,
    message: 'Payment processing error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;

/**
 * Rick Jefferson Solutions - Payment Routes
 * Comprehensive payment processing endpoints with security and compliance
 * 
 * Security Features:
 * - Rate limiting on all payment endpoints
 * - Input validation and sanitization
 * - Role-based access control
 * - Comprehensive audit logging
 * - Webhook signature verification
 * 
 * Compliance Features:
 * - PCI DSS compliance through Stripe
 * - Audit trail maintenance
 * - Secure data handling
 * - Error logging and monitoring
 * 
 * Endpoints:
 * - POST /customers - Create Stripe customer
 * - POST /subscriptions - Create subscription
 * - PUT /subscriptions/:id - Update subscription
 * - DELETE /subscriptions/:id - Cancel subscription
 * - POST /process - Process one-time payment
 * - GET /billing-history/:customerId - Get billing history
 * - GET /plans - Get subscription plans
 * - GET /usage-report - Generate analytics report
 * - POST /webhook - Handle Stripe webhooks
 * - GET /health - Service health check
 */