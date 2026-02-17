
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  testMatch: ['**/src/**/*.test.ts'],
 
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  modulePathIgnorePatterns: ['/dist/', '/build/'],
};

