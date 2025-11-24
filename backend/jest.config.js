/**
 * Jest Configuration
 * HER-11: User Login Backend
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/server.js', // Exclude server entry point
    '!src/utils/migrate.js', // Exclude migration script
    '!src/utils/seed.js', // Exclude seed script
  ],

  // Coverage thresholds (optional)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Test match patterns - only run tests in src/__tests__
  testMatch: [
    '**/src/__tests__/**/*.test.js'
  ],

  // Ignore tests in other directories to avoid conflicts
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Run tests serially to avoid port conflicts
  maxWorkers: 1,

  // Force exit after tests complete (handles open handles)
  forceExit: true,

  // Detect open handles for debugging
  detectOpenHandles: false,
};
