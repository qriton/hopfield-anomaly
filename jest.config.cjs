module.exports = {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/test/**/*.test.js',
    '**/__tests__/**/*.js'
  ]
};