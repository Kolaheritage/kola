const express = require('express');
const router = express.Router();
const { authenticate, authenticateWithUser } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');
const profileController = require('../controllers/profile.controller');
const validate = require('../middleware/validate');
const { profileUpdateValidation } = require('../utils/validators');

/**
 * User Routes
 * HER-12: JWT Authentication Middleware
 * HER-16: User Profile Endpoint
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticate, profileController.getProfile);

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile (using authenticateWithUser - full user loaded)
 * @access  Private
 */
router.get(
  '/me',
  authenticateWithUser, // Full user object already attached to req.user
  asyncHandler(async (req, res) => {
    // User is already loaded and attached by middleware
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  profileUpdateValidation,
  validate,
  profileController.updateProfile
);

/**
 * @route   GET /api/users/:username
 * @desc    Get user by username (public route)
 * @access  Public
 */
router.get(
  '/:username',
  asyncHandler(async (req, res) => {
    const { username } = req.params;

    // Find user by username (we'll need to add this method to User model)
    const query = 'SELECT id, email, username, bio, avatar_url, created_at FROM users WHERE username = $1';
    const result = await require('../config/database').query(query, [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  })
);

module.exports = router;
