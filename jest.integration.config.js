module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.js',
    '<rootDir>/tests/integration/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'background.js',
    'content.js',
    'popup.js',
    '!node_modules/**',
    '!tests/**',
    '!scripts/**'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1 // Run integration tests sequentially
};
