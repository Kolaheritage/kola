const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * Authentication Routes
 * HER-10: User Registration Backend
 * HER-11: User Login Backend
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', authController.logout);

module.exports = router;