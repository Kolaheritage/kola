/**
 * Authentication Controller
 * Handles user registration and login
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const config = require('../config/app');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return errorResponse(res, 'Email already registered', 409);
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return errorResponse(res, 'Username already taken', 409);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      email,
      username,
      password_hash: passwordHash
    };

    const newUser = await User.create(userData);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return user data (without password) and token
    return successResponse(
      res,
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          created_at: newUser.created_at
        },
        token
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 * Will be implemented in HER-11
 */
const login = async (req, res, next) => {
  try {
    return errorResponse(res, 'Login not yet implemented (HER-11)', 501);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};