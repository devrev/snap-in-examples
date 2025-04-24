module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    "**/*": {
      branches: 60
    }
  },
  coverageReporters: ['text'],
  preset: 'ts-jest',
  testEnvironment: 'node'
};
