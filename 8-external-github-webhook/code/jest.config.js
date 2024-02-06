module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text'],
  coverageThreshold: {
    '**/*': {
      branches: 60,
    },
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
};
