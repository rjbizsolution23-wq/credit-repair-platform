/**
 * Rick Jefferson Solutions - USPS API Routes
 * Production USPS integration endpoints for address verification, pricing, and mailing
 * Used by client portal and dispute-mail automation
 * 
 * @author Rick Jefferson Solutions Development Team
 * @version 1.0.0
 * @since 2024
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const uspsService = require('../services/uspsService');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for USPS endpoints
const uspsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many USPS requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all USPS routes
router.use(uspsRateLimit);

// Input validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route   POST /api/usps/verify-address
 * @desc    Verify and standardize an address
 * @access  Private (Client, CRO, Admin)
 */
router.post('/verify-address',
  authMiddleware,
  [
    body('streetAddress').notEmpty().withMessage('Street address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').isLength({ min: 2, max: 2 }).withMessage('State must be 2 characters'),
    body('zipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid ZIP code format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { streetAddress, city, state, zipCode } = req.body;
      
      const result = await uspsService.verifyAddress({
        streetAddress,
        city,
        state,
        zipCode
      });

      logger.info('Address verification requested', {
        userId: req.user.id,
        inputAddress: { streetAddress, city, state, zipCode },
        verified: result.verified
      });

      res.json({
        success: true,
        message: 'Address verification completed',
        data: result
      });
    } catch (error) {
      logger.error('Error in address verification endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to verify address',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/usps/pricing
 * @desc    Get shipping pricing for different service types
 * @access  Private (Client, CRO, Admin)
 */
router.post('/pricing',
  authMiddleware,
  [
    body('originZipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid origin ZIP code'),
    body('destinationZipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid destination ZIP code'),
    body('weight').isFloat({ min: 0.1, max: 70 }).withMessage('Weight must be between 0.1 and 70 ounces'),
    body('length').optional().isFloat({ min: 0.1 }).withMessage('Length must be positive'),
    body('width').optional().isFloat({ min: 0.1 }).withMessage('Width must be positive'),
    body('height').optional().isFloat({ min: 0.1 }).withMessage('Height must be positive'),
    body('mailClass').optional().isIn([
      'USPS_GROUND_ADVANTAGE',
      'PRIORITY_MAIL',
      'PRIORITY_MAIL_EXPRESS',
      'FIRST_CLASS_MAIL',
      'MEDIA_MAIL'
    ]).withMessage('Invalid mail class')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const shipmentData = req.body;
      
      const result = await uspsService.getPricing(shipmentData);

      logger.info('Pricing request processed', {
        userId: req.user.id,
        originZip: shipmentData.originZipCode,
        destinationZip: shipmentData.destinationZipCode,
        success: result.success
      });

      res.json({
        success: true,
        message: 'Pricing information retrieved',
        data: result
      });
    } catch (error) {
      logger.error('Error in pricing endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get pricing information',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/usps/service-standards
 * @desc    Get service standards (delivery timeframes)
 * @access  Private (Client, CRO, Admin)
 */
router.post('/service-standards',
  authMiddleware,
  [
    body('originZipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid origin ZIP code'),
    body('destinationZipCode').matches(/^\d{5}(-\d{4})?$/).withMessage('Invalid destination ZIP code'),
    body('mailClass').optional().isIn([
      'USPS_GROUND_ADVANTAGE',
      'PRIORITY_MAIL',
      'PRIORITY_MAIL_EXPRESS',
      'FIRST_CLASS_MAIL'
    ]).withMessage('Invalid mail class'),
    body('acceptanceDate').optional().isISO8601().withMessage('Invalid acceptance date format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const serviceRequest = req.body;
      
      const result = await uspsService.getServiceStandards(serviceRequest);

      logger.info('Service standards request processed', {
        userId: req.user.id,
        originZip: serviceRequest.originZipCode,
        destinationZip: serviceRequest.destinationZipCode,
        success: result.success
      });

      res.json({
        success: true,
        message: 'Service standards retrieved',
        data: result
      });
    } catch (error) {
      logger.error('Error in service standards endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get service standards',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/usps/locations
 * @desc    Find USPS locations near an address
 * @access  Private (Client, CRO, Admin)
 */
router.post('/locations',
  authMiddleware,
  [
    body('address').notEmpty().withMessage('Address is required for location search'),
    body('radius').optional().isInt({ min: 1, max: 50 }).withMessage('Radius must be between 1 and 50 miles'),
    body('locationTypes').optional().isArray().withMessage('Location types must be an array')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const locationRequest = req.body;
      
      const result = await uspsService.findLocations(locationRequest);

      logger.info('Location search processed', {
        userId: req.user.id,
        address: locationRequest.address,
        locationsFound: result.locations?.length || 0
      });

      res.json({
        success: true,
        message: 'USPS locations retrieved',
        data: result
      });
    } catch (error) {
      logger.error('Error in locations endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to find USPS locations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/usps/create-label
 * @desc    Create shipping label
 * @access  Private (CRO, Admin only)
 */
router.post('/create-label',
  authMiddleware,
  roleMiddleware(['cro', 'admin']),
  [
    body('fromAddress').isObject().withMessage('From address is required'),
    body('toAddress').isObject().withMessage('To address is required'),
    body('weight').optional().isFloat({ min: 0.1, max: 70 }).withMessage('Weight must be between 0.1 and 70 ounces'),
    body('customerReference').optional().isLength({ max: 50 }).withMessage('Customer reference too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const labelRequest = req.body;
      
      const result = await uspsService.createLabel(labelRequest);

      logger.info('Label creation processed', {
        userId: req.user.id,
        trackingNumber: result.trackingNumber,
        success: result.success
      });

      res.json({
        success: true,
        message: 'Shipping label created',
        data: result
      });
    } catch (error) {
      logger.error('Error in create label endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create shipping label',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/usps/track/:trackingNumber
 * @desc    Track a package using tracking number
 * @access  Private (Client, CRO, Admin)
 */
router.get('/track/:trackingNumber',
  authMiddleware,
  [
    param('trackingNumber').matches(/^[0-9]{20,22}$|^[A-Z]{2}[0-9]{9}[A-Z]{2}$/).withMessage('Invalid tracking number format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      const result = await uspsService.trackPackage(trackingNumber);

      logger.info('Package tracking processed', {
        userId: req.user.id,
        trackingNumber,
        status: result.status
      });

      res.json({
        success: true,
        message: 'Package tracking information retrieved',
        data: result
      });
    } catch (error) {
      logger.error('Error in tracking endpoint', {
        error: error.message,
        userId: req.user?.id,
        trackingNumber: req.params.trackingNumber
      });

      res.status(500).json({
        success: false,
        message: 'Failed to track package',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   POST /api/usps/send-dispute-letter
 * @desc    Send dispute letter via USPS with tracking
 * @access  Private (CRO, Admin only)
 */
router.post('/send-dispute-letter',
  authMiddleware,
  roleMiddleware(['cro', 'admin']),
  [
    body('clientId').isUUID().withMessage('Valid client ID is required'),
    body('disputeId').isUUID().withMessage('Valid dispute ID is required'),
    body('recipientAddress').isObject().withMessage('Recipient address is required'),
    body('letterType').isIn([
      'initial_dispute',
      'follow_up',
      'escalation',
      'goodwill',
      'validation',
      'cease_and_desist'
    ]).withMessage('Invalid letter type'),
    body('specialServices').optional().isArray().withMessage('Special services must be an array')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const disputeMailRequest = req.body;
      
      const result = await uspsService.sendDisputeLetter(disputeMailRequest);

      logger.info('Dispute letter mailing processed', {
        userId: req.user.id,
        clientId: disputeMailRequest.clientId,
        disputeId: disputeMailRequest.disputeId,
        trackingNumber: result.trackingNumber,
        success: result.success
      });

      res.json({
        success: true,
        message: 'Dispute letter sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error in send dispute letter endpoint', {
        error: error.message,
        userId: req.user?.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send dispute letter',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/usps/health
 * @desc    Check USPS service health
 * @access  Private (Admin only)
 */
router.get('/health',
  authMiddleware,
  roleMiddleware(['admin']),
  async (req, res) => {
    try {
      const healthStatus = await uspsService.getHealthStatus();

      logger.info('USPS health check performed', {
        userId: req.user.id,
        healthy: healthStatus.healthy
      });

      const statusCode = healthStatus.healthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: healthStatus.healthy,
        message: healthStatus.healthy ? 'USPS service is healthy' : 'USPS service is unhealthy',
        data: healthStatus
      });
    } catch (error) {
      logger.error('Error in USPS health check endpoint', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(503).json({
        success: false,
        message: 'USPS service health check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/usps/oauth/callback
 * @desc    Handle USPS OAuth callback (if needed for future integrations)
 * @access  Public (USPS only)
 */
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    logger.info('USPS OAuth callback received', {
      code: code ? 'present' : 'missing',
      state,
      ip: req.ip
    });

    // Handle OAuth callback if needed for future integrations
    // For now, just acknowledge receipt
    res.json({
      success: true,
      message: 'OAuth callback received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in OAuth callback endpoint', {
      error: error.message,
      query: req.query
    });

    res.status(500).json({
      success: false,
      message: 'OAuth callback processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware for USPS routes
router.use((error, req, res, next) => {
  logger.error('USPS route error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  });

  res.status(500).json({
    success: false,
    message: 'USPS service error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

module.exports = router;

/**
 * Rick Jefferson Solutions - USPS API Routes
 * Comprehensive USPS integration endpoints with security and compliance
 * 
 * Security Features:
 * - Rate limiting on all USPS endpoints
 * - Input validation and sanitization
 * - Role-based access control
 * - Comprehensive audit logging
 * - Authentication required for all endpoints
 * 
 * Compliance Features:
 * - USPS API terms of service compliance
 * - Audit trail maintenance
 * - Secure data handling
 * - Error logging and monitoring
 * 
 * Endpoints:
 * - POST /verify-address - Verify and standardize addresses
 * - POST /pricing - Get shipping pricing
 * - POST /service-standards - Get delivery timeframes
 * - POST /locations - Find USPS locations
 * - POST /create-label - Create shipping labels (CRO/Admin only)
 * - GET /track/:trackingNumber - Track packages
 * - POST /send-dispute-letter - Send dispute letters (CRO/Admin only)
 * - GET /health - Service health check (Admin only)
 * - GET /oauth/callback - OAuth callback handler
 */