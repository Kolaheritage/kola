const jwt = require('jsonwebtoken');
const { authenticate, authenticateWithUser, optionalAuthenticate, extractToken } = require('../middleware/auth');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User.model');

/**
 * Authentication Middleware Tests
 * HER-12: JWT Authentication Middleware
 */

// Mock the User model
jest.mock('../models/User.model');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '7d';

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Setup mock request, response, and next function
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('extractToken', () => {
    it('should extract token from Bearer authorization header', () => {
      req.headers.authorization = 'Bearer test-token-123';
      const token = extractToken(req);
      expect(token).toBe('test-token-123');
    });

    it('should extract token without Bearer prefix', () => {
      req.headers.authorization = 'test-token-123';
      const token = extractToken(req);
      expect(token).toBe('test-token-123');
    });

    it('should return null if no authorization header', () => {
      const token = extractToken(req);
      expect(token).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should authenticate with valid token', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userEmail = 'test@example.com';
      const token = generateToken({ id: userId, email: userEmail });

      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(userId);
      expect(req.user.email).toBe(userEmail);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid token.',
          code: 'NO_TOKEN_PROVIDED'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with token without Bearer prefix', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userEmail = 'test@example.com';
      const token = generateToken({ id: userId, email: userEmail });

      req.headers.authorization = token; // No Bearer prefix

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(userId);
    });
  });

  describe('authenticateWithUser', () => {
    it('should authenticate and load full user from database', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed-password',
        bio: 'Test bio',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      User.findById.mockResolvedValue(mockUser);

      const token = generateToken({ id: mockUser.id, email: mockUser.email });
      req.headers.authorization = `Bearer ${token}`;

      await authenticateWithUser(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(mockUser.id);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(mockUser.id);
      expect(req.user.email).toBe(mockUser.email);
      expect(req.user.username).toBe(mockUser.username);
      expect(req.user.password_hash).toBeUndefined(); // Password should be removed
    });

    it('should return 401 if user not found in database', async () => {
      User.findById.mockResolvedValue(null);

      const token = generateToken({ id: '123', email: 'test@example.com' });
      req.headers.authorization = `Bearer ${token}`;

      await authenticateWithUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found. Please login again.',
          code: 'USER_NOT_FOUND'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user account is deactivated', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        is_active: false // Deactivated
      };

      User.findById.mockResolvedValue(mockUser);

      const token = generateToken({ id: mockUser.id, email: mockUser.email });
      req.headers.authorization = `Bearer ${token}`;

      await authenticateWithUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      await authenticateWithUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required. Please provide a valid token.',
          code: 'NO_TOKEN_PROVIDED'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate with valid token', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const userEmail = 'test@example.com';
      const token = generateToken({ id: userId, email: userEmail });

      req.headers.authorization = `Bearer ${token}`;

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(userId);
      expect(req.user.email).toBe(userEmail);
    });

    it('should continue without user if no token provided', async () => {
      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user if token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await optionalAuthenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully in authenticate', async () => {
      // Force an unexpected error by mocking verifyToken to throw
      const originalJwtVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const token = 'some-token';
      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication failed. Please try again.',
          code: 'AUTH_ERROR'
        }
      });

      // Restore original function
      jwt.verify = originalJwtVerify;
    });

    it('should handle database errors in authenticateWithUser', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));

      const token = generateToken({ id: '123', email: 'test@example.com' });
      req.headers.authorization = `Bearer ${token}`;

      await authenticateWithUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication failed. Please try again.',
          code: 'AUTH_ERROR'
        }
      });
    });
  });
});
