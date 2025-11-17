const request = require('supertest');
const app = require('../src/server');

/**
 * Content Endpoint Tests
 * HER-22: Create Content Endpoint
 */

describe('POST /api/content', () => {
  let authToken;
  let testUserId;
  let testCategoryId;

  // Mock data for testing
  const validContentData = {
    title: 'My First Cultural Dance',
    description: 'A traditional dance from my heritage',
    category_id: null, // Will be set in beforeAll
    media_url: '/uploads/videos/dance-123456789.mp4',
    thumbnail_url: '/uploads/thumbnails/thumb-dance-123456789.jpg',
    tags: ['dance', 'traditional', 'cultural'],
    status: 'published'
  };

  // Setup: Get auth token and category ID before running tests
  beforeAll(async () => {
    // In a real test suite, you would:
    // 1. Set up test database
    // 2. Run migrations
    // 3. Seed test data (categories, test user)
    // 4. Login and get auth token
    // testCategoryId = 'some-uuid-from-seeded-data';
    // authToken = 'test-jwt-token';
  });

  describe('Authentication', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .post('/api/content')
        .send(validContentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN_PROVIDED');
    });

    it('should return 401 if token is invalid', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Authorization', 'Bearer invalid-token')
        .send(validContentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should return 400 if title is missing', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData };
      delete invalidData.title;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if title is too short', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData, title: 'ab' };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if title is too long', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData, title: 'a'.repeat(201) };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if category_id is missing', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData };
      delete invalidData.category_id;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if category_id is not a valid UUID', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData, category_id: 'invalid-uuid' };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if tags is not an array', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData, tags: 'not-an-array' };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if status is invalid', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = { ...validContentData, status: 'invalid-status' };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Content Creation', () => {
    it('should create content with all fields', async () => {
      // Skip if we don't have auth setup
      if (!authToken || !testCategoryId) return;

      const contentData = { ...validContentData, category_id: testCategoryId };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Content created successfully');
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.content.id).toBeDefined();
      expect(response.body.data.content.title).toBe(contentData.title);
      expect(response.body.data.content.description).toBe(contentData.description);
      expect(response.body.data.content.category_id).toBe(contentData.category_id);
      expect(response.body.data.content.user_id).toBe(testUserId);
      expect(response.body.data.content.status).toBe('published');
    });

    it('should create content with minimal required fields', async () => {
      // Skip if we don't have auth setup
      if (!authToken || !testCategoryId) return;

      const minimalData = {
        title: 'Minimal Content',
        category_id: testCategoryId
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content.title).toBe(minimalData.title);
      expect(response.body.data.content.status).toBe('published'); // Default status
    });

    it('should create content and link it to authenticated user', async () => {
      // Skip if we don't have auth setup
      if (!authToken || !testCategoryId) return;

      const contentData = { ...validContentData, category_id: testCategoryId };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData)
        .expect(201);

      expect(response.body.data.content.user_id).toBe(testUserId);
      expect(response.body.data.content.username).toBeDefined();
    });

    it('should return 404 if category does not exist', async () => {
      // Skip if we don't have auth setup
      if (!authToken) return;

      const invalidData = {
        ...validContentData,
        category_id: '00000000-0000-0000-0000-000000000000' // Non-existent UUID
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('Response Format', () => {
    it('should return created content with all expected fields', async () => {
      // Skip if we don't have auth setup
      if (!authToken || !testCategoryId) return;

      const contentData = { ...validContentData, category_id: testCategoryId };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contentData)
        .expect(201);

      expect(response.body.data.content).toMatchObject({
        id: expect.any(String),
        title: contentData.title,
        description: contentData.description,
        category_id: contentData.category_id,
        user_id: expect.any(String),
        media_url: contentData.media_url,
        thumbnail_url: contentData.thumbnail_url,
        tags: contentData.tags,
        status: contentData.status,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        username: expect.any(String),
        category_name: expect.any(String),
        category_slug: expect.any(String)
      });
    });
  });
});

describe('GET /api/content', () => {
  it('should get all published content', async () => {
    const response = await request(app)
      .get('/api/content')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBeDefined();
    expect(Array.isArray(response.body.data.content)).toBe(true);
  });

  it('should support pagination', async () => {
    const response = await request(app)
      .get('/api/content?limit=5&offset=0')
      .expect(200);

    expect(response.body.data.pagination).toBeDefined();
    expect(response.body.data.pagination.total).toBeDefined();
    expect(response.body.data.pagination.limit).toBe(5);
  });

  it('should filter by category', async () => {
    // Test would require seeded data
  });

  it('should filter by user', async () => {
    // Test would require seeded data
  });
});

describe('GET /api/content/:id', () => {
  it('should get content by ID', async () => {
    // Test would require seeded content
  });

  it('should return 404 for non-existent content', async () => {
    const response = await request(app)
      .get('/api/content/00000000-0000-0000-0000-000000000000')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('CONTENT_NOT_FOUND');
  });
});

describe('PUT /api/content/:id', () => {
  it('should update own content', async () => {
    // Test would require auth and seeded content
  });

  it('should not update other user\'s content', async () => {
    // Test would require auth and seeded content
  });

  it('should return 404 for non-existent content', async () => {
    // Test would require auth
  });
});

describe('DELETE /api/content/:id', () => {
  it('should delete own content', async () => {
    // Test would require auth and seeded content
  });

  it('should not delete other user\'s content', async () => {
    // Test would require auth and seeded content
  });
});

describe('GET /api/content/me', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/content/me')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should get current user\'s content', async () => {
    // Test would require auth and seeded content
  });
});

/**
 * Note: These are placeholder tests to demonstrate the structure.
 * To run these tests properly, you would need to:
 * 1. Set up test database
 * 2. Run migrations
 * 3. Seed categories and test users
 * 4. Implement authentication in tests
 * 5. Clean up test data after each test
 */
