/**
 * Authentication Integration Tests
 * Tests with actual database (requires DATABASE_URL)
 * 
 * To run: DATABASE_URL=postgres://... npm test auth.integration.test.js
 * 
 * Note: These tests are skipped in CI if DATABASE_URL is not set
 */

const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

const shouldRunIntegrationTests = !!process.env.DATABASE_URL;

// Skip tests if no database available
const describeIf = shouldRunIntegrationTests ? describe : describe.skip;

describeIf('Auth Integration Tests', () => {
  // Clean up test users before each test
  beforeEach(async () => {
    await db.query("DELETE FROM users WHERE email LIKE 'test%@example.com'");
  });

  // Clean up after all tests
  afterAll(async () => {
    await db.query("DELETE FROM users WHERE email LIKE 'test%@example.com'");
    await db.pool.end();
  });

  describe('POST /api/auth/register - Integration', () => {
    test('should create user in database', async () => {
      const userData = {
        email: 'testintegration@example.com',
        username: 'testintegration',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);

      // Verify user was created in database
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(userData.email);
      expect(result.rows[0].username).toBe(userData.username);
      expect(result.rows[0].password_hash).toBeDefined();
      expect(result.rows[0].password_hash).not.toBe(userData.password);
    });

    test('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'testdup@example.com',
        username: 'testdup1',
        password: 'password123'
      };

      // First registration should succeed
      const response1 = await request(app)
        .post('/api/auth/register')
        .send(userData);
      expect(response1.status).toBe(201);

      // Second registration with same email should fail
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, username: 'testdup2' });
      expect(response2.status).toBe(409);
    });

    test('should prevent duplicate username registration', async () => {
      const userData = {
        email: 'testdup1@example.com',
        username: 'testdupusername',
        password: 'password123'
      };

      // First registration should succeed
      const response1 = await request(app)
        .post('/api/auth/register')
        .send(userData);
      expect(response1.status).toBe(201);

      // Second registration with same username should fail
      const response2 = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'testdup2@example.com' });
      expect(response2.status).toBe(409);
    });

    test('should generate valid JWT token that can be verified', async () => {
      const userData = {
        email: 'testjwt@example.com',
        username: 'testjwt',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      const token = response.body.data.token;

      // Verify token can be decoded
      const jwt = require('jsonwebtoken');
      const config = require('../config/app');
      const decoded = jwt.verify(token, config.jwt.secret);

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded.email).toBe(userData.email);
    });

    test('should not expose password in response', async () => {
      const userData = {
        email: 'testnopw@example.com',
        username: 'testnopw',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });
  });
});