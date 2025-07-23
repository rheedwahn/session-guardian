module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/unit/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'background.js',
    'content.js',
    'popup.js',
    '!node_modules/**',
    '!tests/**',
    '!scripts/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testTimeout: 10000,
  verbose: true
};
