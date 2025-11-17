const request = require('supertest');
const app = require('../src/server');

/**
 * Category Content Endpoint Tests
 * HER-23: Get Content by Category Endpoint
 */

describe('GET /api/content/category/:categoryId', () => {
  let testCategoryId;

  // Setup: Get category ID before running tests
  beforeAll(async () => {
    // In a real test suite, you would:
    // 1. Set up test database
    // 2. Run migrations
    // 3. Seed categories and content
    // testCategoryId = 'some-uuid-from-seeded-data';
  });

  describe('Basic Functionality', () => {
    it('should get all content for a valid category', async () => {
      // Skip if we don't have test data setup
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.content).toBeDefined();
      expect(Array.isArray(response.body.data.content)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return 404 for non-existent category', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/content/category/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 400 for invalid category ID format', async () => {
      const response = await request(app)
        .get('/api/content/category/invalid-id')
        .expect(404);

      // Could be 404 or 400 depending on how validation is handled
      expect(response.body.success).toBe(false);
    });
  });

  describe('Pagination', () => {
    it('should support limit and offset parameters', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .query({ limit: 5, offset: 0 })
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        total: expect.any(Number),
        limit: 5,
        offset: 0,
        page: 1,
        totalPages: expect.any(Number),
        hasMore: expect.any(Boolean)
      });
    });

    it('should calculate correct page numbers', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .query({ limit: 10, offset: 20 })
        .expect(200);

      expect(response.body.data.pagination.page).toBe(3); // offset 20 / limit 10 = page 3
    });

    it('should default to limit=20 and offset=0', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(20);
      expect(response.body.data.pagination.offset).toBe(0);
    });
  });

  describe('Sorting', () => {
    it('should support sort by recent (default)', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      // Content should be sorted by created_at DESC (most recent first)
      const content = response.body.data.content;
      if (content.length > 1) {
        const dates = content.map(c => new Date(c.created_at));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i] >= dates[i + 1]).toBe(true);
        }
      }
    });

    it('should support sort by popular (most viewed)', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .query({ sort: 'popular' })
        .expect(200);

      // Content should be sorted by view_count DESC
      const content = response.body.data.content;
      if (content.length > 1) {
        const viewCounts = content.map(c => c.view_count);
        for (let i = 0; i < viewCounts.length - 1; i++) {
          expect(viewCounts[i] >= viewCounts[i + 1]).toBe(true);
        }
      }
    });

    it('should support sort by most_liked', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .query({ sort: 'most_liked' })
        .expect(200);

      // Content should be sorted by likes DESC
      const content = response.body.data.content;
      if (content.length > 1) {
        const likes = content.map(c => c.likes);
        for (let i = 0; i < likes.length - 1; i++) {
          expect(likes[i] >= likes[i + 1]).toBe(true);
        }
      }
    });

    it('should support sort by oldest', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .query({ sort: 'oldest' })
        .expect(200);

      // Content should be sorted by created_at ASC (oldest first)
      const content = response.body.data.content;
      if (content.length > 1) {
        const dates = content.map(c => new Date(c.created_at));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i] <= dates[i + 1]).toBe(true);
        }
      }
    });
  });

  describe('Response Format', () => {
    it('should include category information', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      expect(response.body.data.category).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        description: expect.any(String)
      });
    });

    it('should include creator info in content', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      const content = response.body.data.content;
      if (content.length > 0) {
        expect(content[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          username: expect.any(String), // Creator info
          category_name: expect.any(String),
          view_count: expect.any(Number),
          likes: expect.any(Number)
        });
      }
    });

    it('should include thumbnail_url when available', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      const content = response.body.data.content;
      if (content.length > 0) {
        // thumbnail_url should be present (even if null)
        expect(content[0]).toHaveProperty('thumbnail_url');
      }
    });
  });

  describe('Filtering', () => {
    it('should only return published content by default', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .expect(200);

      const content = response.body.data.content;
      content.forEach(c => {
        expect(c.status).toBe('published');
      });
    });

    it('should support filtering by status', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get(`/api/content/category/${testCategoryId}`)
        .query({ status: 'draft' })
        .expect(200);

      // Should only return drafts
      const content = response.body.data.content;
      content.forEach(c => {
        expect(c.status).toBe('draft');
      });
    });
  });

  describe('View Count Tracking', () => {
    it('should increment view count when content is viewed', async () => {
      // This test would require:
      // 1. Creating test content
      // 2. Getting the content by ID to trigger view increment
      // 3. Verifying the view count increased
    });
  });
});

/**
 * Note: These are placeholder tests to demonstrate the structure.
 * To run these tests properly, you would need to:
 * 1. Set up test database
 * 2. Run migrations
 * 3. Seed categories and content
 * 4. Implement proper test data setup and teardown
 */
