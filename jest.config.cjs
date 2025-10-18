module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testMatch: ['**/test/**/*.test.js'],
  coverageThreshold: {
    global: {
      lines: 50,
      functions: 50
    }
  }
};