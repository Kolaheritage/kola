const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * HER-11: User Login Backend
 * Prevents brute force attacks on authentication endpoints
 */

// Skip rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';

/**
 * Rate limiter for authentication endpoints
 * Limits login attempts to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many login attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: true,
  // Skip rate limiting in test environment
  skip: () => isTestEnv,
});

/**
 * General API rate limiter
 * More lenient than auth limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

/**
 * Strict rate limiter for sensitive operations
 * Very restrictive for operations like password reset
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many attempts. Please try again in an hour.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter
};
