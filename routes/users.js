const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const bcrypt = require('bcryptjs');
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
    new winston.transports.File({ filename: 'logs/users.log' })
  ]
});

// Validation rules
const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').isIn(['admin', 'manager', 'staff']).withMessage('Valid role is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
];

const updateUserValidation = [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty'),
  body('role').optional().isIn(['admin', 'manager', 'staff']).withMessage('Valid role is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Valid status is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
];

// Get all users (admin/manager only)
router.get('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['first_name', 'last_name', 'email', 'role', 'status', 'created_at', 'last_login'];
    const validSortOrders = ['ASC', 'DESC'];

    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(
        LOWER(first_name) LIKE LOWER($${paramCount}) OR 
        LOWER(last_name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount})
      )`);
      queryParams.push(`%${search}%`);
    }

    // Role filter
    if (role) {
      paramCount++;
      whereConditions.push(`role = $${paramCount}`);
      queryParams.push(role);
    }

    // Status filter
    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalUsers = parseInt(countResult.rows[0].total);

    // Get users with pagination
    const usersQuery = `
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        phone,
        last_login,
        email_verified,
        two_factor_enabled,
        created_at,
        updated_at,
        (
          SELECT COUNT(*) 
          FROM clients 
          WHERE assigned_to = users.id
        ) as assigned_clients
      FROM users
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const usersResult = await pool.query(usersQuery, queryParams);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users: usersResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

    logger.info('Users retrieved', {
      userId: req.user.id,
      filters: { search, role, status },
      resultCount: usersResult.rows.length
    });

  } catch (error) {
    logger.error('Error retrieving users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Get specific user
router.get('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;

    const userQuery = `
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        phone,
        last_login,
        email_verified,
        two_factor_enabled,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `;

    const userResult = await pool.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT d.id) as total_disputes,
        COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes,
        COUNT(DISTINCT a.id) as total_activities
      FROM users u
      LEFT JOIN clients c ON c.assigned_to = u.id
      LEFT JOIN disputes d ON d.created_by = u.id
      LEFT JOIN activities a ON a.user_id = u.id
      WHERE u.id = $1
    `;

    const statsResult = await pool.query(statsQuery, [id]);
    const stats = statsResult.rows[0];

    // Get recent activities
    const activitiesQuery = `
      SELECT 
        activity_type,
        description,
        created_at
      FROM activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const activitiesResult = await pool.query(activitiesQuery, [id]);

    res.json({
      user,
      stats: {
        totalClients: parseInt(stats.total_clients),
        totalDisputes: parseInt(stats.total_disputes),
        resolvedDisputes: parseInt(stats.resolved_disputes),
        totalActivities: parseInt(stats.total_activities),
        successRate: stats.total_disputes > 0 
          ? ((stats.resolved_disputes / stats.total_disputes) * 100).toFixed(2)
          : 0
      },
      recentActivities: activitiesResult.rows
    });

    logger.info('User details retrieved', {
      userId: req.user.id,
      targetUserId: id
    });

  } catch (error) {
    logger.error('Error retrieving user details:', error);
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
});

// Create new user (admin only)
router.post('/', requireRole(['admin']), createUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const createUserQuery = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, role, phone, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, role, status, phone, created_at
    `;

    const result = await pool.query(createUserQuery, [
      email,
      hashedPassword,
      firstName,
      lastName,
      role,
      phone || null,
      req.user.id
    ]);

    const newUser = result.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'user_created',
        `Created new user: ${firstName} ${lastName} (${email})`,
        JSON.stringify({ newUserId: newUser.id, role })
      ]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

    logger.info('User created', {
      createdBy: req.user.id,
      newUserId: newUser.id,
      email,
      role
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin/manager)
router.put('/:id', requireRole(['admin', 'manager']), updateUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { email, firstName, lastName, role, phone, status } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = existingUser.rows[0];

    // Check permissions
    if (req.user.role === 'manager' && currentUser.role === 'admin') {
      return res.status(403).json({ error: 'Managers cannot modify admin users' });
    }

    // Check if email is already taken by another user
    if (email && email !== currentUser.email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (email !== undefined) {
      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
    }

    if (firstName !== undefined) {
      paramCount++;
      updateFields.push(`first_name = $${paramCount}`);
      updateValues.push(firstName);
    }

    if (lastName !== undefined) {
      paramCount++;
      updateFields.push(`last_name = $${paramCount}`);
      updateValues.push(lastName);
    }

    if (role !== undefined && req.user.role === 'admin') {
      paramCount++;
      updateFields.push(`role = $${paramCount}`);
      updateValues.push(role);
    }

    if (phone !== undefined) {
      paramCount++;
      updateFields.push(`phone = $${paramCount}`);
      updateValues.push(phone);
    }

    if (status !== undefined) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add user ID for WHERE clause
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, status, phone, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'user_updated',
        `Updated user: ${updatedUser.first_name} ${updatedUser.last_name}`,
        JSON.stringify({ updatedUserId: id, changes: req.body })
      ]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

    logger.info('User updated', {
      updatedBy: req.user.id,
      updatedUserId: id,
      changes: req.body
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Change password
router.put('/:id/password', changePasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Check if user can change this password
    if (req.user.id !== id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    // Get current user
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password (only if changing own password)
    if (req.user.id === id) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, id]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'password_changed',
        req.user.id === id ? 'Changed own password' : `Changed password for user ID: ${id}`,
        JSON.stringify({ targetUserId: id })
      ]
    );

    res.json({ message: 'Password changed successfully' });

    logger.info('Password changed', {
      changedBy: req.user.id,
      targetUserId: id
    });

  } catch (error) {
    logger.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userResult = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Prevent deleting own account
    if (req.user.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Check if user has assigned clients
    const clientsResult = await pool.query('SELECT COUNT(*) as count FROM clients WHERE assigned_to = $1', [id]);
    const clientCount = parseInt(clientsResult.rows[0].count);

    if (clientCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete user with ${clientCount} assigned clients. Please reassign clients first.` 
      });
    }

    // Soft delete by updating status
    await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['inactive', id]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        req.user.id,
        'user_deleted',
        `Deleted user: ${user.first_name} ${user.last_name} (${user.email})`,
        JSON.stringify({ deletedUserId: id })
      ]
    );

    res.json({ message: 'User deleted successfully' });

    logger.info('User deleted', {
      deletedBy: req.user.id,
      deletedUserId: id,
      userEmail: user.email
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user profile (own profile)
router.get('/profile/me', async (req, res) => {
  try {
    const userQuery = `
      SELECT 
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        phone,
        last_login,
        email_verified,
        two_factor_enabled,
        created_at
      FROM users
      WHERE id = $1
    `;

    const userResult = await pool.query(userQuery, [req.user.id]);
    const user = userResult.rows[0];

    // Get user statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT d.id) as total_disputes,
        COUNT(DISTINCT CASE WHEN d.status = 'resolved' THEN d.id END) as resolved_disputes
      FROM users u
      LEFT JOIN clients c ON c.assigned_to = u.id
      LEFT JOIN disputes d ON d.created_by = u.id
      WHERE u.id = $1
    `;

    const statsResult = await pool.query(statsQuery, [req.user.id]);
    const stats = statsResult.rows[0];

    res.json({
      user,
      stats: {
        totalClients: parseInt(stats.total_clients),
        totalDisputes: parseInt(stats.total_disputes),
        resolvedDisputes: parseInt(stats.resolved_disputes),
        successRate: stats.total_disputes > 0 
          ? ((stats.resolved_disputes / stats.total_disputes) * 100).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    logger.error('Error retrieving user profile:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// Update user profile (own profile)
router.put('/profile/me', updateUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already taken by another user' });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (email !== undefined) {
      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
    }

    if (firstName !== undefined) {
      paramCount++;
      updateFields.push(`first_name = $${paramCount}`);
      updateValues.push(firstName);
    }

    if (lastName !== undefined) {
      paramCount++;
      updateFields.push(`last_name = $${paramCount}`);
      updateValues.push(lastName);
    }

    if (phone !== undefined) {
      paramCount++;
      updateFields.push(`phone = $${paramCount}`);
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Add user ID for WHERE clause
    paramCount++;
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, status, phone, updated_at
    `;

    const result = await pool.query(updateQuery, updateValues);
    const updatedUser = result.rows[0];

    // Log activity
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, description, metadata) VALUES ($1, $2, $3, $4)',
      [
        userId,
        'profile_updated',
        'Updated own profile',
        JSON.stringify({ changes: req.body })
      ]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

    logger.info('Profile updated', {
      userId,
      changes: req.body
    });

  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;