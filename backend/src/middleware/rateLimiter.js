/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on authentication endpoints
 */

// Simple in-memory rate limiter
// For production, consider using Redis for distributed rate limiting

const loginAttempts = new Map();

/**
 * Rate limiter for login attempts
 * Limits: 5 attempts per 15 minutes per IP
 */
const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  // Get or create attempt record for this IP
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }

  const attempts = loginAttempts.get(ip);

  // Remove attempts older than the time window
  const recentAttempts = attempts.filter(
    (timestamp) => now - timestamp < windowMs
  );

  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const timeUntilReset = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);

    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many login attempts. Please try again later.',
        retryAfter: timeUntilReset
      }
    });
  }

  // Record this attempt
  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);

  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupOldAttempts(windowMs);
  }

  next();
};

/**
 * Rate limiter for registration
 * Limits: 3 registrations per hour per IP
 */
const registerRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 3;

  // Get or create attempt record for this IP
  if (!loginAttempts.has(`register_${ip}`)) {
    loginAttempts.set(`register_${ip}`, []);
  }

  const attempts = loginAttempts.get(`register_${ip}`);

  // Remove attempts older than the time window
  const recentAttempts = attempts.filter(
    (timestamp) => now - timestamp < windowMs
  );

  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const timeUntilReset = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);

    return res.status(429).json({
      success: false,
      error: {
        message: 'Too many registration attempts. Please try again later.',
        retryAfter: timeUntilReset
      }
    });
  }

  // Record this attempt
  recentAttempts.push(now);
  loginAttempts.set(`register_${ip}`, recentAttempts);

  next();
};

/**
 * Clean up old attempt records
 */
const cleanupOldAttempts = (windowMs) => {
  const now = Date.now();
  for (const [key, attempts] of loginAttempts.entries()) {
    const recentAttempts = attempts.filter(
      (timestamp) => now - timestamp < windowMs
    );
    if (recentAttempts.length === 0) {
      loginAttempts.delete(key);
    } else {
      loginAttempts.set(key, recentAttempts);
    }
  }
};

/**
 * Reset rate limit for an IP (useful for testing)
 */
const resetRateLimit = (ip) => {
  loginAttempts.delete(ip);
  loginAttempts.delete(`register_${ip}`);
};

module.exports = {
  loginRateLimiter,
  registerRateLimiter,
  resetRateLimit
};