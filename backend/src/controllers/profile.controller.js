const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Profile Controller
 * HER-16: User Profile Endpoint
 * Handles user profile viewing and updating
 */

/**
 * Get current user's profile
 * GET /api/users/profile
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
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

  // Remove password hash from response
  const { password_hash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword
    }
  });
});

/**
 * Update current user's profile
 * PUT /api/users/profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { username, bio, avatar_url } = req.body;

  // Build update object with only allowed fields
  const allowedUpdates = {};

  if (username !== undefined) {
    allowedUpdates.username = username;
  }

  if (bio !== undefined) {
    allowedUpdates.bio = bio;
  }

  if (avatar_url !== undefined) {
    allowedUpdates.avatar_url = avatar_url;
  }

  // Check if there are any fields to update
  if (Object.keys(allowedUpdates).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No valid fields provided for update',
        code: 'NO_UPDATE_FIELDS'
      }
    });
  }

  try {
    // Update user in database
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
  } catch (error) {
    // Handle unique constraint violations (e.g., username already taken)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Username is already taken',
          code: 'USERNAME_EXISTS'
        }
      });
    }
    throw error;
  }
});

module.exports = {
  getProfile,
  updateProfile
};
