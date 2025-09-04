const { Pool } = require('pg');
const winston = require('winston');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

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
    new winston.transports.File({ filename: 'logs/payments.log' })
  ]
});

class PaymentService {
  constructor() {
    this.initialized = false;
    this.paymentMethods = {
      STRIPE: 'stripe',
      PAYPAL: 'paypal',
      BANK_TRANSFER: 'bank_transfer',
      CHECK: 'check',
      CASH: 'cash'
    };

    this.paymentStatuses = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      COMPLETED: 'completed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
      PARTIALLY_REFUNDED: 'partially_refunded'
    };

    this.subscriptionStatuses = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      CANCELLED: 'cancelled',
      PAST_DUE: 'past_due',
      TRIALING: 'trialing'
    };
  }

  async initialize() {
    try {
      // Test Stripe connection if configured
      if (process.env.STRIPE_SECRET_KEY) {
        await stripe.balance.retrieve();
        logger.info('Stripe connection verified');
      }

      this.initialized = true;
      logger.info('Payment service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize payment service:', error);
      return false;
    }
  }

  async createPaymentIntent(options) {
    try {
      const {
        amount,
        currency = 'usd',
        clientId,
        description,
        metadata = {},
        paymentMethodTypes = ['card']
      } = options;

      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: paymentMethodTypes,
        description,
        metadata: {
          clientId: clientId?.toString(),
          ...metadata
        }
      });

      // Store payment record in database
      const paymentResult = await pool.query(
        `INSERT INTO payments 
         (client_id, amount, currency, payment_method, status, stripe_payment_intent_id, description, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          clientId,
          amount,
          currency,
          this.paymentMethods.STRIPE,
          this.paymentStatuses.PENDING,
          paymentIntent.id,
          description,
          JSON.stringify(metadata)
        ]
      );

      const paymentId = paymentResult.rows[0].id;

      logger.info('Payment intent created', {
        paymentId,
        clientId,
        amount,
        stripePaymentIntentId: paymentIntent.id
      });

      return {
        success: true,
        paymentId,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };

    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processPayment(paymentId, paymentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get payment record
      const paymentResult = await client.query(
        'SELECT * FROM payments WHERE id = $1',
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = paymentResult.rows[0];

      // Update payment status to processing
      await client.query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [this.paymentStatuses.PROCESSING, paymentId]
      );

      let processResult;

      // Process based on payment method
      switch (payment.payment_method) {
        case this.paymentMethods.STRIPE:
          processResult = await this.processStripePayment(payment, paymentData);
          break;
        case this.paymentMethods.PAYPAL:
          processResult = await this.processPayPalPayment(payment, paymentData);
          break;
        case this.paymentMethods.BANK_TRANSFER:
          processResult = await this.processBankTransfer(payment, paymentData);
          break;
        default:
          throw new Error(`Unsupported payment method: ${payment.payment_method}`);
      }

      if (!processResult.success) {
        throw new Error(processResult.error);
      }

      // Update payment with success status
      await client.query(
        `UPDATE payments 
         SET status = $1, transaction_id = $2, processed_at = CURRENT_TIMESTAMP, 
             payment_data = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [
          this.paymentStatuses.COMPLETED,
          processResult.transactionId,
          JSON.stringify(processResult.paymentData),
          paymentId
        ]
      );

      // Update client balance if applicable
      if (payment.client_id) {
        await client.query(
          'UPDATE clients SET account_balance = account_balance + $1 WHERE id = $2',
          [payment.amount, payment.client_id]
        );
      }

      // Log activity
      await client.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          null, // System activity
          payment.client_id,
          'payment_processed',
          `Payment of $${payment.amount} processed successfully`,
          JSON.stringify({
            paymentId,
            amount: payment.amount,
            method: payment.payment_method,
            transactionId: processResult.transactionId
          })
        ]
      );

      await client.query('COMMIT');

      logger.info('Payment processed successfully', {
        paymentId,
        clientId: payment.client_id,
        amount: payment.amount,
        transactionId: processResult.transactionId
      });

      return {
        success: true,
        paymentId,
        transactionId: processResult.transactionId,
        amount: payment.amount
      };

    } catch (error) {
      await client.query('ROLLBACK');
      
      // Update payment status to failed
      await pool.query(
        'UPDATE payments SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [this.paymentStatuses.FAILED, error.message, paymentId]
      );

      logger.error('Payment processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  async processStripePayment(payment, paymentData) {
    try {
      // Confirm payment intent
      const paymentIntent = await stripe.paymentIntents.confirm(
        payment.stripe_payment_intent_id,
        {
          payment_method: paymentData.paymentMethodId,
          return_url: paymentData.returnUrl
        }
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }

      return {
        success: true,
        transactionId: paymentIntent.id,
        paymentData: {
          stripePaymentIntentId: paymentIntent.id,
          paymentMethodId: paymentData.paymentMethodId,
          status: paymentIntent.status
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processPayPalPayment(payment, paymentData) {
    try {
      // PayPal integration would go here
      // This is a placeholder implementation
      
      return {
        success: true,
        transactionId: paymentData.paypalTransactionId,
        paymentData: {
          paypalTransactionId: paymentData.paypalTransactionId,
          paypalOrderId: paymentData.paypalOrderId
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processBankTransfer(payment, paymentData) {
    try {
      // Bank transfer processing would go here
      // This is typically manual verification
      
      const transactionId = `BT_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      
      return {
        success: true,
        transactionId,
        paymentData: {
          bankTransactionId: transactionId,
          bankReference: paymentData.bankReference,
          verificationStatus: 'pending_verification'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createSubscription(options) {
    try {
      const {
        clientId,
        planId,
        paymentMethodId,
        trialDays = 0,
        metadata = {}
      } = options;

      // Get plan details
      const planResult = await pool.query(
        'SELECT * FROM subscription_plans WHERE id = $1 AND status = $2',
        [planId, 'active']
      );

      if (planResult.rows.length === 0) {
        throw new Error('Subscription plan not found or inactive');
      }

      const plan = planResult.rows[0];

      // Get client details
      const clientResult = await pool.query(
        'SELECT * FROM clients WHERE id = $1',
        [clientId]
      );

      if (clientResult.rows.length === 0) {
        throw new Error('Client not found');
      }

      const client = clientResult.rows[0];

      // Create Stripe customer if not exists
      let stripeCustomerId = client.stripe_customer_id;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: client.email,
          name: `${client.first_name} ${client.last_name}`,
          metadata: {
            clientId: clientId.toString()
          }
        });
        stripeCustomerId = customer.id;

        // Update client with Stripe customer ID
        await pool.query(
          'UPDATE clients SET stripe_customer_id = $1 WHERE id = $2',
          [stripeCustomerId, clientId]
        );
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: plan.billing_interval
            }
          }
        }],
        default_payment_method: paymentMethodId,
        trial_period_days: trialDays > 0 ? trialDays : undefined,
        metadata: {
          clientId: clientId.toString(),
          planId: planId.toString(),
          ...metadata
        }
      });

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date(stripeSubscription.current_period_end * 1000);
      const trialEndDate = trialDays > 0 ? new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000)) : null;

      // Create subscription record
      const subscriptionResult = await pool.query(
        `INSERT INTO subscriptions 
         (client_id, plan_id, stripe_subscription_id, status, start_date, end_date, trial_end_date, 
          amount, billing_interval, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          clientId,
          planId,
          stripeSubscription.id,
          trialDays > 0 ? this.subscriptionStatuses.TRIALING : this.subscriptionStatuses.ACTIVE,
          startDate,
          endDate,
          trialEndDate,
          plan.price,
          plan.billing_interval,
          JSON.stringify(metadata)
        ]
      );

      const subscriptionId = subscriptionResult.rows[0].id;

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          null,
          clientId,
          'subscription_created',
          `Subscription created for plan: ${plan.name}`,
          JSON.stringify({
            subscriptionId,
            planId,
            planName: plan.name,
            amount: plan.price,
            trialDays
          })
        ]
      );

      logger.info('Subscription created', {
        subscriptionId,
        clientId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        trialDays
      });

      return {
        success: true,
        subscriptionId,
        stripeSubscriptionId: stripeSubscription.id,
        status: trialDays > 0 ? this.subscriptionStatuses.TRIALING : this.subscriptionStatuses.ACTIVE,
        startDate,
        endDate,
        trialEndDate
      };

    } catch (error) {
      logger.error('Failed to create subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelSubscription(subscriptionId, reason = null) {
    try {
      // Get subscription
      const subscriptionResult = await pool.query(
        'SELECT * FROM subscriptions WHERE id = $1',
        [subscriptionId]
      );

      if (subscriptionResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }

      const subscription = subscriptionResult.rows[0];

      // Cancel Stripe subscription
      if (subscription.stripe_subscription_id) {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      // Update subscription status
      await pool.query(
        'UPDATE subscriptions SET status = $1, cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $2 WHERE id = $3',
        [this.subscriptionStatuses.CANCELLED, reason, subscriptionId]
      );

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          null,
          subscription.client_id,
          'subscription_cancelled',
          'Subscription cancelled',
          JSON.stringify({
            subscriptionId,
            reason,
            cancelledAt: new Date().toISOString()
          })
        ]
      );

      logger.info('Subscription cancelled', {
        subscriptionId,
        clientId: subscription.client_id,
        reason
      });

      return {
        success: true,
        subscriptionId,
        cancelledAt: new Date()
      };

    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async processRefund(paymentId, amount = null, reason = null) {
    try {
      // Get payment
      const paymentResult = await pool.query(
        'SELECT * FROM payments WHERE id = $1',
        [paymentId]
      );

      if (paymentResult.rows.length === 0) {
        throw new Error('Payment not found');
      }

      const payment = paymentResult.rows[0];

      if (payment.status !== this.paymentStatuses.COMPLETED) {
        throw new Error('Payment is not in completed status');
      }

      // Default to full refund if amount not specified
      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      let refundResult;

      // Process refund based on payment method
      if (payment.payment_method === this.paymentMethods.STRIPE && payment.stripe_payment_intent_id) {
        refundResult = await stripe.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
          reason: reason || 'requested_by_customer'
        });
      }

      // Update payment status
      const newStatus = refundAmount === payment.amount 
        ? this.paymentStatuses.REFUNDED 
        : this.paymentStatuses.PARTIALLY_REFUNDED;

      await pool.query(
        'UPDATE payments SET status = $1, refunded_amount = COALESCE(refunded_amount, 0) + $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newStatus, refundAmount, paymentId]
      );

      // Create refund record
      await pool.query(
        `INSERT INTO refunds 
         (payment_id, amount, reason, stripe_refund_id, status, processed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          paymentId,
          refundAmount,
          reason,
          refundResult?.id,
          'completed'
        ]
      );

      // Update client balance
      if (payment.client_id) {
        await pool.query(
          'UPDATE clients SET account_balance = account_balance - $1 WHERE id = $2',
          [refundAmount, payment.client_id]
        );
      }

      // Log activity
      await pool.query(
        'INSERT INTO activities (user_id, client_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4, $5)',
        [
          null,
          payment.client_id,
          'refund_processed',
          `Refund of $${refundAmount} processed`,
          JSON.stringify({
            paymentId,
            refundAmount,
            reason,
            stripeRefundId: refundResult?.id
          })
        ]
      );

      logger.info('Refund processed', {
        paymentId,
        refundAmount,
        stripeRefundId: refundResult?.id
      });

      return {
        success: true,
        refundId: refundResult?.id,
        amount: refundAmount,
        status: 'completed'
      };

    } catch (error) {
      logger.error('Failed to process refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getPaymentHistory(clientId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null,
        startDate = null,
        endDate = null
      } = options;

      let query = `
        SELECT 
          p.*,
          r.amount as refunded_amount,
          r.reason as refund_reason
        FROM payments p
        LEFT JOIN refunds r ON p.id = r.payment_id
        WHERE p.client_id = $1
      `;

      const queryParams = [clientId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND p.status = $${paramCount}`;
        queryParams.push(status);
      }

      if (startDate) {
        paramCount++;
        query += ` AND p.created_at >= $${paramCount}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND p.created_at <= $${paramCount}`;
        queryParams.push(endDate);
      }

      query += ' ORDER BY p.created_at DESC';

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
        payments: result.rows
      };

    } catch (error) {
      logger.error('Failed to get payment history:', error);
      return {
        success: false,
        error: error.message,
        payments: []
      };
    }
  }

  async getSubscriptionStatus(clientId) {
    try {
      const result = await pool.query(
        `SELECT s.*, sp.name as plan_name, sp.description as plan_description
         FROM subscriptions s
         JOIN subscription_plans sp ON s.plan_id = sp.id
         WHERE s.client_id = $1 AND s.status IN ('active', 'trialing', 'past_due')
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [clientId]
      );

      if (result.rows.length === 0) {
        return {
          success: true,
          hasActiveSubscription: false,
          subscription: null
        };
      }

      const subscription = result.rows[0];

      return {
        success: true,
        hasActiveSubscription: true,
        subscription: {
          id: subscription.id,
          planName: subscription.plan_name,
          planDescription: subscription.plan_description,
          status: subscription.status,
          amount: subscription.amount,
          billingInterval: subscription.billing_interval,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          trialEndDate: subscription.trial_end_date
        }
      };

    } catch (error) {
      logger.error('Failed to get subscription status:', error);
      return {
        success: false,
        error: error.message,
        hasActiveSubscription: false,
        subscription: null
      };
    }
  }

  async getPaymentStats(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date()
      } = options;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'refunded' OR status = 'partially_refunded' THEN refunded_amount ELSE 0 END) as total_refunds,
          AVG(CASE WHEN status = 'completed' THEN amount END) as average_payment,
          payment_method,
          DATE_TRUNC('day', created_at) as date
        FROM payments 
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY payment_method, DATE_TRUNC('day', created_at)
        ORDER BY date DESC, payment_method
      `;

      const result = await pool.query(statsQuery, [startDate, endDate]);

      return {
        success: true,
        stats: result.rows
      };

    } catch (error) {
      logger.error('Failed to get payment stats:', error);
      return {
        success: false,
        error: error.message,
        stats: []
      };
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;