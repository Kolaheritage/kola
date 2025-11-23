import jwt from 'jsonwebtoken';

/**
 * JWT Utility Functions
 * HER-11: User Login Backend
 */

interface JWTPayload {
  userId: string;
  email: string;
  [key: string]: any;
}

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token (user id, email)
 * @returns {string} JWT token
 */
const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} Throws original JWT error (TokenExpiredError, JsonWebTokenError, etc.)
 */
const verifyToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Let jwt.verify throw its own errors (TokenExpiredError, JsonWebTokenError, etc.)
  // This allows middleware to distinguish between different error types
  return jwt.verify(token, secret) as JWTPayload;
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};

export {
  generateToken,
  verifyToken,
  decodeToken,
  JWTPayload
};
