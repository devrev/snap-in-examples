module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    "**/*": {
      branches: 60
    }
  },
  coverageReporters: [ 'text' ]
};
