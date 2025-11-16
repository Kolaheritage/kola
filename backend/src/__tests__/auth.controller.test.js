const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User.model');
const { generateToken, verifyToken } = require('../utils/jwt');

/**
 * Authentication Controller Tests
 * HER-11: User Login Backend
 */

// Mock the User model
jest.mock('../models/User.model');

// Mock the database module to prevent actual connections
jest.mock('../config/database', () => ({
  query: jest.fn(),
  testConnection: jest.fn().mockResolvedValue(true),
  pool: {
    on: jest.fn()
  }
}));

describe('Auth Controller - Login', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Mock user data
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: await bcrypt.hash('Test1234', 10),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Mock User.findByEmail to return the mock user
      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 401 for invalid email', async () => {
      // Mock User.findByEmail to return null (user not found)
      User.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: await bcrypt.hash('Test1234', 10),
        is_active: true
      };

      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should return 401 for deactivated account', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: await bcrypt.hash('Test1234', 10),
        is_active: false // Account is deactivated
      };

      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Account is deactivated');
      expect(response.body.error.code).toBe('ACCOUNT_DEACTIVATED');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Test1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return a valid JWT token', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: await bcrypt.hash('Test1234', 10),
        is_active: true
      };

      User.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test1234'
        });

      expect(response.status).toBe(200);
      const { token } = response.body.data;

      // Verify the token is valid
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });
  });
});

describe('Auth Controller - Register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      // Mock User.findByEmail to return null (user doesn't exist)
      User.findByEmail.mockResolvedValue(null);

      // Mock User.create to return the created user
      const mockCreatedUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newuser@example.com',
        username: 'newuser',
        created_at: new Date()
      };
      User.create.mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'Test1234'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    it('should return 409 if user already exists', async () => {
      // Mock User.findByEmail to return existing user
      User.findByEmail.mockResolvedValue({
        id: '123',
        email: 'existing@example.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          username: 'existinguser',
          password: 'Test1234'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'weak' // Too short, no number
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
