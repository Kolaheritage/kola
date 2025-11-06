const jwt = require('jsonwebtoken');
const config = require('../config/app');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token' }
    });
  }
};

module.exports = auth;