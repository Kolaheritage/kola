const express = require('express');
const router = express.Router();
const { authenticate, authenticateWithUser } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User.model');

/**
 * User Routes
 * HER-12: JWT Authentication Middleware
 * Example protected routes demonstrating middleware usage
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile (using authenticate - lightweight)
 * @access  Private
 */
router.get(
  '/profile',
  authenticate, // Only token info (id, email) attached to req.user
  asyncHandler(async (req, res) => {
    // Load user from database using ID from token
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Remove password hash
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
  })
);

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
  asyncHandler(async (req, res) => {
    const { username, bio, avatar_url } = req.body;

    // Only allow updating certain fields
    const allowedUpdates = {};
    if (username !== undefined) allowedUpdates.username = username;
    if (bio !== undefined) allowedUpdates.bio = bio;
    if (avatar_url !== undefined) allowedUpdates.avatar_url = avatar_url;

    // Update user
    const updatedUser = await User.update(req.user.id, allowedUpdates);

    if (!updatedUser) {
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
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  })
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
