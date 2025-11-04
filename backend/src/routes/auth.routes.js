const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerValidation, loginValidation } = require('../utils/validators');
const { loginRateLimiter, registerRateLimiter } = require('../middleware/rateLimiter');

/**
 * Authentication Routes
 */

// POST /api/auth/register - User registration
router.post('/register', registerRateLimiter, registerValidation, validate, authController.register);

// POST /api/auth/login - User login
router.post('/login', loginRateLimiter, loginValidation, validate, authController.login);

// POST /api/auth/logout - User logout (optional)
// router.post('/logout', authController.logout);

module.exports = router;