module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off', // Use TypeScript version instead
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-namespace': 'warn',
    'no-case-declarations': 'warn',
    '@typescript-eslint/no-unsafe-declaration-merging': 'warn'
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    'coverage/**',
    'build/**',
    '*.config.js',
    '*.config.cjs',
    '*.config.ts',
    'setupBackendTests.js',
    'test-sanitize.js'
  ],
}; 