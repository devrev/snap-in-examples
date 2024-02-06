module.exports = {
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Makes ESLint and Prettier play nicely together
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  ignorePatterns: ['**/dist/*'],
  overrides: [
    {
      files: ['**/*.test.ts'],
      rules: {
        'simple-import-sort/imports': 'off', // for test files we would want to load the mocked up modules later so on sorting the mocking mechanism will not work
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  plugins: ['prettier', 'unused-imports', 'import', 'simple-import-sort', 'sort-keys-fix'],
  root: true,
  rules: {
    'import/first': 'error',
    // Removes unused imports automatically,
'@typescript-eslint/no-explicit-any': 'warn', 
    
// Ensures all imports are at the top of the file
'import/newline-after-import': 'error', 
    // Ensures there’s a newline after the imports
    'import/no-duplicates': 'error',
    // Merges import statements from the same file
    'import/order': 'off',
    // Not compatible with simple-import-sort
    'no-unused-vars': 'off',
    // Handled by @typescript-eslint/no-unused-vars
    'simple-import-sort/exports': 'error',
    // Auto-formats exports
    'simple-import-sort/imports': 'error',
    // Auto-formats imports
    'sort-imports': 'off',
    // Not compatible with simple-import-sort
    'sort-keys-fix/sort-keys-fix': ['error', 'asc', { natural: true }],
    // Sorts long object key lists alphabetically
    'unused-imports/no-unused-imports': 'error', // Allows any type with a warning
  },
};
