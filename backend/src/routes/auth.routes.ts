import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import validate from '../middleware/validate';
import { registerValidation, loginValidation } from '../utils/validators';
import { authLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

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

export default router;
