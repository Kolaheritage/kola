import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on authentication endpoints
 */

/**
 * Rate limiter for authentication endpoints
 * Limits login attempts to prevent brute force attacks
 * Disabled in test environment
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many login attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => process.env.NODE_ENV === 'test', // Disable in test mode
  // Skip successful requests from counting against the limit
  skipSuccessfulRequests: true,
  // Skip failed requests (optional - commented out for now)
  // skipFailedRequests: false,
});

/**
 * General API rate limiter
 * More lenient than auth limiter
 * Disabled in test environment
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Disable in test mode
});

/**
 * Strict rate limiter for sensitive operations
 * Very restrictive for operations like password reset
 * Disabled in test environment
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    error: {
      message: 'Too many attempts. Please try again in an hour.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Disable in test mode
});
