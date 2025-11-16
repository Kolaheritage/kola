const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User.model');

/**
 * Authentication Middleware
 * HER-12: JWT Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - Extracted token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support both 'Bearer token' and just 'token'
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
};

/**
 * Main authentication middleware
 * Requires valid JWT token, attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid token.',
          code: 'NO_TOKEN_PROVIDED'
        }
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      // Distinguish between expired and invalid tokens
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          }
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Please login again.',
            code: 'INVALID_TOKEN'
          }
        });
      } else {
        throw error; // Re-throw unexpected errors
      }
    }

    // Attach user info to request (from token payload)
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed. Please try again.',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Authentication middleware with user loading
 * Requires valid JWT token, loads full user from database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateWithUser = async (req, res, next) => {
  try {
    // Extract token from header
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid token.',
          code: 'NO_TOKEN_PROVIDED'
        }
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          }
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Please login again.',
            code: 'INVALID_TOKEN'
          }
        });
      } else {
        throw error;
      }
    }

    // Load full user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found. Please login again.',
          code: 'USER_NOT_FOUND'
        }
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
    }

    // Remove password hash before attaching to request
    const { password_hash, ...userWithoutPassword } = user;

    // Attach full user to request
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed. Please try again.',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if token is missing
 * Useful for routes that have different behavior for authenticated vs non-authenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    // Try to verify token
    try {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email
      };
    } catch (error) {
      // Token is invalid or expired, continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  authenticateWithUser,
  optionalAuthenticate,
  extractToken // Export for testing
};

// Backward compatibility - default export is authenticate
module.exports.default = authenticate;