const request = require('supertest');
const app = require('../src/server');
const cache = require('../src/utils/cache');

/**
 * Random Content Endpoint Tests
 * HER-24: Get Random Content for Home Page
 */

describe('GET /api/content/random', () => {
  let testCategoryId;

  // Setup: Get category ID before running tests
  beforeAll(async () => {
    // In a real test suite, you would:
    // 1. Set up test database
    // 2. Run migrations
    // 3. Seed categories and content
    // testCategoryId = 'some-uuid-from-seeded-data';
  });

  // Clear cache before each test
  beforeEach(() => {
    cache.clear();
  });

  describe('Random Content Per Category', () => {
    it('should get one random content item per category', async () => {
      const response = await request(app)
        .get('/api/content/random')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBeDefined();
      expect(Array.isArray(response.body.data.content)).toBe(true);
      expect(response.body.data.count).toBeDefined();
      expect(response.body.cached).toBe(false);
    });

    it('should return content with all required fields', async () => {
      const response = await request(app)
        .get('/api/content/random')
        .expect(200);

      const content = response.body.data.content;
      if (content.length > 0) {
        expect(content[0]).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          category_name: expect.any(String),
          category_slug: expect.any(String),
          category_icon: expect.any(String),
          username: expect.any(String),
          view_count: expect.any(Number),
          likes: expect.any(Number)
        });
      }
    });

    it('should return different categories', async () => {
      const response = await request(app)
        .get('/api/content/random')
        .expect(200);

      const content = response.body.data.content;
      if (content.length > 1) {
        // Check that we have content from different categories
        const categoryIds = content.map(c => c.category_id);
        const uniqueCategories = new Set(categoryIds);
        expect(uniqueCategories.size).toBeGreaterThan(1);
      }
    });
  });

  describe('Random Content by Category', () => {
    it('should get one random content item from specific category', async () => {
      // Skip if we don't have test data setup
      if (!testCategoryId) return;

      const response = await request(app)
        .get('/api/content/random')
        .query({ category_id: testCategoryId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.content).toBeDefined();
      expect(response.body.data.content.category_id).toBe(testCategoryId);
    });

    it('should return 404 for non-existent category', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get('/api/content/random')
        .query({ category_id: nonExistentId })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should return 404 if category has no content', async () => {
      // This test would require a category with no content
      // Skip if we don't have test data setup
    });

    it('should include category info in response', async () => {
      if (!testCategoryId) return;

      const response = await request(app)
        .get('/api/content/random')
        .query({ category_id: testCategoryId })
        .expect(200);

      expect(response.body.data.category).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        slug: expect.any(String),
        icon: expect.any(String)
      });
    });
  });

  describe('Caching', () => {
    it('should cache results for 5 minutes', async () => {
      // First request - should not be cached
      const response1 = await request(app)
        .get('/api/content/random')
        .expect(200);

      expect(response1.body.cached).toBe(false);

      // Second request - should be cached
      const response2 = await request(app)
        .get('/api/content/random')
        .expect(200);

      expect(response2.body.cached).toBe(true);
      expect(response2.body.data).toEqual(response1.body.data);
    });

    it('should have separate cache for each category', async () => {
      if (!testCategoryId) return;

      // Request for all categories
      const response1 = await request(app)
        .get('/api/content/random')
        .expect(200);

      // Request for specific category
      const response2 = await request(app)
        .get('/api/content/random')
        .query({ category_id: testCategoryId })
        .expect(200);

      // Both should not be cached (different cache keys)
      expect(response1.body.cached).toBe(false);
      expect(response2.body.cached).toBe(false);
    });

    it('should cache by status', async () => {
      // Request published content
      const response1 = await request(app)
        .get('/api/content/random')
        .query({ status: 'published' })
        .expect(200);

      expect(response1.body.cached).toBe(false);

      // Request published again - should be cached
      const response2 = await request(app)
        .get('/api/content/random')
        .query({ status: 'published' })
        .expect(200);

      expect(response2.body.cached).toBe(true);
    });
  });

  describe('Status Filtering', () => {
    it('should only return published content by default', async () => {
      const response = await request(app)
        .get('/api/content/random')
        .expect(200);

      const content = response.body.data.content;
      content.forEach(item => {
        expect(item.status).toBe('published');
      });
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/content/random')
        .query({ status: 'draft' })
        .expect(200);

      // Should return drafts if any exist
      // This would require test data with draft content
    });
  });

  describe('Randomness', () => {
    it('should return different content on different requests (without cache)', async () => {
      // Clear cache to ensure fresh requests
      cache.clear();

      const response1 = await request(app)
        .get('/api/content/random')
        .expect(200);

      // Clear cache again
      cache.clear();

      const response2 = await request(app)
        .get('/api/content/random')
        .expect(200);

      // With multiple content items, results might differ
      // This is probabilistic, so we can't guarantee difference
      // But both should be successful
      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 if no content exists', async () => {
      // This test would require an empty database
      // Skip in current implementation
    });

    it('should handle invalid category_id gracefully', async () => {
      const response = await request(app)
        .get('/api/content/random')
        .query({ category_id: 'invalid-uuid' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

/**
 * Cache Utility Tests
 */
describe('Cache Utility', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('should set and get values', () => {
    cache.set('test-key', { data: 'test' }, 1000);
    const value = cache.get('test-key');
    expect(value).toEqual({ data: 'test' });
  });

  it('should return null for expired values', (done) => {
    cache.set('test-key', { data: 'test' }, 100); // 100ms TTL

    setTimeout(() => {
      const value = cache.get('test-key');
      expect(value).toBeNull();
      done();
    }, 150);
  });

  it('should delete values', () => {
    cache.set('test-key', { data: 'test' }, 1000);
    cache.delete('test-key');
    const value = cache.get('test-key');
    expect(value).toBeNull();
  });

  it('should clear all values', () => {
    cache.set('key1', 'value1', 1000);
    cache.set('key2', 'value2', 1000);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should check if key exists', () => {
    cache.set('test-key', { data: 'test' }, 1000);
    expect(cache.has('test-key')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });
});

/**
 * Note: These are placeholder tests to demonstrate the structure.
 * To run these tests properly, you would need to:
 * 1. Set up test database
 * 2. Run migrations
 * 3. Seed categories and content
 * 4. Implement proper test data setup and teardown
 * 5. Mock cache for deterministic testing
 */
