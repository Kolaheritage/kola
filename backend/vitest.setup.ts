import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup runs before all tests
beforeAll(() => {
  // Load environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.PORT = '0'; // Use random available port for tests
});

// Cleanup after all tests
afterAll(() => {
  // Clean up any test resources
});

// Reset mocks after each test
afterEach(() => {
  // Clear all mocks after each test
});
