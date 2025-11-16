import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt';
import User from '../models/User.model';

/**
 * Authentication Middleware
 * HER-12: JWT Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

/**
 * JWT payload interface
 */
interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * User info attached to request
 */
interface UserInfo {
  id: string;
  email: string;
}

/**
 * Extended Request interface with user property
 */
export interface AuthenticatedRequest extends Request {
  user?: UserInfo | any;
}

/**
 * Extract token from Authorization header
 * @param {Request} req - Express request object
 * @returns {string|null} - Extracted token or null
 */
export const extractToken = (req: Request): string | null => {
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
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from header
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid token.',
          code: 'NO_TOKEN_PROVIDED'
        }
      });
      return;
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token) as JwtPayload;
    } catch (error: any) {
      // Distinguish between expired and invalid tokens
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Token has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          }
        });
        return;
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Please login again.',
            code: 'INVALID_TOKEN'
          }
        });
        return;
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
    res.status(500).json({
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
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export const authenticateWithUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from header
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid token.',
          code: 'NO_TOKEN_PROVIDED'
        }
      });
      return;
    }

    // Verify token
    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token) as JwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Token has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
          }
        });
        return;
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Invalid token. Please login again.',
            code: 'INVALID_TOKEN'
          }
        });
        return;
      } else {
        throw error;
      }
    }

    // Load full user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found. Please login again.',
          code: 'USER_NOT_FOUND'
        }
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
      return;
    }

    // Remove password hash before attaching to request
    const { password_hash, ...userWithoutPassword } = user;

    // Attach full user to request
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
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
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      next();
      return;
    }

    // Try to verify token
    try {
      const decoded = verifyToken(token) as JwtPayload;
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

// Default export for backward compatibility
export default authenticate;
