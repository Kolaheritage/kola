const request = require('supertest');
const app = require('../server');
const User = require('../models/User.model');
const { generateToken } = require('../utils/jwt');

/**
 * Profile Controller Tests
 * HER-16: User Profile Endpoint
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

describe('Profile Controller', () => {
  // Mock user data
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    bio: 'Test bio',
    avatar_url: 'https://example.com/avatar.jpg',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };

  let authToken;

  beforeAll(() => {
    // Generate a valid token for testing
    authToken = generateToken({
      id: mockUser.id,
      email: mockUser.email
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('should successfully get user profile with valid token', async () => {
      // Mock User.findById to return the mock user
      User.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(mockUser.id);
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.body.data.user.username).toBe(mockUser.username);
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN_PROVIDED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 404 if user not found', async () => {
      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should successfully update username', async () => {
      const updatedUser = {
        ...mockUser,
        username: 'newusername',
        updated_at: new Date()
      };

      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newusername'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.username).toBe('newusername');
      expect(User.update).toHaveBeenCalledWith(
        mockUser.id,
        { username: 'newusername' }
      );
    });

    it('should successfully update bio', async () => {
      const updatedUser = {
        ...mockUser,
        bio: 'Updated bio',
        updated_at: new Date()
      };

      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'Updated bio'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.bio).toBe('Updated bio');
      expect(User.update).toHaveBeenCalledWith(
        mockUser.id,
        { bio: 'Updated bio' }
      );
    });

    it('should successfully update avatar_url', async () => {
      const updatedUser = {
        ...mockUser,
        avatar_url: 'https://example.com/new-avatar.jpg',
        updated_at: new Date()
      };

      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          avatar_url: 'https://example.com/new-avatar.jpg'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.avatar_url).toBe('https://example.com/new-avatar.jpg');
      expect(User.update).toHaveBeenCalledWith(
        mockUser.id,
        { avatar_url: 'https://example.com/new-avatar.jpg' }
      );
    });

    it('should successfully update multiple fields at once', async () => {
      const updatedUser = {
        ...mockUser,
        username: 'newusername',
        bio: 'New bio',
        avatar_url: 'https://example.com/new-avatar.jpg',
        updated_at: new Date()
      };

      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newusername',
          bio: 'New bio',
          avatar_url: 'https://example.com/new-avatar.jpg'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('newusername');
      expect(response.body.data.user.bio).toBe('New bio');
      expect(response.body.data.user.avatar_url).toBe('https://example.com/new-avatar.jpg');
    });

    it('should return 400 when trying to update email', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Validation failed');
    });

    it('should return 400 for invalid username (too short)', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'ab'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid username (too long)', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'a'.repeat(31)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid username (special characters)', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'user@name!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for bio exceeding max length', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: 'a'.repeat(501)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid avatar_url', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          avatar_url: 'not-a-valid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when no fields are provided', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_UPDATE_FIELDS');
    });

    it('should return 409 when username is already taken', async () => {
      // Mock User.update to throw a unique constraint error
      const duplicateError = new Error('Duplicate key value');
      duplicateError.code = '23505';
      User.update.mockRejectedValue(duplicateError);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'existinguser'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('should return 404 if user not found', async () => {
      User.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newusername'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({
          username: 'newusername'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN_PROVIDED');
    });

    it('should allow updating bio to empty string', async () => {
      const updatedUser = {
        ...mockUser,
        bio: '',
        updated_at: new Date()
      };

      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: ''
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.bio).toBe('');
    });

    it('should trim whitespace from username', async () => {
      const updatedUser = {
        ...mockUser,
        username: 'newusername',
        updated_at: new Date()
      };

      User.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: '  newusername  '
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // The validator should trim the value
      expect(User.update).toHaveBeenCalledWith(
        mockUser.id,
        { username: 'newusername' }
      );
    });
  });
});
