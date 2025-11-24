/**
 * Jest Test Setup
 * Sets up environment variables and test configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '5000';

// Only set DB credentials if DATABASE_URL is not already set (for CI compatibility)
if (!process.env.DATABASE_URL) {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5433';
  process.env.DB_NAME = 'heritage_db_test';
  process.env.DB_USER = 'heritage_user';
  process.env.DB_PASSWORD = 'heritage_password';
}

// Mock sharp module for test environments where it may not be available
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
    metadata: jest.fn().mockResolvedValue({ width: 100, height: 100, format: 'jpeg' }),
  }));
  return mockSharp;
});

// Global test utilities can be added here
