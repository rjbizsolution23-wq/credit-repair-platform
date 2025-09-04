const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { query } = require('../config/database');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Strict rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// JWT verification middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is still active and exists
    const userQuery = `
      SELECT 
        id, email, first_name, last_name, role, 
        is_active, last_login, created_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const userResult = await query(userQuery, [decoded.userId]);
    
    if (!userResult.rows[0]) {
      return res.status(401).json({ 
        error: 'Invalid or inactive user',
        message: 'User account not found or has been deactivated'
      });
    }

    // Check if token is blacklisted (for logout functionality)
    const blacklistQuery = 'SELECT id FROM token_blacklist WHERE token = $1';
    const blacklistResult = await query(blacklistQuery, [token]);
    
    if (blacklistResult.rows.length > 0) {
      return res.status(401).json({ 
        error: 'Token has been revoked',
        message: 'Please log in again'
      });
    }
    
    // Add user info to request object
    req.user = {
      id: decoded.userId,
      email: userResult.rows[0].email,
      firstName: userResult.rows[0].first_name,
      lastName: userResult.rows[0].last_name,
      role: userResult.rows[0].role,
      lastLogin: userResult.rows[0].last_login
    };
    
    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'The provided token is malformed or invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expired',
        message: 'Your session has expired, please log in again'
      });
    }
    
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: userRoles,
        endpoint: req.originalUrl,
        method: req.method
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required role(s): ${userRoles.join(', ')}`
      });
    }
    
    next();
  };
};

// Admin only access
const requireAdmin = requireRole(['admin', 'super_admin']);

// Manager or admin access
const requireManager = requireRole(['manager', 'admin', 'super_admin']);

// Client access (for client portal)
const requireClient = requireRole(['client']);

// Staff access (any internal user)
const requireStaff = requireRole(['staff', 'manager', 'admin', 'super_admin']);

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userQuery = 'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true';
    const userResult = await query(userQuery, [decoded.userId]);
    
    if (userResult.rows[0]) {
      req.user = {
        id: decoded.userId,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user context
    req.user = null;
    next();
  }
};

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'credit-repair-platform',
      audience: 'credit-repair-users'
    }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'credit-repair-platform'
    }
  );
};

// Blacklist token (for logout)
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    await query(
      'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
      [token, expiresAt]
    );
    
    return true;
  } catch (error) {
    logger.error('Error blacklisting token', { error: error.message });
    return false;
  }
};

module.exports = {
  authLimiter,
  passwordResetLimiter,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  requireClient,
  requireStaff,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  blacklistToken
};