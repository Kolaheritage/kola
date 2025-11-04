/**
 * Authentication Tests
 * Tests user registration and login endpoints
 */

const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

// Mock database queries
jest.mock('../config/database');

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    };

    test('should register a new user successfully', async () => {
      // Mock database responses
      db.query
        .mockResolvedValueOnce({ rows: [] }) // findByEmail returns nothing
        .mockResolvedValueOnce({ rows: [] }) // findByUsername returns nothing
        .mockResolvedValueOnce({
          // create returns new user
          rows: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'test@example.com',
              username: 'testuser',
              created_at: new Date()
            }
          ]
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('username');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    test('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });

    test('should fail with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with weak password (less than 8 chars)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'pass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with password missing number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'passwordonly'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with username too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with username containing invalid characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'test user!',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail with duplicate email', async () => {
      // Mock database to return existing user
      db.query.mockResolvedValueOnce({
        rows: [{ id: '123', email: 'test@example.com' }]
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email already registered');
    });

    test('should fail with duplicate username', async () => {
      // Mock database responses
      db.query
        .mockResolvedValueOnce({ rows: [] }) // findByEmail returns nothing
        .mockResolvedValueOnce({
          // findByUsername returns existing user
          rows: [{ id: '123', username: 'testuser' }]
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Username already taken');
    });

    test('should hash password before storing', async () => {
      // Mock database responses
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'test@example.com',
              username: 'testuser',
              created_at: new Date()
            }
          ]
        });

      await request(app).post('/api/auth/register').send(validUserData);

      // Check that password was hashed (third call is create with password_hash)
      const createCall = db.query.mock.calls[2];
      const hashedPassword = createCall[1][2]; // password_hash is third param

      expect(hashedPassword).not.toBe(validUserData.password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash format
    });

    test('should generate valid JWT token', async () => {
      // Mock database responses
      db.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              email: 'test@example.com',
              username: 'testuser',
              created_at: new Date()
            }
          ]
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      expect(response.body.data.token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return not implemented error', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(response.status).toBe(501);
      expect(response.body.success).toBe(false);
    });
  });
});