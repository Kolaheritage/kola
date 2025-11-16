const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const { generateToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Controller
 * HER-11: User Login Backend
 */

/**
 * User Login
 * POST /api/auth/login
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);

  // Check if user exists
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      }
    });
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email
  });

  // Remove password_hash from user object
  const { password_hash, ...userWithoutPassword } = user;

  // Return success response
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

/**
 * User Registration
 * POST /api/auth/register
 * @route POST /api/auth/register
 * @access Public
 * Note: Will be implemented in HER-10 or can be added here
 */
const register = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      }
    });
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await User.create({
    email,
    username,
    password_hash
  });

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email
  });

  // Return success response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  });
});

/**
 * Logout
 * POST /api/auth/logout
 * @route POST /api/auth/logout
 * @access Private
 * Note: With JWT, logout is handled client-side by removing the token
 */
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  login,
  register,
  logout
};
